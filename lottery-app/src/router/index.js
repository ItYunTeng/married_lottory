import Vue from 'vue';
import VueRouter from 'vue-router';
import Login from '@/views/Login.vue';
import Join from '@/views/Join.vue';
import Screen from '@/views/Screen.vue';

Vue.use(VueRouter);

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/join', component: Join },
  { path: '/screen', component: Screen }
];

export default new VueRouter({ mode: 'history', routes });