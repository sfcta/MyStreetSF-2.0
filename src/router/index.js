import Vue from 'vue'
import Router from 'vue-router'
import MyStreet from '@/components/MyStreet'
import ProjectPage from '@/components/ProjectPage'
import CitywideProjects from '@/components/CitywideProjects'

Vue.use(Router)

export default new Router({
  mode: 'history', // 'history' mode produces clean, normal URLs
  routes: [
    {
      path: '/',
      name: 'MyStreet',
      component: MyStreet,
    },
    {
      path: '/projects/:id',
      name: 'ProjectPage',
      component: ProjectPage,
    },
    {
      path: '/citywide',
      name: 'CityWideProjects',
      component: CitywideProjects,
    },
    {
      // catch-all for mispelled URLs. Maybe add a 404 page...
      path: '*',
      name: 'MyStreet',
      component: MyStreet,
    },
  ],
})
