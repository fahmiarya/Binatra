// src/stores/weatherStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export const useWeatherStore = defineStore('weather', () => {
  // State
  const weather = ref(null)
  const main = ref(null)
  const location = ref(null)
  const loading = ref(false)
  const error = ref(null)

  axios.defaults.baseURL = import.meta.env.VITE_API_URL;

  // Actions
  async function fetchWeather() {
    loading.value = true
    error.value = null

    try {
      const response = await axios.get('/api/v1/cuaca')

      if (response.data && response.data.data) {
        const { weather: weatherData, main: mainData, name } = response.data.data
        weather.value = weatherData
        main.value = mainData
        location.value = name
      }

      return response.data
    } catch (err) {
      console.error('Error fetching weather data:', err)
      error.value = err.response?.data?.message || 'Gagal mendapatkan data cuaca'
      throw err
    } finally {
      loading.value = false
    }
  }


  // Reset state
  function resetWeather() {
    weather.value = null
    main.value = null
    location.value = null
    error.value = null
  }

  return {
    // State
    weather,
    main,
    location,
    loading,
    error,
    fetchWeather,
    resetWeather
  }
})
