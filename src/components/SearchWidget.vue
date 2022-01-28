<template lang="pug">
#search-widget
    #search-term-box.ui.fluid.icon.inverted.input
      input(v-model="terms"
            tabindex="1"
            type="text"
            v-on:keyup.esc="clearSearchBox"
            placeholder="Search by project name, topic...")
      i.search.icon(v-if="!terms")
      i.remove.link.icon(v-if="terms" v-on:click="clearSearchBox")
    #search-results(v-cloak v-if="addressSearchResults.length + results.length + tagresults.length + filterTags.size")
      .ui.relaxed.list
        .search-category(v-if="terms && (tagresults.length + filterTags.size)")
          p TAGS
        #search-tags.tiny.pink.ui.button(
          v-for="tag in tagsActiveOrMatchingSearch"
          @click='clickedSearchTag(tag)'
          :key="filterKey+tag"
          :class="{ basic: !filterTags.has(tag) }"
        ) {{ tag }}

        .search-category(v-if="addressSearchResults.length")
          p ADDRESSES
        template(v-for="address in addressSearchResults")
          div(v-on:click="clickedAddress(address)"
              v-on:mouseover="hoverAddress(address)")
            .search-item.address-item(:class="{ red: address.red==true }")
              h4 {{ address.place_name }}

        .search-category(v-if="results.length")
          p PROJECTS
        template(v-for="result in results")
          div(v-on:click="clickedSearch(result.id)"
              v-on:mouseover="hoverSearch(result.id)")
            .search-item
              h4 {{ result.name }}
</template>

<script>
'use strict'

import 'babel-polyfill'

// Shared stuff across all components
import { BigStore, EventBus, EVENT } from '../shared-store.js'

import FuzzySearch from 'fuzzy-search';

let keywordExtractor = require('keyword-extractor')
let geocoding = require('mapbox-geocoding')

let _tagList = []

let store = BigStore.state

function mounted() {}

export default {
  name: 'SearchWidget',
  components: {},
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
    clickedSearch: clickedSearch,
    clickedSearchTag: clickedSearchTag,
    clearSearchBox: clearSearchBox,
    hoverAddress: hoverAddress,
    hoverSearch: hoverSearch,
    termChanged: termChanged,
  },
  watch: {
    terms: termChanged,
    selectedTags: selectedTagsChanged,
  },
}

function selectedTagsChanged() {
  console.log(store.selectedTags)
}

function updateFilters() {
  EventBus.$emit('map-update-filters', 0)
}

let _queryString

async function fetchTagResults(terms) {
  if (BigStore.debug) console.log({ TAGLIST: _tagList })
  let answer = []
  let termsLower = terms.toLowerCase()
  for (let tag of store.tags) {
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
}

async function fetchSearchResults(terms) {

  const searcher = new FuzzySearch(
    store.cacheDb,
    ['project_name', 'description'],
    {
      sort: true
    }
  )

  const matchingProjects = searcher.search(terms)
  const result = matchingProjects.map((project) => {
    return {
      "id": project["project_number"],
      "name": project["project_name"]
    }
  });

  store.results = result;
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
  // For now, we are going to ignore addresses that do not begin with a number.
  // This means you can't search for landmarks, but it also means that nothing
  // will get returned when you search "Broadway" which is what SFCTA wants.

  let addressField = parseInt(_queryString, 10)
  if (Number.isNaN(addressField)) {
    store.addressSearchResults = []
    return
  }

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
  EventBus.$emit(EVENT.HOVER_ON_FEATURE, id)
}

function clickedSearch(id) {
  EventBus.$emit(EVENT.CLICKED_ON_FEATURE, id)
}

function clickedSearchTag(tag) {
  if (store.filterTags.has(tag)) {
    store.filterTags.delete(tag)
  } else {
    store.filterTags.add(tag)
  }
  console.log({ ACTIVE_TAGS: store.filterTags })
  store.filterKey++
  updateFilters()
}

function clickedAddress(address) {
  EventBus.$emit('clicked-address', address)
}

function hoverAddress(address) {
  // console.log(address)
}

function clearSearchBox() {
  store.terms = ''
  store.addressSearchResults = []
  EventBus.$emit(EVENT.REMOVE_ADDRESS_MARKER, '')
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

#search-widget {
  background-color: white;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.5);
  border-radius: 5px;
  color: black;
  grid-row: 1 / 2;
  grid-column: 1 / 2;
  margin: 10px 10px 10px 10px;
  z-index: 5;
}

#search-widget input {
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
@media only screen and (max-width: 768px) {
  #search-widget {
    margin: 10px 80px 10px 10px;
  }
}

@media all and (-ms-high-contrast: none), (-ms-high-contrast: active) {
  #search-widget {
    position: absolute;
    background-color: white;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.5);
    border-radius: 5px;
    color: black;
    margin: 10px 10px 10px 10px;
    width: 350px;
    z-index: 5;
  }
}
</style>
