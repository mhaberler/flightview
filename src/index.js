import {
  Cartesian3,
  Cartographic,
  Credit,
  CzmlDataSource,
  GeoJsonDataSource,
  HeadingPitchRoll,
  Ion,
  KmlDataSource,
  Math as CM,
  ProviderViewModel,
  Quaternion as Q,
  Rectangle,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  TileMapServiceImageryProvider,
  Transforms,
  VelocityOrientationProperty,
  VelocityVectorProperty,
  Viewer,
  WebMapTileServiceImageryProvider,
  createDefaultImageryProviderViewModels,
  createWorldTerrain,
  defined,
  formatError,
  objectToQuery,
  queryToObject,
  viewerCesiumInspectorMixin,
  viewerDragDropMixin,
  buildModuleUrl,
  JulianDate,
  knockout as ko,
  Ellipsoid,
  ConstantProperty,
  CesiumTerrainProvider,
  createDefaultTerrainProviderViewModels,
  IonResource,
  TimeStandard,
} from 'cesium';

import CesiumNavigation from 'cesium-navigation-es6';

import 'cesium/Build/Cesium/Widgets/widgets.css';
import './css/main.css';
import './css/mah.css';
// import './css/CesiumViewer.css';
// import './css/burner.css';

import $ from 'jquery';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import formatcoords from 'formatcoords';

import { SensorValueTable, wksensors } from './sensorValues';

// The URL on your server where CesiumJS's static files are hosted.
window.CESIUM_BASE_URL = '/';

function startup() {
  /*
     Options parsed from query string:
     source=url          The URL of a CZML/GeoJSON/KML data source to load at startup.
     Automatic data type detection uses file extension.
     sourceType=czml/geojson/kml
     Override data type detection for source.
     flyTo=false         Don't automatically fly to the loaded source.
     tmsImageryUrl=url   Automatically use a TMS imagery provider.
     lookAt=id           The ID of the entity to track at startup.
     stats=true          Enable the FPS performance display.
     inspector=true      Enable the inspector widget.
     debug=true          Full WebGL error reporting at substantial performance cost.
     theme=lighter       Use the dark-text-on-light-background theme.
     scene3DOnly=true    Enable 3D only mode.
     view=longitude,latitude,[height,heading,pitch,roll]
     Automatically set a camera view. Values in degrees and meters.
     [height,heading,pitch,roll] default is looking straight down, [300,0,-90,0]
     nosave              do not update the animation in the URL when it changes.

     mah extensions:

     noclearondrop   # do not clear datasources on drop
     imagery=<number>
     viewFrom=angle (deg), horizontal distance, vertical distance (m)
     autostart
     nav       add navigator mixin
     instruments
     multiplier=60 # clockspeed override

     turn on velocity orientation for a vehicle (like a plane=):
     velocityorient=<vehicleid1>&velocityorient=<vehicleid2>
     example: velocityorient=track0

     needed:
     currentTime=<isotime> warp timeline
     stop=<isotime> warp timeline
     traj=url

     Vehicle orientation cases, per track:

     1) fixed vertical - balloon: default case - works
     2) velocity orientation - if requested via velocityorient=<vehicleid1> - works
     3) hpr orientation from czml - if present in properties

     Default lookat/selection:
     determine set of animatable entities:  must have positions, epoch -> array
     if only one, select that and lookat

     instruments:
     if &instruments given
     if selected entity:
     display panel
     update values
     else:
     hide panel
     see https://stackoverflow.com/questions/65788440/cesium-trigger-event-when-a-point-is-selected

   */

  const tmpc3 = new Cartesian3();
  const tmpQ = new Q();
  const tmpCarto = new Cartographic();
  const tmpHPR = new HeadingPitchRoll();
  let splitQuery;
  let viewFromC3; // = viewFromAngleHdistVdist(220, 400, 150);
  let viewer;
  let lastClockTick = JulianDate.now();
  const updateEvery = 0.5; // flight parameter widgets update rate
  const toolbar = document.getElementById('toolbar');
  const loadingIndicator = document.getElementById('loadingIndicator');
  let flightData = {}; // of viewer.selectedEntity
  let selectedTerrain = 1;
  const warpto = new JulianDate();

  Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3YmJlMzAyYy1hZTY4LTQ4OTUtYTIxMS02NTBlYzc1MDcxNTAiLCJpZCI6MTQ0MjAsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1NjU0NzE5Mzl9.j9eQVA5txZG-lRmcUBEwgzRuAWzd0fPxgf5LmM_xNLU';

  toolbar.style.display = 'none';

  const endUserOptions = queryToObject(window.location.search.substring(1));
  const {
    autostart, multiplier, instruments, view, source, debug, nav, velocityorient, terrain,
    noclearondrop, nosave, imagery, shadows, instructions,
    atmosphere,
  } = endUserOptions;

  const showLoadError = function show(name, error) {
    const title = `An error occurred while loading the file: ${name}`;
    const message = 'An error occurred while loading the file, which may indicate that it is invalid.  A detailed error report is below:';
    viewer.cesiumWidget.showErrorPanel(title, message, error);
  };

  function setViewFromC3(viewFrom) {
    if (defined(viewFrom)) {
      // viewFrom=angle (deg), horizontal distance and vertical distance
      splitQuery = viewFrom.split(/[ ,]+/);
      if (splitQuery.length === 3) {
        const angle = !Number.isNaN(+splitQuery[0]) ? CM.toRadians(+splitQuery[0]) : 0.0;
        const hDistance = !Number.isNaN(+splitQuery[1]) ? +splitQuery[1] : 100.0;
        const vDistance = !Number.isNaN(+splitQuery[2]) ? +splitQuery[2] : 50.0;
        viewFromC3 = viewFromAngleHdistVdist(angle, hDistance, vDistance);
        console.log('custom viewFrom:', viewFromC3);
      }
    }
  }

  function setCameraFromViewArgument(view) {
    if (defined(view)) {
      splitQuery = view.split(/[ ,]+/);
      if (splitQuery.length > 1) {
        const longitude = !Number.isNaN(+splitQuery[0]) ? +splitQuery[0] : 0.0;
        const latitude = !Number.isNaN(+splitQuery[1]) ? +splitQuery[1] : 0.0;
        const height = splitQuery.length > 2 && !Number.isNaN(+splitQuery[2])
          ? +splitQuery[2]
          : 300.0;
        const hdng = splitQuery.length > 3 && !Number.isNaN(+splitQuery[3])
          ? CM.toRadians(+splitQuery[3])
          : undefined;
        const pitch = splitQuery.length > 4 && !Number.isNaN(+splitQuery[4])
          ? CM.toRadians(+splitQuery[4])
          : undefined;
        const roll = splitQuery.length > 5 && !Number.isNaN(+splitQuery[5])
          ? CM.toRadians(+splitQuery[5])
          : undefined;
        console.log('setCameraFromViewArgument pos=', longitude, latitude, height);
        console.log('setCameraFromViewArgument hpr=', CM.toDegrees(hdng), CM.toDegrees(pitch), CM.toDegrees(roll));
        viewer.camera.setView({
          destination: Cartesian3.fromDegrees(longitude, latitude, height),
          orientation: {
            hdng,
            pitch,
            roll,
          },
        });
      }
    }
  }

  async function dataSourceLoaded(dataSource) {
    console.log('dataSourceLoaded:', dataSource);

    hidePredefCells();
    const entities = dataSource.entities.values;

    // handle velocityorient=<vehicleid1>&velocityorient=<vehicleid2>
    // or entity.properties.velocity_orient bool in the czml source
    for (let i = 0; i < entities.length; i += 1) {
      const entity = entities[i];
      const { properties } = entity;
      if ((defined(velocityorient) && endUserOptions.velocityorient.includes(entity.id))
          || (!!properties?.velocity_orient.valueOf() === true)) {
        entity.orientation = new VelocityOrientationProperty(entity.position);
        console.log('velocity-orient:', entity.id);
      }
    }
    const { lookAt, view } = endUserOptions;

    if (defined(lookAt)) {
      const entity = dataSource.entities.getById(lookAt);
      if (defined(entity)) {
        /* if (defined(viewFromC3)) {
         *   entity.viewFrom = viewFromC3;
         *   console.log('----viewFrom:', entity.viewFrom);
         * } */
        viewer.trackedEntity = entity;
        viewer.selectedEntity = entity;
        toolbar.style.display = 'block';
      } else {
        const error = `No entity with id ${lookAt} exists in the provided data source.`;
        showLoadError(dataSource.name, error);
      }
    } else if (defined(view)) {
      setCameraFromViewArgument(view);
    } else if (endUserOptions.flyTo !== 'false') {
      viewer.flyTo(dataSource);
    }

    if (defined(multiplier)) {
      viewer.clock.multiplier = parseFloat(multiplier);
    }
    if (defined(endUserOptions.startAt)) {
      JulianDate.addSeconds(viewer.clock.startTime, parseFloat(endUserOptions.startAt), warpto);
      viewer.clock.currentTime = warpto;
      // viewer.timeline.zoomTo(warpto, viewer.clock.stopTime);
    }
    // setViewFromC3(endUserOptions.viewFrom);
    loadingIndicator.style.display = 'none';
    lastClockTick = viewer.clock.startTime;
  } /* dataSourceLoaded */

  let imageryProvider;
  if (defined(endUserOptions.tmsImageryUrl)) {
    imageryProvider = new TileMapServiceImageryProvider({
      url: endUserOptions.tmsImageryUrl,
    });
  }
  const imageryViewModels = createDefaultImageryProviderViewModels();

  // https://github.com/CesiumGS/cesium/blob/master/Apps/Sandcastle/standalone.html
  // since we're fiddling the href
  buildModuleUrl.getCesiumBaseUrl();

  imageryViewModels.push(
    new ProviderViewModel({
      name: 'Austria Basemap',
      iconUrl: 'http://www.geoland.at/assets/images/IndexGrid/basemap_hover_en.png',
      tooltip: 'Austrian OGD Basemap.\nhttps://www.basemap.at/index_en.html',
      creationFunction() {
        return new WebMapTileServiceImageryProvider({
          url: 'https://maps{s}.wien.gv.at/basemap/bmaporthofoto30cm/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpeg',
          layer: 'bmaporthofoto30cm',
          style: 'normal',
          format: 'image/jpeg',
          tileMatrixSetID: 'google3857',
          subdomains: '1234',
          maximumLevel: 19,
          rectangle: Rectangle.fromDegrees(8.782379, 46.35877, 17.5, 49.037872),
          credit: new Credit(
            '<a href="https://www.basemap.at/" target="_blank">Datenquelle: basemap.at</a>',
            true,
          ),
        });
      },
    }),
  );
  // Select one from the existing list to be currently active.
  let selectedImagery;
  if (defined(imagery)) {
    selectedImagery = imageryViewModels[imagery];
  } else {
    [selectedImagery] = imageryViewModels;
  }

  const terrainViewModels = createDefaultTerrainProviderViewModels();

  // self-hosted
  terrainViewModels.push(
    new ProviderViewModel({
      name: 'Sonny Austria 10m DEM qmesh@mah',
      iconUrl: 'https://data.opendataportal.at/img/odp-logo.png',
      tooltip: 'Sonny 10m DEM',
      category: 'Other',
      creationFunction: () => new CesiumTerrainProvider({
        url: 'https://static.mah.priv.at/tilesets/austria-10m-sonnyy',
        requestWaterMask: true,
        requestVertexNormals: true,
        credit: new Credit('<a href="https://data.opendataportal.at/dataset/dtm-austria" target="_blank">Source: Austria 10m DEM by Sonny</a>',
          true),
      }),
    }),
  );

  // self-hosted
  terrainViewModels.push(
    new ProviderViewModel({
      name: 'Steiermark SE 1m Surface',
      iconUrl: 'https://data.opendataportal.at/img/odp-logo.png', // Cesium.buildModuleUrl('Widgets/Images/TerrainProviders/STK.png'),
      tooltip: 'Steiermark SE 1m DSM',
      category: 'Other',
      creationFunction: () => new CesiumTerrainProvider({
        url: 'https://static.mah.priv.at/tilesets/dhm-1m-stmk-se',
        requestWaterMask: true,
        requestVertexNormals: true,
        credit: new Credit('<a href="https://data.opendataportal.at/dataset/dtm-austria" target="_blank">Source: Austria 10m DEM by Sonny</a>',
          true),
      }),
    }),
  );

  // self-hosted
  terrainViewModels.push(
    new ProviderViewModel({
      name: 'Steiermark SE 1m Terrain',
      iconUrl: 'https://data.opendataportal.at/img/odp-logo.png', // Cesium.buildModuleUrl('Widgets/Images/TerrainProviders/STK.png'),
      tooltip: 'Steiermark SE 1m DTM',
      category: 'Other',
      creationFunction: () => new CesiumTerrainProvider({
        url: 'https://static.mah.priv.at/tilesets/dgm-1m-stmk-se',
        requestWaterMask: true,
        requestVertexNormals: true,
        credit: new Credit('<a href="https://data.opendataportal.at/dataset/dtm-austria" target="_blank">Source: Austria 10m DEM by Sonny</a>',
          true),
      }),
    }),
  );

  if (defined(terrain) && !Number.isNaN(terrain)) {
    selectedTerrain = parseInt(terrain, 10);
  }

  try {
    const hasBaseLayerPicker = !defined(imageryProvider);
    viewer = new Viewer('cesiumContainer', {
      imageryProviderViewModels: imageryViewModels,
      selectedImageryProviderViewModel: selectedImagery,
      imageryProvider,
      terrainProviderViewModels: terrainViewModels,
      selectedTerrain: terrainViewModels[selectedTerrain],
      baseLayerPicker: hasBaseLayerPicker,
      scene3DOnly: endUserOptions.scene3DOnly,
      selectionIndicator: false, // Disable selection indicator
      infoBox: true, // Disable InfoBox widget
      shadows: defined(shadows),
      navigationInstructionsInitiallyVisible: defined(instructions),
      SkyAtmosphere: defined(atmosphere),
      requestRenderMode: true,
      geocoder: true,
      homeButton: false,
      vrButton: true,
      shouldAnimate: !!(defined(autostart)),
    });

    if (hasBaseLayerPicker) {
      const { viewModel } = viewer.baseLayerPicker;
      viewModel.selectedTerrain = viewModel.terrainProviderViewModels[selectedTerrain];
    } else {
      viewer.terrainProvider = createWorldTerrain({
        requestWaterMask: true,
        requestVertexNormals: true,
      });
    }
  } catch (exception) {
    loadingIndicator.style.display = 'none';
    const message = formatError(exception);
    console.error(message);
    if (!document.querySelector('.cesium-widget-errorPanel')) {
      // eslint-disable-next-line no-alert
      window.alert(message);
    }
    return;
  }

  viewer.extend(viewerDragDropMixin, { clearOnDrop: !defined(noclearondrop) });
  if (defined(endUserOptions.inspector)) {
    viewer.extend(viewerCesiumInspectorMixin);
  }

  viewer.selectedEntityChanged.addEventListener((selectedEntity) => {
    if (defined(selectedEntity)) {
      console.log('Selected ', selectedEntity.name);
      endUserOptions.lookAt = selectedEntity.id;
      viewer.trackedEntity = selectedEntity;
      // selectedEntity.viewFrom = viewFromC3;

      const {
        position, orientation, properties, model,
      } = selectedEntity;

      if (!defined(model) || !defined(position)) {
        return;
      }
      flightData.svt = new SensorValueTable(wksensors);

      // the knockout viewModel
      const v = {};

      // track only entities with models
      if (defined(position)) {
        flightData.svt.addValue('foo', 'FooValue', 2, 'parsec');

        v.altitude = ko.observable(0).extend({ numeric: 0 });
        v.lat = ko.observable(0).extend({ numeric: 6 });
        v.lon = ko.observable(0).extend({ numeric: 6 });

        v.location = ko.computed(() => formatcoords(v.lat(), v.lon()).format('Xd'), v);

        if (!position.isConstant) {
          // if positon varies, we have speed and course

          flightData.velocityVector = new VelocityVectorProperty(position, false);
          v.speed = ko.observable(0).extend({ numeric: 0 });

          // the entity might already have a orientation property
          // due to the velocityorient=<vehicleid1> args (a VelocityOrientationProperty)
          // or orientation proper coming via Quaternions in czml,
          // in which case we use that

          if (orientation instanceof VelocityOrientationProperty) {
            flightData.velocityOrientation = selectedEntity.orientation;
          } else {
            flightData.velocityOrientation = new VelocityOrientationProperty(position);
          }
          v.heading = ko.observable(0).extend({ numeric: 0 });
          v.pitch = ko.observable(0).extend({ numeric: 0 });
          v.roll = ko.observable(0).extend({ numeric: 0 });
          v.course = ko.observable(0).extend({ numeric: 0 });
        }
      }

      if (defined(properties)) {
        // add all user-defined properties to this entity's view model
        properties.propertyNames.forEach((name) => {
          if (!(properties[name] instanceof ConstantProperty)) {
            addFlightProperty(v, name);
          }
        });
      }
      flightData.viewModel = v;
      ko.cleanNode(toolbar);
      ko.applyBindings(flightData.viewModel, toolbar);

      // show toolbar
      toolbar.style.display = 'block';
    } else {
      console.log('Deselected.');
      delete endUserOptions.lookAt;
      ko.cleanNode(toolbar);
      flightData = {}; // clear current observations
      // hide toolbar
      toolbar.style.display = 'none';
    }
  });

  viewer.clock.onTick.addEventListener((clock) => {
    // clamp update rate
    if (lastClockTick.equalsEpsilon(clock.currentTime, updateEvery * clock.multiplier)) {
      return;
    }
    lastClockTick = clock.currentTime;

    // display parameters only for selected entity
    if (!viewer.selectedEntity) {
      return;
    }

    const { position, orientation, properties } = viewer.selectedEntity;
    const { viewModel, velocityVector, velocityOrientation } = flightData;

    if (defined(position)) {
      const c = position.getValue(clock.currentTime);
      if (defined(c)) {
        Cartographic.fromCartesian(c, Ellipsoid.WGS84, tmpCarto);
        viewModel.altitude(tmpCarto.height);
        viewModel.lat(CM.toDegrees(tmpCarto.latitude));
        viewModel.lon(CM.toDegrees(tmpCarto.longitude));
      }
    }

    if (defined(orientation)) {
      orientation.getValue(clock.currentTime, tmpQ);
      if (defined(tmpQ)) {
        HeadingPitchRoll.fromQuaternion(tmpQ, tmpHPR);
        viewModel.heading(CM.toDegrees(tmpHPR.heading));
        viewModel.pitch(CM.toDegrees(tmpHPR.pitch));
        viewModel.roll(CM.toDegrees(tmpHPR.roll));
      }
    }

    if (defined(velocityOrientation)) {
      velocityOrientation.getValue(clock.currentTime, tmpQ);
      viewModel.course((CM.toDegrees(Q.computeAngle(tmpQ)) + 180) % 360);
    }

    if (defined(velocityVector)) {
      velocityVector.getValue(clock.currentTime, tmpc3);
      viewModel.speed(Cartesian3.magnitude(tmpc3) * 3.6);
    }

    // update user-defined properties
    if (defined(properties)) {
      properties.propertyNames.forEach((name) => {
        if (!(properties[name] instanceof ConstantProperty)) {
          viewModel[name](properties[name].getValue(clock.currentTime));
        }
      });
    }
  });

  viewer.container.addEventListener('drop', () => {
    /* does not work: */
    loadingIndicator.style.display = 'auto';
  });

  viewer.dropError.addEventListener((viewerArg, name, error) => {
    showLoadError(name, error);
  });

  viewer.scene.globe.tileLoadProgressEvent.addEventListener(() => {
    /* https://stackoverflow.com/questions/67882437/how-to-listen-the-load-event-of-cesium-terrain  */
    if (viewer.scene.globe.tilesLoaded) {
      loadingIndicator.style.display = 'none';
    }
  });

  const { scene } = viewer;
  const { context } = scene;
  if (defined(debug)) {
    context.validateShaderProgram = true;
    context.validateFramebuffer = true;
    context.logShaderCompilation = true;
    context.throwOnWebGLError = true;
  }

  if (defined(source)) {
    let { sourceType } = endUserOptions;
    if (!defined(sourceType)) {
      // autodetect using file extension if not specified
      if (/\.czml$/i.test(source)) {
        sourceType = 'czml';
      } else if (
        /\.geojson$/i.test(source)
        || /\.json$/i.test(source)
        || /\.topojson$/i.test(source)
      ) {
        sourceType = 'geojson';
      } else if (/\.kml$/i.test(source) || /\.kmz$/i.test(source)) {
        sourceType = 'kml';
      }
    }

    let loadPromise;
    if (sourceType === 'czml') {
      loadPromise = CzmlDataSource.load(source);
    } else if (sourceType === 'geojson') {
      loadPromise = GeoJsonDataSource.load(source);
    } else if (sourceType === 'kml') {
      loadPromise = KmlDataSource.load(source, {
        camera: scene.camera,
        canvas: scene.canvas,
      });
    } else {
      showLoadError(source, 'Unknown format.');
    }

    //    setViewFromC3(endUserOptions.viewFrom);

    if (defined(loadPromise)) {
      viewer.dataSources.add(loadPromise).then((dataSource) => {
        dataSourceLoaded(dataSource);
      }).otherwise((error) => {
        showLoadError(source, error);
      });
    }
  }

  if (endUserOptions.stats) {
    scene.debugShowFramesPerSecond = true;
  }

  const { theme } = endUserOptions;
  if (defined(theme)) {
    if (endUserOptions.theme === 'lighter') {
      document.body.classList.add('cesium-lighter');
      viewer.animation.applyThemeChanges();
    } else {
      const error = `Unknown theme: ${theme}`;
      viewer.cesiumWidget.showErrorPanel(error, '');
    }
  }

  setCameraFromViewArgument(view);

  const { camera } = viewer;
  function saveState() {
    const position = camera.positionCartographic;
    let hpr = '';
    if (defined(camera.heading)) {
      hpr = `,${
        CM.toDegrees(camera.heading)
      },${
        CM.toDegrees(camera.pitch)
      },${
        CM.toDegrees(camera.roll)}`;
    }
    endUserOptions.view = `${CM.toDegrees(position.longitude)
    },${
      CM.toDegrees(position.latitude)
    },${
      position.height
    }${hpr}`;
    endUserOptions.multiplier = viewer.clock.multiplier;
    endUserOptions.startAt = JulianDate.secondsDifference(viewer.clock.currentTime,
      viewer.clock.startTime);
    endUserOptions.imagery = imageryViewModels.indexOf(viewer.baseLayerPicker.viewModel.selectedImagery);
    endUserOptions.terrain = terrainViewModels.indexOf(viewer.baseLayerPicker.viewModel.selectedTerrain);
    if (viewer.clockViewModel.shouldAnimate) {
      endUserOptions.autostart = true;
    } else {
      delete endUserOptions.autostart;
    }
    history.replaceState(undefined, '', `?${objectToQuery(endUserOptions)}`);
  }

  if (!defined(nosave)) {
    window.setInterval(saveState, 1000);
  }

  viewer.dataSources.dataSourceAdded.addEventListener((
    collection,
    dataSource,
  ) => {
    dataSourceLoaded(dataSource);
  });

  if (defined(nav)) {
    const options = {};
    // options.defaultResetView = Rectangle.fromDegrees(80, 22, 130, 50);
    options.enableCompass = true;
    options.enableZoomControls = true;
    options.enableDistanceLegend = true;
    options.enableCompassOuterRing = true;

    CesiumNavigation(viewer, options);
  }
}

function fixCell(viewModel, name, unit, decimals) {
  if (defined(decimals)) {
    viewModel[name] = ko.observable(0).extend({ numeric: decimals });
  } else {
    viewModel[name] = ko.observable(0);
  }
  const row = document.getElementById(`${name}Row`);
  row.classList.remove('hiddenRow');
  const cell = document.getElementById(name);
  cell.innerHTML = `<span data-bind="text: ${name}"></span>${unit}`;
}

function hidePredefCells() {
  const cells = ['temperatureRow', 'burnersRow'];
  cells.forEach((name) => {
    document.getElementById(name).classList.add('hiddenRow');
  });
}

function addFlightProperty(viewModel, name) {
  if (name === 'temperature') {
    fixCell(viewModel, name, '&deg;', 0);
    return;
  }
  if (name === 'burners') {
    fixCell(viewModel, name, '', 0);
    return;
  }
  const table = document.getElementById('sensortable');
  const tr = table.insertRow(-1);
  tr.innerHTML = `<tr>
              <td>${name}:</td>
              <td class="sensorvalue"> <span data-bind="text: ${name}"></span></td>
            </tr>`;
  viewModel[name] = ko.observable(0);
}

function viewFromAngleHdistVdist(angle, hDistance, vDistance) {
  return new Cartesian3(-Math.sin(angle) * hDistance, -Math.cos(angle) * hDistance, vDistance);
}

// https://knockoutjs.com/documentation/extenders.html

ko.extenders.numeric = function (target, precision) {
  // create a writable computed observable to intercept writes to our observable
  const result = ko.pureComputed({
    read: target, // always return the original observables value
    write(newValue) {
      const current = target();
      const roundingMultiplier = Math.pow(10, precision);
      const newValueAsNum = isNaN(newValue) ? 0 : +newValue;
      const valueToWrite = Math.round(newValueAsNum * roundingMultiplier) / roundingMultiplier;

      // only write if it changed
      if (valueToWrite !== current) {
        target(valueToWrite);
      } else {
        // if the rounded value is the same, but a different value was written,
        // force a notification for the current field
        if (newValue !== current) {
          target.notifySubscribers(valueToWrite);
        }
      }
    },
  }).extend({ notify: 'always' });

  // initialize with current value to make sure it is rounded appropriately
  result(target());

  // return the new computed observable
  return result;
};

startup();
