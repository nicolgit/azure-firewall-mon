const webpack = require("webpack");

module.exports = {
  plugins: [
      new webpack.ProvidePlugin({
        process: "process/browser",
      }),
      new webpack.ProvidePlugin({
        Buffer: ["buffer", "Buffer"],
      }),
    ],
  resolve: {
    fallback: {
      buffer: require.resolve("buffer/"),
      os: require.resolve("os-browserify"),
      path: require.resolve("path-browserify"), 
    }
  },
};
