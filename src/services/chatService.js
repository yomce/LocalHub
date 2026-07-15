// src/services/chatService.js
const cache = {};

const DATA_FILES = [
  '서울_관광지.json',
  '서울_숙박.json',
  '서울_문화시설.json',
  '서울_레포츠.json',
  '서울_쇼핑.json',
  '서울_여행코스.json',
  '서울_축제공연행사.json'
];

async function loadJson(filename) {
  if (!cache[filename]) {
    cache[filename] = fetch(`/data/서울/${filename}`)
      .then(r => r.ok ? r.json() : { items: [] })
      .catch(() => ({ items: [] }));
  }
  return cache[filename];
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function makeMapUrl(item) {
  const lat = item.mapy || item.mapy === 0 ? item.mapy : '';
  const lon = item.mapx || item.mapx === 0 ? item.mapx : '';
  if (lat && lon) return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
  if (item.addr1) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.addr1)}`;
  return '#';
}

function formatHtmlItems(items, n = 5) {
  return `<div class="reply-list">${items.slice(0, n).map(it => {
    const title = escapeHtml(it.title || '무명');
    const addr = escapeHtml(it.addr1 || '');
    const tel = escapeHtml(it.tel || '');
    const mapUrl = makeMapUrl(it);
    const details = [addr, tel].filter(Boolean).join(' · ');
    return `<div class="chat-card"><div class="chat-card-body"><div class="chat-card-title">${title}</div><div class="chat-card-details">${details}</div><div class="chat-card-actions"><a href="${mapUrl}" target="_blank" rel="noreferrer">지도에서 보기</a></div></div></div>`;
  }).join('')}</div>`;
}

async function searchAcrossAll(keyword, limit = 6) {
  const lower = (keyword || '').toLowerCase();
  const results = [];
  for (const file of DATA_FILES) {
    const data = await loadJson(file);
    const items = data.items || [];
    for (const it of items) {
      const title = (it.title || '').toLowerCase();
      if (!title) continue;
      if (title.includes(lower)) {
        results.push(it);
        if (results.length >= limit) break;
      }
    }
    if (results.length >= limit) break;
  }
  return results;
}

const CATEGORY_SYNONYMS = {
  숙박: ['숙박', '호텔', '게스트', '민박', '펜션', '모텔'],
  관광: ['관광', '추천', '볼만', '볼거리', '명소', '가볼만'],
  문화: ['문화', '공연', '전시', '뮤지엄', '박물관', '콘서트'],
  레포츠: ['레포츠', '액티비티', '운동', '체험', '레저']
};

const CATEGORY_TO_FILE = {
  숙박: '서울_숙박.json',
  관광: '서울_관광지.json',
  문화: '서울_문화시설.json',
  레포츠: '서울_레포츠.json'
};

function detectCategory(messageLower) {
  for (const [cat, words] of Object.entries(CATEGORY_SYNONYMS)) {
    for (const w of words) {
      if (messageLower.includes(w)) return cat;
    }
  }
  return null;
}

function getSimpleConversationReply(messageLower) {
  const normalized = messageLower.trim();

  if (!normalized) return null;

  if (/^(안녕|안녕하세요|반가워|반갑습니다|hi|hello)/.test(normalized)) {
    return '안녕하세요! 서울 여행 관련해서는 무엇이든 도와드릴게요. 관광지, 숙박, 문화시설, 레포츠까지 편하게 물어보세요.';
  }

  if (/(감사|고마워|thanks|thank you)/.test(normalized)) {
    return '천천히 편하게 질문해 주세요. 도움이 되었다면 좋겠네요.';
  }

  if (/(뭐해|무엇을 도와|도와줄|도와줘|뭘 도와)/.test(normalized)) {
    return '서울 여행 추천, 숙소 찾기, 관광지 안내, 문화시설/레포츠 정보까지 도와드릴 수 있어요.';
  }

  if (/(좋아|좋다|좋네요|재미있|재밌|멋져|멋있)/.test(normalized)) {
    return '좋게 봐주셔서 감사합니다! 그럼 여행 계획도 더 멋지게 짜볼까요?';
  }

  if (/(버그|오류|문제|안돼|안됨|실패|오답)/.test(normalized)) {
    return '불편을 드려 죄송합니다. 현재는 서울 데이터 기반으로 추천을 제공하고 있어요. 다시 한 번 질문해 주세요.';
  }

  if (/(피곤|지침|슬퍼|우울|힘들|짜증|화가|싫어|싫다)/.test(normalized)) {
    return '괜찮아요. 잠깐 쉬어가면서 서울에서 가볍게 즐길 수 있는 곳부터 생각해보면 좋겠어요.';
  }

  if (/(기분좋아|기분좋다|행복|신나|좋은데|좋아해)/.test(normalized)) {
    return '좋은 기분이네요! 그 기분 따라 서울에서 더 즐거운 여행 코스를 추천해드릴게요.';
  }

  if (/(혼자|솔로|커플|가족|친구|데이트)/.test(normalized)) {
    return '상황에 맞는 추천이 가능해요. 혼자, 커플, 가족, 친구랑 가기 좋은 서울 코스를 골라드릴게요.';
  }

  if (/(맛집|먹거리|음식|카페)/.test(normalized)) {
    return '맛집이나 카페도 도와드릴 수 있어요. 어떤 분위기인지 말해주시면 더 잘 추천해드릴게요.';
  }

  if (/(예쁘|사진|인생샷|사진찍|포토)/.test(normalized)) {
    return '사진 찍기 좋은 명소도 추천해드릴 수 있어요. 서울에서 인생샷 찍기 좋은 곳을 찾아볼까요?';
  }

  if (/(여행|일정|코스|계획|짜줘|짜자|짜줄래|추천해줘|추천해)/.test(normalized)) {
    return '좋아요! 짧게는 반나절 코스, 길게는 당일·1박 2일 코스로 맞춰드릴 수 있어요. 예를 들어 “비오는데 당일 코스”처럼 알려주시면 바로 짜드릴게요.';
  }

  if (/(당일|반나절|1박|2일|하루|오후|아침|저녁)/.test(normalized)) {
    return '좋아요. 일정 길이에 맞춰 코스를 구성해드릴게요. 예를 들어 “비오는데 당일 코스”처럼 날씨와 시간을 같이 말해주시면 더 정확하게 추천해드릴게요.';
  }

  if (/(비|눈|맑|흐림|더움|추움|겨울|여름|가을|봄|계절|날씨)/.test(normalized)) {
    return '날씨에 맞는 코스도 추천해드릴 수 있어요. 비 오면 실내 위주, 맑은 날엔 야외 산책 루트, 겨울엔 따뜻한 실내 공간 위주로 짜드릴게요.';
  }

  return null;
}

export async function getBotReply(message) {
  const lower = (message || '').toLowerCase();

  const simpleReply = getSimpleConversationReply(lower);
  if (simpleReply) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return simpleReply;
  }

  // 1) category detection
  const cat = detectCategory(lower);
  if (cat) {
    const file = CATEGORY_TO_FILE[cat];
    const data = await loadJson(file);
    const html = formatHtmlItems(data.items || [], 5);
    return `<div class="reply-shell"><div class="reply-heading">서울 ${cat} 추천</div>${html}</div>`;
  }

  // 2) title search / free-text retrieval
  const searchMatch = await searchAcrossAll(message, 6);
  if (searchMatch && searchMatch.length) {
    try {
      const itemsForPrompt = searchMatch.slice(0, 6).map(it => ({
        title: it.title || '',
        addr: it.addr1 || '',
        tel: it.tel || '',
        mapx: it.mapx || '',
        mapy: it.mapy || '',
        image: it.firstimage || ''
      }));

      const systemPrompt = `한국어로 답변하세요. 아래 제공된 지역 데이터 항목들을 참고해 사용자의 질문에 충실하고 간결하게 답변하세요. 결과물에는 핵심 추천(간단한 이유), 주소/전화(있을 때), 그리고 가능한 경우 지도 링크를 포함하세요.`;
      const userPrompt = `사용자 질의: ${message}\n\n데이터 항목:\n${JSON.stringify(itemsForPrompt, null, 2)}\n\n요청: 위 데이터를 참고하여 한국어로 3~6개의 추천 또는 관련 정보를 간결하게 작성하세요. 각 항목에는 제목, 주소(또는 전화), 짧은 설명(한줄)과 지도 링크를 포함하세요.`;

      const aiText = await callOpenAI(systemPrompt, userPrompt);
      console.info('[OpenAI] Received AI response:', aiText);
      if (aiText) {
        const safe = escapeHtml(aiText).replace(/\n/g, '<br/>');
        return `<div>${safe}</div>`;
      }
    } catch (e) {
      console.warn('OpenAI call failed', e);
    }

    const html = formatHtmlItems(searchMatch, 6);
    return `<div class="reply-shell"><div class="reply-heading">검색 결과</div>${html}</div>`;
  }

  // 3) fallback: suggest popular 관광지
  await new Promise(r => setTimeout(r, 600));
  const data = await loadJson('서울_관광지.json');
  const html = formatHtmlItems(data.items || [], 3);
  return `<div class="reply-shell"><div class="reply-heading">추천 안내</div><div>죄송합니다, 바로 답하기 어렵습니다. 대신 인기 관광지 몇 곳을 추천드려요:</div>${html}</div>`;
}

// --- OpenAI helper (server-side via Vite proxy) ---
async function callOpenAI(systemPrompt, userPrompt) {
  console.info('[OpenAI] Sending chat request to proxy...')

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      systemPrompt,
      userPrompt,
      model: 'gpt-5-mini'
    })
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    console.error('[OpenAI] Proxy request failed.', { status: res.status, detail: txt })
    throw new Error(`OpenAI proxy error: ${res.status} ${txt}`);
  }

  const j = await res.json();
  if (j.content) {
    console.info('[OpenAI] Key was loaded and a response was received successfully.')
  }
  return j.content || null;
}