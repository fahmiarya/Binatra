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

        <!-- Jumlah Lokasi Banjir -->
        <BaseCard title="Jumlah Lokasi Banjir" customClass="scrollbar-hidden" :showTopRightArrow="true">
          <div class="flex items-center min-h-[120px]">
            <span class="text-4xl font-medium text-[#516F91]">{{ totalFloodLocations }}</span>
          </div>
        </BaseCard>
      </div>

      <!-- Jumlah Device Terhubung -->
      <div class="grid grid-cols-2 gap-8">
        <!-- Device Card -->
        <BaseCard title="Jumlah Device Terhubung">
          <div class="flex items-center min-h-[120px]">
            <p class="text-lg text-[#274C77] font-bold">
              {{ deviceConnected || 0 }}
              <span class="text-gray-500 font-normal">
                Connected devices
              </span>
            </p>
          </div>
        </BaseCard>


        <!-- Jumlah Lokasi Peringatan Banjir -->
        <BaseCard title="Jumlah Lokasi Peringatan Banjir" customClass="text-sm">
          <div class="flex items-center min-h-[120px]">
            <span class="text-4xl font-medium text-[#516F91]">{{ locationsTotal }}</span>
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
import { reactive, onMounted, ref } from "vue";
import { listenToSensorData } from "@/socket.js";
import { useWeatherStore } from '@/stores/weather.store';
import { storeToRefs } from 'pinia';
import BaseAreaChart from '@/components/BaseAreaChart.vue';
import { useDeviceStore } from '@/stores/deviceStore';
import { useLocationStore } from '@/stores/locationStore';

const weatherStore = useWeatherStore();
const deviceStore = useDeviceStore()
const locationStore = useLocationStore()
const { weather, main, location } = storeToRefs(weatherStore);

const sensorData = reactive({
  waterlevel: null,
  rain: null,
});
const totalFloodLocations = ref(0)
const floodLocations = ref([])
const locationsTotal = ref(0)
const deviceConnected = ref(0)


onMounted(async () => {
  deviceConnected.value = await deviceStore.getConnectedDevices()
  locationsTotal.value = await locationStore.getTotalLocations()
  totalFloodLocations.value = await locationStore.getTotalFloodLocations()
  floodLocations.value = await locationStore.getFloodLocations()

  console.log("lokasi yang waspada : ", floodLocations.value)

  listenToSensorData((data) => {
    sensorData.waterlevel = data.waterlevel;
    sensorData.rain = data.rain;
    sensorData.buzzerState = data.buzzerState;

    console.log("data yang baru diterima : ", data)
  });
});

</script>
