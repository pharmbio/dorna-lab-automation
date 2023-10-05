#!/usr/bin/env bash

cd ~/Downloads/dorna-lab-automation

gnome-terminal -- bash -c "cd server ; source env/bin/activate ; python3 server.py"
gnome-terminal -- bash -c "cd web ; npm start"