<template>
  <BaseLayout>
    <!-- Bagian kiri (2/3 layar) -->
    <div class="w-full flex flex-col gap-10">
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
                <span class="text-4xl font-medium text-[#516F91]">1</span>
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
  </BaseLayout>
</template>

<script setup>
import BaseCard from '@/components/BaseCard.vue';
import BaseLayout from '@/layouts/BaseLayout.vue';
import CloudIcon from '@/assets/images/cloud.png';
import { reactive, onMounted } from "vue";
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


onMounted(() => {
  listenToSensorData((data) => {
    sensorData.waterlevel = data.waterlevel;
    sensorData.rain = data.rain;
    sensorData.buzzerState = data.buzzerState;
  });
});

</script>
