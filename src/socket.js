import { io } from "socket.io-client";


const socket = io(import.meta.env.VITE_API_URL);

// Fungsi untuk mendengarkan data sensor secara umum
export const listenToSensorData = (callback) => {
  socket.on("sensor-data", callback);
};

// Fungsi untuk mendengarkan data sensor terbaru
export const listenToLatestSensorData = (callback) => {
  socket.on("latest-sensor-data", callback);
};

// Fungsi untuk menangani error dari server
export const listenToErrors = (callback) => {
  socket.on("error", callback);
};

// Fungsi untuk mengirim event dan data ke server
export const sendData = (event, data) => {
  socket.emit(event, data);
};

// Fungsi untuk meminta data sensor terbaru
export const getLatestData = (deviceId = null) => {
  socket.emit("get-latest-data", deviceId);
};

export default socket;
