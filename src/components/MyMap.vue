<template lang="pug">
#mymap.custom-popup
</template>

<script>
'use strict'

import 'babel-polyfill'
import * as turf from '@turf/turf'
// Shared stuff across all components
import { BigStore, EventBus, EVENT } from '../shared-store.js'

let L = require('leaflet')
let Color = require('color')
let keywordExtractor = require('keyword-extractor')
let omnivore = require('leaflet-omnivore')
let geocoding = require('mapbox-geocoding')

let BUFFER_DISTANCE_METERS_SHORT = 25
let BUFFER_DISTANCE_METERS_LONG = 275

let _projectsByTag = {}
let _projectStylesById = {}
let _selectedProject, _hoverProject

let _tagList = []
let _starterProject = ''
let defaultPanelTitle = 'Select any project<br/>to learn more about it.'

let store = BigStore.state

let theme = 'light'
let mymap

const API_SERVER = 'https://api.sfcta.org/api/'
const GEO_VIEW = 'mystreet2_all'

// hard code the giant areas so they stay on the bottom layer of the map
const _bigAreas = [407, 477, 79, 363, 366, 17]

function clickedFunds(e) {
  store.filterFund = e.target.dataset.fund
  if (BigStore.debug) console.log({ FUND: store.filterFund })

  updateFilters()
}

function devClickedToggleDistrictOption() {
  store.devDistrictOption = !store.devDistrictOption
  if (BigStore.debug) console.log({ DEVCLICKED: store.devDistrictOption })
  updateFilters()
}

function toggleMapLayer(layer) {
  if (!layer.id) {
    addExtraMapLayer(layer)
  } else {
    if (mymap.hasLayer(layer.id)) {
      mymap.removeLayer(layer.id)
    } else {
      mymap.addLayer(layer.id)
      layer.id.bringToBack()
    }
  }

  updateURLHash()
}

function clickedToggleLayer(e) {}

let _districtColors = [
  '#e62',
  '#fd0',
  '#e62',
  '#fd0',
  '#00f',
  '#2e3',
  '#2e3',
  '#fd0',
  '#e22',
  '#fd0',
  '#00f',
]

function synchronizeExtraLayer(tag) {
  let layer = store.extraLayers.filter(z => {
    return z.tag === tag
  })[0]

  if (layer.show != mymap.hasLayer(layer.id)) toggleMapLayer(layer)
}

async function addExtraMapLayer(extraLayer) {
  switch (extraLayer.tag) {
    case 'dists':
      addSupDistrictLayer(extraLayer)
      break
    case 'injuries':
      addHighInjuryNetworkLayer(extraLayer)
      break
    case 'comm':
      addCommunitiesOfConcernLayer(extraLayer)
      break
  }
}

async function addHighInjuryNetworkLayer(extraLayer) {
  let url = extraLayer.geojson
  if (BigStore.debug) console.log('fetching', url)
  let group = L.featureGroup()

  let params = {
    style: function(feature) {
      let style = {
        color: '#f99', // this is the "unselected" color -- same for all projects
        opacity: 0.9,
        weight: 8,
        interactive: false,
      }
      return style
    },
  }

  try {
    let resp = await fetch(url)
    let jsonData = await resp.json()
    if (BigStore.debug) console.log(jsonData)

    let layer = L.geoJSON(jsonData, params)
    group.addLayer(layer)

    group.addTo(mymap)
    group.bringToBack()
    extraLayer.id = group

    console.log(group)
    synchronizeExtraLayer('injuries')
  } catch (error) {
    console.log('map error: ' + error)
  }
}

async function addCommunitiesOfConcernLayer(extraLayer) {
  let url = extraLayer.geojson
  if (BigStore.debug) console.log('fetching', url)
  let group = L.featureGroup()

  let params = {
    style: function(feature) {
      let style = {
        color: '#000', // this is the "unselected" color -- same for all projects
        fillColor: '#80a',
        fillOpacity: 0.35,
        interactive: false,
        weight: 0,
      }
      return style
    },
  }

  try {
    let resp = await fetch(url)
    let jsonData = await resp.json()
    if (BigStore.debug) console.log(jsonData)

    let layer = L.geoJSON(jsonData, params)
    group.addLayer(layer)

    group.addTo(mymap)
    group.bringToBack()
    extraLayer.id = group

    synchronizeExtraLayer('comm')
    console.log(group)
  } catch (error) {
    console.log('map error: ' + error)
  }
}

async function addSupDistrictLayer(extraLayer) {
  let url = extraLayer.geojson
  if (BigStore.debug) console.log('fetching', url)
  let group = L.featureGroup()

  let params = {
    style: function(feature) {
      let fill = _districtColors[-1 + parseInt(feature.properties.ID)]
      let style = {
        color: '#000', // this is the "unselected" color -- same for all projects
        opacity: 0.0,
        weight: 0,
        fillColor: fill,
        fillOpacity: 0.2,
        interactive: false,
      }
      return style
    },
  }

  try {
    let resp = await fetch(url)
    let jsonData = await resp.json()
    if (BigStore.debug) console.log(jsonData)

    for (let geojsonFeature of jsonData.features) {
      let layer = L.geoJSON(geojsonFeature, params)
      group.addLayer(layer)
    }

    group.addTo(mymap)
    group.bringToBack()
    extraLayer.id = group

    synchronizeExtraLayer('dists')
    console.log(group)
  } catch (error) {
    console.log('map error: ' + error)
  }
}

function clickedShowMainPanel(e) {
  store.showingMainPanel = true
  store.showingLayerPanel = false
}

function clickedShowLayerSelector(e) {
  store.showingMainPanel = false
  store.showingLayerPanel = true
}

function clickedFilter(e) {
  let id = e.target.id

  if (id === 'btn-transit') store.filterTransit = !store.filterTransit
  if (id === 'btn-streets') store.filterStreets = !store.filterStreets
  if (id === 'btn-areas') store.filterAreas = !store.filterAreas

  if (id === 'btn-complete') {
    store.filterComplete = !store.filterComplete
    if (store.filterComplete) store.filterUnderway = false
  }
  if (id === 'btn-underway') {
    store.filterUnderway = !store.filterUnderway
    if (store.filterUnderway) store.filterComplete = false
  }

  updateFilters()
}

function clickedAnywhereOnMap(map) {
  // undo selection, if user clicked on base map
  if (map.originalEvent.target.id === 'mymap') {
    store.infoTitle = defaultPanelTitle
    store.infoDetails = ''
    store.infoUrl = ''
    store.infoProject = ''
    removeHighlightFromPreviousSelection()
    updateURLHash()
  }
}

function mounted() {
  store.whichSearchWidget = 'SearchWidget'

  mymap = L.map('mymap', { zoomSnap: 0.25 })
  mymap.fitBounds([[37.82, -122.37], [37.71, -122.505]])

  mymap.zoomControl.setPosition('bottomleft')

  let url =
    'https://api.mapbox.com/styles/v1/mapbox/' +
    theme +
    '-v9/tiles/256/{z}/{x}/{y}?access_token={accessToken}'
  let token =
    'pk.eyJ1IjoicHNyYyIsImEiOiJjaXFmc2UxanMwM3F6ZnJtMWp3MjBvZHNrIn0._Dmske9er0ounTbBmdRrRQ'
  let attribution =
    '<a href="http://openstreetmap.org">OpenStreetMap</a> | ' +
    '<a href="http://mapbox.com">Mapbox</a>'

  let geocodeExtraParams = '&limit=3&bbox=-122.55,37.7,-122.36,37.85'
  geocoding.setAccessToken(token + geocodeExtraParams)

  mymap.on('click', clickedAnywhereOnMap)
  mymap.on('zoomend', movedMap)
  mymap.on('moveend', movedMap)

  L.tileLayer(url, {
    attribution: attribution,
    maxZoom: 18,
    accessToken: token,
  }).addTo(mymap)

  // semantic requires this line for dropdowns to work
  // https://stackoverflow.com/questions/25347315/semantic-ui-dropdown-menu-do-not-work
  // eslint-disable-next-line
  $('.ui.dropdown').dropdown()

  queryServer()
  updatePanelHelpText()
  loadSupervisorDistricts()
  setupEventListeners()
}

let _hoverPopup
let _hoverPopupTimer

function updatePanelHelpText() {
  store.helptext = {
    PRETEXT: 'or browse the list of&nbsp;',
    LINK_URL: 'citywide',
    LINK_TEXT: 'citywide projects&hellip;',
  }
}

function setupEventListeners() {
  EventBus.$on(EVENT.MAP_RESIZE, payload => {
    if (BigStore.debug) console.log(`got a map resize event`)
    for (let delay of [50, 100, 150, 200, 250, 300, 350, 400, 450, 500]) {
      setTimeout(function() {
        mymap.invalidateSize()
      }, delay)
    }
  })

  EventBus.$on(EVENT.MAP_TOGGLE_LAYER, layer => {
    toggleMapLayer(layer)
  })

  EventBus.$on(EVENT.MAP_SHOW_DISTRICT_OVERLAY, district => {
    showDistrictOverlay(district)
  })

  EventBus.$on(EVENT.SET_MAP_VIEW, view => {
    setView(view)
  })

  EventBus.$on(EVENT.SET_MAP_PROJECT, project => {
    _starterProject = project
  })

  EventBus.$on(EVENT.UPDATE_FILTERS, unused => {
    updateFilters()
  })

  EventBus.$on(EVENT.CLICKED_ADDRESS, address => {
    clickedAddress(address)
  })

  EventBus.$on(EVENT.MAP_HOVER_FEATURE, id => {
    hoverFeature(id)
  })

  EventBus.$on(EVENT.CLICKED_ON_FEATURE, id => {
    clickedOnFeature(id)
  })

  EventBus.$on(EVENT.REMOVE_ADDRESS_MARKER, id => {
    removeAddressMarker()
  })

  EventBus.$on(EVENT.ACTIVE_TAGS, tags => {
    activateTags(tags)
  })
}

function activateTags(tags) {
  console.log('ACTIVATING TAGS: ' + tags)
  let tagArray = tags.split(',')
  for (let tag of tagArray) {
    clickedSearchTag(tag)
  }
}

function updateHoverPopup(id, nearbyProjects, latlng) {
  removeOldHoverPopup()
  showHoverPopupAfterDelay(id, nearbyProjects, latlng, 1000)
}

function removeOldHoverPopup() {
  clearTimeout(_hoverPopupTimer)
  mymap.closePopup()
}

function showHoverPopupAfterDelay(id, nearbyProjectIDs, latlng, delay) {
  let content = buildPopupContent(id, nearbyProjectIDs)

  _hoverPopupTimer = setTimeout(function() {
    _hoverPopup = L.popup({ className: 'project-list-popup' })
      .setLatLng(latlng)
      .setContent(content)
    _hoverPopup.openOn(mymap)
  }, delay)
}

function buildPopupContent(id, nearbyProjectIDs) {
  let html = `<b>${BigStore.state.prjCache[id].project_name}</b>`

  for (let nearby of nearbyProjectIDs) {
    if (nearby === id) continue
    html += `<hr>${BigStore.state.prjCache[nearby].project_name}`
  }

  return html
}

function nameOfFilterDistrict(i) {
  if (i === -1) return 'All Projects...'
  if (i === 0) return 'Citywide'
  return 'District ' + i
}

export default {
  name: 'MyMap',
  data() {
    return store
  },
  computed: {
    tagsActiveOrMatchingSearch: function() {
      let a = new Set(store.tagresults)
      let union = Array.from(a)
      for (let activeTag of store.filterTags) {
        if (!a.has(activeTag)) union.push(activeTag)
      }
      return union
    },
  },
  mounted: function() {
    mounted()
  },
  methods: {
    clickedAddress: clickedAddress,
    clickedFilter: clickedFilter,
    clickedFunds: clickedFunds,
    clickedLearnMore: clickedLearnMore,
    clickedShowMainPanel: clickedShowMainPanel,
    clickedShowLayerSelector: clickedShowLayerSelector,
    clickedToggleHelp: clickedToggleHelp,
    clickedToggleLayer: clickedToggleLayer,
    clickedDistrict: clickedDistrict,
    clickedSearch: clickedSearch,
    clickedSearchTag: clickedSearchTag,
    clearSearchBox: clearSearchBox,
    devClickedToggleDistrictOption: devClickedToggleDistrictOption,
    hoverAddress: hoverAddress,
    hoverSearch: hoverSearch,
    nameOfFilterDistrict: nameOfFilterDistrict,
    termChanged: termChanged,
  },
  watch: {
    terms: termChanged,
    selectedTags: selectedTagsChanged,
    showingMainPanel: function() {
      // initialize dropdowns if main panel is showing
      setTimeout(function() {
        // eslint-disable-next-line
        $('.ui.dropdown').dropdown()
      }, 250)
    },
  },
}

function selectedTagsChanged() {
  if (BigStore.debug) console.log(store.selectedTags)
}

async function queryServer() {
  const geoUrl = API_SERVER + GEO_VIEW
  // const geoUrl = '/static/mystreet2_all.json'

  try {
    let resp = await fetch(geoUrl)
    let jsonData = await resp.json()
    mapSegments(jsonData)
  } catch (error) {
    console.log('map error: ' + error)
  }
}

let _districtLayersInverted = {}
let _districtLayers = {}
let _districtOverlay

function showDistrictOverlay(district) {
  district = parseInt(district)
  if (_districtOverlay) {
    mymap.removeLayer(_districtOverlay)
    _districtOverlay = null
  }
  // that's it if user chose citywide
  if (district === 0) return

  let params = {
    style: {
      color: '#225',
      fillOpacity: 0.5,
      interactive: false,
      weight: 1,
    },
  }

  _districtOverlay = L.geoJSON(_districtLayersInverted[district], params).addTo(mymap)
}

async function loadSupervisorDistricts() {
  //const DISTRICT_VIEW = 'sup_district_boundaries'
  //const geoUrl = API_SERVER + DISTRICT_VIEW
  const geoUrl = store.extraLayers[0].geojson

  try {
    let resp = await fetch(geoUrl)
    let jsonData = await resp.json()

    for (let feature of jsonData.features) {
      let id = feature.properties.DISTRICT

      _districtLayers[id] = L.geoJSON(feature)

      let holeArray = 0
      if (id === '3') holeArray = 14
      if (id === '6') holeArray = 2

      // draw a giant box around all of SF as first array entry
      let invertGeometry = [
        [[[-120, 30], [-130, 30], [-130, 40], [-120, 40], [-120, 30]]],
        feature.geometry.coordinates[holeArray],
      ]
      if (id === '6') invertGeometry[2] = feature.geometry.coordinates[1]

      feature.geometry.coordinates = invertGeometry
      _districtLayersInverted[id] = feature

      if (store.filterDistrict > -1) showDistrictOverlay(store.filterDistrict)
    }
  } catch (error) {
    console.log('map error: ' + error)
  }
}

// add segments to the map by using metric data to color
function mapSegments(cmpsegJson) {
  let fundStrings = []

  for (let segment of cmpsegJson) {
    if (segment['geometry'] == null) continue

    let id = segment['project_number']

    // slurp up all the funding sources
    if (segment.funding_sources) {
      fundStrings.push(...segment.funding_sources.split(', '))
    }

    let kml =
      '<kml xmlns="http://www.opengis.net/kml/2.2">' +
      '<Placemark>' +
      segment['geometry'] +
      '</Placemark></kml>'

    let polygon = false
    if (segment['shape'] && segment['shape'].includes('Polygon')) {
      polygon = true
    }

    _projectStylesById[id] = getNormalStyle(segment, polygon)

    let geoLayer = L.geoJSON(null, {
      style: _projectStylesById[id],
      onEachFeature: function(feature, layer) {
        layer.on({
          mouseover: hoverFeature,
          mouseout: unHoverFeature,
          click: clickedOnFeature,
        })
      },
      pointToLayer: function(feature, latlng) {
        // this turns 'points' into circles
        return L.circleMarker(latlng, { id: id })
      },
    })

    // convert tag string to a set of TAGS
    if (segment.project_tags) {
      let tags = Array.from(new Set(segment.project_tags.split(', '))).sort()
      if (tags[0] === '') tags.splice(0, 1) // drop empty tags
      segment.tag_list = tags

      // create tag index for easy lookup later
      _tagList.push(...tags) // this will have lots of duplicates
      for (let tag of tags) {
        if (!_projectsByTag[tag]) _projectsByTag[tag] = []
        _projectsByTag[tag].push(id)
      }

      // remove all duplicates
      _tagList = Array.from(new Set(_tagList)).sort()
      store.tags = _tagList
    }

    // hang onto the data
    geoLayer.options.id = id
    BigStore.addCacheItem(id, segment)

    // validate KML
    var oParser = new DOMParser()
    var oDOM = oParser.parseFromString(kml, 'text/xml')
    // print the name of the root element or error message
    if (oDOM.documentElement.nodeName === 'parsererror') {
      console.log('## Error while parsing row id ' + id)
    }

    // add KML to the map
    try {
      let layer = omnivore.kml.parse(kml, null, geoLayer)
      layer.addTo(mymap)
      if (polygon) layer.bringToBack()
      BigStore.addLayer(id, layer)
      _projectIdsCurrentlyOnMap[id] = true
    } catch (e) {
      console.log('couldnt: ' + id)
      console.log(segment)
    }
  }

  // TODO Hard-coded giant polygons -- send to back.
  for (let giantArea of _bigAreas) {
    if (BigStore.state.layers[giantArea]) BigStore.sendLayerBack(giantArea)
  }

  // convert funding source to a unique set
  let funds = Array.from(new Set(fundStrings))
  store.fundSources = funds.sort()
  if (store.fundSources[0] === '') store.fundSources.splice(0, 1) // remove blanks at beginning

  updateFilters()
  if (_starterProject) clickedOnFeature(_starterProject)
}

function getProjectDotRadius(segment) {
  // major projects get bigger circles
  let iconName = segment.icon_name
  if (iconName && iconName.startsWith('measle')) return 8
  return 4
}

let TRUE_COLOR = { TRANSIT: '#0071c6', STREETS: '#21ba45', PLANS: '#eb4' }

function getNormalStyle(segment, polygon) {
  let truecolor = generateColorForSegment(segment) // actual project color;
  let radius = getProjectDotRadius(segment)

  let style = {
    color: truecolor,
    truecolor: truecolor, // this is the "actual" project color
    fillColor: truecolor,
    fillOpacity: 0.7,
    opacity: 1.0,
    radius: radius,
    weight: 2,
  }

  if (polygon) {
    style.color = '#a3c0'
    style.fillColor = '#8482'
    style.weight = 3
  }
  return style
}

function generateColorForSegment(segment) {
  let projectCategory = segment.project_group
  let defaultColor = TRUE_COLOR.TRANSIT

  // no category? use blue.
  if (!projectCategory) return defaultColor

  switch (projectCategory) {
    case 'Transit':
      return TRUE_COLOR.TRANSIT
    case 'Streets':
      return TRUE_COLOR.STREETS
    case 'Plans and Programs':
      return TRUE_COLOR.PLANS
    default:
      return defaultColor
  }
}

function updatePanelDetails(id) {
  let prj = BigStore.state.prjCache[id]

  let district = ''
  if (prj['district1']) district += '1, '
  if (prj['district2']) district += '2, '
  if (prj['district3']) district += '3, '
  if (prj['district4']) district += '4, '
  if (prj['district5']) district += '5, '
  if (prj['district6']) district += '6, '
  if (prj['district7']) district += '7, '
  if (prj['district8']) district += '8, '
  if (prj['district9']) district += '9, '
  if (prj['district10']) district += '10, '
  if (prj['district11']) district += '11, '
  if (district) {
    district = 'District ' + district.slice(0, -2)
  } else {
    district = 'Citywide'
  }

  // generate permalink
  let permalink = prj['project_number'].toLowerCase()

  let url = `/projects/${permalink}/`

  store.infoTitle = prj['project_name']
  store.infoDetails = prj['description']
  store.infoProject = prj['project_number']
  store.infoUrl = url

  updateURLHash()
}

function removeHighlightFromPreviousSelection() {
  if (!_selectedProject) return
  BigStore.state.layers[_selectedProject].setStyle(_projectStylesById[_selectedProject])
}

function clickedToggleHelp() {
  store.showHelp = !store.showHelp
}

function clickedLearnMore() {
  window.open('https://www.sfcta.org/mystreetsf-projects-map', '_blank')
}

function clickedOnFeature(e) {
  if (BigStore.debug) console.log(e)
  let id
  let target

  if (e in BigStore.state.layers) {
    // search box!
    id = e
    target = BigStore.state.layers[id]
  } else {
    // For some reason, Leaflet handles points and polygons
    // differently, hence the weirdness for fetching the id of the selected feature.
    target = e.target
    if (target) id = target.options.id
    if (!id) id = e.layer.options.id
  }

  removeHighlightFromPreviousSelection()

  // save this project as the selected project; it's no longer just being hovered over!
  _selectedProject = id
  _hoverProject = null

  let clickedStyle = JSON.parse(JSON.stringify(_projectStylesById[id]))
  clickedStyle.color = Color(clickedStyle.truecolor).darken(0.4)
  clickedStyle.fillColor = clickedStyle.truecolor
  clickedStyle.radius = 12
  clickedStyle.weight = 8
  target.setStyle(clickedStyle)

  updatePanelDetails(id)
}

function getLayersNearLatLng(latlng, distanceInMeters) {
  let lat = latlng.lat
  let lng = latlng.lng

  let clickPoint = turf.point([lng, lat]) // turf uses long-lat, leaflet uses lat-long :-O
  let clickBuffer = turf.buffer(clickPoint, distanceInMeters, {
    units: 'meters',
  })

  return getLayersNearBufferedPoint(clickPoint, clickBuffer)
}

function getLayersNearBufferedPoint(clickPoint, clickBuffer) {
  let insideLayers = []

  let numLayers = Object.keys(_projectIdsCurrentlyOnMap).length
  let keys = numLayers === 0 ? BigStore.state.layers : _projectIdsCurrentlyOnMap

  for (let key in keys) {
    let layer = BigStore.state.layers[key]
    let geoJson = layer.toGeoJSON()
    let features = geoJson.features

    for (let feature of features) {
      try {
        if (isPointInsideFeature(clickPoint, clickBuffer, feature)) {
          insideLayers.push(key) // BigStore.state.layers[key])
        }
      } catch (e) {
        console.log({ msg: 'feature failed', feature: feature })
      }
    }
  }
  return insideLayers
}

function isPointInsideFeature(clickPoint, clickBuffer, feature) {
  let featureType = turf.getType(feature)
  try {
    switch (featureType) {
      case 'Point':
      case 'MultiPoint':
        return turf.booleanPointInPolygon(feature, clickBuffer)
      case 'LineString':
      case 'MultiLineString':
      case 'Polygon':
        return turf.booleanContains(feature, clickPoint)
      case 'MultiPolygon':
        return false
      case 'GeometryCollection':
        for (let subfeature of feature.geometry.geometries) {
          if (isPointInsideFeature(clickPoint, clickBuffer, subfeature)) {
            return true
          }
        }
        return false
      default:
        console.log('what? ' + featureType)
        console.log(feature)
        return false
    }
  } catch (e) {
    console.log({ feature: feature, error: e })
  }
  return false
}

let popupTimeout

function isTargetAPolygon(target) {
  try {
    if (target.feature.geometry.type.includes('Polygon')) return true
  } catch (e) {}

  try {
    if (target.feature.geometry.geometries[0].type.includes('Polygon')) {
      return true
    }
  } catch (e) {}

  return false
}

function isTargetAPoint(target) {
  try {
    if (target.feature.geometry.type === 'Point') return true
    return target.feature.geometry.geometries[0].type === 'Point'
  } catch (error) {}
  return false
}

function unHoverFeature(id) {
  if (_projectStylesById.hasOwnProperty(id)) {
    BigStore.state.layers[id].setStyle(_projectStylesById[id])
  } else {
    let layer = BigStore.state.layers[_hoverProject]
    if (layer) layer.setStyle(_projectStylesById[_hoverProject])
  }
}

function hoverFeature(e) {
  let target

  // deal w search clicks first
  if (e in BigStore.state.layers) {
    target = BigStore.state.layers[e]
  } else {
    target = e.target
  }

  // For some reason, Leaflet handles points and polygons
  // differently, hence the weirdness for fetching the id of the selected feature.
  let id = target.options.id
  if (!id) id = e.layer.options.id

  // don't add a hover if the proj is already selected
  if (id === _selectedProject) return

  let polygon = isTargetAPolygon(target)
  let points = isTargetAPoint(target)

  let normal = _projectStylesById[id]

  // Remove highlight from previous selection
  if (_hoverProject) {
    unHoverFeature(_hoverProject)
    _hoverProject = null
  }

  let style = {
    color: points ? '#555a' : normal.truecolor,
    fillColor: normal.fillColor,
    opacity: 1.0,
    radius: 8,
    weight: points ? 1 : 6,
  }

  let polygonStyle = {
    color: normal.truecolor,
    fillColor: normal.truecolor,
    fillOpacity: 0.3,
    opacity: 1.0,
    radius: 10,
    weight: 6,
  }

  // the long timeout keeps the highlight from selecting areas every time
  // the short timeout keeps the highlight from flashing too much on mouse movement
  let timeout = polygon ? 50 : 15

  clearTimeout(popupTimeout)
  popupTimeout = setTimeout(function() {
    target.setStyle(polygon ? polygonStyle : style)
  }, timeout)

  _hoverProject = id

  let nearbyProjects = getLayersNearLatLng(e.latlng, BUFFER_DISTANCE_METERS_SHORT)
  updateHoverPopup(id, nearbyProjects, e.latlng)
}

function clickedDistrict(district) {
  if (BigStore.debug) console.log('Chose District', district)
  store.filterDistrict = parseInt(district)

  updateFilters()
  showDistrictOverlay(district)
}

let _projectIdsCurrentlyOnMap = {}

function movedMap() {
  updateURLHash()
}

function updateURLHash() {
  let transit = store.filterTransit
  let streets = store.filterStreets
  let areas = store.filterAreas

  let complete = store.filterComplete
  let underway = store.filterUnderway

  // hash is filters:district:funds
  let hashParams = {}

  if (store.infoUrl) hashParams.project = store.infoProject

  let filter = 1 * streets + 2 * transit + 4 * areas + 8 * complete + 16 * underway
  if (filter > 0) hashParams.filter = filter

  if (store.filterDistrict > -1) hashParams.district = store.filterDistrict
  if (store.filterFund) hashParams.fund = store.filterFund

  // tags
  let tags = Array.from(store.filterTags).join(',')
  if (tags) hashParams.tags = tags

  // extra layers
  let xlayer = store.extraLayers
    .filter(z => {
      return z.show
    })
    .map(z => {
      return z.tag
    })
    .join(',')

  if (xlayer) hashParams.xlayer = xlayer

  hashParams.zoom = mymap.getZoom()
  hashParams.center = mymap.getCenter().lat.toFixed(3) + ',' + mymap.getCenter().lng.toFixed(3)

  window.location.hash = Object.entries(hashParams)
    .map(([k, v]) => `${k}=${v}`)
    .join('&')
}

function setView(view) {
  let coord = view.center.split(',')
  let latlng = new L.LatLng(parseFloat(coord[0]), parseFloat(coord[1]))
  mymap.setView(latlng, parseFloat(view.zoom))
}

function updateFilters() {
  updateURLHash()

  let transit = store.filterTransit
  let streets = store.filterStreets
  let areas = store.filterAreas

  let complete = store.filterComplete
  let underway = store.filterUnderway

  // if none are clicked, then all are clicked! :-O
  let showAll = false
  if (!transit && !streets && !areas) {
    showAll = true
  }

  for (let id in BigStore.state.layers) {
    let layer = BigStore.state.layers[id]
    let prj = BigStore.state.prjCache[id]

    let show = false

    if (showAll) {
      show = true
    } else {
      if (!prj) {
        show = false
      } else {
        if (transit && prj.project_group.includes('Transit')) show = true
        if (streets && prj.project_group.includes('Streets')) show = true
        if (areas && prj.project_group.includes('Plans and Programs')) {
          show = true
        }
      }
    }

    // now check FUNDING SOURCE
    let funds = store.filterFund
    let isCorrectFund = !funds || prj.funding_sources.includes(funds)

    // now check STATUS
    let isCorrectStatus = complete === underway // true if both or neither are checked
    if (complete && prj.status.includes('Closed')) isCorrectStatus = true
    if (underway && prj.status.includes('Active')) isCorrectStatus = true

    // now check DISTRICT
    let district = store.filterDistrict
    let isCorrectDistrict = true
    if (district === 0) isCorrectDistrict = prj['districts'] === 'Citywide'
    /*  // Hide for now, so all projects show even when a district is selected */
    if (!store.devDistrictOption) {
      if (district > 0) {
        let districtColName = 'district' + district
        isCorrectDistrict = prj[districtColName] === 1
      }
    }

    // now check TAGS
    let isCorrectTags = true
    if (store.filterTags.size) {
      isCorrectTags = false
      if (prj.tag_list) {
        for (let tag of store.filterTags) {
          if (prj.tag_list.indexOf(tag) > -1) {
            isCorrectTags = true
            break
          }
        }
      }
    }

    // the final word
    let passedAllTests =
      show && isCorrectFund && isCorrectStatus && isCorrectDistrict && isCorrectTags

    if (passedAllTests && !mymap.hasLayer(layer)) {
      mymap.addLayer(layer)
      _projectIdsCurrentlyOnMap[id] = true
      continue
    }
    if (!passedAllTests && mymap.hasLayer(layer)) {
      mymap.removeLayer(layer)
      if (id in _projectIdsCurrentlyOnMap) delete _projectIdsCurrentlyOnMap[id]
      continue
    }
  }
}

// ---------- SEARCH PANEL ----------------------
let _queryString

async function fetchTagResults(terms) {
  let answer = []
  let termsLower = terms.toLowerCase()
  for (let tag of _tagList) {
    let cleaned = tag.replace(/\//g, ' ')
    let keywords = keywordExtractor.extract(cleaned)
    for (let word of keywords) {
      if (word.startsWith(termsLower)) {
        answer.push(tag)
        break
      }
    }
  }
  store.tagresults = answer
  store.filterKey++
}

async function fetchSearchResults(terms) {
  let searchAPI = 'https://api.sfcta.org/api/mystreet2_search'

  let fancySearch = searchAPI + '?terms=@@.{'
  fancySearch += terms + '}'
  fancySearch = fancySearch.replace(/ /g, ',')

  let simpleSearch = searchAPI + '?select=id,name&name=ilike.'
  let query = terms.replace(/ /g, '*')
  simpleSearch += `*${query}*`

  try {
    // first try smart keyword search
    console.log(fancySearch)
    let resp = await fetch(fancySearch)
    let jsonData = await resp.json()

    // if no results, try simple text search
    if (terms === _queryString && jsonData.length === 0) {
      console.log('nuthin')
      console.log(simpleSearch)
      resp = await fetch(simpleSearch)
      jsonData = await resp.json()
    }

    // update list ONLY if query has not changed while we were fetching
    if (terms === _queryString) {
      store.results = jsonData
    }
  } catch (error) {
    console.log('search error')
    console.log(error)
  }
}

function termChanged() {
  console.log(store.terms)
  _queryString = store.terms.trim()

  if (_queryString) fetchTagResults(_queryString)
  else store.tagresults = []

  if (_queryString) fetchSearchResults(_queryString)
  else store.results = []

  if (_queryString) fetchAddressResults(_queryString)
  else store.addressSearchResults = []
}

function fetchAddressResults(_queryString) {
  geocoding.geocode('mapbox.places', _queryString, function(err, geoData) {
    console.log({ err: err, data: geoData })
    if (geoData.features.length) {
      for (let address of geoData.features) {
        let i = address.place_name.indexOf(', San Francisco')
        if (i > 0) address.place_name = address.place_name.substring(0, i)
      }
      store.addressSearchResults = geoData['features']
    } else {
      store.addressSearchResults = []
    }
  })
}

let _hoverSearchLastId

function hoverSearch(id) {
  if (id === _hoverSearchLastId) return

  _hoverSearchLastId = id
  hoverFeature(id)
}

function clickedSearch(id) {
  clickedOnFeature(id)
}

function clickedSearchTag(tag) {
  if (store.filterTags.has(tag)) {
    store.filterTags.delete(tag)
  } else {
    store.filterTags.add(tag)
  }
  store.filterKey++
  store.tagresults = []
  updateFilters()
}

let _addressMarker

function removeAddressMarker() {
  if (_addressMarker) {
    try {
      mymap.removeLayer(_addressMarker)
    } catch (e) {
      // oh well
    }
  }
  _addressMarker = null
}

function clickedAddress(address) {
  console.log({ clickedAddress: address })
  let lng = address.center[0]
  let lat = address.center[1]

  for (let a of store.addressSearchResults) a.red = false

  address.red = true
  store.addressSearchResults.push([])
  store.addressSearchResults.pop()

  removeAddressMarker()

  _addressMarker = L.circle([lat, lng], {
    color: 'red',
    fillColor: '#f63',
    fillOpacity: 0.6,
    radius: 250,
  })
  _addressMarker.addTo(mymap)

  showProjectsNearAddress({ lat: lat, lng: lng })
}

function hoverAddress(address) {
  // console.log(address)
}

function showProjectsNearAddress(latlng) {
  let projects = getLayersNearLatLng(latlng, BUFFER_DISTANCE_METERS_LONG)

  let results = []
  for (let project of projects) {
    results.push({
      id: project,
      name: BigStore.state.prjCache[project].project_name,
    })
  }
  store.results = results
}

function clearSearchBox() {
  store.terms = ''
  // store.filterTags.clear()
  // updateFilters()
  store.addressSearchResults = []
  removeAddressMarker()
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
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
  transition: none !important;
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
  height: 55px;
  border-top: 1px solid #eee;
  color: black;
  cursor: pointer;
  padding: 5px 5px;
}

.address-item {
  height: 40px;
  border-left: 2px solid white;
}

.address-item.red {
  border-left: 2px solid red;
  background-color: #f4f4f4;
}

.search-item h4 {
  color: #226;
  font-size: 14px;
  margin: -5px 0px 0px 0px;
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
  box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.1);
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
  box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
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
  margin-top: -5px;
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

.narrow-dropdown {
  width: 165px;
}

#preheader label {
  color: white;
  font-size: 16px;
}

.layer-selectors {
  padding: 5px 0px;
}

.project-list-popup .leaflet-popup-content {
  margin: 8px 20px 8px 10px;
}
.project-list-popup .leaflet-popup-content-wrapper {
  border-radius: 5px !important;
}

h2.noSelection {
  text-align: center;
}

.helpbar {
  text-align: center;
  margin-top: 5px;
}

#helpbox {
  box-shadow: 0px 0px 20px 10px rgba(0, 0, 0, 0.4);
  grid-row: 2 / 3;
  grid-column: 1 / 4;
  z-index: 2;
  width: minmax(min-content, 100px);
  max-width: 500px;
  margin: auto auto;
  padding: 10px 10px;
}

.black {
  color: black;
}
</style>
