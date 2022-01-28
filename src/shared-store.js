'use strict'

// shared event bus for cross-component communication
// see https://alligator.io/vuejs/global-event-bus/
import Vue from 'vue'
export const EventBus = new Vue()
export const EVENT = {
  CLEAR_MAP: 'clear-map',
  MAP_HIGHLIGHT_PROJECT: 'map-hover-feature',
  MAP_RESIZE: 'map-force-resize-animation',
  MAP_TOGGLE_LAYER: 'map-toggle-layer',
  MAP_SHOW_DISTRICT_OVERLAY: 'map-show-district-overlay',
  UPDATE_FILTERS: 'map-update-filters',
  CLICKED_ADDRESS: 'clicked-address',
  CLICKED_ON_FEATURE: 'clicked-on-feature',
  HOVER_ON_FEATURE: 'hover-on-feature',
  REMOVE_ADDRESS_MARKER: 'remove-address-marker',
  SEARCH_TERM_CHANGED: 'search-term-changed',
  SET_MAP_PROJECT: 'set-map-project',
  SET_MAP_VIEW: 'set-map-view',
  SET_PREVENT_OVERSCROLL: 'set-overscroll',
  ACTIVE_TAGS: 'active-tags',
  TOGGLE_MOBILE: 'toggle-mobile',
}

let defaultPanelTitle = 'Select any project<br/>to learn more about it.'
let _tagList = []

let _extraLayers = [
  {
    tag: 'dists',
    name: 'Supervisorial District Boundaries',
    geojson: '/static/sup-districts.geo.json',
    help: 'Includes geographic boundaries of San Francisco Supervisorial districts'
  },
  {
    tag: 'injuries',
    name: 'High Injury Network',
    geojson: '/static/high-injury-network.geo.json',
    help: 'Includes a network of streets that has a higher incidence of severe and fatal crashes'
  },
  {
    tag: 'comm',
    name: 'Equity Priority Communities',
    geojson: '/static/comm-concern-supp-2021.geo.json',
    help: `
      Includes a diverse cross-section of populations and communities that could be considered disadvantaged or vulnerable now and in the future.
      Equity Priority Communities can have high levels of households with minority or low-income status, seniors, people who have limited English proficiency, people who have disabilities, and more.
    `
  },
]

// Get API host based on env
let apiHost;
switch(process.env.NODE_ENV) {
  case "development":
    if(process.env.DEBUG) console.log("Using dev API (localhost:5000)")
    apiHost = "http://localhost:5000";
    break;
  case "staging":
    if(process.env.DEBUG) console.log("Using staging API (propk-upgrade.herokuapp.com)")
    apiHost = "https://propk-upgrade.herokuapp.com";
    break;
  case "production":
    apiHost = "https://portal.sfcta.org";
}

const apiPath ="/api/v1/project_locations";

// Shared common state storage. state object should ONLY be read.
// Use methods to modify state.
export const BigStore = {
  env: process.env,
  debug: process.env.DEBUG || false,
  api: {
    host: apiHost,
    path: apiPath,
    href: apiHost + apiPath
  },
  state: {
    layers: {},
    prjCache: {},
    addressSearchResults: [],
    devDistrictOption: false,
    extraLayers: _extraLayers,
    filterAreas: true,
    filterComplete: false,
    filterDistrict: -1,
    filterStreets: true,
    filterTags: new Set(),
    filterTransit: true,
    filterUnderway: false,
    filterFund: null,
    fundSources: [],
    helptext: {
      PRETEXT: 'or browse the list of&nbsp;',
      LINK_URL: 'citywide',
      LINK_TEXT: 'citywide projects&hellip;',
    },
    hoverPanelHide: false,
    hoverPanelText: '',
    infoTitle: defaultPanelTitle,
    infoDetails: '',
    infoProject: '',
    infoUrl: '',
    isMobile: false,
    mainComponent: 'MyMap',
    nowMoloading: false,
    preventOverscroll: true,
    selectedTags: '',
    showDownload: false,
    showHelp: false,
    showingFilterPanel: false,
    showingLayerPanel: false,
    showingMainPanel: true,
    showNearby: true,
    popupLocation: { left: 0, top: 0 },
    nearbyProjects: [],
    projectIDsCurrentlyOnMap: {},
    filterKey: 0,
    isPanelHidden: false,
    terms: '',
    results: [],
    cacheDb: null,
    cacheSupervisorDistricts: null,
    whichSearchWidget: 'SearchWidget',
    tagresults: [],
    tags: _tagList,
  },

  addCacheItem(key, value) {
    // if (this.debug) console.log('addCache triggered:', key)
    this.state.prjCache[key] = value
  },

  addLayer(key, value) {
    // if (this.debug) console.log('addLayer triggered:', key)
    this.state.layers[key] = value
  },

  sendLayerBack(layer) {
    if (this.debug) console.log('sendLayerBack triggered:')
    this.state.layers[layer].bringToBack()
  },
}

if (BigStore.debug) console.log('BigStore initialized')
