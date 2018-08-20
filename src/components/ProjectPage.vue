<template lang="pug">
#container
  .banner1
    .content-barea
      .banner1-title(v-cloak)
        h1(style="color:white") MyStreet SF
        p Project Details: {{ geojson['sponsor'] }} Project {{project_number}}
      .banner1-logo
        table#table-logo
          tr
            td.agency-logo: h4.agency: b
              a(target="_blank"
                href="http://www.sfcta.org/"
              ) SAN&nbsp;FRANCISCO&nbsp;COUNTY<br/>TRANSPORTATION&nbsp;AUTHORITY
            td.agency-logo
              a.agency-link(target="_blank" href="http://www.sfcta.org/")
                img.img-logo(src="../assets/sfcta-logo-144.png" width="60")
  .banner2

  #project-detail-container
    #nav-column
      #nav-links(v-if="project_name")
        button.ui.button.small.basic.labeled.icon.violet(@click="clickedBack" style="width:100%;")
         i.icon(:class="backButtonIcon")
         | {{ backButtonText }}

      .widget(v-if="!isCitywide")
        p(:style="color") Project Location
        #zoom-map

      .widget
        p(:style="color") Share this!
        a(target="_blank"
          :href="'https://twitter.com/intent/tweet?text=' + cleanProjectName + ' ' + currentRoute"
          title="Twitter")
          img(src="../assets/twitter.png" )
        a(target="_blank"
          :href="'https://www.facebook.com/sharer/sharer.php?u=' + currentRoute"
          title="Facebook")
          img(src="../assets/fb.png")
        a(target="_blank"
          :href="'https://pinterest.com/pin/create/button/?url=' + currentRoute"
          title="Pinterest")
          img(src="../assets/pinterest.png")
        a(target="_blank"
          :href="'https://www.linkedin.com/shareArticle?mini=true&url=' + currentRoute + '&title=' + cleanProjectName"
          title="LinkedIn")
          img(src="../assets/linkedin.png")
        a(target="_blank"
          :href="'https://www.reddit.com/submit?url='+ currentRoute + '&title='+ cleanProjectName"
          title="Reddit")
          img(src="../assets/reddit.png")
        a(target="_blank"
          :href="'mailto:?&subject=' + cleanProjectName + '&body=Check out the SFCTA MyStreet project page for:%0D%0A%0D%0A' + cleanProjectName + '%0D%0A' + currentRoute"
          title="Email")
          img(src="../assets/email.png")

    #main-column
      h1 {{ project_name }}

      .brief-info
        h3.billy-header(:style="color") Brief Project Description
        p.project-description {{ description }}

      .detailed-info
        h3.billy-header(:style="color") Detailed Project Information
        table
          tr.project-details(v-for="row in details")
            td.project-details: b {{ row[0] }}
            td.project-details.col2 {{ row[1] }}

      .for-more-info
        h3.billy-header(:style="color") For More Information
        table
          tr.project-details
            td.project-details: b Link to Project
            td.project-details.col2
              a(v-bind:href="geojson.project_details_page" target="_blank") {{ geojson.project_details_page }}

  .footer
    .banner2
    .banner1
      .content-barea
        p All content &copy; 2018 San Francisco County Transportation Authority.
        br
</template>

<script>
'use strict'

// use npm and babel to support IE11/Safari
import 'babel-polyfill'
import 'isomorphic-fetch'

// Shared stuff across all components
import { BigStore } from '../shared-store.js'

let L = require('leaflet')
let omnivore = require('leaflet-omnivore')

let mymap
let theme = 'light'

let TRUE_COLOR = { TRANSIT: '#0071c6', STREETS: '#21ba45', PLANS: '#eb4' }

let store = {
  backButtonIcon: 'map',
  backButtonText: 'VIEW ON MAP',
  color: TRUE_COLOR.TRANSIT,
  description: '',
  details: [],
  geojson: {},
  isCitywide: false,
  project: '',
  project_name: '',
  project_number: '',
  sharedState: BigStore.state,
}

export default {
  name: 'ProjectPage',
  data() {
    return store
  },
  computed: {
    cleanProjectName: function() {
      return store.project_name.replace('&', '%26')
    },
    currentRoute: function() {
      let port = window.location.port != 80 ? ':' + window.location.port : ''
      return (
        window.location.protocol +
        '//' +
        window.location.hostname +
        port +
        '/project/' +
        store.project_number
      )
    },
  },
  mounted: function() {
    mounted(this) // 'this' is the VueComponent
  },
  methods: {
    clickedBack,
  },
  watch: {},
}

function clickedBack() {
  let goBack = store.isCitywide ? '/citywide' : '/#project=' + store.project_number
  this.$router.push(goBack)
}

async function mounted(component) {
  console.log('HEERE')
  let id = component.$route.params.id

  if (BigStore.debug) console.log({ project_id: id })

  // add project KML
  clearProjectDetails()
  store.geojson = await fetchProjectInfo(id)
  setProjectDetails()

  document.title = store.project_name + ' - MyStreet SF'

  addBaseMap()
  addProjectMapLayer(id)
}

function clearProjectDetails() {
  store.details = []
  store.description = ''
  store.project = ''
  store.project_name = ''
  store.project_number = ''
}

function setProjectDetails() {
  store.project_name = store.geojson['project_name']
  store.description = store.geojson['description'] || store.project_name
  store.project_number = store.geojson['project_number']
  store.color = { color: generateColorFromDb() }

  if ('Citywide' === store.geojson.districts) {
    store.isCitywide = true
    store.backButtonIcon = 'th' // back button icon th==table of dots
    store.backButtonText = 'VIEW CITYWIDE PROJECTS'
  } else {
    store.isCitywide = false
  }

  let phase = store.geojson['current_phase']
  if (phase.endsWith(' ()')) {
    phase = phase.substring(0, phase.length - 3)
  }

  let openForUse = store.geojson['project_expected_completion']
  if (store.geojson['project_group'] === 'Plans and Programs') {
    openForUse = 'N/A'
  }

  let cost = store.geojson['project_cost_estimate']
  if (cost && cost.charAt(cost.length - 3) === '.') cost = cost.substring(0, cost.length - 3)

  store.details.push(['Phase(s)', phase])
  store.details.push(['Percent Complete of Funded Phase(s)', store.geojson['percent_complete']])
  store.details.push(['Open for Use', openForUse])
  store.details.push(['Lead Agency', store.geojson['sponsor']])
  store.details.push(['Location', store.geojson['project_location']])
  store.details.push(['District(s)', store.geojson['districts']])
  store.details.push(['Total Project Cost', cost])
  store.details.push(['Funding Sources', store.geojson['funding_sources']])
  // store.details.push(['Tags', store.geojson['project_tags']])
}

async function fetchProjectInfo(id) {
  // might already be in cache:
  if (store.sharedState.prjCache[id]) return store.sharedState.prjCache[id]
  id = id.toUpperCase()

  const API_SERVER = 'https://api.sfcta.org/api/'
  const GEO_VIEW = 'mystreet2_all'
  const FILTER = '?project_number=eq.' + id

  const geoUrl = API_SERVER + GEO_VIEW + FILTER
  if (BigStore.debug) console.log(geoUrl)

  try {
    let resp = await fetch(geoUrl)
    let jsonData = await resp.json()

    if (jsonData[0]) return jsonData[0]
  } catch (error) {
    console.log('map error: ' + error)
  }
  //  TODO throw a 404 here?
  console.log('Project ID not found', id)
  return {}
}

function styleByMetricColor(iconName, polygon) {
  let xcolor = generateColorFromDb()
  let radius = 4
  if (iconName && iconName.startsWith('measle')) radius = 8

  return {
    color: xcolor,
    fillColor: xcolor,
    fillOpacity: 0.5,
    opacity: 1.0,
    radius: radius,
    weight: polygon ? 0 : 4,
  }
}

function generateColorFromDb() {
  let projectCategory = store.geojson.project_group
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

function addBaseMap() {
  let url =
    'https://api.mapbox.com/styles/v1/mapbox/' +
    theme +
    '-v9/tiles/256/{z}/{x}/{y}?access_token={accessToken}'
  let token =
    'pk.eyJ1IjoicHNyYyIsImEiOiJjaXFmc2UxanMwM3F6ZnJtMWp3MjBvZHNrIn0._Dmske9er0ounTbBmdRrRQ'
  let attribution =
    '<a href="http://openstreetmap.org">OpenStreetMap</a> | ' +
    '<a href="http://mapbox.com">Mapbox</a>'

  mymap = L.map('zoom-map', {
    attributionControl: false,
    clickable: false,
    doubleClickZoom: false,
    dragging: false,
    interactive: false,
    scrollWheelZoom: false,
    zoomAnimation: false,
    zoomControl: false,
    zooming: false,
  }).setView([37.77, -122.42], 11)

  L.tileLayer(url, {
    accessToken: token,
    attribution: attribution,
    bubblingMouseEvents: true,
    clickable: false,
    interactive: false,
    maxZoom: 18,
  }).addTo(mymap)
}

function addProjectMapLayer(id) {
  let geometry = store.geojson['geometry']
  let shape = store.geojson['feature_shape']
  let icon = store.geojson['icon']

  if (!geometry) return

  let kml =
    '<kml xmlns="http://www.opengis.net/kml/2.2">' + '<Placemark>' + geometry + '</Placemark></kml>'

  let polygon = false
  if (shape && shape.includes('Polygon')) polygon = true

  let geoLayer = L.geoJSON(null, {
    style: styleByMetricColor(icon, polygon),
    pointToLayer: function(feature, latlng) {
      // this turns 'points' into circles
      return L.circleMarker(latlng, { id: id })
    },
  })

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
    mymap.fitBounds(layer.getBounds(), { padding: [10, 10], maxZoom: 15 })
    layer.addTo(mymap)
    if (polygon) layer.bringToBack()
  } catch (e) {
    console.log('couldnt: ' + e)
  }
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

.content-barea {
  max-width: 1100px;
  margin: 0px auto;
  padding: 10px 20px 20px 40px;
  display: flex;
}

#project-detail-container {
  display: grid;
  grid-template-columns: 1fr 275px;
  grid-template-rows: 1fr;
  grid-gap: 40px;
  max-width: 1100px;
  margin: 0px auto;
  padding: 20px 40px;
  overflow-y: auto;
}

#zoom-map {
  grid-row: 1 / 2;
  grid-column: 2 / 3;
  width: 218px;
  height: 218px;
  margin-bottom: 10px;
  background-color: #eee;
  border: 1px solid #ea790d;
  border-radius: 4px;
  box-shadow: 0 0 3px #00000060;
}

#main-column {
  grid-row: 1 / 2;
  grid-column: 1 / 2;
  margin-top: 50px;
}

#nav-column {
  grid-row: 1 / 2;
  grid-column: 2 / 3;
  display: flex;
  flex-direction: column;
  margin-top: 50px;
  justify-self: end;
}

.hover-panel-hide {
  visibility: hidden;
  opacity: 0;
  transition: visibility 0s 0.5s, opacity 0.5s linear;
}

#nav-links {
  grid-row: 1 / 2;
  grid-column: 2 / 3;
  color: #ddd;
  font-size: 13px;
  font-weight: bold;
  padding-bottom: 2px;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 20px;
}

#hover-panel p {
  color: #66a;
  font-weight: 700;
  font-size: 13px;
}

.information-panel {
  max-height: 100%;
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
  margin-bottom: 4px;
  margin-top: 25px;
}

.details-link {
  text-align: right;
  margin-right: 10px;
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

.navbar-default {
  border-color: transparent;
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.5);
  z-index: 22000;
}

.navbar-default .navbar-brand {
  color: #f0a033;
  padding-top: 0px;
}

/* navbar items */
.navbar-default .nav li a {
  font-weight: 400;
  letter-spacing: 1px;
  text-shadow: 1px 0px 1px #fff;
  color: #228;
  background-color: #ffffff88;
  transition: background-color 0.15s ease-in-out 0s;
}

/* navbar hover */
.navbar-default .nav li a:hover,
.navbar-default .nav .navbar-selected li a:focus {
  color: #fff;
  text-shadow: 1px 0px 1px #228;
  background-color: #737f88a0; /* #48533dcc; /* rgba(0, 0, 0, 0.7); */
}

.navbar-selected {
  font-weight: 400;
  letter-spacing: 1px;
  text-shadow: 1px 0px 1px #fff;
  color: #228;
  background-color: #ffffff88;
  transition: background-color 0.15s ease-in-out 0s;
}

.navbar-selected a:hover,
.navbar-selected a:focus {
  color: #fff;
  text-shadow: 1px 0px 1px #228;
  background-color: #737f88a0; /* #48533dcc; /* rgba(0, 0, 0, 0.7); */
}

.collapse.navbar-collapse {
  padding-right: 25px;
}

header {
  text-align: left;
  color: #fff;
  background-attachment: scroll;
  background-position: center center;
  background-repeat: none;
  -webkit-background-size: cover;
  -moz-background-size: cover;
  background-size: cover;
  -o-background-size: cover;
  z-index: 5000;
}

footer {
  margin: 50px 0px 0px 0px;
  padding: 25px 0;
  text-align: center;
  background-color: #99ac90;
  color: white;
}
footer a {
  color: white;
}
footer a:hover {
  color: #23527c;
}

footer p {
  margin: 0 0;
}

footer span.copyright {
  text-transform: none;
  line-height: 40px;
}

footer ul.quicklinks {
  margin-bottom: 0;
  text-transform: none;
  line-height: 40px;
}

::-moz-selection {
  text-shadow: none;
  background: #f0a033;
}

::selection {
  text-shadow: none;
  background: #f0a033;
}

img::selection {
  background: 0 0;
}

img::-moz-selection {
  background: 0 0;
}

body {
  webkit-tap-highlight-color: #f0a033;
}

.banner-logo {
  position: absolute;
  padding-top: 15px;
  margin-left: 20px;
  transition: padding 0.3s, height 0.3s;
  -webkit-filter: drop-shadow(0px 5px 0px 2px);
  filter: drop-shadow(0px 1px 2px #00000080);
}

.title-link a {
  color: #f0a033;
}
.title-link:hover a {
  text-decoration: none;
}

.bottom-link {
  font-size: 13px;
  font-style: italic;
}

.bottom-link a {
  margin-right: 15px;
}

td.project-details {
  text-align: right;
  vertical-align: top;
  padding: 5px 5px 5px 5px;
  width: max-content;
}

td.col2 {
  text-align: left;
}

.project-subtitle {
  background-color: #f00;
  width: 100%;
}

.project-table {
  width: 100%;
  border-collapse: collapse;
}
.project-table th,
td {
  padding: 8px;
  border: none;
}
/* provide some minimal visual accomodation for IE8 and below */
.project-table tr {
  background: #b8d1f3;
}
/*  Define the background color for all the ODD background rows  */
.project-table tr:nth-child(odd) {
  background: #eeeeee;
}
/*  Define the background color for all the EVEN background rows  */
.project-table tr:nth-child(even) {
  background: #f8f8f8;
}

.project-table tr:hover td {
  background-color: #e5e5e5;
}

#header {
  display: none;
  display: table-row;
  vertical-align: top;
}

a {
  color: #fff;
  text-decoration: none;
}

a:hover {
  color: #ddd;
}

#table-logo {
  margin-top: 5px;
}

.agency h4 {
  text-decoration: none;
}

p.hint {
  color: #777;
  text-align: right;
  margin-right: 24px;
  margin-top: -20px;
}

.colors {
  margin: 5px;
  cursor: pointer;
  border-style: solid;
  border-width: 1px;
  border-color: #eee;
  opacity: 0.8;
}
.colors:hover {
  opacity: 1;
  border-color: #fff;
}

#popup-title {
  color: #222;
  margin-top: 0px;
  padding-top: 0px;
}

a:hover {
  color: #46f;
}

li {
  margin-bottom: 4px;
}
ul {
  margin-top: 5px;
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

.navbar-default {
  border: 0;
  background-color: #99ac90;
  /* #fa991d; this is a nice approx of the TA banner color mix */
  background-repeat: no-repeat;
  background-size: cover;
  -webkit-transition: padding 0.3s;
  -moz-transition: padding 0.3s;
  transition: padding 0.3s;
}

.lead {
  color: #888;
}

.project-description {
  line-height: normal;
  font-size: 16px;
  color: black;
  font-weight: normal;
  padding-top: 10px;
  padding-left: 10px;
}

h3.project-subtitle {
  padding: 10px;
}

.widget {
  grid-row: 1 / 2;
  grid-column: 2 / 3;
  vertical-align: center;
  padding-top: 20px;
  padding-bottom: 10px;
}

.widget a {
  padding-right: 5px;
}

.widget a:hover {
  opacity: 0.9;
}

.widget img {
  width: 2.25em;
}
.widget img:hover {
  transform: translateY(1px);
}

.widget p {
  color: #ddd;
  font-size: 14px;
  font-weight: bold;
  padding-bottom: 2px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

a {
  color: #33c;
}

.banner1 {
  background-color: #444;
}

.banner1-title {
  margin-top: 80px;
  width: 100%;
}

.banner1-title p {
  font-size: 13px;
  color: #999;
}

.banner2 {
  background-color: #6435c9;
  height: 18px;
}

.footer {
  margin-top: 50px;
  height: 100px;
  background-color: #444;
}
.footer p {
  margin: 0 auto;
  margin-top: 15px;
  font-size: 13px;
  color: #999;
}

.billy-header {
  color: #ddd;
  margin-top: 30px;
  text-transform: uppercase;
  letter-spacing: 1.2px;
}

#container {
  background-color: white;
}

.banner1-title {
  margin-top: 20px;
}

@media only screen and (max-width: 768px) {
  #project-detail-container {
    display: flex;
    flex-direction: column;
  }

  #main-column {
    margin-top: 10px;
    order: 1;
  }

  #nav-column {
    order: 2;
  }

  #zoom-map {
    width: 100%;
    height: 250px;
  }
}

@media only screen and (max-width: 600px) {
  .banner1-logo {
    align-self: flex-end;
  }

  #project-detail-container {
    padding: 15px 15px;
  }

  .content-barea {
    margin: 0px auto;
    padding: 0px 10px 20px 15px;
    display: flex;
    flex-direction: column-reverse;
  }
}
</style>
