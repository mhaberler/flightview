# Test deployment of Cesium to serve local 3D Tiles

This repository is a fork of the [cesium-webpack-example](https://github.com/CesiumGS/cesium-webpack-example) and it has been adapted to serve 3D Tiles from a local directory, instead of Cesium Ion.

## Notes

Cartesian coordinates are in EPSG:4978. Degrees are in EPSG:4979.

`Cartesian3(1215107.76, -4736682.90, 4081926.09` does not work. 
Use `Cartesian3.fromDegrees(-75.6120945, 0, 400)` to set the location from a EPSG:4979 point.

---

# cesium-webpack-example

A minimal recommended setup for an applications using [Cesium](https://cesium.com) with [Webpack](https://webpack.js.org/concepts/).

[![Build Status](https://travis-ci.org/CesiumGS/cesium-webpack-example.svg?branch=using-custom-loader)](https://travis-ci.org/CesiumGS/cesium-webpack-example)

## Running this application

````sh
npm install
npm start
````

Navigate to `localhost:8080`.

### Available scripts

* `npm start` - Runs a webpack build with `webpack.config.js` and starts a development server
* `npm run build` - Runs a webpack build with `webpack.config.js`

## Requiring Cesium in your application

We recommend [importing named exports](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import) from the Cesium ES module, via the `import` keyword. This allows webpack to [tree shake](https://webpack.js.org/guides/tree-shaking/) your application automatically.

### Import named modules from Cesium

````js
import { Color } from 'cesium';
var c = Color.fromRandom();
````

### Import Cesium static asset files

````js
import "cesium/Build/Cesium/Widgets/widgets.css";
````

## Removing pragmas

To remove pragmas such as a traditional Cesium release build, use the [`strip-pragma-loader`](https://www.npmjs.com/package/strip-pragma-loader).

Install the plugin with npm,

````sh
npm install strip-pragma-loader --save-dev
````

and include the loader in `module.rules` with `debug` set to `false`.

````js
rules: [{
	test: /\.js$/,
	enforce: 'pre',
	include: path.resolve(__dirname, cesiumSource),
	use: [{
		loader: 'strip-pragma-loader',
		options: {
		    pragmas: {
				debug: false
			}
		}
	}]
}]
````

## Contributions

Pull requests are appreciated. Please use the same [Contributor License Agreement (CLA)](https://github.com/CesiumGS/cesium/blob/master/CONTRIBUTING.md) used for [Cesium](https://cesium.com/).

---

Developed by the Cesium team.
