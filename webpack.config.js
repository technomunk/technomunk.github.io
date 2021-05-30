/* eslint-disable */

path = require('path');

module.exports = {
	entry: {
		// cpu_main: ['./src/side_menu.ts', './src/cpu_mandelbrot/toggle_fullscreen.ts',],
		// cpu_worker: './src/cpu_mandelbrot/draw_worker.ts',
		comdyn: ['./src/comdyn.ts',],
	},
	// devtool: 'inline-source-map',
	mode: 'production',
	module: {
	  rules: [
		{
		  test: /\.tsx?$/,
		  use: 'ts-loader',
		  exclude: /node_modules/,
		},
	  ],
	},
	resolve: {
		extensions: ['.ts', '.js'],
	},
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, 'docs'),
	},
};
