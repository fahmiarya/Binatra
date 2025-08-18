<template>
  <SelectButton
      unstyled
      :pt="theme"
      :ptOptions="{
          mergeProps: ptViewMerge
      }"
  >
      <template v-for="(_, slotName) in $slots" #[slotName]="slotProps">
          <slot :name="slotName" v-bind="slotProps ?? {}" />
      </template>
  </SelectButton>
</template>

<script setup>
import SelectButton from 'primevue/selectbutton';
import { ref } from 'vue';
import { ptViewMerge } from '@/lib/utils';

defineProps({});

const theme = ref({
  root: `inline-flex select-none rounded-md
      p-invalid:outline p-invalid:outline-offset-0 p-invalid:outline-red-400`,
  pcToggleButton: {
    root: `inline-flex items-center justify-center overflow-hidden relative cursor-pointer select-none grow
        border border-surface-100
        rounded-none first:rounded-s-md last:rounded-e-md
        bg-gray-300
        text-gray-500
        p-checked:text-surface-500
        text-base font-medium
        focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-primary focus-visible:relative focus-visible:z-10
        disabled:cursor-default
        disabled:bg-surface-200 disabled:border-surface-200 disabled:text-surface-500
        p-invalid:border-red-400
        transition-colors duration-200
        p-1 p-small:text-sm p-large:text-lg`,
    content: `relative flex-auto inline-flex items-center justify-center gap-2 py-1 px-3
        rounded-md transition-colors duration-200
        p-checked:bg-surface-0 p-checked:shadow-[0px_1px_2px_0px_rgba(0,0,0,0.02),0px_1px_2px_0px_rgba(0,0,0,0.04)]`,
    icon: `text-current p-checked:text-surface-700 transition-colors duration-200`,
    label: ``
  }
});

</script>
