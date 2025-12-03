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

// Function untuk generate dummy prediction data
// Function untuk generate dummy prediction data (15 menit ke depan, interval 1 menit)
const generatePredictionData = (lastTimestamp, lastValue) => {
  const predictions = [];
  const now = new Date(lastTimestamp);

  // Titik awal sama dengan data terakhir
  predictions.push({
    x: now.getTime(),
    y: parseFloat(lastValue)
  });

  let currentValue = parseFloat(lastValue);

  const intervalMinutes = 1; // interval 1 menit
  const totalMinutes = 15;   // prediksi 15 menit ke depan

  for (let i = 1; i <= totalMinutes; i++) {
    const futureTime = new Date(now.getTime() + i * intervalMinutes * 60 * 1000);

    // variasi kecil & trend acak
    const variation = (Math.random() - 0.5) * 2; // -1 sampai +1
    const trendDirection = Math.random() > 0.5 ? 1 : -1;
    const trendValue = currentValue + (trendDirection * Math.random() * 0.5) + variation;

    // pastikan nilai >= 0 dan dibulatkan 2 desimal
    currentValue = Math.max(0, Math.round(trendValue * 100) / 100);

    predictions.push({
      x: futureTime.getTime(),
      y: currentValue
    });
  }

  return predictions;
};


// Chart options dengan timezone yang benar
const options = computed(() => {
  const chartData = deviceStore.getChartData();

  // Hitung jumlah data prediksi dan buat annotations
  let forecastCount = 0;
  let annotations = {};

  if (chartData.waterData && chartData.waterData.length > 0) {
    const lastData = chartData.waterData[chartData.waterData.length - 1];
    const predictionData = generatePredictionData(lastData.x, lastData.y);
    forecastCount = predictionData.length - 1; // -1 karena titik pertama adalah duplikat

    // Buat annotation untuk area prediksi
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
      width: [1, 1]
    },
    dataLabels: {
      enabled: false
    },
    tooltip: {
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
    },
    yaxis: [{
      title: {
        text: 'Water Level (cm)'
      },
      // min: function(min) {
      //   return min * 0.95;
      // },
      // max: function(max) {
      //   return max * 1.05;
      // }
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
        opacityFrom: 0.6,
        opacityTo: 0.1,
        stops: [0, 100]
      }
    },
    // legend: {
    //   show: true,
    //   position: 'top',
    //   horizontalAlign: 'right'
    // },
    // Konfigurasi Forecast Data Points
    forecastDataPoints: {
      count: forecastCount,
      fillOpacity: 0.4,
      strokeWidth: 2,
      dashArray: [8, 10] // Garis putus-putus untuk prediksi
    }
  };
});

const series = computed(() => {
  const chartData = deviceStore.getChartData()

  // Gabungkan water level dan prediksi dalam 1 series
  let combinedWaterData = [...chartData.waterData];

  if (chartData.waterData && chartData.waterData.length > 0) {
    const lastData = chartData.waterData[chartData.waterData.length - 1];
    const predictionData = generatePredictionData(lastData.x, lastData.y);

    // Gabungkan tanpa duplikat titik pertama (karena sudah ada di waterData)
    combinedWaterData = [...chartData.waterData, ...predictionData.slice(1)];

    // console.log('🔍 Total data points:', combinedWaterData.length);
    // console.log('🔍 Prediction points count:', predictionData.length - 1);
  }

  return [
    {
      name: 'Water Level',
      data: combinedWaterData,
      yAxisIndex: 0
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
    await deviceStore.fetchDevices();

    if (devices.value.length > 0) {
      if (!selectedDevice.value) {
        selectedDevice.value = devices.value[0];
      }
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
