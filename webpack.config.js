const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
     entry: {
       'main': ['babel-polyfill', './theme/code.js'],
     },
     output: {
         path: path.join(__dirname, './theme/lib'),
         filename: '[name].bundle.js',
     },
     devtool: '#source-map',
     module: {
       loaders: [{
         loader: 'babel-loader',
         exclude: /node_modules/,
         query: {
           plugins: ['transform-runtime'],
           presets: [
             ['env', {
               "targets": {
                 "browsers": [
                    "Explorer 11",
                    "Safari >= 8",
                    "last 3 Chrome versions",
                    "last 3 Firefox versions",
                    "last 3 Edge versions"
                  ]
               },
               "useBuiltIns": true
             }]
           ]
         }
       }]
     },
/*  // uncomment this for production - compresses .js bundle:
    plugins: [
      new UglifyJsPlugin({
          cache: true,
          sourceMap: true,
          parallel: true,
      }),
     ],
*/
};
