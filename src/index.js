import { Viewer, Cesium3DTileset, createWorldTerrain, Cartesian3, Math } from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "../src/css/main.css"

// Initialize the Cesium Viewer in the HTML element with the `cesiumContainer` ID.
const viewer = new Viewer('cesiumContainer', {
  terrainProvider: createWorldTerrain()
});

// 3dtiles.data is a service created by docker compose and /3dtiles is mounted there
const tileset = viewer.scene.primitives.add(new Cesium3DTileset({
    url : 'http://localhost:8003/3dtiles/tileset.json'
}));

// Fly the camera to Delft.
viewer.camera.flyTo({
  destination: Cartesian3.fromDegrees(4.365306, 52.005689, 400),
  orientation : {
    heading : Math.toRadians(0.0),
    pitch : Math.toRadians(-15.0),
  }
});