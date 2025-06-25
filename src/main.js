import './assets/main.css'
import { createApp } from 'vue'
import pinia from './pinia' // ← Import yang sama
import VueApexCharts from 'vue3-apexcharts'
import { setupInterceptors } from './lib/axiosInterceptors'
import App from './App.vue'
import router from './router'

const app = createApp(App)

// Setup axios interceptors
setupInterceptors()

app.use(pinia)
app.use(router)
app.use(VueApexCharts)

app.mount('#app')
