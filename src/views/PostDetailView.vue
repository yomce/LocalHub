<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { addComment, deleteComment, deletePost, getBookmarkedPostIds, getPost, increasePostViewCount, togglePostBookmark, togglePostLike, verifyCommentPassword, verifyPostPassword } from '../services/postStorage'
import { copyTextToClipboard, getShareUrl, shareKakao, shareNative, setSocialMeta } from '../services/shareService'

const route = useRoute()
const router = useRouter()
const post = ref(null)
const errorMessage = ref('')
const commentContent = ref('')
const commentPassword = ref('')
const bookmarked = ref(false)
const shareStatus = ref('')
const supportsNativeShare = ref(false)
const passwordModal = ref({ open: false, type: '', commentId: '', value: '', error: '' })

const sharePath = computed(() => (post.value ? `/board/${post.value.id}` : '/board'))
const shareUrl = computed(() => getShareUrl(sharePath.value))
const shareTitle = computed(() => (post.value ? `${post.value.title} · LocalHub` : 'LocalHub'))
const shareDescription = computed(() => {
  const content = String(post.value?.content || '').trim()
  if (!content) {
    return '서울 여행 정보와 추천을 공유하세요.'
  }
  const normalized = content.replace(/\s+/g, ' ')
  return normalized.length > 120 ? `${normalized.slice(0, 120)}...` : normalized
})
const shareImage = computed(() => String(post.value?.image || '').trim())

watch(post, (current) => {
  if (!current) {
    return
  }

  setSocialMeta({
    title: shareTitle.value,
    description: shareDescription.value,
    url: shareUrl.value,
    image: shareImage.value,
  })
}, { immediate: true })

function formatDate(value) {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function openPasswordModal(type, commentId = '') {
  passwordModal.value = { open: true, type, commentId, value: '', error: '' }
}

function closePasswordModal() {
  passwordModal.value = { open: false, type: '', commentId: '', value: '', error: '' }
}

function submitPassword() {
  const modal = passwordModal.value
  if (!modal.value) {
    modal.error = '비밀번호를 입력해 주세요.'
    return
  }

  if (modal.type === 'edit' || modal.type === 'delete-post') {
    if (!verifyPostPassword(post.value.id, modal.value)) {
      modal.error = '게시글 비밀번호가 일치하지 않습니다.'
      return
    }

    if (modal.type === 'edit') {
      router.push(`/board/${post.value.id}/edit`)
    } else {
      deletePost(post.value.id)
      router.replace('/board')
    }

    closePasswordModal()
    return
  }

  if (!verifyCommentPassword(post.value.id, modal.commentId, modal.value)) {
    modal.error = '댓글 비밀번호가 일치하지 않습니다.'
    return
  }

  if (modal.type === 'delete-comment') {
    deleteComment(post.value.id, modal.commentId, modal.value)
    post.value = getPost(post.value.id)
    closePasswordModal()
  }
}

function editPost() {
  openPasswordModal('edit')
}

function removePost() {
  openPasswordModal('delete-post')
}

function toggleLike() {
  post.value = togglePostLike(post.value.id)
}

function toggleBookmark() {
  bookmarked.value = togglePostBookmark(post.value.id)
}

function showShareStatus(message) {
  shareStatus.value = message
  window.setTimeout(() => {
    if (shareStatus.value === message) {
      shareStatus.value = ''
    }
  }, 3000)
}

async function copyShareLink() {
  try {
    await copyTextToClipboard(shareUrl.value)
    showShareStatus('공유 링크가 복사되었습니다.')
  } catch (error) {
    showShareStatus('링크 복사에 실패했습니다. 다시 시도해 주세요.')
  }
}

async function shareViaKakao() {
  try {
    await shareKakao({
      title: shareTitle.value,
      description: shareDescription.value,
      imageUrl: shareImage.value,
      url: shareUrl.value,
    })
    showShareStatus('카카오톡 공유 창이 열렸습니다.')
  } catch (error) {
    showShareStatus(error?.message || '카카오톡 공유에 실패했습니다.')
  }
}

async function shareNativeLink() {
  try {
    await shareNative({
      title: shareTitle.value,
      text: shareDescription.value,
      url: shareUrl.value,
    })
    showShareStatus('공유가 완료되었습니다.')
  } catch (error) {
    showShareStatus('공유가 취소되었거나 지원되지 않습니다.')
  }
}

function submitComment() {
  const content = commentContent.value.trim()
  if (!content || commentPassword.value.length < 4) {
    errorMessage.value = '댓글 내용과 4자 이상의 비밀번호를 입력해 주세요.'
    return
  }

  addComment(post.value.id, content, commentPassword.value)
  errorMessage.value = ''
  commentContent.value = ''
  commentPassword.value = ''
  post.value = getPost(post.value.id)
}

function removeComment(commentId) {
  openPasswordModal('delete-comment', commentId)
}

onMounted(() => {
  const foundPost = getPost(route.params.id)
  if (!foundPost) {
    router.replace('/board')
    return
  }

  post.value = increasePostViewCount(foundPost.id)
  bookmarked.value = getBookmarkedPostIds().includes(foundPost.id)
  supportsNativeShare.value = typeof navigator !== 'undefined' && Boolean(navigator.share)
})
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
      <div class="post-social-actions">
        <button class="social-button" :class="{ active: post.liked }" type="button" @click="toggleLike">{{ post.liked ? '♥' : '♡' }} 좋아요 {{ post.likeCount || 0 }}</button>
        <button class="social-button" :class="{ active: bookmarked }" type="button" @click="toggleBookmark">{{ bookmarked ? '★' : '☆' }} {{ bookmarked ? '북마크됨' : '북마크' }}</button>
        <button class="social-button" type="button" @click="copyShareLink">🔗 링크 복사</button>
        <button class="social-button" type="button" @click="shareViaKakao">💬 카카오톡 공유</button>
        <button v-if="supportsNativeShare" class="social-button" type="button" @click="shareNativeLink">공유</button>
      </div>
      <p v-if="shareStatus" class="share-status">{{ shareStatus }}</p>
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
