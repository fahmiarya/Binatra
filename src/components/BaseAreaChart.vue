<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { useDeviceStore } from '@/stores/deviceStore';
import { storeToRefs } from 'pinia';
import { io } from 'socket.io-client';

const deviceStore = useDeviceStore()
const {devices} = storeToRefs(deviceStore)

const currentReading = ref(null);
const statistics = ref(null);
const selectedDevice = ref(null); // Change to null initially
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

const handleFetchHistory = async () => {
  if (!selectedDevice.value || !selectedDevice.value.code) {
    console.log("No device selected, clearing data");
    // Clear data jika tidak ada device yang dipilih
    currentReading.value = null;
    return;
  }

  console.log("Fetching data for device:", selectedDevice.value.code);

  try {
    await deviceStore.fetchSensorLogHistory(
      selectedDevice.value.code,
      dateRange.value.start,
      dateRange.value.end
    );

    // Update currentReading dari store setelah fetch berhasil
    const logs = deviceStore.sensorLogs;
    if (logs && logs.length > 0) {
      currentReading.value = {
        waterLevel: logs[0].waterLevel,
        rainfall: logs[0].rainfall,
        timestamp: logs[0].timestamp,
        deviceCode: selectedDevice.value.code // Tambahkan device code untuk validasi
      };

      console.log("✅ Current reading updated for device:", selectedDevice.value.code, currentReading.value);
    } else {
      // Jika tidak ada data, clear current reading
      currentReading.value = {
        waterLevel: 0,
        rainfall: 0,
        timestamp: null,
        deviceCode: selectedDevice.value.code
      };

      console.log("⚠️ No data found for device:", selectedDevice.value.code);
    }
  } catch (error) {
    console.error("❌ Error fetching history for device:", selectedDevice.value.code, error);
    // Clear data on error
    currentReading.value = null;
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
    console.log("❌ Real-time data ignored - device mismatch:", {
      selectedDevice: selectedDevice.value?.code,
      dataDevice: data.deviceCode
    });
    return;
  }

  const waterLevel = data.waterlevel || data.waterLevel || 0;
  const rainfall = data.rainfall || 0;

  console.log(`📊 Real-time update - Device: ${data.deviceCode}, Water: ${waterLevel}cm, Rain: ${rainfall}mm`);

  // Update current reading dengan validasi device
  currentReading.value = {
    waterLevel: waterLevel,
    rainfall: rainfall,
    timestamp: data.timestamp,
    deviceCode: data.deviceCode
  };

  // Use store method untuk update chart data
  deviceStore.addRealTimeData({
    waterLevel: waterLevel,
    rainfall: rainfall,
    timestamp: data.timestamp
  });
};

// Watch for device changes
watch(selectedDevice, async (newDevice, oldDevice) => {
  console.log("🔄 Device changed:", {
    old: oldDevice?.code,
    new: newDevice?.code
  });

  // Socket.IO: Unsubscribe dari device lama
  if (socket && oldDevice && oldDevice.code) {
    socket.emit('unsubscribe-device', oldDevice.code);
    console.log("📤 Unsubscribed from device:", oldDevice.code);
  }

  // Socket.IO: Subscribe ke device baru
  if (socket && newDevice && newDevice.code) {
    socket.emit('subscribe-device', newDevice.code);
    console.log("📥 Subscribed to device:", newDevice.code);
  }

  // Fetch data untuk device baru
  await handleFetchHistory();
});

// Watch for date range changes
watch(() => [dateRange.value.start, dateRange.value.end], async () => {
  console.log("📅 Date range changed:", dateRange.value);
  await handleFetchHistory();
}, { deep: true });

// Watch untuk devices array dan set selectedDevice saat pertama kali loaded
watch(() => devices.value, (newDevices) => {
  console.log("📋 Devices loaded:", newDevices);

  if (newDevices.length > 0 && !selectedDevice.value) {
    // Set device pertama sebagai default hanya jika belum ada yang dipilih
    selectedDevice.value = newDevices[0];
    console.log("🎯 Default device selected:", selectedDevice.value.code);
  }
}, { immediate: true });

onMounted(async () => {
  console.log("🚀 Component mounted - initializing...");

  // Setup Socket.IO connection untuk real-time
  setupSocket();

  try {
    // 1. Fetch devices terlebih dahulu
    console.log("📡 Fetching devices...");
    await deviceStore.fetchDevices();

    // 2. Tunggu sampai devices ter-load dan selectedDevice ter-set
    if (devices.value.length > 0) {
      // Jika devices sudah ada, set selectedDevice jika belum ada
      if (!selectedDevice.value) {
        selectedDevice.value = devices.value[0];
        console.log("🎯 Initial device selected:", selectedDevice.value.code);
      }

      // 3. Fetch data untuk selected device
      await handleFetchHistory();
    } else {
      console.log("⚠️ No devices found");
    }

    console.log("✅ Component initialization completed");

  } catch (error) {
    console.error("❌ Error during component initialization:", error);
  }
});

onUnmounted(() => {
  console.log("🔄 Component unmounting - cleaning up...");

  if (intervalId) {
    clearInterval(intervalId);
  }

  // Cleanup socket connection
  if (socket) {
    // Unsubscribe dari device saat ini
    if (selectedDevice.value && selectedDevice.value.code) {
      socket.emit('unsubscribe-device', selectedDevice.value.code);
      console.log("📤 Unsubscribed from device on unmount:", selectedDevice.value.code);
    }
    socket.disconnect();
    console.log("🔌 Socket disconnected");
  }

  console.log("✅ Component cleanup completed");
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
          backgroundColor: selectedDevice?.status === 'CONNECTED' ? '#e8f5e8' : '#fce8e8',
          color: selectedDevice?.status === 'CONNECTED' ? '#4caf50' : '#f44336',
          fontSize: '12px'
        }">
          <span :style="{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: selectedDevice?.status === 'CONNECTED' ? '#4caf50' : '#f44336'
          }"></span>
          {{ selectedDevice?.status === 'CONNECTED' ? 'Connected' : 'Disconnected' }}
        </div>

        <!-- Device Selector -->
        <select v-model="selectedDevice" style="padding: 5px 10px; border-radius: 5px; border: 1px solid #ddd;">
          <option v-for="device in devices" :key="device.id" :value="device">
            {{ device.code }}
          </option>
        </select>
      </div>
    </div>

    <!-- Statistics Cards -->
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

    <!-- Date Range Controls -->
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
    </div>

    <!-- Chart -->
    <apexchart
      v-if="selectedDevice"
      type="area"
      height="400"
      :options="options"
      :series="series"
    ></apexchart>

    <!-- No device selected message -->
    <div v-else style="text-align: center; padding: 40px; color: #666;">
      <p>Please select a device to view data</p>
    </div>
  </div>
</template>
