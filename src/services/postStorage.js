const STORAGE_KEY = 'localhub-posts'
const BOOKMARK_KEY = 'localhub-bookmarks'
const OWNED_POST_KEY = 'localhub-owned-posts'

const mockTitles = [
  '경복궁은 아침 일찍 가야 예쁜가요?', '성수에서 반나절 보내기 좋은 코스', '비 오는 날 가기 좋은 서울 실내 명소',
  '망원동에서 꼭 먹어봐야 할 메뉴', '한강 피크닉 준비물과 자리 추천', '익선동 골목 산책 동선 공유해요',
  '서울숲 근처 조용한 카페를 찾고 있어요', '외국인 친구와 가기 좋은 야경 명소', '북촌 한옥마을 사진 잘 나오는 시간',
  '을지로 노포와 카페를 하루에 즐기는 법', '처음 서울에 온 친구에게 추천한 코스', '광장시장 먹거리 솔직 후기',
  '남산 둘레길 초보자도 걷기 괜찮나요?', '전시와 맛집을 함께 즐기는 서촌 코스', '잠실에서 하루 종일 놀 수 있을까요?',
  '서울 지하철 여행하기 좋은 역 추천', '연남동에서 혼자 여행하기 좋은 장소', '여의도 밤도깨비 야시장 다녀왔어요',
  '덕수궁 돌담길 산책 후 들른 곳', '서울에서 가장 좋아하는 노을 스팟', '합정역 근처 브런치 맛집 추천받아요',
  '청계천 야간 산책 코스가 궁금해요', '아이와 함께 가기 좋은 서울 여행지', '서울 여행 교통카드 어떻게 준비하나요?',
  '도심 속에서 조용히 쉬기 좋은 공원', '마포에서 하루 머물기 좋은 숙소', '성북동의 숨은 한옥 카페 후기',
  '서울 미술관 하루 코스 추천', '가성비 좋은 명동 식당을 찾습니다', '광화문에서 인사동까지 걸어본 후기',
  '서울에서 꼭 남겨야 할 여행 사진', '아침에 가기 좋은 따릉이 코스', '서촌에서 발견한 작은 소품 가게',
  '비건 여행자를 위한 서울 맛집 목록', '도심 속 캠핑 느낌을 낼 수 있는 곳', '친구들과 가기 좋은 보드게임 카페',
  '서울 여름밤에 추천하는 야외 활동', '한옥 감성이 예쁜 카페를 소개합니다', '혼잡하지 않은 주말 나들이 장소',
  '서울 여행 중 유용했던 앱과 팁', '청량리와 동대문을 잇는 시장 투어', '데이트하기 좋은 석촌호수 주변',
  '서울에서 맛본 인생 디저트', '외국인에게 설명하기 좋은 서울 문화', '뚝섬에서 자전거 타기 좋은 시간',
  '국립중앙박물관 관람 팁을 공유해요', '홍대 공연 보고 늦은 저녁 먹을 곳', '서울 여행 예산을 줄이는 방법',
  '이번 주말 서울에서 열리는 행사',
]

const mockCategories = ['여행정보', '맛집추천', '질문', '자유']
const mockTags = [
  ['서울여행', '코스'], ['성수', '카페'], ['실내여행', '비오는날'], ['맛집', '망원동'],
  ['한강', '피크닉'], ['익선동', '산책'], ['서울숲', '카페'], ['야경', '명소'],
]
const mockAuthors = ['서울한바퀴', '골목탐험가', '오늘도여행', '익명의여행자', '동네산책러', 'Local Mate']

const seedPosts = [
  {
    id: 'post-welcome', category: '공지', title: 'LocalHub 서울 게시판에 오신 것을 환영합니다',
    content: '서울의 여행지와 생활 정보를 자유롭게 공유해 주세요. 게시글 수정과 삭제에는 작성할 때 입력한 비밀번호가 필요합니다.',
    author: 'LocalHub', passwordHash: 'localhub', viewCount: 0, likeCount: 0, liked: false,
    tags: ['안내'], image: '', comments: [],
    createdAt: '2026-07-15T09:00:00.000Z', updatedAt: '2026-07-15T09:00:00.000Z',
  },
  ...mockTitles.map((title, index) => {
    const createdAt = new Date(Date.UTC(2026, 6, 14, 18, 0) - index * 1000 * 60 * 95).toISOString()
    return {
      id: `post-seed-${String(index + 1).padStart(2, '0')}`,
      category: mockCategories[index % mockCategories.length],
      title,
      content: `${title}에 대한 서울 여행자들의 기록입니다. 직접 다녀온 경험과 함께 동선, 분위기, 참고하면 좋은 팁을 정리해 보았어요. 처음 방문하는 분들에게 도움이 되길 바랍니다.`,
      author: mockAuthors[index % mockAuthors.length],
      passwordHash: 'localhub',
      viewCount: 18 + ((49 - index) * 13) % 240,
      likeCount: 2 + ((49 - index) * 5) % 42,
      liked: false,
      tags: mockTags[index % mockTags.length],
      image: '',
      comments: [],
      createdAt,
      updatedAt: createdAt,
    }
  }),
]

function readPosts() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return [...seedPosts]
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return [...seedPosts]

    const storedPosts = parsed.map(normalizePost)
    const storedIds = new Set(storedPosts.map((post) => post.id))
    const missingSeedPosts = seedPosts.filter((post) => !storedIds.has(post.id))
    return [...storedPosts, ...missingSeedPosts]
  } catch { return [...seedPosts] }
}

function normalizePost(post) {
  return { ...post, viewCount: Number(post.viewCount || 0), likeCount: Number(post.likeCount || 0), liked: Boolean(post.liked), tags: Array.isArray(post.tags) ? post.tags : [], image: post.image || '', comments: Array.isArray(post.comments) ? post.comments.map((comment) => ({ ...comment, passwordHash: comment.passwordHash || '' })) : [] }
}

function writePosts(posts) { localStorage.setItem(STORAGE_KEY, JSON.stringify(posts)) }

export function getOwnedPostIds() {
  try { const ids = JSON.parse(localStorage.getItem(OWNED_POST_KEY) || '[]'); return Array.isArray(ids) ? ids : [] } catch { return [] }
}

function rememberOwnedPost(id) {
  const ids = getOwnedPostIds()
  if (!ids.includes(id)) localStorage.setItem(OWNED_POST_KEY, JSON.stringify([...ids, id]))
}

export function getPosts() {
  return readPosts().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export function getPost(id) { return readPosts().find((post) => post.id === id) ?? null }

export function createPost({ category, title, content, password, tags = [], image = '' }) {
  const now = new Date().toISOString()
  const post = {
    id: `post-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    category, title, content, author: '익명', passwordHash: password, viewCount: 0, likeCount: 0, liked: false,
    tags, image, comments: [],
    createdAt: now, updatedAt: now,
  }
  writePosts([post, ...readPosts()])
  rememberOwnedPost(post.id)
  return post
}

export function updatePost(id, { category, title, content, tags, image }) {
  const posts = readPosts(); const index = posts.findIndex((post) => post.id === id)
  if (index === -1) return null
  const updatedPost = { ...posts[index], category, title, content, tags, image, updatedAt: new Date().toISOString() }
  posts[index] = updatedPost; writePosts(posts); return updatedPost
}

export function deletePost(id) {
  const posts = readPosts(); const nextPosts = posts.filter((post) => post.id !== id)
  if (nextPosts.length === posts.length) return false
  writePosts(nextPosts); return true
}

export function verifyPostPassword(id, password) {
  const post = getPost(id); return Boolean(post && post.passwordHash === password)
}

export function increasePostViewCount(id) {
  const posts = readPosts(); const post = posts.find((item) => item.id === id)
  if (!post) return null
  post.viewCount = Number(post.viewCount || 0) + 1; writePosts(posts); return post
}

export function togglePostLike(id) {
  const posts = readPosts(); const post = posts.find((item) => item.id === id)
  if (!post) return null
  post.liked = !post.liked; post.likeCount = Math.max(0, Number(post.likeCount || 0) + (post.liked ? 1 : -1))
  writePosts(posts); return post
}

export function getBookmarkedPostIds() {
  try { const ids = JSON.parse(localStorage.getItem(BOOKMARK_KEY) || '[]'); return Array.isArray(ids) ? ids : [] } catch { return [] }
}

export function togglePostBookmark(id) {
  const ids = getBookmarkedPostIds(); const index = ids.indexOf(id)
  if (index === -1) ids.push(id); else ids.splice(index, 1)
  localStorage.setItem(BOOKMARK_KEY, JSON.stringify(ids)); return index === -1
}

export function addComment(id, content, password) {
  const posts = readPosts(); const post = posts.find((item) => item.id === id)
  if (!post) return null
  const comment = { id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, author: '익명', content, passwordHash: password, createdAt: new Date().toISOString() }
  post.comments = [...(post.comments || []), comment]; writePosts(posts); return comment
}

export function verifyCommentPassword(postId, commentId, password) {
  const post = getPost(postId); const comment = post?.comments?.find((item) => item.id === commentId)
  return Boolean(comment && comment.passwordHash && comment.passwordHash === password)
}

export function deleteComment(postId, commentId, password) {
  const posts = readPosts(); const post = posts.find((item) => item.id === postId)
  if (!post) return false
  const comments = post.comments || []
  const comment = comments.find((item) => item.id === commentId)
  if (!comment || comment.passwordHash !== password) return false
  post.comments = comments.filter((item) => item.id !== commentId)
  if (post.comments.length === comments.length) return false
  writePosts(posts); return true
}
