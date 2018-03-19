<template lang="pug">
#container
  #layer-widgets
    button#btn-start.ui.tiny.grey.icon.button(
      data-tooltip="Projects"
      v-on:click="clickedShowMainPanel"
      v-bind:class="{ blue: showingMainPanel}"
    ): i.list.icon
    br
    button#btn-layers.ui.tiny.grey.icon.button(
      data-tooltip="Map Layers"
      v-on:click="clickedShowLayerSelector"
      v-bind:class="{ blue: showingLayerPanel}"
    ): i.clone.outline.icon
    br
    br
    button#btn-showhide.ui.tiny.green.icon.button(
           data-tooltip="Show/Hide Panel"
           v-on:click="clickedShowHide"
    ): i.angle.double.icon(v-bind:class="{left: isPanelHidden, right: !isPanelHidden}")

  #layer-panel.sidepanel(v-if="showingLayerPanel" v-bind:class="{ shrunken: isPanelHidden}")
    #preheader
      hr
      h3.apptitle MyStreet SF
      hr
      br
      h5 MAP LAYERS:
      p: i Additional geographic data that you may find useful.
      br

      .ui.checkbox.layer-selectors
        input(name="layer-sup-districts" type="checkbox")
        label Supervisorial District Boundaries
      br
      .ui.checkbox.layer-selectors
        input(name="layer-cupcakes" type="checkbox")
        label Cupcake Restaurants
      br
      .ui.checkbox.layer-selectors
        input(name="layer-parks" type="checkbox")
        label Pedestrian Fatalities

  #panel.sidepanel(v-if="showingMainPanel" v-bind:class="{ shrunken: isPanelHidden}")
    #preheader
      hr
      h3.apptitle MyStreet SF
      hr

    .information-panel(v-cloak)
        br
        h2 {{ infoTitle }}
        p  {{ infoDetails }}

    #bottom-panel(v-cloak)
      .details-link(v-if="infoUrl")
        a(v-bind:href="infoUrl" target="_blank") &raquo; MORE DETAILS&hellip;
      .pickers
        hr
        h5 TAGS:

        .ui.multiple.dropdown
          input(type="hidden" name="filters")
          i.filter.icon
          span.text Select some tags:
          .menu
            .ui.icon.search.input
              i.search.icon
              input(type="text" placeholder="Search tags...")
            .scrolling.menu(style="max-height: 230px")
              .item(v-for="tag in tags" v-bind:data-value="tag")
                .ui.blue.empty.circular.label
                | {{ tag.substring(0,35) }}

        h5 STATUS:

        button#btn-underway.tiny.ui.grey.button(
               v-on:click="clickedFilter"
               v-bind:class="{ active: filterUnderway, yellow: filterUnderway}"
        ) Underway

        button#btn-complete.tiny.ui.grey.button(
               v-on:click="clickedFilter"
               v-bind:class="{ active: filterComplete, yellow: filterComplete}"
        ) Completed

        h5 CATEGORY:

        button#btn-streets.tiny.ui.grey.button(
               v-on:click="clickedFilter"
               v-bind:class="{ active: filterStreets, yellow: filterStreets}"
        ) Streets

        button#btn-transit.tiny.ui.grey.button(
               v-on:click="clickedFilter"
               v-bind:class="{ active: filterTransit, yellow: filterTransit}"
        ) Transit

        button#btn-areas.tiny.ui.grey.button(
               v-on:click="clickedFilter"
               v-bind:class="{ active: filterAreas, yellow: filterAreas}"
        ) Plans &amp; Programs

        #dropdowns
          .narrow-dropdown(style="float:left;")
            h5 DISTRICT:
            .ui.selection.fluid.dropdown
              .text: div(v-cloak) Citywide
              i.dropdown.icon
              .menu
                .item(v-on:click="clickedDistrict(0)") Citywide
                .item(v-on:click="clickedDistrict(1)") District 1
                .item(v-on:click="clickedDistrict(2)") District 2
                .item(v-on:click="clickedDistrict(3)") District 3
                .item(v-on:click="clickedDistrict(4)") District 4
                .item(v-on:click="clickedDistrict(5)") District 5
                .item(v-on:click="clickedDistrict(6)") District 6
                .item(v-on:click="clickedDistrict(7)") District 7
                .item(v-on:click="clickedDistrict(8)") District 8
                .item(v-on:click="clickedDistrict(9)") District 9
                .item(v-on:click="clickedDistrict(10)") District 10
                .item(v-on:click="clickedDistrict(11)") District 11
          .narrow-dropdown(style="float:right;")
            h5 FUNDING SOURCE:
            .ui.selection.fluid.dropdown
              .text: div(v-cloak) All sources&hellip;
              i.dropdown.icon
              .menu
                .item(@click="clickedFunds" v-bind:data-fund="null") All sources
                .item(v-for="fund in fundSources" @click="clickedFunds" :data-fund="fund") {{ fund }}
        br
        br
        br
        br
        br

      // logo panel
      hr(style="margin: 0px 0px;")

      table#table-logo
        tr
          td.agency-logo: h4.agency: b
            a(target="_blank"
              href="http://www.sfcta.org/"
            ) SAN FRANCISCO COUNTY TRANSPORTATION AUTHORITY
          td.agency-logo
            a.agency-link(target="_blank" href="http://www.sfcta.org/")
              img.img-logo(src="../assets/sfcta-logo-144.png" width="60")

  #search-panel
    #search-term-box.ui.fluid.icon.inverted.input
      input(v-model="terms"
            tabindex="1"
            type="text"
            v-on:keyup.esc="clearSearchBox"
            placeholder="Search by project name, topic...")
      i.search.icon(v-if="!terms")
      i.remove.link.icon(v-if="terms" v-on:click="clearSearchBox")
    #search-results(v-cloak v-if="results.length + tagresults.length")
      .ui.relaxed.list
        .search-category(v-if="tagresults.length")
          p TAGS
        #search-tags.tiny.basic.pink.ui.button(
          v-for="tag in tagresults"
          v-on:click='clickedSearchTag(tag)'
        ) {{ tag }}
        .search-category(v-if="results.length")
          p PROJECTS
        template(v-for="result in results")
          div(v-on:click="clickedSearch(result.id)"
              v-on:mouseover="hoverSearch(result.id)")
            .search-item
              h4 {{ result.name }}
              p Project ID: {{ result.id }}
  #mymap
  #hover-panel(v-bind:class="{ 'hover-panel-hide': hoverPanelHide }"): p {{ hoverPanelText }}
</template>

<script>
'use strict'

import 'babel-polyfill';

// Shared stuff across all components
import { BigStore } from '../shared-store.js';

let L = require('leaflet');
let keywordExtractor = require('keyword-extractor');
let omnivore = require('leaflet-omnivore');

let _tagList = [
  'ADA/Accessibility',
  'Bicycle/Bike Facilities',
  'Bicycle/Bike Lanes',
  'Bicycle/Bike Projects',
  'Bicycle/Bike Safety',
  'Bulb-outs/Curb Extension/Curb ramps',
  'Bus Rapid Transit (BRT)',
  'Buses',
  'Citywide Plan',
  'Community-based transportation plans',
  'Corridor plan',
  'Countdown signals',
  'Elevators/Escalators',
  'Facilities',
  'Freeway or Congestion Management',
  'Freeways/Ramps',
  'Heavy rail',
  'Historic streetcar',
  'Light rail',
  'Motor coaches',
  'Neighborhood Plan',
  'NTIP / Neighborhood Transportation Improvement Program',
  'Outreach',
  'Paratransit',
  'Pedestrian Safety',
  'Plans and Programs',
  'Safe routes to school (SRTS)',
  'School transportation',
  'Sidewalks',
  'Stations/Stops',
  'Street Resurfacing',
  'Streets',
  'Tracks/Guideways',
  'Traffic Calming',
  'Traffic Signals',
  'Trains',
  'Transit',
  'Transit lanes',
  'Transportation demand management',
  'Trees',
  'Trolleybuses',
  'Vessels/Ferries',
];

let store = {
  filterComplete: false,
  filterUnderway: false,
  filterTransit: false,
  filterStreets: false,
  filterAreas: false,
  filterDistrict: 0,
  filterFund: null,
  fundSources: [],
  hoverPanelHide: false,
  hoverPanelText: '',
  infoTitle: 'Select any project to learn more about it.',
  infoDetails: '',
  infoUrl: '',
  showingLayerPanel: false,
  showingMainPanel: true,
  isPanelHidden: false,
  terms: '',
  results: [],
  tagresults: [],
  tags: _tagList,
}

let theme = 'light';
let mymap;

const GEO_VIEW = 'mystreet2_all';

let darkStyles = {
  normal: { color: '#ff7800', weight: 4, opacity: 1.0 },
  selected: { color: '#39f', weight: 5, opacity: 1.0 },
  popup: { color: '#33f', weight: 10, opacity: 1.0 },
};

let lightStyles = {
  normal: { color: '#3c6', weight: 6, opacity: 1.0 },
  selected: { color: '#39f', weight: 8, opacity: 1.0 },
  popup: { color: '#36f', weight: 10, opacity: 1.0 },
};
let styles = theme === 'dark' ? darkStyles : lightStyles;

function clickedFunds (e) {
  store.filterFund = e.target.dataset.fund;
  if (BigStore.debug) console.log({FUND: store.filterFund});

  updateFilters();
}

function clickedShowHide (e) {
  store.isPanelHidden = !store.isPanelHidden;
  // leaflet map needs to be force-recentered, and it is slow.
  for (let delay of [50, 100, 150, 200, 250, 300, 350, 400, 450, 500]) {
    setTimeout(function () { mymap.invalidateSize() }, delay);
  }
}

function clickedShowMainPanel (e) {
  store.showingMainPanel = true;
  store.showingLayerPanel = false;
}

function clickedShowLayerSelector (e) {
  store.showingMainPanel = false;
  store.showingLayerPanel = true;
}

function clickedFilter (e) {
  let id = e.target.id;

  if (id === 'btn-transit') store.filterTransit = !store.filterTransit;
  if (id === 'btn-streets') store.filterStreets = !store.filterStreets;
  if (id === 'btn-areas') store.filterAreas = !store.filterAreas;

  if (id === 'btn-complete') {
    store.filterComplete = !store.filterComplete;
    if (store.filterComplete) store.filterUnderway = false;
  }
  if (id === 'btn-underway') {
    store.filterUnderway = !store.filterUnderway;
    if (store.filterUnderway) store.filterComplete = false;
  }

  updateFilters();
}

function mounted () {
  mymap = L.map('mymap', { zoomSnap: 0.5 });
  mymap.fitBounds([[37.84, -122.36], [37.7, -122.52]]);
  mymap.zoomControl.setPosition('bottomleft');

  let url =
    'https://api.mapbox.com/styles/v1/mapbox/' +
    theme +
    '-v9/tiles/256/{z}/{x}/{y}?access_token={accessToken}';
  let token =
    'pk.eyJ1IjoicHNyYyIsImEiOiJjaXFmc2UxanMwM3F6ZnJtMWp3MjBvZHNrIn0._Dmske9er0ounTbBmdRrRQ';
  let attribution =
    '<a href="http://openstreetmap.org">OpenStreetMap</a> | ' +
    '<a href="http://mapbox.com">Mapbox</a>';
  L.tileLayer(url, {
    attribution: attribution,
    maxZoom: 18,
    accessToken: token,
  }).addTo(mymap);

  // semantic requires this line for dropdowns to work
  // https://stackoverflow.com/questions/25347315/semantic-ui-dropdown-menu-do-not-work
  // eslint-disable-next-line
  $('.ui.dropdown').dropdown();

  queryServer();
}

function updateHoverPanel (id) {
  store.hoverPanelText = BigStore.state.prjCache[id].project_name;
  store.hoverPanelHide = false;

  clearTimeout(hoverPanelTimeout);
  hoverPanelTimeout = setTimeout(function () {
    store.hoverPanelHide = true;
    // clear the hover too
    // geoLayer.resetStyle(oldHoverTarget);
  }, 2000);
}

export default {
  name: 'MyStreet',
  data () {
    return store
  },
  mounted: function () {
    mounted();
  },
  methods: {
    clickedFilter: clickedFilter,
    clickedFunds: clickedFunds,
    clickedShowHide: clickedShowHide,
    clickedShowMainPanel: clickedShowMainPanel,
    clickedShowLayerSelector: clickedShowLayerSelector,
    clickedDistrict: clickedDistrict,
    clickedSearch: clickedSearch,
    clickedSearchTag: clickedSearchTag,
    clearSearchBox: clearSearchBox,
    hoverSearch: hoverSearch,
    termChanged: termChanged,
  },
  watch: {
    terms: termChanged,
    showingMainPanel: function () {
      // initialize dropdowns if main panel is showing
      setTimeout(function () { $('.ui.dropdown').dropdown() }, 250);
    }
  },
}

// some important global variables.
const API_SERVER = 'https://api.sfcta.org/api/';

// hard code the giant areas so they stay on the bottom layer of the map
const _bigAreas = [407, 477, 79, 363, 366, 17];

let _selectedProject, _selectedStyle;
let _hoverProject, _hoverStyle;
let hoverPanelTimeout;

async function queryServer () {
  const geoUrl = API_SERVER + GEO_VIEW;

  try {
    let resp = await fetch(geoUrl);
    let jsonData = await resp.json();
    mapSegments(jsonData);
  } catch (error) {
    console.log('map error: ' + error);
  }
}

// add segments to the map by using metric data to color
function mapSegments (cmpsegJson) {
  let fundStrings = [];

  for (let segment of cmpsegJson) {
    if (segment['geometry'] == null) continue;

    let id = segment['project_number'];

    // slurp up all the funding sources
    if (segment.funding_sources) fundStrings.push(...segment.funding_sources.split(', '));

    // TODO:  Fake project types, for now
    if (segment.sponsor && segment.sponsor === 'MUNI') { segment.new_project_type = 'Transit'; }
    if (segment.description && segment.description.includes('safety')) { segment.new_project_type = 'Streets'; }
    if (segment.description && segment.description.includes('study')) { segment.new_project_type = 'Plans and Studies'; }
    if (segment.name && segment.name.includes('Planning')) { segment.new_project_type = 'Plans and Studies'; }

    let kml =
      '<kml xmlns="http://www.opengis.net/kml/2.2">' +
      '<Placemark>' +
      segment['geometry'] +
      '</Placemark></kml>';

    let polygon = false;
    if (segment['shape'] && segment['shape'].includes('Polygon')) { polygon = true; }

    let geoLayer = L.geoJSON(null, {
      style: styleByMetricColor(segment['icon_name'], polygon),
      onEachFeature: function (feature, layer) {
        layer.on({
          mouseover: hoverFeature,
          mouseout: unHoverFeature,
          click: clickedOnFeature,
        });
      },
      pointToLayer: function (feature, latlng) {
        // this turns 'points' into circles
        return L.circleMarker(latlng, { id: id });
      },
    });

    // hang onto the data
    geoLayer.options.id = id;
    BigStore.addCacheItem(id, segment);

    // validate KML
    var oParser = new DOMParser();
    var oDOM = oParser.parseFromString(kml, 'text/xml');
    // print the name of the root element or error message
    if (oDOM.documentElement.nodeName === 'parsererror') { console.log('## Error while parsing row id ' + id); }

    // add KML to the map
    try {
      let layer = omnivore.kml.parse(kml, null, geoLayer);
      layer.addTo(mymap);
      if (polygon) layer.bringToBack();
      BigStore.addLayer(id, layer);
    } catch (e) {
      console.log('couldnt: ' + id);
      console.log(segment);
    }
  }

  // TODO Hard-coded giant polygons -- send to back.
  for (let giantArea of _bigAreas) {
    if (BigStore.state.layers[giantArea]) BigStore.sendLayerBack(giantArea);
  }

  // convert funding source to a unique set
  let funds = Array.from(new Set(fundStrings));
  store.fundSources = funds.sort();
}

function styleByMetricColor (iconName, polygon) {
  let truecolor = generateColorFromDb(iconName); // actual project color;
  let radius = 4;
  if (iconName && iconName.startsWith('measle')) radius = 8;

  return {
    color: '#444488' + 'c0', // this is the "unselected" color -- same for all projects
    truecolor: truecolor, // this is the "actual" project color
    fillColor: polygon ? '#448844' + '90' : truecolor,
    weight: polygon ? 1 : 2,
    fillOpacity: 0.7,
    opacity: 1.0,
    radius: radius,
  };
}

function generateColorFromDb (iconName) {
  let defaultColor = '#44c';

  // no color? use blue.
  if (!iconName) return defaultColor;

  // color code in db? use it.
  if (iconName.startsWith('#')) return iconName;

  // icon name in db? convert to a color code.
  switch (iconName) {
    case 'small_blue':
      return '#44f';
    case 'small_green':
      return '#4f4';
    case 'small_purple':
      return '#63c';
    case 'small_red':
      return '#f44';
    case 'small_yellow':
      return '#aa3';
    case 'measle_turquoise':
      return '#369';
    default:
      return defaultColor;
  }
}

function updatePanelDetails (id) {
  let prj = BigStore.state.prjCache[id];

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
    district = 'District ' + district.slice(0, -2);
  } else {
    district = 'Citywide';
  }

  // generate permalink
  let permalink = prj['project_number'].toLowerCase();

  let url = `/projects/${permalink}/`;

  store.infoTitle = prj['project_name'];
  store.infoDetails = prj['description'];
  store.infoUrl = url;
}

function clickedOnFeature (e) {
  let id;
  let target;

  if (e in BigStore.state.layers) {
    // search box!
    id = e;
    target = BigStore.state.layers[id];
  } else {
    // For some reason, Leaflet handles points and polygons
    // differently, hence the weirdness for fetching the id of the selected feature.
    target = e.target;
    if (target) id = target.options.id;
    if (!id) id = e.layer.options.id;
  }

  // Remove highlight from previous selection
  if (_selectedProject) _selectedProject.setStyle(_selectedStyle);

  // Remember what the thing looked like before we hovered or clicked on it
  _selectedStyle = _hoverStyle;

  try {
    if (!_selectedStyle) _selectedStyle = e.layer.options.style;
    if (!_selectedStyle) { _selectedStyle = JSON.parse(JSON.stringify(e.layer.options)); }
  } catch (err) {
    // hmm
    let z = target.options;
    _selectedStyle = {
      color: z.color,
      fillColor: z.fillColor,
      radius: z.radius,
      weight: z.weight,
      truecolor: z.truecolor,
    };
  }

  // save this project as the selected project; it's no longer just being hovered over!
  _hoverProject = null;
  _selectedProject = target;

  let clickedStyle = JSON.parse(JSON.stringify(styles.popup));
  clickedStyle['fillColor'] = _selectedStyle.truecolor;
  target.setStyle(clickedStyle);

  updatePanelDetails(id);
}

let popupTimeout;

function isTargetAPolygon (target) {
  try {
    if (target.feature.geometry.type.includes('Polygon')) return true;
  } catch (e) {}

  try {
    if (target.feature.geometry.geometries[0].type.includes('Polygon')) { return true; }
  } catch (e) {}

  return false;
}

function hoverFeature (e) {
  let target;

  // deal w search clicks first
  if (e in BigStore.state.layers) {
    target = BigStore.state.layers[e];
  } else {
    target = e.target;
  }

  // don't add a hover if the proj is already selected
  if (target === _selectedProject) return;

  let polygon = isTargetAPolygon(target);

  // For some reason, Leaflet handles points and polygons
  // differently, hence the weirdness for fetching the id of the selected feature.
  let id = target.options.id;
  if (!id) id = e.layer.options.id;

  // Remove highlight from previous selection
  if (_hoverProject) _hoverProject.setStyle(_hoverStyle);

  // save real style info
  _hoverStyle = target.options.style;

  try {
    if (!_hoverStyle) _hoverStyle = e.layer.options.style;
    if (!_hoverStyle) _hoverStyle = JSON.parse(JSON.stringify(e.layer.options));
  } catch (err) {
    // hmm
    let z = target.options;
    _hoverStyle = {
      color: z.color,
      fill: z.fill,
      radius: z.radius,
      weight: z.weight,
      truecolor: z.truecolor,
    };
  }

  let weight = polygon ? 6 : 10;

  let style = {
    color: _hoverStyle.truecolor,
    fillColor: _hoverStyle.fillColor,
    weight: weight,
    opacity: 1.0,
  };
  if (polygon) {
    style.fillColor = _hoverStyle.truecolor;
    style.fillOpacity = 0.3;
  }

  // the 15ms timeout keeps the highlight from flashing too much on mouse movement
  // the 300ms timeout keeps the highlight from selecting areas every time
  let timeout = polygon ? 300 : 0;

  clearTimeout(popupTimeout);
  popupTimeout = setTimeout(function () {
    target.setStyle(style);
  }, timeout);

  _hoverProject = target;

  updateHoverPanel(id);
}

function clickedDistrict (district) {
  console.log('Chose District' + district);
  store.filterDistrict = parseInt(district);

  updateFilters();
}

function updateFilters () {
  let transit = store.filterTransit;
  let streets = store.filterStreets;
  let areas = store.filterAreas;

  let complete = store.filterComplete;
  let underway = store.filterUnderway;

  // if none are clicked, then all are clicked! :-O
  let showAll = false;
  if (((transit === streets) === areas) === false) {
    showAll = true;
  }

  for (let id in BigStore.state.layers) {
    let layer = BigStore.state.layers[id];
    let prj = BigStore.state.prjCache[id];

    let show = false;

    if (showAll) {
      show = true;
    } else {
      if (!prj || !prj.new_project_type) {
        show = false;
      } else {
        console.log(id + ' - ' + prj.new_project_type);
        if (transit && prj.new_project_type.includes('Transit')) show = true;
        if (streets && prj.new_project_type.includes('Streets')) show = true;
        if (areas && prj.new_project_type.includes('Plans')) show = true;
      }
    }

    // now check FUNDING SOURCE
    let funds = store.filterFund;
    let isCorrectFund = !funds || prj.funding_sources.includes(funds);

    // now check STATUS
    let isCorrectStatus = (complete === underway); // true if both or neither are checked
    if (complete && prj.status.includes('Closed')) isCorrectStatus = true;
    if (underway && prj.status.includes('Active')) isCorrectStatus = true;

    // now check DISTRICT
    let district = store.filterDistrict;
    let districtColName = 'district' + district;
    let isCorrectDistrict =
      district === 0 || (district > 0 && prj[districtColName] === 1);

    // the final word
    let passedAllTests = show && isCorrectFund && isCorrectDistrict && isCorrectStatus;

    if (passedAllTests && !mymap.hasLayer(layer)) {
      mymap.addLayer(layer);
      continue;
    }
    if (!passedAllTests && mymap.hasLayer(layer)) {
      mymap.removeLayer(layer);
      continue;
    }
  }
}

function unHoverFeature (e) {
  // Remove highlight from previous selection
  if (_hoverProject) {
    _hoverProject.setStyle(_hoverStyle);
  }
}

// ---------- SEARCH PANEL ----------------------
let _queryString;

async function fetchTagResults (terms) {
  let answer = [];
  let termsLower = terms.toLowerCase();
  for (let tag of _tagList) {
    let cleaned = tag.replace(/\//g, ' ');
    let keywords = keywordExtractor.extract(cleaned);
    for (let word of keywords) {
      if (word.startsWith(termsLower)) {
        answer.push(tag);
        break;
      }
    }
  }
  store.tagresults = answer;
}

async function fetchSearchResults (terms) {
  let searchAPI = 'https://api.sfcta.org/api/mystreet2_search';

  let fancySearch = searchAPI + '?terms=@@.{';
  fancySearch += terms + '}';
  fancySearch = fancySearch.replace(/ /g, ',');

  let simpleSearch = searchAPI + '?select=id,name&name=ilike.';
  let query = terms.replace(/ /g, '*');
  simpleSearch += `*${query}*`;

  try {
    // first try smart keyword search
    console.log(fancySearch);
    let resp = await fetch(fancySearch);
    let jsonData = await resp.json();

    // if no results, try simple text search
    if (terms === _queryString && jsonData.length === 0) {
      console.log('nuthin');
      console.log(simpleSearch);
      resp = await fetch(simpleSearch);
      jsonData = await resp.json();
    }

    // update list ONLY if query has not changed while we were fetching
    if (terms === _queryString) {
      store.results = jsonData;
    }
  } catch (error) {
    console.log('search error');
    console.log(error);
  }
}

function termChanged () {
  console.log(store.terms);
  _queryString = store.terms.trim();

  if (_queryString) fetchTagResults(_queryString);
  else store.tagresults = [];

  if (_queryString) fetchSearchResults(_queryString);
  else store.results = [];
}

let _hoverSearchLastId;

function hoverSearch (id) {
  if (id === _hoverSearchLastId) return;

  _hoverSearchLastId = id;
  hoverFeature(id);
}

function clickedSearch (id) {
  clickedOnFeature(id);
}

function clickedSearchTag (tag) {
  alert(
    'YOU CLICKED: ' +
      tag +
      '\nOnce the database has some tags in it, this will be more useful.'
  );
}

function clearSearchBox () {
  store.terms = '';
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

[v-cloak] {
  display: none;
}

html,
body {
  overflow-x: hidden;
}

/* prevents transition animations on page load (Screw you IE!) */
.preload * {
  -webkit-transition: none !important;
  -moz-transition: none !important;
  -ms-transition: none !important;
  -o-transition: none !important;
}

.text-muted {
  color: #777;
  margin-bottom: 20px;
}

.text-primary {
  color: #f0a033;
}

p {
  font-size: 15px;
  line-height: 1.75;
}

ul {
  font-size: 14px;
}

ol {
  font-size: 14px;
}

li {
  padding-top: 8px;
}

li.li-header {
  padding-top: 0px;
}

p.large {
  font-size: 16px;
}

a,
a:hover,
a:focus,
a:active,
a.active {
  outline: 0;
}

a {
  color: #4585f0;
  text-decoration: none;
}

a:hover,
a:focus,
a:active,
a.active {
  color: #4545c0;
}

a.entry_list_link {
  color: #4545c0;
  text-decoration: none;
}

a.entry_list_link:hover {
  color: #4585f0;
}

h1,
h2,
h3,
h4,
h5,
h6 {
  font-weight: 700;
}

h3 {
  margin-top: -10px;
  margin-bottom: 30px;
}

h4 {
  color: #ea790d;
}

#zoom-map {
  float: right;
  width: 300px;
  height: 300px;
  margin-left: 20px;
  margin-bottom: 10px;
  background-color: #eee;
  border: 1px solid #ea790d;
  border-radius: 8px;
  box-shadow: 0 0 3px #00000060;
}

.search-item {
  height: 80px;
  border-top: 1px solid #eee;
  color: black;
  cursor: pointer;
  padding: 5px 5px;
}

.search-item h4 {
  color: #226;
  font-size: 16px;
  margin: 0px 0px;
}
.search-item p {
  color: #666;
  font-size: 13px;
}
.search-item hr {
  margin-top: 0px;
  margin-bottom: 3px;
}
.search-item:hover {
  background-color: #eee;
}

.search-category p {
  padding-left: 5px;
  padding-top: 10px;
  color: #882;
}

#search-tags {
  margin-left: 5px;
  margin-top: 5px;
}

#search-tags.button {
  padding: 7px 8px;
}

#search-panel {
  background-color: white;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.5);
  border-radius: 5px;
  color: black;
  grid-row: 1 / 2;
  grid-column: 1 / 2;
  margin: 10px 20px 10px 10px;
  position: relative;
  z-index: 5;
}

#search-panel input {
  padding: 10px 10px;
  width: 100%;
}

#search-results {
  background-color: white;
  max-height: 500px;
  overflow-y: auto;
  padding-bottom: 10px;
}
#search-results::-webkit-scrollbar {
  width: 0.3em;
}

#search-results::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.1);
}

#search-results::-webkit-scrollbar-thumb {
  background-color: darkgrey;
  outline: 1px solid slategrey;
}

#container {
  background-color: #ccc;
  display: grid;
  grid-template-columns: 350px 1fr auto auto;
  grid-template-rows: auto 1fr auto auto;
  height: 100%;
  max-height: 100%;
  margin: 0px 0px 0px 0px;
  padding: 0px 0px 0px 0px;
}

#layer-widgets {
  border-radius: 7px 0px 0px 7px;
  background-color: #555;
  grid-row: 3 / 5;
  grid-column: 3 / 4;
  position: relative;
  margin-bottom: 25px;
  z-index: 7;
}

#layer-widgets button {
  margin: 5px 5px 5px 5px;
}

.sidepanel {
  background-color: #444;
  border-color: transparent;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.5);
  color: #fff;
  display: grid;
  grid-row: 1 / 5;
  grid-column: 4 / 5;
  grid-template-columns: 1fr;
  grid-template-rows: auto 1fr auto;
  height: 100%;
  margin-right: 0px;
  max-height: 100%;
  padding: 0px 15px 0px 15px;
  transition: margin 0.4s;
  width: 400px;
  z-index: 5;
}

.shrunken {
  margin-right: -394px;
}

#preheader {
  grid-column: 1 / 2;
  grid-row: 1 / 2;
}

#mymap {
  grid-row: 1 / 5;
  grid-column: 1 / 4;
  z-index: 1;
}

#hover-panel {
  grid-row: 4 / 5;
  grid-column: 1 / 3;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.5);
  border-radius: 5px;
  margin: 0px auto;
  margin-bottom: 25px;
  padding: 1px 10px;
  position: relative;
  z-index: 2;
}

.hover-panel-hide {
  visibility: hidden;
  opacity: 0;
  transition: visibility 0s 0.5s, opacity 0.5s linear;
}

#hover-panel p {
  color: #66a;
  font-weight: 700;
  font-size: 13px;
}

.information-panel {
  grid-row: 2 / 3;
  grid-column: 1 / 2;
  overflow-y: auto;
}

.information-panel p {
  padding-top: 10px;
  font-size: 14px;
  line-height: 1.5;
}

.information-panel::-webkit-scrollbar {
  width: 0.3em;
}

.information-panel::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
}

.information-panel::-webkit-scrollbar-thumb {
  background-color: darkgrey;
  outline: 1px solid slategrey;
}

#bottom-panel {
  grid-row: 3 / 4;
  grid-column: 1 / 2;
  display: table-row;
  text-align: right;
  vertical-align: bottom;
  margin-bottom: 0px;
}

.agency a {
  color: #fff;
  text-decoration: none;
  font-size: 15px;
  float: right;
}

.agency a:hover {
  color: #ccc;
}

td.agency-logo {
  margin: 0px 0px;
  padding: 2px 0px 0px 0px;
  vertical-align: middle;
  text-align: right;
}

#table-logo {
  margin: 0px 0px;
  padding: 0px 0px;
}

.apptitle {
  font-size: 22px;
  margin: 0px 0px;
  margin-top: 0px;
  text-align: center;
}

#panel a {
  color: #fff;
}

#panel label {
  color: #fff;
}

#panel p {
  color: #ccc;
}

#panel h1,
h3,
h4,
h5 {
  color: white;
  padding: 0px 0px;
  margin: 0px 0px;
}

#panel hr {
  margin: 8px 0px;
}

#preheader hr {
  margin: 6px 0px;
}

.pickers {
  text-align: left;
}

.pickers h5 {
  margin-bottom: 3px;
  margin-top: 15px;
}

.details-link {
  text-align: right;
  margin-top: 10px;
  margin-right: 0px;
}

p {
  color: #ccc;
}

h1 {
  margin-top: 0px;
}
h2 {
  margin-top: 4px;
}
h3 {
  padding-top: 5px;
}
h4 {
  margin-right: 10px;
}
h5 {
  margin-top: 4px;
  margin-bottom: 4px;
}

table {
  vertical-align: top;
}

td {
  text-align: left;
  vertical-align: top;
  padding: 6px 10px;
  margin: 5px 5px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 1s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.narrow-dropdown { width: 165px;}

#preheader label {
  color: white;
  font-size: 16px;
}

.layer-selectors {padding: 5px 0px;}

</style>
