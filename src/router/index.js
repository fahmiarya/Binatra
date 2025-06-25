import { createRouter, createWebHistory } from 'vue-router'
import { useAccountStore } from '@/stores/accountStore'
import pinia from '@/pinia'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'signin',
      component: () => import('@/views/SignIn.vue'),
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('@/views/SignUp.vue'),
    },
    {
      path: '/home',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/pemerintah-kota',
      name: 'pemerintah kota',
      component: () => import('@/views/PemerintahKota.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/dinas-pekerjaan-umum',
      name: 'dinas pu',
      component: () => import('@/views/DinasPekerjaanUmum.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/404.vue'),
    },
  ],
})

// Route Guard
router.beforeEach((to, from, next) => {
  const accountStore = useAccountStore()
  if (!accountStore.token) {
    accountStore.loadFromStorage()
  }

  if (to.meta.requiresAuth && !accountStore.token) {
    next({ name: 'signin' })
  } else {
    next()
  }
})

export default router
