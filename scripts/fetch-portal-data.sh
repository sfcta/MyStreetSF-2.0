#!/usr/bin/env bash
set -e

export LOGFILE=/tmp/psql-`date +%Y-%m-%d--%H:%M`.log

# note this must be run as user postgres; i.e.
#   sudo -u postgres fetchportal-data.sh

curl -Ss -X GET -H "X-USER-TOKEN: e050e01c-3176-cad7-b714-f8f75a6adb6d" \
     -H "Content-Type: application/csv" \
     "https://portal.sfcta.org/api/v1/project_locations" > /tmp/portal-dump.csv

# Does file exist and have size greater than 0
if [ ! -s /tmp/portal-dump.csv ]; then
	exit 0
fi


psql -q -f import-portal-data.sql geo &> $LOGFILE

rm /tmp/portal-dump.csv

