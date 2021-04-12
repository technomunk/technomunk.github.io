path = require('path');

module.exports = {
	entry: {
		bundle: ['./src/numeric_input.ts', './src/side_menu.ts',],
		draw_worker: './src/draw_worker.ts',
	},
	devtool: 'inline-source-map',
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
		path: path.resolve(__dirname, 'docs', 'scripts'),
	},
};
