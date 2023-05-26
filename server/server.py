from flask import Flask, request, Response, jsonify
from dorna2 import Dorna
from helper import *
import networkx as nx
import socket
import json
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

def createGraph(hostname, file)->nx.Graph:
    g = nx.Graph()
    n, e = [], []

    with open (file, "r") as json_file:
        data = json.load(json_file)
        jnodes = data["joint nodes"]
        lnodes = data["linear nodes"][hostname]
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
    if graph.nodes[node]["type"] == "joint":
        j0, j1, j2, j3, j4 = graph.nodes[node]["coordinates"]
        robot.jmove(rel=0, j0=j0, j1=j1, j2=j2, j3=j3, j4=j4)
        return NodeMoveResult.SUCCESS
    elif graph.nodes[node]["type"] == "linear":
        x, y, z, a, b = graph.nodes[node]["coordinates"]
        robot.jmove(rel=0, x=x, y=y, z=z, a=a, b=b)
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


def main():
    configfile, graphfile, calibrationfile = "../config.json", "../graph.json", "../calibration.json"

    # Read config file, retreive hostname and create graph structure
    hostname = socket.gethostname()
    g:nx.Graph = createGraph(hostname, graphfile)
    with open(configfile) as json_file:
        arg:dict = json.load(json_file)
    ip = arg[hostname]
    port = arg["port"]


    # Establish connection with Dorna
    r = Dorna()
    def verifyDornaConnection(ip, port):
        connected = r.connect(ip, port)
        noConnectionResponse = "No connection to Dorna control box"
        return connected, noConnectionResponse

    connected, *_ = verifyDornaConnection(ip, port)
    print("Dorna is " + ("connected" if connected else "not connected"))


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
        print("Sending IP adress: " + ip)
        return jsonify(ip), HTTP_STATUS.OK


    @app.get("/start_motors")
    def start_motors()->Tuple[Response,int]:
        if r.get_motor() == 0:
            print("Powering on dorna motors")
            r.set_motor(1)
        return jsonify("Motors are: " + ("ON" if bool(r.get_motor()) else "OFF")), HTTP_STATUS.OK


    @app.get("/stop_motors")
    def stop_motors()->Tuple[Response,int]:
        if r.get_motor() == 1:
            print("Powering off dorna motors")
            r.set_motor(0)
        return jsonify("Motors are: " + ("ON" if bool(r.get_motor()) else "OFF")), HTTP_STATUS.OK


    @app.get("/move")
    def move()->Tuple[Response,int]:
        source = request.args.get("source")
        target = request.args.get("target")

        print(f"moving from {source} to {target}.")
        
        if target not in g:
            return jsonify("Target not found"), HTTP_STATUS.BAD_REQUEST
            
        if not source:
            source = closestNode(r, g)
            if source is None:
                return jsonify("Too far from node"), HTTP_STATUS.BAD_REQUEST
            else:
                if goToNode(r, g, source)!=NodeMoveResult.SUCCESS:
                    return jsonify("Failed to move to node."), HTTP_STATUS.INTERNAL_SERVER_ERROR

        path = nx.shortest_path(g, source=source, target=target)
        print(f"shortest path from {source} to {target} is: {path}")
        for node in path:
            if goToNode(r, g, node)!=NodeMoveResult.SUCCESS:
                return jsonify("Failed to move to node."), HTTP_STATUS.INTERNAL_SERVER_ERROR

        return jsonify("Moved through nodes " + str(path)), HTTP_STATUS.OK


    @app.get("/pickup")
    def pickup()->Tuple[Response,int]:
        connected, response = verifyDornaConnection(ip, port)
        if not connected:
            return jsonify(response), HTTP_STATUS.NOT_FOUND

        prepare(r)
        status = r.jmove(rel=1, z=-20)
        grip(r)
        status = r.jmove(rel=1, z=20)
        response = jsonify("Picked up plate ", str(status))
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, HTTP_STATUS.OK


    @app.get("/place")
    def place()->Tuple[Response,int]:
        connected, response = verifyDornaConnection(ip, port)
        if not connected:
            return jsonify(response), HTTP_STATUS.NOT_FOUND

        status = r.jmove(rel=1, z=-20)
        release(r)
        status = r.jmove(rel=1, z=20)
        prepare(r)
        response = jsonify("Placed down plate ", str(status))
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, HTTP_STATUS.OK


    @app.get("/testcalibration")
    def testcalibration()->Tuple[Response,int]:
        connected, response = verifyDornaConnection(ip, port)
        if not connected:
            return jsonify(response), HTTP_STATUS.NOT_FOUND

        prepare(r)
        status = r.jmove(rel=1, z=-10)
        r.sleep(3)
        status = r.jmove(rel=1, z=10)
        response = jsonify("Calibration test", str(status))
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, HTTP_STATUS.OK


    @app.get("/poweroff")
    def poweroff()->Tuple[Response,int]:
        target = "safe"
        source = closestNode(r, g)
        if source is None:
            return jsonify("Too far from node"), HTTP_STATUS.BAD_REQUEST
        else:
            if goToNode(r, g, source)!=NodeMoveResult.SUCCESS:
                return jsonify("Failed to move to node"), HTTP_STATUS.BAD_REQUEST

        path = nx.shortest_path(g, source=source, target=target)
        print(f"Shortest path from {source} to {target} is: {path}")
        for node in path:
            if goToNode(r, g, node)!=NodeMoveResult.SUCCESS:
                return jsonify("Failed to move to node"), HTTP_STATUS.BAD_REQUEST

        r.set_motor(0)
        r.close()
        return jsonify("Robot turned off!"), HTTP_STATUS.OK


    @app.get("/save")
    def save()->Tuple[Response,int]:
        node = request.args.get("node")
        if not node:
            return jsonify("No node specified for calibration..."), HTTP_STATUS.BAD_REQUEST

        # connected, response = verifyDornaConnection(ip, port)
        # if not connected:
        #     return jsonify(response), HTTP_STATUS.NOT_FOUND
        x, y, z, a, b, *_ = r.get_all_pose()
        coordinates = [x, y, z, a, b]

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


    @app.get("/calibrate")
    def calibrate()->Tuple[Response,int]:
        with open(calibrationfile, "r") as file:
            try:
                data = json.load(file)
            except JSONDecodeError:
                print(JSONDecodeError)
                data = {}

        for node in list(g.nodes):
            print(node, g.nodes[node])
            if data.get(node):
                new = data[node][-1]
                g.nodes[node]["coordinates"] = new
                print("updated " + node)
                # print(node, g.nodes[node])

        return jsonify("Read calibration file and updated coordinates"), HTTP_STATUS.OK


    app.run(debug=False)

if __name__ == "__main__":
    main()
