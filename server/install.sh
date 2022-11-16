#!/bin/bash

pyv="$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')"

echo "Using python version $pyv"
sudo apt install $pyv-venv

# $pyv -m venv
# echo $spython

# Create virtual environment
# sudo apt install python3.8-venv



# # Install Dorna API
# git clone https://github.com/dorna-robotics/dorna2-python.git
# cd dorna2-python
# sudo python3 setup.py install --force

# # Install
