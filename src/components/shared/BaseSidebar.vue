<template>
  <aside class="text-gray-800 w-72 shadow-md bg-[#E7ECEF] pt-6">
    <nav class="space-y-1 flex flex-col h-full px-2">
      <!-- Loop nav items -->
      <div v-for="(item, index) in navItems" :key="index" :class="item.wrapperClass || ''">
        <router-link
          :to="item.route"
          @click="item.onClick ? item.onClick() : null"
          class="flex items-center p-3 pl-5 rounded-lg transition-all duration-200"
          :class="getItemClasses(item)"
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
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
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

// array nav items - SESUAIKAN dengan router yang sebenarnya
const navItems = [
  {
    label: 'Dashboard',
    route: '/',
    icon: 'mdi:home',
  },
  {
    label: 'Lokasi',
    route: '/pemerintah-kota',
    icon: 'mdi:location-radius',
  },
  {
    label: 'Laporan',
    route: '/dinas-pekerjaan-umum',
    icon: 'mdi:report-areaspline',
  },
  {
    label: 'Perangkat',
    route: '/device',
    icon: 'mdi:water-boiler',
  },
  // {
  //   label: 'Settings',
  //   route: '/settings',
  //   icon: 'mdi:settings',
  //   wrapperClass: 'mt-auto pt-20', // untuk fixed di bawah
  // },
]

// Get current path untuk active state detection (sama seperti contoh yang benar)
const currentPath = computed(() => route.path)

// Check if item is active (menggunakan logika yang sama dengan contoh yang benar)
const isItemActive = (item) => {
  if (!item.route) return false

  // Exact match untuk root path
  if (item.route === '/' && currentPath.value === '/') {
    return true
  }

  // Untuk path selain root, gunakan startsWith
  if (item.route !== '/' && item.route !== '#') {
    return currentPath.value.startsWith(item.route)
  }

  return false
}

// Classes untuk item (menggunakan pola yang sama dengan contoh yang benar)
const getItemClasses = (item) => {
  const isActive = isItemActive(item)
  return {
    'bg-[#274C77] text-white': isActive,
    'text-gray-700 hover:bg-gray-100': !isActive
  }
}

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
