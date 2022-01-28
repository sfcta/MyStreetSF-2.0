'use strict'
const merge = require('webpack-merge')
const prodEnv = require('./prod.env')

module.exports = merge(prodEnv, {
  NODE_ENV: '"development"',
  DEBUG: 'true',
  API_TOKEN: '"b696a6b6-4b97-46b9-a45e-d977c8d19a41"'
})
