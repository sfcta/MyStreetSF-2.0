<template lang="pug">
#project-page
  router-link(to='/') &laquo; To the map
  br
  br

  h1 Citywide Projects
  h4(style="color:#444;") A list of projects which are citywide in nature, or which can't be easily placed on the map.
  br

  table
    tr.project-subtitle(style="background-color: #0071c6")
      td(colspan=2): h3 Transit Projects
    tr.project-details(v-for="prj in transitProjects")
      td.project-details: b {{ prj.project_name }}
      td.project-details.col2
        | {{ prj.description }}
        router-link(:to="'/projects/' + prj.project_number") &nbsp;&nbsp;&raquo;more&nbsp;info&hellip;
    tr.project-details
      td &nbsp;

    tr.project-subtitle(style="background-color: #21ba45")
      td(colspan=2): h3 Street Projects
    tr.project-details(v-for="prj in streetProjects")
      td.project-details: b {{ prj.project_name }}
      td.project-details.col2
        | {{ prj.description }}
        a(href="/") &nbsp;&nbsp;&raquo;more&nbsp;info&hellip;
    tr.project-details
      td &nbsp;

    tr.project-subtitle(style="background-color: #fc4")
      td(colspan=2): h3 Plans and Studies
    tr.project-details(v-for="prj in plans")
      td.project-details: b {{ prj.project_name }}
      td.project-details.col2
        | {{ prj.description }}
        a(href="/") &nbsp;&nbsp;&raquo;more&nbsp;info&hellip;
    tr.project-details
      td &nbsp;
  br
</template>

<script>
'use strict'

// use npm and babel to support IE11/Safari
import 'babel-polyfill'
import 'isomorphic-fetch'

// Shared stuff across all components
import { BigStore } from '../shared-store.js'

let store = {
  transitProjects: [],
  streetProjects: [],
  plans: [],
  sharedState: BigStore.state,
}

export default {
  name: 'CitywideProjects',
  data() {
    return store
  },
  mounted: function() {
    mounted(this) // 'this' is the VueComponent
  },
  methods: {},
  watch: {},
}

async function mounted(component) {
  // add project KML
  let allProjects = await fetchCitywideProjects()

  store.transitProjects = allProjects.filter(allProjects => allProjects.project_group === 'Transit')
  store.streetProjects = allProjects.filter(allProjects => allProjects.project_group === 'Streets')
  store.plans = allProjects.filter(allProjects => allProjects.project_group === 'Plans and Programs')
}

async function fetchCitywideProjects() {
  if (BigStore.debug) console.log('>>>> FETCHING citywide projects')
  // might already be in cache:
  // if (store.sharedState.prjCache[id]) return store.sharedState.prjCache[id]
  // id = id.toUpperCase()

  const API_SERVER = 'https://api.sfcta.org/api/'
  const GEO_VIEW = 'mystreet2_all'
  const FILTER = '?districts=eq.Citywide'

  const geoUrl = API_SERVER + GEO_VIEW + FILTER
  if (BigStore.debug) console.log(geoUrl)

  try {
    let resp = await fetch(geoUrl)
    let jsonData = await resp.json()
    if (BigStore.debug) console.log({CITYWIDE: jsonData})
    return jsonData
  } catch (error) {
    console.log({ERROR: error})
  }
  //  TODO throw a 404 here?
  console.log('Something wrong here')
  return []
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

#project-page {
  height: 100%;
  max-width: 1100px;
  margin: 0px auto;
  padding: 20px 20px;
}

#mymap {
  margin: 10px 10px;
  z-index: 1;
}

#hover-panel {
  grid-row: 3 / 4;
  grid-column: 1 / 3;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.5);
  border-radius: 5px;
  margin: 0px auto;
  margin-bottom: 25px;
  padding: 1px 10px;
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

.bottom-panel {
  display: table-row;
  text-align: right;
  vertical-align: bottom;
  margin-left: 10px;
  margin-right: 10px;
  margin-bottom: 0px;
  height: 80px;
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
  padding: 15px 5px 5px 5px;
  width: max-content;
}

td.col2 {
  text-align: left;
}

.project-subtitle {
  background-color: #c80;
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

#main-content {
  margin-top: 100px;
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
  font-weight: bold;
  padding-top: 10px;
  padding-left: 10px;
}

h3.project-subtitle {
  padding: 10px;
}

a {
  color: #33c;
}
</style>
