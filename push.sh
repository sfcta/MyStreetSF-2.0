#!/bin/bash
set -ex

cd ~/mystreet2

cp site/_data/projects-all.yml site/_data/projects.yml
npm run build
surge _site
cp site/_data/projects-sample.yml site/_data/projects.yml

