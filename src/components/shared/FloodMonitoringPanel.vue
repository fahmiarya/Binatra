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
        <div v-if="loadingMoreNotifications" class="flex justify-center py-2">
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <span class="ml-2 text-xs text-gray-500">Memuat lebih banyak...</span>
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
        <div v-if="hasReachedEnd && floodLocations.length > 0"
             class="text-center py-4 text-gray-400 text-xs">
          <p>— Semua data telah dimuat —</p>
        </div>
      </div>
    </BaseCard>
  </div>
</template>

<script setup>
import BaseCard from '@/components/BaseCard.vue';
import { useFloodSocket } from '@/composables/useFloodSocket.js';
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import axios from 'axios';

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

// API dan Infinite Scroll state
const API_BASE_URL = 'http://localhost:3000';
const locationStatusHistory = ref([]);
const loadingMoreNotifications = ref(false);
const loadingMoreLocations = ref(false);
const hasReachedEnd = ref(false);

// Pagination state
const currentPage = ref(1);
const pageSize = ref(10);

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

// Enhanced floodNotifications dengan data dari API
const floodNotifications = ref([...props.floodNotifications]);

// Fetch Location Status History
const fetchLocationStatusHistory = async (page = 1, limit = 10) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy: 'changedAt',
      sortOrder: 'desc'
    });

    console.log(`🔍 Fetching location status history - Page: ${page}, Limit: ${limit}`);

    const response = await axios.get(`${API_BASE_URL}/api/v1/locations/location-status-history?${params.toString()}`);

    if (response.data.success) {
      const newData = response.data.data;

      if (page === 1) {
        // Reset data jika halaman pertama
        locationStatusHistory.value = newData;
      } else {
        // Append data untuk infinite scroll
        locationStatusHistory.value.push(...newData);
      }

      // Convert to notifications format dan tambahkan ke floodNotifications
      const newNotifications = newData.map(history => ({
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

      if (page === 1) {
        // Replace notifications untuk halaman pertama
        floodNotifications.value = [...props.floodNotifications, ...newNotifications];
      } else {
        // Append untuk infinite scroll
        floodNotifications.value.push(...newNotifications);
      }

      // Check if reached end
      hasReachedEnd.value = !response.data.pagination?.hasNextPage;

      console.log(`✅ Fetched ${newData.length} history items. Total: ${locationStatusHistory.value.length}`);

      return {
        success: true,
        data: newData,
        pagination: response.data.pagination
      };

    } else {
      console.error('❌ Failed to fetch location status history:', response.data.error);
      return { success: false, error: response.data.error };
    }

  } catch (error) {
    console.error('❌ Error fetching location status history:', error);
    return { success: false, error: error.message };
  }
};

// Infinite Scroll Handlers
const handleNotificationScroll = async (event) => {
  const container = event.target;
  const { scrollTop, scrollHeight, clientHeight } = container;

  // Check if near bottom (within 100px)
  if (scrollTop + clientHeight >= scrollHeight - 100) {
    if (!loadingMoreNotifications.value && !hasReachedEnd.value) {
      await loadMoreNotifications();
    }
  }
};

const handleLocationScroll = async (event) => {
  const container = event.target;
  const { scrollTop, scrollHeight, clientHeight } = container;

  // Check if near bottom (within 100px)
  if (scrollTop + clientHeight >= scrollHeight - 100) {
    if (!loadingMoreLocations.value && !hasReachedEnd.value) {
      await loadMoreLocations();
    }
  }
};

const loadMoreNotifications = async () => {
  if (loadingMoreNotifications.value || hasReachedEnd.value) return;

  loadingMoreNotifications.value = true;
  currentPage.value += 1;

  console.log(`📄 Loading more notifications - Page: ${currentPage.value}`);

  try {
    await fetchLocationStatusHistory(currentPage.value, pageSize.value);
  } catch (error) {
    console.error('Error loading more notifications:', error);
    currentPage.value -= 1; // Rollback page number
  } finally {
    loadingMoreNotifications.value = false;
  }
};

const loadMoreLocations = async () => {
  if (loadingMoreLocations.value || hasReachedEnd.value) return;

  loadingMoreLocations.value = true;

  // Simulate loading more locations (sesuaikan dengan API lokasi Anda)
  console.log(`📍 Loading more locations...`);

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

const formatHistoryTime = (timestamp) => {
  if (!timestamp) return 'N/A';

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'baru saja';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24) return `${diffHours} hour ago`;
  if (diffDays < 7) return `${diffDays} day ago`;

  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
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

// Location subscription management
const toggleLocationSubscription = (locationId) => {
  if (subscribedLocations.value.has(locationId)) {
    unsubscribeFromLocation(locationId);
    subscribedLocations.value.delete(locationId);
    console.log(`📍 Unsubscribed from location: ${locationId}`);
  } else {
    subscribeToLocation(locationId);
    subscribedLocations.value.add(locationId);
    console.log(`📍 Subscribed to location: ${locationId}`);
  }
};

// Styling functions (tetap sama)
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

// Lifecycle
onMounted(async () => {
  console.log('🚀 Component mounted - Loading initial data');

  // Load initial data
  await fetchLocationStatusHistory(1, pageSize.value);

  console.log('✅ Initial data loaded');
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
