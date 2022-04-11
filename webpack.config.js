/* eslint-disable */

const path = require("path");

module.exports = {
  entry: {
    // cpu_main: ['./src/side_menu.ts', './src/cpu_mandelbrot/toggle_fullscreen.ts',],
    // cpu_worker: './src/cpu_mandelbrot/draw_worker.ts',
    comdyn: ["./src/scripts/comdyn.ts"],
    gol: ["./src/scripts/gol.ts"],
    p2ds: ["./src/scripts/p2ds.ts"],
  },
  experiments: {
    syncWebAssembly: true,
    topLevelAwait: true,
  },
  // devtool: 'source-map',
  mode: "production",
  devServer: {
    static: {
      directory: path.join(__dirname, "docs"),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "docs"),
  },
  performance: {
    maxAssetSize: 170000,
    assetFilter: (asset) => {
      return asset.match("./src/scripts/p2ds.ts");
    },
  },
};
