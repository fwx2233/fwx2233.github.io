const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { BannerPlugin, EnvironmentPlugin } = require('webpack');
const { name, version } = require('./package.json');

module.exports = (_env, argv) => ({
  entry: resolve('_js/src/index.js'),
  output: {
    path: resolve('assets/js'),
    filename: `${name}-${version}.js`,
  },
  devtool: argv.mode === 'production' ? false : 'source-map',
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            babelrc: false,
            presets: [['@babel/preset-env', {
              targets: '> 0.5%, last 2 versions, not dead',
              modules: false,
            }]],
          },
        },
      },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
    ],
  },
  plugins: [
    new BannerPlugin({ banner: readFileSync('_includes/header.txt', 'utf8'), raw: true }),
    new EnvironmentPlugin({ DEBUG: argv.mode !== 'production' }),
  ],
});
