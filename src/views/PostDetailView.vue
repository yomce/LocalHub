<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { addComment, deleteComment, deletePost, getBookmarkedPostIds, getPost, increasePostViewCount, togglePostBookmark, togglePostLike, verifyCommentPassword, verifyPostPassword } from '../services/postStorage'

const route = useRoute(); const router = useRouter(); const post = ref(null); const errorMessage = ref(''); const commentContent = ref(''); const commentPassword = ref(''); const bookmarked = ref(false)
const passwordModal = ref({ open: false, type: '', commentId: '', value: '', error: '' })
onMounted(() => { const foundPost = getPost(route.params.id); if (!foundPost) { router.replace('/board'); return }; post.value = increasePostViewCount(foundPost.id); bookmarked.value = getBookmarkedPostIds().includes(foundPost.id) })
function formatDate(value) { return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) }
function openPasswordModal(type, commentId = '') { passwordModal.value = { open: true, type, commentId, value: '', error: '' } }
function closePasswordModal() { passwordModal.value = { open: false, type: '', commentId: '', value: '', error: '' } }
function submitPassword() {
  const modal = passwordModal.value
  if (!modal.value) { modal.error = '비밀번호를 입력해 주세요.'; return }
  if (modal.type === 'edit' || modal.type === 'delete-post') {
    if (!verifyPostPassword(post.value.id, modal.value)) { modal.error = '게시글 비밀번호가 일치하지 않습니다.'; return }
    if (modal.type === 'edit') router.push(`/board/${post.value.id}/edit`)
    else { deletePost(post.value.id); router.replace('/board') }
    closePasswordModal(); return
  }
  if (!verifyCommentPassword(post.value.id, modal.commentId, modal.value)) { modal.error = '댓글 비밀번호가 일치하지 않습니다.'; return }
  if (modal.type === 'delete-comment') { deleteComment(post.value.id, modal.commentId, modal.value); post.value = getPost(post.value.id); closePasswordModal() }
}
function editPost() { openPasswordModal('edit') }
function removePost() { openPasswordModal('delete-post') }
function toggleLike() { post.value = togglePostLike(post.value.id) }
function toggleBookmark() { bookmarked.value = togglePostBookmark(post.value.id) }
function submitComment() { const content = commentContent.value.trim(); if (!content || commentPassword.value.length < 4) { errorMessage.value = '댓글 내용과 4자 이상의 비밀번호를 입력해 주세요.'; return }; addComment(post.value.id, content, commentPassword.value); errorMessage.value = ''; commentContent.value = ''; commentPassword.value = ''; post.value = getPost(post.value.id) }
function removeComment(commentId) { openPasswordModal('delete-comment', commentId) }
</script>

<template>
  <section v-if="post" class="post-detail-page">
    <RouterLink class="back-link" to="/board">← 게시판으로 돌아가기</RouterLink>
    <article class="post-detail-card">
      <div class="post-detail-meta"><span class="post-category">{{ post.category }}</span><span>조회 {{ post.viewCount || 0 }}</span></div>
      <h1>{{ post.title }}</h1>
      <div class="tag-list"><span v-for="tag in post.tags" :key="tag" class="post-tag">#{{ tag }}</span></div>
      <p class="post-author">{{ post.author }} · {{ formatDate(post.createdAt) }}<template v-if="post.updatedAt !== post.createdAt"> · 수정 {{ formatDate(post.updatedAt) }}</template></p>
      <img v-if="post.image" class="post-image" :src="post.image" alt="게시글 첨부 이미지" />
      <div class="post-content">{{ post.content }}</div>
      <div class="post-social-actions"><button class="social-button" :class="{ active: post.liked }" type="button" @click="toggleLike">{{ post.liked ? '♥' : '♡' }} 좋아요 {{ post.likeCount || 0 }}</button><button class="social-button" :class="{ active: bookmarked }" type="button" @click="toggleBookmark">{{ bookmarked ? '★' : '☆' }} {{ bookmarked ? '북마크됨' : '북마크' }}</button></div>
      <section class="comments-section">
        <h2>댓글 {{ post.comments?.length || 0 }}</h2>
        <form class="comment-form" @submit.prevent="submitComment"><input v-model="commentContent" type="text" maxlength="500" placeholder="댓글을 입력해 주세요" /><input v-model="commentPassword" type="password" minlength="4" placeholder="비밀번호" /><button class="primary-link form-submit" type="submit">등록</button></form>
        <p class="form-help">댓글 삭제 시 입력한 비밀번호가 필요합니다.</p>
        <div v-if="post.comments?.length" class="comment-list"><div v-for="comment in post.comments" :key="comment.id" class="comment-item"><div><strong>{{ comment.author }}</strong><small>{{ formatDate(comment.createdAt) }}</small></div><p>{{ comment.content }}</p><button class="comment-delete" type="button" @click="removeComment(comment.id)">삭제</button></div></div><p v-else class="form-help">첫 댓글을 남겨 보세요.</p>
      </section>
      <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>
      <div class="detail-actions"><button class="secondary-button" type="button" @click="editPost">수정</button><button class="danger-button" type="button" @click="removePost">삭제</button></div>
    </article>
  </section>
  <div v-if="passwordModal.open" class="password-backdrop" @click.self="closePasswordModal">
    <form class="password-modal" @submit.prevent="submitPassword"><h2>{{ passwordModal.type === 'edit' ? '게시글 수정' : passwordModal.type === 'delete-post' ? '게시글 삭제' : '댓글 삭제' }}</h2><p>비밀번호를 입력해 주세요.</p><input v-model="passwordModal.value" type="password" autofocus placeholder="비밀번호" /><p v-if="passwordModal.error" class="form-error">{{ passwordModal.error }}</p><div class="form-actions"><button class="secondary-button" type="button" @click="closePasswordModal">취소</button><button class="primary-link form-submit" type="submit">확인</button></div></form>
  </div>
</template>
