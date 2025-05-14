<script setup>
import LoadingIndicator from '@/components/LoadingIndicator.vue';
import BaseHeader from '@/components/shared/BaseHeader.vue';
import BaseSidebar from '@/components/shared/BaseSidebar.vue';
import { ref, onMounted } from 'vue';

// Simulating loading process
const isLoading = ref(true);

onMounted(() => {
  // Simulating network request delay for this context as well
  setTimeout(() => {
    isLoading.value = false; // Update this based on your real data fetch
  }, 5000);
});
</script>

<template>
  <LoadingIndicator v-if="isLoading" />


  <div v-else class="flex flex-col min-h-screen">
    <!-- Header (Full Width) -->
    <BaseHeader />

    <div class="flex flex-1">
      <!-- Sidebar -->
      <BaseSidebar />
      <!-- Main Content -->
      <div class="flex-1">
        <slot />
      </div>
    </div>
  </div>
</template>
