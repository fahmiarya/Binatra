<template>
  <div class="pr-[75vh] grid grid-rows-2 gap-17">
    <div class="grid grid-cols-2">
      <div class="col-span-1">
        <card-weather />
      </div>
      <div class="col-span-1">
        <card-water-level />
      </div>
    </div>

    <div class="grid grid-cols-2">
      <div class="col-span-1">
        <card-sensor-1 />
      </div>
      <div class="col-span-1">
        <card-sensor-2 />
      </div>
    </div>
  </div>
</template>
<script>
import CardWeather from '@/components/Cards/CardWeather.vue'
import CardWaterLevel from '@/components/Cards/CardWaterLevel.vue'
import CardSensor1 from '@/components/Cards/CardSensor1.vue'
import CardSensor2 from '@/components/Cards/CardSensor2.vue'
export default {
  name: 'dashboard-page',
  components: {
    CardWaterLevel,
    CardSensor1,
    CardSensor2,
    CardWeather,
  },
}
</script>
