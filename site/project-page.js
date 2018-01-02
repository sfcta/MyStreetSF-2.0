'use strict';

// use npm and babel to support IE11/Safari
import 'babel-polyfill';
import 'isomorphic-fetch';

let theme = "light";

let url = 'https://api.mapbox.com/styles/v1/mapbox/'+theme+'-v9/tiles/256/{z}/{x}/{y}?access_token={accessToken}';
let token = 'pk.eyJ1IjoicHNyYyIsImEiOiJjaXFmc2UxanMwM3F6ZnJtMWp3MjBvZHNrIn0._Dmske9er0ounTbBmdRrRQ';
let attribution ='<a href="http://openstreetmap.org">OpenStreetMap</a> | ' +
                 '<a href="http://mapbox.com">Mapbox</a>';

function styleByMetricColor(icon_name, polygon) {
  let xcolor = generateColorFromDb(icon_name);
  let radius = 4;
  if (icon_name && icon_name.startsWith('measle')) radius = 8;
  return {color: xcolor, fillColor:"#88e", weight: (polygon ? 0 : 4), fillOpacity:0.4, opacity: 1.0, radius: radius};
}

function generateColorFromDb(icon_name) {
  console.log(icon_name);
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

function addProjectLayer(id, geometry, shape, icon) {

  let kml = '<kml xmlns="http://www.opengis.net/kml/2.2">'
             + '<Placemark>' + geometry + '</Placemark></kml>';

  let polygon = false;
  if (shape && shape.includes('Polygon')) polygon = true;

  let geoLayer = L.geoJSON(null, {
    style: styleByMetricColor(icon, polygon),
    pointToLayer: function(feature,latlng) {  // this turns 'points' into circles
      return L.circleMarker(latlng, {id:id});
    },
  });

  // hang onto the data
  geoLayer.options.id = id;
  // _cache[id] = segment;

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
    console.log(layer);
    mymap.fitBounds(layer.getBounds(), {padding: [10,10]});
    // _layers[id] = layer;
  } catch (e) {
    console.log('couldnt: '+e);
  }
}

// ---- start running things here:
let mymap = L.map('zoom-map', {
  zoomControl: false,
  zoomAnimation: false,
}).setView([37.77, -122.42], 11);

L.tileLayer(url, {
  accessToken:token,
  attribution:attribution,
  maxZoom: 18,
}).addTo(mymap);

// add the layer data
let thisScript = $('script[src*="project-page.bundle.js"]');
let project = thisScript.attr('project_id');
let geometry = thisScript.attr('geometry');
let shape = thisScript.attr('feature_shape');
let icon = thisScript.attr('icon');

if (project) addProjectLayer(project, geometry, shape, icon);

