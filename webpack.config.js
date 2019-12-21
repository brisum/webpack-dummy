'use strict';

const NODE_ENV = process.env.NODE_ENV || 'development';
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const AssetsPlugin = require('assets-webpack-plugin');
const ConcatPlugin = require('webpack-concat-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const webpack = require('webpack');
const rimraf = require('rimraf');
const fs = require('fs');
const glob = require('glob');

// PluginPopupConfirm
const extractTextPluginCss = new ExtractTextPlugin({
  filename: '[name].css?[contenthash]',
  allChunks: true
});


class Project {
  constructor() {
    this._aliases = null;
    this.requireInitDist = __dirname + '/node_modules/@brisum/js-lib/src/RequireInit.dist.js';
    this.requireInit = __dirname + '/assets/src/js/lib/RequireInit.js';
  }
  
  generateRequireInit() {
    let self = this,
      requireAliasTemplate = null,
      cases = [];
    
    fs.readFile(self.requireInitDist, 'utf8', function (err, content) {
      if (err) {
        return console.log(err);
      }
      
      requireAliasTemplate = content.match(/\/\* case template:([\s\S]+)\*\//)[1];
      
      Object.keys(self.getAliases()).forEach(function (aliasName) {
        cases.push(requireAliasTemplate.replace(/{{name}}/g, aliasName));
      });
      
      content = content.replace('// {{cases}}', cases.join("\n"));
      
      fs.writeFile(self.requireInit, content, function (err) {
        if (err) {
          console.log(err);
        }
        
        console.log('Generate require-init.js');
      });
    });
  }
  
  getAliases() {
    let self = this;
    
    if (!self._aliases) {
      self._aliases = {};
      
      let vendor = {
        // 'element': __dirname + '/node_modules/element/element.js',
      };
      Object.keys(vendor).forEach(function (alias) {
        self._aliases[alias] = vendor[alias];
      });
      
      let paths = [
        __dirname + '/node_modules/@brisum/js-lib/src/',
        __dirname + '/assets/src/js/lib/'
      ];
      paths.forEach(function (path) {
        glob.sync(path + '/*.js').forEach(function (file) {
          let alias = file.match(/([^\/]+)\.js$/)[1];
          self._aliases[alias] = file;
        });
      });
      
      delete self._aliases['RequireInit.dist'];
      delete self._aliases['DummyWidget'];
      console.log(self._aliases);
    }
    
    return self._aliases;
  }
  
  getPlugins() {
    let plugins = [];
    
    plugins.push({
      apply: (compiler) => {
        rimraf.sync(compiler.options.output.path);
      }
    });
    
    plugins.push(extractTextPluginCss);
    
    plugins.push(new AssetsPlugin({
      prettyPrint: true,
      filename: 'assets.json',
      path: __dirname + '/assets/dist'
    }));
    
    plugins.push(new ConcatPlugin({
      uglify: NODE_ENV === 'production',
      useHash: true, // md5 file
      sourceMap: false, // generate sourceMap
      name: 'jquery', // used in html-webpack-plugin
      fileName: '[name].js?[hash]',
      filesToConcat: [
        __dirname + '/node_modules/jquery/dist/jquery.min.js',
        __dirname + '/node_modules/jquery-migrate/dist/jquery-migrate.min.js',
        __dirname + '/node_modules/what-input/dist/what-input.min.js',
        __dirname + '/node_modules/jquery.cookie/jquery.cookie.js'
      ]
    }));
    
    plugins.push(new ConcatPlugin({
      uglify: NODE_ENV === 'production',
      useHash: true, // md5 file
      sourceMap: false, // generate sourceMap
      name: 'bootstrap', // used in html-webpack-plugin
      fileName: '[name].js?[hash]',
      filesToConcat: [
        __dirname + '/node_modules/bootstrap/dist/js/bootstrap.bundle.min.js'
      ]
    }));
    
    if (NODE_ENV === 'production') {
      plugins.push(new UglifyJsPlugin({
        test: /\.js($|\?)/i,
        cache: true,
        parallel: 4,
        sourceMap: false
      }));
    }
    
    plugins.push(new webpack.LoaderOptionsPlugin({
      debug: NODE_ENV !== 'production'
    }));
    
    return plugins;
  }
}

let project = new Project();

project.generateRequireInit();

module.exports = {
  context: __dirname + '/assets/src',
  entry: {
    style: [
      './sass/style.sass'
    ],
    script: [
      './js/script.js'
    ],
    font_awesome: __dirname + '/node_modules/font-awesome/scss/font-awesome.scss'
  },
  
  output: {
    path: __dirname + '/assets/dist',
    publicPath: '/assets/dist/',
    filename: '[name].js?[chunkhash]',
    chunkFilename: 'js/chunk/[name].[id].js?[chunkhash]',
    library: '[name]'
  },
  
  resolve: {
    extensions: ['.js', '.css', '.scss', 'sass'],
    alias: project.getAliases()
  },
  
  externals: {
    "jquery": "jQuery"
  },
  
  devtool: NODE_ENV === 'development' ? "source-map" : false,
  
  watchOptions: {
    aggregateTimeout: 300
  },
  
  module: {
    rules: [
      {
        test: /\.js$/, // include .js files
        enforce: "pre", // preload the jshint loader
        exclude: /node_modules|bower_components|thirdparty|/, // exclude any and all files in the node_modules folder
        use: [
          {
            loader: "jshint-loader",
            options: {
              camelcase: true,
              emitErrors: false,
              failOnHint: false
            }
          }
        ]
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ["babel-preset-es2015"].map(require.resolve)
          }
        }
      },
      {
        test: /\.jade$/,
        use: {
          loader: "jade-loader"
        }
      },
      {
        test: /\.css$/,
        use: extractTextPluginCss.extract(['css-loader', 'resolve-url-loader'])
      },
      {
        test: /\.scss$/,
        use: extractTextPluginCss.extract(['css-loader?sourceMap', 'resolve-url-loader?sourceMap', 'sass-loader?sourceMap'])
      },
      {
        test: /\.sass$/,
        use: extractTextPluginCss.extract(['css-loader?sourceMap', 'resolve-url-loader?sourceMap', 'sass-loader?sourceMap'])
      },
      {
        test: /\.(gif|png|jpg|svg|ttf|eot|woff|woff2)(\?\S*)?/,
        use: {
          loader: 'file-loader',
          options: {
            filename: '[path][name].[ext]?[hash:6]'
          }
        }
      }
    ]
  },
  
  plugins: project.getPlugins()
};
