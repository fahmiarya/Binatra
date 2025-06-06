<template>
  <!-- <LoadingIndicator v-if="isLoading" /> -->

  <div class="flex flex-col min-h-screen">
    <!-- Header (Full Width) -->
    <BaseHeader />

    <div class="flex flex-1">
      <!-- Sidebar -->
      <BaseSidebar />

      <!-- Main Content with Panel -->
      <div class="flex-1 relative flex bg-[#E7ECEF] pt-6">
        <!-- Main Content Area -->
        <div class="flex-1 px-6 pb-1 w-full flex gap-10">
          <slot />
        </div>

        <!-- Flood Monitoring Panel (Optional) -->
        <FloodMonitoringPanel
          :floodNotifications="floodNotifications"
          :alertLocations="alertLocations"
          @location-updated="handleLocationUpdate"
          @notification-added="handleNotificationAdd"
          class="pr-3"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import LoadingIndicator from '@/components/LoadingIndicator.vue';
import BaseHeader from '@/components/shared/BaseHeader.vue';
import BaseSidebar from '@/components/shared/BaseSidebar.vue';
import FloodMonitoringPanel from '@/components/shared/FloodMonitoringPanel.vue';
import { ref, onMounted } from 'vue';

// Emits
const emit = defineEmits(['flood-data-updated']);

// Simulating loading process
const isLoading = ref(true);

// Data untuk flood monitoring
const floodNotifications = ref([
  {
    id: 1,
    title: "Banjir Ketinggian 25cm",
    location: "Ketintang",
    timeframe: "20 minutes",
    timeAgo: "16 min ago",
    severity: "high"
  },
  {
    id: 2,
    title: "Banjir Ketinggian 5cm",
    location: "Jambangan",
    timeframe: "15 minutes",
    timeAgo: "8 min ago",
    severity: "low"
  },
  {
    id: 3,
    title: "Banjir Ketinggian 10cm",
    location: "Ketintang",
    timeframe: "10 minutes",
    timeAgo: "1 min ago",
    severity: "medium"
  },
  {
    id: 4,
    title: "Banjir Ketinggian 15cm",
    location: "Wonokromo",
    timeframe: "5 minutes",
    timeAgo: "3 min ago",
    severity: "medium"
  }
]);

const alertLocations = ref([
  {
    id: 1,
    name: "Ketintang",
    address: "Jl. Ketintang Baru No. 123",
    status: "bahaya",
    waterLevel: 45,
    maxLevel: 50,
    rainfall: 15.2,
    lastUpdate: "2 min ago",
    deviceStatus: "online"
  },
  {
    id: 2,
    name: "Jambangan",
    address: "Jl. Jambangan Kebon Agung",
    status: "waspada",
    waterLevel: 25,
    maxLevel: 40,
    rainfall: 8.5,
    lastUpdate: "5 min ago",
    deviceStatus: "online"
  },
  {
    id: 3,
    name: "Wonokromo",
    address: "Jl. Wonokromo Selatan",
    status: "waspada",
    waterLevel: 18,
    maxLevel: 35,
    rainfall: 12.0,
    lastUpdate: "3 min ago",
    deviceStatus: "online"
  },
  {
    id: 4,
    name: "Gubeng",
    address: "Jl. Gubeng Pojok",
    status: "aman",
    waterLevel: 8,
    maxLevel: 30,
    rainfall: 3.2,
    lastUpdate: "1 min ago",
    deviceStatus: "online"
  },
  {
    id: 5,
    name: "Sukolilo",
    address: "Jl. Raya Sukolilo",
    status: "aman",
    waterLevel: 12,
    maxLevel: 35,
    rainfall: 5.8,
    lastUpdate: "4 min ago",
    deviceStatus: "online"
  }
]);

// Methods
const handleLocationUpdate = (locationData) => {
  emit('flood-data-updated', { type: 'location', data: locationData });
};

const handleNotificationAdd = (notification) => {
  floodNotifications.value.unshift(notification);
  emit('flood-data-updated', { type: 'notification', data: notification });
};

// Simulasi update data realtime setiap 30 detik
// const updateLocationData = () => {
//   alertLocations.value.forEach(location => {
//     // Simulasi perubahan water level dan rainfall
//     const waterChange = (Math.random() - 0.5) * 4; // ±2cm
//     const rainChange = (Math.random() - 0.5) * 2; // ±1mm/h

//     location.waterLevel = Math.max(0, Math.min(location.maxLevel, location.waterLevel + waterChange));
//     location.rainfall = Math.max(0, location.rainfall + rainChange);

//     // Update status berdasarkan water level
//     const percentage = (location.waterLevel / location.maxLevel) * 100;
//     if (percentage >= 80) {
//       location.status = 'bahaya';
//     } else if (percentage >= 50) {
//       location.status = 'waspada';
//     } else {
//       location.status = 'aman';
//     }

//     location.lastUpdate = 'Just now';
//   });
// };

onMounted(() => {
  // Simulating network request delay
  // setTimeout(() => {
  //   isLoading.value = false;
  // }, 2000);

  // setInterval(() => {
  //   updateLocationData();
  // }, 30000);
});
</script>
