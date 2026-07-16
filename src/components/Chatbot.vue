<template>
  <div class="chatbot">
    <button class="chat-toggle" :class="{ 'is-open': isOpen }" @click="isOpen = !isOpen" type="button">
      <span class="toggle-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M5 7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7Z" stroke="currentColor" stroke-width="1.8" />
          <path d="M8 10h8M8 13h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
      </span>
      <span class="sr-only">{{ isOpen ? '챗봇 닫기' : '챗봇 열기' }}</span>
    </button>

    <div class="chat-panel" :class="{ open: isOpen }" :style="panelStyle">
      <div class="chat-resizer" @mousedown.prevent="startResize" title="크기 조절"></div>

      <div class="chat-shell">
        <aside class="chat-sidebar" :class="{ collapsed: !sidebarOpen }">
          <div class="sidebar-head">
            <div>
              <p class="sidebar-label">대화 기록</p>
              <h3>최근 채팅</h3>
            </div>
            <button class="sidebar-new" @click="startNewChat" type="button">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg>
              <span class="sr-only">새 대화</span>
            </button>
          </div>

          <ul class="conversation-list">
            <li
              v-for="conversation in conversations"
              :key="conversation.id"
              :class="['conversation-item', { active: conversation.id === activeConversationId }]"
              @click="selectConversation(conversation.id)"
            >
              <button class="delete-conversation" @click.stop="removeConversation(conversation.id)" type="button" aria-label="대화 삭제">✕</button>
              <div class="conversation-main">
                <strong>{{ conversation.title }}</strong>
                <span>{{ conversation.messages?.length ? `${conversation.messages.length}개 메시지` : '새 대화' }}</span>
              </div>
            </li>
          </ul>
        </aside>

        <section class="chat-main">
          <header class="chat-header">
            <div class="chat-title">
              <div class="chat-icon-badge" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M6 8.5A2.5 2.5 0 0 1 8.5 6h7A2.5 2.5 0 0 1 18 8.5v3.2a2.5 2.5 0 0 1-2.5 2.5h-2.1l-2.4 2.4-2.4-2.4H8.5A2.5 2.5 0 0 1 6 11.7V8.5Z" stroke="currentColor" stroke-width="1.8" />
                  <path d="M9 10.5h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                </svg>
              </div>
              <div>
                <p class="chat-eyebrow">LocalHub</p>
                <h2>서울 여행 도우미</h2>
              </div>
            </div>
            <div class="chat-header-actions">
              <button class="ghost-btn icon-action" @click="startNewChat" type="button" aria-label="새 대화" title="새 대화"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg><span class="sr-only">새 대화</span></button>
              <button class="ghost-btn icon-action" @click="toggleSidebar" type="button" :aria-label="sidebarOpen ? '사이드바 접기' : '사이드바 펼치기'" :title="sidebarOpen ? '사이드바 접기' : '사이드바 펼치기'"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path :d="sidebarOpen ? 'm15 6-6 6 6 6' : 'm9 6 6 6-6 6'" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg><span class="sr-only">{{ sidebarOpen ? '사이드바 접기' : '사이드바 펼치기' }}</span></button>
            </div>
          </header>

          <main class="chat-body" ref="chatBody">
            <div v-for="(m, i) in messages" :key="`${activeConversationId}-${i}`" :class="['msg', m.from]">
              <div class="msg-content">
                <div class="msg-text" v-html="formatText(m.text)"></div>
                <div class="msg-time">{{ m.time }}</div>
              </div>
            </div>
            <div v-if="loading" class="msg bot typing">챗봇이 응답 중입니다…</div>
          </main>

          <form class="chat-input" @submit.prevent="sendMessage">
            <input v-model="text" placeholder="질문을 입력하세요 (예: 관광 추천)" />
            <button class="icon-action" type="submit" aria-label="메시지 전송" title="메시지 전송"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m4 4 16 8-16 8 3-8-3-8Zm3 8h13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg><span class="sr-only">전송</span></button>
          </form>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { getBotReply } from '../services/chatService'

const isOpen = ref(false)
const text = ref('')
const loading = ref(false)
const chatBody = ref(null)
const sidebarOpen = ref(true)
const isMobile = ref(false)
const panelWidth = ref(600)
const panelHeight = ref(620)
const panelStyle = computed(() => {
  if (isMobile.value) {
    return {
      width: 'min(100vw - 24px, 100%)',
      height: 'calc(100dvh - 24px)'
    }
  }
  return { width: `${panelWidth.value}px`, height: `${panelHeight.value}px` }
})
const STORAGE_KEY = 'localhub_chat_conversations_v2'

function makeWelcomeMessage() {
  return {
    from: 'bot',
    text: '안녕하세요! 무엇을 도와드릴까요? 예: "서울 관광 추천" 또는 "숙박 추천"',
    time: new Date().toLocaleString()
  }
}

function createConversation() {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: '새 대화',
    messages: [makeWelcomeMessage()]
  }
}

const conversations = ref([])
const activeConversationId = ref('')
const activeConversation = computed(() => conversations.value.find((c) => c.id === activeConversationId.value) || conversations.value[0] || null)
const messages = computed(() => activeConversation.value?.messages || [])

function saveConversations() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      conversations: conversations.value,
      activeConversationId: activeConversationId.value
    }))
  } catch (e) {}
}

function loadConversations() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return false
    const parsed = JSON.parse(saved)
    if (Array.isArray(parsed.conversations) && parsed.conversations.length) {
      conversations.value = parsed.conversations
      activeConversationId.value = parsed.activeConversationId || parsed.conversations[0].id
      return true
    }
  } catch (e) {}
  return false
}

function updateViewport() {
  if (typeof window === 'undefined') return
  isMobile.value = window.innerWidth <= 760
}

onMounted(() => {
  updateViewport()
  window.addEventListener('resize', updateViewport)

  if (!loadConversations()) {
    const first = createConversation()
    conversations.value = [first]
    activeConversationId.value = first.id
  }
  nextTick(() => scrollToBottom())
})

watch([conversations, activeConversationId], () => {
  saveConversations()
  nextTick(() => scrollToBottom())
}, { deep: true })

watch(messages, () => {
  nextTick(() => scrollToBottom())
}, { deep: true })

function pushMessage(from, textContent) {
  if (!activeConversation.value) return
  activeConversation.value.messages.push({
    from,
    text: textContent,
    time: new Date().toLocaleString()
  })
}

function scrollToBottom() {
  const el = chatBody.value
  if (!el) return
  el.scrollTop = el.scrollHeight
}

function formatText(text) {
  return ('' + text).replace(/\n/g, '<br/>')
}

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function removeConversation(id) {
  if (!id) return
  const index = conversations.value.findIndex((conversation) => conversation.id === id)
  if (index === -1) return

  conversations.value.splice(index, 1)

  if (activeConversationId.value === id) {
    const nextConversation = conversations.value[0]
    if (nextConversation) {
      activeConversationId.value = nextConversation.id
    } else {
      const fresh = createConversation()
      conversations.value = [fresh]
      activeConversationId.value = fresh.id
    }
  }

  text.value = ''
  if (isMobile.value) sidebarOpen.value = false
}

function selectConversation(id) {
  const selected = conversations.value.find((conversation) => conversation.id === id)
  if (selected) {
    activeConversationId.value = selected.id
    text.value = ''
    if (isMobile.value) sidebarOpen.value = false
    nextTick(() => scrollToBottom())
  }
}

function startNewChat() {
  const next = createConversation()
  conversations.value.unshift(next)
  activeConversationId.value = next.id
  text.value = ''
  if (isMobile.value) sidebarOpen.value = false
  nextTick(() => scrollToBottom())
}

function deriveConversationTitle(message) {
  const normalized = (message || '').replace(/[^\w가-힣\s]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase()
  if (!normalized) return '새 대화'

  const categoryPatterns = [
    { label: '숙박 추천', patterns: [/숙박/, /호텔/, /민박/, /펜션/, /모텔/, /게스트하우스/] },
    { label: '관광 추천', patterns: [/관광/, /명소/, /볼거리/, /가볼만/, /여행지/, /데이트/] },
    { label: '문화 추천', patterns: [/문화/, /공연/, /전시/, /뮤지엄/, /박물관/, /콘서트/] },
    { label: '레포츠 추천', patterns: [/레포츠/, /액티비티/, /운동/, /체험/, /레저/] },
  ]

  for (const item of categoryPatterns) {
    if (item.patterns.some((pattern) => pattern.test(normalized))) return item.label
  }

  const stopWords = new Set(['추천', '어디', '어떤', '뭐', '어때', '가고', '가요', '좀', '서울', '좋은', '좋아', '알려', '정보', '찾아'])
  const tokens = normalized.match(/[가-힣]{2,}/g) || []
  const keywords = tokens.filter((token) => !stopWords.has(token))

  if (keywords.length >= 2) {
    return `${keywords[0]} ${keywords[1]}`.slice(0, 20)
  }
  if (keywords.length === 1) {
    return keywords[0].slice(0, 18)
  }
  return normalized.length > 18 ? `${normalized.slice(0, 18)}…` : normalized
}

async function sendMessage() {
  const trimmed = (text.value || '').trim()
  if (!trimmed) return

  if (activeConversation.value?.title === '새 대화') {
    activeConversation.value.title = deriveConversationTitle(trimmed)
  }

  pushMessage('user', trimmed)
  text.value = ''
  loading.value = true
  try {
    const reply = await getBotReply(trimmed)
    pushMessage('bot', reply)
  } catch (e) {
    pushMessage('bot', '죄송합니다. 응답을 가져오는 중 오류가 발생했습니다.')
  } finally {
    loading.value = false
  }
}

let resizing = false
let startX = 0
let startY = 0
let startWidth = 0
let startHeight = 0

function startResize(event) {
  resizing = true
  startX = event.clientX
  startY = event.clientY
  startWidth = panelWidth.value
  startHeight = panelHeight.value
  window.addEventListener('mousemove', onResize)
  window.addEventListener('mouseup', stopResize)
}

function onResize(event) {
  if (!resizing) return
  const deltaX = event.clientX - startX
  const deltaY = event.clientY - startY
  panelWidth.value = Math.min(640, Math.max(320, startWidth - deltaX))
  panelHeight.value = Math.min(780, Math.max(480, startHeight - deltaY))
}

function stopResize() {
  resizing = false
  window.removeEventListener('mousemove', onResize)
  window.removeEventListener('mouseup', stopResize)
}

onUnmounted(() => {
  stopResize()
  window.removeEventListener('resize', updateViewport)
})
</script>

<style scoped>
.chatbot { position: relative; }
.chat-toggle {
  position: fixed;
  right: 24px;
  bottom: 24px;
  left: auto;
  top: auto;
  z-index: 1200;
  border: none;
  border-radius: 999px;
  padding: 12px 16px;
  cursor: pointer;
  font-weight: 800;
  color: var(--color-surface);
  background: linear-gradient(135deg, var(--color-blue), #4f8cff);
  box-shadow: 0 14px 30px rgba(39, 100, 216, 0.24);
  transition: transform 180ms ease, box-shadow 180ms ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.chat-toggle:hover { transform: translateY(-2px); box-shadow: 0 16px 34px rgba(39, 100, 216, 0.28); }
.chat-toggle.is-open { background: linear-gradient(135deg, var(--color-navy), #35547c); }
.toggle-icon { display: inline-flex; width: 20px; height: 20px; }
.toggle-icon svg { width: 100%; height: 100%; }
.chat-panel {
  position: fixed;
  bottom: 86px;
  right: 24px;
  top: auto;
  left: auto;
  z-index: 1150;
  display: flex;
  flex-direction: column;
  border-radius: 20px;
  background: var(--color-surface);
  box-shadow: 0 22px 50px rgba(18, 34, 61, 0.2);
  border: 1px solid var(--color-line);
  overflow: hidden;
  transform-origin: bottom right;
  transform: translateY(10px) scale(0.98);
  opacity: 0;
  pointer-events: none;
  transition: transform 240ms cubic-bezier(.22,1,.36,1), opacity 240ms ease, width 220ms ease, height 220ms ease;
}
.chat-panel.open { transform: translateY(0) scale(1); opacity: 1; pointer-events: auto; }
.chat-resizer {
  position: absolute;
  left: 8px;
  top: 8px;
  width: 24px;
  height: 24px;
  border-top-left-radius: 12px;
  cursor: nwse-resize;
  background: linear-gradient(135deg, transparent 40%, rgba(18, 34, 61, 0.12) 40%, rgba(18, 34, 61, 0.12) 60%, transparent 60%);
}
.chat-shell { display: flex; flex: 1; min-height: 0; }
.chat-sidebar {
  width: 220px;
  border-right: 1px solid var(--color-line);
  background: linear-gradient(180deg, #f8fbff 0%, #f2f5fb 100%);
  display: flex;
  flex-direction: column;
  transition: width 220ms ease, opacity 220ms ease, transform 220ms ease;
}
.chat-sidebar.collapsed {
  width: 62px;
  opacity: 0.96;
  overflow: hidden;
  border-right: 1px solid var(--color-line);
}
.chat-sidebar.collapsed .sidebar-head > div,
.chat-sidebar.collapsed .sidebar-new span:last-child,
.chat-sidebar.collapsed .conversation-item span,
.chat-sidebar.collapsed .conversation-item strong {
  display: none;
}
.sidebar-head { padding: 14px; border-bottom: 1px solid var(--color-line); }
.sidebar-label { margin: 0 0 4px; color: var(--color-blue); font-size: 0.72rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
.sidebar-head h3 { margin: 0; color: var(--color-navy); font-size: 0.95rem; }
.sidebar-new {
  margin-top: 10px;
  width: 100%;
  border: none;
  border-radius: 10px;
  padding: 8px 10px;
  background: var(--color-blue);
  color: white;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.conversation-list { list-style: none; margin: 0; padding: 10px; display: flex; flex-direction: column; gap: 8px; overflow: auto; }
.conversation-item {
  position: relative;
  padding: 10px 36px 10px 10px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.conversation-item.active { background: #eaf2ff; border-color: #d7e8ff; }
.delete-conversation {
  position: absolute;
  top: 8px;
  right: 8px;
  border: none;
  background: transparent;
  color: var(--color-muted);
  cursor: pointer;
  font-size: 0.9rem;
}
.delete-conversation:hover { color: #c0392b; }
.conversation-main { display: flex; flex-direction: column; gap: 4px; }
.conversation-item strong { color: var(--color-navy); font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.conversation-item span { color: var(--color-muted); font-size: 0.78rem; }
.chat-main { flex: 1; display: flex; flex-direction: column; min-width: 0; min-height: 0; }
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-line);
  background: #fbfcff;
}
.chat-title { display: flex; align-items: center; gap: 10px; min-width: 0; }
.chat-icon-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #eaf2ff, #dce9ff);
  color: var(--color-blue);
}
.chat-icon-badge svg { width: 20px; height: 20px; }
.chat-eyebrow { margin: 0 0 4px; color: var(--color-blue); font-size: 0.72rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
.chat-header h2 { margin: 0; font-size: 1rem; color: var(--color-navy); }
.chat-header-actions { display: flex; gap: 8px; }
.ghost-btn {
  border: 1px solid var(--color-line);
  background: var(--color-surface);
  color: var(--color-muted);
  border-radius: 999px;
  padding: 7px 10px;
  cursor: pointer;
  font-size: 0.8rem;
}
.chat-body { flex: 1; padding: 12px; overflow: auto; background: #fff; }
.msg { margin-bottom: 10px; max-width: 100%; display: flex; min-width: 0; }
.msg.user { justify-content: flex-end; }
.msg.bot { justify-content: flex-start; }
.msg-content { display: flex; flex-direction: column; max-width: 78%; }
.msg.user .msg-content { align-items: flex-end; }
.msg.bot .msg-content { align-items: flex-start; }
.msg-text { display: inline-block; padding: 10px 12px; word-break: break-word; white-space: normal; overflow-wrap: break-word; box-sizing: border-box; }
.msg.user .msg-text { background: linear-gradient(135deg, var(--color-blue), #4f8cff); color: #fff; border-radius: 16px 16px 6px 16px; box-shadow: 0 8px 20px rgba(39, 100, 216, 0.16); }
.msg.bot .msg-text { background: #f3f7ff; color: var(--color-text); border-radius: 16px 16px 16px 6px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04); }
.msg-text :deep(.reply-shell) { display: flex; flex-direction: column; gap: 8px; width: 100%; }
.msg-text :deep(.reply-heading) { font-weight: 700; color: var(--color-navy); font-size: 0.95rem; margin-bottom: 2px; }
.msg-text :deep(.reply-list) { display: flex; flex-direction: column; gap: 8px; }
.msg-text :deep(.chat-card) { margin: 0; padding: 10px 12px; border-radius: 12px; background: #fff; border: 1px solid #e7edf7; box-shadow: none; }
.msg-text :deep(.chat-card-title) { font-size: 0.95rem; font-weight: 700; color: var(--color-navy); margin-bottom: 4px; }
.msg-text :deep(.chat-card-details) { font-size: 0.84rem; color: var(--color-muted); margin: 0; }
.msg-text :deep(.chat-card-actions) { margin-top: 6px; }
.msg-text :deep(.chat-card-actions a) { font-weight: 700; }
.msg-time { font-size: 11px; color: #8a93a0; margin-top: 6px; }
.chat-input { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-top: 1px solid var(--color-line); background: #fbfcff; }
.chat-input input { flex: 1; min-width: 0; padding: 10px 12px; border: 1px solid var(--color-line); border-radius: 999px; background: var(--color-surface); color: var(--color-text); font: inherit; height: 42px; box-sizing: border-box; }
.chat-input button { height: 42px; padding: 0 14px; border: none; border-radius: 999px; background: var(--color-blue); color: #fff; cursor: pointer; font-weight: 700; }
.typing { font-style: italic; color: #667085; padding: 6px 10px; background: transparent; }
.chat-card { border: 1px solid #e8eef8; border-radius: 12px; padding: 10px; margin-bottom: 10px; background: linear-gradient(180deg, #fff, #fbfdff); }
.chat-card-body { display: flex; flex-direction: column; }
.chat-card-title { font-weight: 700; margin-bottom: 6px; color: var(--color-navy); }
.chat-card-details { font-size: 13px; color: #667085; margin-bottom: 8px; }
.chat-card-actions a { font-size: 13px; color: var(--color-blue); text-decoration: none; }
.msg { animation: slideIn 180ms ease both; }
@keyframes slideIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 900px) {
  .chat-panel {
    top: auto;
    right: 12px;
    left: 12px;
    bottom: 12px;
    width: auto !important;
    height: calc(100dvh - 24px) !important;
  }
  .chat-toggle {
    right: 12px;
    bottom: 12px;
  }
  .chat-panel {
    bottom: 80px;
    right: 12px;
  }
}

@media (max-width: 640px) {
  .chat-header { flex-direction: column; align-items: flex-start; }
  .chat-header-actions { width: 100%; justify-content: flex-start; }
  .chat-input { gap: 6px; }
  .chat-input input { height: 40px; }
  .chat-input button { height: 40px; }
  .chat-sidebar { width: 100%; max-height: 220px; border-right: 0; border-bottom: 1px solid var(--color-line); }
  .chat-shell { flex-direction: column; }
}

.chat-toggle { display:grid; place-items:center; width:52px; height:52px; padding:0; border-radius:16px; background:var(--color-coral); color:#fffaf1; box-shadow:0 14px 28px rgba(159,79,56,.24); }
.chat-toggle.is-open { background:var(--color-navy); }
.chat-toggle .toggle-icon { width:22px; height:22px; }
.sidebar-new, .ghost-btn, .chat-input button { display:inline-flex; align-items:center; justify-content:center; }
.sidebar-new { width:40px; height:40px; margin:0; padding:0; border-radius:12px; background:var(--color-coral); }
.sidebar-new svg, .ghost-btn svg, .chat-input button svg { width:19px; height:19px; }
.chat-header-actions { gap:6px; }
.ghost-btn.icon-action { width:36px; height:36px; min-width:36px; padding:0; border-radius:10px; }
.chat-input button.icon-action { width:42px; height:42px; min-width:42px; padding:0; border-radius:12px; background:var(--color-coral); }
</style>
