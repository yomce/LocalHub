import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import GuideView from '../views/GuideView.vue'
import MapView from '../components/map/MapView.vue'
import BoardView from '../views/BoardView.vue'
import PostDetailView from '../views/PostDetailView.vue'
import PostFormView from '../views/PostFormView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/guide', name: 'guide', component: GuideView },
    { path: '/map', name: 'map', component: MapView },
    { path: '/board', name: 'board', component: BoardView },
    { path: '/board/new', name: 'post-new', component: PostFormView },
    { path: '/board/:id/edit', name: 'post-edit', component: PostFormView },
    { path: '/board/:id', name: 'post-detail', component: PostDetailView },
  ],
})

export default router

