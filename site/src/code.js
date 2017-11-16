'use strict';

// Must use npm and babel to support IE11/Safari
import 'babel-polyfill';
import 'isomorphic-fetch';
import 'lodash';
import vueSlider from 'vue-slider-component';
import Cookies from 'js-cookie';

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

const VIZ_LIST = {};
const VIZ_INFO = {};
let data_view;
let selPeriod, selviz_metric;
let selGeoId;

let geoLayer, mapLegend;
let yearData = {};
let longDataCache = {};
let popHoverSegment, popSelSegment;
let selectedSegment, prevselectedSegment;

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

  if (geoLayer) mymap.removeLayer(geoLayer);
  if (mapLegend) mymap.removeControl(mapLegend);
  if (popSelSegment) popSelSegment.remove();

  // add segments to the map by using metric data to color
  for (let segment of cmpsegJson) {

    let kml = '<kml xmlns="http://www.opengis.net/kml/2.2"><Placemark>'
               + segment['geometry']
               + '</Placemark></kml>';

    //update segment json with metric data (to be used to assign color)
    //segment["metric"] = selMetricData[segment.cmp_segid]

    if (segment['geometry'] == null) continue;

    geoLayer = L.geoJSON(null, {
      style: styleByMetricColor(segment['icon_name']),
      onEachFeature: function(feature, layer) {
        layer.on({ mouseover: highlightFeature,
                   mouseout: resetHighlight,
                   click : clickedOnFeature,
        });
      },
      pointToLayer: function(feature,latlng) {  // this turns 'points' into circles
        return L.circleMarker(latlng, {});
      },
    });

    omnivore.kml.parse(kml, null, geoLayer).addTo(mymap);
  }

/*
  mapLegend = L.control({position: 'bottomright'});
  mapLegend.onAdd = function (map) {
    let div = L.DomUtil.create('div', 'info legend')
    div.innerHTML = '<h4>' + VIZ_INFO[app.selectedViz]['METRIC_DESC'] + '</h4>' +
                    getLegHTML(VIZ_INFO[app.selectedViz]['COLORVALS'],
                    VIZ_INFO[app.selectedViz]['COLORS'],
                    VIZ_INFO[app.selectedViz]['COLOR_BY_BINS']);
    return div;
  };
  mapLegend.addTo(mymap);
*/
}

function styleByMetricColor(icon_name) {
  let xcolor = generateColorFromDb(icon_name);
  return {color: xcolor, weight: 4, opacity: 1.0, radius: 3};
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

  if(highlightedGeo.feature.cmp_segid != selGeoId){
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
  if (e.target.feature.cmp_segid != selGeoId) geoLayer.resetStyle(e.target);
}

function clickedOnFeature(e) {
  console.log(e.target);

  e.target.setStyle(styles.popup);

  let geo = e.target.feature;
  selGeoId = geo.cmp_segid;
  if(selectedSegment){
    if(selectedSegment.feature.cmp_segid != geo.cmp_segid){
      prevselectedSegment = selectedSegment;
      geoLayer.resetStyle(prevselectedSegment);
      selectedSegment = e.target;
    }
  } else {
    selectedSegment = e.target;
  }

  let tmptxt = geo.cmp_name+" "+geo.direction+"-bound";
  document.getElementById("geoinfo").innerHTML = "<h5>" + tmptxt + " [" +
                                    geo.cmp_from + " to " + geo.cmp_to + "]</h5>";

  // fetch longitudinal data for selected cmp segment
  let url = API_SERVER + data_view + '?';
  let metric_col = selviz_metric;
  if (selviz_metric==VIZ_INFO['ALOS']['METRIC']) metric_col = 'auto_speed';
  let params = 'cmp_segid=eq.'+ geo.cmp_segid +
               '&select=period,year,' + metric_col;
  let data_url = url + params;
  fetch(data_url).then((resp) => resp.json()).then(function(jsonData) {

    let popupText = "<b>"+geo.cmp_name+" "+geo.direction+"-bound</b><br/>" +
                  geo.cmp_from + " to " + geo.cmp_to;
    popSelSegment = L.popup()
                  .setLatLng(e.latlng)
                  .setContent(popupText)
                  .addTo(mymap);
    popSelSegment.on("remove", function(e) {
    geoLayer.resetStyle(selectedSegment);
    document.getElementById("geoinfo").innerHTML = "<h5>All Segments Combined</h5>";
    prevselectedSegment = selectedSegment = selGeoId = null;
    buildChartHtmlFromCmpData();
    });

    buildChartHtmlFromCmpData(jsonData);
  }).catch(function(error) {
      console.log("longitudinal data err: "+error);
  });
}

function buildChartHtmlFromCmpData(json=null) {
  document.getElementById("longchart").innerHTML = "";

  if(json) {
    let byYear = {};
    let data = [];
    for (let entry of json) {
      let metric_col = selviz_metric;
      if (selviz_metric==VIZ_INFO['ALOS']['METRIC']) metric_col = 'auto_speed';
      let val = Number(entry[metric_col]).toFixed(VIZ_INFO[app.selectedViz]['CHART_PREC']);
      if (val === 'NaN') continue;
      if (!byYear[entry.year]) byYear[entry.year] = {};
      byYear[entry.year][entry.period] = val;
    }
    for (let year in byYear) {
      data.push({year:year, am: byYear[year]['AM'], pm: byYear[year]['PM']});
    }

    new Morris.Line({
      // ID of the element in which to draw the chart.
      element: 'longchart',
      // Chart data records -- each entry in this array corresponds to a point on
      // the chart.
      data: data,
      // The name of the data record attribute that contains x-values.
      xkey: 'year',
      // A list of names of data record attributes that contain y-values.
      ykeys: ['am', 'pm'],
      // Labels for the ykeys -- will be displayed when you hover over the
      // chart.
      labels: ['AM', 'PM'],
      lineColors: ["#f66","#44f"],
      xLabels: "year",
      xLabelAngle: 45,
    });

  } else {
    new Morris.Line({
      // ID of the element in which to draw the chart.
      element: 'longchart',
      // Chart data records -- each entry in this array corresponds to a point on
      // the chart.
      data: longDataCache[app.selectedViz][selPeriod],
      // The name of the data record attribute that contains x-values.
      xkey: 'year',
      // A list of names of data record attributes that contain y-values.
      ykeys: ['art', 'fwy'],
      // Labels for the ykeys -- will be displayed when you hover over the
      // chart.
      labels: ['Arterial', 'Freeway'],
      lineColors: ["#f66","#44f"],
      xLabels: "year",
      xLabelAngle: 45,
    });
  }
}

function pickAM(thing) {
  app.isAMActive = true;
  app.isPMActive = false;
  selPeriod = 'AM';
  queryServer();
}

function pickPM(thing) {
  app.isAMActive = false;
  app.isPMActive = true;
  selPeriod = 'PM';
  queryServer();
}

function sliderChanged(thing) {
  queryServer();
}

function clickViz(chosenviz) {
  app.selectedViz = chosenviz;
  data_view = VIZ_INFO[chosenviz]['VIEW'];
  selviz_metric = VIZ_INFO[chosenviz]['METRIC'];
  queryServer();
}

// fetch the year details in data
function updateSliderData() {
  let yearlist = [];
  fetch(API_SERVER + data_view + '?select=year')
  .then((resp) => resp.json()).then(function(jsonData) {
    for (let entry of jsonData) {
      if (!yearlist.includes(entry.year)) yearlist.push(entry.year);
    }
    yearlist = yearlist.sort();
    app.timeSlider.data = yearlist;
    app.sliderValue = yearlist[yearlist.length-1];
  });
}

// SLIDER ----
let timeSlider = {
          data: [0],
          sliderValue: 0,
          disabled: false,
					width: 'auto',
					height: 3,
					direction: 'horizontal',
					dotSize: 16,
					eventType: 'auto',
					show: true,
					realTime: false,
					tooltip: 'always',
					clickable: true,
					tooltipDir: 'bottom',
					piecewise: true,
          piecewiseLabel: false,
					lazy: false,
					reverse: false,
          speed: 0.25,
          piecewiseStyle: {
            "backgroundColor": "#ccc",
            "visibility": "visible",
            "width": "6px",
            "height": "6px"
          },
          piecewiseActiveStyle: {
            "backgroundColor": "#ccc",
            "visibility": "visible",
            "width": "6px",
            "height": "6px"
          },
          labelStyle: {  "color": "#ccc"},
          labelActiveStyle: {  "color": "#ccc"},
          processStyle: {
            "backgroundColor": "#ffc"
          },
          style: {"marginTop":"0px","marginBottom":"40px"},
};


let app = new Vue({
  el: '#panel',
  delimiters: ['${', '}'],
  data: {
    isAMActive: true,
    isPMActive: false,
    sliderValue: 0,
    timeSlider: timeSlider,
    selectedViz:VIZ_LIST[0],
    vizlist: VIZ_LIST,
    vizinfo: VIZ_INFO,
  },
  watch: {
    sliderValue: sliderChanged,
  },
  methods: {
    pickAM: pickAM,
    pickPM: pickPM,
    clickViz: clickViz,
    clickToggleHelp: clickToggleHelp,
  },
  components: {
    vueSlider,
  }
});

// eat some cookies -- so we can hide the help permanently
let cookieShowHelp = Cookies.get('showHelp');
function clickToggleHelp() {
  helpPanel.showHelp = !helpPanel.showHelp;

  // and save it for next time
  if (helpPanel.showHelp) {
    Cookies.remove('showHelp');
  } else {
    Cookies.set('showHelp','false', {expires:365});
  }
}
let helpPanel = new Vue({
  el: '#helpbox',
  data: {
    showHelp: (cookieShowHelp==undefined),
  },
  methods: {
    clickToggleHelp: clickToggleHelp,
  },
  mounted: function () {
    document.addEventListener("keydown", (e) => {
      if (this.showHelp && e.keyCode == 27) {
        clickToggleHelp();
      }
    });
  }}
);

// ready to go!
queryServer();
