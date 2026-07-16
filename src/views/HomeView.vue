<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { getPosts } from '../services/postStorage'

const regions = [
  { id: 'downtown', name: '도심권', areas: '종로·중구·용산', lat: 37.54, lon: 126.98 },
  { id: 'northeast', name: '동북권', areas: '성북·동대문·광진', lat: 37.59, lon: 127.05 },
  { id: 'northwest', name: '서북권', areas: '마포·서대문·은평', lat: 37.57, lon: 126.92 },
  { id: 'southwest', name: '서남권', areas: '영등포·강서·관악', lat: 37.51, lon: 126.91 },
  { id: 'southeast', name: '동남권', areas: '강남·송파·강동', lat: 37.51, lon: 127.10 },
]

const selectedRegionId = ref('downtown')
const weatherByRegion = ref({})
const isLoading = ref(true)
const hasError = ref(false)
const posts = ref(getPosts())

const selectedRegion = computed(() => regions.find((region) => region.id === selectedRegionId.value))
const selectedWeather = computed(() => weatherByRegion.value[selectedRegionId.value])
const dashboardStats = computed(() => {
  const allTags = posts.value.flatMap((post) => post.tags || [])
  const tagCounts = allTags.reduce((counts, tag) => {
    counts[tag] = (counts[tag] || 0) + 1
    return counts
  }, {})
  const topTag = Object.entries(tagCounts).sort(([, a], [, b]) => b - a)[0]?.[0]
  return {
    posts: posts.value.length,
    categories: new Set(posts.value.map((post) => post.category)).size,
    topTag: topTag ? `#${topTag}` : '아직 없음',
  }
})

const weatherLabels = {
  0: ['맑음', '☀️'],
  1: ['대체로 맑음', '🌤️'],
  2: ['부분적으로 흐림', '⛅'],
  3: ['흐림', '☁️'],
  45: ['안개', '🌫️'],
  48: ['안개', '🌫️'],
  51: ['이슬비', '🌦️'],
  53: ['이슬비', '🌦️'],
  55: ['이슬비', '🌧️'],
  61: ['비', '🌧️'],
  63: ['비', '🌧️'],
  65: ['강한 비', '🌧️'],
  71: ['눈', '🌨️'],
  73: ['눈', '🌨️'],
  75: ['많은 눈', '❄️'],
  80: ['소나기', '🌦️'],
  81: ['소나기', '🌦️'],
  82: ['강한 소나기', '⛈️'],
  95: ['뇌우', '⛈️'],
  96: ['뇌우·우박', '⛈️'],
  99: ['뇌우·우박', '⛈️'],
}

function getWeatherLabel(code) {
  return weatherLabels[code] || ['날씨 정보', '🌤️']
}

function getActivityGuide(weather) {
  if (!weather) return '날씨 정보를 불러오면 오늘의 여행 활동을 추천해드릴게요.'
  if (weather.precipitationProbability >= 60 || weather.code >= 51) {
    return '비 소식이 있어요. 미술관, 박물관, 카페처럼 실내에서 여유롭게 즐길 수 있는 코스를 추천해요.'
  }
  if (weather.temperature >= 30) {
    return '더운 날씨예요. 한강 그늘 산책이나 실내 전시를 중심으로 움직이고, 한낮에는 휴식을 넣어보세요.'
  }
  if (weather.temperature <= 5) {
    return '쌀쌀한 날씨예요. 따뜻한 카페와 실내 명소를 묶은 짧은 코스가 잘 어울려요.'
  }
  if (weather.code <= 2) {
    return '야외 활동하기 좋은 날이에요. 공원 산책, 궁궐 나들이, 한강 피크닉을 추천해요.'
  }
  return '활동하기 무난한 날씨예요. 가벼운 산책과 주변 맛집을 함께 즐겨보세요.'
}

function normalizeWeather(region, data) {
  const current = data.current || {}
  const daily = data.daily || {}
  const [label, icon] = getWeatherLabel(current.weather_code)
  return {
    regionId: region.id,
    temperature: Math.round(current.temperature_2m),
    feelsLike: Math.round(current.apparent_temperature),
    humidity: Math.round(current.relative_humidity_2m),
    windSpeed: Number(current.wind_speed_10m || 0).toFixed(1),
    code: current.weather_code,
    label,
    icon,
    high: Math.round(daily.temperature_2m_max?.[0]),
    low: Math.round(daily.temperature_2m_min?.[0]),
    precipitationProbability: daily.precipitation_probability_max?.[0] || 0,
  }
}

async function fetchWeather(region) {
  const params = new URLSearchParams({
    latitude: region.lat,
    longitude: region.lon,
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: 'Asia/Seoul',
    forecast_days: '1',
  })
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  if (!response.ok) throw new Error(`Weather request failed: ${response.status}`)
  return normalizeWeather(region, await response.json())
}

async function loadWeather() {
  isLoading.value = true
  hasError.value = false
  try {
    const results = await Promise.all(regions.map(fetchWeather))
    weatherByRegion.value = Object.fromEntries(results.map((weather) => [weather.regionId, weather]))
  } catch (error) {
    console.warn('[Weather] Failed to load Seoul region weather', error)
    hasError.value = true
  } finally {
    isLoading.value = false
  }
}

onMounted(loadWeather)
</script>

<template>
  <section class="home-page">
    <div class="home-heading">
      <div>
        <p class="eyebrow">SEOUL WEATHER GUIDE</p>
        <h1>오늘 서울, 어디로 가볼까요?</h1>
        <p class="page-description">권역별 날씨를 확인하고 지금 어울리는 여행 활동을 찾아보세요.</p>
      </div>
    </div>

    <section class="weather-panel" aria-labelledby="weather-title">
      <div class="weather-panel-heading">
        <div>
          <p class="eyebrow">SEOUL TODAY</p>
          <h2 id="weather-title">서울 권역별 날씨</h2>
        </div>
        <button class="weather-refresh icon-action" type="button" @click="loadWeather" aria-label="날씨 새로고침" title="날씨 새로고침"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 11a8 8 0 0 0-14.8-4L3 10M3 5v5h5M4 13a8 8 0 0 0 14.8 4L21 14m0 5v-5h-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg><span class="sr-only">날씨 새로고침</span></button>
      </div>

      <p v-if="isLoading" class="weather-state">서울 권역별 날씨를 불러오는 중이에요.</p>
      <p v-else-if="hasError" class="weather-state weather-error">날씨 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.</p>

      <div v-else class="weather-content">
        <div class="region-grid" role="tablist" aria-label="서울 날씨 권역 선택">
          <button
            v-for="region in regions"
            :key="region.id"
            class="region-card"
            :class="{ active: selectedRegionId === region.id }"
            type="button"
            role="tab"
            :aria-selected="selectedRegionId === region.id"
            @click="selectedRegionId = region.id"
          >
            <span class="region-name">{{ region.name }}</span>
            <span class="region-areas">{{ region.areas }}</span>
            <span v-if="weatherByRegion[region.id]" class="region-temperature">
              {{ weatherByRegion[region.id].icon }} {{ weatherByRegion[region.id].temperature }}°
            </span>
          </button>
        </div>

        <div v-if="selectedWeather" class="weather-detail" role="tabpanel">
          <div class="weather-main">
            <span class="weather-icon" aria-hidden="true">{{ selectedWeather.icon }}</span>
            <div>
              <p class="weather-location">{{ selectedRegion.name }} · {{ selectedRegion.areas }}</p>
              <strong class="weather-temperature">{{ selectedWeather.temperature }}°C</strong>
              <p class="weather-summary">{{ selectedWeather.label }} · 체감 {{ selectedWeather.feelsLike }}°C</p>
            </div>
          </div>

          <div class="weather-stats">
            <div><span>최고 / 최저</span><strong>{{ selectedWeather.high }}° / {{ selectedWeather.low }}°</strong></div>
            <div><span>강수확률</span><strong>{{ selectedWeather.precipitationProbability }}%</strong></div>
            <div><span>습도</span><strong>{{ selectedWeather.humidity }}%</strong></div>
            <div><span>풍속</span><strong>{{ selectedWeather.windSpeed }}m/s</strong></div>
          </div>

          <div class="activity-guide">
            <span class="activity-guide-icon" aria-hidden="true">✦</span>
            <div>
              <p class="activity-label">오늘의 추천 활동</p>
              <p>{{ getActivityGuide(selectedWeather) }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="home-dashboard" aria-labelledby="dashboard-title">
      <div class="section-heading-row">
        <div>
          <p class="eyebrow">LOCALHUB PULSE</p>
          <h2 id="dashboard-title">서울 여행자들이 지금 보고 있어요</h2>
        </div>
        <RouterLink class="ghost-link" to="/dashboard">대시보드 보기 <span aria-hidden="true">↗</span></RouterLink>
      </div>

      <div class="home-stat-grid">
        <article class="home-stat-card accent-blue">
          <span class="stat-kicker">COMMUNITY POSTS</span>
          <strong>{{ dashboardStats.posts }}</strong>
          <span>여행자 게시글</span>
        </article>
        <article class="home-stat-card accent-lime">
          <span class="stat-kicker">ACTIVE TOPICS</span>
          <strong>{{ dashboardStats.categories }}</strong>
          <span>활발한 카테고리</span>
        </article>
        <article class="home-stat-card accent-coral">
          <span class="stat-kicker">TRENDING TAG</span>
          <strong class="stat-tag">{{ dashboardStats.topTag }}</strong>
          <span>지금 많이 언급되는 태그</span>
        </article>
      </div>
    </section>
  </section>
</template>
