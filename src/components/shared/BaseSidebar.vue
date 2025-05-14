<script setup>
import { useWeatherStore } from '@/stores/weather.store';
import { onMounted } from 'vue';
import SurabayaPemda from "@/assets/images/surabaya-pemda.png";

const weatherStore = useWeatherStore();

const locations = [
  {
    name: "Pemerintah Kota",
    icon: "fa-building",
    lat: -7.257820549770008,
    lon: 112.74848743800932,
  },
  {
    name: "Dinas Pekerjaan Umum (PU)",
    icon: "fa-hard-hat",
    lat: -7.327835928981301,
    lon: 112.72706435811946,
  },
  {
    name: "Dinas Perhubungan (Dishub)",
    icon: "fa-car",
    lat: -7.343299542429205,
    lon: 112.72747989814852,
  },
  {
    name: "BPBD Jawa Timur",
    icon: "fa-chart-line",
    lat: -7.360353412714205,
    lon: 112.72881724417964,
  },
];

async function handleLocationClick(lat, lon) {
  await weatherStore.fetchWeather(lat, lon);
}

onMounted(async () => {
  // Initial fetch for the first location, or based on a default logic
  handleLocationClick(locations[0].lat, locations[0].lon);
});
</script>

<template>
  <aside class="text-gray-800 w-72 shadow-md bg-[#E7ECEF] pt-6">
    <div>
      <nav class="space-y-1">
        <a href="#" class="flex items-center p-3 pl-5 bg-[#274C77] text-white rounded-e-full">
          <span class="mr-3">
            <i class="fas fa-home"></i>
          </span>
          Dashboard
        </a>

        <div v-for="(location, index) in locations" :key="index">
          <a
            href="#"
            @click.prevent="handleLocationClick(location.lat, location.lon)"
            class="flex items-center p-3 pl-5 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <span class="mr-3">
              <img :src="SurabayaPemda" alt="Surabaya Pemda" class="w-6 h-6"/>
            </span>
            {{ location.name }}
          </a>
        </div>

        <div class="mt-auto pt-20 fixed bottom-0">
          <a href="#" class="flex items-center p-3 pl-5 text-gray-700 hover:bg-gray-100 rounded-lg">
            <span class="mr-3">
              <i class="fas fa-cog"></i>
            </span>
            Settings
          </a>
        </div>
      </nav>
    </div>
  </aside>
</template>
