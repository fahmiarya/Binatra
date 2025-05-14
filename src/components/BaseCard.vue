<!-- BaseCard.vue -->
<script setup>
defineProps({
  title: String,
  location: String,
  value: String,
  subValue: String,
  description: String,
  icon: String,
  hasArrow: {
    type: Boolean,
    default: true
  },
  customClass: String
})
</script>

<template>
  <div class="bg-white rounded-[20px] shadow-lg p-4 relative" :class="customClass">
    <div class="flex justify-between items-start">
      <div>
        <h3 class="text-lg font-semibold text-[#274C77]">{{ title }}</h3>

        <slot name="location">
          <p v-if="location" class="text-sm text-gray-500 mt-1">{{ location }}</p>
        </slot>

        <slot name="value">
          <div v-if="value" class="mt-2">
            <span class="text-2xl font-bold">{{ value }}</span>
            <span v-if="subValue" class="text-xs text-gray-500 ml-2">{{ subValue }}</span>
          </div>
        </slot>

        <p v-if="description" class="text-sm text-gray-500 mt-1">{{ description }}</p>
      </div>

      <div v-if="icon || $slots.icon">
        <img v-if="icon" :src="icon" alt="Icon" class="h-16 w-16">
        <slot v-else name="icon"></slot>
      </div>
    </div>
    <slot></slot>
  </div>
</template>
