import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import GuideView from '../views/GuideView.vue'
import MapView from '../components/map/MapView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/guide', name: 'guide', component: GuideView },
    { path: '/map', name: 'map', component: MapView },
  ],
})

export default router

