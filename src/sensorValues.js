import {
  defined,
} from 'cesium';

const wksensors = {
  course: {
    tag: 'Course:',
    digits: 0,
    unit: '&deg;',
  },
  altitude: {
    tag: 'Alt:',
    digits: 0,
    unit: 'm',
  },
  agl: {
    tag: 'AGL:',
    digits: 0,
    unit: 'm',
  },
  speed: {
    tag: 'Speed:',
    digits: 0,
    unit: 'km/h',
  },
  location: {
    tag: 'Location:',
  },
  temperature: {
    tag: 'Env',
    digits: 0,
    unit: '&deg;',
  },
  burners: {
    tag: 'Burn',
    digits: 0,
  },
};

function SensorValueTable(wks) {
  this._wks = { ...wks };
}

SensorValueTable.prototype.addValue = function addValue(name, tag, digits, unit) {
  this._wks[name].tag = tag;
  this._wks[name].digits = digits;
  this._wks[name].unit = unit;
};

SensorValueTable.prototype.addValue = function set(name, value) {
  if (defined(this._wks[name])) {
    console.log('defined: ', name, value);
  }
};

SensorValueTable.prototype.tackOnto = function tackOnto(element) {

};

export { SensorValueTable, wksensors };
