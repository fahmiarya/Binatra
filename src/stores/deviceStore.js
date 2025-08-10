// src/stores/deviceStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export const useDeviceStore = defineStore('device', () => {
  // State
  const devices = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const loadArr = ref([])
  const sensorLogs = ref([])
  const currentReading = ref(null)
  const pagination = ref({
    page: 1,
    limit : 0,
    totalItems: 0,
    totalPages: 0,
  })

  axios.defaults.baseURL = import.meta.env.VITE_API_URL;

  const getConnectedDevices = async () => {
    try {
      const response = await axios.get('/api/v1/devices/status')
      return response.data.data.connected
    } catch (error) {
      console.log(error)
    }
  }

  const getAllDevices = async (search = '', limit = 10, page = 1, status = '', sortBy = 'code', sortOrder = 'asc') => {
    try {
      loadArr.value.push("GET_ALL_DEVICES")
      const response = await axios.get('/api/v1/devices', {
        params : {
          search,
          limit,
          status,
          page,
          sortBy,
          sortOrder : sortOrder === 1 ? 'asc' : 'desc'
        }
      });
      console.log("response : ", response)
      devices.value = response.data.data
      pagination.value.page = response.data.page
      pagination.value.limit = response.data.limit
      pagination.value.totalItems = response.data.totalItems
      pagination.value.totalPages = response.data.totalPages

    } catch (error) {
      console.log(error)
    }finally{
      loadArr.value.splice(loadArr.value.indexOf('GET_ALL_DEVICES'), 1);
    }
  }

  const getDevice = async (id) => {
    try {
      const {data} = await axios.get(`/api/v1/devices/detail/${id}`);
      return data.data.devices
    } catch (error) {
      console.log(error)
    }
  }

  const fetchDevices = async () => {
    try {
      const response = await axios.get('/api/v1/devices');
      devices.value = response.data.data
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  };

  const fetchSensorLogHistory = async (deviceCode, startDate, endDate) => {
    isLoading.value = true
    error.value = null

    try {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const {data} = await axios.get(`/api/v1/sensorLogs/history/${deviceCode}?${params.toString()}`)

      if (data) {
        // Pastikan assign dengan ref.value untuk reactivity
        sensorLogs.value = data.data

        // Set current reading to latest data
        if (data.data.length > 0) {
          currentReading.value = {
            deviceCode: deviceCode,
            waterLevel: data.data[0].waterLevel,
            rainfall: data.data[0].rainfall,
            timestamp: data.data[0].timestamp // Gunakan timestamp asli dari database
          }
        }
      }
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

    const waterData = logs.map(log => ({
      x: new Date(log.timestamp).getTime(), // Konversi ke milliseconds untuk ApexCharts
      y: log.waterLevel || 0
    }))

    const rainfallData = logs.map(log => ({
      x: new Date(log.timestamp).getTime(), // Konversi ke milliseconds untuk ApexCharts
      y: log.rainfall || 0
    }))

    return {
      waterData: waterData.reverse(), // Reverse untuk urutan kronologis di chart
      rainfallData: rainfallData.reverse()
    }
  }

  const updateDevice = async (payload, id) => {
    try {
      loadArr.value.push(`UPDATE_DEVICE_${id}`)
      if(!id) return {
        type : 'error',
        message : 'update device error'
      }

      await axios.put(`/api/v1/devices/${id}`, payload)

      return {
        type : 'success',
        message : 'update device succesfully'
      }
    } catch (error) {
      return {
        type : 'error',
        message : 'erorr update device',
        trace : error.message
      }
    }finally{
      loadArr.value.splice(loadArr.value.indexOf(`UPDATE_DEVICE_${id}`), 1);
    }
  }

  const addRealTimeData = (newData) => {
    const newLogEntry = {
      id: `realtime-${Date.now()}`,
      waterLevel: newData.waterLevel,
      rainfall: newData.rainfall,
      timestamp: newData.timestamp
    };

    // Create new array untuk trigger reactivity
    const currentLogs = sensorLogs.value || [];
    const updatedLogs = [newLogEntry, ...currentLogs];

    // Batasi data
    if (updatedLogs.length > 50) {
      updatedLogs.splice(50);
    }

    sensorLogs.value = updatedLogs;
  }

  const deleteDevice = async (id) => {
    try {
      await axios.delete(`/api/v1/devices/${id}`);

      pagination.value.totalItems -= 1;

      const maxPage = Math.max(1, Math.ceil(pagination.value.totalItems / pagination.value.limit));
      pagination.value.page = Math.min(pagination.value.page, maxPage);

      await getAllDevices();
    } catch (error) {
      console.log(error)
    }
  }

  return {
    devices,
    isLoading,
    error,
    loadArr,
    sensorLogs,
    pagination,
    getConnectedDevices,
    getAllDevices,
    getDevice,
    getChartData,
    fetchDevices,
    fetchSensorLogHistory,
    updateDevice,
    addRealTimeData,
    deleteDevice,
  }
})
