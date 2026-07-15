<script setup>
const navigation = [
  { label: '홈', to: '/' },
  { label: '프로젝트 규칙', to: '/guide' },
]
</script>

<template>
  <header class="app-header">
    <RouterLink class="brand" to="/">LocalHub</RouterLink>
    <nav aria-label="주요 메뉴">
      <RouterLink v-for="item in navigation" :key="item.to" :to="item.to">{{ item.label }}</RouterLink>
    </nav>
  </header>

  <main class="app-main">
    <RouterView />
  </main>

  <footer class="app-footer">LocalHub · 협업 공통 기반</footer>
</template>

