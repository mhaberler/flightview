import { RadialGauge, LinearGauge } from 'canvas-gauges';
import './css/gauges.css';
  if (defined(instruments) ) {
    headingDiv = new RadialGauge({
      renderTo: 'heading',
      width: 200,
      height: 200,
      minValue: 0,
      maxValue: 360,
      majorTicks: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'],
      minorTicks: 2,
      ticksAngle: 360,
      startAngle: 180,
      strokeTicks: false,
      highlights: false,
      colorPlate: '#21216F' /* blue plate color : #33a */,
      colorMajorTicks: '#f5f5f5',
      colorMinorTicks: '#ddd',
      colorNumbers: '#ccc' /* grey = #ccc */,
      colorNeedle: 'rgba(240, 128, 128, 1)',
      colorNeedleEnd: 'rgba(255, 160, 122, .9)',
      valueBox: false,
      valueTextShadow: false,
      colorNeedleCircleInner: '#fff' /* #fff = white */,
      colorNeedleCircleOuter: '#ccc',
      needleCircleSize: 15,
      needleCircleOuter: false,
      animationRule: 'linear',
      needleType: 'line' /* arrow or line */,
      needleStart: 40 /* 70 - needle tail length */,
      needleEnd: 60 /* 99 - needle head length */,
      needleWidth: 3,
      borders: true,
      borderInnerWidth: 0,
      borderMiddleWidth: 0,
      borderOuterWidth: 10,
      colorBorderOuter: '#ccc',
      colorBorderOuterEnd: '#ccc',
      colorNeedleShadowDown: '#222',
      borderShadowWidth: 0,
      animationTarget: 'plate' /* needle or plate */,
      units: 'ᵍ',
      title: 'Heading',
      fontTitleSize: 19,
      colorTitle: '#f5f5f5',
      animationDuration: 1500,
      value: 360,
      animateOnInit: true,
    }).draw();

    altitudeDiv = new LinearGauge({
      renderTo: 'altitude',
      width: 200,
      height: 60,
      minValue: 0,
      maxValue: 2000,
      majorTicks: ['0', '500', '1000', '1500', '2000'],
      minorTicks: 5,
      strokeTicks: true,
      colorPlate: '#fff',
      borderShadowWidth: 0,
      borders: false,
      barBeginCircle: false,
      tickSide: 'left',
      numberSide: 'left',
      needleSide: 'left',
      needleType: 'line',
      needleWidth: 3,
      colorNeedle: '#222',
      colorNeedleEnd: '#222',
      // colorPlate:  'rgba(0,0,0,0)',

      animationDuration: 1500,
      animationRule: 'linear',
      animationTarget: 'plate',
      barWidth: 5,
      title: 'Altitude m',
      ticksWidth: 50,
      ticksWidthMinor: 15,
    }).draw();

    speedDiv = new LinearGauge({
      renderTo: 'speed',
      width: 200,
      height: 60,
      minValue: 0,
      maxValue: 100,
      majorTicks: [
        '0',
        '20',
        '40',
        '60',
        '80',
        '100',
        // '120',
        // '140',
        // '160'
      ],
      minorTicks: 5,
      strokeTicks: true,
      colorPlate: '#fff',
      borderShadowWidth: 0,
      borders: false,
      barBeginCircle: false,
      tickSide: 'left',
      numberSide: 'left',
      needleSide: 'left',
      needleType: 'line',
      needleWidth: 3,
      colorNeedle: '#222',
      colorNeedleEnd: '#222',
      animationDuration: 1500,
      animationRule: 'linear',
      animationTarget: 'plate',
      barWidth: 5,
      title: 'Speed',
      ticksWidth: 50,
      ticksWidthMinor: 15,
    }).draw();

    temperatureDiv = new LinearGauge({
      renderTo: 'temperature',
      width: 200,
      height: 60,
      minValue: 40,
      maxValue: 140,
      majorTicks: ['40', '60', '80', '100', '120', '140'],
      highlights: [
        {
          from: 80,
          to: 140,
          color: 'rgba(200, 50, 50, .75)',
        },
      ],
      minorTicks: 5,
      strokeTicks: true,
      colorPlate: '#fff',
      borderShadowWidth: 0,
      borders: false,
      barBeginCircle: false,
      tickSide: 'left',
      numberSide: 'left',
      needleSide: 'left',
      needleType: 'line',
      needleWidth: 3,
      colorNeedle: '#222',
      colorNeedleEnd: '#222',
      animationDuration: 1500,
      animationRule: 'linear',
      animationTarget: 'plate',
      barWidth: 5,
      title: 'Temperature °',
      ticksWidth: 50,
      ticksWidthMinor: 15,
    }).draw();
  }

     <div id="toolbar">
        <table>
          <tbody>
            <tr>
              <td>
                <canvas id="heading"
                        data-bind="attr: { 'data-value': heading }"
                        data-type="radial-gauge"
                        data-width="200"
                        data-height="200"
                        data-min-value="0"
                        data-max-value="360"
                        data-major-ticks="'N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'"
                        data-minor-ticks"2"
                        data-ticks-angle="360"
                        data-start-angle="180"
                        ></canvas>
              </td>
            </tr>
            <tr>
              <td>
                <canvas id="altitude" data-bind="attr: { 'data-value': altitude }"></canvas>
              </td>
            </tr>
            <tr>
              <td>
                <canvas id="speed" data-bind="attr: { 'data-value': speed }"></canvas>
              </td>
            </tr>
            <tr>
              <td>
                <canvas id="temperature" data-bind="attr: { 'data-value': temperature }"></canvas>
              </td>
            </tr>
            <tr>
              <td>
                <div id="burner" class="off"></div>
              </td>
            </tr>
            <tr>
              <td>
                <canvas id="test"
                        data-bind="attr: { 'data-value': altitude }"
                        data-type="linear-gauge"
                        data-width="200"
                        data-height="60"
                        data-minor-ticks="100"
                        data-min-value="0"
                        data-max-value="2000"
                        data-title="m"
                        data-major-ticks="0, 500, 1000, 1500, 2000"
                ></canvas>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
