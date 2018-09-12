'use strict'
const fs = require('fs')

const FOLDER = '../static/project-images/'

console.log('ok')

let images = {}

fs.readdirSync(FOLDER).forEach(file => {
  if (!file.endsWith('.jpeg')) return

  let id = file.substring(0, file.indexOf('.'))
  images[id] = file
})

console.log(images)

fs.writeFileSync(FOLDER + 'project-images.json', JSON.stringify(images, null, 2), 'utf-8')
