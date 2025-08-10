<script setup>
import SpinnerIcon from '@primevue/icons/spinner'

defineProps({
  label: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <button
    :disabled="loading"
    class="cursor-pointer bg-[#516F91] hover:bg-[#425874] transition-colors px-5 py-2 rounded-lg text-white font-medium flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
  >
    <SpinnerIcon
      v-if="loading"
      class="animate-spin w-5 h-5"
    />
    <span>{{ label }}</span>
  </button>
</template>
