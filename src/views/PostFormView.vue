<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { createPost, getPost, updatePost, verifyPostPassword } from '../services/postStorage'

const route = useRoute(); const router = useRouter(); const isEdit = computed(() => Boolean(route.params.id)); const existingPost = isEdit.value ? getPost(route.params.id) : null
const category = ref(existingPost?.category ?? '자유'); const title = ref(existingPost?.title ?? ''); const content = ref(existingPost?.content ?? ''); const password = ref(''); const tags = ref(existingPost?.tags?.join(', ') ?? ''); const image = ref(existingPost?.image ?? ''); const errorMessage = ref('')
const categories = ['공지', '여행정보', '맛집추천', '질문', '자유']
function handleImage(event) {
  const file = event.target.files?.[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) { errorMessage.value = '이미지는 2MB 이하만 첨부할 수 있습니다.'; event.target.value = ''; return }
  const reader = new FileReader(); reader.onload = () => { image.value = reader.result }; reader.readAsDataURL(file)
}
function removeImage() { image.value = ''; }
function submitForm() {
  if (!title.value.trim() || !content.value.trim() || !password.value) { errorMessage.value = '제목, 내용, 비밀번호를 모두 입력해 주세요.'; return }
  if (isEdit.value) {
    if (!existingPost || !verifyPostPassword(route.params.id, password.value)) { errorMessage.value = '수정용 비밀번호가 일치하지 않습니다.'; return }
    updatePost(route.params.id, { category: category.value, title: title.value.trim(), content: content.value.trim(), tags: tags.value.split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 10), image: image.value }); router.replace(`/board/${route.params.id}`); return
  }
  const post = createPost({ category: category.value, title: title.value.trim(), content: content.value.trim(), password: password.value, tags: tags.value.split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 10), image: image.value }); router.replace(`/board/${post.id}`)
}
</script>

<template>
  <section class="form-page"><RouterLink class="back-link" to="/board">← 게시판으로 돌아가기</RouterLink><div class="page-heading compact-heading"><div><p class="eyebrow">{{ isEdit ? 'EDIT POST' : 'NEW POST' }}</p><h1>{{ isEdit ? '게시글 수정' : '게시글 작성' }}</h1></div></div><form class="post-form" @submit.prevent="submitForm"><label>카테고리<select v-model="category"><option v-for="item in categories" :key="item" :value="item">{{ item }}</option></select></label><label>제목<input v-model="title" type="text" maxlength="100" placeholder="제목을 입력해 주세요" /></label><label>내용<textarea v-model="content" rows="10" maxlength="5000" placeholder="지역 정보를 자유롭게 공유해 주세요" /></label><label>태그 <span class="form-help">쉼표로 구분해 최대 10개</span><input v-model="tags" type="text" placeholder="서울여행, 맛집, 나들이" /></label><label>이미지 첨부 <span class="form-help">JPG, PNG / 2MB 이하</span><input type="file" accept="image/png,image/jpeg,image/webp" @change="handleImage" /></label><div v-if="image" class="image-preview"><img :src="image" alt="첨부 이미지 미리보기" /><button class="text-button" type="button" @click="removeImage">이미지 삭제</button></div><label>{{ isEdit ? '수정용 비밀번호' : '비밀번호' }}<input v-model="password" type="password" minlength="4" placeholder="4자 이상 입력" /></label><p class="form-help">비밀번호는 게시글 수정·삭제 확인에만 사용됩니다.</p><p v-if="errorMessage" class="form-error">{{ errorMessage }}</p><div class="form-actions"><RouterLink class="secondary-button icon-action" to="/board" aria-label="취소" title="취소"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg><span class="sr-only">취소</span></RouterLink><button class="primary-link form-submit icon-action" type="submit" aria-label="{{ isEdit ? '수정 완료' : '등록하기' }}" title="{{ isEdit ? '수정 완료' : '등록하기' }}"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.5 9.5 17 19 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg><span class="sr-only">{{ isEdit ? '수정 완료' : '등록하기' }}</span></button></div></form></section>
</template>
