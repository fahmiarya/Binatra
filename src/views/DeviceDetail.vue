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
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const route = useRoute()
const store = useDeviceStore()
const device = ref(null)
const location = useLocationStore()
const { updateDeviceSetting } = useDeviceSocket()

// Form data
const form = reactive({
  code: '',
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
  {
    value: 'MAINTENANCE',
    label: 'Maintenance',
    class: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
]

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

const handleSubmit = async () => {
  try {
    const res = await updateDeviceSetting(
      form.code, // deviceCode
      form.locationId, // locationId
      form.calibration, // calibration
      form.periode, // periode
    )

    console.log(res)
  } catch (error) {
    console.log(error)
  }
}

const map = ref(null)
const mapElement = ref(null)
const mapCenter = ref([-7.2575, 112.7521]) // Default: Surabaya
// Load device data
onMounted(async () => {
  try {
    device.value = await store.getDevice(route.params.id)
    if (device.value) {
      Object.assign(form, {
        code: device.value.code,
        description: device.value.description,
        locationId: device.value.locationId,
        status: device.value.status,
        calibration: device.value.calibration,
        periode: device.value.periode,
        location: device.value.location,
      })
    }
    if (device.value.location?.latitude && device.value.location?.longitude) {
      mapCenter.value = [device.value.location.latitude, device.value.location.longitude]
    }

    await nextTick()
    if (mapElement.value && !map.value) {
      console.log('✅ Initializing map with center:', mapCenter.value)

      // Inisialisasi map
      map.value = L.map(mapElement.value).setView(mapCenter.value, 13)

      // Tambahkan tile layer
      L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxZoom: 17,
        attribution: '© OpenStreetMap contributors, SRTM | © OpenTopoMap (CC-BY-SA)',
      }).addTo(map.value)

      try {
        console.log('🔄 Attempting to fetch locations...')
        await location.fetchAllLocations()

        // validLocations adalah computed property, bukan function
        const validLocations = location.validLocations
        console.log('📍 Valid locations found:', validLocations?.length || 0)

        if (validLocations && Array.isArray(validLocations) && validLocations.length > 0) {
          validLocations.forEach((loc, index) => {
            if (loc.latitude && loc.longitude) {
              try {
                // Debug log untuk troubleshooting
                console.log(`🎯 Processing location ${index + 1}:`, {
                  name: loc.name,
                  status: loc.status,
                  coords: [loc.latitude, loc.longitude],
                })

                // marker default
                // const testMarker = L.marker([loc.latitude, loc.longitude])
                //   .addTo(map.value)
                //   .bindPopup(
                //     `<b>${loc.name}</b><br>Status: ${loc.status}<br>Coords: ${loc.latitude}, ${loc.longitude}`,
                //   )

                // console.log(`✅ Location marker ${index + 1} added:`, loc.name, testMarker)

                if (enrichedDeviceLocation.value) {
                  const { latitude, longitude, status, isRecentlyUpdated } =
                    enrichedDeviceLocation.value

                  const markerIcon = getIconByStatus(status, isRecentlyUpdated)
                  L.marker([latitude, longitude], { icon: markerIcon })
                    .addTo(map.value)
                    .bindPopup(`<b>${device.value.code}</b><br>Status: ${status}`)
                }
              } catch (markerError) {
                console.error(`❌ Error creating marker for ${loc.name}:`, markerError)
              }
            } else {
              console.warn(`⚠️ Invalid coordinates for location:`, loc.name, loc)
            }
          })
        } else {
          console.log('ℹ️ No valid locations available or locations is not an array')
        }
      } catch (locationError) {
        console.error('❌ Gagal ambil lokasi:', locationError)

        if (locationError.code === 'ERR_NETWORK') {
          console.log('🌐 API locations sedang offline - hanya menampilkan device marker')
        }
        // Map tetap berfungsi dengan device marker saja
      }

      // 7. Force map refresh setelah semua marker ditambahkan
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

const enrichedDeviceLocation = computed(() => {
  if (!device.value || !device.value.locationId) return null

  const locStatus = location.locations.find((l) => l.id === device.value.locationId)

  return {
    ...device.value.location,
    status: locStatus?.status || 'UNKNOWN',
    isRecentlyUpdated: locStatus?.isRecentlyUpdated || false,
  }
})

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

// Function to get icon based on status (menggunakan function dari store)
const getIconByStatus = (status, isRecentlyUpdated = false) => {
  try {
    const normalizedStatus = location.normalizeStatus(status) || 'normal' // DARI STORE

    if (isRecentlyUpdated) {
      switch (normalizedStatus) {
        case 'normal':
          return normalIcon
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
  } catch (error) {
    console.error('❌ Error in getIconByStatus:', error)
    return normalIcon // Fallback ke icon normal
  }
}
</script>

<template>
  <AuthenticatedLayout>
    <!-- Main Content -->
    <BaseCard class="w-full h-fit">
      <div v-if="device" class="space-y-8">
        <Fluid>
          <form @submit.prevent="handleSubmit" class="space-y-6">
            <section class="w-56 justify-end flex gap-x-5 ml-auto">
              <BaseButton label="Back" severity="secondary" />
              <BaseButton label="Save" severity="secondary" type="submit" />
            </section>
            <BasePanel>
              <template #header>
                <div class="w-full flex items-center justify-between">
                  <section class="flex items-center gap-x-5">
                    <h3 class="text-xl font-semibold">Device Information</h3>
                    <!-- Status Badge -->
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
                  <label class="block text-sm font-medium text-gray-700 mb-2">Device Code</label>
                  <InputText
                    v-model="form.code"
                    readonly
                    placeholder="Enter device code"
                    class="w-full"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Nama Device</label>
                  <InputText v-model="form.code" placeholder="Enter device code" class="w-full" />
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
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Lokasi</label>
                <div v-if="device" ref="mapElement" class="w-full h-80 rounded border"></div>
              </div>
            </BasePanel>

            <!-- Configuration -->
            <BasePanel header="Konfigurasi Device">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2"
                    >Calibration (CM)</label
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
                    >Period (seconds)</label
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
