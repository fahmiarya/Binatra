<script setup>
import BaseCard from '@/components/ui/BaseCard.vue';
import InputNumber from '@/components/ui/InputNumber.vue';
import InputText from '@/components/ui/InputText.vue';
import { ref, toRefs } from 'vue';

const isOpen = defineModel('open')
const form = defineModel()
const props = defineProps(['edit'])
const emits = defineEmits(['cancel', 'edit', 'add'])

const {edit} = toRefs(props)
const mapForm = ref()

const handleFocus = () => {
  mapForm.value?.focus()
}

defineExpose({
  handleFocus
})
</script>

<template>
  <BaseCard v-if="isOpen" :title="edit ? 'Edit Lokasi' : 'Tambah Lokasi Baru'" customClass="w-full mt-4">
    <div class="grid grid-cols-2 gap-x-2 gap-y-5 my-4" ref="mapForm" tabindex="-1">
      <div>
        <label class="block text-xs mb-1">Nama Lokasi</label>
        <InputText fluid v-model="form.name" placeholder="Nama Lokasi" class="w-full" />
      </div>
      <div>
        <label class="block text-xs mb-1">Alamat</label>
        <InputText fluid v-model="form.address" placeholder="Alamat" class="w-full" />
      </div>
      <div class="grid grid-cols-3 col-span-2 gap-x-3">
        <div>
          <label class="block text-xs mb-1">Kecamatan</label>
          <InputText fluid v-model="form.district" placeholder="Kecamatan" class="w-full" />
        </div>
        <div>
          <label class="block text-xs mb-1">Kota</label>
          <InputText fluid v-model="form.city" placeholder="Kota" class="w-full" />
        </div>
        <div>
          <label class="block text-xs mb-1">Provinsi</label>
          <InputText fluid v-model="form.province" placeholder="Provinsi" class="w-full" />
        </div>
      </div>
      <div>
        <label class="block text-xs mb-1">Latitude</label>
        <InputText fluid v-model="form.latitude" readonly placeholder="Latitude" class="w-full" />
      </div>
      <div>
        <label class="block text-xs mb-1">Longitude</label>
        <InputText fluid v-model="form.longitude" readonly placeholder="Longitude" class="w-full" />
      </div>
    </div>

    <div class="grid grid-cols-3 gap-x-5 gap-y-5 mb-4">
      <div class="w-full">
        <label class="block text-xs mb-1">Batas Aman Maksimal</label>
        <InputNumber fluid v-model="form.amanMax" placeholder="Batas Aman Maksimal" showButtons class="w-full" />
      </div>
      <div class="w-full">
        <label class="block text-xs mb-1">Batas Waspada Minimal</label>
        <InputNumber fluid v-model="form.waspadaMin" placeholder="Batas Aman Minimal" showButtons class="w-full" />
      </div>
      <div class="w-full">
        <label class="block text-xs mb-1">Batas Waspada Maksimal</label>
        <InputNumber fluid v-model="form.waspadaMax" placeholder="Waspada Maksimal" showButtons class="w-full" />
      </div>
      <div class="w-full">
        <label class="block text-xs mb-1">Batas Siaga Minimal</label>
        <InputNumber fluid readonly="" v-model="form.siagaMin" placeholder="Siaga Minimal" showButtons type="number"
          class="w-full" />
      </div>
      <div class="w-full">
        <label class="block text-xs mb-1">Batas Siaga Maksimal</label>
        <InputNumber fluid v-model="form.siagaMax" placeholder="Siaga Maksimal" showButtons class="w-full" />
      </div>
      <div class="w-full">
        <label class="block text-xs mb-1">Batas Bahaya Minimal</label>
        <InputNumber fluid readonly="" v-model="form.bahayaMin" placeholder="Bahaya Minimal" showButtons type="number"
          class="w-full" />
      </div>
    </div>

    <div class="flex justify-end items-center gap-x-5 mt-4">
      <button @click="emits('cancel')" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
        Batal
      </button>

      <button @click="emits('add', form)" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        :disabled="loading">
        {{ loading ? 'Menyimpan...' : 'Simpan Lokasi' }}
      </button>
    </div>
  </BaseCard>
</template>
