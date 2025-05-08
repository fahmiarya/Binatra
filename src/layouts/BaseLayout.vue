<script setup>
import BaseHeader from '@/components/shared/BaseHeader.vue';
import BaseSidebar from '@/components/shared/BaseSidebar.vue';
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <!-- Header (Full Width) -->
    <BaseHeader/>

    <div class="flex flex-1">
      <!-- Sidebar -->
     <BaseSidebar/>
      <!-- Main Content -->
      <div class="flex-1">
         <slot/>
      </div>
    </div>
  </div>
</template>
