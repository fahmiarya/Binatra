<template>
  <aside class="text-gray-800 w-72 shadow-md bg-[#E7ECEF] pt-6">
    <div>
      <nav class="space-y-1">
        <!-- Dashboard Link -->
        <router-link
          to="/"
          class="flex items-center p-3 pl-5 rounded-e-full transition-all duration-200"
          :class="isActive('/') ? 'bg-[#274C77] text-white' : 'text-gray-700 hover:bg-gray-100'"
        >
          <span class="mr-3">
            <i class="fas fa-home"></i>
          </span>
          Dashboard
        </router-link>

        <!-- Location Links -->
        <div v-for="(location, index) in locations" :key="index">
          <router-link
            :to="location.route"
            @click="handleLocationClick(location.lat, location.lon, location.name)"
            class="flex items-center p-3 pl-5 rounded-lg transition-all duration-200"
            :class="isActive(location.route) ? 'bg-[#274C77] text-white' : 'text-gray-700 hover:bg-gray-100'"
          >
            <span class="mr-3">
              <img :src="SurabayaPemda" alt="Surabaya Pemda" class="w-6 h-6"/>
            </span>
            {{ location.name }}
          </router-link>
        </div>

        <!-- Settings Link (Fixed at bottom) -->
        <div class="mt-auto pt-20 fixed bottom-0">
          <router-link
            to="/settings"
            class="flex items-center p-3 pl-5 rounded-lg transition-all duration-200"
            :class="isActive('/settings') ? 'bg-[#274C77] text-white' : 'text-gray-700 hover:bg-gray-100'"
          >
            <span class="mr-3">
              <i class="fas fa-cog"></i>
            </span>
            Settings
          </router-link>
        </div>
      </nav>
    </div>
  </aside>
</template>

<script setup>
import { useWeatherStore } from '@/stores/weather.store';
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import SurabayaPemda from "@/assets/images/surabaya-pemda.png";

const weatherStore = useWeatherStore();
const route = useRoute();

const locations = [
  {
    name: "Pemerintah Kota",
    icon: "fa-building",
    lat: -7.257820549770008,
    lon: 112.74848743800932,
    route: "/pemerintah-kota"
  },
  {
    name: "Dinas Pekerjaan Umum (PU)",
    icon: "fa-hard-hat",
    lat: -7.327835928981301,
    lon: 112.72706435811946,
    route: "/dinas-pekerjaan-umum"
  },
  {
    name: "Dinas Perhubungan (Dishub)",
    icon: "fa-car",
    lat: -7.343299542429205,
    lon: 112.72747989814852,
    route: "/dinas-perhubungan"
  },
  {
    name: "BPBD Jawa Timur",
    icon: "fa-chart-line",
    lat: -7.360353412714205,
    lon: 112.72881724417964,
    route: "/bpbd-jawa-timur"
  },
];

// Function to check if current route is active
const isActive = (routePath) => {
  return route.path === routePath;
};

// Handle location click with navigation and weather fetch
async function handleLocationClick(lat, lon, locationName) {
  try {
    // Fetch weather data for the selected location
    await weatherStore.fetchWeather(lat, lon);

    // Optional: Store selected location in local storage or store
    localStorage.setItem('selectedLocation', JSON.stringify({
      name: locationName,
      lat,
      lon
    }));

    console.log(`Navigated to ${locationName}`);
  } catch (error) {
    console.error('Error fetching weather data:', error);
  }
}

onMounted(async () => {
  // Check if there's a stored location preference
  const storedLocation = localStorage.getItem('selectedLocation');

  if (storedLocation) {
    const { lat, lon } = JSON.parse(storedLocation);
    await handleLocationClick(lat, lon, 'Stored Location');
  } else {
    // Initial fetch for the first location as default
    const defaultLocation = locations[0];
    await handleLocationClick(defaultLocation.lat, defaultLocation.lon, defaultLocation.name);
  }
});
</script>
