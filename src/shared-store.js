'use strict'

// shared event bus for cross-component communication
// see https://alligator.io/vuejs/global-event-bus/
import Vue from 'vue'
export const EventBus = new Vue()
export const EVENT = {
  MAP_HOVER_FEATURE: 'map-hover-feature',
  MAP_RESIZE: 'map-force-resize-animation',
  MAP_TOGGLE_LAYER: 'map-toggle-layer',
  MAP_SHOW_DISTRICT_OVERLAY: 'map-show-district-overlay',
  UPDATE_FILTERS: 'map-update-filters',
  CLICKED_ADDRESS: 'clicked-address',
  CLICKED_ON_FEATURE: 'clicked-on-feature',
  REMOVE_ADDRESS_MARKER: 'remove-address-marker',
  SEARCH_TERM_CHANGED: 'search-term-changed',
  SET_MAP_PROJECT: 'set-map-project',
  SET_MAP_VIEW: 'set-map-view',
}

let defaultPanelTitle = 'Select any project<br/>to learn more about it.'
let _projectsByTag = {}
let _tagList = []

let _extraLayers = [
  {
    tag: 'dists',
    name: 'Supervisorial District Boundaries',
    geojson: '/static/sup-districts.geo.json',
  },
  {
    tag: 'injuries',
    name: 'High Injury Network',
    geojson: '/static/high-injury-network.geo.json',
  },
  {
    tag: 'comm',
    name: 'Communities of Concern',
    geojson: '/static/comm-concern-supp-2017.geo.json',
  },
]

// Shared common state storage. state object should ONLY be read.
// Use methods to modify state.
export const BigStore = {
  debug: true,
  state: {
    layers: {},
    prjCache: {},
    addressSearchResults: [],
    devDistrictOption: true,
    extraLayers: _extraLayers,
    filterAreas: false,
    filterComplete: false,
    filterDistrict: -1,
    filterStreets: false,
    filterTags: new Set(),
    filterTransit: false,
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
    mainComponent: 'MyMap',
    selectedTags: '',
    showHelp: false,
    showingLayerPanel: false,
    showingMainPanel: true,
    filterKey: 0,
    isPanelHidden: false,
    terms: '',
    results: [],
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
