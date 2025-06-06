<template>
  <BaseLayout>
    <main class="pt-6 px-6 pb-1 bg-[#E7ECEF] w-full flex gap-10">
      <!-- Bagian kiri (2/3 layar) -->
      <div class="w-2/3 flex flex-col gap-10">
        <!-- Baris pertama -->
        <div class="grid grid-cols-2 gap-8">
          <!-- Weather Card -->
          <BaseCard title="Cuaca Surabaya">
            <div class="flex justify-between items-center">
              <div>
                <p class="text-sm text-gray-500 mb-3">{{ location }}</p>

                <div class="mb-2">
                  <span class="text-3xl font-medium text-[#516F91]">{{ main?.temp }}°C</span>
                  <div class="text-xs text-gray-500 mt-2">
                    <span>3°C</span> / <span>12°C</span>
                  </div>
                </div>

                <p class="text-sm text-gray-500" v-if="weather">{{ weather[0].main }}</p>
                <p class="text-sm text-gray-500" v-else>Loading...</p>
              </div>

              <div class="mt-1">
                <img :src="CloudIcon" alt="Weather" class="w-28" />
              </div>
            </div>
          </BaseCard>

          <!-- Water Level Card -->
          <BaseCard title="Jumlah Lokasi Banjir" customClass="p-6" :showTopRightArrow="true">
            <div class="flex justify-between items-center h-full">
              <div class="flex flex-col justify-center">
                <div class="mt-4">
                  <span class="text-4xl font-medium text-[#516F91]">{{ alertLocations.filter(loc => loc.status === 'bahaya').length }}</span>
                </div>
              </div>
            </div>
          </BaseCard>
        </div>

        <!-- Baris kedua -->
        <div class="grid grid-cols-2 gap-8">
          <!-- Device Card -->
          <BaseCard title="Jumlah Device Terhubung" customClass="flex flex-col justify-between">
            <div>
              <p class="font-medium text-green-600 mt-2">Connected</p>
              <p class="text-sm text-gray-600 mt-1">8 Connected devices</p>
            </div>

            <div class="mt-auto text-sm text-gray-600">
              <div class="flex justify-between">
                <div>
                  <p class="text-[#516F91] font-medium">
                    12.54 <span class="text-gray-500 font-normal">GB sent</span>
                  </p>
                </div>
                <div>
                  <p class="text-green-600 font-medium">
                    6.48 <span class="text-gray-500 font-normal">GB received</span>
                  </p>
                </div>
              </div>
            </div>
          </BaseCard>

          <!-- Electricity Card -->
          <BaseCard title="Electricity" customClass="relative">
            <div class="w-full flex mt-2 space-x-2">
              <button class="px-6 py-1 bg-gray-400 text-white rounded-md text-sm">Daily</button>
              <button class="px-6 py-1 text-gray-600 rounded-md text-sm hover:bg-gray-200">Weekly</button>
            </div>
            <div class="mt-4 h-20">
              <img src="../assets/images/stats.png" class="w-full" alt="Statistics">
            </div>
          </BaseCard>
        </div>

        <div class="grid">
          <BaseCard title="Real Time Ketinggian Banjir">
            <BaseAreaChart />
          </BaseCard>
        </div>
      </div>

      <!-- Bagian kanan (1/3 layar) -->
      <div class="w-1/3 flex flex-col gap-10">
        <!-- Notifications Card -->
        <BaseCard title="Peringatan Banjir" customClass="h-[350px]">
          <div class="mt-4 space-y-4 overflow-y-auto max-h-64">
            <div class="flex" v-for="notification in floodNotifications" :key="notification.id">
              <div :class="[
                'w-2 h-2 rounded-full mt-1.5 mr-2',
                notification.severity === 'high' ? 'bg-red-500' :
                notification.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
              ]"></div>
              <div>
                <p class="text-sm font-medium">{{ notification.title }}</p>
                <p class="text-xs text-gray-500">{{ notification.location }} dalam {{ notification.timeframe }}</p>
                <p class="text-xs text-gray-400 mt-1">{{ notification.timeAgo }}</p>
              </div>
            </div>
          </div>
        </BaseCard>

        <!-- Alert Locations Card - Updated -->
        <BaseCard title="Lokasi Dengan Status Waspada" :hasArrow="false" customClass="flex-grow">
          <div class="space-y-3 mt-4">
            <div
              v-for="location in alertLocations"
              :key="location.id"
              :class="[
                'p-4 rounded-lg border-l-4 shadow-sm transition-all hover:shadow-md',
                getLocationCardStyle(location.status)
              ]"
            >
              <div class="flex justify-between items-start mb-2">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <h4 class="font-semibold text-gray-800">{{ location.name }}</h4>
                    <span :class="[
                      'px-2 py-1 rounded-full text-xs font-medium',
                      getStatusBadgeStyle(location.status)
                    ]">
                      {{ getStatusText(location.status) }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-600 mb-2">{{ location.address }}</p>

                  <div class="grid grid-cols-2 gap-2 text-xs">
                    <div class="flex items-center gap-1">
                      <span class="text-blue-600">💧</span>
                      <span class="text-gray-600">{{ location.waterLevel }}cm</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <span class="text-gray-600">🌧️</span>
                      <span class="text-gray-600">{{ location.rainfall }}mm/h</span>
                    </div>
                  </div>
                </div>

                <div class="text-right">
                  <p class="text-xs text-gray-500">Update terakhir</p>
                  <p class="text-xs font-medium text-gray-700">{{ location.lastUpdate }}</p>
                </div>
              </div>

              <!-- Progress bar untuk water level -->
              <div class="mt-3">
                <div class="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Ketinggian Air</span>
                  <span>{{ location.waterLevel }}/{{ location.maxLevel }}cm</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div
                    :class="[
                      'h-2 rounded-full transition-all duration-300',
                      getProgressBarColor(location.status)
                    ]"
                    :style="{ width: (location.waterLevel / location.maxLevel * 100) + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </BaseCard>
      </div>
    </main>
  </BaseLayout>
</template>

<script setup>
import BaseCard from '@/components/BaseCard.vue';
import BaseLayout from '@/layouts/BaseLayout.vue';
import CloudIcon from '@/assets/images/cloud.png';
import { reactive, onMounted, ref } from "vue";
import { listenToSensorData } from "@/socket.js";
import { useWeatherStore } from '@/stores/weather.store';
import { storeToRefs } from 'pinia';
import BaseAreaChart from '@/components/BaseAreaChart.vue';

const store = useWeatherStore();
const { weather, main, location } = storeToRefs(store);

const sensorData = reactive({
  waterlevel: null,
  rain: null,
});

// Data dummy untuk notifikasi banjir
const floodNotifications = ref([
  {
    id: 1,
    title: "Banjir Ketinggian 25cm",
    location: "Ketintang",
    timeframe: "20 minutes",
    timeAgo: "16 min ago",
    severity: "high"
  },
  {
    id: 2,
    title: "Banjir Ketinggian 5cm",
    location: "Jambangan",
    timeframe: "15 minutes",
    timeAgo: "8 min ago",
    severity: "low"
  },
  {
    id: 3,
    title: "Banjir Ketinggian 10cm",
    location: "Ketintang",
    timeframe: "10 minutes",
    timeAgo: "1 min ago",
    severity: "medium"
  },
  {
    id: 4,
    title: "Banjir Ketinggian 15cm",
    location: "Wonokromo",
    timeframe: "5 minutes",
    timeAgo: "3 min ago",
    severity: "medium"
  }
]);

// Data dummy untuk lokasi dengan status waspada
const alertLocations = ref([
  {
    id: 1,
    name: "Ketintang",
    address: "Jl. Ketintang Baru No. 123",
    status: "bahaya", // aman, waspada, bahaya
    waterLevel: 45,
    maxLevel: 50,
    rainfall: 15.2,
    lastUpdate: "2 min ago",
    deviceStatus: "online"
  },
  {
    id: 2,
    name: "Jambangan",
    address: "Jl. Jambangan Kebon Agung",
    status: "waspada",
    waterLevel: 25,
    maxLevel: 40,
    rainfall: 8.5,
    lastUpdate: "5 min ago",
    deviceStatus: "online"
  },
  {
    id: 3,
    name: "Wonokromo",
    address: "Jl. Wonokromo Selatan",
    status: "waspada",
    waterLevel: 18,
    maxLevel: 35,
    rainfall: 12.0,
    lastUpdate: "3 min ago",
    deviceStatus: "online"
  },
  {
    id: 4,
    name: "Gubeng",
    address: "Jl. Gubeng Pojok",
    status: "aman",
    waterLevel: 8,
    maxLevel: 30,
    rainfall: 3.2,
    lastUpdate: "1 min ago",
    deviceStatus: "online"
  },
  {
    id: 5,
    name: "Sukolilo",
    address: "Jl. Raya Sukolilo",
    status: "aman",
    waterLevel: 12,
    maxLevel: 35,
    rainfall: 5.8,
    lastUpdate: "4 min ago",
    deviceStatus: "online"
  }
]);

// Functions untuk styling berdasarkan status
const getLocationCardStyle = (status) => {
  switch (status) {
    case 'bahaya':
      return 'bg-red-50 border-red-400';
    case 'waspada':
      return 'bg-yellow-50 border-yellow-400';
    case 'aman':
      return 'bg-green-50 border-green-400';
    default:
      return 'bg-gray-50 border-gray-400';
  }
};

const getStatusBadgeStyle = (status) => {
  switch (status) {
    case 'bahaya':
      return 'bg-red-100 text-red-800';
    case 'waspada':
      return 'bg-yellow-100 text-yellow-800';
    case 'aman':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'bahaya':
      return 'BAHAYA';
    case 'waspada':
      return 'WASPADA';
    case 'aman':
      return 'AMAN';
    default:
      return 'UNKNOWN';
  }
};

const getProgressBarColor = (status) => {
  switch (status) {
    case 'bahaya':
      return 'bg-red-500';
    case 'waspada':
      return 'bg-yellow-500';
    case 'aman':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
};

onMounted(() => {
  listenToSensorData((data) => {
    sensorData.waterlevel = data.waterlevel;
    sensorData.rain = data.rain;
    sensorData.buzzerState = data.buzzerState;
  });

  // Simulasi update data realtime setiap 30 detik
  setInterval(() => {
    updateLocationData();
  }, 30000);
});

// Function untuk update data lokasi secara realtime
const updateLocationData = () => {
  alertLocations.value.forEach(location => {
    // Simulasi perubahan water level dan rainfall
    const waterChange = (Math.random() - 0.5) * 4; // ±2cm
    const rainChange = (Math.random() - 0.5) * 2; // ±1mm/h

    location.waterLevel = Math.max(0, Math.min(location.maxLevel, location.waterLevel + waterChange));
    location.rainfall = Math.max(0, location.rainfall + rainChange);

    // Update status berdasarkan water level
    const percentage = (location.waterLevel / location.maxLevel) * 100;
    if (percentage >= 80) {
      location.status = 'bahaya';
    } else if (percentage >= 50) {
      location.status = 'waspada';
    } else {
      location.status = 'aman';
    }

    location.lastUpdate = 'Just now';
  });
};
</script>
