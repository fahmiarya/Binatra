<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const options = ref({
  chart: {
    id: 'areachart',
    type: 'area',
    animations: {
      enabled: true,
      easing: 'linear',
      dynamicAnimation: {
        speed: 1000
      }
    }
  },
  xaxis: {
    type: 'datetime',
    labels: {
      format: 'HH:mm:ss',
      datetimeUTC: false
    }
  },
  stroke: {
    curve: 'smooth'
  },
  dataLabels: {
    enabled: false
  },
  tooltip: {
    x: {
      format: 'dd/MM/yyyy HH:mm:ss'
    },
  },
  yaxis: {
    title: {
      text: 'Water Level'
    }
  }
})

// Inisialisasi data dengan timestamp saat ini
const series = ref([{
  name: 'water-level',
  data: []
}])

let intervalId = null;

// Fungsi untuk generate data baru
const generateNewDataPoint = () => {
  const now = Date.now();
  const randomValue = Math.floor(Math.random() * 40) + 30; // Random antara 30-70

  return {
    x: now,
    y: randomValue
  };
};

// Fungsi untuk update data secara realtime
const updateChart = () => {
  const newPoint = generateNewDataPoint();

  // Tambah data baru
  series.value[0].data.push(newPoint);

  // Batasi jumlah data yang ditampilkan (misalnya 20 data terakhir)
  if (series.value[0].data.length > 20) {
    series.value[0].data.shift();
  }
};

// Inisialisasi beberapa data awal
const initializeData = () => {
  const initialData = [];
  const now = Date.now();

  // Buat 10 data awal dengan interval 5 detik ke belakang
  for (let i = 9; i >= 0; i--) {
    initialData.push({
      x: now - (i * 5000), // 5 detik interval
      y: Math.floor(Math.random() * 40) + 30
    });
  }

  series.value[0].data = initialData;
};

onMounted(() => {
  // Inisialisasi data awal
  initializeData();

  // Update data setiap 3 detik
  intervalId = setInterval(updateChart, 3000);
});

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});
</script>

<template>
  <div>
    <h3>Real-time Water Level Monitor</h3>
    <apexchart
      type="area"
      height="400"
      :options="options"
      :series="series"
    ></apexchart>
  </div>
</template>
