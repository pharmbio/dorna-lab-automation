from flask import Flask, request, Response, jsonify
from flask.views import MethodView

from dorna2 import Dorna
import networkx as nx
from gripperFunctions import GripperWidth

import pydantic
import socket
import json
import time
from json.decoder import JSONDecodeError
from typing import Optional, Any, Tuple, Union
from enum import Enum
from pathlib import Path

app = Flask(__name__)

class HTTP_STATUS:
    OK=200

    MULTIPLE_CHOICES=300
    MOVED_PERMANENTLY=301
    NOT_MODIFIED=304
    TEMPORARY_REDIRECT=307
    PERMANENT_REDIRECT=308

    BAD_REQUEST=400
    UNAUTHORIZED=401
    FORBIDDEN=403
    NOT_FOUND=404
    METHOD_NOT_ALLOWED=405
    REQUEST_TIMEOUT=408

    INTERNAL_SERVER_ERROR=500
    NOT_IMPLEMENTED=501
    SERVICE_UNAVAILABLE=503

def createGraph(file="graph.json")->nx.Graph:
    """
    create graph from file

    creates the graph from the edges and vertices in the file (including the coordinates)
    """

    graph = nx.Graph()
    nodes, edges = [], []

    with open(file, "r") as json_file:
        data = json.load(json_file)

        for node_name,node_coordinates in data["joint nodes"].items():
            nodes.append(tuple((node_name, {"type": "joint", "coordinates": node_coordinates})))

        for node_name,node_coordinates in data["linear nodes"].items():
            nodes.append(tuple((node_name, {"type": "linear", "coordinates": node_coordinates})))

        for node_pair_left,node_pair_right in data["edges"]:
            edges.append((node_pair_left,node_pair_right))

    graph.add_nodes_from(nodes)
    graph.add_edges_from(edges)

    return graph


class MovementType(int,Enum):
    JOINT=0,
    LINEAR=1,

class NodeMoveResult(int,Enum):
    SUCCESS=0
    FAILURE=-1

def get_movement_parameters(move_type:MovementType)->Tuple[float,float,float]:
    if move_type==MovementType.JOINT:
        vel=25
        accel=500
        jerk=2500
    elif move_type==MovementType.LINEAR:
        vel=50
        accel=1000
        jerk=5000

    parameter_file = Path("../parameters.json")

    # Attempt reading file to overwrite default values:
    if parameter_file.exists():
        with parameter_file.open("r") as parameters: data = json.load(parameters)

        if "vel" in data:
            vel = data["vel"]
        if "accel" in data:
            accel = data["accel"]
        if "jerk" in data:
            jerk = data["jerk"]
    else:
        print("No calibration file found, using default values")

    return vel,accel,jerk

class Server(MethodView):
    robot:Dorna

    graph:nx.Graph
    default_graph:nx.Graph

    dorna_ip:str
    dorna_port:int

    calibrationfile:Path

    def __init__(self):
        super().__init__()

        # connect to dorna
        config_path = "../config.json"

        with open(config_path) as json_file:
            arg = json.load(json_file)
        self.hostname = socket.gethostname()
        if not self.hostname in arg:
            raise ValueError(f"No ip address defined in '{config_path}' for your hostname '{self.hostname}'")

        self.dorna_ip = arg[self.hostname]
        self.dorna_port = arg["port"]

        print("Establishing connection to Dorna ...")
        self.robot = Dorna()
        if not self.robot.connect(self.dorna_ip, self.dorna_port):
            print("Dorna connection NOT established! GUI may or may not work.")
        else:
            print("Dorna connection was established!")

        # create graph for valid movements
        self.graph = createGraph("../graph.json")
        self.default_graph = self.graph.copy()

        print("Dorna control box is " + ("connected" if self.robot._connected else "NOT connected"))

        # import local node position calibration
        self.calibrationfile = Path("../calibration.json")
        if not self.calibrationfile.exists():
            with self.calibrationfile.open("w+") as f: json.dump({},f)

        calibration_data = json.load(self.calibrationfile.open("r"))
        
        updated_nodes = []

        for node in list(self.graph.nodes):
            if calibration_data.get(node):
                new = calibration_data[node][-1]
                self.graph.nodes[node]["coordinates"] = new
                updated_nodes.append(node)

        if len(updated_nodes)>0:
            print("found calibration data for nodes: " + ", ".join(updated_nodes))
        else:
            print("no node calibration data present")

    # use server as context manager to explicitely close connection to dorna on exit

    def __enter__(self)->"Self":
        return self

    def __exit__(self,exc_type,exc_val,exc_tb):
        self.robot.close()

    # boilerplate code for nicer function signatures and argument verification

    def dispatch_request(self,method_name,*args,**kwargs):
        method=getattr(self,method_name,None)
        if method is not None and callable(method):
            ret_val=method(**request.args)
            return ret_val
            
        return f"Path '{method_name}' not handled", 404

    # functions below are for internal stuff

    def move_to_node(self,node:Any)->NodeMoveResult:
        """
        perform move to node in calibrated graph
        """

        graph_node=self.graph.nodes[node]

        vel,accel,jerk=get_movement_parameters(graph_node["type"])

        if graph_node["type"] == "joint":
            j0, j1, j2, j3, j4 = graph_node["coordinates"]
            self.robot.jmove(
                    rel=0, 
                    j0=j0, j1=j1, j2=j2, j3=j3, j4=j4, 
                    vel=vel, accel=accel, jerk=jerk
            )
            return NodeMoveResult.SUCCESS

        elif graph_node["type"] == "linear":
            x, y, z, a, b = graph_node["coordinates"]
            self.robot.jmove(
                    rel=0, 
                    x=x, y=y, z=z, a=a, b=b,
                    vel=vel, accel=accel, jerk=jerk
            )
            return NodeMoveResult.SUCCESS

        else:
            print(f"Requested move to invalid node ({graph_node})")
            return NodeMoveResult.FAILURE


    def get_currently_closest_node(self,graph:Optional[nx.Graph]=None)->Optional[Any]:
        """
        get node closes to current gripper position in given graph

        default graph for lookup is calibrated graph
        """
        closest = None
        minimum = float("inf")
        j0, j1, j2, *_ = self.robot.get_all_joint()
        x, y, z, *_ = self.robot.get_all_pose()
        for node_name in self.graph:
            node=self.graph.nodes[node_name]

            if node["type"] == "joint":
                i0, i1, i2, *_ = node["coordinates"]
                distance = (i0-j0)**2 + (i1-j1)**2 + (i2-j2)**2
                if distance < minimum:
                    minimum = distance
                    closest = node_name

            elif node["type"] == "linear":
                u, v, w, *_ = node["coordinates"]
                distance = (u-x)**2 + (v-y)**2 + (w-z)**2
                if distance < minimum:
                    minimum = distance
                    closest = node_name

        if minimum > 50**2: # If distance is larger than 50mm, return None
            return None
        else:
            return closest
    
    # functions below are for routing

    def get_dorna_ip(self)->Tuple[Response,int]:
        print("Sending dorna IP address: " + self.dorna_ip)
        return jsonify(ip=self.dorna_ip, connected=self.robot._connected), HTTP_STATUS.OK

    def move(self,target:str,source:Optional[str]=None)->Tuple[Response,int]:
        # No or faulty target
        if target not in self.graph:
            return jsonify("No or faulty target selected"), HTTP_STATUS.BAD_REQUEST

        if not self.robot._connected:
            return jsonify("No connection to Dorna control box"), HTTP_STATUS.INTERNAL_SERVER_ERROR

        if not self.robot.get_motor():
            return jsonify("Motors are not turned on"), HTTP_STATUS.BAD_REQUEST

        # If no source node provided, find closest one
        if not source:
            source = self.get_currently_closest_node()
            if source is None:
                return jsonify("Too far from node to perform safe move"), HTTP_STATUS.BAD_REQUEST

        # Calculate shortest path through graph
        path = nx.shortest_path(self.graph, source=source, target=target)
        print(f"Shortest path from {source} to {target} is: {path}")

        # Go through each node in the calculated path
        for node in path:
            if self.move_to_node(node) != NodeMoveResult.SUCCESS:
                return jsonify("Failed to move to node."), HTTP_STATUS.INTERNAL_SERVER_ERROR

        return jsonify("Moved through nodes " + str(path)), HTTP_STATUS.OK


    def pickup(self)->Tuple[Response,int]:
        GripperWidth.prepare(self.robot)
        status = self.robot.jmove(rel=1, z=-20)
        GripperWidth.grip(self.robot)
        status = self.robot.jmove(rel=1, z=20)
        response = jsonify("Picked up plate ", str(status))
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, HTTP_STATUS.OK


    def place(self)->Tuple[Response,int]:
        status = self.robot.jmove(rel=1, z=-20)
        GripperWidth.release(self.robot)
        status = self.robot.jmove(rel=1, z=20)
        GripperWidth.prepare(self.robot)
        response = jsonify("Placed down plate ", str(status))
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, HTTP_STATUS.OK


    def save(self,node:str)->Tuple[Response,int]:
        if node is None:
            return jsonify("No node specified for calibration..."), HTTP_STATUS.BAD_REQUEST
        if node not in self.graph:
            return jsonify("Specified Node does not exist"), HTTP_STATUS.BAD_REQUEST

        try:
            x, y, z, a, b, *_ = self.robot.get_all_pose()
        except KeyError as e:
            raise RuntimeError(f"robot probably not turned on. found this exception {e}")

        coordinates = [x, y, z, a, b]

        closest = self.get_currently_closest_node(graph=self.default_graph)
        if node != closest:
            return jsonify(f"Too far from {node} to perform calibration, closest is {closest}"), HTTP_STATUS.BAD_REQUEST

        with self.calibrationfile.open("r") as file:
            try:
                data = json.load(file)
            except JSONDecodeError:
                print(JSONDecodeError)
                data = {}

            #If node calibration is new
            if not data.get(node): 
                data[node] = []
                data[node].append(coordinates)
            #If coordinates are new
            if data[node][-1] != coordinates: 
                data[node].append(coordinates)

            #Update current graph with new position
            self.graph.nodes[node]["coordinates"] = coordinates
            print(coordinates)

        with self.calibrationfile.open("w") as outfile:
            json.dump(data, outfile, indent=4)

        return jsonify("Updated " + node + " successfully: " + str(coordinates)), HTTP_STATUS.OK


    def reset(self,node:str)->Tuple[Response,int]:
        node_name=node
        print(f"resetting calibration for node{node_name}")

        with self.calibrationfile.open("r") as file:
            try:
                data = json.load(file)
            except JSONDecodeError:
                print(JSONDecodeError)
                data = {}

            #If node is not new
            if data.get(node_name): 
                del data[node_name]
                print(f"Removed {node_name} from calibration.json")
            else:
                return jsonify("Node " + node_name + " already at default"), HTTP_STATUS.OK

        #Update current graph with original position
        coordinates = self.default_graph.nodes[node_name]["coordinates"]
        self.graph.nodes[node_name]["coordinates"] = coordinates

        with self.calibrationfile.open("w") as outfile:
            json.dump(data, outfile, indent=4)

        return jsonify(f"Reset {node_name} to default coordinates"), HTTP_STATUS.OK

if __name__=="__main__":
    with Server() as server:

        @app.route("/<string:method_name>",methods=["GET","POST"])
        def handle_request(method_name):
            return server.dispatch_request(method_name)

        app.run()
