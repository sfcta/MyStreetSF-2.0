#!/usr/bin/env bash

# CROP-PROJECT-PHOTOS.SH
# Centers and crops all PNG/JPG photos in a folder to 500x500,
# and creates a JSON lookup
#
# Requires GraphicsMagick 'gm' utility
# Requires Node.js
#
set -ex

FOLDER=../static/project-images

# TO-DO should pull images from google-drive first

for image in $FOLDER/{*.JPG,*.PNG,*.jpg,*.png};
do
    gm convert \
          -geometry 500x500^ \
          -gravity center \
          -crop 500x500 \
          +profile "*" \
          -quality 35 \
          "$image" "${image}.jpeg"
done

# create the JSON lookup file
node process-project-images.js

rm $FOLDER/{*.JPG,*.PNG,*.jpg,*.png}
