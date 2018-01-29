'use strict';

// use npm and babel to support IE11/Safari
import 'babel-polyfill';
import 'isomorphic-fetch';

var maplib = require('./maplib');

const GEO_VIEW = 'mystreet2_sample';

let styles = maplib.styles;
let getLegHTML = maplib.getLegHTML;
let getColorFromVal = maplib.getColorFromVal;

let mymap = maplib.sfmap;
mymap.fitBounds([ [37.84, -122.36], [37.70, -122.52] ]);

const MISSING_COLOR = '#ccc';

// some important global variables.
const API_SERVER = 'https://api.sfcta.org/api/';

// hard code the giant areas so they stay on the bottom layer of the map
const _bigAreas = [407, 477, 79, 363, 366, 17];

let _cache = {};
let _layers = {};
let _selectedProject, _selectedStyle;
let _hoverProject, _hoverStyle;
let hoverPanelTimeout;

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

    } catch (e) {
      console.log('couldnt: '+id);
      console.log(segment);
    }
  }

  // Hard-coded giant polygons -- send to back.
  for (let giantArea of _bigAreas) {
    if (_layers[giantArea]) _layers[giantArea].bringToBack();
  }

}

function styleByMetricColor(icon_name, polygon) {
  let truecolor = generateColorFromDb(icon_name); // actual project color;
  let radius = 4;
  if (icon_name && icon_name.startsWith('measle')) radius = 8;

  return { color: "#444488" + "c0",   // this is the "unselected" color -- same for all projects
           truecolor: truecolor,  // this is the "actual" project color
           fillColor: (polygon ? "#448844" + "90" : truecolor),
           weight: (polygon ? 1 : 2),
           fillOpacity:0.7,
           opacity: 1.0,
           radius: radius,
  };
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

function updatePanelDetails(id, latlng) {
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

    // generate permalink
    let permalink = prj['project_number'].toLowerCase();

    let url = `<a target="_blank" href="/projects/${permalink}/">&raquo; More details&hellip;</a>`;

    app.infoTitle = prj['project_name'];
    app.infoDetails = prj['description'];
    app.infoUrl = url;
}

function clickedOnFeature(e) {
  // For some reason, Leaflet handles points and polygons
  // differently, hence the weirdness for fetching the id of the selected feature.
  let id = e.target.options.id;
  if (!id) id = e.layer.options.id;

  console.log('clicked on' + id);

  // Remove highlight from previous selection
  if (_selectedProject) _selectedProject.setStyle(_selectedStyle);

  // Remember what the thing looked like before we hovered or clicked on it
  _selectedStyle = _hoverStyle;

  try {
    if (!_selectedStyle) _selectedStyle = e.layer.options.style;
    if (!_selectedStyle) _selectedStyle = JSON.parse(JSON.stringify(e.layer.options));
  } catch(err) {
    // hmm
    let z = e.target.options;
    _selectedStyle = {color:z.color, fillColor:z.fillColor, radius:z.radius, weight:z.weight, truecolor: z.truecolor};
  }

  // save this project as the selected project; it's no longer just being hovered over!
  _hoverProject = null;
  _selectedProject = e.target;

  let clickedStyle = JSON.parse(JSON.stringify(styles.popup));
  clickedStyle['fillColor'] = _selectedStyle.truecolor;
  e.target.setStyle(clickedStyle);

  updatePanelDetails(id, e.latlng);
}

let popupTimeout;

function isTargetAPolygon(target) {
  try {
    if (target.feature.geometry.type.includes('Polygon')) return true;
  } catch(e) {}

  try {
    if (target.feature.geometry.geometries[0].type.includes('Polygon')) return true;
  } catch(e) {}

  return false;
}

function hoverFeature(e) {

  // don't add a hover if the proj is already selected
  if (e.target == _selectedProject) return;

  let polygon = isTargetAPolygon(e.target);

  // For some reason, Leaflet handles points and polygons
  // differently, hence the weirdness for fetching the id of the selected feature.
  let id = e.target.options.id;
  if (!id) id = e.layer.options.id;

  // Remove highlight from previous selection
  if (_hoverProject) _hoverProject.setStyle(_hoverStyle);


  // save real style info
  _hoverStyle = e.target.options.style;

  try {
    if (!_hoverStyle) _hoverStyle = e.layer.options.style;
    if (!_hoverStyle) _hoverStyle = JSON.parse(JSON.stringify(e.layer.options));
  } catch(err) {
    // hmm
    let z = e.target.options;
    _hoverStyle = {color:z.color, fill:z.fill, radius:z.radius, weight:z.weight, truecolor: z.truecolor};
  }

  let weight = polygon ? 6 : 10;

  let style = {'color': _hoverStyle.truecolor, 'fillColor': _hoverStyle.fillColor, "weight": weight, "opacity": 1.0 };
  if (polygon) {
    style.fillColor = _hoverStyle.truecolor;
    style.fillOpacity = 0.3;
  }

  // the 15ms timeout keeps the highlight from flashing too much on mouse movement
  // the 300ms timeout keeps the highlight from selecting areas every time
  let timeout = polygon ? 300 : 0;

  clearTimeout(popupTimeout);
  popupTimeout = setTimeout( function () {
    e.target.setStyle(style);
  }, timeout);

  _hoverProject = e.target;

  updateHoverPanel(id);
}

function clickedDistrict(e) {
  console.log(e);
}

function clickedFilter(e) {
  let id = e.target.id;

  if (id == 'btn-transit') app.filterTransit = !app.filterTransit;
  if (id == 'btn-streets') app.filterStreets = !app.filterStreets;
  if (id == 'btn-areas') app.filterAreas = !app.filterAreas;

  updateFilters();
}

function updateFilters() {
  let transit = app.filterTransit;
  let streets = app.filterStreets;
  let areas = app.filterAreas;

  // if none are clicked, then all are clicked! :-O
  let showAll = false;
  if (transit == streets == areas == false) {
    showAll = true;
  }

  for (let id in _layers) {
    let layer = _layers[id];
    let prj = _cache[id];

    let show = false;

    if (showAll) {
      show = true;
    } else {
      if (prj.new_project_type == undefined ) {
        show = false;
      } else {
        if (transit && prj.new_project_type.includes('Transit')) show = true;
        if (streets && prj.new_project_type.includes('Streets')) show = true;
        if (areas && prj.new_project_type.includes('Plans')) show = true;
      }
    }

    //console.log(prj);
    //console.log(show);

    if (show && !mymap.hasLayer(layer)) {
      mymap.addLayer(layer);
      continue;
    }
    if ((!show) && mymap.hasLayer(layer)) {
      mymap.removeLayer(layer);
      continue;
    }

  }

}


function unHoverFeature(e) {
  // Remove highlight from previous selection
  if (_hoverProject) {
    _hoverProject.setStyle(_hoverStyle);
  }
}

let app = new Vue({
  el: '#panel',
  delimiters: ['${', '}'],
  data: {
    filterTransit: false,
    filterStreets: false,
    filterAreas: false,
    infoTitle: "Select any project to learn more about it.",
    infoDetails: "",
    infoUrl: "",
  },
  watch: {
  },
  methods: {
    clickedFilter: clickedFilter,
    clickedDistrict: clickedDistrict,
  },
  components: {
  }
});


// ---------- HOVER PANEL -------------------------------------------------

let hoverPanel = L.control({position:"topright"});

hoverPanel.onAdd = function(map) {
  this._div = L.DomUtil.create('div', 'hover-panel-hide');
  this._div.innerHTML = '';
  return this._div;
};

function updateHoverPanel(id) {
  hoverPanel._div.className = 'hover-panel';
  hoverPanel._div.innerHTML = `<b>${_cache[id].project_name}</b>`;

  clearTimeout(hoverPanelTimeout);
  hoverPanelTimeout = setTimeout(function() {
    // use CSS to hide the info-panel
    hoverPanel._div.className = 'hover-panel-hide';
    // and clear the hover too
    //geoLayer.resetStyle(oldHoverTarget);
  }, 2000);
}

hoverPanel.addTo(mymap);

  // semantic requires this line for dropdowns to work
  // https://stackoverflow.com/questions/25347315/semantic-ui-dropdown-menu-do-not-work
  $(".ui.dropdown").dropdown();


// ready to go!
queryServer();
