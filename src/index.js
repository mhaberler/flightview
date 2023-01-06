import {
    Viewer, Cesium3DTileset, Cesium3DTileStyle, createWorldTerrain, Cartesian3, Math,
    viewerCesium3DTilesInspectorMixin, HeadingPitchRange
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "../src/css/main.css"

// Initialize the Cesium Viewer in the HTML element with the `cesiumContainer` ID.
const viewer = new Viewer('cesiumContainer', {
    // terrainProvider: createWorldTerrain(),
    shadows: true,
    timeline: false,
    // https://cesium.com/blog/2018/01/24/cesium-scene-rendering-performance/#enabling-request-render-mode
    requestRenderMode: true,
});

// viewer.scene.globe.depthTestAgainstTerrain = true;

viewer.extend(viewerCesium3DTilesInspectorMixin);
const inspectorViewModel = viewer.cesium3DTilesInspector.viewModel;

// 3dtiles.data is a service created by docker compose and /3dtiles is mounted there
const tileset = viewer.scene.primitives.add(new Cesium3DTileset({
    // url: 'http://localhost:8003/3dtiles/tileset.json',
    url: 'https://data.3dgi.xyz/3dtiles-test-data/tileset.json',
    enableDebugWireframe: true,
    debugShowBoundingVolume: true,
    debugShowContentBoundingVolume: false,
}));

// https://cesium.com/learn/cesiumjs-learn/cesiumjs-3d-tiles-styling/
tileset.style = new Cesium3DTileStyle({
  color: {
    conditions: [
      // ["${name} === 'Crown Entertainment Complex'", "color('red')"],
      ["true", "color('white')"],
    ],
  },
});

// Fly the camera to Delft.
// viewer.camera.flyTo({
//     destination: Cartesian3.fromDegrees(4.365306, 52.005689, 400),
//     orientation: {
//         heading: Math.toRadians(0.0),
//         pitch: Math.toRadians(-15.0),
//     }
// });

tileset.readyPromise.then(function () {
    viewer.zoomTo(
        tileset,
        new HeadingPitchRange(
            0.0,
            -0.5,
            400
            // tileset.boundingSphere.radius / 4.0
        )
    );
});