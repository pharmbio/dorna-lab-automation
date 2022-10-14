from flask import Flask, request, jsonify
from dorna2 import Dorna
from helper import *
import networkx as nx
import socket
import json

app = Flask(__name__)

def createGraph(file):
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


def goToNode(robot, graph, node):
    if graph.nodes[node]["type"] == "joint":
        j0, j1, j2, j3, j4 = graph.nodes[node]["coordinates"]
        robot.jmove(rel=0, j0=j0, j1=j1, j2=j2, j3=j3, j4=j4)
        return 0
    if graph.nodes[node]["type"] == "linear":
        x, y, z, a, b = graph.nodes[node]["coordinates"]
        robot.jmove(rel=0, x=x, y=y, z=z, a=a, b=b)
        return 0
    else:
        print("Requested move to incorrect node...")
        return -1


def closestNode(robot, graph):
    closest = None
    minimum = 9999999
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
    g = createGraph("../graph.json")

    hostname = socket.gethostname()

    with open(file) as json_file:
        arg = json.load(json_file)

    r = Dorna()
    r.connect(arg[hostname], arg["port"])

    if r.get_motor() == 0:
        status = r.set_motor(1)
    else:
        status = "Motors are already on"
    print(status)

    @app.get("/move")
    def move():
        source = request.args.get("source")
        target = request.args.get("target")
        if target not in g:
            print("400 - Target not found")
            return "Target not found", 400
        if not source:
            source = closestNode(r, g)
            if source is None:
                return "Too far from node", 400
            else:
                goToNode(r, g, source)

        path = nx.shortest_path(g, source=source, target=target)
        print("shortest path from " + str(source) + " to " + str(target) + " is: "+ str(path))
        for node in path:
            goToNode(r, g, node)

        response = jsonify("Moved through nodes " + str(path))
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 200

    @app.get("/pickup")
    def pickup():
        prepare(r)
        status = r.jmove(rel=1, z=-20)
        grip(r)
        status = r.jmove(rel=1, z=20)
        response = jsonify("Picked up plate ", str(status))
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 200

    @app.get("/place")
    def place():
        status = r.jmove(rel=1, z=-20)
        release(r)
        status = r.jmove(rel=1, z=20)
        prepare(r)
        response = jsonify("Placed down plate ", str(status))
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 200

    @app.get("/halt")
    def halt():
        status = r.halt()
        print(status)
        response = jsonify("Robot stopped: ", str(status))
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 200

    @app.get("/poweroff")
    def poweroff():
        target = "safe"
        source = closestNode(r, g)
        if source is None:
            return "Too far from node", 400
        else:
            goToNode(r, g, source)

        path = nx.shortest_path(g, source=source, target=target)
        print("shortest path from " + str(source) + " to " + str(target) + " is: "+ str(path))
        for node in path:
            goToNode(r, g, node)

        # r.set_motor(0)
        r.close()
        return "Robot turned off!", 200

    @app.get("/draw")
    def draw():
        nx.draw(g, with_labels=True)
        plt.show()
        plt.savefig("graph.png", format="PNG")
        plt.close()
        return 'Success', 200

    @app.get("/test")
    def test():
        node = closestNode(r, g)
        return node, 200


    app.run(debug=True)

if __name__ == "__main__":
    main("config.json")
