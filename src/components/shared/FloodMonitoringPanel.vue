<template>
  <!-- Panel tetap untuk monitoring banjir -->
  <div class="w-1/3 flex flex-col gap-10">
    <!-- Notifications Card -->
    <BaseCard title="Peringatan Banjir" customClass="h-[350px] scrollbar-hidden">
      <div class="mt-4 space-y-4 overflow-y-auto max-h-64" @scroll="handleNotificationScroll" ref="notificationScrollContainer">
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

        <!-- Loading indicator for notifications -->
        <div v-if="locationStore.isLoadingHistory" class="flex justify-center py-2">
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <span class="ml-2 text-xs text-gray-500">Memuat lebih banyak...</span>
        </div>

        <!-- Error state for notifications -->
        <div v-if="locationStore.historyError" class="text-center py-4 text-red-500 text-xs">
          <p>Error: {{ locationStore.historyError }}</p>
          <button @click="refreshNotifications" class="mt-2 px-3 py-1 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200">
            Coba Lagi
          </button>
        </div>
      </div>
    </BaseCard>

    <!-- Alert Locations Card -->
    <BaseCard title="Lokasi Dengan Status Waspada" :hasArrow="false" customClass="flex-grow">
      <div class="space-y-3 mt-4 scrollbar-hidden overflow-y-auto max-h-screen" @scroll="handleLocationScroll" ref="locationScrollContainer">

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
              <span>Aman</span>
              <span>Waspada</span>
              <span>Siaga</span>
              <span>Bahaya</span>
            </div>
          </div>
        </div>

        <!-- Loading more locations indicator -->
        <div v-if="loadingMoreLocations" class="flex justify-center items-center py-4">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span class="ml-2 text-gray-500">Memuat lebih banyak lokasi...</span>
        </div>

        <!-- Empty state -->
        <div v-if="!loading && floodLocations.length === 0"
             class="text-center py-8 text-gray-500">
          <p>Tidak ada data lokasi dengan status peringatan</p>
        </div>

        <!-- End of data indicator -->
        <div v-if="locationStore.hasReachedEnd && floodNotifications.length > 0"
             class="text-center py-4 text-gray-400 text-xs">
          <p>— Semua data telah dimuat —</p>
        </div>
      </div>
    </BaseCard>
  </div>
</template>

<script setup>
import BaseCard from '@/components/ui/BaseCard.vue';
import { useFloodSocket } from '@/composables/useFloodSocket.js';
import { formatHistoryTime } from '@/lib/formaters';
import { useLocationStore } from '@/stores/locationStore.js';
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';

// Store
const locationStore = useLocationStore();

// Socket composable
const {
  floodLocations,
  recentlyUpdatedLocations,
  loading,
  formatLastUpdate,
  currentLocationStatus,
} = useFloodSocket();

// Local state
const loadingMoreLocations = ref(false);

// Scroll containers
const notificationScrollContainer = ref(null);
const locationScrollContainer = ref(null);

// Props
const props = defineProps({
  floodNotifications: {
    type: Array,
    default: () => []
  },
  alertLocations: {
    type: Array,
    default: () => []
  }
});

const floodNotifications = computed(() => {
  // Combine props notifications dengan history dari store
  const historyNotifications = locationStore.locationStatusHistory.map(history => ({
    id: `history-${history.id}`,
    title: formatNotificationTitle(history),
    location: history.location?.district || history.location?.name || 'Unknown',
    timeframe: formatTimeframe(history),
    timeAgo: formatHistoryTime(history.changedAt),
    severity: getSeverityFromStatus(history.newStatus),
    type: 'status_change',
    waterLevel: history.waterLevel,
    rainfall: history.rainfall
  }));

  return [...props.floodNotifications, ...historyNotifications];
});

// Infinite Scroll Handlers
const handleNotificationScroll = async (event) => {
  const container = event.target;
  const { scrollTop, scrollHeight, clientHeight } = container;

  // Check if near bottom (within 100px)
  if (scrollTop + clientHeight >= scrollHeight - 100) {
    if (!locationStore.isLoadingHistory && !locationStore.hasReachedEnd) {
      await loadMoreNotifications();
    }
  }
};

const handleLocationScroll = async (event) => {
  const container = event.target;
  const { scrollTop, scrollHeight, clientHeight } = container;

  // Check if near bottom (within 100px)
  if (scrollTop + clientHeight >= scrollHeight - 100) {
    if (!loadingMoreLocations.value) {
      await loadMoreLocations();
    }
  }
};

const loadMoreNotifications = async () => {
  try {
    const success = await locationStore.loadMoreHistory();
    if (!success) {
      console.error('Failed to load more notifications');
    }
  } catch (error) {
    console.error('Error loading more notifications:', error);
  }
};

const loadMoreLocations = async () => {
  if (loadingMoreLocations.value) return;

  loadingMoreLocations.value = true;

  try {
    // Jika ada API untuk locations, panggil di sini
    // const moreLocations = await fetchMoreLocations();
    // floodLocations.value.push(...moreLocations);

    // Untuk sekarang, simulasi delay
    await new Promise(resolve => setTimeout(resolve, 1000));

  } catch (error) {
    console.error('Error loading more locations:', error);
  } finally {
    loadingMoreLocations.value = false;
  }
};

// Refresh notifications
const refreshNotifications = async () => {
  try {
    await locationStore.refreshHistory();
  } catch (error) {
    console.error('Error refreshing notifications:', error);
  }
};

// Helper functions
const formatNotificationTitle = (history) => {
  const status = history.newStatus;
  const waterLevel = history.waterLevel || 0;

  switch (status) {
    case 'BAHAYA':
      return `Banjir Ketinggian ${waterLevel}cm`;
    case 'SIAGA':
      return `Siaga Ketinggian ${waterLevel}cm`;
    case 'WASPADA':
      return `Waspada Ketinggian ${waterLevel}cm`;
    case 'AMAN':
      return `Status Aman ${waterLevel}cm`;
    default:
      return `Status ${status} ${waterLevel}cm`;
  }
};


const formatTimeframe = (history) => {
  const duration = history.duration || 0;

  // Jika duration 0 atau tidak ada, gunakan format alternatif
  if (duration === 0 || !duration) {
    return `status berubah`;
  }

  if (duration < 60) {
    return `dalam ${duration} minutes`;
  } else if (duration < 1440) {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return minutes > 0 ? `dalam ${hours}h ${minutes}m` : `dalam ${hours} hours`;
  } else {
    const days = Math.floor(duration / 1440);
    return `dalam ${days} days`;
  }
};

const getSeverityFromStatus = (status) => {
  switch (status) {
    case 'BAHAYA': return 'high';
    case 'SIAGA': return 'high';
    case 'WASPADA': return 'medium';
    case 'AMAN': return 'low';
    default: return 'low';
  }
};

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

// Helper functions (tetap sama)
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

// Watch untuk real-time updates
watch(() => currentLocationStatus.value, (newValue) => {
  if (!newValue) return;

  // Tambahkan ke store history
  locationStore.addHistoryItem(newValue);

  console.log('📡 Real-time update received and added to store:', newValue);
}, {
  immediate: true
});

// Lifecycle
onMounted(async () => {
  console.log('🚀 Component mounted - Loading initial data');

  // Load initial data from store
  await locationStore.fetchLocationStatusHistory(1, locationStore.pageSize);

  console.log('✅ Initial data loaded from store');
});

// Cleanup
onUnmounted(() => {
  // Cleanup jika diperlukan
});
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
