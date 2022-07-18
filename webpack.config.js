/*
 * @Description:
 * @Author: weiyang
 * @Date: 2022-07-18 14:05:40
 * @LastEditors: weiyang
 * @LastEditTime: 2022-07-18 14:32:30
 */
const path = require("path");
const TerserWebpackPlugin = require("terser-webpack-plugin");
const nodeExternals = require("webpack-node-externals");
// const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: {
    index: "./src/index",
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "./dist"),
    library: {
      type: "commonjs-static",
    },
    clean: true,
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // plugins: [
  //   new CopyPlugin({
  //     patterns: [],
  //   }),
  // ],
  module: {
    rules: [
      {
        test: /\.(jsx?|tsx?)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            options: {
              cacheDirectory: true,
            },
          },
        ],
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        type: "asset/resource",
        parser: {
          dataUrlCondition: {
            maxSize: 4 * 1024,
          },
        },
      },
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserWebpackPlugin({
        terserOptions: {
          compress: {
            pure_funcs: ["console.log"],
          },
        },
      }),
    ],
  },
  externalsPresets: { node: true },
  externals: [
    nodeExternals({
      allowlist: [],
    }),
  ],
};
