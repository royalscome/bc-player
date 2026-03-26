/*
 * @Date: 2024-09-10 21:45:31
 * @Author: weiyang
 * @LastEditors: weiyang
 * @LastEditTime: 2024-09-10 22:56:07
 * @FilePath: /bc-player/webpack.lib.config.js
 */
const path = require('path');
const { merge } = require('webpack-merge');
const baseConfig = require('./webpack.config.js');

const libConfig = {
  entry: './src/index.js',
  target: 'web',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bc-player.js',
    library: 'BCPlayer',
    libraryTarget: 'umd',
    globalObject: 'this',
    clean: false,  // 不清理，保留 build:npm 生成的 index.js
  },
  externalsPresets: {},
  externals: [],
};

module.exports = merge(baseConfig, libConfig);