<script setup>
import { onMounted, ref, reactive, computed } from 'vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseCard from '@/components/ui/BaseCard.vue';
import BasePanel from '@/components/ui/BasePanel.vue';
import BaseTextarea from '@/components/ui/BaseTextarea.vue';
import Fluid from '@/components/ui/Fluid.vue';
import InputText from '@/components/ui/InputText.vue';
import { useDeviceSocket } from '@/composables/useDeviceSocket';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout.vue';
import { formatDate } from '@/lib/utils';
import { useDeviceStore } from '@/stores/deviceStore';
import { useRoute } from 'vue-router';

const route = useRoute()
const store = useDeviceStore()
const device = ref(null)
const { updateDeviceSetting } = useDeviceSocket()

// Form data
const form = reactive({
  code: '',
  description: '',
  locationId: null,
  status: '',
  calibration: 0,
  periode: 0,
  location: null
})

// Status options
const statusOptions = [
  { value: 'CONNECTED', label: 'Connected', class: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'DISCONNECTED', label: 'Disconnected', class: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'MAINTENANCE', label: 'Maintenance', class: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
]

// Computed properties
const statusBadge = computed(() => {
  if (!device.value) return null
  const status = statusOptions.find(s => s.value === device.value.status)
  return status || { value: device.value.status, label: device.value.status, class: 'bg-gray-100 text-gray-800 border-gray-200' }
})

const handleSubmit = async () => {
  try {
    const res = await updateDeviceSetting(
      form.code,          // deviceCode
      form.locationId,    // locationId
      form.calibration,   // calibration
      form.periode        // periode
    )

    console.log(res)
  } catch (error) {
    console.log(error)
  }
}

// Load device data
onMounted(async () => {
  try {
    device.value = await store.getDevice(route.params.id)
    if (device.value) {
      Object.assign(form, {
        code: device.value.code,
        description: device.value.description,
        locationId: device.value.locationId,
        status: device.value.status,
        calibration: device.value.calibration,
        periode: device.value.periode,
        location: device.value.location
      })
    }
  } catch (error) {
    console.error('Error loading device:', error)
  }
})
</script>

<template>
  <AuthenticatedLayout>
    <!-- Main Content -->
    <BaseCard class="w-full h-fit">
      <div v-if="device" class="space-y-8">
        <Fluid>
          <form @submit.prevent="handleSubmit" class="space-y-6">
            <section class="w-56 justify-end flex gap-x-5 ml-auto">
              <BaseButton label="Back" severity="secondary" />
              <BaseButton label="Save" severity="secondary" type="submit" />
            </section>
            <BasePanel>
              <template #header>
                <div class="w-full flex items-center justify-between">
                  <section class="flex items-center gap-x-5">
                    <h3 class="text-xl font-semibold">Device Information</h3>
                    <!-- Status Badge -->
                    <span v-if="statusBadge"
                      :class="['px-3 py-1 rounded-full text-sm font-medium border', statusBadge.class]">
                      {{ statusBadge.label }}
                    </span>
                  </section>
                </div>
              </template>

              <!-- Basic Information -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Device Code</label>
                  <InputText v-model="form.code" readonly placeholder="Enter device code" class="w-full" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Nama Device</label>
                  <InputText v-model="form.code" placeholder="Enter device code" class="w-full" />
                </div>
              </div>

              <!-- Description -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Deskripsi</label>
                <BaseTextarea v-model="form.description" placeholder="Masukkan keterangan alat" rows="3"
                  class="w-full" />
              </div>
            </BasePanel>

            <!-- Location -->
            <BasePanel header="Lokasi Device">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Lokasi</label>
              </div>
            </BasePanel>

            <!-- Configuration -->
            <BasePanel header="Konfigurasi Device">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Calibration (CM)</label>
                  <InputText v-model.number="form.calibration" type="number" min="0"
                    placeholder="Masukkan nilai kalibrasi" class="w-full" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Period (seconds)</label>
                  <InputText v-model.number="form.periode" type="number" min="1"
                    placeholder="Masukkan nilai periode alat mengirim data" class="w-full" />
                </div>
              </div>
            </BasePanel>

            <BasePanel header="Informasi Tambahan">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                <div class="bg-gray-100 p-4 rounded-lg">
                  <label class="block text-sm font-medium text-gray-600">Tanggal Dibuat</label>
                  <p class="mt-1 text-sm text-gray-900">{{ formatDate(device.createdAt) }}</p>
                </div>
                <div class="bg-gray-100 p-4 rounded-lg">
                  <label class="block text-sm font-medium text-gray-600">Tanggal Diperbarui</label>
                  <p class="mt-1 text-sm text-gray-900">{{ formatDate(device.updatedAt) }}</p>
                </div>
              </div>
            </BasePanel>
          </form>
        </Fluid>
      </div>

      <!-- Loading State -->
      <div v-else class="flex items-center justify-center h-64">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-3 text-gray-600">Loading device information...</span>
      </div>
    </BaseCard>
  </AuthenticatedLayout>
</template>
