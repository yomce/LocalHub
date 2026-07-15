<template>
  <div class="map-page">
    <div class="panel">
      <div class="map-controls">
        <div class="control-group">
          <label for="start">출발지</label>
          <select id="start" v-model="startId">
            <option value="">선택하세요</option>
            <option v-for="place in places" :key="place.contentid" :value="place.contentid">
              {{ place.title }}
            </option>
          </select>
        </div>

        <div class="control-group wide">
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
              <select v-model="waypoint.id">
                <option value="">선택하세요</option>
                <option v-for="place in places" :key="place.contentid" :value="place.contentid">
                  {{ place.title }}
                </option>
              </select>
              <button class="secondary small" @click="removeWaypoint(index)">삭제</button>
            </div>
          </div>
          <button class="secondary small add-waypoint" @click="addWaypoint">경유지 추가</button>
        </div>

        <div class="control-group">
          <label for="end">도착지</label>
          <select id="end" v-model="endId">
            <option value="">선택하세요</option>
            <option v-for="place in places" :key="place.contentid" :value="place.contentid">
              {{ place.title }}
            </option>
          </select>
        </div>
      </div>

      <div class="filter-row">
        <span class="filter-label">카테고리</span>
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

      <div class="action-row">
        <button @click="drawRoute" :disabled="isLoadingRoute">
          {{ isLoadingRoute ? '경로 계산 중...' : '경로 안내' }}
        </button>
        <button class="secondary" @click="resetMap">초기화</button>
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

        <div class="map-search">
          <input v-model="searchQuery" @input="applyFilters" placeholder="장소 이름, 주소, 카테고리 검색" />
          <span class="result-pill">{{ places.length }}개 표시</span>
        </div>
      </div>

      <div v-if="selectedPlace" class="detail-card">
        <div class="detail-header">
          <div>
            <span class="detail-badge">{{ selectedPlace.category }}</span>
            <h3>{{ selectedPlace.title }}</h3>
          </div>
          <button class="secondary small close-btn" @click="selectedPlace = null">닫기</button>
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
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
const searchQuery = ref('')
const draggedWaypointIndex = ref(null)

const categoryOptions = [
  { value: '관광지', label: '관광지' },
  { value: '문화시설', label: '문화시설' },
  { value: '축제공연행사', label: '축제공연행사' },
  { value: '숙박', label: '숙박' },
  { value: '레포츠', label: '레포츠' },
]

const activeCategories = ref(categoryOptions.map((option) => option.value))
const seoulBounds = [
  [37.43, 126.70],
  [37.70, 127.20],
]

let map = null
let markersLayer = null
let routeLayer = null

function getLatLng(item) {
  const lat = Number(item.mapy)
  const lng = Number(item.mapx)

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null
  }

  return [lat, lng]
}

function getCategoryColor(category) {
  const colors = {
    관광지: '#2563eb',
    문화시설: '#7c3aed',
    축제공연행사: '#0f766e',
    숙박: '#ea580c',
    레포츠: '#dc2626',
  }

  return colors[category] || '#2563eb'
}

function createMarkerIcon(color = '#2563eb') {
  return L.divIcon({
    html: `
      <div style="
        background: ${color};
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 2px solid white;
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

function getFilteredPlaces() {
  const query = searchQuery.value.trim().toLowerCase()

  return allPlaces.value.filter((place) => {
    const matchesCategory = activeCategories.value.includes(place.category)
    if (!matchesCategory) return false

    if (!query) return true

    const searchableText = [place.title, place.addr1, place.category, place.tel]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return searchableText.includes(query)
  })
}

function applyFilters() {
  places.value = getFilteredPlaces()
  syncSelections()
  renderMarkers()
}

function syncSelections() {
  if (!places.value.length) {
    startId.value = ''
    endId.value = ''
    waypoints.value = []
    return
  }

  if (!places.value.some((place) => place.contentid === startId.value)) {
    startId.value = places.value[0].contentid
  }

  if (!places.value.some((place) => place.contentid === endId.value)) {
    endId.value = places.value[1]?.contentid || places.value[0].contentid
  }

  waypoints.value = waypoints.value.filter((waypoint) =>
    places.value.some((place) => place.contentid === waypoint.id)
  )
}

function toggleCategory(category) {
  if (activeCategories.value.includes(category)) {
    const next = activeCategories.value.filter((item) => item !== category)
    activeCategories.value = next.length ? next : categoryOptions.map((option) => option.value)
  } else {
    activeCategories.value = [...activeCategories.value, category]
  }

  applyFilters()
}

function addWaypoint() {
  waypoints.value.push({ id: '' })
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

  markersLayer.clearLayers()
  routeLayer.clearLayers()
  routeInfo.value = null
  routeError.value = ''

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

  if (bounds.length) {
    map.fitBounds(bounds, { padding: [40, 40] })
  } else {
    map.fitBounds(seoulBounds, { padding: [20, 20] })
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
        .filter((item) => getLatLng(item))
        .slice(0, 80)
        .map((item) => ({ ...item, category, contentType: category }))
    })
  )

  allPlaces.value = loaded.flat()
  applyFilters()
}

async function drawRoute() {
  if (!map || !routeLayer) return

  const start = places.value.find((item) => item.contentid === startId.value)
  const end = places.value.find((item) => item.contentid === endId.value)

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

  const waypointCoords = waypoints.value
    .map((waypoint) => places.value.find((place) => place.contentid === waypoint.id))
    .filter(Boolean)
    .map((place) => getLatLng(place))
    .filter(Boolean)

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
        color: '#2563eb',
        weight: 6,
        opacity: 0.85,
      },
    }).addTo(routeLayer)

    L.marker(startLatLng, { icon: createMarkerIcon('#2ecc71') })
      .bindPopup(`<strong>출발</strong><br />${start.title}`)
      .addTo(routeLayer)

    if (waypointCoords.length) {
      waypointCoords.forEach((latlng, index) => {
        const waypoint = waypoints.value[index]
        const place = places.value.find((item) => item.contentid === waypoint?.id)
        L.marker(latlng, { icon: createMarkerIcon('#f59e0b') })
          .bindPopup(`<strong>경유지</strong><br />${place?.title || '경유지'}`)
          .addTo(routeLayer)
      })
    }

    L.marker(endLatLng, { icon: createMarkerIcon('#e74c3c') })
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
  searchQuery.value = ''
  if (map) {
    map.fitBounds(seoulBounds, { padding: [20, 20] })
  }
  applyFilters()
}

onMounted(() => {
  map = L.map(mapRef.value).setView([37.5665, 126.9780], 11)
  map.fitBounds(seoulBounds, { padding: [20, 20] })
  map.setMaxBounds(seoulBounds)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map)

  markersLayer = L.layerGroup().addTo(map)
  routeLayer = L.layerGroup().addTo(map)

  loadPlaces()
})
</script>

<style scoped>
.map-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.map-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 220px;
  flex: 1 1 220px;
}

.control-group.wide {
  min-width: 280px;
  flex: 1.2 1 280px;
}

label,
.filter-label {
  font-size: 14px;
  font-weight: 700;
  color: #334155;
}

select,
button,
input {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-size: 14px;
}

select,
input {
  background: #fff;
}

button {
  background: #2563eb;
  color: white;
  border: none;
  cursor: pointer;
}

button.secondary {
  background: #6b7280;
}

button.small {
  padding: 7px 10px;
  font-size: 13px;
}

button:disabled {
  opacity: 0.7;
  cursor: wait;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
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
  gap: 10px;
  flex-wrap: wrap;
}

.waypoint-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.waypoint-row {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #f8fafc;
  cursor: move;
}

.drag-handle {
  color: #64748b;
  font-size: 16px;
  user-select: none;
}

.add-waypoint {
  margin-top: 6px;
  width: fit-content;
}

.route-summary {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  padding: 10px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
}

.route-error {
  color: #dc2626;
  font-size: 14px;
}

.content-grid {
  display: grid;
  grid-template-columns: 1.8fr 1fr;
  gap: 14px;
}

.map-shell {
  position: relative;
}

.map-container {
  width: 100%;
  height: 620px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.03);
}

.map-search {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
}

.map-search input {
  min-width: 220px;
  border: none;
  outline: none;
  padding: 0;
}

.result-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 999px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.detail-card {
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

.detail-card h3 {
  margin: 0;
  font-size: 18px;
  line-height: 1.3;
}

.close-btn {
  flex-shrink: 0;
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

.detail-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: #374151;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
}

.detail-item strong {
  font-size: 13px;
  color: #2563eb;
}

@media (max-width: 1100px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .panel {
    padding: 12px;
  }

  .map-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .control-group,
  .control-group.wide {
    min-width: 100%;
    flex: 1 1 100%;
  }

  .map-container {
    height: 480px;
  }

  .map-search {
    left: 10px;
    right: 10px;
    flex-wrap: wrap;
    border-radius: 12px;
  }

  .map-search input {
    min-width: 0;
    flex: 1 1 100%;
  }

  .route-summary {
    flex-direction: column;
    gap: 8px;
  }
}
</style>