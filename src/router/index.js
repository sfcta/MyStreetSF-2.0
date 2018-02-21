import Vue from 'vue'
import Router from 'vue-router'
import MyStreet from '@/components/MyStreet'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'MyStreet',
      component: MyStreet
    }
  ]
})
