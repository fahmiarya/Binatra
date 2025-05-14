<template>
  <BaseLayout>
    <main class="pt-6 px-6 pb-1 bg-[#E7ECEF] w-full flex gap-10">
      <!-- Bagian kiri (2/3 layar) -->
      <div class="w-2/3 flex flex-col gap-10"><!-- Menambah jarak antar card dengan gap-10 -->
        <!-- Baris pertama -->
        <div class="grid grid-cols-2 gap-8"><!-- Menambah jarak antara card dalam grid -->
          <!-- Weather Card -->
          <BaseCard customClass="p-6">
            <div class="flex justify-between items-center">
              <div>
                <h3 class="text-xl font-semibold text-[#274C77] mb-1">Weather</h3>
                <p class="text-sm text-gray-500 mb-3">{{ location }}</p>

                <div class="mb-2">
                  <span class="text-4xl font-medium text-[#516F91]">{{ main?.temp }}°C</span>
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

            <button class="absolute top-4 right-4 text-gray-400">
              <i class="fas fa-chevron-right"></i>
            </button>
          </BaseCard>

          <!-- Water Level Card -->
          <BaseCard customClass="p-6">
            <div class="flex justify-between items-center h-full">
              <div class="flex flex-col justify-center">
                <h3 class="text-xl font-semibold text-[#274C77] mb-1">Water Level</h3>
                <div class="mt-4">
                  <span class="text-4xl font-medium text-[#516F91]">{{ sensorData.waterlevel || 0 }} cm</span>
                </div>
              </div>

              <div class="flex items-center h-full">
                <img :src="WaterLevelImage" alt="Water Level Indicator" class="mt-3 rounded" />
              </div>
            </div>

            <button class="absolute top-4 right-4 text-gray-400">
              <i class="fas fa-chevron-right"></i>
            </button>
          </BaseCard>
        </div>

        <!-- Baris kedua -->
        <div class="grid grid-cols-2 gap-8"><!-- Menambah jarak antara card dalam grid -->
          <!-- Device Card -->
          <BaseCard title="No of device" class="flex flex-col justify-between h-full">
            <div class="flex flex-col justify-center flex-grow">
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
              <img src="../assets/images/stats.png" class="w-full" alt="">
            </div>
          </BaseCard>
        </div>

        <!-- Today's Suggested Article Section -->
        <div class="border border-purple-500 rounded-lg overflow-hidden relative w-full bg-gray-900">
          <div class="text-white p-6 relative">
            <div class="max-w-md">
              <h3 class="text-xl font-medium mb-3">Today's Banjir Update</h3>
              <h4 class="font-bold mb-2">Effective Techniques in Flood Monitoring</h4>
              <p class="text-sm mb-3">
                Real-time monitoring of water levels can greatly assist in preventing flood damage. By using advanced
                sensor systems
                and data analytics, we can provide early warnings and improve disaster response capabilities. Learn
                about the latest
                technologies and how they are reshaping flood prevention strategies.
              </p>
              <button class="bg-white text-[#274C77] px-4 py-1 rounded-md text-sm">
                Read More
              </button>

              <div class="flex space-x-1 mt-6">
                <div v-for="(dot, index) in 5" :key="index"
                  :class="[index === 0 ? 'bg-white' : 'bg-gray-400', 'w-2 h-2 rounded-full']"></div>
              </div>
            </div>

            <div class="absolute top-4 right-4 flex items-center space-x-2">
              <div class="flex">
                <i v-for="star in 4" :key="star" class="fas fa-star text-yellow-500"></i>
                <i class="fas fa-star text-gray-400"></i>
              </div>
              <span class="text-sm text-gray-300">(12846 Views)</span>
            </div>
          </div>

          <!-- Navigation arrows -->
          <button class="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white/10 p-2 rounded-full text-white">
            <i class="fas fa-chevron-left"></i>
          </button>
          <button class="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white/10 p-2 rounded-full text-white">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>

      <!-- Bagian kanan (1/3 layar) -->
      <div class="w-1/3 flex flex-col gap-10"><!-- Menambah jarak antar card dengan gap-10 -->
        <!-- Notifications Card -->
        <BaseCard title="Notifications" customClass="h-[350px]">
          <div class="mt-4 space-y-4">
            <div class="flex">
              <div class="w-2 h-2 rounded-full bg-red-500 mt-1.5 mr-2"></div>
              <div>
                <p class="text-sm font-medium">Banjir Ketinggian 25cm</p>
                <p class="text-xs text-gray-500">Ketintang dalam 20 minutes</p>
                <p class="text-xs text-gray-400 mt-1">16 min ago</p>
              </div>
            </div>

            <div class="flex">
              <div class="w-2 h-2 rounded-full bg-green-500 mt-1.5 mr-2"></div>
              <div>
                <p class="text-sm font-medium">Banjir Ketinggian 5 cm</p>
                <p class="text-xs text-gray-500">Jambangan dalam 15 minutes</p>
                <p class="text-xs text-gray-400 mt-1">8 min ago</p>
              </div>
            </div>

            <div class="flex">
              <div class="w-2 h-2 rounded-full bg-green-500 mt-1.5 mr-2"></div>
              <div>
                <p class="text-sm font-medium">Banjir Ketinggian 10cm Ketintang</p>
                <p class="text-xs text-gray-500">dalam 10 minutes</p>
                <p class="text-xs text-gray-400 mt-1">1 min ago</p>
              </div>
            </div>

            <div class="flex">
              <div class="w-2 h-2 rounded-full bg-green-500 mt-1.5 mr-2"></div>
              <div>
                <p class="text-sm font-medium">Banjir Ketinggian 10cm Ketintang</p>
                <p class="text-xs text-gray-500">dalam 10 minutes</p>
                <p class="text-xs text-gray-400 mt-1">1 min ago</p>
              </div>
            </div>
          </div>
        </BaseCard>

        <!-- Recommendations Card -->
        <BaseCard title="Recomendations" :hasArrow="false" customClass="flex-grow">
          <!-- Recommendation content -->
        </BaseCard>
      </div>
    </main>
  </BaseLayout>
</template>

<script setup>
import BaseCard from '@/components/BaseCard.vue';
import BaseLayout from '@/layouts/BaseLayout.vue';
import CloudIcon from '@/assets/images/cloud.png';
import { reactive, onMounted } from "vue";
import { listenToSensorData } from "@/socket.js"; // Pastikan path sudah benar
import { useWeatherStore } from '@/stores/weather.store';
import { storeToRefs } from 'pinia';
import WaterLevelImage from '@/assets/images/ruler.png'; // Pastikan path sesuai

const store = useWeatherStore();

const { weather, main, location } = storeToRefs(store);
const sensorData = reactive({
  waterlevel: null,
  rain: null,
});

onMounted(() => {

  listenToSensorData((data) => {
    // Update state dengan data yang diterima
    sensorData.waterlevel = data.waterlevel;
    sensorData.rain = data.rain;
    sensorData.buzzerState = data.buzzerState;
  });

});
</script>
