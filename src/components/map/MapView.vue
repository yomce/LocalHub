<template>
  <div class="map-page">
    <div class="map-controls">
      <div class="control-group">
        <label for="start">출발지</label>
        <select id="start" v-model="startId">
          <option v-for="place in places" :key="place.contentid" :value="place.contentid">
            {{ place.title }}
          </option>
        </select>
      </div>

      <div class="control-group">
        <label for="end">도착지</label>
        <select id="end" v-model="endId">
          <option v-for="place in places" :key="place.contentid" :value="place.contentid">
            {{ place.title }}
          </option>
        </select>
      </div>

      <button @click="drawRoute" :disabled="isLoadingRoute">
        {{ isLoadingRoute ? '경로 계산 중...' : '경로 안내' }}
      </button>
      <button class="secondary" @click="resetMap">초기화</button>
    </div>

    <div v-if="routeInfo" class="route-summary">
      <strong>경로 요약</strong>
      <span>거리: {{ routeInfo.distance }}</span>
      <span>소요 시간: {{ routeInfo.duration }}</span>
    </div>

    <div v-if="routeError" class="route-error">
      {{ routeError }}
    </div>

    <div ref="mapRef" class="map-container"></div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const mapRef = ref(null)
const places = ref([])
const startId = ref('')
const endId = ref('')
const routeInfo = ref(null)
const routeError = ref('')
const isLoadingRoute = ref(false)

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
      icon: createMarkerIcon('#2563eb'),
    }).bindPopup(`
      <strong>${place.title}</strong><br />
      ${place.addr1 || '주소 정보 없음'}
    `)

    marker.addTo(markersLayer)
    bounds.push(latlng)
  })

  if (bounds.length) {
    map.fitBounds(bounds, { padding: [40, 40] })
  }
}

async function loadPlaces() {
  const response = await fetch('/data/서울/서울_축제공연행사.json')
  const data = await response.json()

  places.value = (data.items || [])
    .filter((item) => getLatLng(item))
    .slice(0, 40)

  if (places.value.length) {
    startId.value = places.value[0].contentid
    endId.value = places.value[1]?.contentid || places.value[0].contentid
    renderMarkers()
  }
}

async function drawRoute() {
  if (!map || !routeLayer) return

  const start = places.value.find((item) => item.contentid === startId.value)
  const end = places.value.find((item) => item.contentid === endId.value)

  if (!start || !end) return

  const startLatLng = getLatLng(start)
  const endLatLng = getLatLng(end)

  if (!startLatLng || !endLatLng) return

  routeLayer.clearLayers()
  routeInfo.value = null
  routeError.value = ''
  isLoadingRoute.value = true

  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${startLatLng[1]},${startLatLng[0]};${endLatLng[1]},${endLatLng[0]}` +
      `?overview=full&geometries=geojson`

    const response = await fetch(url)
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

    L.marker(startLatLng, {
      icon: createMarkerIcon('#2ecc71'),
    })
      .bindPopup(`<strong>출발</strong><br />${start.title}`)
      .addTo(routeLayer)

    L.marker(endLatLng, {
      icon: createMarkerIcon('#e74c3c'),
    })
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
  renderMarkers()
}

onMounted(() => {
  map = L.map(mapRef.value).setView([37.5665, 126.9780], 12)

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
  gap: 12px;
}

.map-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: end;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  font-size: 14px;
  font-weight: 600;
}

select,
button {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
}

button {
  background: #2563eb;
  color: white;
  border: none;
  cursor: pointer;
}

button:disabled {
  opacity: 0.7;
  cursor: wait;
}

button.secondary {
  background: #6b7280;
}

.route-summary {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  padding: 10px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
}

.route-error {
  color: #dc2626;
  font-size: 14px;
}

.map-container {
  width: 100%;
  height: 620px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}
</style>