/* eslint-disable */

const path = require('path');

module.exports = {
	entry: {
		// cpu_main: ['./src/side_menu.ts', './src/cpu_mandelbrot/toggle_fullscreen.ts',],
		// cpu_worker: './src/cpu_mandelbrot/draw_worker.ts',
		comdyn: ['./src/comdyn.ts',],
		gol: ['./src/gol_entry.ts',],
	},
	experiments: {
		syncWebAssembly: true,
		topLevelAwait: true,
	},
	mode: 'production',
	devServer: {
		static: {
			directory: path.join(__dirname, 'docs'),
		},
	},
	module: {
	  rules: [
		{
		  test: /\.tsx?$/,
		  use: 'ts-loader',
		  exclude: /node_modules/,
		}
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
