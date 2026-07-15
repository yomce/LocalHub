const STORAGE_KEY = 'localhub-posts'
const BOOKMARK_KEY = 'localhub-bookmarks'
const OWNED_POST_KEY = 'localhub-owned-posts'

const seedPosts = [{
  id: 'post-welcome', category: '공지', title: 'LocalHub 서울 게시판에 오신 것을 환영합니다',
  content: '서울의 여행지와 생활 정보를 자유롭게 공유해 주세요. 게시글 수정과 삭제에는 작성할 때 입력한 비밀번호가 필요합니다.',
  author: 'LocalHub', passwordHash: 'localhub', viewCount: 0, likeCount: 0, liked: false,
  tags: ['안내'], image: '', comments: [],
  createdAt: '2026-07-15T09:00:00.000Z', updatedAt: '2026-07-15T09:00:00.000Z',
}]

function readPosts() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return [...seedPosts]
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed.map(normalizePost) : [...seedPosts]
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
