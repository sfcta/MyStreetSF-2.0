'use strict';

// Must use npm and babel to support IE11/Safari
import 'babel-polyfill';
import 'isomorphic-fetch';
import 'lodash';

var maplib = require('../jslib/maplib');
let styles = maplib.styles;
let getLegHTML = maplib.getLegHTML;
let getColorFromVal = maplib.getColorFromVal;
let mymap = maplib.sfmap;

mymap.setView([37.768890, -122.440997], 13);

// some important global variables.
const API_SERVER = 'http://api/api/';
const GEO_VIEW = 'mystreet2_all';
const MISSING_COLOR = '#ccc';


let _cache = {};
let _layers = {};
let _selectedProject, _selectedStyle;
let _prevselectedSegment;

function queryServer() {
  const geo_url = API_SERVER + GEO_VIEW;

  fetch(geo_url)
    .then((resp) => resp.json())
    .then(function(jsonData) {

      mapSegments(jsonData);

    }).catch(function(error) {
      console.log("map error: "+error);
  });
}

function mapSegments(cmpsegJson) {

  // add segments to the map by using metric data to color
  for (let segment of cmpsegJson) {

    if (segment['geometry'] == null) continue;

    let id = segment['id'];

    try {

      console.log(segment['geometry']);

      let kml = '<kml xmlns="http://www.opengis.net/kml/2.2">'
                 + '<Placemark>' + segment['geometry'] + '</Placemark></kml>';

      let geoLayer = L.geoJSON(null, {
        style: styleByMetricColor(segment['icon_name']),
        onEachFeature: function(feature, layer) {
          layer.on({ //mouseover: highlightFeature,
                     //mouseout: resetHighlight,
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

      // add KML to the map
      let layer = omnivore.kml.parse(kml, null, geoLayer);
      layer.addTo(mymap);
      _layers[id] = layer;
    } catch (err) {
      console.log("--------\nerror adding segment to map.");
      console.log(id);
      console.log(segment);
      // hrrrm
    }
  }

  mymap.on('popupclose', function(e) {
    popupClosed();
  });
}

function popupClosed() {
  // Remove highlight from previous selection
  if (_selectedProject) _selectedProject.setStyle(_selectedStyle);
}


function styleByMetricColor(icon_name) {
  let xcolor = generateColorFromDb(icon_name);
  return {color: xcolor, weight: 4, fillOpacity:0.4, opacity: 1.0, radius: icon_name.startsWith('measle')? 8:4};
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
    case 'small_yellow': return '#dd3';
    case 'measle_turquoise': return '#369';
    default: return defaultColor;
  }
  return defaultColor;
}

function highlightFeature(e) {
  let highlightedGeo = e.target;
  highlightedGeo.bringToFront();

  console.log(highlightedGeo);

  if(highlightedGeo.feature.cmp_segid != selGeoId) {
    highlightedGeo.setStyle(styles.selected);
    let geo = e.target.feature;
    let popupText = "<b>"+geo.cmp_name+" "+geo.direction+"-bound</b><br/>" +
                  geo.cmp_from + " to " + geo.cmp_to;
    popHoverSegment = L.popup()
                    .setLatLng(e.latlng)
                    .setContent(popupText)
                    .openOn(mymap);
  }
}

function resetHighlight(e) {
  popHoverSegment.remove();
  // if (e.target.feature.cmp_segid != selGeoId) geoLayer.resetStyle(e.target);
  geoLayer.resetStyle(e.target);
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

    let details = prj['project_details_page'];
    if (details) details = '<br/><a target="_blank" href="' + details + '">&raquo; Go to Project Page</a>';

    let popupText = '<h5 style="color:black;">' + prj['project_name'] + '</h5><hr/>'
                    + '<b>Category: ' + prj['new_project_type'] + '</b><br/>'
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

  console.log(id);

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
    _selectedStyle = {color:z.color, fill:z.fill, radius:z.radius, weight:z.weight};
  }

  _selectedProject = e.target;

  e.target.setStyle(styles.popup);
  showPopup(id, e.latlng);
}


let app = new Vue({
  el: '#panel',
  delimiters: ['${', '}'],
  data: {
    isAMActive: true,
    isPMActive: false,
    sliderValue: 0,
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
