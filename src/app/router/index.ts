/* eslint-disable import/default */
/* eslint-disable import/namespace */
import { createRouter, createWebHistory } from 'vue-router'

import DashboardView from '@/app/views/DashboardView.vue'
import GuidelinesView from '@/app/views/GuidelinesView.vue'
import SettingsView from '@/app/views/SettingsView.vue'

const router = createRouter({
  history: createWebHistory('/'),
  routes: [
    {
      path: '/',
      name: 'Dashboard',
      component: DashboardView,
    },
    {
      path: '/guidelines',
      name: 'guidelines',
      component: GuidelinesView,
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
    },
  ],
})

export default router
