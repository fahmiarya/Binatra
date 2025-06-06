import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import( '@/views/HomeView.vue'),
    },
    {
      path: '/pemerintah-kota',
      name: 'pemerintah kota',
      component: () => import('@/views/PemerintahKota.vue'),
    },
    {
      path: '/dinas-pekerjaan-umum',
      name: 'dinas pu',
      component: () => import('@/views/DinasPekerjaanUmum.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/404.vue')
    }
  ],
})

export default router
