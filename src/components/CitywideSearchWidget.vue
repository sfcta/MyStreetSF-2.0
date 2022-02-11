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
</template>

<script>
'use strict'

import 'babel-polyfill'

// Shared stuff across all components
import { BigStore, EventBus, EVENT } from '../shared-store.js'


let store = BigStore.state

function mounted() {
  if (BigStore.debug) console.log('CITYWIDE SEARCH WIDGET')
}

export default {
  name: 'CitywideSearchWidget',
  components: {},
  data() {
    return store
  },
  computed: {},
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

function termChanged() {
  console.log(store.terms)
  _queryString = store.terms.trim()

  EventBus.$emit(EVENT.SEARCH_TERM_CHANGED, _queryString)
}

let _hoverSearchLastId

function hoverSearch(id) {
  if (id === _hoverSearchLastId) return

  _hoverSearchLastId = id
  // EventBus.$emit(EVENT.MAP_HOVER_FEATURE, id)
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
  EventBus.$emit(EVENT.SEARCH_TERM_CHANGED, '')
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
[v-cloak] {
  display: none;
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
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.4);
  border-radius: 5px;
  color: black;
  grid-row: 1 / 2;
  grid-column: 1 / 2;
  margin: 10px 30px 10px 10px;
  position: relative;
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

.shrunken {
  margin-right: -394px;
}

#preheader {
  grid-column: 1 / 2;
  grid-row: 1 / 2;
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

.project-list-popup .leaflet-popup-content {
  margin: 8px 20px 8px 10px;
}
.project-list-popup .leaflet-popup-content-wrapper {
  border-radius: 5px !important;
}

h2.noSelection {
  text-align: center;
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
