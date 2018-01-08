'use strict';

// use npm and babel to support IE11/Safari
import 'babel-polyfill';
import 'isomorphic-fetch';

var maplib = require('./maplib');

let styles = maplib.styles;
let getLegHTML = maplib.getLegHTML;
let getColorFromVal = maplib.getColorFromVal;

let mymap = maplib.sfmap;
mymap.zoomControl.setPosition('bottomleft');

const MISSING_COLOR = '#ccc';

// some important global variables.
const API_SERVER = 'https://api.sfcta.org/api/';
const GEO_VIEW = 'mystreet2_sample';

// hard code a few of the giant areas so they stay on the bottom layer of the map
const _bigAreas = [407, 477, 79, 363, 366, 17];

let _cache = {};
let _layers = {};
let _selectedProject, _selectedStyle;
let _prevselectedSegment;
let _bounds;

async function queryServer() {
  const geo_url = API_SERVER + GEO_VIEW;

  try {
    let resp = await fetch(geo_url);
    let jsonData = await resp.json();
    mapSegments(jsonData);
  } catch (error) {
    console.log("map error: "+error);
  }
}

// add segments to the map by using metric data to color
function mapSegments(cmpsegJson) {

  for (let segment of cmpsegJson) {

    if (segment['geometry'] == null) continue;

    let id = segment['id'];

    let kml = '<kml xmlns="http://www.opengis.net/kml/2.2">'
               + '<Placemark>' + segment['geometry'] + '</Placemark></kml>';

    let polygon = false;
    if (segment['shape'] && segment['shape'].includes('Polygon')) polygon = true;

    let geoLayer = L.geoJSON(null, {
      style: styleByMetricColor(segment['icon_name'], polygon),
      onEachFeature: function(feature, layer) {
        layer.on({ mouseover: hoverFeature,
                   mouseout: unHoverFeature,
                   click : clickedOnFeature,
        });
      },
      pointToLayer: function(feature,latlng) {  // this turns 'points' into circles
        return L.circleMarker(latlng, {id:id});
      },
    });

    // hang onto the data
    geoLayer.options.id = id;
    _cache[id] = segment;

    // validate KML
    var oParser = new DOMParser();
    var oDOM = oParser.parseFromString(kml, "text/xml");
    // print the name of the root element or error message
    if (oDOM.documentElement.nodeName == "parsererror") console.log('## Error while parsing row id '+id);

    // add KML to the map
    try {
      let layer = omnivore.kml.parse(kml, null, geoLayer);
      layer.addTo(mymap);
      if (polygon) layer.bringToBack();
      _layers[id] = layer;

      // how big is your map?
      if (!_bounds) _bounds = layer.getBounds();
      _bounds.extend(layer.getBounds());

    } catch (e) {
      console.log('couldnt: '+id);
      console.log(segment);
    }
  }

  mymap.fitBounds(_bounds);

  // Hard-coded giant polygons -- send to back.
  for (let giantArea of _bigAreas) {
    if (_layers[giantArea]) _layers[giantArea].bringToBack();
    console.log('bring to back: ' + giantArea);
  }


  mymap.on('popupclose', function(e) {
    popupClosed();
  });
}

function popupClosed() {
  // Remove highlight from previous selection
  if (_selectedProject) _selectedProject.setStyle(_selectedStyle);
}

function styleByMetricColor(icon_name, polygon) {
  let xcolor = generateColorFromDb(icon_name);
  let radius = 4;
  if (icon_name && icon_name.startsWith('measle')) radius = 8;
  return {color: xcolor, fillColor:"#88e", weight: (polygon ? 0 : 4), fillOpacity:0.4, opacity: 1.0, radius: radius};
}

function generateColorFromDb(icon_name) {
  let defaultColor = '#44c';

  // no color? use blue.
  if (!icon_name) return defaultColor;

  // color code in db? use it.
  if (icon_name.startsWith('#')) return icon_name;

  // icon name in db? convert to a color code.
  switch (icon_name) {
    case 'small_blue': return '#44f';
    case 'small_green': return '#4f4';
    case 'small_purple': return '#63c';
    case 'small_red': return '#f44';
    case 'small_yellow': return '#aa3';
    case 'measle_turquoise': return '#369';
    default: return defaultColor;
  }
  return defaultColor;
}

function showPopup(id, latlng) {
    let prj = _cache[id];

    let district = '';
    if (prj['district1']) district += '1, ';
    if (prj['district2']) district += '2, ';
    if (prj['district3']) district += '3, ';
    if (prj['district4']) district += '4, ';
    if (prj['district5']) district += '5, ';
    if (prj['district6']) district += '6, ';
    if (prj['district7']) district += '7, ';
    if (prj['district8']) district += '8, ';
    if (prj['district9']) district += '9, ';
    if (prj['district10']) district += '10, ';
    if (prj['district11']) district += '11, ';
    if (district) {
      district = 'District ' + district.slice(0,-2);
    } else {
      district = 'Citywide';
    }

    let cost = prj['project_cost_estimate']
    if (cost && cost.trim().endsWith('.00')) cost = cost.trim().slice(0,-3);

    // generate permalink
    let permalink = prj['project_number'].toLowerCase();
    let url = `/projects/${permalink}/`;

    let details = '<br/>' +
      '<a href="' + url + '">' +
      '&raquo; More details&hellip;</a>';

    let pType = (prj['new_project_type'] ? prj['new_project_type'] : "N/A" );

    let popupText = '<h5 style="color:black;">' + prj['project_name'] + '</h5><hr/>'
                    + '<b>Category: ' + pType + '</b><br/>'
                    + district + '<br/>'
                    + cost + '<hr/>'
                    + prj['description'] + '<br/>'
                    + details
                    + '<hr/>'

    let popup = L.popup().setLatLng(latlng)
             .setContent(popupText);

    popup.openOn(mymap);
}

function clickedOnFeature(e) {
  // For some reason, Leaflet handles points and polygons
  // differently, hence the weirdness for fetching the id of the selected feature.
  let id = e.target.options.id;
  if (!id) id = e.layer.options.id;

  console.log(e);
  console.log(id);
  console.log(e.target._bounds);

  // Remove highlight from previous selection
  if (_selectedProject) {
    _selectedProject.setStyle(_selectedStyle);
  }

  // Add highlight to current selection
  _selectedStyle = e.target.options.style;
  try {
    if (!_selectedStyle) _selectedStyle = e.layer.options.style;
    if (!_selectedStyle) _selectedStyle = JSON.parse(JSON.stringify(e.layer.options));
  } catch(err) {
    // hmm
    let z = e.target.options;
    _selectedStyle = {color:z.color, fillColor:z.fillColor, radius:z.radius, weight:z.weight};
  }

  _selectedProject = e.target;

  let clickedStyle = JSON.parse(JSON.stringify(styles.popup));
  clickedStyle['fillColor'] = _selectedStyle.color;
  e.target.setStyle(clickedStyle);

  showPopup(id, e.latlng);
}

let popupTimeout;

function hoverFeature(e) {
  // For some reason, Leaflet handles points and polygons
  // differently, hence the weirdness for fetching the id of the selected feature.
  let id = e.target.options.id;
  if (!id) id = e.layer.options.id;

  // Remove highlight from previous selection
  if (_selectedProject) {
    _selectedProject.setStyle(_selectedStyle);
  }

  // Add highlight to current selection
  let weight = 6;
  _selectedStyle = e.target.options.style;

  try {
    if (!_selectedStyle) _selectedStyle = e.layer.options.style;
    if (!_selectedStyle) {
      _selectedStyle = JSON.parse(JSON.stringify(e.layer.options));
    }
  } catch(err) {
    // hmm
    let z = e.target.options;
    _selectedStyle = {color:z.color, fill:z.fill, radius:z.radius, weight:z.weight};
  }

  let hoverStyle = {'color':_selectedStyle.color, 'fillColor':_selectedStyle.color, "weight": weight, "opacity": 1.0 };

  clearTimeout(popupTimeout);
  popupTimeout = setTimeout( function () {
    e.target.setStyle(hoverStyle);
  }, 50);

  _selectedProject = e.target;

  //app.description = _cache[id].project_name;
}

function unHoverFeature(e) {
  // Remove highlight from previous selection
/*  if (_selectedProject) {
    _selectedProject.setStyle(_selectedStyle);
  }
  */
}


let app = new Vue({
  el: '#panel',
  delimiters: ['${', '}'],
  data: {
    isAMActive: true,
    isPMActive: false,
    sliderValue: 0,
    description: "Choose any project!",
  },
  watch: {
  },
  methods: {
  },
  components: {
  }
});

// ready to go!
queryServer();
