<script setup>
import { onMounted, ref, reactive, computed, nextTick } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BasePanel from '@/components/ui/BasePanel.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import Fluid from '@/components/ui/Fluid.vue'
import InputText from '@/components/ui/InputText.vue'
import { useDeviceSocket } from '@/composables/useDeviceSocket'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout.vue'
import { formatDate } from '@/lib/utils'
import { useDeviceStore } from '@/stores/deviceStore'
import { useLocationStore } from '@/stores/locationStore'
import { useRoute } from 'vue-router'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { debounce } from 'lodash'

const route = useRoute()
const store = useDeviceStore()
const device = ref(null)
const location = useLocationStore()
const isLoading = ref(false)
const { updateDeviceSetting } = useDeviceSocket()

// Form data
const form = reactive({
  code: '',
  name : '',
  description: '',
  locationId: null,
  status: '',
  calibration: 0,
  periode: 0,
  location: null,
})

// Status options
const statusOptions = [
  { value: 'CONNECTED', label: 'Connected', class: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'DISCONNECTED', label: 'Disconnected', class: 'bg-red-100 text-red-800 border-red-200' },
]

const showSuccessToast = (msg) => {
  toast.success(msg, { autoClose: 3000, position: 'top-right' })
}

const showErrorToast = (msg) => {
  toast.error(msg, { autoClose: 3000, position: 'top-right' })
}

// Computed properties
const statusBadge = computed(() => {
  if (!device.value) return null
  const status = statusOptions.find((s) => s.value === device.value.status)
  return (
    status || {
      value: device.value.status,
      label: device.value.status,
      class: 'bg-gray-100 text-gray-800 border-gray-200',
    }
  )
})

const handleSubmit = debounce(async () => {
  try {
    isLoading.value = true
    const res = await updateDeviceSetting(
      form.code,
      form.name,
      form.description,
      form.locationId,
      form.calibration,
      form.periode,
    )
    if(res){
      showSuccessToast("Berhasil Update Alat")
    }
  } catch (error) {
    console.log(error)
    showErrorToast('Gagal Update Alat')
  }finally{
    isLoading.value = false
  }
}, 500)

const map = ref(null)
const mapElement = ref(null)
const mapCenter = ref([])

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
  className: 'normal-marker',
})

const warningIcon = L.icon({
  iconUrl:
    'data:image/svg+xml;base64,' +
    btoa(`
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
  className: 'warning-marker',
})

const dangerIcon = L.icon({
  iconUrl:
    'data:image/svg+xml;base64,' +
    btoa(`
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
  className: 'danger-marker',
})

// Pulsing icons for recently updated locations
const pulsingWarningIcon = L.icon({
  iconUrl:
    'data:image/svg+xml;base64,' +
    btoa(`
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
  className: 'warning-marker pulsing-marker',
})

const pulsingDangerIcon = L.icon({
  iconUrl:
    'data:image/svg+xml;base64,' +
    btoa(`
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
  className: 'danger-marker pulsing-marker',
})

// Function to get icon based on status
const getIconByStatus = (status, isRecentlyUpdated = false) => {
  try {
    const normalizedStatus = location.normalizeStatus ? location.normalizeStatus(status) : status?.toLowerCase()

    if (isRecentlyUpdated) {
      switch (normalizedStatus) {
        case 'normal':
        case 'connected':
          return normalIcon
        case 'warning':
        case 'maintenance':
          return pulsingWarningIcon
        case 'danger':
        case 'disconnected':
          return pulsingDangerIcon
        default:
          return normalIcon
      }
    }

    switch (normalizedStatus) {
      case 'normal':
      case 'connected':
        return normalIcon
      case 'warning':
      case 'maintenance':
        return warningIcon
      case 'danger':
      case 'disconnected':
        return dangerIcon
      default:
        return normalIcon
    }
  } catch (error) {
    console.error('❌ Error in getIconByStatus:', error)
    return normalIcon // Fallback to normal icon
  }
}

// Load device data and initialize map
onMounted(async () => {
  try {
    device.value = await store.getDevice(route.params.id)
    if (device.value) {
      Object.assign(form, {
        code: device.value.code,
        name : device.value.name,
        description: device.value.description,
        locationId: device.value.locationId,
        status: device.value.status,
        calibration: device.value.calibration,
        periode: device.value.periode,
        location: device.value.location,
      })
    }

    // Convert string coordinates to numbers and set map center
    if (device.value.location?.latitude && device.value.location?.longitude) {
      mapCenter.value = [
        parseFloat(device.value.location.latitude),
        parseFloat(device.value.location.longitude)
      ]
    }

    await nextTick()
    if (mapElement.value && !map.value) {
      // Initialize map with higher zoom level for better detail
      map.value = L.map(mapElement.value).setView(mapCenter.value, 15)

      // Add tile layer
      L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxZoom: 17,
        attribution: '© OpenStreetMap contributors, SRTM | © OpenTopoMap (CC-BY-SA)',
      }).addTo(map.value)

      // Add device marker immediately if coordinates are available
      if (device.value.location?.latitude && device.value.location?.longitude) {
        const deviceLat = parseFloat(device.value.location.latitude)
        const deviceLng = parseFloat(device.value.location.longitude)

        // Create device marker with appropriate icon based on status
        const deviceIcon = getIconByStatus(device.value.status, false)
        const deviceMarker = L.marker([deviceLat, deviceLng], { icon: deviceIcon })
          .addTo(map.value)
          .bindPopup(`
            <div class="p-2">
              <b>${device.value.code}</b><br>
              <strong>Name:</strong> ${device.value.name || 'N/A'}<br>
              <strong>Status:</strong> <span class="font-medium ${device.value.status === 'CONNECTED' ? 'text-green-600' : device.value.status === 'DISCONNECTED' ? 'text-red-600' : 'text-yellow-600'}">${device.value.status}</span><br>
              <strong>Location:</strong> ${device.value.location.name}<br>
              <strong>Address:</strong> ${device.value.location.address}<br>
              <strong>Coordinates:</strong> ${deviceLat.toFixed(6)}, ${deviceLng.toFixed(6)}
            </div>
          `, { maxWidth: 300 })

        console.log('✅ Device marker added:', device.value.code)

        // Open popup immediately to show device info
        deviceMarker.openPopup()
      }

      try {
        console.log('🔄 Attempting to fetch locations...')
        await location.fetchAllLocations()

        // Get valid locations
        const validLocations = location.validLocations
        console.log('📍 Valid locations found:', validLocations?.length || 0)

        if (validLocations && Array.isArray(validLocations) && validLocations.length > 0) {
          validLocations.forEach((loc) => {
            if (loc.latitude && loc.longitude && loc.id !== device.value.locationId) {
              try {
                const lat = parseFloat(loc.latitude)
                const lng = parseFloat(loc.longitude)
                const markerIcon = getIconByStatus(loc.status, loc.isRecentlyUpdated)

                L.marker([lat, lng], { icon: markerIcon })
                  .addTo(map.value)
                  .bindPopup(`
                    <div class="p-2">
                      <b>${loc.name}</b><br>
                      <strong>Status:</strong> ${loc.status}<br>
                      <strong>Address:</strong> ${loc.address || 'N/A'}<br>
                      <strong>Coordinates:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}
                    </div>
                  `)

              } catch (markerError) {
                console.error(`❌ Error creating marker for ${loc.name}:`, markerError)
              }
            }
          })
        } else {
          console.log('ℹ️ No valid locations available or locations is not an array')
        }
      } catch (locationError) {
        console.error('❌ Failed to fetch locations:', locationError)

        if (locationError.code === 'ERR_NETWORK') {
          console.log('🌐 Location API is offline - showing device marker only')
        }
      }

      // Force map refresh after all markers are added
      setTimeout(() => {
        if (map.value) {
          map.value.invalidateSize()
          console.log('🔄 Map size invalidated')
        }
      }, 100)
    } else {
      console.error('❌ mapElement not found or map already initialized')
    }
  } catch (error) {
    console.error('❌ Error loading device or initializing map:', error)
  }
})
</script>

<template>
  <AuthenticatedLayout>
    <BaseCard
    title="Detail Alat"
    class="w-full h-fit">
      <div v-if="device" class="space-y-8">
        <Fluid>
          <form @submit.prevent="handleSubmit" class="space-y-6">
            <section class="w-56 justify-end flex gap-x-5 ml-auto">

              <RouterLink to="/device">
                <BaseButton label="Kembali" />
              </RouterLink>
              <BaseButton label="Simpan" :loading="isLoading"/>
            </section>

            <BasePanel>
              <template #header>
                <div class="w-full flex items-center justify-between">
                  <section class="flex items-center gap-x-5">
                    <h3 class="text-xl font-semibold">Informasi Alat</h3>
                    <span
                      v-if="statusBadge"
                      :class="[
                        'px-3 py-1 rounded-full text-sm font-medium border',
                        statusBadge.class,
                      ]"
                    >
                      {{ statusBadge.label }}
                    </span>
                  </section>
                </div>
              </template>

              <!-- Basic Information -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Kode Alat</label>
                  <InputText
                    v-model="form.code"
                    readonly
                    placeholder="Enter device code"
                    class="w-full"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Nama Alat</label>
                  <InputText
                    v-model="form.name"
                    placeholder="Enter device name"
                    class="w-full"
                  />
                </div>
              </div>

              <!-- Description -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Deskripsi</label>
                <BaseTextarea
                  v-model="form.description"
                  placeholder="Masukkan keterangan alat"
                  rows="3"
                  class="w-full"
                />
              </div>
            </BasePanel>

            <!-- Location -->
            <BasePanel header="Lokasi Device">
              <div class="space-y-4">
                <div ref="mapElement" class="w-full h-80 rounded border shadow-sm outline-none"></div>
              </div>
            </BasePanel>

            <!-- Configuration -->
            <BasePanel header="Konfigurasi Alat">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2"
                    >Kalibrasi (cm)</label
                  >
                  <InputText
                    v-model.number="form.calibration"
                    type="number"
                    min="0"
                    placeholder="Masukkan nilai kalibrasi"
                    class="w-full"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2"
                    >Periode (detik)</label
                  >
                  <InputText
                    v-model.number="form.periode"
                    type="number"
                    min="1"
                    placeholder="Masukkan nilai periode alat mengirim data"
                    class="w-full"
                  />
                </div>
              </div>
            </BasePanel>

            <BasePanel header="Informasi Tambahan">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                <div class="bg-gray-100 p-4 rounded-lg">
                  <label class="block text-sm font-medium text-gray-600">Tanggal Dibuat</label>
                  <p class="mt-1 text-sm text-gray-900">{{ formatDate(device.createdAt) }}</p>
                </div>
                <div class="bg-gray-100 p-4 rounded-lg">
                  <label class="block text-sm font-medium text-gray-600">Tanggal Diperbarui</label>
                  <p class="mt-1 text-sm text-gray-900">{{ formatDate(device.updatedAt) }}</p>
                </div>
              </div>
            </BasePanel>
          </form>
        </Fluid>
      </div>

      <!-- Loading State -->
      <div v-else class="flex items-center justify-center h-64">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-3 text-gray-600">Loading device information...</span>
      </div>
    </BaseCard>
  </AuthenticatedLayout>
</template>

<style scoped>
/* Custom styles for pulsing markers */
:deep(.pulsing-marker) {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* Map container styling */
:deep(.leaflet-container) {
  border-radius: 0.375rem;
}

/* Popup styling */
:deep(.leaflet-popup-content-wrapper) {
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}
</style>
