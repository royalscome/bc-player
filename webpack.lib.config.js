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
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bc-player.js',
    library: 'BCPlayer',
    libraryTarget: 'umd',
    // libraryTarget: 'esm',
    globalObject: 'this',
  },
  externals: {
    // 如果你的库依赖于其他库，可以在这里配置
    // 'react': 'React'
  },
};

module.exports = merge(baseConfig, libConfig);