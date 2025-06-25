<template>
  <!-- <LoadingIndicator v-if="isLoading" /> -->

  <div class="flex flex-col min-h-screen">
    <!-- Header (Full Width) -->
    <BaseHeader />

    <div class="flex flex-1">
      <!-- Sidebar -->
      <BaseSidebar />

      <!-- Main Content with Panel -->
      <div class="flex-1 relative flex bg-[#E7ECEF] pt-6">
        <!-- Main Content Area -->
        <div class="flex-1 px-6 pb-1 w-full flex gap-10">
          <slot />
        </div>

        <!-- Flood Monitoring Panel (Optional) -->
        <FloodMonitoringPanel
          :floodNotifications="floodNotifications"
          :alertLocations="alertLocations"
          @location-updated="handleLocationUpdate"
          @notification-added="handleNotificationAdd"
          class="pr-3"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import LoadingIndicator from '@/components/LoadingIndicator.vue';
import BaseHeader from '@/components/shared/BaseHeader.vue';
import BaseSidebar from '@/components/shared/BaseSidebar.vue';
import FloodMonitoringPanel from '@/components/shared/FloodMonitoringPanel.vue';
import { ref, onMounted } from 'vue';

// Emits
const emit = defineEmits(['flood-data-updated']);

// Simulating loading process
const isLoading = ref(true);


// Methods
const handleLocationUpdate = (locationData) => {
  emit('flood-data-updated', { type: 'location', data: locationData });
};
</script>
