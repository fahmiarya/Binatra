<!-- MainContent.vue -->
<script setup>
import BaseCard from '@/components/BaseCard.vue';
import BaseLayout from '@/layouts/BaseLayout.vue';

const notifications = [
  {
    color: 'bg-red-500',
    title: 'Banjir ketinggian 25cm',
    location: 'Kebonsari dalam 20 minutes',
    time: '16 min ago'
  },
  {
    color: 'bg-yellow-500',
    title: 'Banjir ketinggian 5 cm',
    location: 'Jambangan dalam 15 minutes',
    time: '8 min ago'
  },
  {
    color: 'bg-green-500',
    title: 'Banjir ketinggian 10cm Waru',
    location: 'dalam 10 minutes',
    time: '1 hour ago'
  }
];
</script>

<template>
  <BaseLayout>
    <main class="p-6 bg-gray-100">
      <div class="grid grid-cols-3 gap-6 mb-6">
        <!-- Weather Card -->
        <BaseCard
          title="Weather"
          location="Rasht"
          value="10° C"
          subValue="3°C / 12°C"
          description="Partly Cloudy"
          icon="../assets/images/cloud.png"
        />

        <!-- Water Level Card -->
        <BaseCard
          title="Water Level"
          value="200cm"
        >
          <template #icon>
            <div class="h-20 w-8 bg-yellow-400 border border-gray-300 rounded relative">
              <!-- Water level indicator -->
            </div>
          </template>
        </BaseCard>

        <!-- Notifications Card -->
        <BaseCard title="Notifications">
          <div class="mt-4 space-y-4">
            <div v-for="(notif, index) in notifications" :key="index" class="flex">
              <div :class="[notif.color, 'w-2 h-2 rounded-full mt-1.5 mr-2']"></div>
              <div>
                <p class="text-sm font-medium">{{ notif.title }}</p>
                <p class="text-xs text-gray-500">{{ notif.location }}</p>
                <p class="text-xs text-gray-400 mt-1">{{ notif.time }}</p>
              </div>
            </div>
          </div>
        </BaseCard>
      </div>

      <div class="grid grid-cols-3 gap-6 mb-6">
        <!-- Device Card -->
        <BaseCard title="No of device">
          <p class="font-medium text-green-600 mt-2">Connected</p>
          <p class="text-sm text-gray-600 mt-1">8 Connected devices</p>
          <div class="flex justify-between mt-3 text-sm text-gray-600">
            <div>
              <p>12.54 GB sent</p>
            </div>
            <div>
              <p>6.48 GB received</p>
            </div>
          </div>
        </BaseCard>

        <!-- Electricity Card -->
        <BaseCard title="Electricity">
          <div class="flex mt-2 space-x-2">
            <button class="px-4 py-1 bg-gray-400 text-white rounded">Daily</button>
            <button class="px-4 py-1 text-gray-600 rounded hover:bg-gray-200">Weekly</button>
          </div>
          <div class="mt-4 h-24">
            <!-- Electricity usage graph -->
            <div class="h-full flex items-end">
              <!-- Bars for the graph -->
              <div v-for="height in [40, 60, 50, 70, 45, 65, 55, 75, 35, 55, 45, 65, 50, 70, 40, 60]"
                   :key="height"
                   class="w-2 bg-blue-500 mx-0.5"
                   :style="`height: ${height}%`">
              </div>
            </div>
          </div>
        </BaseCard>

        <!-- Recommendations Card -->
        <BaseCard
          title="Recommendations"
          :hasArrow="false"
        >
          <!-- Recommendation content -->
        </BaseCard>
      </div>

      <!-- Today's Suggested Article Section -->
      <div class="border border-purple-500 rounded-lg overflow-hidden relative">
        <div class="bg-gray-900 text-white p-6 relative">
          <div class="max-w-md">
            <h3 class="text-xl font-medium mb-3">Today's Suggested Article</h3>
            <h4 class="font-bold mb-2">The Revolution of Artificial Intelligence</h4>
            <p class="text-sm mb-3">
              The future of AI will see home robots having enhanced intelligence, increased
              capabilities, and becoming more personal and possibly cute. For example, home
              robots will overcome navigation, direction, and object detection issues, enabling
              them to carry out tasks more efficiently.
            </p>
            <button class="bg-white text-gray-800 px-4 py-1 rounded-md text-sm">
              Read Article
            </button>

            <div class="flex space-x-1 mt-6">
              <div v-for="(dot, index) in 5" :key="index"
                   :class="[index === 0 ? 'bg-white' : 'bg-gray-400', 'w-2 h-2 rounded-full']"></div>
            </div>
          </div>

          <div class="absolute top-1/2 right-4 transform -translate-y-1/2 flex items-center space-x-2">
            <div class="flex">
              <i v-for="star in 4" :key="star" class="fas fa-star text-yellow-500"></i>
              <i class="fas fa-star text-gray-400"></i>
            </div>
            <span class="text-sm text-gray-300">(12846 Views)</span>
          </div>
        </div>

        <!-- Navigation arrows -->
        <button class="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white/10 p-2 rounded-full">
          <i class="fas fa-chevron-left"></i>
        </button>
        <button class="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white/10 p-2 rounded-full">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </main>
  </BaseLayout>
</template>
