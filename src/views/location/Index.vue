<script setup>
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useLocationStore } from '@/stores/locationStore'
import { useFloodSocket } from '@/composables/useFloodSocket.js'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
import SelectButton from '@/components/ui/SelectButton.vue'
import { Icon } from '@iconify/vue'
import LocationList from './Table.vue'
import InputText from '@/components/ui/InputText.vue'
import FormLocation from './FormLocation.vue'
import Map from './Map.vue'

const locationsStore = useLocationStore()
const { searchLocation: storeSearchLocation } = locationsStore
const floodSocket = useFloodSocket()
const selectedDisplay = ref('mdi:map')
const searchKeyword = ref('')
const isEditing = ref(false)
const displayOptions = ref([
 'mdi:view-list',
 'mdi:map'
])

const displayChange = (newVal) => {
  selectedDisplay.value = newVal
}
const center = [-7.2575, 112.7521]
const newMarker = ref(null)
const formVisible = ref(false)
const loading = ref(false)
const mapForm = ref()

const isMapDataUpdating = ref(false)
const recentlyUpdatedLocationIds = ref(new Set())

const loadLocations = async () => {
  await locationsStore.fetchAllLocations()
}

const locationStats = computed(() => {
  return floodSocket.floodSummary.value || {
    aman: 0,
    waspada: 0,
    siaga: 0,
    bahaya: 0,
    total: 0
  }
})

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

watch(() => form.value.amanMax, (newValue) => {
  form.value.waspadaMin = Number(newValue) + 1
})

watch(() => form.value.waspadaMax, (newValue) => {
  form.value.siagaMin = Number(newValue) + 1
})

watch(() => form.value.siagaMax, (newValue) => {
  form.value.bahayaMin = Number(newValue) + 1
})

const searchQuery = ref('')
const searchResults = ref([])
const isSearching = ref(false)
const mapRef = ref(null)

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

  nextTick(() => {
    mapForm.value.handleFocus()
  })

  locationsStore.reverseGeocode(item.lat, item.lon).then((geo) => {
    form.value.district = geo.district
    form.value.city = geo.city
    form.value.province = geo.province
  })

  if (mapRef.value?.map.leafletObject) {
    mapRef.value.map.leafletObject.flyTo([item.lat, item.lon], 16, {
      duration: 1.5,
    })
  }else{
    console.log("map")
  }

  searchResults.value = []
  searchQuery.value = ''
}

const editLocation = (loc) => {
  formVisible.value = true
  isEditing.value = true
  form.value = { ...loc }
  nextTick(() => {
    mapForm.value.handleFocus()
  })
  newMarker.value = [loc.latitude, loc.longitude]
}

const handleMapClick = async (e) => {
  const { lat, lng } = e.latlng
  isEditing.value = false
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

    floodSocket.refreshFloodData()
  } catch {
    showErrorToast('Gagal menyimpan lokasi')
  } finally {
    loading.value = false
  }
}

const handleEditFromTable = (val) => {
  selectedDisplay.value = 'mdi:map'
  formVisible.value = true
  isEditing.value = true
  Object.assign(form.value, val)
  nextTick(() => {
    mapForm.value.handleFocus()
  })
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

watch(() => floodSocket.floodSummary.value, (newSummary) => {
  if (newSummary) {
    isMapDataUpdating.value = true
    setTimeout(() => {
      isMapDataUpdating.value = false
    }, 2000)
  }
}, { deep: true, immediate: true })

onMounted(async () => {
  await loadInitialData()
})
</script>

<template>
  <AuthenticatedLayout>
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
            <span class="text-gray-900 font-medium">
              Total: {{ locationStats.total }}
            </span>
          </div>

          <template v-if="selectedDisplay === 'mdi:map'">
            <div class="relative w-full mt-4">
              <InputText v-model="searchQuery" placeholder="Cari Lokasi" class="w-full" />

              <!-- Suggestion list menggunakan search dari store -->
              <div v-if="searchResults.length"
                class="absolute top-full left-0 right-0 border bg-white max-h-48 overflow-auto z-50 shadow">
                <div v-for="result in searchResults" :key="result.lat + result.lon" @click="pickSearchedLocation(result)"
                  class="p-2 hover:bg-gray-100 cursor-pointer text-sm">
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
          </template>
        </BaseCard>
      </div>

      <div class="w-full flex justify-end mb-5">
        <SelectButton v-model="selectedDisplay" :options="displayOptions">
          <template #option="slotProps">
              <Icon :icon="slotProps.option" class="size-5"/>
            </template>
        </SelectButton>
      </div>

      <Map
        ref="mapRef"
        v-if="selectedDisplay === 'mdi:map'"
        :newMarker="newMarker"
        :search="searchKeyword"
        :center="center"
        @edit="editLocation"
        @mapClick="handleMapClick"
      />

      <LocationList
      v-else
      @add="displayChange"
      @edit="handleEditFromTable"
      />

      <FormLocation
      ref="mapForm"
      v-model:open="formVisible"
      v-model="form"
      @cancel="batalForm"
      @add="submitForm"
      :edit="isEditing"
      />
    </div>
  </AuthenticatedLayout>
</template>
