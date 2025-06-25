<template>
  <div :class="[
    'bg-white rounded-lg shadow-sm border border-gray-200 relative',
    customClass
  ]">
    <!-- Card Header -->
    <div v-if="title || hasArrow" class="flex justify-between items-center p-6 pb-2">
      <h3 v-if="title" class="text-xl font-semibold text-[#274C77]">{{ title }}</h3>
      <button v-if="hasArrow" class="text-gray-400 hover:text-gray-600 transition-colors">
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>

    <!-- Card Content -->
    <div :class="[
      title ? 'px-6 pb-6' : 'p-6'
    ]">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: ''
  },
  customClass: {
    type: String,
    default: ''
  },
  hasArrow: {
    type: Boolean,
    default: true
  },
  showTopRightArrow: {
    type: Boolean,
    default: false
  }
});
</script>
