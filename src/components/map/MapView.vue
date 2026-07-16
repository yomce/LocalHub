<template>
  <div class="map-page">
    <div class="panel">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Seoul Travel Planner</p>
          <h2>지도 기반 여행 경로</h2>
        </div>
      </div>

      <div class="controls-grid">
        <div class="control-card">
          <label for="start-input">출발지</label>
          <div class="autocomplete-wrap">
            <input
              id="start-input"
              v-model="startQuery"
              type="text"
              autocomplete="off"
              placeholder="출발지를 검색하세요"
              @focus="openAutocomplete('start')"
              @input="onAutocompleteInput('start', null, $event.target.value)"
              @blur="scheduleClose"
            />
            <ul v-if="isAutocompleteOpen('start') && getSuggestions(startQuery).length" class="autocomplete-list">
              <li
                v-for="place in getSuggestions(startQuery)"
                :key="place.contentid"
                @mousedown.prevent="selectPlace('start', null, place)"
              >
                <strong>{{ place.title }}</strong>
                <span>{{ place.addr1 || place.category }}</span>
              </li>
            </ul>
          </div>
        </div>

        <div class="control-card wide">
          <label>경유지</label>
          <div class="waypoint-list">
            <div
              v-for="(waypoint, index) in waypoints"
              :key="`${waypoint.id || 'empty'}-${index}`"
              class="waypoint-row"
              draggable="true"
              @dragstart="handleWaypointDragStart(index)"
              @dragover.prevent
              @drop="handleWaypointDrop(index)"
              @dragend="handleWaypointDragEnd"
            >
              <span class="drag-handle">⋮⋮</span>

              <div class="autocomplete-wrap">
                <input
                  v-model="waypoint.query"
                  type="text"
                  autocomplete="off"
                  placeholder="경유지를 검색하세요"
                  @focus="openAutocomplete(`waypoint:${index}`)"
                  @input="onAutocompleteInput('waypoint', index, $event.target.value)"
                  @blur="scheduleClose"
                />
                <ul
                  v-if="isAutocompleteOpen(`waypoint:${index}`) && getSuggestions(waypoint.query).length"
                  class="autocomplete-list"
                >
                  <li
                    v-for="place in getSuggestions(waypoint.query)"
                    :key="place.contentid"
                    @mousedown.prevent="selectPlace('waypoint', index, place)"
                  >
                    <strong>{{ place.title }}</strong>
                    <span>{{ place.addr1 || place.category }}</span>
                  </li>
                </ul>
              </div>

              <button class="secondary small" @click="removeWaypoint(index)">삭제</button>
            </div>
          </div>

          <button class="secondary small add-waypoint" @click="addWaypoint">경유지 추가</button>
        </div>

        <div class="control-card">
          <label for="end-input">도착지</label>
          <div class="autocomplete-wrap">
            <input
              id="end-input"
              v-model="endQuery"
              type="text"
              autocomplete="off"
              placeholder="도착지를 검색하세요"
              @focus="openAutocomplete('end')"
              @input="onAutocompleteInput('end', null, $event.target.value)"
              @blur="scheduleClose"
            />
            <ul v-if="isAutocompleteOpen('end') && getSuggestions(endQuery).length" class="autocomplete-list">
              <li
                v-for="place in getSuggestions(endQuery)"
                :key="place.contentid"
                @mousedown.prevent="selectPlace('end', null, place)"
              >
                <strong>{{ place.title }}</strong>
                <span>{{ place.addr1 || place.category }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="section-block">
        <div class="section-title">카테고리</div>
        <div class="filter-chips">
          <button
            v-for="option in categoryOptions"
            :key="option.value"
            class="chip"
            :class="{ active: activeCategories.includes(option.value) }"
            @click="toggleCategory(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <div class="section-block">
        <div class="section-title">경로 제어</div>
        <div class="action-row">
          <button class="primary-btn" @click="drawRoute" :disabled="isLoadingRoute">
            {{ isLoadingRoute ? '경로 계산 중...' : '경로 안내' }}
          </button>
          <button class="secondary" @click="resetMap">초기화</button>
        </div>
      </div>
    </div>

    <div v-if="routeInfo" class="route-summary">
      <strong>경로 요약</strong>
      <span>거리: {{ routeInfo.distance }}</span>
      <span>소요 시간: {{ routeInfo.duration }}</span>
    </div>

    <div v-if="routeError" class="route-error">
      {{ routeError }}
    </div>

    <div class="content-grid">
      <div class="map-shell">
        <div ref="mapRef" class="map-container"></div>

        <div v-if="routeInfo && routeMiniCards.length" class="route-mini-cards">
          <div
            v-for="card in routeMiniCards"
            :key="card.contentid || card.title"
            class="mini-card"
          >
            <p class="mini-label">{{ card.type }}</p>
            <strong>{{ card.title }}</strong>
            <span>{{ card.category }}</span>
          </div>
        </div>
      </div>

      <div class="side-panel">
        <div v-if="selectedPlace" class="detail-card">
          <div class="detail-header">
            <div>
              <span class="detail-badge">{{ selectedPlace.category }}</span>
              <h3>{{ selectedPlace.title }}</h3>
            </div>
            <button class="secondary small close-btn icon-action" aria-label="장소 상세 닫기" title="장소 상세 닫기" @click="selectedPlace = null"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg><span class="sr-only">닫기</span></button>
          </div>

          <img v-if="selectedPlace.firstimage" :src="selectedPlace.firstimage" :alt="selectedPlace.title" />
          <div v-else class="detail-image-placeholder">이미지 없음</div>

          <div class="detail-body">
            <div class="detail-item">
              <strong>주소</strong>
              <span>{{ selectedPlace.addr1 || '주소 정보 없음' }}</span>
            </div>
            <div v-if="selectedPlace.tel" class="detail-item">
              <strong>전화</strong>
              <span>{{ selectedPlace.tel }}</span>
            </div>
            <div v-if="selectedPlace.contenttypeid" class="detail-item">
              <strong>유형</strong>
              <span>{{ selectedPlace.category }}</span>
            </div>
          </div>

          <div class="action-row" v-if="!startId || !endId">
            <button v-if="!startId" class="secondary small" @click="setPlaceAsStart(selectedPlace)">출발지로 설정</button>
            <button v-if="!endId" class="secondary small" @click="setPlaceAsEnd(selectedPlace)">도착지로 설정</button>
          </div>
        </div>

        <div class="recommend-card">
          <div class="recommend-header">
            <h3>추천 여행지</h3>
            <span>{{ routeInfo ? '경로 주변 추천' : '랜덤 추천' }}</span>
          </div>

          <div class="recommend-list">
            <div
              v-for="place in recommendedPlaces"
              :key="place.contentid"
              class="recommend-item"
              @click="selectRecommended(place)"
            >
              <strong>{{ place.title }}</strong>
              <span>{{ place.addr1 || place.category }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const mapRef = ref(null)
const allPlaces = ref([])
const places = ref([])
const startId = ref('')
const endId = ref('')
const waypoints = ref([])
const selectedPlace = ref(null)
const routeInfo = ref(null)
const routeError = ref('')
const isLoadingRoute = ref(false)

const startQuery = ref('')
const endQuery = ref('')
const activeAutocompleteKey = ref(null)
const draggedWaypointIndex = ref(null)

const categoryOptions = [
  { value: '관광지', label: '관광지' },
  { value: '문화시설', label: '문화시설' },
  { value: '축제공연행사', label: '축제공연행사' },
  { value: '숙박', label: '숙박' },
  { value: '레포츠', label: '레포츠' },
]

const activeCategories = ref(categoryOptions.map((option) => option.value))

const koreaBounds = [
  [33.0, 124.0],
  [38.6, 132.0],
]

const seoulBounds = [
  [37.43, 126.70],
  [37.70, 127.20],
]

function isInSouthKorea(item) {
  const lat = Number(item.mapy)
  const lng = Number(item.mapx)

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return false
  }

  return lat >= 33.0 && lat <= 38.6 && lng >= 124.0 && lng <= 132.0
}

function getLatLng(item) {
  const lat = Number(item.mapy)
  const lng = Number(item.mapx)

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null
  }

  if (!isInSouthKorea(item)) {
    return null
  }

  return [lat, lng]
}

let map = null
let markersLayer = null
let routeLayer = null



function getCategoryColor(category) {
  const colors = {
    관광지: '#b85c43',
    문화시설: '#7d8755',
    축제공연행사: '#9b7a59',
    숙박: '#d18a62',
    레포츠: '#70483c',
  }

  return colors[category] || '#b85c43'
}

function createMarkerIcon(color = '#b85c43') {
  return L.divIcon({
    html: `
      <div style="
        background: ${color};
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 2px solid #fffaf1;
        box-shadow: 0 0 6px rgba(0,0,0,0.35);
      "></div>
    `,
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

function formatDistance(meters) {
  return `${(meters / 1000).toFixed(1)}km`
}

function formatDuration(seconds) {
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}분`

  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return `${hours}시간 ${remainder}분`
}

function getPlaceById(id) {
  if (!id) return null
  return places.value.find((place) => place.contentid === id) || allPlaces.value.find((place) => place.contentid === id) || null
}

function getSuggestions(query) {
  const keyword = (query || '').trim().toLowerCase()

  // 자동완성은 카테고리 필터와 무관하게 전체 장소를 대상으로 검색합니다.
  const source = allPlaces.value

  if (!keyword) {
    return source.slice(0, 8)
  }

  return source
    .filter((place) => {
      const text = [place.title, place.addr1, place.category].filter(Boolean).join(' ').toLowerCase()
      return text.includes(keyword)
    })
    .slice(0, 8)
}

function openAutocomplete(key) {
  activeAutocompleteKey.value = key
}

function isAutocompleteOpen(key) {
  return activeAutocompleteKey.value === key
}

function closeAutocomplete() {
  activeAutocompleteKey.value = null
}

function scheduleClose() {
  window.setTimeout(() => {
    closeAutocomplete()
  }, 140)
}

function onAutocompleteInput(key, index, value) {
  if (key === 'start') {
    startQuery.value = value
    startId.value = ''
  } else if (key === 'end') {
    endQuery.value = value
    endId.value = ''
  } else if (key === 'waypoint') {
    waypoints.value[index].query = value
    waypoints.value[index].id = ''
    waypoints.value[index].label = ''
    openAutocomplete(`waypoint:${index}`)
    return
  }

  openAutocomplete(key)
}

function selectPlace(key, index, place) {
  if (key === 'start') {
    startId.value = place.contentid
    startQuery.value = place.title
  } else if (key === 'end') {
    endId.value = place.contentid
    endQuery.value = place.title
  } else if (key === 'waypoint') {
    waypoints.value[index].id = place.contentid
    waypoints.value[index].label = place.title
    waypoints.value[index].query = place.title
  }

  closeAutocomplete()
}

function getFilteredPlaces() {
  return allPlaces.value.filter((place) => {
    if (!activeCategories.value.includes(place.category)) return false
    return isInSouthKorea(place)
  })
}

function toggleCategory(category) {
  if (activeCategories.value.includes(category)) {
    const next = activeCategories.value.filter((item) => item !== category)
    activeCategories.value = next
  } else {
    activeCategories.value = [...activeCategories.value, category]
  }

  applyFilters()
}

function applyFilters() {
  places.value = getFilteredPlaces()
  syncSelections()
  renderMarkers()
}

function syncSelections() {
  if (!places.value.length) {
    startQuery.value = getPlaceById(startId.value)?.title || ''
    endQuery.value = getPlaceById(endId.value)?.title || ''
    return
  }

  const startPlace = getPlaceById(startId.value)
  startQuery.value = startPlace?.title || ''

  const endPlace = getPlaceById(endId.value)
  endQuery.value = endPlace?.title || ''

  waypoints.value = waypoints.value.filter((waypoint) => {
    if (!waypoint.id) return true
    return Boolean(getPlaceById(waypoint.id))
  })

  waypoints.value.forEach((waypoint) => {
    const place = getPlaceById(waypoint.id)
    if (place) {
      waypoint.label = place.title
      waypoint.query = place.title
    }
  })
}


function addWaypoint() {
  waypoints.value.push({ id: '', label: '', query: '' })
}

function removeWaypoint(index) {
  waypoints.value.splice(index, 1)
}

function handleWaypointDragStart(index) {
  draggedWaypointIndex.value = index
}

function handleWaypointDrop(targetIndex) {
  if (draggedWaypointIndex.value === null || draggedWaypointIndex.value === targetIndex) {
    draggedWaypointIndex.value = null
    return
  }

  const next = [...waypoints.value]
  const [moved] = next.splice(draggedWaypointIndex.value, 1)
  next.splice(targetIndex, 0, moved)
  waypoints.value = next
  draggedWaypointIndex.value = null
}

function handleWaypointDragEnd() {
  draggedWaypointIndex.value = null
}

function renderMarkers() {
  if (!map || !markersLayer) return

  // 카테고리 변경 시 마커만 갱신하고, 경로 안내(routeLayer/routeInfo)는 건드리지 않습니다.
  markersLayer.clearLayers()

  const bounds = []

  places.value.forEach((place) => {
    const latlng = getLatLng(place)
    if (!latlng) return

    const marker = L.marker(latlng, {
      icon: createMarkerIcon(getCategoryColor(place.category)),
    }).bindPopup(`
      <strong>${place.title}</strong><br />
      ${place.addr1 || '주소 정보 없음'}
    `)

    marker.on('click', () => {
      selectedPlace.value = place
    })

    marker.addTo(markersLayer)
    bounds.push(latlng)
  })

  // 카테고리 변경 시 지도 자동 확대/축소 방지
  if (!bounds.length) {
    return
  }
}

async function loadPlaces() {
  const files = [
    { file: '/data/서울/서울_관광지.json', category: '관광지' },
    { file: '/data/서울/서울_문화시설.json', category: '문화시설' },
    { file: '/data/서울/서울_축제공연행사.json', category: '축제공연행사' },
    { file: '/data/서울/서울_숙박.json', category: '숙박' },
    { file: '/data/서울/서울_레포츠.json', category: '레포츠' },
  ]

  const loaded = await Promise.all(
    files.map(async ({ file, category }) => {
      const response = await fetch(file)
      const data = await response.json()

      return (data.items || [])
        .filter((item) => isInSouthKorea(item) && getLatLng(item))
        .slice(0, 80)
        .map((item) => ({ ...item, category, contentType: category }))
    })
  )

  allPlaces.value = loaded.flat()
  applyFilters()
}

function pickRandom(items, count) {
  if (!items.length) return []
  const shuffled = [...items]
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, count)
}

async function drawRoute() {
  if (!map || !routeLayer) return

  const start = getPlaceById(startId.value)
  const end = getPlaceById(endId.value)

  if (!start || !end) {
    routeError.value = '출발지와 도착지를 모두 선택해 주세요.'
    return
  }

  const startLatLng = getLatLng(start)
  const endLatLng = getLatLng(end)

  if (!startLatLng || !endLatLng) {
    routeError.value = '좌표 정보가 없는 장소는 경로 계산이 불가능합니다.'
    return
  }

  const waypointPlaces = waypoints.value
    .map((waypoint) => getPlaceById(waypoint.id))
    .filter(Boolean)

  const waypointCoords = waypointPlaces.map((place) => getLatLng(place)).filter(Boolean)

  const points = [startLatLng, ...waypointCoords, endLatLng]
  const coords = points.map((point) => `${point[1]},${point[0]}`).join(';')

  routeLayer.clearLayers()
  routeInfo.value = null
  routeError.value = ''
  isLoadingRoute.value = true

  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
    )
    const data = await response.json()

    if (!data.routes?.length) {
      throw new Error('경로를 찾을 수 없습니다.')
    }

    const route = data.routes[0]
    const routeLine = L.geoJSON(route.geometry, {
      style: {
        color: '#b85c43',
        weight: 6,
        opacity: 0.9,
      },
    }).addTo(routeLayer)

    L.marker(startLatLng, { icon: createMarkerIcon('#7d8755') })
      .bindPopup(`<strong>출발</strong><br />${start.title}`)
      .addTo(routeLayer)

    waypointCoords.forEach((latlng, index) => {
      const place = waypointPlaces[index]
      L.marker(latlng, { icon: createMarkerIcon('#b98a62') })
        .bindPopup(`<strong>경유지</strong><br />${place?.title || '경유지'}`)
        .addTo(routeLayer)
    })

    L.marker(endLatLng, { icon: createMarkerIcon('#70483c') })
      .bindPopup(`<strong>도착</strong><br />${end.title}`)
      .addTo(routeLayer)

    routeInfo.value = {
      distance: formatDistance(route.distance),
      duration: formatDuration(route.duration),
    }

    map.fitBounds(routeLine.getBounds(), { padding: [60, 60] })
  } catch (error) {
    routeError.value = error.message || '경로를 불러오지 못했습니다.'
  } finally {
    isLoadingRoute.value = false
  }
}

function resetMap() {
  selectedPlace.value = null
  routeInfo.value = null
  routeError.value = ''
  startId.value = ''
  endId.value = ''
  startQuery.value = ''
  endQuery.value = ''
  waypoints.value = []

  // 경로 안내는 오직 초기화 버튼을 눌렀을 때만 지워집니다.
  if (routeLayer) {
    routeLayer.clearLayers()
  }

  if (map) {
    map.fitBounds(seoulBounds, { padding: [20, 20] })
  }
  applyFilters()
}

function selectRecommended(place) {
  selectedPlace.value = place
  if (map && place) {
    const latlng = getLatLng(place)
    if (latlng) {
      map.flyTo(latlng, 14, { duration: 0.8 })
    }
  }
}

function setPlaceAsStart(place) {
  if (!place) return
  startId.value = place.contentid
  startQuery.value = place.title
}

function setPlaceAsEnd(place) {
  if (!place) return
  endId.value = place.contentid
  endQuery.value = place.title
}

const recommendedPlaces = computed(() => {
  const blockedIds = new Set([
    startId.value,
    endId.value,
    ...waypoints.value.map((waypoint) => waypoint.id).filter(Boolean),
  ])

  const active = allPlaces.value.filter((place) => {
    if (blockedIds.has(place.contentid)) return false
    return activeCategories.value.includes(place.category)
  })

  if (!active.length) return []

  if (routeInfo.value) {
    const routePoints = [
      getPlaceById(startId.value),
      ...waypoints.value.map((waypoint) => getPlaceById(waypoint.id)).filter(Boolean),
      getPlaceById(endId.value),
    ].filter(Boolean)

    if (routePoints.length) {
      const centerLat = routePoints.reduce((sum, place) => sum + Number(place.mapy), 0) / routePoints.length
      const centerLng = routePoints.reduce((sum, place) => sum + Number(place.mapx), 0) / routePoints.length

      const nearby = active.filter((place) => {
        const latlng = getLatLng(place)
        if (!latlng) return false
        return Math.abs(latlng[0] - centerLat) < 0.12 && Math.abs(latlng[1] - centerLng) < 0.12
      })

      return pickRandom(nearby.length ? nearby : active, 3)
    }
  }

  return pickRandom(active, 3)
})

const routeMiniCards = computed(() => {
  const cards = []

  const startPlace = getPlaceById(startId.value)
  if (startPlace) {
    cards.push({ ...startPlace, type: '출발' })
  }

  waypoints.value.forEach((waypoint) => {
    const place = getPlaceById(waypoint.id)
    if (place) {
      cards.push({ ...place, type: '경유' })
    }
  })

  const endPlace = getPlaceById(endId.value)
  if (endPlace) {
    cards.push({ ...endPlace, type: '도착' })
  }

  return cards.slice(0, 4)
})

onMounted(() => {
  map = L.map(mapRef.value).setView([37.5665, 126.9780], 11)
  map.fitBounds(seoulBounds, { padding: [20, 20] })
  map.setMaxBounds(koreaBounds)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map)

  markersLayer = L.layerGroup().addTo(map)
  routeLayer = L.layerGroup().addTo(map)

  loadPlaces()
})
</script>

<style scoped>
:global(body) {
  margin: 0;
  background: #f5f7fb;
  font-family: 'Pretendard', 'Noto Sans KR', sans-serif;
}

* {
  box-sizing: border-box;
}

.map-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 100vh;
  padding: 18px;
  background: linear-gradient(180deg, #f8fbff 0%, #f5f7fb 100%);
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
}

.panel-header h2 {
  margin: 4px 0 0;
  font-size: 22px;
  color: #0f172a;
}

.eyebrow {
  margin: 0;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: #64748b;
}

.controls-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.control-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #fbfdff;
}

.section-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #fcfdff;
}

.section-title {
  font-size: 13px;
  font-weight: 800;
  color: #475569;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

label,
.filter-label {
  font-size: 14px;
  font-weight: 700;
  color: #334155;
}

input,
button {
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 14px;
}

input {
  width: 100%;
  border: 1px solid #d1d5db;
  background: #fff;
  outline: none;
}

button {
  border: none;
  cursor: pointer;
  color: #fff;
  background: #2563eb;
}

button.secondary {
  background: #6b7280;
}

button.small {
  padding: 8px 10px;
  font-size: 13px;
}

button:disabled {
  cursor: wait;
  opacity: 0.7;
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  background: #f3f4f6;
  color: #111827;
  border: 1px solid #d1d5db;
}

.chip.active {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.waypoint-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.waypoint-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #f8fafc;
  cursor: move;
}

.drag-handle {
  font-size: 16px;
  color: #64748b;
  user-select: none;
}

.add-waypoint {
  margin-top: 6px;
  width: fit-content;
}

.autocomplete-wrap {
  position: relative;
}

.autocomplete-list {
  position: absolute;
  z-index: 1000;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  max-height: 220px;
  overflow: auto;
  margin: 0;
  padding: 6px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12);
}

.autocomplete-list li {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
}

.autocomplete-list li:hover {
  background: #f8fafc;
}

.autocomplete-list strong {
  font-size: 13px;
  color: #0f172a;
}

.autocomplete-list span {
  font-size: 12px;
  color: #64748b;
}

.route-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.route-error {
  color: #dc2626;
  font-size: 14px;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(280px, 0.9fr);
  gap: 14px;
}

.map-shell {
  position: relative;
  min-width: 0;
}

.map-container {
  width: 100%;
  height: 640px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.03);
}

.route-mini-cards {
  position: absolute;
  left: 12px;
  bottom: 12px;
  z-index: 1000;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.mini-card {
  min-width: 130px;
  max-width: 180px;
  padding: 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #e2e8f0;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.12);
}

.mini-label {
  margin: 0 0 4px;
  font-size: 11px;
  font-weight: 700;
  color: #2563eb;
  text-transform: uppercase;
}

.mini-card strong {
  display: block;
  font-size: 13px;
  color: #0f172a;
}

.mini-card span {
  font-size: 12px;
  color: #64748b;
}

.side-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-card,
.recommend-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: 1px solid #dbeafe;
  border-radius: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: flex-start;
}

.detail-badge {
  display: inline-flex;
  margin-bottom: 6px;
  padding: 4px 8px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 700;
}

.detail-card h3,
.recommend-header h3 {
  margin: 0;
  font-size: 18px;
  line-height: 1.3;
}

.recommend-header span {
  font-size: 12px;
  color: #64748b;
}

.detail-card img,
.detail-image-placeholder {
  width: 100%;
  height: 190px;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.detail-image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  color: #64748b;
  font-weight: 600;
}

.detail-body,
.recommend-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid #e5e7eb;
}

.detail-item strong {
  font-size: 13px;
  color: #2563eb;
}

.recommend-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid #e5e7eb;
  cursor: pointer;
}

.recommend-item strong {
  font-size: 13px;
  color: #0f172a;
}

.recommend-item span {
  font-size: 12px;
  color: #64748b;
}

@media (max-width: 1100px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 780px) {
  .map-page {
    padding: 12px;
  }

  .panel {
    padding: 12px;
  }

  .controls-grid {
    grid-template-columns: 1fr;
  }

  .map-container {
    height: 480px;
  }

  .route-mini-cards {
    left: 8px;
    right: 8px;
    bottom: 8px;
  }

  .mini-card {
    flex: 1 1 100%;
    max-width: none;
  }

  .route-summary {
    flex-direction: column;
  }
}

/* Hanji map controls */
:global(body) { background:#f7f2e8; }
.map-page { gap:16px; padding:20px; background:radial-gradient(circle at 85% 0%, rgba(201,111,82,.13), transparent 24rem), linear-gradient(180deg, #fbf6ed 0%, #f1e7d8 100%); background-size:140% 140%; animation:hanji-map-breathe 20s ease-in-out infinite alternate; }
.panel { padding:20px; border-color:#dccbb5; border-radius:18px; background:rgba(255,253,248,.9); box-shadow:0 18px 42px rgba(73,52,34,.09); backdrop-filter:blur(10px); }
.panel-header h2 { color:#5a554f; font-family:"Noto Serif KR", "Noto Serif", Georgia, serif; letter-spacing:-.06em; }
.eyebrow { color:#a9563d; }
.control-card, .section-block { border-color:#e3d5c3; background:#fffaf1; }
.section-title, label, .filter-label { color:#5d5044; }
input { border-color:#d8c7b2; background:#fffdf8; color:#6b635b; }
input:focus { border-color:#c96f52; box-shadow:0 0 0 4px rgba(201,111,82,.13); }
button { background:#b85c43; box-shadow:0 5px 12px rgba(159,79,56,.14); transition:transform .18s ease, background .18s ease, box-shadow .18s ease; }
button:hover:not(:disabled) { background:#9f4f38; box-shadow:0 8px 16px rgba(159,79,56,.2); transform:translateY(-1px); }
button.secondary { background:#887b6d; }
button.secondary:hover:not(:disabled) { background:#6f6255; }
.chip { border-color:#d8c7b2; background:#f3eadc; color:#5d5044; }
.chip.active { color:#fffaf1; }
.filter-chips .chip:nth-child(1) { border-color:#d69a87; color:#a9563d; }
.filter-chips .chip:nth-child(2) { border-color:#b7c18a; color:#687143; }
.filter-chips .chip:nth-child(3) { border-color:#c9ad8d; color:#806344; }
.filter-chips .chip:nth-child(4) { border-color:#e3b79a; color:#b56f4e; }
.filter-chips .chip:nth-child(5) { border-color:#a4877b; color:#70483c; }
.filter-chips .chip:nth-child(1).active { border-color:#b85c43; background:#b85c43; }
.filter-chips .chip:nth-child(2).active { border-color:#7d8755; background:#7d8755; }
.filter-chips .chip:nth-child(3).active { border-color:#9b7a59; background:#9b7a59; }
.filter-chips .chip:nth-child(4).active { border-color:#d18a62; background:#d18a62; }
.filter-chips .chip:nth-child(5).active { border-color:#70483c; background:#70483c; }
.filter-chips .chip:nth-child(1).active,
.filter-chips .chip:nth-child(2).active,
.filter-chips .chip:nth-child(3).active,
.filter-chips .chip:nth-child(4).active,
.filter-chips .chip:nth-child(5).active { color:#fffaf1; }
.waypoint-row { border-color:#e3d5c3; background:#f8f0e4; }
.drag-handle { color:#9b7a59; }
.autocomplete-list { border-color:#e3d5c3; background:#fffdf8; box-shadow:0 12px 28px rgba(73,52,34,.16); }
.autocomplete-list li:hover { background:#f5eadc; }
.autocomplete-list strong { color:#6b635b; }
.autocomplete-list span { color:#887b6d; }
.route-summary { border-color:#dccbb5; background:#f3eadc; color:#5d5044; }
.route-error { color:#a33e31; }
.map-container { border-color:#d8c7b2; box-shadow:inset 0 0 0 1px rgba(73,52,34,.07); }
.mini-card, .detail-card, .recommend-card { border-color:#dccbb5; background:linear-gradient(180deg, #fffdf8 0%, #f8f0e4 100%); box-shadow:0 12px 30px rgba(73,52,34,.12); }
.mini-label, .detail-item strong { color:#b85c43; }
.mini-card strong, .recommend-item strong { color:#6b635b; }
.mini-card span, .recommend-item span, .recommend-header span { color:#887b6d; }
.detail-badge { background:#f1ddd2; color:#9f4f38; }
.detail-card img, .detail-image-placeholder, .detail-item, .recommend-item { border-color:#e3d5c3; }
.detail-image-placeholder { background:linear-gradient(135deg, #f8f0e4 0%, #eadbc8 100%); color:#887b6d; }
.detail-item { background:#fffdf8; }
.recommend-item { background:#fffdf8; transition:transform .18s ease, border-color .18s ease, background .18s ease; }
.recommend-item:hover { border-color:#c96f52; background:#fff8ee; transform:translateX(3px); }
@keyframes hanji-map-breathe { from { background-position:0% 0%; } to { background-position:100% 80%; } }
</style>
