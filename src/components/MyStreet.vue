<template lang="pug">
#container
  transition(name="fade")
    #helpbox.ui.segment(v-show="showHelp" class="ui segment")
      h3(style="margin-left: 10px") MyStreet San Francisco
      .mybox(style="background-color: white")
        hr
        .myotherbox(style="padding: 25px 25px")
          p Use this map to explore the many transportation investments happening all across San Francisco.

          h3.black(style="margin-top:10px") How to use this map
          hr(style="margin-bottom:5px")
          ul
            li Click any project for info, and check "More Details" for timing, expenditures, and more.
            li Use the filters on the right to reduce clutter: see just the projects you're interested in



          div(style="margin-top:20px;")
            button.small.ui.right.floated.violet.button(@click="clickedToggleHelp") OK, GOT IT
            |&nbsp;&nbsp;
            button.small.ui.right.floated.basic.violet.button(
              @click="clickedLearnMore"
              style="margin-right:5px"
            ) Learn more about MyStreet SF&hellip;

  transition(name="fade")
    #downloadbox.ui.segment(v-cloak v-show="showDownload" class="ui segment")
      h3(style="margin-left: 10px")
        button.ui.tiny.compact.pink.icon.button(
          style="float:right;"
          @click="clickedCloseDownload"
        )
          i.close.icon
        | Download Data
      .mybox(style="background-color: white")
        hr
        .myotherbox(style="padding: 25px 25px")
          p The data powering this site can be downloaded in .CSV format and opened in any spreadsheet software such as Microsoft Excel.
          br
          p You can download data just for the projects you've selected, or you can download the entire dataset.
          br
          h3.black(style="margin-bottom:10px") Choose what you would like to download:
          .download-buttons.ui.buttons
            button#dl-selected-project.ui.yellow.button(
              @click="downloadData(filtered=true)"
            ) Filtered Projects
            .or
            button.ui.violet.button(@click="downloadData(filtered=false)") Everything

  #nearbyprojects.ui.segment(v-show="nearbyProjects.length>0" class="ui segment"
    :style="popupLocation")

    h5.nearby-title
      button.ui.tiny.compact.pink.icon.button(
        @click="clickedCloseNearby"
        style="float:right;"
      )
        i.close.icon
      | {{ nearbyProjects.length>0 ? nearbyProjects[0].project_name : "" }}

    .other-projects(v-if="nearbyProjects.length > 1")
      h5.black(style="font-size:11px; margin-left:5px; padding-top:5px;") ALSO NEARBY:
      hr(style="margin: 0px 8px 5px 5px;")
      .nearby-project-row(v-for="(prj,index) in nearbyProjects" @click="clickedNearbyProject(prj.project_number)")
        h5.nearby-row(v-if="index > 0") {{prj.project_name}}

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
    button.ui.icon.button.small.grey.compact(
      data-tooltip="Download map data" @click="clickedDownload"
    ): i.download.icon

    br
    br

    button#btn-showhide.ui.tiny.green.icon.button(
           data-tooltip="Show/Hide Panel"
           v-on:click="clickedShowHide"
    ): i.angle.double.icon(v-bind:class="{left: isPanelHidden, right: !isPanelHidden}")

  #layer-widgets-mobile
    button#mbtn-start.ui.small.button(
      v-on:click="mobileToggleMainPanel"
      :class="{violet: showingMainPanel}"
    )
      i.list.icon
      | PROJECTS

    button#btn-mshowhide.ui.small.button(
      @click="mobileToggleFilterPanel"
      :class="{violet: showingFilterPanel}"
    )
      i.filter.icon
      | FILTERS

    button#btn-layers.ui.small.button(
      @click="mobileToggleLayerSelector"
      :class="{violet: showingLayerPanel}"
    )
      i.clone.outline.icon
      | LAYERS


  transition(name="slide")
    .panel.sidepanel(v-if="showingLayerPanel" v-bind:class="{ shrunken: isPanelHidden}")
      #preheader
        .some-flair(v-if="isMobile")
        .product-title(v-if="!isMobile")
          hr
          h3.apptitle MyStreet SF
          hr

        br(v-if="!isMobile")
        h2 MAP LAYERS:
        p You can add additional geographic data to the map from the options below.
        br
        br

        #layer-thingies(v-for="layer in extraLayers")
          label {{layer.name}}
          br
          .ui.toggle.checkbox.layer-selectors
            input(@click="clickedToggleLayer(layer.tag)"
                :name="layer.name"
                :checked="layer.show"
                type="checkbox")
            label &nbsp;
            br
          br

  transition(name="slide")
    .panel.sidepanel(v-if="showingFilterPanel" v-bind:class="{ shrunken: isPanelHidden}")
      .some-flair
      .information-panel(v-cloak)
        h2 FILTERS
        .pickers
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
                v-bind:class="{ active: filterStreets, green: filterStreets}"
          ) Streets

          button#btn-transit.tiny.ui.grey.button(
                v-on:click="clickedFilter"
                v-bind:class="{ active: filterTransit, blue: filterTransit}"
          ) Transit

          button#btn-areas.tiny.ui.grey.button(
                v-on:click="clickedFilter"
                v-bind:class="{ active: filterAreas, yellow: filterAreas}"
          ) Plans &amp; Programs

          #dropdowns
            .narrow-dropdown(style="float:left;")
              h5 DISTRICT:
              .ui.selection.fluid.dropdown
                .text: div(v-cloak) {{ nameOfFilterDistrict(filterDistrict) }}
                i.dropdown.icon
                .menu
                  .item(v-for="i in [-1,0,1,2,3,4,5,6,7,8,9,10,11]"
                        v-on:click="clickedDistrict(i)") {{ nameOfFilterDistrict(i) }}
            .narrow-dropdown(style="float:right;")
              h5 FUNDING SOURCE:
              .ui.selection.fluid.dropdown
                .text: div(v-cloak) {{ filterFund ? filterFund : "All sources&hellip;" }}
                i.dropdown.icon
                .menu
                  .item(@click="clickedFunds" v-bind:data-fund="null") All sources
                  .item(v-for="fund in fundSources" @click="clickedFunds" :data-fund="fund") {{ fund }}

  transition(name="slide")
    .panel.sidepanel(v-if="isMobile && showingMainPanel" v-bind:class="{ shrunken: isPanelHidden}")
      .some-flair
      .information-panel(v-cloak)
        .title-thing
          button.ui.button.small.pink.compact.icon(
            @click="clickedMoreDetails"
            style="margin:2px 0px 10px 15px; float:right;"
            v-if="infoUrl"
            )
            i.icon.chart.bar.outline
            | &nbsp;&nbsp;SHOW DETAILS&hellip;
          h2(:class="{noSelection: !infoUrl}" v-html="infoTitle")

        p(style="margin-top:10px; text-align: justify")  {{ clippedInfoDetails }}
        h3(v-if="!infoUrl" style="text-align: center")
          span(v-html="helptext.PRETEXT")
          router-link(:to="helptext.LINK_URL"): span(style="color: #fc4" v-html="helptext.LINK_TEXT")

  .panel.sidepanel(v-if="showingMainPanel && !isMobile" v-bind:class="{ shrunken: isPanelHidden}")
    #preheader
      hr
      h4.apptitle MyStreet SF

      .helpbar
        button.ui.right.labeled.icon.violet.tiny.button(
          @click="clickedToggleHelp")
          i.icon.info
          | What is this?
        |&nbsp;&nbsp;
        button.ui.right.labeled.icon.violet.tiny.button(
          @click="clickedLearnMore")
          i.icon.right.arrow
          | Learn More
      hr

    .information-panel(v-cloak)
        br
        h2(:class="{noSelection: !infoDetails}" v-html="infoTitle")
        p  {{ infoDetails }}
        h3(v-if="!infoDetails" style="text-align: center")
          span(v-html="helptext.PRETEXT")
          router-link(:to="helptext.LINK_URL"): span(style="color: #fc4" v-html="helptext.LINK_TEXT")

    #bottom-panel(v-cloak)
      .details-link
        button.ui.button.small.pink.compact.icon(
          v-if="infoUrl"
          @click="clickedMoreDetails"
          style="margin:2px 0px 0px 5px;"
          )
          i.icon.chart.bar.outline
          | &nbsp;&nbsp;More Details&hellip;

      .pickers
        hr
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
               v-bind:class="{ active: filterStreets, green: filterStreets}"
        ) Streets

        button#btn-transit.tiny.ui.grey.button(
               v-on:click="clickedFilter"
               v-bind:class="{ active: filterTransit, blue: filterTransit}"
        ) Transit

        button#btn-areas.tiny.ui.grey.button(
               v-on:click="clickedFilter"
               v-bind:class="{ active: filterAreas, yellow: filterAreas}"
        ) Plans &amp; Programs

        #dropdowns
          .narrow-dropdown(style="float:left;")
            h5 DISTRICT:
            .ui.selection.fluid.dropdown
              .text: div(v-cloak) {{ nameOfFilterDistrict(filterDistrict) }}
              i.dropdown.icon
              .menu
                .item(v-for="i in [-1,0,1,2,3,4,5,6,7,8,9,10,11]"
                      v-on:click="clickedDistrict(i)") {{ nameOfFilterDistrict(i) }}
          .narrow-dropdown(style="float:right;")
            h5 FUNDING SOURCE:
            .ui.selection.fluid.dropdown
              .text: div(v-cloak) {{ filterFund ? filterFund : "All sources&hellip;" }}
              i.dropdown.icon
              .menu
                .item(@click="clickedFunds" v-bind:data-fund="null") All sources
                .item(v-for="fund in fundSources" @click="clickedFunds" :data-fund="fund") {{ fund }}

        // logo panel
        .make-some-space
        table#table-logo
          tr
            td.agency-logo: h4.agency: b
              a(target="_blank"
                href="http://www.sfcta.org/"
              ) SAN FRANCISCO COUNTY TRANSPORTATION AUTHORITY
            td.agency-logo
              a.agency-link(target="_blank" href="http://www.sfcta.org/")
                img.img-logo(src="../assets/sfcta-logo-144.png" width="60")
  component(v-bind:is="whichSearchWidget")
  component(v-bind:is="mainComponent")
</template>

<script>
'use strict'

import 'babel-polyfill'
import * as turf from '@turf/turf'

// components
import CitywideProjects from '@/components/CitywideProjects'
import CitywideSearchWidget from '@/components/CitywideSearchWidget'
import MyMap from '@/components/MyMap'
import SearchWidget from '@/components/SearchWidget'

// Shared stuff across all components
import { BigStore, EventBus, EVENT } from '../shared-store.js'

let L = require('leaflet')
let jsonexport = require('jsonexport')
let keywordExtractor = require('keyword-extractor')
let omnivore = require('leaflet-omnivore')
let geocoding = require('mapbox-geocoding')

const BUFFER_DISTANCE_METERS_SHORT = 25
const BUFFER_DISTANCE_METERS_LONG = 275

const defaultPanelTitle = 'Select any project<br/>to learn more about it.'

let store = BigStore.state

let _projectsByTag = {}
let _tagList = []

const API_SERVER = 'https://api.sfcta.org/api/'
const GEO_VIEW = 'mystreet2_all'

let styles = {
  normal: { color: '#3c6', weight: 6, opacity: 1.0 },
  selected: { color: '#39f', weight: 8, opacity: 1.0 },
  popup: { color: '#36f', weight: 10, opacity: 1.0 },
}

function clickedFunds(e) {
  BigStore.state.filterFund = e.target.dataset.fund
  if (BigStore.debug) console.log({ FUND: store.filterFund })

  updateFilters()
}

function clickedNearbyProject(projectNumber) {
  store.infoTitle = 'HI ' + projectNumber
  EventBus.$emit(EVENT.CLICKED_ON_FEATURE, projectNumber)
}

function devClickedToggleDistrictOption() {
  BigStore.state.devDistrictOption = !BigStore.state.devDistrictOption
  if (BigStore.debug) console.log({ DEVCLICKED: BigStore.state.devDistrictOption })
  updateFilters()
}

function clickedShowHide(e) {
  store.isPanelHidden = !store.isPanelHidden
  // leaflet map needs to be force-recentered, and it is slow.
  EventBus.$emit(EVENT.MAP_RESIZE, BigStore.state.isPanelHidden)
}

function clickedToggleLayer(tag) {
  if (BigStore.debug) console.log('toggle layer', tag)

  let layer = store.extraLayers.filter(z => {
    return z.tag === tag
  })[0]

  if (!layer.show) layer.show = true
  else layer.show = !layer.show

  EventBus.$emit(EVENT.MAP_TOGGLE_LAYER, layer)
}

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

function switchPanel(panelToActivate) {
  store.isPanelHidden = true
  const delay =
    store.showingMainPanel || store.showingLayerPanel || store.showingFilterPanel ? 400 : 0

  setTimeout(function() {
    store.showingMainPanel = store.showingLayerPanel = store.showingFilterPanel = false
    store.isPanelHidden = panelToActivate == null

    if (panelToActivate) {
      store[panelToActivate] = true
    }
  }, delay)

  if (panelToActivate === 'showingFilterPanel') {
    setTimeout(function() {
      // eslint-disable-next-line
      $('.ui.dropdown').dropdown()
    }, delay + 250)
  }
}

function clickedShowMainPanel(e) {
  store.showingMainPanel = true
  store.showingLayerPanel = false
  store.showingFilterPanel = false
}

function clickedShowLayerSelector(e) {
  store.showingMainPanel = false
  store.showingLayerPanel = true
  store.showingFilterPanel = false
}

function clickedCloseNearby(e) {
  store.nearbyProjects = []
}

function mobileToggleMainPanel(e) {
  switchPanel(store.showingMainPanel ? null : 'showingMainPanel')
}

function mobileToggleFilterPanel(e) {
  switchPanel(store.showingFilterPanel ? null : 'showingFilterPanel')
}

function mobileToggleLayerSelector(e) {
  switchPanel(store.showingLayerPanel ? null : 'showingLayerPanel')
}

function clickedFilter(e) {
  let id = e.target.id

  if (id === 'btn-transit') BigStore.state.filterTransit = !BigStore.state.filterTransit
  if (id === 'btn-streets') BigStore.state.filterStreets = !BigStore.state.filterStreets
  if (id === 'btn-areas') BigStore.state.filterAreas = !BigStore.state.filterAreas

  if (id === 'btn-complete') {
    BigStore.state.filterComplete = !BigStore.state.filterComplete
    if (BigStore.state.filterComplete) BigStore.state.filterUnderway = false
  }
  if (id === 'btn-underway') {
    BigStore.state.filterUnderway = !BigStore.state.filterUnderway
    if (BigStore.state.filterUnderway) BigStore.state.filterComplete = false
  }

  updateFilters()
}

function clickedAnywhereOnMap(map) {
  // undo selection, if user clicked on base map
  if (map.originalEvent.target.id === 'mymap') {
    BigStore.state.infoTitle = defaultPanelTitle
    BigStore.state.infoDetails = ''
    BigStore.state.infoUrl = ''
    removeHighlightFromPreviousSelection()

    // drop panel if user is just clicking around
    if (store.isMobile) store.isPanelHidden = true
  }
}

function mounted() {
  // semantic requires this line for dropdowns to work
  // https://stackoverflow.com/questions/25347315/semantic-ui-dropdown-menu-do-not-work
  // eslint-disable-next-line
  $('.ui.dropdown').dropdown()

  store.isMobile = determineMobile()
  handleHash()
  addEscapeKeyListener()

  window.addEventListener('resize', function() {
    let isMobile = determineMobile()
    if (isMobile === store.isMobile) return

    if (!isMobile) switchingToDesktop()
    store.isMobile = isMobile
  })
}

function switchingToDesktop() {
  console.log('SWITCHING')
  store.showingFilterPanel = false
  store.isPanelHidden = false
  clickedShowMainPanel()
}

function addEscapeKeyListener() {
  document.addEventListener('keydown', e => {
    if (e.keyCode == 27) {
      store.nearbyProjects = []
      store.showDownload = false
      store.showHelp = false
    }
  })
}

function determineMobile() {
  let MOBILE_LIMIT = 768

  var w = window,
    d = document,
    e = d.documentElement,
    g = d.getElementsByTagName('body')[0],
    x = w.innerWidth || e.clientWidth || g.clientWidth

  _calculatedWidth = true

  return x < MOBILE_LIMIT
}

function handleHash() {
  if (BigStore.debug) console.log('HANDLE HASH: ' + window.location.hash)
  let p = getUrlParams()
  if (p) activateMapSettings(p)
}

function activateMapSettings(p) {
  if (BigStore.debug) console.log({ 'HASH PARMS': p })

  if (p.filter) {
    let filter = parseInt(p.filter)
    store.filterStreets = (filter & 1) == 1
    store.filterTransit = (filter & 2) == 2
    store.filterAreas = (filter & 4) == 4
    store.filterComplete = (filter & 8) == 8
    store.filterUnderway = (filter & 16) == 16
  }

  if (p.center && p.zoom) EventBus.$emit(EVENT.SET_MAP_VIEW, p)
  if (p.district) store.filterDistrict = parseInt(p.district)
  if (p.fund) store.filterFund = p.fund

  if (p.xlayer) {
    let layers = p.xlayer.split(',')
    for (let layer of layers) clickedToggleLayer(layer)
  }

  if (p.tags) EventBus.$emit(EVENT.ACTIVE_TAGS, p.tags)

  if (p.project) EventBus.$emit(EVENT.CLICKED_ON_FEATURE, p.project)
  if (p.project) EventBus.$emit(EVENT.SET_MAP_PROJECT, p.project)

  if (p.showall) store.devDistrictOption = true

  updateFilters()
}

/**
 * JavaScript Get URL Parameter
 *
 * @param String prop The specific URL parameter you want to retrieve the value for
 * @return String|Object If prop is provided a string value is returned, otherwise an object of all properties is returned
 */
function getUrlParams(prop) {
  var params = {}
  var search = decodeURIComponent(window.location.hash.slice(1))
  var definitions = search.split('&')

  definitions.forEach(function(val, key) {
    var parts = val.split('=', 2)
    params[parts[0]] = parts[1]
  })
  return prop && prop in params ? params[prop] : params
}

function nameOfFilterDistrict(i) {
  if (i === -1) return 'All Projects...'
  if (i === 0) return 'Citywide'
  return 'District ' + i
}

let _calculatedWidth = false

export default {
  name: 'MyStreet',
  components: { CitywideProjects, CitywideSearchWidget, MyMap, SearchWidget },
  data() {
    return store
  },
  computed: {
    tagsActiveOrMatchingSearch: function() {
      let a = new Set(BigStore.state.tagresults)
      let union = Array.from(a)
      for (let activeTag of BigStore.state.filterTags) {
        if (!a.has(activeTag)) union.push(activeTag)
      }
      return union
    },
    clippedInfoDetails: function() {
      if (store.infoDetails.length < 250) return store.infoDetails
      return store.infoDetails.substring(0, 250) + '...'
    },
  },
  mounted: function() {
    if (this.$route.path.includes('citywide')) store.mainComponent = 'CitywideProjects'
    mounted()
  },
  methods: {
    clickedCloseNearby,
    clickedCloseDownload,
    clickedDownload,
    clickedFilter,
    clickedFunds,
    clickedLearnMore,
    clickedMoreDetails,
    clickedNearbyProject,
    clickedShowHide,
    clickedShowMainPanel,
    clickedShowLayerSelector,
    clickedToggleHelp,
    clickedToggleLayer,
    clickedDistrict,
    clickedSearch,
    clickedSearchTag,
    devClickedToggleDistrictOption,
    downloadData,
    hoverAddress,
    hoverSearch,
    mobileToggleMainPanel,
    mobileToggleFilterPanel,
    mobileToggleLayerSelector,
    nameOfFilterDistrict,
    termChanged,
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
    $route(to, from) {
      if (to.path.includes('citywide')) store.mainComponent = 'CitywideProjects'
      else store.mainComponent = 'MyMap'
    },
  },
}

let _selectedProject, _selectedStyle
let _hoverProject, _hoverStyle

function clickedMoreDetails() {
  let z = getUrlParams()

  EventBus.$emit('MAP_SET_PROJECT', store.projectNumber)
  store.nearbyProjects = []

  this.$router.push(store.infoUrl)
}

function clickedDownload() {
  store.showDownload = true
}

function clickedCloseDownload() {
  store.showDownload = false
}

function selectedTagsChanged() {
  console.log(BigStore.state.selectedTags)
}

async function downloadData(filtered) {
  if (BigStore.debug) console.log('DOWnLOAD FILTERED ' + filtered)

  let data = []

  if (filtered) {
    for (const id of Object.keys(store.projectIDsCurrentlyOnMap)) {
      data.push(store.prjCache[id])
    }
    console.log(Object.keys(store.layers))
  } else {
    data = Object.values(store.prjCache)
  }

  jsonexport(data, function(err, csv) {
    if (err) {
      alert('Something went wrong; sorry. Please try again later.')
      return console.log(err)
    }
    sendDownloadFileToUser(csv)
  })

  store.showDownload = false
}

function sendDownloadFileToUser(csv) {
  let blob = new Blob([csv])
  if (window.navigator.msSaveOrOpenBlob)
    // IE hack; see http://msdn.microsoft.com/en-us/library/ie/hh779016.aspx
    window.navigator.msSaveBlob(blob, 'sfcta-mystreets-data.csv')
  else {
    var a = window.document.createElement('a')
    a.href = window.URL.createObjectURL(blob, { type: 'text/csv' })
    a.download = 'sfcta-mystreets-data.csv'
    document.body.appendChild(a)
    a.click() // IE: "Access is denied"; see: https://connect.microsoft.com/IE/feedback/details/797361/ie-10-treats-blob-url-as-cross-origin-and-denies-access
    document.body.removeChild(a)
  }
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
  EventBus.$emit(EVENT.MAP_SHOW_DISTRICT_OVERLAY, district)
}

function generateColorForSegment(segment) {
  let defaultColor = '#0071c6'

  let projectCategory = segment.project_group

  // no category? use blue.
  if (!projectCategory) return defaultColor

  // icon name in db? convert to a color code.
  switch (projectCategory) {
    case 'Transit':
      return '#0071c6'
    case 'Streets':
      return '#21ba45'
    case 'Plans and Programs':
      return '#fc4'
    default:
      return defaultColor
  }
}

function removeHighlightFromPreviousSelection() {
  if (_selectedProject) _selectedProject.setStyle(_selectedStyle)
}

function clickedToggleHelp() {
  BigStore.state.showHelp = !BigStore.state.showHelp
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

  // Remember what the thing looked like before we hovered or clicked on it
  _selectedStyle = _hoverStyle

  try {
    if (!_selectedStyle) _selectedStyle = e.layer.options.style
    if (!_selectedStyle) {
      _selectedStyle = JSON.parse(JSON.stringify(e.layer.options))
    }
  } catch (err) {
    let z = target.options
    _selectedStyle = {
      color: z.color,
      fillColor: z.fillColor,
      radius: z.radius,
      weight: z.weight,
      truecolor: z.truecolor,
    }
  }

  // save this project as the selected project; it's no longer just being hovered over!
  _hoverProject = null
  _selectedProject = target

  let clickedStyle = JSON.parse(JSON.stringify(styles.popup))
  clickedStyle.color = Color(_selectedStyle.truecolor).darken(0.4)
  clickedStyle.fillColor = _selectedStyle.truecolor
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
  console.log(numLayers)
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
        return turf.booleanCrosses(feature, clickBuffer)
      case 'Polygon':
      case 'MultiPolygon':
        return turf.booleanContains(feature, clickPoint)
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

function clickedDistrict(district) {
  if (BigStore.debug) console.log('Chose District', district)
  BigStore.state.filterDistrict = parseInt(district)

  updateFilters()
  showDistrictOverlay(district)
}

let _projectIdsCurrentlyOnMap = {}

function updateFilters() {
  store.showDownload = false
  EventBus.$emit(EVENT.UPDATE_FILTERS, 0)
}

function unHoverFeature(e) {
  // Remove highlight from previous selection
  if (_hoverProject) {
    _hoverProject.setStyle(_hoverStyle)
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
  BigStore.state.tagresults = answer
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
      BigStore.state.results = jsonData
    }
  } catch (error) {
    console.log('search error')
    console.log(error)
  }
}

function termChanged() {
  console.log(BigStore.state.terms)
  _queryString = BigStore.state.terms.trim()

  if (_queryString) fetchTagResults(_queryString)
  else BigStore.state.tagresults = []

  if (_queryString) fetchSearchResults(_queryString)
  else BigStore.state.results = []

  if (_queryString) fetchAddressResults(_queryString)
  else BigStore.state.addressSearchResults = []
}

function fetchAddressResults(_queryString) {
  geocoding.geocode('mapbox.places', _queryString, function(err, geoData) {
    console.log({ address_results_err: err, data: geoData })
    if (geoData.features.length) {
      for (let address of geoData.features) {
        let i = address.place_name.indexOf(', San Francisco')
        if (i > 0) address.place_name = address.place_name.substring(0, i)
      }
      BigStore.state.addressSearchResults = geoData['features']
    } else {
      BigStore.state.addressSearchResults = []
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
  if (BigStore.state.filterTags.has(tag)) {
    BigStore.state.filterTags.delete(tag)
  } else {
    BigStore.state.filterTags.add(tag)
  }
  console.log({ ACTIVE_TAGS: BigStore.state.filterTags })
  BigStore.state.filterKey++
  updateFilters()
}

let _addressMarker

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
  BigStore.state.results = results
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
[v-cloak] {
  display: none;
}

html,
body {
  overflow: hidden;
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
  border-radius: 5px;
  color: black;
  grid-column: 1 / 2;
  grid-row: 3 / 4;
  z-index: 5;
}

#search-panel input {
  padding: 10px 10px;
  width: 50%;
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
  overflow: hidden;
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
  grid-column: 1 / 5;
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

.information-panel h3 {
  padding-top: 20px;
  line-height: 1.5;
}

.information-panel a:visited {
  color: red;
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
  margin: 5px 0px;
  border-top: 1px solid #ccc;
}

.apptitle {
  font-size: 22px;
  margin: 0px 0px;
  margin-top: -5px;
  text-align: center;
}

.panel a {
  color: #fff;
}

.panel label {
  color: #fff;
}

.panel p {
  color: #ccc;
}

.panel h1,
h3,
h4,
h5 {
  color: white;
  padding: 0px 0px;
  margin: 0px 0px;
}

.panel hr {
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
  transition: opacity 0.3s;
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

.ui.checkbox.layer-selectors {
  margin: 5px 0px;
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
  background-color: #48f;
  box-shadow: 0px 0px 10px 5px rgba(0, 0, 0, 0.4);
  grid-row: 2 / 3;
  grid-column: 1 / 4;
  z-index: 30;
  width: minmax(min-content, 150px);
  max-width: 500px;
  margin: auto auto;
  padding: 0px 0px;
}

#downloadbox {
  box-shadow: 0px 0px 10px 5px rgba(0, 0, 0, 0.4);
  grid-row: 2 / 3;
  grid-column: 1 / 4;
  z-index: 30;
  background-color: #48f;
  width: minmax(min-content, 150px);
  max-width: 500px;
  margin: auto auto;
  padding: 0px 0px;
}

#nearbyprojects {
  grid-row: 1 / 4;
  grid-column: 1 / 4;
  box-shadow: 0px 0px 10px 5px rgba(0, 0, 0, 0.25);
  font-size: 8px;
  z-index: 2;
  width: 320px;
  margin: 10px 10px 5px 5px;
  padding: 0px 0px 5px 5px;
  color: black;
  position: fixed;
  left: 0px;
  top: 0px;
  z-index: 22;
  transition: visibility 1s 1s, opacity 0.5s linear;
}

.black {
  color: black;
}

.myotherbox p,
li {
  color: #888;
  line-height: 1.2;
}

.nearby-title {
  margin: 10px 5px;
  color: black;
}

.nearby-row {
  color: #666;
  font-weight: 400;
  font-size: 13px;
  padding-top: 5px;
  padding-left: 5px;
  height: 45px;
}

.nearby-row:hover {
  background-color: #eee;
}

.make-some-space {
  height: 85px;
}

#layer-widgets-mobile {
  display: none;
}

@media only screen and (max-width: 768px) {
  .slide-enter-active,
  .slide-leave-active {
    transition: margin 0.5s;
  }
  .slide-enter, .slide-leave-to /* .fade-leave-active below version 2.1.8 */ {
    margin-bottom: -500px;
  }

  #container {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: auto auto-fill auto;
  }

  .sidepanel {
    opacity: 0.95;
    display: grid;
    grid-column: 1 / 2;
    grid-row: 2 / 3;
    align-self: end;
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;
    margin-top: auto;
    margin-right: 0px;
    padding: 0px 15px 20px 15px;
    transition: margin 0.5s;
    width: 100%;
    height: auto;
    z-index: 4;
  }

  .shrunken {
    margin-right: 0px;
    margin-bottom: -1000px;
  }

  #layer-widgets {
    display: none;
    flex-direction: row;
    border-radius: 0px;
    background-color: #333;
    grid-column: 1 / 2;
    grid-row: 3 / 4;
    position: relative;
    margin-bottom: 0px;
    width: 100%;
    z-index: 4;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
  }

  #layer-widgets-mobile {
    display: flex;

    justify-content: center;
    padding: 5px;
    position: relative;
    flex-direction: row;
    background-color: #f8f8f8;
    grid-column: 1 / 2;
    grid-row: 3 / 4;
    width: 100%;
    z-index: 10;
    margin: 0 0;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
  }

  #layer-widgets-mobile button {
    margin-left: 2px;
  }

  #search-panel {
    grid-column: 1 / 2;
    grid-row: 1 / 4;
    z-index: 12;
    margin: 10px 80px 10px 10px;
  }

  #mymap {
    grid-column: 1 / 2;
    grid-row: 1 / 4;
    z-index: 1;
  }

  .some-flair {
    width: 100%;
    height: 8px;
    margin-right: 25px;
    background-color: rgb(235, 36, 201);
  }
  .title-thing {
    margin-top: 12px;
  }
}
</style>
