const path = require('path');

module.exports = {
     entry: () => {
       let entries = {};
       entries['mystreet2'] = `./src/code.js`;
       return entries;
     },

     output: {
         //path: path.join(__dirname, './src/bundles/'),
         filename: 'src/bundle.js'
     },
     module: {
       loaders: [{
         exclude: /node_modules/,
         loader: 'babel-loader',
       }]
     },
};
