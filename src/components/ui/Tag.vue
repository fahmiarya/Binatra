<template>
  <Tag
      unstyled
      :pt="theme"
      :ptOptions="{
          mergeProps: ptViewMerge
      }"
  >
      <template v-for="(_, slotName) in $slots" #[slotName]="slotProps">
          <slot :name="slotName" v-bind="slotProps ?? {}" />
      </template>
  </Tag>
</template>

<script setup>
import Tag from 'primevue/tag';
import { ref } from 'vue';
import { ptViewMerge } from '@/lib/utils';

defineProps({});

const theme = ref({
  root: `inline-flex items-center justify-center text-sm font-bold py-1 px-2 rounded-md gap-1 p-rounded:rounded-2xl
      bg-primary-100 text-primary-700
      p-success:bg-green-100 p-success:text-green-700
      p-info:bg-sky-100 p-info:text-sky-700
      p-warn:bg-orange-100 p-warn:text-orange-700
      p-danger:bg-red-100 p-danger:text-red-700
      p-secondary:bg-surface-100 p-secondary:text-surface-600
      p-contrast:bg-surface-950 p-contrast:text-surface-0`,
  icon: `text-xs w-3 h-3`
});
</script>
