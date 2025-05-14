
<script>
import { reactive, onMounted } from "vue";
import { listenToSensorData } from "@/socket.js"; // Pastikan path sudah benar

export default {
  setup() {
    // State untuk menyimpan data sensor
    const sensorData = reactive({
      waterlevel: null,
      rain: null,
      buzzerState: null
    });

    // Menggunakan listenToSensorData untuk mendengarkan data dari server
    onMounted(() => {
      listenToSensorData((data) => {
        // Update state dengan data yang diterima
        sensorData.waterlevel = data.waterlevel;
        sensorData.rain = data.rain;
        sensorData.buzzerState = data.buzzerState;
      });
    });

    return {
      sensorData
    };
  }
};
</script>
<template>
  <div>
    <h1>Sensor Data</h1>
    <div>
      <p><strong>Water Level:</strong> {{ sensorData.waterlevel }} cm</p>
      <p><strong>Rain ADC Value:</strong> {{ sensorData.rain }}</p>
      <p><strong>Buzzer State:</strong> {{ sensorData.buzzerState }}</p>
    </div>
  </div>
</template>
