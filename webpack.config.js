const path = require('path')

const CopyWebpackPlugin = require('copy-webpack-plugin')

const IGNORED_PATH_PREFIXES = [
    'img/x-',
    'img/x+',
    'img/y-',
    'img/y+',
    'img/z-',
    'img/z+',
    'assets/',
]
const IGNORED_NAME_PREFIXES = [
    '_',
]

function allowlistEntries(filepath) {
    const relativeFilename = path.relative('./src', filepath).replace(path.sep, '/')
    const name = path.basename(filepath)
    return IGNORED_PATH_PREFIXES.find(p => relativeFilename.startsWith(p)) == undefined && IGNORED_NAME_PREFIXES.find(p => name.startsWith(p)) == undefined
}

function relativeFilename({ absoluteFilename }) {
    return path.relative('./src', absoluteFilename)
}

module.exports = {
    entry: {
        comdyn: './src/script/comdyn.ts',
        pathtrace: './src/script/pathtrace.ts',
        cloth: './src/script/cloth.ts',
    },
    module: {
        rules: [
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.(fs|vs)$/,
                use: 'webpack-glsl-loader',
            }
        ],
    },
    resolve: {
        extensions: ['.ts', '.vs', '.fs', '.js'],
    },
    mode: 'development',
    plugins: [
        new CopyWebpackPlugin(
            {
                patterns: [
                    {
                        from: './src/**/*\.(html|css|svg|jpg|png|ico)',
                        to: relativeFilename,
                        filter: allowlistEntries,
                    },
                ]
            }
        ),
    ],
    devServer: {
        static: './dist',
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
        }
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
    },
}
