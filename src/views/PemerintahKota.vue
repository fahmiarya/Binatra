<script setup>
import BaseLayout from '@/layouts/BaseLayout.vue'
import BaseCard from '@/components/BaseCard.vue'
import { LMap, LTileLayer, LMarker, LPopup } from '@vue-leaflet/vue-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { ref, onMounted, computed, watch } from 'vue'
import axios from 'axios'
import { useLocationStore } from '@/stores/locationStore'
import { useFloodSocket } from '@/composables/useFloodSocket.js'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'

const locationsStore = useLocationStore()
const floodSocket = useFloodSocket()

// MENGGUNAKAN FUNCTIONS DARI STORE
const {
  normalizeStatus,
  getStatusColor,
  getStatusText,
  formatDate,
  searchLocation: storeSearchLocation,
  combineWithRealtimeData,
  calculateLocationStats,
  filterValidLocations
} = locationsStore

// Real-time indicators
const isMapDataUpdating = ref(false)
const recentlyUpdatedLocationIds = ref(new Set())

const loadLocations = async () => {
  await locationsStore.fetchAllLocations()
}

const deleteLocation = async (id) => {
  if (confirm('Hapus lokasi ini?')) {
    try {
      await locationsStore.removeLocation(id)
      showSuccessToast('Lokasi berhasil dihapus')
    } catch {
      showErrorToast('Gagal menghapus lokasi')
    }
  }
}

delete L.Icon.Default.prototype._getIconUrl

// Atur ulang path ikon dengan yang sudah di-resolve
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

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

// Function to get icon based on status (menggunakan function dari store)
const getIconByStatus = (status, isRecentlyUpdated = false) => {
  const normalizedStatus = normalizeStatus(status) // DARI STORE

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

// Visual feedback functions (tetap di component)
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
  }, 5000)
}

// Check if location was recently updated
const isLocationRecentlyUpdated = (locationId) => {
  return recentlyUpdatedLocationIds.value.has(locationId) ||
         floodSocket.recentlyUpdatedLocations.value.includes(locationId)
}

// COMPUTED MENGGUNAKAN FUNCTIONS DARI STORE
const combinedLocations = computed(() => {
  return combineWithRealtimeData(floodSocket.floodLocations.value)
})

const locationStats = computed(() => {
  return calculateLocationStats(combinedLocations.value)
})

const center = [-7.2575, 112.7521] // Koordinat Surabaya
const newMarker = ref(null)
const formVisible = ref(false)
const loading = ref(false)

axios.defaults.baseURL = import.meta.env.VITE_API_URL

const onMapReady = () => {
  const legend = L.control({ position: 'bottomright' })

  legend.onAdd = function () {
    const div = L.DomUtil.create('div', 'info legend')

    // Create SVG for warning marker
    const warningSvg = 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 41" width="25" height="41">
        <path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 19.9 12.5 41 12.5 41S25 19.9 25 12.5C25 5.6 19.4 0 12.5 0Z" fill="#FF9500"/>
        <circle cx="12.5" cy="12.5" r="8" fill="white"/>
        <text x="12.5" y="17" text-anchor="middle" font-family="Arial" font-size="12" fill="#FF9500" font-weight="bold">!</text>
      </svg>
    `)

    // Create SVG for danger marker
    const dangerSvg = 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 41" width="25" height="41">
        <path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 19.9 12.5 41 12.5 41S25 19.9 25 12.5C25 5.6 19.4 0 12.5 0Z" fill="#FF3B30"/>
        <circle cx="12.5" cy="12.5" r="8" fill="white"/>
        <text x="12.5" y="17" text-anchor="middle" font-family="Arial" font-size="12" fill="#FF3B30" font-weight="bold">X</text>
      </svg>
    `)

    div.innerHTML = `
          <h4>Keterangan Marker</h4>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <img src="https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png" width="15" style="vertical-align: middle;">
            <span>Aman</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <img src="${warningSvg}" width="15" style="vertical-align: middle;">
            <span>Waspada / Siaga</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <img src="${dangerSvg}" width="15" style="vertical-align: middle;">
            <span>Bahaya</span>
          </div>
        `;

    return div
  }

  if (mapRef.value?.leafletObject) {
    legend.addTo(mapRef.value.leafletObject)
  }
}

const form = ref({
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
  bahayaMin: 200,
})

const searchQuery = ref('')
const searchResults = ref([])
const isSearching = ref(false)
const mapRef = ref(null)

// SEARCH LOCATION MENGGUNAKAN FUNCTION DARI STORE
const searchLocation = async () => {
  if (searchQuery.value.trim().length < 3) {
    searchResults.value = []
    return
  }

  isSearching.value = true
  try {
    searchResults.value = await storeSearchLocation(searchQuery.value) // DARI STORE
  } catch (error) {
    console.error('Error searching location:', error)
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

const pickSearchedLocation = (item) => {
  center[0] = item.lat
  center[1] = item.lon
  newMarker.value = [item.lat, item.lon]
  formVisible.value = true
  resetForm()
  form.value.latitude = item.lat
  form.value.longitude = item.lon
  form.value.address = item.name

  locationsStore.reverseGeocode(item.lat, item.lon).then((geo) => {
    form.value.district = geo.district
    form.value.city = geo.city
    form.value.province = geo.province
  })

  if (mapRef.value?.leafletObject) {
    mapRef.value.leafletObject.flyTo([item.lat, item.lon], 18, {
      duration: 1.5,
    })
  }

  searchResults.value = []
  searchQuery.value = ''
}

const searchKeyword = ref('')

// VALID LOCATIONS MENGGUNAKAN FUNCTION DARI STORE
const validLocations = computed(() =>
  filterValidLocations(combinedLocations.value, searchKeyword.value)
)

const editLocation = (loc) => {
  formVisible.value = true
  form.value = { ...loc }
  newMarker.value = [loc.latitude, loc.longitude]
}

const handleMapClick = async (e) => {
  const { lat, lng } = e.latlng
  newMarker.value = [lat, lng]
  formVisible.value = true
  resetForm()
  form.value.latitude = lat
  form.value.longitude = lng

  const geo = await locationsStore.reverseGeocode(lat, lng)
  form.value.address = geo.address
  form.value.district = geo.district
  form.value.city = geo.city
  form.value.province = geo.province
}

const resetForm = () => {
  form.value = {
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
    bahayaMin: 200,
  }
}

const submitForm = async () => {
  loading.value = true
  try {
    if (form.value.id) {
      await locationsStore.updateLocation(form.value.id, form.value)
      showSuccessToast('Lokasi berhasil diperbarui')
    } else {
      await locationsStore.createLocation(form.value)
      showSuccessToast('Lokasi berhasil ditambahkan')
    }
    formVisible.value = false
    newMarker.value = null

    // Refresh flood data setelah update
    floodSocket.refreshFloodData()
  } catch {
    showErrorToast('Gagal menyimpan lokasi')
  } finally {
    loading.value = false
  }
}

const showSuccessToast = (msg) => {
  toast.success(msg, { autoClose: 3000, position: 'top-right' })
}

const showErrorToast = (msg) => {
  toast.error(msg, { autoClose: 3000, position: 'top-right' })
}

const batalForm = () => {
  formVisible.value = false
  newMarker.value = null
}

let debounceTimer;

// Watch for flood data changes from composables (REALTIME WATCHERS)
watch(() => floodSocket.floodLocations.value, (newLocations, oldLocations) => {
  if (newLocations && newLocations.length > 0) {
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

// Watch for recently updated locations from flood socket
watch(() => floodSocket.recentlyUpdatedLocations.value, (newUpdates) => {
  if (newUpdates && newUpdates.length > 0) {
    showMapDataUpdate()

    // Mark these locations as recently updated
    newUpdates.forEach(locationId => {
      markLocationAsRecentlyUpdated(locationId)
    })
  }
})

// Watch for flood notifications
watch(() => floodSocket.notifications.value, (newNotifications, oldNotifications) => {
  if (newNotifications && newNotifications.length > (oldNotifications?.length || 0)) {
    const latestNotification = newNotifications[0]

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
    showMapDataUpdate()
  }
}, { deep: true })

watch(searchQuery, (newVal) => {
  clearTimeout(debounceTimer)

  if (newVal.trim().length < 3) {
    searchResults.value = []
    return
  }

  debounceTimer = window.setTimeout(() => {
    searchLocation()
  }, 500)
})

// Load initial data
const loadInitialData = async () => {
  try {
    await loadLocations()
  } catch (error) {
    console.error('❌ Error loading initial map data:', error)
  }
}

onMounted(async () => {
  await loadInitialData()
})
</script>

<template>
  <BaseLayout>
    <div class="w-full flex flex-col items-center">
      <div class="w-full mb-4 relative z-20">
        <BaseCard title="Peta Real-time Titik Lokasi Banjir" customClass="w-full">
          <div class="flex justify-between items-start">
            <!-- Real-time indicator -->
            <div v-if="isMapDataUpdating" class="flex items-center gap-2 text-blue-600 text-sm">
              <div class="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <span>Memperbarui data...</span>
            </div>
          </div>

          <!-- Stats Real-time menggunakan computed dari store -->
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

          <div class="relative w-full mt-4">
            <input
              v-model="searchQuery"
              placeholder="Cari lokasi, contoh: Surabaya, Bandung..."
              class="border px-3 py-1 w-full"
            />

            <!-- Suggestion list menggunakan search dari store -->
            <div
              v-if="searchResults.length"
              class="absolute top-full left-0 right-0 border bg-white max-h-48 overflow-auto z-50 shadow"
            >
              <div
                v-for="result in searchResults"
                :key="result.lat + result.lon"
                @click="pickSearchedLocation(result)"
                class="p-2 hover:bg-gray-100 cursor-pointer text-sm"
              >
                {{ result.name }}
              </div>
            </div>
          </div>

          <!-- Loading indicator -->
          <div v-if="locationsStore.isLoading || floodSocket.loading.value" class="mt-2 text-blue-600 text-sm">
            Memuat data lokasi...
          </div>

          <!-- Error message -->
          <div v-if="locationsStore.error" class="mt-2 text-red-600 text-sm">
            {{ locationsStore.error }}
          </div>

          <div class="mt-3 p-3 bg-blue-50 border border-blue-300 text-blue-800 rounded text-sm">
            ℹ️ Klik pada peta untuk menambah lokasi baru. Anda juga bisa mencari lokasi lewat kolom
            pencarian di atas.
          </div>
        </BaseCard>
      </div>
      <div class="w-full h-screen relative z-0">
        <LMap
          ref="mapRef"
          :zoom="13"
          :center="center"
          class="h-full w-full"
          @ready="onMapReady"
          @click="handleMapClick"
        >
          <LTileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap contributors"
          />

          <!-- Marker lokasi dengan validLocations dari store -->
          <LMarker
            v-for="loc in validLocations"
            :key="`marker-${loc.id}-${loc.lastUpdate || loc.updatedAt}`"
            :lat-lng="[Number(loc.latitude), Number(loc.longitude)]"
            :icon="getIconByStatus(loc.currentStatus || loc.status, isLocationRecentlyUpdated(loc.id))"
          >
            <LPopup>
              <div class="text-sm space-y-1 min-w-48">
                <div class="flex justify-between items-start mb-2">
                  <h3 class="font-bold text-base mb-1">{{ loc.name }}</h3>
                  <div v-if="isLocationRecentlyUpdated(loc.id)"
                       class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full animate-pulse">
                    Baru Update
                  </div>
                </div>
                <p>{{ loc.address }}</p>
                <p>{{ loc.district }}, {{ loc.city }}</p>

                <!-- Status menggunakan functions dari store -->
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-xs text-gray-500">Status:</span>
                  <span :class="['text-sm font-semibold', getStatusColor(loc.currentStatus || loc.status)]">
                    {{ getStatusText(loc.currentStatus || loc.status) }}
                  </span>
                </div>

                <div class="text-xs text-gray-400 mb-1">
                  <p>Tinggi Air: {{ loc.currentWaterLevel || loc.waterLevel || 0 }} cm</p>
                  <p>Curah Hujan: {{ loc.currentRainfall || loc.rainfall || 0 }} mm</p>
                </div>
                <p class="text-xs text-gray-400">
                  Koordinat: {{ Number(loc.latitude).toFixed(4) }}, {{ Number(loc.longitude).toFixed(4) }}
                </p>

                <!-- Date formatting menggunakan function dari store -->
                <p class="text-xs text-gray-400">
                  Update Terakhir: {{ formatDate(loc.lastUpdate || loc.updatedAt) }}
                </p>

                <!-- Real-time status indicator -->
                <div v-if="floodSocket.isConnected()" class="mt-2 text-xs text-green-600 flex items-center gap-1">
                  <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Real-time monitoring aktif
                </div>

                <div class="flex gap-2 mt-2">
                  <button
                    @click="editLocation(loc)"
                    class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Edit
                  </button>
                  <button
                    @click="deleteLocation(loc.id)"
                    class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </LPopup>
          </LMarker>
          <LMarker v-if="newMarker" :lat-lng="newMarker">
            <LPopup> Lokasi baru </LPopup>
          </LMarker>
        </LMap>
      </div>

      <BaseCard v-if="formVisible" title="Tambah Lokasi Baru" customClass="w-full mt-4">
        <div class="grid grid-cols-2 gap-2 mb-4">
          <input v-model="form.name" placeholder="Nama Lokasi" class="border p-2" />
          <input v-model="form.address" placeholder="Alamat" class="border p-2" />
          <input v-model="form.district" placeholder="Kecamatan" class="border p-2" />
          <input v-model="form.city" placeholder="Kota" class="border p-2" />
          <input v-model="form.province" placeholder="Provinsi" class="border p-2" />
        </div>

        <div class="grid grid-cols-3 gap-2 mb-4">
          <div>
            <label class="block text-xs mb-1">Batas Aman Maks</label>
            <input
              v-model.number="form.amanMax"
              placeholder="Aman Max"
              type="number"
              class="border p-2 w-full"
            />
          </div>
          <div>
            <label class="block text-xs mb-1">Batas Waspada Min</label>
            <input
              v-model.number="form.waspadaMin"
              placeholder="Waspada Min"
              type="number"
              class="border p-2 w-full"
            />
          </div>
          <div>
            <label class="block text-xs mb-1">Batas Waspada Maks</label>
            <input
              v-model.number="form.waspadaMax"
              placeholder="Waspada Max"
              type="number"
              class="border p-2 w-full"
            />
          </div>
          <div>
            <label class="block text-xs mb-1">Batas Siaga Min</label>
            <input
              v-model.number="form.siagaMin"
              placeholder="Siaga Min"
              type="number"
              class="border p-2 w-full"
            />
          </div>
          <div>
            <label class="block text-xs mb-1">Batas Siaga Maks</label>
            <input
              v-model.number="form.siagaMax"
              placeholder="Siaga Max"
              type="number"
              class="border p-2 w-full"
            />
          </div>
          <div>
            <label class="block text-xs mb-1">Batas Bahaya Min</label>
            <input
              v-model.number="form.bahayaMin"
              placeholder="Bahaya Min"
              type="number"
              class="border p-2 w-full"
            />
          </div>
        </div>

        <p class="text-sm mb-4">Latitude: {{ form.latitude }}, Longitude: {{ form.longitude }}</p>
        <div class="flex justify-between items-center mt-4">
          <button
            @click="batalForm"
            class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Batal
          </button>

          <button
            @click="submitForm"
            class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            :disabled="loading"
          >
            {{ loading ? 'Menyimpan...' : 'Simpan Lokasi' }}
          </button>
        </div>
      </BaseCard>
    </div>
  </BaseLayout>
</template>

<style>
.info.legend {
  background: white;
  padding: 8px 12px;
  font-size: 12px;
  border-radius: 4px;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.2);
  line-height: 1.6;
}
.info.legend h4 {
  margin: 0 0 5px 0;
  font-size: 13px;
}
.info.legend p {
  margin: 4px 0;
}

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
