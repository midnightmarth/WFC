const path = require("path");

const src = path.join(__dirname, "client/src");
const DIST_DIR = path.join(__dirname, "client/dist");
const NODE_ENV = process.env.NODE_ENV || "development";

module.exports = {
  // mode: NODE_ENV, // mode defined when started from package.json
  entry: {
    entry: src
  },
  output: {
    path: DIST_DIR,
    filename: "[name].bundle.js"
  },
  module: {
    rules: [
      {
        test: /\.png/,
        type: 'asset/resource'
      },
      {
        test: /\.(jsx?|ts)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              ["@babel/preset-env", { targets: "> 0.25%, not dead" }],
              "@babel/preset-react"
            ],
            plugins: [
              "@babel/plugin-proposal-class-properties",
              "@babel/plugin-transform-react-constant-elements"
            ]
          }
        }
      }
    ]
  }
};
