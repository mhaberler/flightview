import {
    Viewer, Cesium3DTileset, Cesium3DTileStyle, createWorldTerrain, Cartesian3, Math,
    viewerCesium3DTilesInspectorMixin, HeadingPitchRange, Credit, Transforms,
    Color, Entity, ScreenSpaceEventType, PostProcessStageLibrary, defined, defaultValue,
    ScreenSpaceEventHandler, Cesium3DTileFeature
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "../src/css/main.css"
import Logo3dgi  from "../src/img/logo-3dgi.png"

const viewer = new Viewer("cesiumContainer", {requestRenderMode: true,});

// Stores the tileset that is currently selected
let currentTileset;

// Stores the currently selected feature ID label, which
// is the index of `FEATURE_ID_n`
let currentActiveFeatureIdLabel = 0;

// Creates the tileset from the tileset.json in the given subdirectory
function createTileset(subdirectory) {
  if (defined(currentTileset)) {
    viewer.scene.primitives.remove(currentTileset);
    currentTileset = undefined;
  }
  // Create the tileset, and move it to a certain position on the globe
  currentTileset = viewer.scene.primitives.add(
    new Cesium3DTileset({
      url: `http://localhost:8003/glTF/EXT_structural_metadata/${subdirectory}/tileset.json`,
      debugShowBoundingVolume: true,
    })
  );
  currentTileset.modelMatrix = Transforms.eastNorthUpToFixedFrame(
    Cartesian3.fromDegrees(-75.152325, 39.94704, 0)
  );
  const offset = new HeadingPitchRange(
    0,
    Math.toRadians(-22.5),
    4.0
  );
  viewer.zoomTo(currentTileset, offset);

  // Make sure that picking refers to the FEATURE_ID index that
  // is currently selected in the UI
  currentTileset.featureIdLabel = currentActiveFeatureIdLabel;
}

// Create an HTML element that will serve as the
// tooltip that displays the feature information
function createTooltip() {
  const tooltip = document.createElement("div");
  viewer.container.appendChild(tooltip);
  tooltip.style.backgroundColor = "black";
  tooltip.style.color = "white";
  tooltip.style.position = "absolute";
  tooltip.style.left = "0";
  tooltip.style.top = "0";
  tooltip.style.padding = "14px";
  tooltip.style["pointer-events"] = "none";
  tooltip.style["block-size"] = "fit-content";
  return tooltip;
}
const tooltip = createTooltip();

// Show the given HTML content in the tooltip
// at the given screen position
function showTooltip(screenX, screenY, htmlContent) {
  tooltip.style.display = "block";
  tooltip.style.left = `${screenX}px`;
  tooltip.style.top = `${screenY}px`;
  tooltip.innerHTML = htmlContent;
}

// Create an HTML string that contains information
// about the given feature, under the given title
function createFeatureHtml(title, feature) {
  if (!defined(feature)) {
    return `(No ${title})<br>`;
  }
  const propertyKeys = feature.getPropertyIds();
  if (!defined(propertyKeys)) {
    return `(No properties for ${title})<br>`;
  }
  let html = `<b>${title}:</b><br>`;
  for (let i = 0; i < propertyKeys.length; i++) {
    const propertyKey = propertyKeys[i];
    const propertyValue = feature.getProperty(propertyKey);
    html += `&nbsp;&nbsp;${propertyKey} : ${propertyValue}<br>`;
  }
  return html;
}

// Given an object that was obtained via Scene#pick: If it is
// a Cesium3DTileFeature, then it is returned.
// Otherwise, 'undefined' is returned.
function obtainFeature(picked) {
  if (!defined(picked)) {
    return undefined;
  }
  const isFeature = picked instanceof Cesium3DTileFeature;
  if (!isFeature) {
    return undefined;
  }
  return picked;
}

// Install the handler that will perform picking when the
// mouse is moved, and update the label entity when the
// mouse is over a Cesium3DTileFeature
const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
handler.setInputAction(function (movement) {
  let tooltipText = "";
  const picked = viewer.scene.pick(movement.endPosition);

  const feature = obtainFeature(picked);
  tooltipText += createFeatureHtml("Feature", feature);

  const screenX = movement.endPosition.x;
  const screenY = movement.endPosition.y;
  showTooltip(screenX, screenY, tooltipText);
}, ScreenSpaceEventType.MOUSE_MOVE);

createTileset("MultipleFeatureIdsAndProperties");

