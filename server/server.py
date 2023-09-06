from flask import Flask, request, Response, jsonify
from dorna2 import Dorna
from gripperFunctions import *
import networkx as nx
import socket
import json
import time
from json.decoder import JSONDecodeError
from typing import Optional, Any, Tuple, Union
from enum import Enum

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
    NOT_IMPLEMENETED=501
    SERVICE_UNAVAILABLE=503

def createGraph(file)->nx.Graph:
    g = nx.Graph()
    n, e = [], []

    with open (file, "r") as json_file:
        data = json.load(json_file)
        jnodes = data["joint nodes"]
        lnodes = data["linear nodes"]
        edges = data["edges"]

        for i in jnodes:
            n.append(tuple((i, {"type": "joint", "coordinates": jnodes[i]})))

        for i in lnodes:
            n.append(tuple((i, {"type": "linear", "coordinates": lnodes[i]})))

        for i in edges:
            e.append(i)

    g.add_nodes_from(n)
    g.add_edges_from(e)

    return g

class NodeMoveResult(int,Enum):
    SUCCESS=0
    FAILURE=-1
def goToNode(robot:Dorna, graph:nx.Graph, node:Any)->NodeMoveResult:
    default = {
            "vel": 25,
            "accel": 500,
            "jerk": 2500 
    }
    vel, accel, jerk = default["vel"], default["accel"], default["jerk"]

    calibrationfile = "../parameters.json"

    # Attempt reading file to overwrite default values:
    try:
        file = open(calibrationfile, "r")
        data = json.load(file)
        vel = data.get("vel")
        accel = data.get("accel")
        jerk = data.get("jerk")
    except FileNotFoundError:
        print("No calibration file found, using default values")
    except OSError as e:
        # Catch other errors, such as permissions etc.
        print(f"Unable to open {calibrationfile}: {e}")
    except KeyError as e:
        print(f"Parameter not set in {calibrationfile}: {e}")

    if graph.nodes[node]["type"] == "joint":
        j0, j1, j2, j3, j4 = graph.nodes[node]["coordinates"]
        robot.jmove(
                rel=0, 
                j0=j0, j1=j1, j2=j2, j3=j3, j4=j4, 
                vel=vel, accel=accel, jerk=jerk
        )
        return NodeMoveResult.SUCCESS
    elif graph.nodes[node]["type"] == "linear":
        x, y, z, a, b = graph.nodes[node]["coordinates"]
        robot.jmove(
                rel=0, 
                x=x, y=y, z=z, a=a, b=b,
                vel=vel, accel=accel, jerk=jerk
        )
        return NodeMoveResult.SUCCESS
    else:
        print("Requested move to incorrect node...")
        return NodeMoveResult.FAILURE


def closestNode(robot, graph:nx.Graph)->Optional[Any]:
    closest = None
    minimum = float("inf")
    j0, j1, j2, *_ = robot.get_all_joint()
    x, y, z, *_ = robot.get_all_pose()
    for node in graph:
        if graph.nodes[node]["type"] == "joint":
            i0, i1, i2, *_ = graph.nodes[node]["coordinates"]
            distance = (i0-j0)**2 + (i1-j1)**2 + (i2-j2)**2
            if distance < minimum:
                minimum = distance
                closest = node
        if graph.nodes[node]["type"] == "linear":
            u, v, w, *_ = graph.nodes[node]["coordinates"]
            distance = (u-x)**2 + (v-y)**2 + (w-z)**2
            if distance < minimum:
                minimum = distance
                closest = node

    if minimum > 50**2: # If distance is larger than 50mm, return None
        return None
    else:
        return closest


def main(robot):
    graphfile, calibrationfile = "../graph.json", "../calibration.json"
    g:nx.Graph = createGraph(graphfile)

    print("Dorna control box is " + ("connected" if robot._connected else "not connected"))

    # Import previous calibration
    try:
        file = open(calibrationfile, "r")
    except FileNotFoundError:
        # Create new empty calibration.json
        file = open(calibrationfile, "w+")
        json.dump({}, file)
    except OSError as e:
        # Catch other errors, such as permissions etc.
        print(f"Unable to open {calibrationfile}: {e}")
        return

    try:
        data = json.load(file)
    except JSONDecodeError:
        print("Calibration file is empty, creating new entry: ", JSONDecodeError)
        data = {}
    
    updated_nodes = []

    for node in list(g.nodes):
        if data.get(node):
            new = data[node][-1]
            g.nodes[node]["coordinates"] = new
            updated_nodes.append(node)

    if updated_nodes:
        print("Updated nodes " + ", ".join(updated_nodes) + "!")
    else:
        print("No node coordinates overwritten.")



    # ----- ROUTES -----

    @app.get("/get_dorna_ip")
    def get_dorna_ip()->Tuple[Response,int]:
        if (ip):
            print("Sending IP adress: " + ip)
            return jsonify(ip=ip, connected=robot._connected), HTTP_STATUS.OK
        else:
            print("No Dorna IP adress for this hostname")
            return jsonify("No Dorna adress"), HTTP_STATUS.NOT_FOUND

    @app.get("/connect")
    def connect()->Tuple[Response,int]:
        if not robot.connect(ip, arg["port"]):
            print("Not connected")
            main(robot)
        else:
            print("Connected")

    @app.get("/move")
    def move()->Tuple[Response,int]:
        source = request.args.get("source")
        target = request.args.get("target")
        
        # No or faulty target
        if target not in g:
            return jsonify("No or faulty target selected"), HTTP_STATUS.BAD_REQUEST

        if not robot._connected:
            return jsonify("No connection to Dorna control box"), HTTP_STATUS.INTERNAL_SERVER_ERROR

        if not robot.get_motor():
            return jsonify("Motors are not turned on"), HTTP_STATUS.BAD_REQUEST

        # If no source node provided, find closest one
        if not source:
            source = closestNode(robot, g)
            if source is None:
                return jsonify("Too far from node to perform safe move"), HTTP_STATUS.BAD_REQUEST

        # Calculate shortest path through graph
        path = nx.shortest_path(g, source=source, target=target)
        print(f"Shortest path from {source} to {target} is: {path}")

        # Go through each node in the calculated path
        for node in path:
            if goToNode(robot, g, node) != NodeMoveResult.SUCCESS:
                return jsonify("Failed to move to node."), HTTP_STATUS.INTERNAL_SERVER_ERROR

        return jsonify("Moved through nodes " + str(path)), HTTP_STATUS.OK


    @app.get("/pickup")
    def pickup()->Tuple[Response,int]:
        prepare(robot)
        status = robot.jmove(rel=1, z=-20)
        grip(robot)
        status = robot.jmove(rel=1, z=20)
        response = jsonify("Picked up plate ", str(status))
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, HTTP_STATUS.OK


    @app.get("/place")
    def place()->Tuple[Response,int]:
        status = robot.jmove(rel=1, z=-20)
        release(robot)
        status = robot.jmove(rel=1, z=20)
        prepare(robot)
        response = jsonify("Placed down plate ", str(status))
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, HTTP_STATUS.OK


    @app.get("/save")
    def save()->Tuple[Response,int]:
        node = request.args.get("node")
        if node is None:
            return jsonify("No node specified for calibration..."), HTTP_STATUS.BAD_REQUEST
        if node not in g:
            return jsonify("Specified Node does not exist"), HTTP_STATUS.BAD_REQUEST

        x, y, z, a, b, *_ = robot.get_all_pose()
        coordinates = [x, y, z, a, b]

        closest = closestNode(robot, g)
        if (node != closest):
            return jsonify(f"Too far from {node} to perform calibration, closest is {closest}"), HTTP_STATUS.BAD_REQUEST

        with open(calibrationfile, "r") as file:
            try:
                data = json.load(file)
            except JSONDecodeError:
                print(JSONDecodeError)
                data = {}

            #If node is new
            if not data.get(node): 
                data[node] = []
                data[node].append(coordinates)
            #If coordinates are new
            if data[node][-1] != coordinates: 
                data[node].append(coordinates)

            #Update current graph with new position
            g.nodes[node]["coordinates"] = coordinates
            print(coordinates)

        with open(calibrationfile, "w") as outfile:
            json.dump(data, outfile, indent=4)

        return jsonify("Updated " + node + " successfully: " + str(coordinates)), HTTP_STATUS.OK


    @app.get("/reset")
    def reset()->Tuple[Response,int]:
        node = request.args.get("node")
        print(node)
        if node is None:
            return jsonify("No node specified for reset..."), HTTP_STATUS.BAD_REQUEST

        with open(calibrationfile, "r") as file:
            try:
                data = json.load(file)
            except JSONDecodeError:
                print(JSONDecodeError)
                data = {}

            #If node is not new
            if data.get(node): 
                del data[node]
                print(f"Removed {node} from calibration.json")
            else:
                return jsonify("Node " + node + " already at default"), HTTP_STATUS.OK

        with open(calibrationfile, "w") as outfile:
            json.dump(data, outfile, indent=4)

        return jsonify("Reset " + node + " to default coordinates"), HTTP_STATUS.OK

    app.run(debug=False)

if __name__ == "__main__":
    config_path = "../config.json"

    with open(config_path) as json_file:
        arg = json.load(json_file)
    hostname = socket.gethostname()
    try:
        ip = arg[hostname]
    except:
        print(f"No ip address defined in '{config_path}' for your hostname '{hostname}'")
        exit()

    robot = Dorna()
    print("Connecting...")
    if not robot.connect(ip, arg["port"]):
        print("Not connected")
        main(robot)
    else:
        print("Connected")
        main(robot)
    robot.close()
