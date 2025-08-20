<script setup lang="ts">
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout.vue';
import BaseAreaChart from '@/components/ui/BaseAreaChart.vue';
import BaseCard from '@/components/ui/BaseCard.vue';
</script>

<template>
  <AuthenticatedLayout>
    <BaseCard title="Real Time Ketinggian Banjir" customClass="w-full">
      <BaseAreaChart />
    </BaseCard>
  </AuthenticatedLayout>
</template>
