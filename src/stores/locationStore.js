// src/stores/locationStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export const useLocationStore = defineStore('locations', () => {
  // State
  const locations = ref([])
  const locationStatusHistory = ref([])
  const isLoading = ref(false)
  const isLoadingHistory = ref(false)
  const error = ref(null)
  const historyError = ref(null)

  // Pagination state
  const currentPage = ref(1)
  const pageSize = ref(10)
  const hasReachedEnd = ref(false)
  const totalHistory = ref(0)

  axios.defaults.baseURL = import.meta.env.VITE_API_URL

  // Get all locations
  const getAllLocations = async () => {
    try {
      isLoading.value = true
      error.value = null

      const response = await axios.get('/api/v1/locations')

      if (response.data.success) {
        locations.value = response.data.data
      } else {
        error.value = response.data.message || 'Gagal mengambil data lokasi'
      }

    } catch (err) {
      error.value = 'Gagal mengambil data lokasi'
      console.error('Error fetching locations:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Create new location
  const createLocation = async (locationData) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await axios.post('/api/v1/locations', locationData)

      if (response.data.success) {
        // Refresh locations after create
        await getAllLocations()
        return response.data.data
      } else {
        error.value = response.data.message || 'Gagal membuat lokasi baru'
        throw new Error(response.data.message)
      }

    } catch (err) {
      error.value = err.response?.data?.message || 'Gagal membuat lokasi baru'
      console.error('Error creating location:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Search locations (filter from current data)
  const searchLocations = async (query) => {
    if (!query.trim()) {
      await getAllLocations()
      return
    }

    const filteredLocations = locations.value.filter(location =>
      location.name.toLowerCase().includes(query.toLowerCase()) ||
      location.address.toLowerCase().includes(query.toLowerCase()) ||
      location.district.toLowerCase().includes(query.toLowerCase()) ||
      location.city.toLowerCase().includes(query.toLowerCase())
    )

    locations.value = filteredLocations
  }

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

  // Fetch Location Status History
  const fetchLocationStatusHistory = async (page = 1, limit = 10, reset = false) => {
    try {
      // Set loading state
      if (page === 1 || reset) {
        isLoadingHistory.value = true
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy: 'changedAt',
        sortOrder: 'desc'
      })

      const response = await axios.get(`/api/v1/locations/location-status-history?${params.toString()}`)

      if (response.data.success) {
        const newData = response.data.data
        const pagination = response.data.pagination

        if (page === 1 || reset) {
          // Reset data untuk halaman pertama atau reset manual
          locationStatusHistory.value = newData
          currentPage.value = 1
        } else {
          // Append data untuk infinite scroll
          locationStatusHistory.value.push(...newData)
        }

        // Update pagination state
        currentPage.value = page
        hasReachedEnd.value = !pagination?.hasNextPage
        totalHistory.value = pagination?.total || newData.length

        console.log(`✅ Fetched ${newData.length} history items. Total: ${locationStatusHistory.value.length}`)

        return {
          success: true,
          data: newData,
          pagination
        }

      } else {
        historyError.value = response.data.error
        console.error('❌ Failed to fetch location status history:', response.data.error)
        return { success: false, error: response.data.error }
      }

    } catch (error) {
      historyError.value = error.message
      console.error('❌ Error fetching location status history:', error)
      return { success: false, error: error.message }
    } finally {
      if (page === 1 || reset) {
        isLoadingHistory.value = false
      }
    }
  }

  // Load more history (for infinite scroll)
  const loadMoreHistory = async () => {
    if (isLoadingHistory.value || hasReachedEnd.value) return false

    const nextPage = currentPage.value + 1
    const result = await fetchLocationStatusHistory(nextPage, pageSize.value)

    return result.success
  }

  // Refresh history data
  const refreshHistory = async () => {
    return await fetchLocationStatusHistory(1, pageSize.value, true)
  }

  // Add new history item (for real-time updates)
  const addHistoryItem = (newItem) => {
    // Add to beginning of array (newest first)
    locationStatusHistory.value.unshift(newItem)
    totalHistory.value += 1

    console.log('📡 New history item added:', newItem)
  }

  // Clear history data
  const clearHistory = () => {
    locationStatusHistory.value = []
    currentPage.value = 1
    hasReachedEnd.value = false
    totalHistory.value = 0
    historyError.value = null
  }

  // Get history by location ID
  const getHistoryByLocationId = (locationId) => {
    return locationStatusHistory.value.filter(item => item.locationId === locationId)
  }

  // Get recent history (last N items)
  const getRecentHistory = (count = 10) => {
    return locationStatusHistory.value.slice(0, count)
  }

  return {
    // State
    locations,
    locationStatusHistory,
    isLoading,
    isLoadingHistory,
    error,
    historyError,
    currentPage,
    pageSize,
    hasReachedEnd,
    totalHistory,

    // Actions
    getAllLocations,
    createLocation,
    searchLocations,
    getTotalLocations,
    getFloodLocations,
    getTotalFloodLocations,
    fetchLocationStatusHistory,
    loadMoreHistory,
    refreshHistory,
    addHistoryItem,
    clearHistory,
    getHistoryByLocationId,
    getRecentHistory
  }
})
