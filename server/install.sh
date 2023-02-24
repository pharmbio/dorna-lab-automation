#!/bin/bash

# Figure out python version
pyv="$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')"
echo "Using python version $pyv"
sudo apt install python$pyv-venv

# Create and activate virtual environment
python$pyv -m venv env
source env/bin/activate

# Download and install dorna2 library
git clone https://github.com/dorna-robotics/dorna2-python.git
cd dorna2-python
python setup.py install --force
cd ..

# Use pip to install python dependencies
pip install -r requirements.txt
