<script setup>
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout.vue';
import DataTable from '@/components/ui/DataTable.vue';
import Column from 'primevue/column';
import Tag from '@/components/ui/Tag.vue';
import { Icon } from "@iconify/vue";
import BaseCard from '@/components/ui/BaseCard.vue';
import { useDeviceStore } from '@/stores/deviceStore';
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { capitalizeFirstLetter, formatDate } from '@/lib/utils';
import { useRouter } from 'vue-router';

const store = useDeviceStore()
const {devices} = storeToRefs(store)
const router = useRouter()

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

onMounted(async () => {
  await store.getAllDevices()
})
</script>

<template>
  <AuthenticatedLayout>
    <BaseCard class="w-full h-fit">
      <DataTable :value="devices" pt:table="min-w-200">
        <Column field="code" header="Device Code"></Column>
        <Column field="status" header="Status">
          <template #body="{data}">
            <Tag :value="capitalizeFirstLetter(data.status)" :severity="getSeverity(data.status)" />
          </template>
        </Column>
        <Column field="location" header="Lokasi">
          <template #body="{data}">
            {{ data.location.name }}
          </template>
        </Column>
        <Column field="updatedAt" header="Update Terakhir">
          <template #body="{data}">
            {{ formatDate(data.updatedAt) }}
          </template>
        </Column>
        <Column field="actions" header="Actions">
          <template #body="{data}">
            <div class="flex items-center gap-2">
              <Icon icon="material-symbols:delete-rounded" color="red" class="w-7 h-7 cursor-pointer" @click="store.deleteDevice(data.id)"/>
              <Icon icon="material-symbols:edit-outline" color="gold" class="w-7 h-7 cursor-pointer" @click="router.push(`/device/${data.id}`)"/>
            </div>
          </template>
        </Column>
      </DataTable>
    </BaseCard>
  </AuthenticatedLayout>
</template>
