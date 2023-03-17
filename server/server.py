from flask import Flask, request, Request, Response, jsonify
from dorna2 import Dorna
from helper import *
import networkx as nx
import socket
import json
from typing import Optional, Any, Tuple, Union
from enum import Enum

import matplotlib.pyplot as plt

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

    if minimum > 50**2:
        return None
    else:
        return closest


def main(file):
    hostname = socket.gethostname()

    g:nx.Graph = createGraph(hostname, "../graph.json")

    with open(file) as json_file:
        arg:dict = json.load(json_file)

    r = Dorna()
    r.connect(arg[hostname], arg["port"])

    print("turning motor on ..")
    if r.get_motor() == 0:
        status = r.set_motor(1)

    # Import previous calibration
    filename = "calibration.json"
    with open(filename, "r") as file:
        data = json.load(file)

    updated_nodes = []

    for node in list(g.nodes):
        if data.get(node):
            new = data[node][-1]
            g.nodes[node]["coordinates"] = new
            updated_nodes.append(node)

    print("Updated nodes " + ", ".join(updated_nodes) + "!")
    print("Ready for input")

    @app.get("/move")
    def move()->Tuple[Union[str,Response],int]:
        source = request.args.get("source")
        target = request.args.get("target")

        print(f"moving from {source} to {target} ..")
        
        if target not in g:
            print("400 - Target not found")
            return "Target not found", 400
            
        if not source:
            source = closestNode(r, g)
            if source is None:
                return "Too far from node", 400
            else:
                if goToNode(r, g, source)!=NodeMoveResult.SUCCESS:
                    return "failed to move to node", 

        path = nx.shortest_path(g, source=source, target=target)
        print(f"shortest path from {source} to {target} is: {path}")
        for node in path:
            if goToNode(r, g, node)!=NodeMoveResult.SUCCESS:
                return "failed to move to node", HTTP_STATUS.INTERNAL_SERVER_ERROR

        response = jsonify("Moved through nodes " + str(path))
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, HTTP_STATUS.OK

    @app.get("/pickup")
    def pickup()->Tuple[Response,int]:
        prepare(r)
        status = r.jmove(rel=1, z=-20)
        grip(r)
        status = r.jmove(rel=1, z=20)
        response = jsonify("Picked up plate ", str(status))
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, HTTP_STATUS.OK

    @app.get("/place")
    def place()->Tuple[Response,int]:
        status = r.jmove(rel=1, z=-20)
        release(r)
        status = r.jmove(rel=1, z=20)
        prepare(r)
        response = jsonify("Placed down plate ", str(status))
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, HTTP_STATUS.OK

    @app.get("/testcalibration")
    def testcalibration()->Tuple[Response,int]:
        prepare(r)
        status = r.jmove(rel=1, z=-10)
        r.sleep(3)
        status = r.jmove(rel=1, z=10)
        response = jsonify("Calibration test", str(status))
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, HTTP_STATUS.OK

    @app.get("/halt")
    def halt():
        status = r.halt()
        print(f"/halt - {status=}")
        response = jsonify(f"Robot stopped: {str(status)}")
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, HTTP_STATUS.OK

    @app.get("/poweroff")
    def poweroff()->Tuple[str,int]:
        target = "safe"
        source = closestNode(r, g)
        if source is None:
            return "Too far from node", 400
        else:
            if goToNode(r, g, source)!=NodeMoveResult.SUCCESS:
                return "failed to move to node", HTTP_STATUS.INTERNAL_SERVER_ERROR

        path = nx.shortest_path(g, source=source, target=target)
        print(f"shortest path from {source} to {target} is: {path}")
        for node in path:
            if goToNode(r, g, node)!=NodeMoveResult.SUCCESS:
                return "failed to move to node", HTTP_STATUS.INTERNAL_SERVER_ERROR

        r.set_motor(0)
        r.close()
        return "Robot turned off!", 200

    @app.get("/save")
    def save()->Tuple[str,int]:
        node = request.args.get("node")
        if not node:
            return "No node specified for calibration...\n", 400
        x, y, z, a, b, *_ = r.get_all_pose()
        coordinates = [x, y, z, a, b]

        filename = "calibration.json"

        with open(filename, "r+") as file:
            try:
                data = json.load(file)
            except:
                data = {}
        
        if not data.get(node):
            data[node] = []
        data[node].append(coordinates)

        with open(filename, 'w') as file:
            json.dump(data, file, indent=4)

        return "Saved " + node + " successfully!", 200

    @app.get("/calibrate")
    def calibrate()->Tuple[str,int]:
        filename = "calibration.json"
        with open(filename, "a+") as file:
            file.seek(0)
            data = json.load(file)

        for node in list(g.nodes):
            print(node, g.nodes[node])
            if data.get(node):
                new = data[node][-1]
                g.nodes[node]["coordinates"] = new
                print("updated " + node)
                print(node, g.nodes[node])

        return "Read calibration file and updated coordinates", 200

    @app.get("/draw")
    def draw()->Tuple[str,int]:
        try:
            nx.draw(g, with_labels=True)
            plt.show()
            plt.savefig("graph.png", format="PNG")
            plt.close()
            return 'Success', 200
        except:
            return 'Matplotlib not installed', 300

    app.run(debug=False)

if __name__ == "__main__":
    main("config.json")
