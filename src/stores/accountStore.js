import { defineStore } from 'pinia'
import axios from 'axios'

// Setup axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_URL;
axios.defaults.withCredentials = true

export const useAccountStore = defineStore('account', {
  state: () => ({
    user: null,
    isAuthenticated: false,
    loading: false,
    initialized: false,
  }),

  actions: {
    async register(payload) {
      this.loading = true
      try {
        const res = await axios.post('/api/v1/auth/register', payload)

        if (res.data.success) {
          this.user = res.data.data
          this.isAuthenticated = true
          this.initialized = true // PENTING
        }

        return res.data
      } catch (error) {
        console.error('Error Register:', error.response?.data || error.message)
        throw error
      } finally {
        this.loading = false
      }
    },

    async login(payload) {
      this.loading = true
      try {
        const res = await axios.post('/api/v1/auth/login', payload)

        if (res.data.success) {
          this.user = res.data.data
          this.isAuthenticated = true
          this.initialized = true // PENTING
          console.log('✅ Login berhasil, isAuthenticated:', this.isAuthenticated)
        }

        return res.data
      } catch (error) {
        console.error('Error Login:', error.response?.data || error.message)
        this.isAuthenticated = false
        this.initialized = true
        throw error
      } finally {
        this.loading = false
      }
    },

    async logout() {
      this.loading = true
      try {
        await axios.post('/api/v1/auth/logout')
      } catch (error) {
        console.error('Error Logout:', error.response?.data || error.message)
      } finally {
        this.user = null
        this.isAuthenticated = false
        this.initialized = true
        this.loading = false
      }
    },

    async getCurrentUser() {
      if (this.loading) return

      this.loading = true
      try {
        const res = await axios.get('/api/v1/auth/me')

        if (res.data.success) {
          this.user = res.data.data
          this.isAuthenticated = true
          this.initialized = true
          console.log('✅ Session valid, user:', this.user)
          return res.data.data
        } else {
          this.resetAuth()
        }
      } catch (error) {
        this.resetAuth()
      } finally {
        this.loading = false
      }
    },

    // Reset state saat unauthorized
    resetAuth() {
      this.user = null
      this.isAuthenticated = false
      this.initialized = true
      this.loading = false
    }
  },
})
