import Vue from 'vue'
import Router from 'vue-router'
import CitywideProjects from '@/components/CitywideProjects'
import MyStreet from '@/components/MyStreet'
import ProjectPage from '@/components/ProjectPage'

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
      path: '/citywide',
      name: 'CitywideProjects',
      component: CitywideProjects,
    },
    {
      path: '/projects/:id',
      name: 'ProjectPage',
      component: ProjectPage,
    },
    {
      // catch-all for mispelled URLs. Maybe add a 404 page...
      path: '*',
      name: 'MyStreet',
      component: MyStreet,
    },
  ],
})
