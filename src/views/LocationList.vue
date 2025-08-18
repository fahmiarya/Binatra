<script setup>
import Column from 'primevue/column';
import Tag from '@/components/ui/Tag.vue';
import { Icon } from "@iconify/vue";
import BaseCard from '@/components/ui/BaseCard.vue';
import { onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { capitalizeFirstLetter } from '@/lib/utils';
import BaseTable from '@/components/ui/BaseTable.vue';
import InputText from '@/components/ui/InputText.vue';
import BaseSelect from '@/components/ui/BaseSelect.vue';
import BaseButton from '@/components/ui/BaseButton.vue'
import { debounce } from 'lodash';
import { useLocationStore } from '@/stores/locationStore';
import { useRouter } from 'vue-router';

const store = useLocationStore()
const { locations, pagination, loadArr } = storeToRefs(store)
const searchInput = ref('')
const router = useRouter()

const emits = defineEmits(['add'])

const rowsPerPage = ref([
  { name: '10', value: 10 },
  { name: '25', value: 25 },
  { name: '50', value: 50 },
  { name: '100', value: 100 }
]);

const selectedStatus = ref({ name: 'Semua Status', status: '' },
)

const statusOptions = ref([
  { name: 'Semua Status', status: '' },
  { name: 'Aman', status: 'AMAN' },
  { name: 'Waspada', status: 'WASPADA' },
  { name: 'Siaga', status: 'SIAGA' },
  { name: 'Bahaya', status: 'BAHAYA' }
]);

const getSeverity = (status) => {
  switch (status) {
    case 'AMAN':
      return 'success';
    case 'WASPADA':
      return 'warn';
    case 'SIAGA':
      return 'warn';
    case 'BAHAYA':
      return 'danger';
    default:
      return 'info';
  }
};


const handleSearch = debounce(async (event) => {
  const { rows, page, sortField, sortOrder } = event
  await store.fetchAllLocations(searchInput.value, rows, page + 1, selectedStatus.value.status, sortField, sortOrder )
}, 500)

const fetchAllDevice = async (event) => {
  const { rows, page, sortField, sortOrder } = event
  await store.fetchAllLocations(searchInput.value, rows, page + 1, selectedStatus.value.status, sortField, sortOrder )
}

onMounted(async () => {
  await store.fetchAllLocations()
})
</script>

<template>
  <BaseCard title="Daftar Lokasi" class="h-fit w-full">
    <BaseTable
    paginator
    lazy
    :value="locations"
    :loading="loadArr.includes('GET_ALL_LOCATIONS')"
    :row-options="rowsPerPage"
    :rows="pagination.limit"
    selectionMode="single"
    :total-records="pagination.totalItems"
    class="mt-2"
    @page="fetchAllDevice($event)"
    @update:rows="fetchAllDevice($event)"
    @sort="fetchAllDevice($event)"
    >
      <template #header>
        <div class="flex gap-x-5 justify-end">
          <!-- Search -->
          <div class="relative">
            <InputText v-model="searchInput" @input="handleSearch($event)" placeholder="Cari Lokasi" />
          </div>

          <!-- Status Filter -->
          <div class="relative">
            <BaseSelect
              v-model="selectedStatus"
              :options="statusOptions"
              optionLabel="name"
              @change="fetchAllDevice($event)"
            />
          </div>

          <!-- Add Button -->
          <div class="relative">
            <BaseButton label="Tambah Lokasi" @click="emits('add', 'mdi:map')" />
          </div>
        </div>
      </template>
      <template #empty>
        <div class="p-4 text-center font-medium">Device Tidak Ditemukan.</div>
      </template>
      <Column field="id" sortable header="id"></Column>
      <Column field="name" header="Nama Lokasi"></Column>
      <Column field="device" header="Device">
        <template #body="{ data }">
          {{ data.device?.name || 'Belum ada device' }}
        </template>
      </Column>
      <Column field="currentStatus" header="Status">
          <template #body="{ data }">
            <Tag :value="capitalizeFirstLetter(data.currentStatus.toLowerCase())" :severity="getSeverity(data.currentStatus)" />
          </template>
        </Column>
      <!-- <Column field="updatedAt" header="Update Terakhir">
        <template #body="{ data }">
          {{ formatDate(data.updatedAt) }}
        </template>
      </Column> -->
      <Column field="actions" header="Actions">
        <template #body="{ data }">
          <div class="flex items-center gap-2">
            <Icon icon="mdi:trash-outline" class="text-3xl text-red-500 hover:text-red-600 cursor-pointer"
              @click="store.deleteLocation(data.id)" />
            <Icon icon="mdi:edit-outline" class="text-3xl text-yellow-500 hover:text-yellow-600 cursor-pointer"
              @click="router.push(`/device/${data.id}`)" />
          </div>
        </template>
      </Column>
    </BaseTable>
  </BaseCard>
</template>
