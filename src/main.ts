import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import store from './store/index.ts'
import router from './router/index.ts'
import HighchartsVue from 'highcharts-vue';

const app = createApp(App);
app.use(store);
app.use(router);
app.use(HighchartsVue);
app.mount('#app'); 