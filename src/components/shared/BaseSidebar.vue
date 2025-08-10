<template>
  <aside class="text-gray-800 w-72 shadow-md bg-[#E7ECEF] pt-6">
    <nav class="space-y-1 flex flex-col h-full">
      <!-- Loop nav items -->
      <div v-for="(item, index) in navItems" :key="index" :class="item.wrapperClass || ''">
        <router-link
          :to="item.route"
          @click="item.onClick ? item.onClick() : null"
          class="flex items-center p-3 pl-5 rounded-lg transition-all duration-200"
          :class="
            isActive(item.route)
              ? 'bg-[#274C77] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          "
        >
          <span class="mr-3">
            <Icon v-if="item.icon" :icon="item.icon" class="text-3xl" />
            <img
              v-else-if="item.img"
              :src="item.img"
              alt=""
              class="w-6 h-6"
            />
          </span>
          {{ item.label }}
        </router-link>
      </div>
    </nav>
  </aside>
</template>

<script setup>
import { useWeatherStore } from '@/stores/weather.store'
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import SurabayaPemda from '@/assets/images/surabaya-pemda.png'
import { Icon } from '@iconify/vue'

// store & route
const weatherStore = useWeatherStore()
const route = useRoute()

// reusable click handler
async function handleLocationClick(lat, lon, locationName) {
  try {
    await weatherStore.fetchWeather()
    localStorage.setItem(
      'selectedLocation',
      JSON.stringify({ name: locationName, lat, lon })
    )
  } catch (error) {
    console.error('Error fetching weather data:', error)
  }
}

// array nav items
const navItems = [
  {
    label: 'Dashboard',
    route: '/',
    icon: 'mdi:home',
  },
  {
    label: 'Pemerintah Kota',
    route: '/pemerintah-kota',
    img: SurabayaPemda,
    onClick: () => handleLocationClick(-7.2575, 112.7521, 'Pemerintah Kota'),
  },
  {
    label: 'Dinas PU',
    route: '/dinas-pekerjaan-umum',
    img: SurabayaPemda,
    onClick: () => handleLocationClick(-7.25, 112.75, 'Dinas PU'),
  },
  {
    label: 'Devices',
    route: '/devices',
    icon: 'mdi:water-boiler',
    onClick: () => handleLocationClick(-7.24, 112.74, 'Devices'),
  },
  // {
  //   label: 'Settings',
  //   route: '/settings',
  //   icon: 'mdi:settings',
  //   wrapperClass: 'mt-auto pt-20', // untuk fixed di bawah
  // },
]

// check active route
const isActive = (routePath) => route.path === routePath

// initial load
onMounted(async () => {
  const storedLocation = localStorage.getItem('selectedLocation')
  if (storedLocation) {
    const { lat, lon, name } = JSON.parse(storedLocation)
    await handleLocationClick(lat, lon, name)
  } else {
    const defaultLocation = navItems.find((item) => item.onClick)
    if (defaultLocation) {
      await defaultLocation.onClick()
    }
  }
})
</script>
