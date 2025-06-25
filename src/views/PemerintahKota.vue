<script setup lang="ts">
import BaseLayout from '@/layouts/BaseLayout.vue'
import BaseCard from '@/components/BaseCard.vue'
import { LMap, LTileLayer, LMarker, LPopup } from '@vue-leaflet/vue-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { watch } from 'vue'
import { useLocationStore } from '@/stores/locationStore'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'

const locationsStore = useLocationStore()

const loadLocations = async () => {
  await locationsStore.fetchAllLocations()
}

const deleteLocation = async (id: number) => {
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
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

// Custom Icons
const normalIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const warningIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/595/595067.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

const dangerIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1828/1828843.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

const getIconByStatus = (status: string) => {
  if (status?.toLowerCase() === 'bahaya') return dangerIcon
  if (status?.toLowerCase() === 'waspada' || status?.toLowerCase() === 'siaga') return warningIcon
  return normalIcon
}

const center = [-7.2575, 112.7521] // Koordinat Surabaya
const locations = computed(() => locationsStore.locations)
const newMarker = ref<number[] | null>(null)
const formVisible = ref(false)
const loading = ref(false)

axios.defaults.baseURL = import.meta.env.VITE_API_URL

const onMapReady = () => {
  const legend = L.control({ position: 'bottomright' })

  legend.onAdd = function () {
    const div = L.DomUtil.create('div', 'info legend')
    div.innerHTML = `
      <h4>Keterangan Marker</h4>
      <p><img src="https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png" width="15" style="vertical-align:middle;"> Normal</p>
      <p><img src="https://cdn-icons-png.flaticon.com/512/595/595067.png" width="15" style="vertical-align:middle;"> Waspada / Siaga</p>
      <p><img src="https://cdn-icons-png.flaticon.com/512/1828/1828843.png" width="15" style="vertical-align:middle;"> Bahaya</p>
    `
    return div
  }

  if (mapRef.value?.leafletObject) {
    legend.addTo(mapRef.value.leafletObject)
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short',
  })
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
const searchResults = ref<any[]>([])
const isSearching = ref(false)
const mapRef = ref<any>(null)

const searchLocation = async () => {
  if (searchQuery.value.trim().length < 3) {
    searchResults.value = []
    return
  }

  isSearching.value = true
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.value)}&limit=5&addressdetails=1&accept-language=id`,
    )
    const data = await res.json()

    searchResults.value = data.map((item) => ({
      name: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      type: item.type,
      details: item,
    }))
  } catch (err) {
    console.error('Gagal cari lokasi:', err)
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
const validLocations = computed(() =>
  locations.value.filter(
    (loc) =>
      loc.latitude !== null &&
      loc.longitude !== null &&
      !isNaN(Number(loc.latitude)) &&
      !isNaN(Number(loc.longitude)) &&
      (loc.name?.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
        loc.address?.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
        loc.city?.toLowerCase().includes(searchKeyword.value.toLowerCase())),
  ),
)

const editLocation = (loc: any) => {
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
  } catch {
    showErrorToast('Gagal menyimpan lokasi')
  } finally {
    loading.value = false
  }
}

const showSuccessToast = (msg: string) => {
  toast.success(msg, { autoClose: 3000, position: 'top-right' })
}

const showErrorToast = (msg: string) => {
  toast.error(msg, { autoClose: 3000, position: 'top-right' })
}

const batalForm = () => {
  formVisible.value = false
  newMarker.value = null
}

let debounceTimer: number | undefined

watch(searchQuery, (newVal) => {
  clearTimeout(debounceTimer) // Reset timer setiap kali user mengetik lagi

  if (newVal.trim().length < 3) {
    searchResults.value = []
    return
  }

  debounceTimer = window.setTimeout(() => {
    searchLocation()
  }, 500) // Delay 500ms setelah user berhenti mengetik
})

onMounted(loadLocations)
</script>

<template>
  <BaseLayout>
    <div class="w-full flex flex-col items-center">
      <div class="w-full mb-4 relative z-20">
        <BaseCard title="Peta Lokasi" customClass="w-full">
          <div class="relative w-full">
            <input
              v-model="searchQuery"
              placeholder="Cari lokasi, contoh: Surabaya, Bandung..."
              class="border px-3 py-1 w-full"
            />

            <!-- Suggestion list floating tidak ketiban -->
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
          <div class="mt-3 p-3 bg-blue-50 border border-blue-300 text-blue-800 rounded text-sm">
            ℹ️ Klik pada peta untuk menambah lokasi baru. Anda juga bisa mencari lokasi lewat kolom
            pencarian di atas.
          </div>
        </BaseCard>
      </div>
      <div class="w-full h-[55vh] relative z-0">
        <LMap
          ref="mapRef"
          :zoom="11"
          :center="center"
          class="h-full w-full"
          @ready="onMapReady"
          @click="handleMapClick"
        >
          <LTileLayer
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            attribution="© OpenTopoMap contributors"
          />

          <!-- Marker lokasi -->
          <LMarker
            v-for="loc in validLocations"
            :key="loc.id"
            :lat-lng="[Number(loc.latitude), Number(loc.longitude)]"
            :icon="getIconByStatus(loc.status)"
          >
            <LPopup>
              <div class="text-sm space-y-1">
                <h3 class="font-bold text-base mb-1">{{ loc.name }}</h3>
                <p>{{ loc.address }}</p>
                <p>{{ loc.district }}, {{ loc.city }}</p>
                <p>
                  <span class="font-semibold">Status:</span> {{ loc.status || 'Tidak diketahui' }}
                </p>
                <p><span class="font-semibold">Tinggi Air:</span> {{ loc.waterLevel || 0 }} cm</p>
                <p><span class="font-semibold">Curah Hujan:</span> {{ loc.rainfall || 0 }} mm</p>
                <p>
                  <span class="font-semibold">Koordinat:</span> {{ loc.latitude }},
                  {{ loc.longitude }}
                </p>
                <p>
                  <span class="font-semibold">Update Terakhir:</span>
                  {{ formatDate(loc.updatedAt) }}
                </p>

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
</style>
