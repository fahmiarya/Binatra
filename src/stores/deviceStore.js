// src/stores/deviceStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export const useDeviceStore = defineStore('device', () => {
  axios.defaults.baseURL = import.meta.env.VITE_API_URL

  // State
  const devices = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const loadArr = ref([])
  const sensorLogs = ref([])
  const pagination = ref({
    page: 1,
    limit: 0,
    totalItems: 0,
    totalPages: 0,
  })

  // getters
  const connectedDevices = computed(() => {
    const result = devices.value.filter(d => d.status === 'CONNECTED')
    return result.length
  })

  const getConnectedDevices = async () => {
    try {
      const response = await axios.get('/api/v1/devices/status')
      return response.data.data.connected
    } catch (error) {
      console.log(error)
    }
  }

  const getAllDevices = async (
    search = '',
    limit = 10,
    page = 1,
    status = '',
    sortBy = 'code',
    sortOrder = 'asc',
  ) => {
    try {
      loadArr.value.push('GET_ALL_DEVICES')
      const response = await axios.get('/api/v1/devices', {
        params: {
          search,
          limit,
          status,
          page,
          sortBy,
          sortOrder: sortOrder === 1 ? 'asc' : 'desc',
        },
      })

      devices.value = response.data.data
      pagination.value.page = response.data.page
      pagination.value.limit = response.data.limit
      pagination.value.totalItems = response.data.totalItems
      pagination.value.totalPages = response.data.totalPages
    } catch (error) {
      console.log(error)
    } finally {
      loadArr.value.splice(loadArr.value.indexOf('GET_ALL_DEVICES'), 1)
    }
  }

  const getDataByScroll = async (search = '', page = 1, limit = 10) => {
    try {
      loadArr.value.push('GET_DEVICES_SCROLL')

      const { data } = await axios.get('/api/v1/devices', {
        params: {
          search,
          limit,
          page,
        },
      })

      if (page === 1) {
        devices.value = data.data
      } else {
        devices.value = [...devices.value, ...data.data]
      }
    } catch (err) {
      console.log(err.message)
    } finally {
      loadArr.value.splice(loadArr.value.indexOf('GET_DEVICES_SCROLL'), 1)
    }
  }

  const getDevice = async (id) => {
    try {
      const { data } = await axios.get(`/api/v1/devices/detail/${id}`)
      return data.data.devices
    } catch (error) {
      console.log(error)
    }
  }

  const fetchDevices = async () => {
    try {
      const response = await axios.get('/api/v1/devices')
      devices.value = response.data.data
    } catch (error) {
      console.error('Error fetching devices:', error)
    }
  }

  const fetchSensorLogHistory = async (deviceCode, dateRange) => {
    isLoading.value = true
    error.value = null

    try {
      const params = new URLSearchParams()
      if (dateRange[0]) params.append('startDate', dateRange[0])
      if (dateRange[1]) params.append('endDate', dateRange[1])

      const { data } = await axios.get(
        `/api/v1/sensorLogs/history/${deviceCode}?${params.toString()}`,
      )

      sensorLogs.value = data.data
    } catch (err) {
      error.value = err.message
      console.error('Error fetching sensor history:', err.message)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Format chart data untuk ApexCharts dengan timestamp yang benar
  const getChartData = () => {
    // Pastikan menggunakan .value untuk reactive
    const logs = sensorLogs.value || []

    const waterData = logs.map((log) => ({
      x: new Date(log.timestamp).getTime(), // Konversi ke milliseconds untuk ApexCharts
      y: log.depth || 0,
    }))

    const rainfallData = logs.map((log) => ({
      x: new Date(log.timestamp).getTime(), // Konversi ke milliseconds untuk ApexCharts
      y: log.rainfall || 0,
    }))

    return {
      waterData: waterData.reverse(), // Reverse untuk urutan kronologis di chart
      rainfallData: rainfallData.reverse(),
    }
  }

  const updateDevice = async (payload, id) => {
    try {
      loadArr.value.push(`UPDATE_DEVICE_${id}`)
      if (!id)
        return {
          type: 'error',
          message: 'update device error',
        }

      await axios.put(`/api/v1/devices/${id}`, payload)

      return {
        type: 'success',
        message: 'update device succesfully',
      }
    } catch (error) {
      return {
        type: 'error',
        message: 'erorr update device',
        trace: error.message,
      }
    } finally {
      loadArr.value.splice(loadArr.value.indexOf(`UPDATE_DEVICE_${id}`), 1)
    }
  }

  const addRealTimeData = (newData) => {
    const newLogEntry = {
      id: `realtime-${Date.now()}`,
      waterLevel: newData.waterLevel,
      depth: newData.depth,
      rainfall: newData.rainfall,
      timestamp: newData.timestamp,
    }

    // Create new array untuk trigger reactivity
    const currentLogs = sensorLogs.value || []
    const updatedLogs = [newLogEntry, ...currentLogs]

    // Batasi data
    if (updatedLogs.length > 50) {
      updatedLogs.splice(50)
    }

    sensorLogs.value = updatedLogs
  }

  const deleteDevice = async (id) => {
    try {
      await axios.delete(`/api/v1/devices/${id}`)

      pagination.value.totalItems -= 1

      const maxPage = Math.max(1, Math.ceil(pagination.value.totalItems / pagination.value.limit))
      pagination.value.page = Math.min(pagination.value.page, maxPage)

      await getAllDevices()
    } catch (error) {
      console.log(error)
    }
  }

  const exportCSV = async (deviceCode, dateRange) => {
    try {
      const params = new URLSearchParams()

      if (dateRange[0]) params.append('startDate', dateRange[0])
      if (dateRange[1]) params.append('endDate', dateRange[1])

      const response = await axios.get(
        `/api/v1/sensorLogs/${deviceCode}/export?${params.toString()}`,
        {
          responseType: 'blob',
        },
      )

      // Generate filename di frontend (sama seperti backend logic)
      let filename = `sensorLog_${deviceCode}`

      if (dateRange[0] && dateRange[1]) {
        const start = new Date(dateRange[0]).toISOString().split('T')[0]
        const end = new Date(dateRange[1]).toISOString().split('T')[0]
        filename += `_${start}_to_${end}`
      } else if (dateRange[0]) {
        const start = new Date(dateRange[0]).toISOString().split('T')[0]
        filename += `_from_${start}`
      } else if (dateRange[1]) {
        const end = new Date(dateRange[1]).toISOString().split('T')[0]
        filename += `_until_${end}`
      }
      filename += '.csv'


      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      if (error.response) {
        const status = error.response.status
        if (status === 404) {
          alert('No data found to export for the selected date range')
        } else if (status === 400) {
          alert('Invalid date format or missing device code')
        } else {
          alert('Failed to export CSV. Please try again.')
        }
      } else {
        alert('Network error. Please check your connection.')
      }
    }
  }

  return {
    devices,
    connectedDevices,
    isLoading,
    error,
    loadArr,
    sensorLogs,
    pagination,
    getConnectedDevices,
    getAllDevices,
    getDataByScroll,
    getDevice,
    getChartData,
    fetchDevices,
    fetchSensorLogHistory,
    updateDevice,
    addRealTimeData,
    deleteDevice,
    exportCSV,
  }
})
