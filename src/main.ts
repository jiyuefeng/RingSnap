import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import App from './App.vue';

// 创建 Pinia 实例
const pinia = createPinia();

// 创建 Vue 应用
const app = createApp(App);

// 使用插件
app.use(pinia);
app.use(ElementPlus);

// 挂载应用
app.mount('#app');
