// The path to the CesiumJS source code
const cesiumSource = 'node_modules/cesium/Source';
const cesiumWorkers = '../Build/Cesium/Workers';
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const zlib = require('browserify-zlib'); // require("zlib");
const CompressionPlugin = require("compression-webpack-plugin");
const { GitRevisionPlugin } = require('git-revision-webpack-plugin');
const gitRevisionPlugin = new GitRevisionPlugin();

module.exports = (env) => {
    // see https://webpack.js.org/guides/environment-variables/
    let baseUrl = '';
    if (env.baseUrl) {
        baseUrl = env.baseUrl;
    }
    console.log(`setting baseUrl to ${baseUrl}`);
    return {
        context: __dirname,
        entry: {
            app: './src/index.js'
        },
        output: {
            filename: 'app.js',
            path: path.resolve(__dirname, 'dist'),
            sourcePrefix: ''
        },
        resolve: {
            fallback: { "https": false, "zlib": false, "http": false, "url": false },
            mainFiles: ['index', 'Cesium']
        },
        module: {
            rules: [{
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }, {
                test: /\.(png|gif|jpg|jpeg|svg|xml|json)$/,
                use: ['url-loader']
            },
            {
                test: /\.json$/,
                use: ['json-loader'],
                type: 'javascript/auto',
            },
            ]
        },
        plugins: [
            new CompressionPlugin({
                filename: "[path][base].br",
                algorithm: "brotliCompress",
                test: /\.(js|css|html|svg)$/,
                compressionOptions: {
                    params: {
                        // [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
                    },
                },
                threshold: 10240,
                minRatio: 0.8,
                deleteOriginalAssets: false,
            }),
            new HtmlWebpackPlugin({
                template: 'src/index.html'
            }),
            // Copy Cesium Assets, Widgets, and Workers to a static directory
            new CopyWebpackPlugin({
                patterns: [
                    { from: path.join(cesiumSource, cesiumWorkers), to: 'Workers' },
                    { from: path.join(cesiumSource, 'Assets'), to: 'Assets' },
                    { from: path.join(cesiumSource, 'Widgets'), to: 'Widgets' },
                    { from: path.join(cesiumSource, 'ThirdParty'), to: 'ThirdParty' }
                ]
            }),
            new webpack.DefinePlugin({
                // Define relative base path in cesium for loading assets
                CESIUM_BASE_URL: JSON.stringify(baseUrl)
            }),
            gitRevisionPlugin,
            new webpack.DefinePlugin({
                VERSION: JSON.stringify(gitRevisionPlugin.version()),
                COMMITHASH: JSON.stringify(gitRevisionPlugin.commithash()),
                BRANCH: JSON.stringify(gitRevisionPlugin.branch()),
                LASTCOMMITDATETIME: JSON.stringify(gitRevisionPlugin.lastcommitdatetime()),
            }),
        ],
        mode: 'development',
        devtool: 'eval',
    }
};
