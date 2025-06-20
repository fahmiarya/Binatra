// src/stores/deviceStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export const useDeviceStore = defineStore('device', () => {
  // State
  const devices = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const sensorLogs = ref([])
  const currentReading = ref(null)

  axios.defaults.baseURL = import.meta.env.VITE_API_URL;

  const getConnectedDevices = async () => {
    try {
      const response = await axios.get('/api/v1/devices/status')
      return response.data.data.connected
    } catch (error) {
      console.log(error)
    }
  }

  const fetchDevices = async () => {
    try {
      const response = await axios.get('/api/v1/devices');
      devices.value = response.data.data.devices

      console.log(devices.value)
      console.log(response.data.data.devices)

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

  // Method untuk update real-time data dari komponen
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

  return {
    devices,
    isLoading,
    error,
    sensorLogs, // Export reactive ref
    getConnectedDevices,
    getChartData,
    fetchDevices,
    fetchSensorLogHistory,
    addRealTimeData // Export method untuk real-time update
  }
})
