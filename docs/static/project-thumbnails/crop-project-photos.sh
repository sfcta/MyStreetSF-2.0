#!/usr/bin/env bash

# CROP-PROJECT-PHOTOS.SH
# Centers and crops all PNG/JPG photos in a folder to 500x500,
# and creates a JSON lookup
#
# Requires GraphicsMagick 'gm' utility
# Requires Node.js
#
# Usage:  cd .../scripts
#         bash ./crop-project-photos.sh /path/to/image/folder

set -euo pipefail
IFS=$'\n\t'
shopt -s extglob

ROOT_FOLDER=`pwd`
SRC_FOLDER="$1"

THUMB_FOLDER="$ROOT_FOLDER/../static/project-thumbnails"

echo $THUMB_FOLDER

# TO-DO should pull images from google-drive first
cp $SRC_FOLDER/* $THUMB_FOLDER

cd "$THUMB_FOLDER"

for image in @(*JPG|*jpg|*png|*PNG);
do
    gm convert \
          -verbose \
          -geometry 500x500^ \
          -gravity center \
          -crop 500x500 \
          +profile "*" \
          -quality 35 \
          "$image" "${image}.jpeg"
done

# create the JSON lookup file
cd $ROOT_FOLDER
THUMB_FOLDER="$THUMB_FOLDER" node process-project-images.js
cd $THUMB_FOLDER
rm @(*JPG|*jpg|*png|*PNG)
echo "----ALL DONE ---"
echo "Add, commit, and push all changes to the repository now"


