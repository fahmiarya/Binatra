<script setup>
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout.vue';
import Column from 'primevue/column';
import Tag from '@/components/ui/Tag.vue';
import { Icon } from "@iconify/vue";
import BaseCard from '@/components/ui/BaseCard.vue';
import { useDeviceStore } from '@/stores/deviceStore';
import { onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { capitalizeFirstLetter, formatDate } from '@/lib/utils';
import { useRouter } from 'vue-router';
import BaseTable from '@/components/ui/BaseTable.vue';
import InputText from '@/components/ui/InputText.vue';
import BaseSelect from '@/components/ui/BaseSelect.vue';
import { debounce } from 'lodash';

const store = useDeviceStore()
const { devices, pagination, loadArr } = storeToRefs(store)
const router = useRouter()


const searchInput = ref('')
const selectedStatus = ref({ name: 'Semua Status', status: '' },
)

const statusOptions = ref([
  { name: 'Semua Status', status: '' },
  { name: 'Connected', status: 'CONNECTED' },
  { name: 'Disconnected', status: 'DISCONNECTED' }
]);

const rowsPerPage = ref([
  { name: '10', value: 10 },
  { name: '25', value: 25 },
  { name: '50', value: 50 },
  { name: '100', value: 100 }
]);

const getSeverity = (status) => {
  switch (status) {
    case 'DISCONNECTED':
      return 'danger';

    case 'CONNECTED':
      return 'success';

    default:
      return null;
  }
};

const handleSearch = debounce(async (event) => {
  const { rows, page, sortField, sortOrder } = event
  await store.getAllDevices(searchInput.value, rows, page + 1, selectedStatus.value.status, sortField, sortOrder )
}, 500)

const fetchAllDevice = async (event) => {
  const { rows, page, sortField, sortOrder } = event
  await store.getAllDevices(searchInput.value, rows, page + 1, selectedStatus.value.status, sortField, sortOrder )
}

onMounted(async () => {
  await store.getAllDevices()
})
</script>

<template>
  <AuthenticatedLayout>
    <BaseCard title="Daftar Alat" class="w-full h-fit">
      <BaseTable
      paginator
      lazy
      :value="devices"
      :loading="loadArr.includes('GET_ALL_DEVICES')"
      :row-options="rowsPerPage"
      :rows="pagination.limit"
      selectionMode="single"
      :total-records="pagination.totalItems"
      pt:table="min-w-200" class="mt-2"
      @page="fetchAllDevice($event)"
      @update:rows="fetchAllDevice($event)"
      @sort="fetchAllDevice($event)"
      >
        <template #header>
          <div class="flex gap-x-5 justify-end">
            <div class="relative">
              <BaseSelect v-model="selectedStatus" :options="statusOptions" optionLabel="name" @change="fetchAllDevice($event)" />
            </div>

            <div class="relative">
              <InputText v-model="searchInput" @input="handleSearch($event)" placeholder="Cari Alat" />
            </div>
          </div>
        </template>
        <template #empty>
          <div class="p-4 text-center font-medium">Device Tidak Ditemukan.</div>
        </template>
        <Column field="code" sortable header="Kode Alat"></Column>
        <Column field="status" header="Status">
          <template #body="{ data }">
            <Tag :value="capitalizeFirstLetter(data.status.toLowerCase())" :severity="getSeverity(data.status)" />
          </template>
        </Column>
        <Column field="location" header="Lokasi">
          <template #body="{ data }">
            {{ data.location.name }}
          </template>
        </Column>
        <Column field="updatedAt" header="Update Terakhir">
          <template #body="{ data }">
            {{ formatDate(data.updatedAt) }}
          </template>
        </Column>
        <Column field="actions" header="Actions">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <Icon icon="mdi:trash-outline" class="text-3xl text-red-500 hover:text-red-600 cursor-pointer"
                @click="store.deleteDevice(data.id)" />
              <Icon icon="mdi:edit-outline" class="text-3xl text-yellow-500 hover:text-yellow-600 cursor-pointer"
                @click="router.push(`/device/${data.id}`)" />
            </div>
          </template>
        </Column>
      </BaseTable>
    </BaseCard>
  </AuthenticatedLayout>
</template>
