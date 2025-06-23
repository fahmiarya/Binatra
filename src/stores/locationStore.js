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
