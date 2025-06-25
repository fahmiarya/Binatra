import { defineStore } from 'pinia'
import axios from 'axios'

export const useAccountStore = defineStore('account', {
  state: () => ({
    user: null,
    token: null,
  }),

  actions: {
    async register(payload) {
      try {
        const res = await axios.post('https://binatra.id/api/v1/auth/register', payload)
        console.log('Respon Register:', res.data)
        return res.data
      } catch (error) {
        console.error('Error Register:', error)
        throw error
      }
    },

    async login(payload, rememberMe = true) {
      try {
        const res = await axios.post('https://binatra.id/api/v1/auth/login', payload)
        console.log('Full res:', res.data)

        this.token = 'dummytoken'
        this.user = res.data?.data || null

        const storage = rememberMe ? localStorage : sessionStorage
        if (this.token) storage.setItem('token', this.token)
        if (this.user) storage.setItem('user', JSON.stringify(this.user))

        return res.data
      } catch (error) {
        console.error('Error Login:', error)
        throw error
      }
    },

    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user')
    },

    loadFromStorage() {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const user = localStorage.getItem('user') || sessionStorage.getItem('user')
      if (token) this.token = token
      if (user) this.user = JSON.parse(user)
    },
  },
})
