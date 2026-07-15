import { getOwnedPostIds, getPosts } from './postStorage'

const NOTIFICATION_KEY = 'localhub-notifications'
const SNAPSHOT_KEY = 'localhub-notification-snapshot'

function read(key, fallback) {
  try { const value = JSON.parse(localStorage.getItem(key) || 'null'); return value ?? fallback } catch { return fallback }
}

function write(key, value) { localStorage.setItem(key, JSON.stringify(value)) }

export function getNotifications() {
  const seen = new Set()
  return read(NOTIFICATION_KEY, []).filter((notification) => {
    if (!notification.eventKey) return true
    if (seen.has(notification.eventKey)) return false
    seen.add(notification.eventKey)
    return true
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export function getUnreadNotificationCount() { return getNotifications().filter((notification) => !notification.read).length }

export function markAllNotificationsRead() {
  const notifications = getNotifications().map((notification) => ({ ...notification, read: true }))
  write(NOTIFICATION_KEY, notifications)
  return notifications
}

export function clearNotifications() {
  write(NOTIFICATION_KEY, [])
  return []
}

function addNotification(notification) {
  const notifications = getNotifications()
  if (notifications.some((item) => item.eventKey === notification.eventKey)) return
  write(NOTIFICATION_KEY, [{ ...notification, id: `notice-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, read: false }, ...notifications].slice(0, 100))
}

export function pollNotifications() {
  const posts = getPosts(); const ownedIds = getOwnedPostIds(); const ownedPosts = posts.filter((post) => ownedIds.includes(post.id))
  const previous = read(SNAPSHOT_KEY, {})
  const current = {}
  ownedPosts.forEach((post) => {
    current[post.id] = { comments: post.comments?.length || 0, likes: post.likeCount || 0, title: post.title }
    const old = previous[post.id]
    if (!old) return
    const newComments = current[post.id].comments - old.comments
    const newLikes = current[post.id].likes - old.likes
    if (newComments > 0) addNotification({ eventKey: `${post.id}:comment:${current[post.id].comments}`, type: 'comment', postId: post.id, postTitle: post.title, message: `새 댓글 ${newComments}개가 달렸습니다.`, createdAt: new Date().toISOString() })
    if (newLikes > 0) addNotification({ eventKey: `${post.id}:like:${current[post.id].likes}`, type: 'like', postId: post.id, postTitle: post.title, message: `좋아요를 ${newLikes}개 받았습니다.`, createdAt: new Date().toISOString() })
  })
  write(SNAPSHOT_KEY, current)
  return getNotifications()
}
