<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { useDeviceStore } from '@/stores/deviceStore';
import { useDeviceSocket } from '@/composables/useDeviceSocket.js';
import { storeToRefs } from 'pinia';
import { io } from 'socket.io-client';
import DatePicker from './DatePicker.vue';
import { debounce } from 'lodash';
import AutoComplete from './AutoComplete.vue';
import BaseButton from './BaseButton.vue';
import BaseCard from './BaseCard.vue';

const deviceStore = useDeviceStore()
const { devices, loadArr } = storeToRefs(deviceStore)
const deviceSocket = useDeviceSocket();
const currentReading = ref(null);
const selectedDevice = ref(null);
const dateRange = ref([new Date()]);
const lazyParams = ref({
  first: 0,
  rows: 10,
  query: ''
})

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
      show: false,
    }
  },
  xaxis: {
    type: 'datetime',
    labels: {
      format: 'HH:mm:ss',
      datetimeUTC: false, // Gunakan timezone lokal
      formatter: function (val, timestamp) {
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
      formatter: function (val) {
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

const selectedDate = debounce(() => {
  handleFetchHistory()
}, 500)

const handleFetchHistory = async () => {
  if (!selectedDevice.value || !selectedDevice.value.code) {
    currentReading.value = null;
    return;
  }

  try {
    await deviceStore.fetchSensorLogHistory(
      selectedDevice.value.code,
      dateRange.value
    );

    // Update currentReading dari store setelah fetch berhasil
    const logs = deviceStore.sensorLogs;


    if (logs && logs.length > 0) {
      currentReading.value = {
        depth: logs[0].depth,
        rainfall: logs[0].rainfall,
        timestamp: logs[0].timestamp,
        deviceCode: selectedDevice.value.code
      };
    } else {
      currentReading.value = {
        depth: 0,
        rainfall: 0,
        timestamp: null,
        deviceCode: selectedDevice.value.code
      };

    }
  } catch (error) {
    console.error("❌ Error fetching history for device:", selectedDevice.value.code, error);
    // Clear data on error
    currentReading.value = null;
  }
}

const search = debounce(async (event) => {
  const { query } = event

  lazyParams.value.query = query;
  lazyParams.value.first = 0;

  try {
    await deviceStore.getDataByScroll(query)
  } catch (error) {
    console.error('Error loading lazy data:', error);
  }
}, 500);

// Setup Socket.IO untuk real-time updates
const setupSocket = () => {
  socket = io(import.meta.env.VITE_API_URL);

  socket.on('connect', () => {

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
    updateChartRealTime(data);
  });

  // Listen untuk konfirmasi data tersimpan
  socket.on('sensor-data-saved', (data) => {
    updateChartRealTime(data);
  });
};

// Update chart secara real-time
const updateChartRealTime = (data) => {
  if (!selectedDevice.value || data.deviceCode !== selectedDevice.value.code) {
    return;
  }

  const depth = data.depth || 0;
  const rainfall = data.rainfall || 0;

  currentReading.value = {
    depth: depth,
    rainfall: rainfall,
    timestamp: data.timestamp,
    deviceCode: data.deviceCode
  };

  deviceStore.addRealTimeData({
    depth: depth,
    rainfall: rainfall,
    timestamp: data.timestamp
  });
};

// Watch for device changes
watch(selectedDevice, async (newDevice, oldDevice) => {
  // Socket.IO: Unsubscribe dari device lama
  if (socket && oldDevice && oldDevice.code) {
    socket.emit('unsubscribe-device', oldDevice.code);
  }

  // Socket.IO: Subscribe ke device baru
  if (socket && newDevice && newDevice.code) {
    socket.emit('subscribe-device', newDevice.code);
  }

  // Fetch data untuk device baru
  await handleFetchHistory();
});

watch(deviceSocket.deviceNotificationData, (newData) => {
  if (newData) {
    // ✅ Cari device yang matching di devices array
    const matchingDevice = devices.value.find(device =>
      device.code === newData.code || device.id === newData.id
    );

    if (matchingDevice) {
      // ✅ Update status device dengan status dari notification
      if (newData.status) {
        matchingDevice.status = newData.status;
      }

      // ✅ Set selectedDevice dengan device yang sudah diupdate
      selectedDevice.value = matchingDevice;
    } else {
      console.warn("Device not found in devices array:", newData);
    }
  }
}, { immediate: true });




onMounted(async () => {

  // Setup Socket.IO connection untuk real-time
  setupSocket();

  try {
    // 1. Fetch devices terlebih dahulu
    await deviceStore.fetchDevices();

    // 2. Tunggu sampai devices ter-load dan selectedDevice ter-set
    if (devices.value.length > 0) {
      // Jika devices sudah ada, set selectedDevice jika belum ada
      if (!selectedDevice.value) {
        selectedDevice.value = devices.value[0];
      }

      // 3. Fetch data untuk selected device
      await handleFetchHistory();
    } else {
      console.log("⚠️ No devices found");
    }
  } catch (error) {
    console.error("❌ Error during component initialization:", error);
  }
});

onUnmounted(() => {

  if (intervalId) {
    clearInterval(intervalId);
  }

  // Cleanup socket connection
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
    <div
      style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; margin-top: 20px;">
      <BaseCard title="Tinggi Air">
        <div class="py-5">
          <p class="text-3xl font-bold text-primary-600">{{ currentReading?.depth || 0 }} cm</p>
        </div>
      </BaseCard>

      <BaseCard title="Curah Hujan">
        <div class="py-5">
          <p class="text-3xl font-bold text-primary-600">{{ currentReading?.rainfall || 0 }} mm</p>
        </div>
      </BaseCard>
    </div>

    <section class="flex gap-x-5 my-5">
      <DatePicker v-model="dateRange" selectionMode="range" :manualInput="false" showIcon iconDisplay="input"
        @update:model-value="selectedDate" dateFormat="dd/mm/yy" />

      <AutoComplete v-model="selectedDevice" optionLabel="name" :suggestions="devices" @complete="search" dropdown
        :loading="loadArr.includes('GET_DEVICES_SCROLL')" :virtualScrollerOptions="{
          itemSize: 38,
          showLoader: loadArr.includes('GET_DEVICES_SCROLL'),
          delay: 300,
          lazy: true,
        }" placeholder="Pilih atau cari perangkat..." emptyMessage="Tidak ada perangkat ditemukan">
        <template #option="{ option }">
          <div class="flex items-center justify-between w-full py-2 transition-colors">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">
                {{ option.name }}
              </p>
            </div>
            <span
              class="inline-block w-2 h-2 rounded-full"
              :class="{
                'bg-green-500': option.status === 'CONNECTED',
                'bg-red-500': option.status === 'DISCONNECTED',
                'animate-pulse' : option.status === 'CONNECTED',
              }"
            ></span>
          </div>
        </template>

        <template #empty>
          <div class="flex items-center justify-center py-4 text-gray-500">
            <span>Tidak ada perangkat ditemukan</span>
          </div>
        </template>
      </AutoComplete>

      <BaseButton label="Export" @click="deviceStore.exportCSV(selectedDevice.code, dateRange)" />
    </section>


    <!-- Chart -->
    <apexchart v-if="selectedDevice && devices.length" type="area" height="400" :options="options" :series="series"></apexchart>

    <!-- No device selected message -->
    <div v-else style="text-align: center; padding: 40px; color: #666;">
      <p>Please select a device to view data</p>
    </div>
  </div>
</template>
