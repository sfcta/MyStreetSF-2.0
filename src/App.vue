<template>
  <div id="app" :class="{'prevent-overscroll': preventOverscroll}">
    <router-view />
  </div>
</template>

<script>
import { BigStore, EventBus, EVENT } from './shared-store.js'

export default {
  name: 'App',

  data() {
    return BigStore.state
  },

  mounted: function() {
    mounted()
  },
}

function mounted() {
  EventBus.$on(EVENT.SET_PREVENT_OVERSCROLL, overscroll => {
    if (BigStore.debug) console.log('setting prevent-overscroll: ' + overscroll)
    BigStore.state.preventOverscroll = overscroll
  })
}
</script>

<style>
body,
p,
h1,
h2,
h3,
h4,
h5,
h6 {
  font-family: 'Lato', Helvetica, Arial, sans-serif;
  margin: 0px 0px;
  padding: 0px 0px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

#app {
  height: 100%;
  font-family: 'Lato', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #444;
}

.prevent-overscroll {
  position: fixed;
  width: 100%;
  overflow-y: hidden;
  overscroll-behavior: contain;
}
</style>
