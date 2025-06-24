<script setup>
import BaseLayout from '@/layouts/BaseLayout.vue'
import BaseCard from '@/components/BaseCard.vue'
import { LMap, LTileLayer, LMarker, LPopup } from '@vue-leaflet/vue-leaflet'
import 'leaflet/dist/leaflet.css'
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useLocationStore } from '@/stores/locationStore'
import { useFloodSocket } from '@/composables/useFloodSocket.js'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl

// Atur ulang path ikon dengan yang sudah di-resolve
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

// Custom icons untuk different status dengan pulse animation
const normalIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'normal-marker'
})

const warningIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 41" width="25" height="41">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 19.9 12.5 41 12.5 41S25 19.9 25 12.5C25 5.6 19.4 0 12.5 0Z" fill="#FF9500"/>
      <circle cx="12.5" cy="12.5" r="8" fill="white"/>
      <text x="12.5" y="17" text-anchor="middle" font-family="Arial" font-size="12" fill="#FF9500" font-weight="bold">!</text>
    </svg>
  `),
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'warning-marker'
})

const dangerIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 41" width="25" height="41">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 19.9 12.5 41 12.5 41S25 19.9 25 12.5C25 5.6 19.4 0 12.5 0Z" fill="#FF3B30"/>
      <circle cx="12.5" cy="12.5" r="8" fill="white"/>
      <text x="12.5" y="17" text-anchor="middle" font-family="Arial" font-size="12" fill="#FF3B30" font-weight="bold">X</text>
    </svg>
  `),
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'danger-marker'
})

// Pulsing icons for recently updated locations
const pulsingWarningIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 41" width="25" height="41">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 19.9 12.5 41 12.5 41S25 19.9 25 12.5C25 5.6 19.4 0 12.5 0Z" fill="#FF9500" filter="url(#glow)"/>
      <circle cx="12.5" cy="12.5" r="8" fill="white"/>
      <text x="12.5" y="17" text-anchor="middle" font-family="Arial" font-size="12" fill="#FF9500" font-weight="bold">!</text>
    </svg>
  `),
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'warning-marker pulsing-marker'
})

const pulsingDangerIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 41" width="25" height="41">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 19.9 12.5 41 12.5 41S25 19.9 25 12.5C25 5.6 19.4 0 12.5 0Z" fill="#FF3B30" filter="url(#glow)"/>
      <circle cx="12.5" cy="12.5" r="8" fill="white"/>
      <text x="12.5" y="17" text-anchor="middle" font-family="Arial" font-size="12" fill="#FF3B30" font-weight="bold">X</text>
    </svg>
  `),
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'danger-marker pulsing-marker'
})

// Function to get icon based on status
const getIconByStatus = (status, isRecentlyUpdated = false) => {
  // Convert API status to component status
  const normalizedStatus = normalizeStatus(status)

  if (isRecentlyUpdated) {
    switch (normalizedStatus) {
      case 'warning':
        return pulsingWarningIcon
      case 'danger':
        return pulsingDangerIcon
      default:
        return normalIcon
    }
  }

  switch (normalizedStatus) {
    case 'normal':
      return normalIcon
    case 'warning':
      return warningIcon
    case 'danger':
      return dangerIcon
    default:
      return normalIcon
  }
}

// Function to normalize API status to component status
const normalizeStatus = (apiStatus) => {
  if (!apiStatus) return 'normal'

  const status = apiStatus.toLowerCase()
  switch (status) {
    case 'aman':
      return 'normal'
    case 'waspada':
    case 'siaga':
      return 'warning'
    case 'bahaya':
      return 'danger'
    default:
      return 'normal'
  }
}

// Function to get status color
const getStatusColor = (status) => {
  const normalizedStatus = normalizeStatus(status)

  switch (normalizedStatus) {
    case 'normal':
      return 'text-green-600'
    case 'warning':
      return 'text-orange-600'
    case 'danger':
      return 'text-red-600'
    default:
      return 'text-gray-600'
  }
}

// Function to get status text
const getStatusText = (status) => {
  if (!status) return 'Tidak Diketahui'

  const apiStatus = status.toUpperCase()
  switch (apiStatus) {
    case 'AMAN':
      return 'Aman'
    case 'WASPADA':
      return 'Waspada'
    case 'SIAGA':
      return 'Siaga'
    case 'BAHAYA':
      return 'Bahaya'
    default:
      return status
  }
}

const center = ref([-7.250445, 112.768845]) // Koordinat Surabaya
const globalSearchQuery = ref('')
const globalSearchResults = ref([])
const isGlobalSearching = ref(false)
const showGlobalResults = ref(false)
const mapRef = ref(null)

const searchLocationMarker = ref(null)
const locationsStore = useLocationStore()

// Initialize composables for real-time data
const floodSocket = useFloodSocket()

// Real-time indicators
const isMapDataUpdating = ref(false)
const recentlyUpdatedLocationIds = ref(new Set())

// Create location modal
const showCreateModal = ref(false)
const isGeocodingLoading = ref(false)
const newLocationForm = ref({
  name: '',
  address: '',
  district: '',
  city: '',
  province: '',
  latitude: 0,
  longitude: 0,
  amanMax: 79,
  waspadaMin: 80,
  waspadaMax: 149,
  siagaMin: 150,
  siagaMax: 199,
  bahayaMin: 200
})

// Visual feedback functions
const showMapDataUpdate = () => {
  isMapDataUpdating.value = true
  setTimeout(() => {
    isMapDataUpdating.value = false
  }, 2000)
}

const markLocationAsRecentlyUpdated = (locationId) => {
  recentlyUpdatedLocationIds.value.add(locationId)
  setTimeout(() => {
    recentlyUpdatedLocationIds.value.delete(locationId)
  }, 5000) // Remove after 5 seconds
}

// Check if location was recently updated
const isLocationRecentlyUpdated = (locationId) => {
  return recentlyUpdatedLocationIds.value.has(locationId)
}

// Computed untuk menggabungkan data dari store dan composables
const combinedLocations = computed(() => {
  const floodLocations = floodSocket.floodLocations.value || []
  const storeLocations = locationsStore.locations || []

  // Base: gunakan semua lokasi dari store
  const result = [...storeLocations]

  // Update dengan data real-time dari flood socket jika ada
  if (floodLocations.length > 0) {
    floodLocations.forEach(floodLoc => {
      // Cari index lokasi yang sesuai di result
      const existingIndex = result.findIndex(loc =>
        loc.id === floodLoc.id ||
        loc.name === floodLoc.name ||
        (Math.abs(Number(loc.latitude) - Number(floodLoc.latitude)) < 0.0001 &&
         Math.abs(Number(loc.longitude) - Number(floodLoc.longitude)) < 0.0001)
      )

      if (existingIndex !== -1) {
        // Update lokasi yang sudah ada dengan data real-time
        result[existingIndex] = {
          ...result[existingIndex],
          ...floodLoc,
          // Pastikan field yang diperlukan ada
          currentStatus: floodLoc.currentStatus || floodLoc.status || result[existingIndex].currentStatus,
          currentWaterLevel: floodLoc.currentWaterLevel || floodLoc.waterLevel || result[existingIndex].currentWaterLevel,
          currentRainfall: floodLoc.currentRainfall || floodLoc.rainfall || result[existingIndex].currentRainfall,
          lastUpdate: floodLoc.lastUpdate || floodLoc.updatedAt || result[existingIndex].lastUpdate || result[existingIndex].updatedAt
        }
      } else {
        // Tambah lokasi baru jika tidak ditemukan (lokasi baru dari real-time)
        result.push({
          ...floodLoc,
          currentStatus: floodLoc.currentStatus || floodLoc.status,
          currentWaterLevel: floodLoc.currentWaterLevel || floodLoc.waterLevel,
          currentRainfall: floodLoc.currentRainfall || floodLoc.rainfall,
          lastUpdate: floodLoc.lastUpdate || floodLoc.updatedAt
        })
      }
    })
  }

  return result
})

// Computed untuk menghitung jumlah lokasi berdasarkan status (menggunakan combined data)
const locationStats = computed(() => {
  const stats = {
    aman: 0,
    waspada: 0,
    siaga: 0,
    bahaya: 0,
    total: 0
  }

  combinedLocations.value.forEach(location => {
    const status = (location.currentStatus || location.status || 'AMAN').toUpperCase()

    switch (status) {
      case 'AMAN':
        stats.aman++
        break
      case 'WASPADA':
        stats.waspada++
        break
      case 'SIAGA':
        stats.siaga++
        break
      case 'BAHAYA':
        stats.bahaya++
        break
      default:
        stats.aman++ // Default ke aman jika status tidak dikenali
        break
    }
    stats.total++
  })

  return stats
})

// Watch for flood data changes from composables
watch(() => floodSocket.floodLocations.value, (newLocations, oldLocations) => {
  if (newLocations && newLocations.length > 0) {
    console.log('🗺️ Flood locations updated in maps:', newLocations.length)
    showMapDataUpdate()

    // Mark updated locations
    if (oldLocations) {
      newLocations.forEach(newLoc => {
        const oldLoc = oldLocations.find(old => old.id === newLoc.id)
        if (!oldLoc ||
            oldLoc.currentStatus !== newLoc.currentStatus ||
            oldLoc.currentWaterLevel !== newLoc.currentWaterLevel) {
          markLocationAsRecentlyUpdated(newLoc.id)
        }
      })
    }
  }
}, { deep: true, immediate: true })

// Watch for recently updated locations
watch(() => floodSocket.recentlyUpdatedLocations.value, (newUpdates) => {
  if (newUpdates.length > 0) {
    console.log('🗺️ Recently updated locations:', newUpdates.length)
    showMapDataUpdate()

    // Mark these locations as recently updated
    newUpdates.forEach(location => {
      markLocationAsRecentlyUpdated(location.id)
    })
  }
})

// Watch for flood notifications
watch(() => floodSocket.notifications.value, (newNotifications, oldNotifications) => {
  if (newNotifications.length > (oldNotifications?.length || 0)) {
    const latestNotification = newNotifications[0]
    console.log('🗺️ New flood notification:', latestNotification)

    if (['new_flood_location', 'location_status_change'].includes(latestNotification.type)) {
      showMapDataUpdate()

      // If notification has location info, mark it as updated
      if (latestNotification.locationId) {
        markLocationAsRecentlyUpdated(latestNotification.locationId)
      }
    }
  }
}, { deep: true })

// Watch for flood summary changes
watch(() => floodSocket.floodSummary.value, (newSummary) => {
  if (newSummary) {
    console.log('🗺️ Flood summary updated:', newSummary)
    showMapDataUpdate()
  }
}, { deep: true })

// Reverse geocoding function using OpenStreetMap Nominatim
const reverseGeocode = async (lat, lng) => {
  try {
    isGeocodingLoading.value = true
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=id`
    )

    if (!response.ok) {
      throw new Error('Geocoding failed')
    }

    const data = await response.json()

    if (data && data.address) {
      const address = data.address
      console.log("data dari reverse : ", address)

      return {
        address: data.display_name || '',
        district: address.city_district || address.municipality,
        city: address.city,
        province: address.state,
      }
    }

    return {
      address: '',
      district: '',
      city: '',
      province: 'Jawa Timur'
    }
  } catch (error) {
    return {
      address: '',
      district: '',
      city: '',
      province: 'Jawa Timur'
    }
  } finally {
    isGeocodingLoading.value = false
  }
}

// Global search functions
const searchGlobalLocation = async (query) => {
  if (!query.trim() || query.length < 3) {
    globalSearchResults.value = []
    showGlobalResults.value = false
    return
  }

  try {
    isGlobalSearching.value = true

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&accept-language=id,en`
    )

    if (!response.ok) {
      throw new Error('Search failed')
    }

    const results = await response.json()

    globalSearchResults.value = results.map(result => ({
      id: result.place_id,
      name: result.display_name,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      type: result.type,
      importance: result.importance
    }))

    showGlobalResults.value = true

  } catch (error) {
    console.error('Global search error:', error)
    globalSearchResults.value = []
    showGlobalResults.value = false
  } finally {
    isGlobalSearching.value = false
  }
}

// Handle global search input with debounce
let globalSearchTimeout = null
const handleGlobalSearchInput = () => {
  clearTimeout(globalSearchTimeout)
  globalSearchTimeout = setTimeout(() => {
    searchGlobalLocation(globalSearchQuery.value)
  }, 300) // 300ms debounce
}

// Handle result click (simplified)
const handleResultClick = (result) => {
  try {
    selectGlobalLocation(result)
  } catch (error) {
    console.error('❌ Error in selectGlobalLocation:', error)
    throw error
  }
}

// Select global search result
const selectGlobalLocation = (location) => {
  // Move map to selected location
  center.value = [location.lat, location.lng]

  // Update search input
  globalSearchQuery.value = location.name

  // Hide results
  showGlobalResults.value = false

  searchLocationMarker.value = {
    lat: location.lat,
    lng: location.lng,
    name: location.name,
    type: location.type,
    timestamp: Date.now()
  }

  // If there's a map ref, fly to the location with animation
  if (mapRef.value && mapRef.value.leafletObject) {
    mapRef.value.leafletObject.flyTo([location.lat, location.lng], 20, {
      duration: 1.5
    })
  }
}

// Clear global search
const clearGlobalSearch = () => {
  globalSearchQuery.value = ''
  globalSearchResults.value = []
  showGlobalResults.value = false
}

// Load initial data
const loadInitialData = async () => {
  try {
    console.log('🗺️ Loading initial map data...')

    // Load locations from store as fallback
    await locationsStore.getAllLocations()

    // Composables will handle their own initialization
    console.log('🗺️ Initial map data loaded')
  } catch (error) {
    console.error('❌ Error loading initial map data:', error)
  }
}

// Load initial locations
onMounted(async () => {
  await loadInitialData()
})

onUnmounted(() => {
  // Composables will handle their own cleanup
  console.log('🗺️ Maps component unmounted')
})

// Handle map click to create new location
const handleMapClick = async (event) => {
  const { lat, lng } = event.latlng

  // Set coordinates immediately
  newLocationForm.value.latitude = lat
  newLocationForm.value.longitude = lng

  // Show modal
  showCreateModal.value = true

  // Reset form except coordinates
  newLocationForm.value.name = ''
  newLocationForm.value.address = ''
  newLocationForm.value.district = ''
  newLocationForm.value.city = ''
  newLocationForm.value.province = ''

  // Get location details via reverse geocoding
  const locationDetails = await reverseGeocode(lat, lng)

  console.log("lokasi yang di dapatkan : ", locationDetails)

  // Fill form with geocoded data
  newLocationForm.value.address = locationDetails.address
  newLocationForm.value.district = locationDetails.district
  newLocationForm.value.city = locationDetails.city
  newLocationForm.value.province = locationDetails.province
}

// Create new location
const createNewLocation = async () => {
  if (!newLocationForm.value.name.trim()) {
    alert('Nama lokasi harus diisi!')
    return
  }

  try {
    await locationsStore.createLocation({
      ...newLocationForm.value
    })

    // Close modal and reset
    showCreateModal.value = false
    resetForm()

    // Refresh locations data
    await locationsStore.getAllLocations()

  } catch (error) {
    console.error('Error creating location:', error)
    alert('Gagal menyimpan lokasi. Silakan coba lagi.')
  }
}

// Cancel create location
const cancelCreate = () => {
  showCreateModal.value = false
  resetForm()
}

// Reset form
const resetForm = () => {
  newLocationForm.value = {
    name: '',
    address: '',
    district: '',
    city: '',
    province: '',
    latitude: 0,
    longitude: 0,
    amanMax: 79,
    waspadaMin: 80,
    waspadaMax: 149,
    siagaMin: 150,
    siagaMax: 199,
    bahayaMin: 200
  }
}
</script>

<template>
  <BaseLayout>
    <div class="w-full flex flex-col items-center">
      <BaseCard title="Peta Lokasi" customClass="mb-4 w-full">
        <div class="flex justify-between items-start">
          <p class="text-gray-600 font-bold">Peta Real-time Titik Lokasi Banjir</p>

          <!-- Real-time indicator -->
          <div v-if="isMapDataUpdating" class="flex items-center gap-2 text-blue-600 text-sm">
            <div class="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <span>Memperbarui data...</span>
          </div>
        </div>

        <!-- Stats -->
        <div class="mt-3 flex gap-4 text-sm">
          <span class="flex items-center gap-1">
            <div class="w-3 h-3 bg-green-500 rounded-full"></div>
            Aman: {{ locationStats.aman }}
          </span>
          <span class="flex items-center gap-1">
            <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
            Waspada: {{ locationStats.waspada }}
          </span>
          <span class="flex items-center gap-1">
            <div class="w-3 h-3 bg-orange-500 rounded-full"></div>
            Siaga: {{ locationStats.siaga }}
          </span>
          <span class="flex items-center gap-1">
            <div class="w-3 h-3 bg-red-500 rounded-full"></div>
            Bahaya: {{ locationStats.bahaya }}
          </span>
          <span class="text-gray-600">
            Total: {{ locationStats.total }}
          </span>
        </div>

        <!-- Global Location Search -->
        <div class="mt-4 relative">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            🌍 Cari Lokasi
          </label>
          <div class="flex gap-2">
            <div class="flex-1 relative">
              <input v-model="globalSearchQuery" type="text"
                placeholder="Cari alamat, kota, atau tempat di seluruh dunia..."
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                @input="handleGlobalSearchInput"
                @focus="() => globalSearchQuery.length >= 3 && (showGlobalResults = true)" />

              <!-- Loading indicator -->
              <div v-if="isGlobalSearching" class="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div class="animate-spin w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full"></div>
              </div>

              <!-- Search results dropdown -->
              <div v-if="showGlobalResults && globalSearchResults.length > 0"
                class="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                <div v-for="result in globalSearchResults" :key="result.id"
                  class="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                  @mousedown.prevent.stop="handleResultClick(result)">
                  <div class="font-medium text-sm text-gray-900 truncate">
                    {{ result.name }}
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ result.type }} • {{ result.lat.toFixed(4) }}, {{ result.lng.toFixed(4) }}
                  </div>
                </div>
              </div>

              <!-- No results message -->
              <div
                v-if="showGlobalResults && globalSearchResults.length === 0 && !isGlobalSearching && globalSearchQuery.length >= 3"
                class="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 p-3">
                <div class="text-sm text-gray-500 text-center">
                  Tidak ada hasil ditemukan untuk "{{ globalSearchQuery }}"
                </div>
              </div>
            </div>

            <button @click="clearGlobalSearch" :disabled="isGlobalSearching"
              class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50">
              Clear
            </button>

            <button v-if="showGlobalResults" @click="showGlobalResults = false"
              class="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500">
              ✕
            </button>
          </div>
        </div>

        <!-- Loading indicator -->
        <div v-if="locationsStore.isLoading" class="mt-2 text-blue-600 text-sm">
          Memuat data lokasi...
        </div>

        <!-- Error message -->
        <div v-if="locationsStore.error" class="mt-2 text-red-600 text-sm">
          {{ locationsStore.error }}
        </div>

        <!-- Info -->
        <div class="mt-2 text-blue-600 text-sm">
          💡 Tip: Klik pada peta untuk menambah lokasi baru
        </div>
      </BaseCard>

      <div class="w-full h-screen">
        <LMap ref="mapRef" :zoom="13" :center="center" class="h-full w-full" @click="handleMapClick">
          <LTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          <!-- Display markers for flood locations using combined data -->
          <LMarker v-for="location in combinedLocations" :key="`marker-${location.id}-${location.lastUpdate}`"
            v-show="!isNaN(Number(location.latitude)) && !isNaN(Number(location.longitude))"
            :lat-lng="[Number(location.latitude), Number(location.longitude)]"
            :icon="getIconByStatus(location.currentStatus || location.status, isLocationRecentlyUpdated(location.id))">
            <LPopup>
              <div class="min-w-48">
                <div class="flex justify-between items-start mb-2">
                  <h3 class="font-bold text-lg">{{ location.name }}</h3>
                  <div v-if="isLocationRecentlyUpdated(location.id)"
                       class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full animate-pulse">
                    Baru Update
                  </div>
                </div>
                <p class="text-sm text-gray-600 mb-2">{{ location.address || 'Alamat tidak tersedia' }}</p>
                <p class="text-sm text-gray-600 mb-2">{{ location.district || '-' }}, {{ location.city || '-' }}</p>
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-xs text-gray-500">Status:</span>
                  <span :class="['text-sm font-semibold', getStatusColor(location.currentStatus || location.status)]">
                    {{ getStatusText(location.currentStatus || location.status) }}
                  </span>
                </div>
                <div class="text-xs text-gray-400 mb-1">
                  <p>Tinggi Air: {{ location.currentWaterLevel || location.waterLevel || 0 }}cm</p>
                  <p>Curah Hujan: {{ location.currentRainfall || location.rainfall || 0 }}mm</p>
                </div>
                <p class="text-xs text-gray-400">
                  Koordinat: {{ Number(location.latitude).toFixed(4) }}, {{ Number(location.longitude).toFixed(4) }}
                </p>
                <p class="text-xs text-gray-400">
                  Update Terakhir: {{ new Date(location.lastUpdate || location.updatedAt).toLocaleString('id-ID') }}
                </p>

                <!-- Real-time status indicator -->
                <div v-if="floodSocket.isConnected.value" class="mt-2 text-xs text-green-600 flex items-center gap-1">
                  <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Real-time monitoring aktif
                </div>
              </div>
            </LPopup>
          </LMarker>

          <!-- Search result marker (default Leaflet marker) -->
          <template v-if="searchLocationMarker">
            <LMarker :key="`search-marker-${searchLocationMarker.timestamp}`"
              :lat-lng="[Number(searchLocationMarker.lat), Number(searchLocationMarker.lng)]">
              <LPopup>
                <div class="min-w-48">
                  <h3 class="font-bold text-lg mb-2 text-blue-600">🔍 {{ searchLocationMarker.name }}</h3>
                  <p class="text-sm text-gray-600 mb-2">Hasil pencarian lokasi global</p>
                  <p class="text-xs text-gray-500 mb-2">Tipe: {{ searchLocationMarker.type || 'Lokasi' }}</p>
                  <p class="text-xs text-gray-400 mb-2">
                    Koordinat: {{ Number(searchLocationMarker.lat).toFixed(4) }}, {{
                      Number(searchLocationMarker.lng).toFixed(4) }}
                  </p>
                  <div class="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
                    💡 Klik pada peta di lokasi ini untuk menambah titik monitoring banjir
                  </div>
                  <div class="mt-2 text-xs text-gray-400">
                    Marker ini akan hilang otomatis dalam 30 detik
                  </div>
                  <button @click="searchLocationMarker = null"
                    class="mt-2 px-2 py-1 bg-red-500 text-white rounded text-xs">
                    Hapus Marker
                  </button>
                  <button
                    @click="handleMapClick({ latlng: { lat: searchLocationMarker.lat, lng: searchLocationMarker.lng } })"
                    class="mt-2 ml-2 px-2 py-1 bg-blue-500 text-white rounded text-xs">
                    Tambah Lokasi ini
                  </button>
                </div>
              </LPopup>
            </LMarker>
          </template>
        </LMap>
      </div>

      <!-- Create Location Modal (same as before) -->
      <div v-if="showCreateModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999]"
        @click.self="cancelCreate">
        <div class="bg-white rounded-lg p-6 w-96 max-w-[90vw] max-h-[90vh] overflow-y-auto">
          <h2 class="text-xl font-bold mb-4">Tambah Lokasi Baru</h2>

          <!-- Loading indicator for geocoding -->
          <div v-if="isGeocodingLoading" class="mb-4 text-blue-600 text-sm flex items-center gap-2">
            <div class="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            Mendapatkan informasi lokasi...
          </div>

          <div class="mb-4">
            <p class="text-sm text-gray-600 mb-2">
              Koordinat: {{ newLocationForm.latitude.toFixed(6) }}, {{ newLocationForm.longitude.toFixed(6) }}
            </p>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Nama Lokasi *
              </label>
              <input v-model="newLocationForm.name" type="text" placeholder="Masukkan nama lokasi"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Alamat
              </label>
              <input v-model="newLocationForm.address" type="text" placeholder="Alamat akan terisi otomatis"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Kecamatan
              </label>
              <input v-model="newLocationForm.district" type="text" placeholder="Kecamatan akan terisi otomatis"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Kota/Kabupaten
              </label>
              <input v-model="newLocationForm.city" type="text" placeholder="Kota akan terisi otomatis"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Provinsi
              </label>
              <input v-model="newLocationForm.province" type="text" placeholder="Provinsi akan terisi otomatis"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <!-- Threshold Settings -->
            <div class="pt-4 border-t border-gray-200">
              <h3 class="text-sm font-medium text-gray-700 mb-3">Pengaturan Batas Ketinggian Air (cm)</h3>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs text-gray-600 mb-1">Aman Maksimal</label>
                  <input v-model.number="newLocationForm.amanMax" type="number"
                    class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>

                <div>
                  <label class="block text-xs text-gray-600 mb-1">Waspada Min</label>
                  <input v-model.number="newLocationForm.waspadaMin" type="number"
                    class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>

                <div>
                  <label class="block text-xs text-gray-600 mb-1">Waspada Max</label>
                  <input v-model.number="newLocationForm.waspadaMax" type="number"
                    class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>

                <div>
                  <label class="block text-xs text-gray-600 mb-1">Siaga Min</label>
                  <input v-model.number="newLocationForm.siagaMin" type="number"
                    class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>

                <div>
                  <label class="block text-xs text-gray-600 mb-1">Siaga Max</label>
                  <input v-model.number="newLocationForm.siagaMax" type="number"
                    class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>

                <div>
                  <label class="block text-xs text-gray-600 mb-1">Bahaya Min</label>
                  <input v-model.number="newLocationForm.bahayaMin" type="number"
                    class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>
            </div>
          </div>

          <div class="flex gap-3 mt-6">
            <button @click="createNewLocation"
              :disabled="!newLocationForm.name.trim() || locationsStore.isLoading || isGeocodingLoading"
              class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
              {{ locationsStore.isLoading ? 'Menyimpan...' : 'Simpan' }}
            </button>
            <button @click="cancelCreate" :disabled="locationsStore.isLoading || isGeocodingLoading"
              class="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50">
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  </BaseLayout>
</template>

<style scoped>
/* Custom marker styles */
:deep(.normal-marker) {
  filter: hue-rotate(120deg);
}

:deep(.warning-marker) {
  /* Orange color already applied in SVG */
}

:deep(.danger-marker) {
  /* Red color already applied in SVG */
}

/* Pulsing animation for recently updated markers */
:deep(.pulsing-marker) {
  animation: markerPulse 2s infinite;
}

@keyframes markerPulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
