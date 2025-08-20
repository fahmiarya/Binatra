// src/stores/locationStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export const useLocationStore = defineStore('locations', () => {
  // State
  const locations = ref([])
  const locationStatusHistory = ref([])
  const isLoading = ref(false)
  const isLoadingHistory = ref(false)
  const error = ref(null)
  const historyError = ref(null)
  const loadArr = ref([])
  const pagination = ref({
    page: 1,
    limit : 0,
    totalItems: 0,
    totalPages: 0,
  })

  // Pagination state
  const currentPage = ref(1)
  const pageSize = ref(10)
  const hasReachedEnd = ref(false)
  const totalHistory = ref(0)

  axios.defaults.baseURL = import.meta.env.VITE_API_URL

  // Status normalization and helpers
  const normalizeStatus = (apiStatus) => {
    if (!apiStatus) return 'normal'

    const status = apiStatus.toLowerCase()
    switch (status) {
      case 'aman':
        return 'normal'
      case 'waspada':
      case 'siaga':
        return 'warning'
      case 'bahaya':
        return 'danger'
      default:
        return 'normal'
    }
  }

  const getStatusColor = (status) => {
    const normalizedStatus = normalizeStatus(status)

    switch (normalizedStatus) {
      case 'normal':
        return 'text-green-600'
      case 'warning':
        return 'text-orange-600'
      case 'danger':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusText = (status) => {
    if (!status) return 'Tidak Diketahui'

    const apiStatus = status.toUpperCase()
    switch (apiStatus) {
      case 'AMAN':
        return 'Aman'
      case 'WASPADA':
        return 'Waspada'
      case 'SIAGA':
        return 'Siaga'
      case 'BAHAYA':
        return 'Bahaya'
      default:
        return status
    }
  }

  // Date formatting utility
  const formatDate = (dateString) => {
    if (!dateString) return 'Tidak ada data'

    const date = new Date(dateString)
    return date.toLocaleString('id-ID', {
      dateStyle: 'long',
      timeStyle: 'short',
    })
  }

  // Location search using OpenStreetMap
  const searchLocation = async (query) => {
    if (!query.trim() || query.length < 3) {
      return []
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&accept-language=id`,
      )

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data = await response.json()

      return data.map((item) => ({
        name: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        type: item.type,
        details: item,
      }))
    } catch (error) {
      console.error('Error searching location:', error)
      return []
    }
  }

  // Combine locations with real-time data
  const combineWithRealtimeData = (realtimeLocations) => {
    const result = [...locations.value]

    // Update dengan data real-time jika ada
    if (realtimeLocations && realtimeLocations.length > 0) {
      realtimeLocations.forEach((realtimeLoc) => {
        // Cari index lokasi yang sesuai di result
        const existingIndex = result.findIndex(
          (loc) =>
            loc.id === realtimeLoc.id ||
            loc.name === realtimeLoc.name ||
            (Math.abs(Number(loc.latitude) - Number(realtimeLoc.latitude)) < 0.0001 &&
              Math.abs(Number(loc.longitude) - Number(realtimeLoc.longitude)) < 0.0001),
        )

        if (existingIndex !== -1) {
          // Update lokasi yang sudah ada dengan data real-time
          result[existingIndex] = {
            ...result[existingIndex],
            ...realtimeLoc,
            // Pastikan field yang diperlukan ada
            currentStatus:
              realtimeLoc.currentStatus ||
              realtimeLoc.status ||
              result[existingIndex].currentStatus,
            currentWaterLevel:
              realtimeLoc.currentWaterLevel ||
              realtimeLoc.waterLevel ||
              result[existingIndex].currentWaterLevel,
            currentRainfall:
              realtimeLoc.currentRainfall ||
              realtimeLoc.rainfall ||
              result[existingIndex].currentRainfall,
            lastUpdate:
              realtimeLoc.lastUpdate ||
              realtimeLoc.updatedAt ||
              result[existingIndex].lastUpdate ||
              result[existingIndex].updatedAt,
          }
        } else {
          result.push({
            ...realtimeLoc,
            currentStatus:
              realtimeLoc.currentStatus ||
              realtimeLoc.status ||
              result[existingIndex].currentStatus ||
              result[existingIndex].status,
            currentWaterLevel: realtimeLoc.currentWaterLevel || realtimeLoc.waterLevel,
            currentRainfall: realtimeLoc.currentRainfall || realtimeLoc.rainfall,
            lastUpdate: realtimeLoc.lastUpdate || realtimeLoc.updatedAt,
          })
        }
      })
    }
    return result
  }

  // Calculate location statistics
  const calculateLocationStats = (combinedLocations) => {
    const stats = {
      aman: 0,
      waspada: 0,
      siaga: 0,
      bahaya: 0,
      total: 0,
    }

    if (!combinedLocations || !Array.isArray(combinedLocations)) {
      return stats
    }

    combinedLocations.forEach((location) => {
      const status = (location.currentStatus || location.status || 'AMAN').toUpperCase()

      switch (status) {
        case 'AMAN':
          stats.aman++
          break
        case 'WASPADA':
          stats.waspada++
          break
        case 'SIAGA':
          stats.siaga++
          break
        case 'BAHAYA':
          stats.bahaya++
          break
        default:
          stats.aman++ // Default ke aman jika status tidak dikenali
          break
      }
      stats.total++
    })

    return stats
  }

  // Filter valid locations for mapping
  const filterValidLocations = (combinedLocations, searchKeyword = '') => {
    if (!combinedLocations || !Array.isArray(combinedLocations)) {
      return []
    }

    return combinedLocations.filter(
      (loc) =>
        loc.latitude !== null &&
        loc.longitude !== null &&
        !isNaN(Number(loc.latitude)) &&
        !isNaN(Number(loc.longitude)) &&
        (loc.name?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          loc.address?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          loc.city?.toLowerCase().includes(searchKeyword.toLowerCase())),
    )
  }


  // Getter untuk valid locations (locations yang bisa di-map)
  const validLocations = computed(() => {
    return filterValidLocations(locations.value)
  })

  // Getter untuk location stats dari data store saja
  const locationStats = computed(() => {
    return calculateLocationStats(locations.value)
  })


  const fetchAllLocations = async (search = '', limit = 10, page = 1, status = '', sortBy = 'id', sortOrder = 'asc') => {
    try {
      loadArr.value.push("GET_ALL_LOCATIONS")
      error.value = null
      const res = await axios.get('/api/v1/locations', {
        params : {
          search,
          limit,
          status,
          page,
          sortBy,
          sortOrder : sortOrder === 1 ? 'asc' : 'desc'
        }
      });

      locations.value = res.data.data
      pagination.value.page = res.data.page
      pagination.value.limit = res.data.limit
      pagination.value.totalItems = res.data.totalItems
      pagination.value.totalPages = res.data.totalPages
    } catch (err) {
      error.value = err.message
    } finally {
      loadArr.value.splice(loadArr.value.indexOf('GET_ALL_LOCATIONS'), 1);
    }
  }

  const deleteLocation = async (id) => {
    try {
      await axios.delete(`/api/v1/locations/${id}`)
      await fetchAllLocations()
    } catch (error) {
      console.error('❌ Gagal hapus lokasi:', error)
      throw error
    }
  }

  // Tambah lokasi baru
  const createLocation = async (locationData) => {
    try {
      await axios.post('/api/v1/locations', locationData)
      await fetchAllLocations()
    } catch (error) {
      console.error('❌ Gagal tambah lokasi:', error)
      throw error
    }
  }

  const updateLocation = async (id, payload) => {
    try {
      await axios.put(`/api/v1/locations/${id}`, payload)
      await fetchAllLocations()
    } catch (err) {
      console.error('❌ Gagal update lokasi:', err)
      throw err
    }
  }

  // Reverse Geocode (biar reusable)
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=id`,
      )
      const data = await response.json()
      if (data && data.address) {
        const address = data.address
        return {
          address: data.display_name || '',
          district: address.city_district || address.suburb || address.village || '',
          city: address.city || address.county || '',
          province: address.state || '',
        }
      }
      return { address: '', district: '', city: '', province: '' }
    } catch (error) {
      console.log(error)
      return { address: '', district: '', city: '', province: '' }
    }
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
        sortOrder: 'desc',
      })

      const response = await axios.get(
        `/api/v1/locations/location-status-history?${params.toString()}`,
      )

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

        return {
          success: true,
          data: newData,
          pagination,
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

  const addHistoryItem = (newItem) => {
    locationStatusHistory.value.unshift(newItem)
    totalHistory.value += 1
  }

  const clearHistory = () => {
    locationStatusHistory.value = []
    currentPage.value = 1
    hasReachedEnd.value = false
    totalHistory.value = 0
    historyError.value = null
  }

  // Get history by location ID
  const getHistoryByLocationId = (locationId) => {
    return locationStatusHistory.value.filter((item) => item.locationId === locationId)
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
    loadArr,
    pagination,
    isLoadingHistory,
    error,
    historyError,
    currentPage,
    pageSize,
    hasReachedEnd,
    totalHistory,

    // Computed getters
    validLocations,
    locationStats,

    // Helper functions (NEW)
    normalizeStatus,
    getStatusColor,
    getStatusText,
    formatDate,
    searchLocation,
    combineWithRealtimeData,
    calculateLocationStats,
    filterValidLocations,

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
    getRecentHistory,
    fetchAllLocations,
    deleteLocation,
    createLocation,
    updateLocation,
    reverseGeocode,
  }
})
