<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { addComment, deleteComment, deletePost, getBookmarkedPostIds, getPost, increasePostViewCount, togglePostBookmark, togglePostLike, verifyPostPassword } from '../services/postStorage'

const route = useRoute(); const router = useRouter(); const post = ref(null); const errorMessage = ref(''); const commentContent = ref(''); const bookmarked = ref(false)
onMounted(() => { const foundPost = getPost(route.params.id); if (!foundPost) { router.replace('/board'); return }; post.value = increasePostViewCount(foundPost.id); bookmarked.value = getBookmarkedPostIds().includes(foundPost.id) })
function formatDate(value) { return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) }
function requestPassword() {
  const password = window.prompt('게시글 작성 시 입력한 비밀번호를 입력해 주세요.')
  if (password === null) return null
  if (!verifyPostPassword(post.value.id, password)) { errorMessage.value = '비밀번호가 일치하지 않습니다.'; return null }
  errorMessage.value = ''; return password
}
function editPost() { if (requestPassword() !== null) router.push(`/board/${post.value.id}/edit`) }
function removePost() { if (requestPassword() === null) return; if (!window.confirm('이 게시글을 삭제하시겠습니까?')) return; deletePost(post.value.id); router.replace('/board') }
function toggleLike() { post.value = togglePostLike(post.value.id) }
function toggleBookmark() { bookmarked.value = togglePostBookmark(post.value.id) }
function submitComment() { const content = commentContent.value.trim(); if (!content) return; addComment(post.value.id, content); commentContent.value = ''; post.value = getPost(post.value.id) }
function removeComment(commentId) { if (!window.confirm('댓글을 삭제하시겠습니까?')) return; deleteComment(post.value.id, commentId); post.value = getPost(post.value.id) }
</script>

<template>
  <section v-if="post" class="post-detail-page"><RouterLink class="back-link" to="/board">← 게시판으로 돌아가기</RouterLink><article class="post-detail-card"><div class="post-detail-meta"><span class="post-category">{{ post.category }}</span><span>조회 {{ post.viewCount || 0 }}</span></div><h1>{{ post.title }}</h1><div class="tag-list"><span v-for="tag in post.tags" :key="tag" class="post-tag">#{{ tag }}</span></div><p class="post-author">{{ post.author }} · {{ formatDate(post.createdAt) }}<template v-if="post.updatedAt !== post.createdAt"> · 수정 {{ formatDate(post.updatedAt) }}</template></p><img v-if="post.image" class="post-image" :src="post.image" alt="게시글 첨부 이미지" /><div class="post-content">{{ post.content }}</div><div class="post-social-actions"><button class="social-button" :class="{ active: post.liked }" type="button" @click="toggleLike">{{ post.liked ? '♥' : '♡' }} 좋아요 {{ post.likeCount || 0 }}</button><button class="social-button" :class="{ active: bookmarked }" type="button" @click="toggleBookmark">{{ bookmarked ? '★' : '☆' }} {{ bookmarked ? '북마크됨' : '북마크' }}</button></div><section class="comments-section"><h2>댓글 {{ post.comments?.length || 0 }}</h2><form class="comment-form" @submit.prevent="submitComment"><input v-model="commentContent" type="text" maxlength="500" placeholder="댓글을 입력해 주세요" /><button class="primary-link form-submit" type="submit">등록</button></form><div v-if="post.comments?.length" class="comment-list"><div v-for="comment in post.comments" :key="comment.id" class="comment-item"><div><strong>{{ comment.author }}</strong><small>{{ formatDate(comment.createdAt) }}</small></div><p>{{ comment.content }}</p><button class="comment-delete" type="button" @click="removeComment(comment.id)">삭제</button></div></div><p v-else class="form-help">첫 댓글을 남겨 보세요.</p></section><p v-if="errorMessage" class="form-error">{{ errorMessage }}</p><div class="detail-actions"><button class="secondary-button" type="button" @click="editPost">수정</button><button class="danger-button" type="button" @click="removePost">삭제</button></div></article></section>
</template>
