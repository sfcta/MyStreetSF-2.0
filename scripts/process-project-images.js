'use strict'
const fs = require('fs')

console.log('ok')

let images = {}

fs.readdirSync('.').forEach(file => {
  let id = file.substring(0, file.length - 5)
  images[id] = file
})

console.log(images)

fs.writeFileSync('project-images.json', JSON.stringify(images, null, 2), 'utf-8')
