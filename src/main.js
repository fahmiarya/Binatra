import './assets/main.css'
import { createApp } from 'vue'
import pinia from './plugins/pinia'
import VueApexCharts from 'vue3-apexcharts'
import { setupInterceptors } from './lib/axiosInterceptors'
import ConfirmationService from 'primevue/confirmationservice';
import PrimeVue from 'primevue/config';
import App from './App.vue'
import router from './router'


const app = createApp(App)

setupInterceptors()

app.use(pinia)
app.use(router)
app.use(VueApexCharts)
app.use(ConfirmationService);
app.use(PrimeVue, {
  unstyled: true
});

app.mount('#app')
