path = require('path');

module.exports = {
	entry: {
		mandel: './src/side_menu.ts',
		dw: './src/draw_worker.ts',
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
