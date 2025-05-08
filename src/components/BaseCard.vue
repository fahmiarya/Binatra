<!-- BaseCard.vue -->
<script setup>
defineProps({
  title: String,
  location: String,
  value: String,
  subValue: String,
  description: String,
  icon: String,
  iconComponent: Object,
  hasArrow: {
    type: Boolean,
    default: true
  },
  customClass: String
})
</script>

<template>
  <div class="bg-white rounded-[20px] shadow-xl p-4 relative" :class="customClass">
    <div class="flex justify-between items-start">
      <div>
        <h3 class="text-xl font-medium text-gray-700">{{ title }}</h3>
        <p v-if="location" class="text-sm text-gray-500 mt-1">{{ location }}</p>

        <div v-if="value" class="mt-2">
          <span class="text-2xl font-bold">{{ value }}</span>
          <span v-if="subValue" class="text-xs text-gray-500 ml-2">{{ subValue }}</span>
        </div>

        <p v-if="description" class="text-sm text-gray-500 mt-1">{{ description }}</p>

        <slot name="content"></slot>
      </div>

      <div v-if="icon || $slots.icon">
        <img v-if="icon" :src="icon" alt="Icon" class="h-16 w-16">
        <component v-else-if="iconComponent" :is="iconComponent" />
        <slot v-else name="icon"></slot>
      </div>
    </div>

    <button v-if="hasArrow" class="absolute top-4 right-4 text-gray-400">
      <i class="fas fa-chevron-right"></i>
    </button>

    <slot></slot>
  </div>
</template>
