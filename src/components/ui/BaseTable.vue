<template>
  <DataTable ref="el" unstyled :pt="theme" :ptOptions="{
    mergeProps: ptViewMerge
  }">
    <template
      #paginatorcontainer="{ first, rows, page, pageCount, pageLinks, totalRecords, changePageCallback, firstPageCallback, lastPageCallback, prevPageCallback, nextPageCallback, rowChangeCallback }">
      <div class="flex flex-col sm:flex-row items-center justify-end w-full">
        <div class="flex items-center">
          <SecondaryButton text rounded @click="prevPageCallback" :disabled="page === 0">
            <template #icon>
              <AngleLeftIcon />
            </template>
          </SecondaryButton>
          <div class="text-center text-surface-500">{{ page + 1 }} of {{ pageCount }}</div>
          <SecondaryButton text rounded @click="nextPageCallback" :disabled="page === pageCount - 1">
            <template #icon>
              <AngleRightIcon />
            </template>
          </SecondaryButton>
        </div>
        <div class="flex gap-2 items-center">
          <span class="select-none w-32 text-end">{{ first }} - {{ first - 1 + rows }} of {{ totalRecords }}</span>
          <BaseSelect
            :modelValue="rows"
            :options="props.rowOptions"
            optionLabel="name"
            optionValue="value"
            pt:label="pe-2"
            pt:dropdown="w-8"
            @change="(event) => rowChangeCallback(event.value)" />
        </div>
      </div>
    </template>
    <template #loadingicon>
      <SpinnerIcon class="animate-spin text-[2rem] w-8 h-8" />
    </template>
    <template v-for="(_, slotName) in $slots" #[slotName]="slotProps">
      <slot :name="slotName" v-bind="slotProps ?? {}" />
    </template>
  </DataTable>
</template>

<script setup>
import AngleLeftIcon from '@primevue/icons/angleleft';
import AngleRightIcon from '@primevue/icons/angleright';
import SpinnerIcon from '@primevue/icons/spinner';
import DataTable from 'primevue/datatable';
import { ref } from 'vue';
import SecondaryButton from './SecondaryButton.vue';
import { ptViewMerge } from '@/lib/utils';
import BaseSelect from '@/components/ui/BaseSelect.vue';

const props = defineProps({
  rowOptions : {
    type : Array,
    default : () => []
  }
});

const theme = ref({
  root: `relative p-flex-scrollable:flex p-flex-scrollable:flex-col p-flex-scrollable:h-full`,
  tableContainer: `p-scrollable:relative p-flex-scrollable:flex p-flex-scrollable:flex-col p-flex-scrollable:flex-1 p-flex-scrollable:h-full`,
  header: `py-3 px-4 border-b border-surface-200
      text-white transition-colors duration-200`,
  table: `border-spacing-0 w-full border-separate`,
  thead: `p-scrollable:bg-surface-0 p-scrollable:top-0 p-scrollable:z-10`,
  tbody: `p-hoverable:*:hover:bg-surface-100 p-hoverable:*:hover:text-surface-800
      p-frozen:sticky p-frozen:z-10`,
  bodyRow: `bg-surface-0 text-surface-700 p-selectable:cursor-pointer p-selected:bg-highlight`,
  tfoot: `p-scrollable:bg-surface-0 p-scrollable:bottom-0 p-scrollable:z-10`,
  footer: `py-3 px-4 border-b border-surface-200
      bg-surface-0
      text-surface-700`,
  mask: `text-white absolute z-10 flex items-center justify-center w-full h-full backdrop-blur-md`,
  column: {
    root: ``,
    headerCell: `group py-3 px-4 font-normal text-start transition-colors duration-200
          border-b border-[#274C77]
          bg-[#274C77] hover:bg-[#3f5773]
          text-white
          p-sortable:cursor-pointer p-sortable:select-none
          p-sortable:focus-visible:outline
          p-sortable:focus-visible:outline-1
          p-sortable:focus-visible:-outline-offset-1
          p-sortable:focus-visible:outline-[#274C77]
          p-sorted:bg-[#274C77]
          p-frozen:sticky p-frozen:bg-[#274C77] p-frozen:z-10`,
    columnHeaderContent: `flex items-center gap-2`,
    columnTitle: `font-semibold`,
    bodyCell: `text-start py-3 px-4 border-b border-surface-200
          p-frozen:sticky p-frozen:bg-surface-0`,
    bodyCellContent: ``,
    footerCell: `text-start py-3 px-4 border-b border-surface-200
          bg-surface-0
          text-surface-700
          p-frozen:sticky p-frozen:bg-surface-0`,
    columnFooter: `font-semibold`,
    columnResizer: `block absolute top-0 end-0 m-0 w-2 h-full p-0 cursor-col-resize border border-transparent`,
    sort: ``,
    sortIcon: `text-white transition-colors duration-200`,
    pcSortBadge: {
      root: `rounded-full min-w-6 h-6 inline-flex items-center justify-center text-xs font-bold`
    },
    pcHeaderCheckbox: {
      root: `relative inline-flex select-none w-5 h-5 align-bottom`,
      input: `peer cursor-pointer disabled:cursor-default appearance-none
              absolute start-0 top-0 w-full h-full m-0 p-0 opacity-0 z-10
              border border-transparent rounded-xs`,
      box: `flex justify-center items-center rounded-sm w-5 h-5
              border border-surface-300
              bg-surface-0
              text-surface-700
              peer-enabled:peer-hover:border-surface-400
              p-checked:border-primary p-checked:bg-primary p-checked:text-primary-contrast
              peer-enabled:peer-hover:p-checked:bg-primary-emphasis peer-enabled:peer-hover:p-checked:border-primary-emphasis
              peer-focus-visible:outline-1 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary peer-focus-visible:outline
              p-disabled:bg-surface-200 p-disabled:border-surface-300 p-disabled:text-surface-700
              shadow-[0_1px_2px_0_rgba(18,18,23,0.05)] transition-colors duration-200`,
      icon: `text-sm w-[0.875rem] h-[0.875rem] transition-none`
    },
    pcRowRadiobutton: {
      root: `relative inline-flex select-none w-5 h-5`,
      input: `peer cursor-pointer disabled:cursor-default appearance-none absolute start-0 top-0 w-full h-full m-0 p-0 opacity-0 z-10
              border border-transparent rounded-full`,
      box: `flex justify-center items-center rounded-full
              border border-surface-300
              bg-surface-0
              peer-enabled:peer-hover:border-surface-400
              p-checked:border-primary p-checked:bg-primary
              peer-enabled:peer-hover:p-checked:bg-primary-emphasis peer-enabled:peer-hover:p-checked:border-primary-emphasis
              peer-focus-visible:outline-1 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary peer-focus-visible:outline
              p-filled:bg-surface-50
              p-invalid:border-red-400
              p-disabled:bg-surface-200 p-disabled:border-surface-300
              shadow-[0_1px_2px_0_rgba(18,18,23,0.05)] transition-colors duration-200
              w-5 h-5`,
      icon: `bg-transparent text-xs w-3 h-3 rounded-full
              transition-all duration-200 backface-hidden scale-[0.1]
              p-checked:bg-primary-contrast p-checked:visible p-checked:scale-100
              p-disabled:bg-surface-700`
    },
    pcRowCheckbox: {
      root: `relative inline-flex select-none w-5 h-5 align-bottom`,
      input: `peer cursor-pointer disabled:cursor-default appearance-none
              absolute start-0 top-0 w-full h-full m-0 p-0 opacity-0 z-10
              border border-transparent rounded-xs`,
      box: `flex justify-center items-center rounded-sm w-5 h-5
              border border-surface-300
              bg-surface-0
              text-surface-700
              peer-enabled:peer-hover:border-surface-400
              p-checked:border-primary p-checked:bg-primary p-checked:text-primary-contrast
              peer-enabled:peer-hover:p-checked:bg-primary-emphasis peer-enabled:peer-hover:p-checked:border-primary-emphasis
              peer-focus-visible:outline-1 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary peer-focus-visible:outline
              p-disabled:bg-surface-200 p-disabled:border-surface-300 p-disabled:text-surface-700
              shadow-[0_1px_2px_0_rgba(18,18,23,0.05)] transition-colors duration-200`,
      icon: `text-sm w-[0.875rem] h-[0.875rem] transition-none`
    },
    rowToggleButton: `inline-flex items-center justify-center overflow-hidden relative w-7 h-7 cursor-pointer select-none
          transition-colors duration-200 rounded-full border-none bg-transparent
          text-surface-500 enabled:hover:bg-surface-100 enabled:hover:text-surface-700
          focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-primary
          p-selected:hover:bg-surface-500 p-selected:hover:text-primary`,
    rowToggleIcon: ``,
    reorderableRowHandle: ``
  },
  loadingIcon: ``,
  pcPaginator: {
    paginatorContainer: ``,
    root: `flex items-center justify-center flex-wrap py-2 px-4 rounded-md gap-1
          bg-surface-0 text-surface-700`
  },
  columnResizeIndicator: `w-px absolute z-10 hidden bg-primary`,
  rowReorderIndicatorUp: `absolute hidden`,
  rowReorderIndicatorDown: `absolute hidden`
});


const el = ref();
defineExpose({
  exportCSV: () => el.value.exportCSV()
});
</script>
