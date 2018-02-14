#!/usr/bin/env bash
set -ex

# note this must be run as user postgres; i.e.
#   sudo -u postgres fetch-portal-data.sh

curl -X GET -H "X-USER-TOKEN: e050e01c-3176-cad7-b714-f8f75a6adb6d" \
     -H "Content-Type: application/csv" \
     "https://portal.sfcta.org/api/v1/project_locations" > /tmp/portal-dump.csv

psql -f import-portal-data.sql geo
