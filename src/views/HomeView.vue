<template>
  <AuthenticatedLayout>
    <!-- Bagian kiri (2/3 layar) -->
    <div class="w-full flex flex-col gap-10">
      <!-- Baris pertama -->
      <div class="grid grid-cols-2 gap-8">
        <!-- Weather Card -->
        <BaseCard title="Cuaca Surabaya">
          <div class="flex justify-between items-center">
            <div>
              <p class="text-sm text-gray-500 mb-3">{{ location }}</p>

              <div class="mb-2">
                <span class="text-3xl font-medium text-[#516F91]">{{ main?.temp }}°C</span>
                <div class="text-xs text-gray-500 mt-2">
                  <span>3°C</span> / <span>12°C</span>
                </div>
              </div>

              <p class="text-sm text-gray-500" v-if="weather">{{ weather[0].main }}</p>
              <p class="text-sm text-gray-500" v-else>Loading...</p>
            </div>

            <div class="mt-1">
              <img :src="CloudIcon" alt="Weather" class="w-28" />
            </div>
          </div>
        </BaseCard>

        <!-- Jumlah Lokasi Banjir -->
        <BaseCard title="Jumlah Lokasi Status Banjir" customClass="scrollbar-hidden" :showTopRightArrow="true">
          <div class="flex items-center min-h-[120px]">
            <div class="flex flex-col">
              <span class="text-4xl font-medium text-[#516F91]">{{ totalFloodLocations }}</span>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Jumlah Device Terhubung -->
      <div class="grid grid-cols-2 gap-8">
        <!-- Device Card -->
        <BaseCard title="Jumlah Device Terhubung">
          <div class="flex items-center min-h-[120px]">
            <div class="flex flex-col">
              <p class="text-lg text-[#274C77] font-bold">
                {{ deviceConnected || 0 }}
                <span class="text-gray-500 font-normal">
                  Connected devices
                </span>
              </p>
            </div>
          </div>
        </BaseCard>

        <!-- Jumlah Lokasi Peringatan Banjir -->
        <BaseCard title="Jumlah Lokasi Peringatan Banjir" customClass="text-sm">
          <div class="flex items-center min-h-[120px]">
            <div class="flex flex-col">
              <span class="text-4xl font-medium text-[#516F91]">{{ locationsTotal }}</span>
            </div>
          </div>
        </BaseCard>
      </div>

      <div class="grid">
        <BaseCard title="Real Time Ketinggian Banjir">
          <BaseAreaChart />
        </BaseCard>
      </div>
    </div>
  </AuthenticatedLayout>
</template>

<script setup>
import BaseCard from '@/components/ui/BaseCard.vue';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout.vue';
import CloudIcon from '@/assets/images/cloud.png';
import { reactive, onMounted, ref, computed, watch } from "vue";
import { listenToSensorData } from "@/plugins/socket.js";
import { useWeatherStore } from '@/stores/weather.store';
import { storeToRefs } from 'pinia';
import BaseAreaChart from '@/components/ui/BaseAreaChart.vue';
import { useDeviceStore } from '@/stores/deviceStore';
import { useLocationStore } from '@/stores/locationStore';

// Import composables
import { useFloodSocket } from '@/composables/useFloodSocket.js';
import { useDeviceSocket } from '@/composables/useDeviceSocket.js';

const weatherStore = useWeatherStore();
const deviceStore = useDeviceStore();
const locationStore = useLocationStore();
const { weather, main, location } = storeToRefs(weatherStore);

// Initialize composables
const floodSocket = useFloodSocket();
const deviceSocket = useDeviceSocket();

// State (keeping original variable names)
const sensorData = reactive({
  waterlevel: null,
  rain: null,
});

const totalFloodLocations = ref(0);
const floodLocations = ref([]);
const locationsTotal = ref(0);
const deviceConnected = ref(0);

// Real-time indicators
const isFloodDataUpdating = ref(false);
const isDeviceDataUpdating = ref(false);
const isLocationDataUpdating = ref(false);

// Visual feedback functions (declare before watchers)
const showFloodDataUpdate = () => {
  isFloodDataUpdating.value = true;
  setTimeout(() => {
    isFloodDataUpdating.value = false;
  }, 2000);
};

const showDeviceDataUpdate = () => {
  isDeviceDataUpdating.value = true;
  setTimeout(() => {
    isDeviceDataUpdating.value = false;
  }, 2000);
};

const showLocationDataUpdate = () => {
  isLocationDataUpdating.value = true;
  setTimeout(() => {
    isLocationDataUpdating.value = false;
  }, 2000);
};

// Update totalFloodLocations from flood composable
const updateTotalFloodLocations = computed(() => {
  if (floodSocket.floodSummary.value?.totalFloodLocations) {
    return floodSocket.floodSummary.value.totalFloodLocations;
  }
  return floodSocket.floodLocations.value?.length || 0;
});

// Watch for changes and update reactive state
watch(updateTotalFloodLocations, (newValue) => {
  totalFloodLocations.value = newValue;
  showFloodDataUpdate();
}, { immediate: true });

watch(deviceSocket.connectedDevices, (newValue) => {
  deviceConnected.value = newValue;
  showDeviceDataUpdate();
}, { immediate: true });

watch(() => floodSocket.floodLocations.value, (newLocations) => {
  floodLocations.value = newLocations || [];
}, { deep: true, immediate: true });

watch(() => floodSocket.recentlyUpdatedLocations.value, (newUpdates) => {
  if (newUpdates.length > 0) {
    showFloodDataUpdate();
  }
});

// Watch for new notifications to show visual feedback
watch(() => floodSocket.notifications.value, (newNotifications, oldNotifications) => {
  if (newNotifications.length > (oldNotifications?.length || 0)) {
    const latestNotification = newNotifications[0];
    // Show appropriate visual feedback based on notification type
    if (['new_flood_location', 'location_status_change'].includes(latestNotification.type)) {
      showFloodDataUpdate();
      showLocationDataUpdate();
    }
  }
}, { deep: true });

watch(() => deviceSocket.deviceNotifications.value, (newNotifications, oldNotifications) => {
  if (newNotifications.length > (oldNotifications?.length || 0)) {
    showDeviceDataUpdate();
  }
}, { deep: true });


// Load initial data from stores as fallback
const loadInitialData = async () => {
  try {

    // Use composable data first, fallback to store methods if needed
    if (!floodSocket.floodLocations.value?.length) {
      const floodLocationList = await locationStore.getFloodLocations();
      floodLocations.value = floodLocationList;
    }

    if (!deviceSocket.connectedDevices.value?.length) {
      const connectedDevices = await deviceStore.getConnectedDevices();
      deviceConnected.value = connectedDevices;
    }

    const [totalLocations, floodLocationCount] = await Promise.all([
      locationStore.getTotalLocations(),
      locationStore.getTotalFloodLocations()
    ]);

    locationsTotal.value = totalLocations;

    if (!updateTotalFloodLocations.value) {
      totalFloodLocations.value = floodLocationCount;
    }
  } catch (error) {
    console.error('❌ Error loading initial data:', error);
  }
};

// Lifecycle
onMounted(async () => {
  // Load initial data as fallback
  await loadInitialData();

  // Setup sensor data listener (existing)
  listenToSensorData((data) => {
    sensorData.waterlevel = data.waterlevel;
    sensorData.rain = data.rain;
    sensorData.buzzerState = data.buzzerState;
  });
});
</script>

<style scoped>
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
