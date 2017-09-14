const fs = require('fs');
const webpack = require('webpack');
const rimraf = require('rimraf');
const merge = require('merge');
const path = require('path');
const cssnano = require('cssnano');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

var target = 'all';
const targetArgIndex = process.argv.indexOf('--env');

if (targetArgIndex > -1) {
    target = process.argv[targetArgIndex + 1];

    if (!(target in { all: 1, dev: 1, prod: 1 })) {
        throw new Error("Unknown build target given: " + target + ". Must be either `all`, `dev`, or `prod`");
    }
}

const banner = new webpack.BannerPlugin({
    banner: fs.readFileSync('./LICENSE.md', 'utf8'),
    raw: false,
    entryOnly: false
});

const extractSass = new ExtractTextPlugin({
    filename: '[name].css',
    allChunks: true
});

const copyWebpackPlugin = new CopyWebpackPlugin([
    { from: 'node_modules/pdf.js/build', to: 'pdf.js/build' },
    { from: 'node_modules/pdf.js/web', to: 'pdf.js/web' }
]);

const baseConfig = {
    entry: {
        grauman: path.join(__dirname, 'src/Grauman.js')
    },
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'grauman.js',
        library: 'Grauman',
        libraryTarget: 'umd',
        umdNamedDefine: true,
        jsonpFunction: '__graumanJsonp__',
        chunkFilename: 'grauman.component[id].js'
    },
    resolve: {
        extensions: ['.js'],
        modules: [path.join(__dirname, 'src'), 'node_modules']
    },
    module: {
        rules: [{
            test: /\.js$/,
            loader: 'babel-loader',
            exclude: /node_modules/,
            query: {
                cacheDirectory: true,
                presets: [['es2015', { modules: false }]]
            }
        }, {
            test: /\.scss$/,
            use: extractSass.extract({
                fallback: 'style-loader',
                use: [{ loader: 'css-loader', options: { minimize: true } }, 'postcss-loader', 'sass-loader']
            }),
            include: path.join(__dirname, 'src')
        }, {
            test: /\.css$/,
            use: extractSass.extract({
                use: [{ loader: 'css-loader', options: { minimize: true } }, 'postcss-loader']
            })
        }, {
            test: /\.woff$/,
            loader: 'url-loader?limit=65000&mimetype=application/font-woff&name=/fonts/[name].[ext]'
        }, {
            test: /\.svg$/,
            loader: 'url-loader?limit=65000&mimetype=image/svg+xml&name=/fonts/[name].[ext]'
        }, {
            test: /\.ttf$/,
            loader: 'url-loader?limit=65000&mimetype=application/octet-stream&name=/fonts/[name].[ext]'
        }, {
            test: /\.eot$/,
            loader: 'url-loader?limit=65000&mimetype=application/vnd.ms-fontobject&name=/fonts/[name].[ext]'
        }]
    }
};

const prodConfig = merge(true, baseConfig);
const devConfig = merge(true, baseConfig);


devConfig.devtool = 'sourceMap';
devConfig.plugins = [extractSass, copyWebpackPlugin, banner];

prodConfig.module.rules.unshift({
    enforce: "pre",
    test: /\.js$/,
    exclude: /node_modules/,
    loader: "eslint-loader"
});
prodConfig.plugins = [extractSass, copyWebpackPlugin, new webpack.optimize.UglifyJsPlugin(), banner]
prodConfig.output.chunkFilename = 'grauman.component[id].min.js';
//prodConfig.output.filename = 'grauman.min.js';

rimraf.sync(path.join(__dirname, 'dist'));

switch (target) {
    case 'dev': module.exports = [devConfig]; break;
    case 'prod': module.exports = [prodConfig]; break;
    case 'all': module.exports = [devConfig, prodConfig]; break;
    default: throw new Error('Unknown build target: ' + target);
}
