import {
    Viewer, Cesium3DTileset, Cesium3DTileStyle, createWorldTerrain, Cartesian3, Math,
    viewerCesium3DTilesInspectorMixin, HeadingPitchRange, Credit,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "../src/css/main.css"
import Logo3dgi  from "../src/img/logo-3dgi.png"

// Initialize the Cesium Viewer in the HTML element with the `cesiumContainer` ID.
const viewer = new Viewer('cesiumContainer', {
    // terrainProvider: createWorldTerrain(),
    shadows: false,
    timeline: false,
    // https://cesium.com/blog/2018/01/24/cesium-scene-rendering-performance/#enabling-request-render-mode
    requestRenderMode: true,
    globe: false,
    animation: false,
});

const logo_3dgi = new Image(138);
logo_3dgi.src = Logo3dgi;
console.log(logo_3dgi.outerHTML)
var credit = new Credit('<br><a href="https://3dgi.nl/" target="_blank">' + logo_3dgi.outerHTML +
    '</a><p><b>Demo viewer of the Dutch 3D base registration data, served as 3D Tiles. The 3D models are developed by 3DGI for the Dutch Kadaster.</b></p>');

viewer.scene.frameState.creditDisplay.addDefaultCredit(credit);

// viewer.scene.globe.depthTestAgainstTerrain = true;

viewer.extend(viewerCesium3DTilesInspectorMixin);
const inspectorViewModel = viewer.cesium3DTilesInspector.viewModel;

// 3dtiles.data is a service created by docker compose and /3dtiles is mounted there
const tileset_buildings = viewer.scene.primitives.add(new Cesium3DTileset({
    url: 'http://localhost:8003/3dtiles/tileset.json',
    // url: 'https://data.3dgi.xyz/3dtiles-test-data/buildings/tileset.json',
    enableDebugWireframe: false,
    debugShowBoundingVolume: false,
    debugShowContentBoundingVolume: false,
}));

const tileset_terrain = viewer.scene.primitives.add(new Cesium3DTileset({
    url: 'http://localhost:8004/3dtiles/tileset.json',
    // url: 'https://data.3dgi.xyz/3dtiles-test-data/terrain/tileset.json',
    enableDebugWireframe: false,
    debugShowBoundingVolume: false,
    debugShowContentBoundingVolume: false,
}));

// // https://cesium.com/learn/cesiumjs-learn/cesiumjs-3d-tiles-styling/
// tileset.style = new Cesium3DTileStyle({
//   color: {
//     conditions: [
//       // ["${name} === 'Crown Entertainment Complex'", "color('red')"],
//       ["true", "color('white')"],
//     ],
//   },
// });

// Fly the camera to Delft.
// viewer.camera.flyTo({
//     destination: Cartesian3.fromDegrees(4.365306, 52.005689, 400),
//     orientation: {
//         heading: Math.toRadians(0.0),
//         pitch: Math.toRadians(-15.0),
//     }
// });

tileset_buildings.readyPromise.then(function () {
    viewer.zoomTo(
        tileset_buildings,
        new HeadingPitchRange(
            0.0,
            -0.5,
            400
            // tileset.boundingSphere.radius / 4.0
        )
    );
});