<template>
  <section class="dashboard-page">
    <div class="page-heading">
      <div class="heading-wrapper">
        <span class="eyebrow-badge">
          <span class="pulse-dot"></span>
          데이터 인사이트
        </span>
        <h1>게시글 통계 대시보드</h1>
        <p class="page-description">카테고리별 게시글 수와 인기 태그, 좋아요/조회 통계를 감각적으로 확인하세요.</p>
      </div>
    </div>

    <div class="dashboard-summary">
      <article class="summary-card total-posts">
        <div class="card-icon">📚</div>
        <div class="card-info">
          <span>총 게시글</span>
          <strong>{{ totalPosts.toLocaleString() }}<small>개</small></strong>
        </div>
        <div class="card-glow"></div>
      </article>

      <article class="summary-card active-categories">
        <div class="card-icon">🗺️</div>
        <div class="card-info">
          <span>활성 카테고리</span>
          <strong>{{ totalCategories }}<small>개</small></strong>
        </div>
        <div class="card-glow"></div>
      </article>

      <article class="summary-card hot-tag">
        <div class="card-icon">🔥</div>
        <div class="card-info">
          <span>최다 사용 태그</span>
          <strong>{{ topTagName ? `#${topTagName}` : '없음' }}</strong>
        </div>
        <div class="card-glow"></div>
      </article>
    </div>

    <article class="explorer-card">
      <div class="explorer-avatar" aria-hidden="true">旅</div>
      <div class="explorer-copy">
        <span class="explorer-kicker">LOCALHUB EXPLORER</span>
        <h2>오늘도 서울을 한 칸 더 발견했어요</h2>
        <p>커뮤니티가 쌓일수록 당신의 서울 탐험 레벨이 올라갑니다.</p>
      </div>
      <div class="explorer-level">
        <span>LEVEL {{ explorerProfile.level }}</span>
        <strong>{{ explorerProfile.badge }}</strong>
      </div>
      <div class="explorer-progress">
        <div class="progress-label"><span>{{ explorerProfile.points }} XP</span><span>다음 레벨까지 {{ explorerProfile.next }} XP</span></div>
        <div class="progress-track"><span :style="{ width: `${explorerProfile.progress}%` }"></span></div>
        <div class="badge-row"><span class="earned-badge">✦ 로컬 기록가</span><span>○ 골목 수집가</span><span>○ 서울 큐레이터</span></div>
      </div>
    </article>

    <div class="dashboard-grid">
      <article class="dashboard-card pie-chart-box compact-chart-card">
        <div class="card-header">
          <h2>카테고리 비율</h2>
          <span class="chart-subtitle">카테고리별 여행 정보 선호도</span>
        </div>
        <div class="chart-container">
          <canvas ref="categoryChart" aria-label="카테고리별 게시글 수 차트"></canvas>
        </div>
      </article>

      <article class="dashboard-card bar-chart-box compact-chart-card">
        <div class="card-header">
          <h2>실시간 인기 태그 TOP 6</h2>
          <span class="chart-subtitle">현재 가장 핫한 서울 여행 키워드</span>
        </div>
        <div class="chart-container">
          <canvas ref="tagChart" aria-label="인기 태그 차트"></canvas>
        </div>
      </article>

      <article class="dashboard-card full-width-card compact-chart-card">
        <div class="card-header">
          <h2>가장 관심도 높은 서울 여행기</h2>
          <span class="chart-subtitle">조회수와 좋아요 합산 상위 6개 게시글 트렌드</span>
        </div>
        <div class="chart-container tall">
          <canvas ref="topPostChart" aria-label="인기 게시글 통계 차트"></canvas>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { Chart, ArcElement, PieController, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
import { getPosts } from '../services/postStorage'

Chart.register(ArcElement, PieController, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const categoryChart = ref(null)
const tagChart = ref(null)
const topPostChart = ref(null)
const totalPosts = ref(0)
const totalCategories = ref(0)
const topTagName = ref('')
const explorerProfile = computed(() => {
  const points = totalPosts.value * 20 + totalCategories.value * 35
  const level = Math.max(1, Math.floor(points / 100) + 1)
  const currentLevelPoints = points % 100
  return {
    points,
    level,
    progress: Math.min(100, currentLevelPoints),
    next: 100 - currentLevelPoints,
    badge: level >= 4 ? '서울 큐레이터' : level >= 2 ? '동네 탐험가' : '첫 발자국',
  }
})

function buildCategoryData(posts) {
  const counts = posts.reduce((acc, post) => {
    acc[post.category] = (acc[post.category] || 0) + 1
    return acc
  }, {})

  return {
    labels: Object.keys(counts),
    values: Object.values(counts),
  }
}

function buildTagData(posts) {
  const tagCounts = posts.reduce((acc, post) => {
    ;(post.tags || []).forEach((tag) => {
      acc[tag] = (acc[tag] || 0) + 1
    })
    return acc
  }, {})

  const sortedTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)

  return {
    labels: sortedTags.map(([tag]) => tag),
    values: sortedTags.map(([, count]) => count),
    topTag: sortedTags[0]?.[0] || '',
  }
}

function buildTopPostData(posts) {
  const sorted = [...posts].sort(
    (a, b) =>
      (b.viewCount || 0) + (b.likeCount || 0) -
      ((a.viewCount || 0) + (a.likeCount || 0)),
  )
  const top = sorted.slice(0, 6)

  return {
    labels: top.map((post) => post.title.slice(0, 18)),
    views: top.map((post) => Number(post.viewCount || 0)),
    likes: top.map((post) => Number(post.likeCount || 0)),
  }
}

function initChart(canvas, config) {
  if (!canvas) return null
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  return new Chart(ctx, config)
}

onMounted(() => {
  const posts = getPosts()
  const categoryData = buildCategoryData(posts)
  const tagData = buildTagData(posts)
  const topPostData = buildTopPostData(posts)

  totalPosts.value = posts.length
  totalCategories.value = categoryData.labels.length
  topTagName.value = tagData.topTag || '없음'

  initChart(categoryChart.value, {
    type: 'pie',
    data: {
      labels: categoryData.labels,
      datasets: [
        {
          data: categoryData.values,
          backgroundColor: ['#c96f52', '#7d8755', '#b98a62', '#d99a70', '#8e6b58', '#a98b72'],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
      },
    },
  })

  initChart(tagChart.value, {
    type: 'bar',
    data: {
      labels: tagData.labels,
      datasets: [
        {
          label: '태그 빈도',
          data: tagData.values,
          backgroundColor: '#7d8755',
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: { ticks: { color: '#334155' } },
        y: { beginAtZero: true, ticks: { color: '#334155' } },
      },
    },
  })

  initChart(topPostChart.value, {
    type: 'bar',
    data: {
      labels: topPostData.labels,
      datasets: [
        {
          label: '조회수',
          data: topPostData.views,
          backgroundColor: '#c96f52',
        },
        {
          label: '좋아요',
          data: topPostData.likes,
          backgroundColor: '#b98a62',
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
      },
      scales: {
        x: {
          ticks: { color: '#334155' },
          stacked: false,
        },
        y: {
          beginAtZero: true,
          ticks: { color: '#334155' },
          stacked: false,
        },
      },
    },
  })
})
</script>
