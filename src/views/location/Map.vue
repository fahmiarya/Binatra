
<script setup>
import { ref, computed, watch, toRefs } from 'vue'
import { LMap, LTileLayer, LMarker, LPopup } from '@vue-leaflet/vue-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { normalIcon, warningIcon, dangerIcon, pulsingWarningIcon, pulsingDangerIcon } from '@/components/ui/marker'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { useLocationStore } from '@/stores/locationStore'
import { useFloodSocket } from '@/composables/useFloodSocket.js'
import { toast } from 'vue3-toastify'

const locationsStore = useLocationStore()

const emits = defineEmits(['mapClick', 'edit'])
const props = defineProps(['newMarker', 'search', 'center'])

const {newMarker, search, center} = toRefs(props)

const floodSocket = useFloodSocket()
const isMapDataUpdating = ref(false)
const recentlyUpdatedLocationIds = ref(new Set())

const combinedLocations = computed(() => {
  return combineWithRealtimeData(floodSocket.floodLocations.value)
})

const isLocationRecentlyUpdated = (locationId) => {
  return recentlyUpdatedLocationIds.value.has(locationId) || floodSocket.recentlyUpdatedLocations.value.includes(locationId)
}

const map = ref()

const {
  normalizeStatus,
  getStatusColor,
  getStatusText,
  formatDate,
  combineWithRealtimeData,
  filterValidLocations
} = locationsStore

const validLocations = computed(() =>
  filterValidLocations(combinedLocations.value, search.value)
)

delete L.Icon.Default.prototype._getIconUrl

// Atur ulang path ikon dengan yang sudah di-resolve
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const getIconByStatus = (status, isRecentlyUpdated = false) => {
  const normalizedStatus = normalizeStatus(status) // DARI STORE

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
}

const showSuccessToast = (msg) => {
  toast.success(msg, { autoClose: 3000, position: 'top-right' })
}

const showErrorToast = (msg) => {
  toast.error(msg, { autoClose: 3000, position: 'top-right' })
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

  if (map.value?.leafletObject) {
    legend.addTo(map.value.leafletObject)
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

watch(() => floodSocket.recentlyUpdatedLocations.value, (newUpdates) => {
  if (newUpdates && newUpdates.length > 0) {
    showMapDataUpdate()

    // Mark these locations as recently updated
    newUpdates.forEach(locationId => {
      markLocationAsRecentlyUpdated(locationId)
    })
  }
})

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

watch(() => floodSocket.floodSummary.value, (newSummary) => {
  if (newSummary) {
    showMapDataUpdate()
  }
}, { deep: true })

defineExpose({
  map
})
</script>

<template>
  <div class="w-full h-screen relative z-0">
    <LMap
    ref="map"
    :zoom="11"
    :center="center"
    class="h-full w-full"
      @ready="onMapReady" @click="emits('mapClick', $event)">
      <LTileLayer url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" attribution="© OpenTopoMap contributors"
        :max-zoom="16" :min-zoom="3" />

      <!-- Marker lokasi dengan validLocations dari store -->
      <LMarker v-for="loc in validLocations" :key="`marker-${loc.id}-${loc.lastUpdate || loc.updatedAt}`"
        :lat-lng="[Number(loc.latitude), Number(loc.longitude)]"
        :icon="getIconByStatus(loc.currentStatus || loc.status, isLocationRecentlyUpdated(loc.id))">
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
              <button @click="emits('edit', loc)"
                class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
                Edit
              </button>
              <button @click="deleteLocation(loc.id)"
                class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
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

  0%,
  100% {
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
