// The path to the CesiumJS source code
const cesiumSource = 'node_modules/cesium/Source';
const cesiumWorkers = '../Build/Cesium/Workers';
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const zlib = require('browserify-zlib'); 
const CompressionPlugin = require("compression-webpack-plugin");
const { GitRevisionPlugin } = require('git-revision-webpack-plugin');
const gitRevisionPlugin = new GitRevisionPlugin();

// options:
// --env production
//      brotli-compress assets
//
// --env baseUrl=/apps/flightview2
//      set the CESIUM_BASE_URL

module.exports = (env) => {
    // see https://webpack.js.org/guides/environment-variables/
    let baseUrl = env.baseUrl ? env.baseUrl : '';
    // default to Ion.defaultAccessToken
    let ionToken =  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWE1OWUxNy1mMWZiLTQzYjYtYTQ0OS1kMWFjYmFkNjc5YzciLCJpZCI6NTc3MzMsImlhdCI6MTYyNzg0NTE4Mn0.XcKpgANiY19MC4bdFUXMVEBToBmqS8kuYpUlxJHYZxk';

    console.log(`setting baseUrl to '${baseUrl}'`);
    if (env.production) {
        console.log(`compressing assets`);
        // scope limited to https://static.mah.priv.at
        ionToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkZWQ3MjQwZC0wZjViLTQ1YzktODYyNi02M2EyNzA3ZTZmZGUiLCJpZCI6MTQ0MjAsImlhdCI6MTY5MjM4MTExNH0.ZdQS_J4spxZC5GsaI2SYgjxiPQsoT53IdINgaPoLDzQ';        
    }
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
            (env.production !== undefined) && new CompressionPlugin({
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
                CESIUM_BASE_URL: JSON.stringify(baseUrl),
                CESIUM_ION_TOKEN: JSON.stringify(ionToken),
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
