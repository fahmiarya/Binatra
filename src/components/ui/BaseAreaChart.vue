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
import axios from 'axios';

const deviceStore = useDeviceStore()
const { devices, loadArr } = storeToRefs(deviceStore)
const deviceSocket = useDeviceSocket();
const currentReading = ref(null);
const selectedDevice = ref(null);
const dateRange = ref([new Date()]);
const isLoading = ref(false);
const lazyParams = ref({
  first: 0,
  rows: 10,
  query: ''
})

// Socket.IO connection
let socket = null;
let intervalId = null;

const callFlaskPrediction = async () => {
  try {
    if (!selectedDevice.value || selectedDevice.value.code !== '68D05') {
      deviceStore.setFlaskPrediction([]);
      return;
    }

    const logs = deviceStore.sensorLogs;

    if (!logs || logs.length === 0) return;

    // Cek apakah dateRange adalah hari ini
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDate = dateRange.value[0] ? new Date(dateRange.value[0]) : new Date();
    selectedDate.setHours(0, 0, 0, 0);

    // Jika bukan hari ini, clear prediksi dan return
    if (selectedDate.getTime() !== today.getTime()) {
      deviceStore.setFlaskPrediction([]);
      return;
    }

    // Format data untuk Flask API
    const sensorData = logs.map(log => ({
      timestamp: log.timestamp,
      waterlevel: log.depth,
      rainfall: log.rainfall,
      voltage: log.voltage || 0
    }));

    const predictions = await axios.post(`/api/v1/prediction`, {
      locationId : selectedDevice.value.location.id,
      data : sensorData
    });

    if (predictions.data.data) deviceStore.setFlaskPrediction(predictions.data.data);
  } catch (error) {
    console.error("Error calling Flask prediction:", error);
  }
};

const options = computed(() => {
  const chartData = deviceStore.getChartData();

  // Hitung jumlah data prediksi dan buat annotations
  let forecastCount = 0;
  let annotations = {};

  if (chartData.waterData && chartData.waterData.length > 0) {
    const lastData = chartData.waterData[chartData.waterData.length - 1];

    if (chartData.flaskPrediction && chartData.flaskPrediction.length > 0) {
      const predictionData = chartData.flaskPrediction;
      forecastCount = predictionData.length - 1;

      if (predictionData.length > 1) {
        const predictionStartX = lastData.x;
        const predictionEndX = predictionData[predictionData.length - 1].x;

        annotations = {
          xaxis: [{
            x: predictionStartX,
            x2: predictionEndX,
            fillColor: '#00CED1',
            opacity: 0.1,
            borderColor: '#00CED1',
            borderWidth: 1,
            label: {
              text: 'Prediksi 15 Menit',
              style: {
                color: '#fff',
                background: '#00CED1',
                fontSize: '11px',
                fontWeight: 600,
                padding: {
                  left: 8,
                  right: 8,
                  top: 4,
                  bottom: 4
                }
              },
              orientation: 'horizontal',
              position: 'top',
              offsetY: -5
            }
          }]
        };
      }
    }
  }

  return {
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
    annotations: annotations,
    xaxis: {
      type: 'datetime',
      labels: {
        format: 'HH:mm:ss',
        datetimeUTC: false,
        formatter: function (val, timestamp) {
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
      curve: 'smooth',
      width: [2, 2]
    },
    dataLabels: {
      enabled: false
    },
    tooltip: {
      shared: true,
      intersect: false,
      x: {
        format: 'dd/MM/yyyy HH:mm:ss',
        formatter: function (val) {
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
      y: {
        formatter: function (value, { seriesIndex }) {

          if (value === null || value === undefined) return 'N/A';

          if (seriesIndex === 0) {
            return value + ' cm';
          } else if (seriesIndex === 1) {
            return value + ' mm';
          }
          return value;
        }
      }
    },
    yaxis: [{
      title: {
        text: 'Ketinggian Air (cm)'
      },
      labels: {
        formatter: function (val) {
          return val ? val : '0';
        }
      }
    },
    {
      opposite: true,
      title: {
        text: 'Curah Hujan (mm)'
      },
      min: 0,
      max: 50,
      labels: {
        style: {
          fontSize: '10px'
        },
        formatter: function (val) {
          return val !== null && val !== undefined ? val.toFixed(0) : '0';
        }
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
        opacityFrom: 0.6,
        opacityTo: 0.1,
        stops: [0, 100]
      }
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right'
    },
    forecastDataPoints: {
      count: forecastCount,
      fillOpacity: 0.4,
      strokeWidth: 2,
      dashArray: [8, 10]
    }
  };
});

const series = computed(() => {
  const chartData = deviceStore.getChartData();
  let combinedWaterData = [...chartData.waterData];

  if (chartData.waterData && chartData.waterData.length > 0) {
    if (chartData.flaskPrediction && chartData.flaskPrediction.length > 0) {
      combinedWaterData = [...chartData.waterData, ...chartData.flaskPrediction.slice(1)];
    }
  }

  return [
    {
      name: "Ketinggian Air",
      data: combinedWaterData
    },
    {
      name: "Curah Hujan",
      data: chartData.rainfallData
    }
  ];
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
    isLoading.value = true;

    await deviceStore.fetchSensorLogHistory(
      selectedDevice.value.code,
      dateRange.value
    );

    const logs = deviceStore.sensorLogs;

    if (logs && logs.length > 0) {
      currentReading.value = {
        depth: logs[0].depth,
        rainfall: logs[0].rainfall,
        timestamp: logs[0].timestamp,
        deviceCode: selectedDevice.value.code
      };

      // Panggil Flask API untuk prediksi setelah fetch history
      await callFlaskPrediction();
    } else {
      currentReading.value = {
        depth: 0,
        rainfall: 0,
        timestamp: null,
        deviceCode: selectedDevice.value.code
      };
    }
  } catch (error) {
    console.error("Error fetching history for device:", selectedDevice.value.code, error);
    currentReading.value = null;
  } finally {
    isLoading.value = false; // Set loading false setelah selesai
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

const setupSocket = () => {
  socket = io(import.meta.env.VITE_API_URL);

  socket.on('connect', () => {
    if (selectedDevice.value && selectedDevice.value.code) {
      socket.emit('subscribe-device', selectedDevice.value.code);
    }
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from Socket.IO server');
  });

  socket.on('sensor-data', (data) => {
    updateChartRealTime(data);
  });

  socket.on('sensor-data-saved', (data) => {
    updateChartRealTime(data);
  });
};

const updateChartRealTime = async (data) => {
  if (!selectedDevice.value || data?.deviceCode !== selectedDevice.value.code) {
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

  await callFlaskPrediction();
};

watch(selectedDevice, async (newDevice, oldDevice) => {
  if (socket && oldDevice && oldDevice.code) {
    socket.emit('unsubscribe-device', oldDevice.code);
  }

  if (socket && newDevice && newDevice.code) {
    socket.emit('subscribe-device', newDevice.code);
  }

  await handleFetchHistory();
});

watch(deviceSocket.deviceNotificationData, (newData) => {
  if (newData) {
    const matchingDevice = devices.value.find(device =>
      device.code === newData.code || device.id === newData.id
    );

    if (matchingDevice) {
      if (newData.status) {
        matchingDevice.status = newData.status;
      }
      selectedDevice.value = matchingDevice;
    } else {
      console.warn("Device not found in devices array:", newData);
    }
  }
}, { immediate: true });

onMounted(async () => {
  setupSocket();

  try {
    isLoading.value = true;

    await deviceStore.fetchDevices();

    if (devices.value.length > 0) {
      if (!selectedDevice.value) {
        selectedDevice.value = devices.value[0];
      }
      await handleFetchHistory();
    } else {
      alert("device tidak ditemukan")
    }
  } catch (error) {
    alert("terjadi kesalahan")
  } finally {
    isLoading.value = false;
  }
});

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }

  if (socket) {
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
        @update:model-value="selectedDate" dateFormat="dd/mm/yy" :disabled="isLoading" />

      <AutoComplete v-model="selectedDevice" optionLabel="name" :suggestions="devices" @complete="search" dropdown
        :loading="loadArr.includes('GET_DEVICES_SCROLL')" :disabled="isLoading" :virtualScrollerOptions="{
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
            <span class="inline-block w-2 h-2 rounded-full" :class="{
              'bg-green-500': option.status === 'CONNECTED',
              'bg-red-500': option.status === 'DISCONNECTED',
              'animate-pulse': option.status === 'CONNECTED',
            }"></span>
          </div>
        </template>

        <template #empty>
          <div class="flex items-center justify-center py-4 text-gray-500">
            <span>Tidak ada perangkat ditemukan</span>
          </div>
        </template>
      </AutoComplete>

      <BaseButton label="Export" @click="deviceStore.exportCSV(selectedDevice.code, dateRange)" :disabled="isLoading" />
    </section>

    <!-- Loading Indicator -->
    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <div class="flex flex-col items-center gap-4">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p class="text-gray-600">Memuat data...</p>
      </div>
    </div>

    <!-- Chart -->
    <apexchart v-else-if="selectedDevice && devices.length" type="area" height="400" :options="options"
      :series="series">
    </apexchart>

    <!-- No device selected message -->
    <div v-else-if="!isLoading" style="text-align: center; padding: 40px; color: #666;">
      <p>Please select a device to view data</p>
    </div>
  </div>
</template>
