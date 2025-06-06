<template>
  <div class="fixed bottom-4 right-4 w-80 z-50">
    <!-- Toggle Button -->
    <button
      @click="togglePanel"
      class="absolute -top-12 right-0 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-t-lg shadow-lg transition-colors flex items-center gap-2"
    >
      <i class="fas fa-exclamation-triangle"></i>
      <span>Flood Alerts</span>
      <span v-if="totalAlerts > 0" class="bg-white text-red-500 rounded-full px-2 py-1 text-xs font-bold">
        {{ totalAlerts }}
      </span>
    </button>

    <!-- Panel Content -->
    <div v-show="isOpen" class="bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-hidden">
      <!-- Panel Header -->
      <div class="bg-red-50 px-4 py-3 border-b border-red-100">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold text-red-700">Flood Alert System</h3>
          <button @click="togglePanel" class="text-gray-500 hover:text-gray-700">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-gray-200">
        <button
          @click="activeTab = 'alerts'"
          :class="[
            'flex-1 px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'alerts'
              ? 'bg-red-500 text-white'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
          ]"
        >
          Active Alerts ({{ floodAlerts.length }})
        </button>
        <button
          @click="activeTab = 'locations'"
          :class="[
            'flex-1 px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'locations'
              ? 'bg-yellow-500 text-white'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
          ]"
        >
          Risk Locations ({{ riskLocations.length }})
        </button>
      </div>

      <!-- Tab Content -->
      <div class="max-h-64 overflow-y-auto">
        <!-- Flood Alerts Tab -->
        <div v-if="activeTab === 'alerts'" class="p-4">
          <div v-if="floodAlerts.length === 0" class="text-center text-gray-500 py-8">
            <i class="fas fa-check-circle text-green-500 text-3xl mb-2"></i>
            <p>No active flood alerts</p>
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="alert in floodAlerts"
              :key="alert.id"
              class="flex items-start gap-3 p-3 rounded-lg border border-red-200 bg-red-50"
            >
              <div :class="[
                'w-3 h-3 rounded-full mt-1 flex-shrink-0',
                getSeverityColor(alert.severity)
              ]"></div>
              <div class="flex-1">
                <div class="flex justify-between items-start mb-1">
                  <h4 class="font-medium text-red-800">{{ alert.location }}</h4>
                  <span class="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                    {{ alert.severity }}
                  </span>
                </div>
                <p class="text-sm text-red-700 mb-1">
                  Water Level: {{ alert.waterLevel }}cm
                </p>
                <p class="text-sm text-red-600">
                  {{ alert.description }}
                </p>
                <p class="text-xs text-red-500 mt-2">
                  {{ formatTime(alert.timestamp) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Risk Locations Tab -->
        <div v-if="activeTab === 'locations'" class="p-4">
          <div v-if="riskLocations.length === 0" class="text-center text-gray-500 py-8">
            <i class="fas fa-shield-alt text-green-500 text-3xl mb-2"></i>
            <p>All locations are safe</p>
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="location in riskLocations"
              :key="location.id"
              class="flex items-start gap-3 p-3 rounded-lg border border-yellow-200 bg-yellow-50"
            >
              <div :class="[
                'w-3 h-3 rounded-full mt-1 flex-shrink-0',
                getRiskLevelColor(location.riskLevel)
              ]"></div>
              <div class="flex-1">
                <div class="flex justify-between items-start mb-1">
                  <h4 class="font-medium text-yellow-800">{{ location.name }}</h4>
                  <span class="text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                    {{ location.riskLevel }}
                  </span>
                </div>
                <p class="text-sm text-yellow-700 mb-1">
                  Current Level: {{ location.currentLevel }}cm
                </p>
                <p class="text-sm text-yellow-600">
                  {{ location.prediction }}
                </p>
                <p class="text-xs text-yellow-500 mt-2">
                  Last Updated: {{ formatTime(location.lastUpdated) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Panel Footer -->
      <div class="bg-gray-50 px-4 py-3 border-t border-gray-200">
        <div class="flex justify-between items-center text-xs text-gray-600">
          <span>Last updated: {{ formatTime(lastUpdated) }}</span>
          <button class="text-blue-600 hover:text-blue-800 font-medium">
            View Details
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

// Component state
const isOpen = ref(false);
const activeTab = ref('alerts');
const lastUpdated = ref(new Date());

// Sample data - replace with your actual data source
const floodAlerts = ref([
  {
    id: 1,
    location: 'Ketintang',
    waterLevel: 25,
    severity: 'HIGH',
    description: 'Flood expected in 20 minutes',
    timestamp: new Date(Date.now() - 16 * 60 * 1000) // 16 minutes ago
  },
  {
    id: 2,
    location: 'Jambangan',
    waterLevel: 15,
    severity: 'MEDIUM',
    description: 'Flood expected in 15 minutes',
    timestamp: new Date(Date.now() - 8 * 60 * 1000) // 8 minutes ago
  },
  {
    id: 3,
    location: 'Wonokromo',
    waterLevel: 10,
    severity: 'LOW',
    description: 'Flood expected in 30 minutes',
    timestamp: new Date(Date.now() - 1 * 60 * 1000) // 1 minute ago
  }
]);

const riskLocations = ref([
  {
    id: 1,
    name: 'Gubeng',
    currentLevel: 18,
    riskLevel: 'WATCH',
    prediction: 'Water level rising slowly',
    lastUpdated: new Date(Date.now() - 5 * 60 * 1000)
  },
  {
    id: 2,
    name: 'Sukolilo',
    currentLevel: 12,
    riskLevel: 'ADVISORY',
    prediction: 'Stable water level',
    lastUpdated: new Date(Date.now() - 10 * 60 * 1000)
  },
  {
    id: 3,
    name: 'Rungkut',
    currentLevel: 22,
    riskLevel: 'WATCH',
    prediction: 'Potential flooding in 45 minutes',
    lastUpdated: new Date(Date.now() - 3 * 60 * 1000)
  }
]);

// Computed properties
const totalAlerts = computed(() => {
  return floodAlerts.value.length + riskLocations.value.filter(loc => loc.riskLevel === 'WATCH').length;
});

// Methods
const togglePanel = () => {
  isOpen.value = !isOpen.value;
};

const getSeverityColor = (severity) => {
  switch (severity) {
    case 'HIGH': return 'bg-red-500';
    case 'MEDIUM': return 'bg-yellow-500';
    case 'LOW': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
};

const getRiskLevelColor = (riskLevel) => {
  switch (riskLevel) {
    case 'WATCH': return 'bg-yellow-500';
    case 'ADVISORY': return 'bg-blue-500';
    case 'WARNING': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

const formatTime = (date) => {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000 / 60); // difference in minutes

  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff} min ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)} hour${Math.floor(diff / 60) > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
};

// Props to accept external data
const props = defineProps({
  alerts: {
    type: Array,
    default: () => []
  },
  locations: {
    type: Array,
    default: () => []
  }
});

// Update data when props change
onMounted(() => {
  if (props.alerts.length > 0) {
    floodAlerts.value = props.alerts;
  }
  if (props.locations.length > 0) {
    riskLocations.value = props.locations;
  }
});
</script>

<style scoped>
/* Custom scrollbar for better UX */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
