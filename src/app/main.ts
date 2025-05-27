import { createApp } from 'vue'

import { definePreset } from '@primeuix/themes'
import Nora from '@primeuix/themes/nora'
import 'overlayscrollbars/overlayscrollbars.css'
import 'primeicons/primeicons.css'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'

import App from './App.vue'
import './assets/main.css'
import router from './router'

const app = createApp(App)

const MyPreset = definePreset(Nora, {
  semantic: {
    primary: {
      50: '{slate.50}',
      100: '{slate.100}',
      200: '{slate.200}',
      300: '{slate.300}',
      400: '{slate.400}',
      500: '{slate.500}',
      600: '{slate.600}',
      700: '{slate.700}',
      800: '{slate.800}',
      900: '{slate.900}',
      950: '{slate.950}',
    },
  },
})

app.use(PrimeVue, {
  theme: {
    preset: MyPreset,
    options: {
      darkModeSelector: '.dark-mode',
    },
  },
})

app.use(ToastService)
app.use(router)

app.mount('#app')
