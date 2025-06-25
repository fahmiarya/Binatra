<script setup lang="ts">
import BaseLayout from '@/layouts/BaseLayout.vue';
import BaseAreaChart from '@/components/BaseAreaChart.vue';
import BaseCard from '@/components/BaseCard.vue';
</script>

<template>
  <BaseLayout>
    <BaseCard title="Real Time Ketinggian Banjir" customClass="w-full">
      <BaseAreaChart />
    </BaseCard>
  </BaseLayout>
</template>
