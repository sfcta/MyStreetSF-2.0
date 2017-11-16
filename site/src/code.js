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
const GEO_VIEW = 'mystreet2_sample';
const MISSING_COLOR = '#ccc';


let _cache = {};
let _layers = {};
let _selectedProject;
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

    let kml = '<kml xmlns="http://www.opengis.net/kml/2.2"><Placemark>'
               + segment['geometry']
               + '</Placemark></kml>';

    //update segment json with metric data (to be used to assign color)
    let id = segment['id'];
    segment["project_id"] = id;

    if (segment['geometry'] == null) continue;

    let geoLayer = L.geoJSON(null, {
      style: styleByMetricColor(segment['icon_name']),
      onEachFeature: function(feature, layer) {
        layer.on({ //mouseover: highlightFeature,
                   //mouseout: resetHighlight,
                   click : clickedOnFeature,
        });
      },
      pointToLayer: function(feature,latlng) {  // this turns 'points' into circles
        return L.circleMarker(latlng, {});
      },
    });

    // hang onto the data
    geoLayer.options.id = id;
    _cache[id] = segment;

    // add KML to the map
    let layer = omnivore.kml.parse(kml, null, geoLayer);
    layer.addTo(mymap);
    _layers[id] = layer;
  }
}

function styleByMetricColor(icon_name) {
  let xcolor = generateColorFromDb(icon_name);
  return {color: xcolor, weight: 4, opacity: 1.0, radius: 4};
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

function clickedOnFeature(e) {
  console.log(e);
  let id = e.target.options.id;
  if (id) console.log(_cache[id]);

  e.target.setStyle(styles.popup);

  let geo = e.target.feature;

  if (_selectedProject) {
//    if(selectedSegment.feature.cmp_segid != geo.cmp_segid){
      _prevselectedSegment = _selectedProject;
      _layers[id].resetStyle(_prevselectedSegment);
      _selectedProject = e.target;
  } else {
    _selectedProject = e.target;
  }

  let tmptxt = geo.cmp_name+" "+geo.direction+"-bound";
  document.getElementById("geoinfo").innerHTML = "<h5>" + tmptxt + " [" +
                                    geo.cmp_from + " to " + geo.cmp_to + "]</h5>";

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
