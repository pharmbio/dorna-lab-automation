#!/bin/bash

# Install nodejs
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs



# Install Dorna API
git clone https://github.com/dorna-robotics/dorna2-python.git
cd dorna2-python
sudo python3 setup.py install --force

# Install
