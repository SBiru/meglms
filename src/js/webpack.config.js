
var webpack = require('webpack');

var commonsPlugin = new webpack.optimize.CommonsChunkPlugin('common.js');
var ExtractTextPlugin = require("extract-text-webpack-plugin");

var fs = require('fs')
var path = require('path')
var runFiles = fs.readdirSync(path.join(__dirname, 'run'))
var entries = {}
runFiles.forEach(function (fname) {
  if (fname.indexOf('.js') !== fname.length - 3) return
  entries[fname.split('.')[0]] = './run/' + fname
})

module.exports = {
  // webpack options
  /**
   * The entries are auto-populated from the contents of the `./run`
   * directory. If you want to add a new entry point, then add a new `.js`
   * file to that directory.
   */
  entry: entries,

  output: {
    path: "../../public/build/",
    // TODO(jared): think about using hashes to make caching a thing
    filename: "[name].js",
  },


  module: {
    loaders: [
      { test: /\.html$/, loader: 'raw' },
      { test: /\.json$/, loader: 'json' },
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader?optional=runtime' },

      {
          test: /\.css$/,
          loader: ExtractTextPlugin.extract("style-loader", "css-loader")
      },
      {
          test: /\.less$/,
          loader: ExtractTextPlugin.extract("style-loader", "css-loader!less-loader")
      }
    ],
  },

  plugins: [commonsPlugin],
  devtool: 'eval',
  colors: true,

  plugins: [
      new ExtractTextPlugin("[name].css")
  ],
}
