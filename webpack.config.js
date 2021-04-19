path = require('path');

module.exports = {
	entry: {
		worker: './src/scripts/worker.ts',
		main: ['./src/scripts/side_menu.ts', './src/scripts/toggle_fullscreen.ts',],
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
