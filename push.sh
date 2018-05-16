#!/bin/bash
set -ex

npm run build
cp _dist/index.html _dist/200.html
surge -d mystreet2.surge.sh _dist

