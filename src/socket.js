import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

// Fungsi untuk mendengarkan data sensor
export const listenToSensorData = (callback) => {
  socket.on("sensor-data", (data) => {
    callback(data);
  });
};

// Fungsi untuk mengirim data ke server jika diperlukan
export const sendData = (event, data) => {
  socket.emit(event, data);
};

export default socket;
