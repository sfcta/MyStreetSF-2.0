'use strict';

require('isomorphic-fetch');
let yaml = require('node-yaml');

const SERVER = 'https://api.sfcta.org/api/';
const URL = 'mystreet2_sample';
const COLUMNS = '';

const OUTPUT = 'site/_data/projects.yml';

async function fetchFromApiServer() {
  try {
    let url = SERVER + URL + COLUMNS;
    console.log('--reading: ' + url);

    let data = await fetch(SERVER + URL + COLUMNS);
    let json = await data.json();

    console.log('--writing: ' + OUTPUT);
    yaml.write(OUTPUT, json);

  } catch (e) {
    console.log(e);
  }
}

fetchFromApiServer();
