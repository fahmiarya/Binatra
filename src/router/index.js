import { createRouter, createWebHistory } from 'vue-router'
import { useAccountStore } from '@/stores/accountStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/sign-in',
      name: 'signin',
      component: () => import('@/views/SignIn.vue'),
      meta: { requiresAuth: false, guestOnly: true }, // TAMBAH guestOnly
    },
    {
      path: '/sign-up',
      name: 'signup',
      component: () => import('@/views/SignUp.vue'),
      meta: { requiresAuth: false, guestOnly: true }, // TAMBAH guestOnly
    },
    {
      path: '/pemerintah-kota',
      name: 'pemerintah-kota',
      component: () => import('@/views/PemerintahKota.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/dinas-pekerjaan-umum',
      name: 'dinas-pu',
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

// Route Guard - FIXED
router.beforeEach(async (to, from, next) => {
  const accountStore = useAccountStore()

  // Jika belum initialized, cek session dulu
  if (!accountStore.initialized && !accountStore.loading) {
    await accountStore.getCurrentUser()
  }

  // PENTING: Block akses ke auth pages jika sudah login
  if (to.meta.guestOnly && accountStore.isAuthenticated) {
    return next({ name: 'home' })
  }

  // Jika route memerlukan auth tapi belum login
  if (to.meta.requiresAuth && !accountStore.isAuthenticated) {
    return next({ name: 'signin' })
  }

  next()
})

export default router
