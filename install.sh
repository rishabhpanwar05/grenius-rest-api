#!/bin/bash

sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927
echo "deb http://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.2.list
sudo apt-get update
sudo apt-get install -y mongodb-org
cp mongocmd /etc/systemd/system/mongodb.service
sudo systemctl start mongodb
sudo systemctl enable mongodb

npm install -g forever
sudo apt-get install ufw
sudo ufw enable
sudo ufw allow 22
sudo ufw allow 3000

git clone http://github.com/rishabhpanwar05/grenius-rest-api.git
cd grenius-restapi
forever start server.js

