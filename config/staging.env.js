'use strict'
const merge = require('webpack-merge')
const prodEnv = require('./prod.env')

module.exports = merge(prodEnv, {
  NODE_ENV: '"staging"',
  DEBUG: "true",
  API_TOKEN: '"7d211897-08bb-4d3c-a28d-12f27224afca"'
})
