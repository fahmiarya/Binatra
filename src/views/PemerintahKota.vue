<script setup>
import BaseLayout from '@/layouts/BaseLayout.vue'
import BaseCard from '@/components/BaseCard.vue'
import { LMap, LTileLayer, LMarker, LPopup } from '@vue-leaflet/vue-leaflet'
import 'leaflet/dist/leaflet.css'
import { ref, onMounted, computed } from 'vue'
import { useLocationStore } from '@/stores/locationStore'

// Konfigurasi default icon (agar marker tidak invisible)
import L from 'leaflet'

// Gunakan new URL(..., import.meta.url) agar path gambar di-resolve dengan benar
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// Hapus method lama agar tidak pakai default bawaan yang salah path
delete L.Icon.Default.prototype._getIconUrl

// Atur ulang path ikon dengan yang sudah di-resolve
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

// Custom icons untuk different status
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

// Function to get icon based on status
const getIconByStatus = (status) => {
  // Convert API status to component status
  const normalizedStatus = normalizeStatus(status)

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
        district: address.city_district ||address.municipality,
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

// Load initial locations
onMounted(async () => {
  await locationsStore.getAllLocations()
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

// Computed untuk menghitung jumlah lokasi berdasarkan status
const locationStats = computed(() => {
  const stats = {
    normal: 0,
    warning: 0,
    danger: 0,
    total: 0
  }

  locationsStore.locations.forEach(location => {
    stats[location.status]++
    stats.total++
  })

  return stats
})
</script>

<template>
  <BaseLayout>
    <div class="w-full flex flex-col items-center">
      <BaseCard title="Peta Lokasi" customClass="mb-4 w-full">
        <p class="text-gray-600 font-bold">Peta Real-time Titik Lokasi Banjir</p>

        <!-- Stats -->
        <div class="mt-3 flex gap-4 text-sm">
          <span class="flex items-center gap-1">
            <div class="w-3 h-3 bg-green-500 rounded-full"></div>
            Normal: {{ locationStats.normal }}
          </span>
          <span class="flex items-center gap-1">
            <div class="w-3 h-3 bg-orange-500 rounded-full"></div>
            Peringatan: {{ locationStats.warning }}
          </span>
          <span class="flex items-center gap-1">
            <div class="w-3 h-3 bg-red-500 rounded-full"></div>
            Bahaya: {{ locationStats.danger }}
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

          <!-- Display markers for flood locations -->
          <LMarker v-for="location in locationsStore.locations" :key="`marker-${location.id}`"
            v-show="!isNaN(Number(location.latitude)) && !isNaN(Number(location.longitude))"
            :lat-lng="[Number(location.latitude), Number(location.longitude)]"
            :icon="getIconByStatus(location.currentStatus)">
            <LPopup>
              <div class="min-w-48">
                <h3 class="font-bold text-lg mb-2">{{ location.name }}</h3>
                <p class="text-sm text-gray-600 mb-2">{{ location.address || 'Alamat tidak tersedia' }}</p>
                <p class="text-sm text-gray-600 mb-2">{{ location.district || '-' }}, {{ location.city || '-' }}</p>
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-xs text-gray-500">Status:</span>
                  <span :class="['text-sm font-semibold', getStatusColor(location.currentStatus)]">
                    {{ getStatusText(location.currentStatus) }}
                  </span>
                </div>
                <div class="text-xs text-gray-400 mb-1">
                  <p>Tinggi Air: {{ location.currentWaterLevel || 0 }}cm</p>
                  <p>Curah Hujan: {{ location.currentRainfall || 0 }}mm</p>
                </div>
                <p class="text-xs text-gray-400">
                  Koordinat: {{ Number(location.latitude).toFixed(4) }}, {{ Number(location.longitude).toFixed(4) }}
                </p>
                <p class="text-xs text-gray-400">
                  Update Terakhir: {{ new Date(location.lastUpdate || location.updatedAt).toLocaleString('id-ID') }}
                </p>
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

      <!-- Create Location Modal -->
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
</style>
