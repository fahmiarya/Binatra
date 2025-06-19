<template>
  <!-- Panel tetap untuk monitoring banjir -->
  <div class="w-1/3 flex flex-col gap-10">
    <!-- Notifications Card -->
    <BaseCard title="Peringatan Banjir" customClass="h-[350px] scrollbar-hidden">
      <div class="mt-4 space-y-4 overflow-y-auto max-h-64">
        <div class="flex" v-for="notification in floodNotifications" :key="notification.id">
          <div :class="[
            'w-2 h-2 rounded-full mt-1.5 mr-2',
            notification.severity === 'high' ? 'bg-red-500' :
              notification.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
          ]"></div>
          <div>
            <p class="text-sm font-medium">{{ notification.title }}</p>
            <p class="text-xs text-gray-500">{{ notification.location }} dalam {{ notification.timeframe }}</p>
            <p class="text-xs text-gray-400 mt-1">{{ notification.timeAgo }}</p>
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- Alert Locations Card -->
    <BaseCard title="Lokasi Dengan Status Waspada" :hasArrow="false" customClass="flex-grow">

      <div class="space-y-3 mt-4 scrollbar-hidden overflow-y-auto max-h-screen">
        <!-- Loading state -->
        <div v-if="loading" class="flex justify-center items-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span class="ml-2 text-gray-500">Memuat data lokasi...</span>
        </div>

        <!-- Location cards -->
        <div v-for="location in floodLocations" :key="location.id" :class="[
          'p-4 rounded-lg border-l-4 shadow-sm transition-all hover:shadow-md',
          getLocationCardStyle(location.currentStatus),
          recentlyUpdatedLocations.includes(location.id) ? 'ring-2 ring-blue-300 animate-pulse' : ''
        ]">
          <div class="flex justify-between items-start mb-2">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <h4 class="font-semibold text-gray-800">{{ location.name }}</h4>
                <span :class="[
                  'px-2 py-1 rounded-full text-xs font-medium',
                  getStatusBadgeStyle(location.currentStatus)
                ]">
                  {{ location.currentStatus }}
                </span>
                <!-- Show update indicator -->
                <span v-if="recentlyUpdatedLocations.includes(location.id)"
                      class="text-xs bg-blue-100 text-blue-600 px-1 py-0.5 rounded animate-pulse">
                  📡 Live
                </span>
              </div>
              <p class="text-sm text-gray-600 mb-2">{{ location.address }}</p>

              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="flex items-center gap-1">
                  <span class="text-blue-600">💧</span>
                  <span class="text-gray-600">{{ location.currentWaterLevel || 0 }}cm</span>
                </div>
                <div class="flex items-center gap-1">
                  <span class="text-gray-600">🌧️</span>
                  <span class="text-gray-600">{{ location.currentRainfall || 0 }}mm/h</span>
                </div>
              </div>
            </div>

            <div class="text-right">
              <p class="text-xs text-gray-500">Update terakhir</p>
              <p class="text-xs font-medium text-gray-700">{{ formatLastUpdate(location.lastUpdate) }}</p>
            </div>
          </div>

          <!-- Progress bar untuk water level -->
          <div class="mt-3">
            <div class="flex justify-between text-xs text-gray-600 mb-1">
              <span>Ketinggian Air</span>
              <span>{{ location.currentWaterLevel || 0 }}/{{ getMaxThreshold(location) }}cm</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div :class="[
                'h-2 rounded-full transition-all duration-300',
                getProgressBarColor(location.currentStatus)
              ]" :style="{ width: calculateProgress(location) + '%' }"></div>
            </div>

            <!-- Threshold indicators -->
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>{{ location.amanMax || 0 }}</span>
              <span>{{ location.waspadaMax || 0 }}</span>
              <span>{{ location.siagaMax || 0 }}</span>
              <span>{{ location.bahayaMin || 0 }}</span>
            </div>
            <div class="flex justify-between text-xs text-gray-400">
              <span>AMAN</span>
              <span>WASPADA</span>
              <span>SIAGA</span>
              <span>BAHAYA</span>
            </div>
          </div>

          <!-- Subscribe/Unsubscribe button -->
          <div class="mt-2 text-right">
            <button
              @click="toggleLocationSubscription(location.id)"
              class="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
            >
              {{ subscribedLocations.has(location.id) ? '🔕 Unsubscribe' : '🔔 Subscribe' }}
            </button>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="!loading && floodLocations.length === 0"
             class="text-center py-8 text-gray-500">
          <p>Tidak ada data lokasi dengan status peringatan</p>
        </div>
      </div>
    </BaseCard>
  </div>
</template>

<script setup>
import BaseCard from '@/components/BaseCard.vue';
import { useFloodSocket } from '@/composables/useFloodSocket.js';
import { ref } from 'vue';


// Socket composable
const {
  floodLocations,
  recentlyUpdatedLocations,
  loading,
  subscribeToLocation,
  unsubscribeFromLocation,
  formatLastUpdate,
} = useFloodSocket();

// Local state
const subscribedLocations = ref(new Set());

// Props
defineProps({
  floodNotifications: {
    type: Array,
  },
  alertLocations: {
    type: Array
  }
});

// Location subscription management
const toggleLocationSubscription = (locationId) => {
  if (subscribedLocations.value.has(locationId)) {
    // Unsubscribe
    unsubscribeFromLocation(locationId);
    subscribedLocations.value.delete(locationId);
    console.log(`📍 Unsubscribed from location: ${locationId}`);
  } else {
    // Subscribe
    subscribeToLocation(locationId);
    subscribedLocations.value.add(locationId);
    console.log(`📍 Subscribed to location: ${locationId}`);
  }
};

// Styling functions
const getLocationCardStyle = (status) => {
  switch (status) {
    case 'BAHAYA':
      return 'bg-red-50 border-red-500';
    case 'SIAGA':
      return 'bg-orange-50 border-orange-500';
    case 'WASPADA':
      return 'bg-yellow-50 border-yellow-500';
    case 'AMAN':
      return 'bg-green-50 border-green-500';
    default:
      return 'bg-gray-50 border-gray-400';
  }
};

const getStatusBadgeStyle = (status) => {
  switch (status) {
    case 'BAHAYA':
      return 'bg-red-100 text-red-800 border border-red-200';
    case 'SIAGA':
      return 'bg-orange-100 text-orange-800 border border-orange-200';
    case 'WASPADA':
      return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    case 'AMAN':
      return 'bg-green-100 text-green-800 border border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border border-gray-200';
  }
};

const getProgressBarColor = (status) => {
  switch (status) {
    case 'BAHAYA':
      return 'bg-red-500';
    case 'SIAGA':
      return 'bg-orange-500';
    case 'WASPADA':
      return 'bg-yellow-500';
    case 'AMAN':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
};

// Helper functions
const getMaxThreshold = (location) => {
  return location.bahayaMin || location.siagaMax || location.waspadaMax || location.amanMax || 200;
};

const calculateProgress = (location) => {
  const waterLevel = location.currentWaterLevel || 0;
  const maxThreshold = getMaxThreshold(location);

  if (maxThreshold === 0) return 0;

  const progress = (waterLevel / maxThreshold) * 100;
  return Math.min(progress, 100);
};
</script>

<style scoped>
.scrollbar-hidden {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.scrollbar-hidden::-webkit-scrollbar {
  display: none;
}

.transition-all {
  transition: all 0.3s ease-in-out;
}

.hover\:shadow-md:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
