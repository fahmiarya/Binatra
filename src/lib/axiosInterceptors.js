import axios from 'axios'
import { useAccountStore } from '@/stores/accountStore'
import router from '@/router'

// Setup axios interceptors
export const setupInterceptors = () => {
  // Request interceptor
  axios.interceptors.request.use(
    (config) => {
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Response interceptor
  axios.interceptors.response.use(
    (response) => {
      return response
    },
    (error) => {
      const accountStore = useAccountStore()

      // Handle 401 Unauthorized
      if (error.response?.status === 401) {
        accountStore.resetAuth()

        // Redirect ke login jika bukan di halaman auth
        if (router.currentRoute.value.name !== 'signin' && router.currentRoute.value.name !== 'signup') {
          router.push({ name: 'signin' })
        }
      }

      return Promise.reject(error)
    }
  )
}
