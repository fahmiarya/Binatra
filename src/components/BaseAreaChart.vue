<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { useDeviceStore } from '@/stores/deviceStore';
import { storeToRefs } from 'pinia';
import { io } from 'socket.io-client';

const deviceStore = useDeviceStore()
const {devices} = storeToRefs(deviceStore)

const currentReading = ref(null);
const statistics = ref(null);
const selectedDevice = ref('');
const dateRange = ref({
  start: new Date().toISOString().split('T')[0],
  end: new Date().toISOString().split('T')[0]
});

// Socket.IO connection
let socket = null;
let intervalId = null;

// Chart options dengan timezone yang benar
const options = ref({
  chart: {
    id: 'areachart',
    type: 'area',
    animations: {
      enabled: true,
      easing: 'linear',
      dynamicAnimation: {
        speed: 1000
      }
    },
    toolbar: {
      show: true,
      tools: {
        download: true,
        selection: true,
        zoom: true,
        zoomin: true,
        zoomout: true,
        pan: true,
        reset: true
      }
    }
  },
  xaxis: {
    type: 'datetime',
    labels: {
      format: 'HH:mm:ss',
      datetimeUTC: false, // Gunakan timezone lokal
      formatter: function(val, timestamp) {
        // Format sesuai timezone Indonesia
        const date = new Date(timestamp);
        return date.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Asia/Jakarta'
        });
      }
    }
  },
  stroke: {
    curve: 'smooth'
  },
  dataLabels: {
    enabled: false
  },
  tooltip: {
    x: {
      format: 'dd/MM/yyyy HH:mm:ss',
      formatter: function(val) {
        // Format tooltip sesuai timezone Indonesia
        const date = new Date(val);
        return date.toLocaleString('id-ID', {
          timeZone: 'Asia/Jakarta',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      }
    },
  },
  yaxis: [{
    title: {
      text: 'Water Level (cm)'
    }
  }, {
    opposite: true,
    title: {
      text: 'Rainfall (mm)'
    }
  }],
  colors: ['#008FFB', '#00E396'],
  fill: {
    type: 'gradient',
    gradient: {
      shade: 'light',
      type: 'vertical',
      shadeIntensity: 0.25,
      gradientToColors: ['#87CEEB', '#90EE90'],
      inverseColors: false,
      opacityFrom: 0.8,
      opacityTo: 0.1,
      stops: [0, 100]
    }
  }
});

const series = computed(() => {
  const chartData = deviceStore.getChartData()
  return [
    {
      name: 'Water Level',
      data: chartData.waterData
    },
    {
      name: 'Rainfall',
      data: chartData.rainfallData,
      yAxisIndex: 1
    }
  ]
});

// Helper function untuk format timestamp dengan timezone Indonesia
const formatTime = (timestamp) => {
  if (!timestamp) return 'N/A';

  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    return 'N/A';
  }
};

// const setTodayRange = async () => {
//   const today = new Date().toISOString().split('T')[0];
//   dateRange.value.start = today;
//   dateRange.value.end = today;
//   await handleFetchHistory();
// };

// const setWeekRange = async () => {
//   const today = new Date();
//   const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
//   dateRange.value.start = weekAgo.toISOString().split('T')[0];
//   dateRange.value.end = today.toISOString().split('T')[0];
//   await handleFetchHistory();
// };

const handleFetchHistory = async () => {
  if (!selectedDevice.value || !selectedDevice.value.code) {
    console.log("No device selected");
    return;
  }

  console.log("device saat ini : ", selectedDevice.value.code)
  await deviceStore.fetchSensorLogHistory(selectedDevice.value.code, dateRange.value.start, dateRange.value.end)

  // Update currentReading dari store
  const logs = deviceStore.sensorLogs;
  if (logs && logs.length > 0) {
    currentReading.value = {
      waterLevel: logs[0].waterLevel,
      rainfall: logs[0].rainfall,
      timestamp: logs[0].timestamp // Gunakan timestamp asli dari database
    };
  }
}

// Setup Socket.IO untuk real-time updates
const setupSocket = () => {
  socket = io('http://localhost:3000');

  socket.on('connect', () => {
    console.log('Connected to Socket.IO server');

    // Subscribe ke device yang sedang dipilih
    if (selectedDevice.value && selectedDevice.value.code) {
      socket.emit('subscribe-device', selectedDevice.value.code);
    }
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from Socket.IO server');
  });

  // Listen untuk sensor data dari device yang dipilih
  socket.on('sensor-data', (data) => {
    console.log('Received real-time sensor data:', data);
    updateChartRealTime(data);
  });

  // Listen untuk konfirmasi data tersimpan
  socket.on('sensor-data-saved', (data) => {
    console.log('Sensor data saved to database:', data);
    updateChartRealTime(data);
  });
};

// Update chart secara real-time
const updateChartRealTime = (data) => {
  // Hanya proses jika data dari device yang sedang dipilih
  if (!selectedDevice.value || data.deviceCode !== selectedDevice.value.code) {
    return;
  }

  const waterLevel = data.waterlevel || data.waterLevel || 0;
  const rainfall = data.rainfall || 0;

  console.log(`📊 Real-time update - Device: ${data.deviceCode}, Water: ${waterLevel}cm, Rain: ${rainfall}mm`);

  // Update current reading
  currentReading.value = {
    waterLevel: waterLevel,
    rainfall: rainfall,
    timestamp: data.timestamp
  };

  // Use store method untuk update chart data
  deviceStore.addRealTimeData({
    waterLevel: waterLevel,
    rainfall: rainfall,
    timestamp: data.timestamp
  });
};

watch(selectedDevice, async (newDevice, oldDevice) => {
  // Socket.IO: Unsubscribe dari device lama
  if (socket && oldDevice && oldDevice.code) {
    socket.emit('unsubscribe-device', oldDevice.code);
  }

  // Socket.IO: Subscribe ke device baru
  if (socket && newDevice && newDevice.code) {
    socket.emit('subscribe-device', newDevice.code);
  }

  await handleFetchHistory();
});

watch(() => [dateRange.value.start, dateRange.value.end], async () => {
  await handleFetchHistory();
}, { deep: true });

watch(() => devices.value, (newDevices) => {
  if (newDevices.length > 0) {
    selectedDevice.value = newDevices[0]
  }
})

onMounted(async () => {
  // Setup Socket.IO connection untuk real-time
  setupSocket()

  await deviceStore.fetchDevices()
  await deviceStore.fetchSensorLogHistory('DEV001', dateRange.value.start, dateRange.value.end)

  // Update currentReading setelah fetch data
  const logs = deviceStore.sensorLogs;
  if (logs && logs.length > 0) {
    currentReading.value = {
      waterLevel: logs[0].waterLevel,
      rainfall: logs[0].rainfall,
      timestamp: logs[0].timestamp
    };
  }
});


onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }

  // NEW: Cleanup socket connection
  if (socket) {
    // Unsubscribe dari device saat ini
    if (selectedDevice.value && selectedDevice.value.code) {
      socket.emit('unsubscribe-device', selectedDevice.value.code);
    }
    socket.disconnect();
  }
});
</script>

<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h3>Real-time Water Level Monitor</h3>
      <div style="display: flex; gap: 15px; align-items: center;">
        <!-- Connection Status -->
        <div :style="{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '5px 10px',
          borderRadius: '15px',
          backgroundColor: selectedDevice.status === 'CONNECTED' ? '#e8f5e8' : '#fce8e8',
          color: selectedDevice.status === 'CONNECTED' ? '#4caf50' : '#f44336',
          fontSize: '12px'
        }">
          <span :style="{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: selectedDevice.status === 'CONNECTED' ? '#4caf50' : '#f44336'
          }"></span>
          {{ selectedDevice.status === 'CONNECTED' ? 'Connected' : 'Disconnected' }}
        </div>

        <!-- Device Selector -->
        <select v-model="selectedDevice" style="padding: 5px 10px; border-radius: 5px; border: 1px solid #ddd;">
          <option v-for="device in devices" :key="device" :value="device">
            {{ device.code }}
          </option>
        </select>
      </div>
    </div>

    <!-- NEW: Statistics Cards -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; border-radius: 10px;">
        <h4 style="margin: 0 0 5px 0; font-size: 14px;">Current Water Level</h4>
        <div style="font-size: 24px; font-weight: bold;">{{ currentReading?.waterLevel || 0 }} cm</div>
        <div style="font-size: 12px; opacity: 0.8;">{{ formatTime(currentReading?.timestamp) }}</div>
      </div>

      <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 15px; border-radius: 10px;">
        <h4 style="margin: 0 0 5px 0; font-size: 14px;">Current Rainfall</h4>
        <div style="font-size: 24px; font-weight: bold;">{{ currentReading?.rainfall || 0 }} mm</div>
        <div style="font-size: 12px; opacity: 0.8;">24h Total: {{ statistics?.totalRainfall?.toFixed(1) || 0 }} mm</div>
      </div>
    </div>

    <!-- NEW: Date Range Controls -->
    <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
      <input
        type="date"
        v-model="dateRange.start"
        style="padding: 5px; border: 1px solid #ddd; border-radius: 4px;"
      />
      <span>to</span>
      <input
        type="date"
        v-model="dateRange.end"
        style="padding: 5px; border: 1px solid #ddd; border-radius: 4px;"
      />
      <!-- <button @click="setTodayRange" style="padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Today
      </button>
      <button @click="setWeekRange" style="padding: 5px 10px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
        This Week
      </button> -->
    </div>

    <apexchart
      type="area"
      height="400"
      :options="options"
      :series="series"
    ></apexchart>
  </div>
</template>
