<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import Chatbot from './components/Chatbot.vue'
import {
  clearNotifications,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  pollNotifications,
} from './services/notificationStorage'

const navigation = [
  { label: '홈', to: '/' },
  { label: '대시보드', to: '/dashboard' },
  { label: '지도', to: '/map' },
  { label: '서울 게시판', to: '/board' },
  { label: '프로젝트 규칙', to: '/guide' },
]

const router = useRouter()
const notifications = ref([])
const unreadCount = ref(0)
const isNotificationOpen = ref(false)

let pollingTimer

function refreshNotifications() {
  pollNotifications()
  notifications.value = getNotifications()
  unreadCount.value = getUnreadNotificationCount()
}

function openNotifications() {
  isNotificationOpen.value = true
  notifications.value = markAllNotificationsRead()
  unreadCount.value = 0
}

function closeNotifications() {
  isNotificationOpen.value = false
}

function clearNotificationHistory() {
  if (
    !notifications.value.length ||
    !window.confirm('알림 내역을 모두 삭제하시겠습니까?')
  ) {
    return
  }

  notifications.value = clearNotifications()
  unreadCount.value = 0
}

function openPost(notification) {
  closeNotifications()
  router.push(`/board/${notification.postId}`)
}

function formatNotificationDate(value) {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

onMounted(() => {
  refreshNotifications()
  pollingTimer = window.setInterval(refreshNotifications, 5000)
  window.addEventListener('storage', refreshNotifications)
})

onUnmounted(() => {
  window.clearInterval(pollingTimer)
  window.removeEventListener('storage', refreshNotifications)
})
</script>

<template>
  <header class="app-header">
    <RouterLink class="brand" to="/">LocalHub</RouterLink>

    <nav aria-label="주요 메뉴">
      <RouterLink
        v-for="item in navigation"
        :key="item.to"
        :to="item.to"
      >
        {{ item.label }}
      </RouterLink>

      <button
        class="notification-button"
        type="button"
        aria-label="알림 열기"
        @click="openNotifications"
      >
        <span class="bell-icon" aria-hidden="true">🔔</span>

        <span
          v-if="unreadCount"
          class="notification-count"
        >
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </button>
    </nav>
  </header>

  <main class="app-main">
    <RouterView />
  </main>

  <footer class="app-footer">
    LocalHub · 협업 공통 기반
  </footer>

  <div
    v-if="isNotificationOpen"
    class="notification-backdrop"
    @click.self="closeNotifications"
  >
    <section
      class="notification-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-title"
    >
      <div class="notification-header">
        <h2 id="notification-title">알림</h2>

        <div class="notification-header-actions">
          <button
            v-if="notifications.length"
            class="notification-clear"
            type="button"
            @click="clearNotificationHistory"
          >
            전체 삭제
          </button>

          <button
            class="modal-close"
            type="button"
            aria-label="알림 닫기"
            @click="closeNotifications"
          >
            ×
          </button>
        </div>
      </div>

      <div
        v-if="notifications.length"
        class="notification-list"
      >
        <button
          v-for="notification in notifications"
          :key="notification.id"
          class="notification-item"
          type="button"
          @click="openPost(notification)"
        >
          <span
            class="notification-type"
            :class="notification.type"
          >
            {{ notification.type === 'comment' ? '댓글' : '좋아요' }}
          </span>

          <span class="notification-copy">
            <strong>{{ notification.postTitle }}</strong>
            <span>{{ notification.message }}</span>
            <small>
              {{ formatNotificationDate(notification.createdAt) }}
            </small>
          </span>
        </button>
      </div>

      <p
        v-else
        class="notification-empty"
      >
        새로운 알림이 없습니다.
      </p>
    </section>
  </div>

  <Chatbot />
</template>