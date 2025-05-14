import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
// import Admin from '@/layouts/Admin.vue'
// import Dashboard from '@/views/admin/Dashboard.vue'
// import Settings from '@/views/admin/Settings.vue'
// import Tables from '@/views/admin/Tables.vue'
// import Maps from '@/views/admin/Maps.vue'
import SensorView from '@/views/SensorView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // {
    //   path: '/',
    //   redirect: '/admin/dashboard',
    // },
    // {
    //   path: '/admin',
    //   redirect: '/admin/dashboard',
    //   component: Admin,
    //   children: [
    //     {
    //       path: '/admin/dashboard',
    //       component: Dashboard,
    //     },
    //     {
    //       path: '/admin/settings',
    //       component: Settings,
    //     },
    //     {
    //       path: '/admin/tables',
    //       component: Tables,
    //     },
    //     {
    //       path: '/admin/maps',
    //       component: Maps,
    //     },
    //   ],
    // },
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/sensor',
      name: 'sensor',
      component: SensorView,
    }
  ],
})

export default router
