#!/usr/bin/env bash

# CROP-PROJECT-PHOTOS.SH
# Centers and crops all PNG/JPG photos in a folder to 500x500,
# and creates a JSON lookup
#
# Requires GraphicsMagick 'gm' utility
# Requires Node.js
#
set -ex

SRC_FOLDER=~/gdrive-okbecause/mystreet-project-images

THUMB_FOLDER=../static/project-thumbnails

# TO-DO should pull images from google-drive first
cp $SRC_FOLDER/* $THUMB_FOLDER

for image in $THUMB_FOLDER/{*.JPG,*.jpg,*.png};
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
THUMB_FOLDER=$THUMB_FOLDER node process-project-images.js

rm $THUMB_FOLDER/{*.JPG,*.jpg,*.png}
