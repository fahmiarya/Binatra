<script setup lang="ts">
import BaseLayout from '@/layouts/BaseLayout.vue'
import BaseCard from '@/components/BaseCard.vue'
import { LMap, LTileLayer } from '@vue-leaflet/vue-leaflet'
import 'leaflet/dist/leaflet.css'

// Konfigurasi default icon (agar marker tidak invisible)
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const center = [-6.9, 107.6] // Contoh koordinat
</script>

<template>
  <BaseLayout>
    <div class="w-full flex flex-col items-center">
      <BaseCard title="Peta Lokasi" customClass="mb-4 w-full">
        <p class="text-gray-600 font-bold">Peta Real-time Titik Lokasi Banjir</p>
      </BaseCard>
      <div class="w-full h-[55vh]">
        <LMap :zoom="13" :center="center" class="h-full w-full">
          <LTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        </LMap>
      </div>
    </div>
  </BaseLayout>
</template>
