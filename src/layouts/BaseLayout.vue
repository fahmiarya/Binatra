<template>
  <LoadingIndicator v-if="isLoading" />

  <div v-else class="flex flex-col min-h-screen">
    <!-- Header (Full Width) -->
    <BaseHeader />

    <div class="flex flex-1">
      <!-- Sidebar -->
      <BaseSidebar />

      <!-- Main Content -->
      <div class="flex-1 relative">
        <slot />
      </div>
    </div>

    <!-- Flood Alert Panel - Fixed position overlay -->
    <FloodAlertPanel
      :alerts="floodAlerts"
      :locations="riskLocations"
    />
  </div>
</template>

<script setup>
import LoadingIndicator from '@/components/LoadingIndicator.vue';
import BaseHeader from '@/components/shared/BaseHeader.vue';
import BaseSidebar from '@/components/shared/BaseSidebar.vue';
import FloodAlertPanel from '@/components/shared/FloodAlertPanel.vue';
import { ref, onMounted } from 'vue';

// Simulating loading process
const isLoading = ref(true);

// Flood alert data - you can populate this from your store or API
const floodAlerts = ref([
  {
    id: 1,
    location: 'Ketintang',
    waterLevel: 25,
    severity: 'HIGH',
    description: 'Banjir Ketinggian 25cm dalam 20 minutes',
    timestamp: new Date(Date.now() - 16 * 60 * 1000)
  },
  {
    id: 2,
    location: 'Jambangan',
    waterLevel: 5,
    severity: 'LOW',
    description: 'Banjir Ketinggian 5cm dalam 15 minutes',
    timestamp: new Date(Date.now() - 8 * 60 * 1000)
  },
  {
    id: 3,
    location: 'Ketintang',
    waterLevel: 10,
    severity: 'MEDIUM',
    description: 'Banjir Ketinggian 10cm dalam 10 minutes',
    timestamp: new Date(Date.now() - 1 * 60 * 1000)
  }
]);

const riskLocations = ref([
  {
    id: 1,
    name: 'Gubeng',
    currentLevel: 18,
    riskLevel: 'WATCH',
    prediction: 'Water level rising, monitor closely',
    lastUpdated: new Date(Date.now() - 5 * 60 * 1000)
  },
  {
    id: 2,
    name: 'Sukolilo',
    currentLevel: 12,
    riskLevel: 'ADVISORY',
    prediction: 'Stable conditions, routine monitoring',
    lastUpdated: new Date(Date.now() - 10 * 60 * 1000)
  },
  {
    id: 3,
    name: 'Rungkut',
    currentLevel: 22,
    riskLevel: 'WATCH',
    prediction: 'Approaching warning level',
    lastUpdated: new Date(Date.now() - 3 * 60 * 1000)
  }
]);

onMounted(() => {
  // Simulating network request delay
  setTimeout(() => {
    isLoading.value = false;
  }, 2000); // Reduced from 5000 to 2000 for better UX
});

// Optional: Expose methods to update flood data from parent components
const updateFloodAlerts = (newAlerts) => {
  floodAlerts.value = newAlerts;
};

const updateRiskLocations = (newLocations) => {
  riskLocations.value = newLocations;
};

// Export methods for parent components to use
defineExpose({
  updateFloodAlerts,
  updateRiskLocations
});
</script>
