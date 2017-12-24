'use strict';

require('isomorphic-fetch');
let yaml = require('node-yaml');

const SERVER = 'https://api.sfcta.org/api/';
const URL = 'mystreet2_all';
const COLUMNS = '';

async function fetchFromApiServer() {
  console.log('1');

  try {
    let data = await fetch(SERVER + URL + COLUMNS);
    let j = await data.json();

    yaml.write('projects.yml', j);

  } catch (e) {
    console.log(e);
  }
}

fetchFromApiServer();