// src/stores/deviceStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export const useLocationStore = defineStore('locations', () => {
  // State
  const locations = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  axios.defaults.baseURL = 'http://localhost:3000';

  const getTotalLocations = async () => {
    try {
      const response = await axios.get('/api/v1/locations/total')

      return response.data.total
    } catch (error) {
      console.log(error)
    }
  }

  const getTotalFloodLocations = async () => {
    try {
      const response = await axios.get('/api/v1/locations/flood/warnings')

      return response.data.count
    } catch (error) {
      console.log(error)
    }
  }

  const getFloodLocations = async () => {
    try {
      const response = await axios.get('/api/v1/locations/flood/warnings')

      return response.data.data
    } catch (error) {
      console.log(error)
    }
  }


  return {
    locations,
    isLoading,
    error,
    getTotalLocations,
    getFloodLocations,
    getTotalFloodLocations
  }
})
