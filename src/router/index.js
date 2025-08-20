import { createRouter, createWebHistory } from 'vue-router'
import { useAccountStore } from '@/stores/accountStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/Dashboard.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/sign-in',
      name: 'signin',
      component: () => import('@/views/auth/SignIn.vue'),
      meta: { requiresAuth: false, guestOnly: true },
    },
    {
      path: '/sign-up',
      name: 'signup',
      component: () => import('@/views/auth/SignUp.vue'),
      meta: { requiresAuth: false, guestOnly: true },
    },
    {
      path: '/lokasi',
      name: 'lokasi',
      component: () => import('@/views/location/Index.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/report',
      name: 'report',
      component: () => import('@/views/report/Index.vue'),
      meta: { requiresAuth: true },
    },
    // {
    //   path: '/settings',
    //   name: 'settings device',
    //   component: () => import('@/views/Setting.vue'),
    //   meta: { requiresAuth: true },
    // },
    {
      path: '/device',
      name: 'Device List',
      component: () => import('@/views/device/Index.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/device/:id',
      name: 'Device Detail',
      component: () => import('@/views/device/Show.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/users',
      name: 'User List',
      component: () => import('@/views/UserList.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/user:id',
      name: 'User Detail',
      component: () => import('@/views/UserDetail.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/Error/404.vue'),
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
