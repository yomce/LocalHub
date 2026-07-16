<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { getBookmarkedPostIds, getPosts } from '../services/postStorage'

const categories = ['전체', '공지', '여행정보', '맛집추천', '질문', '자유']
const posts = ref(getPosts()); const keyword = ref(''); const selectedCategory = ref('전체'); const showBookmarked = ref(false)
const filteredPosts = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  return posts.value.filter((post) => {
    const categoryMatches = selectedCategory.value === '전체' || post.category === selectedCategory.value
    const searchable = `${post.title} ${post.content} ${post.author} ${post.category} ${(post.tags || []).join(' ')}`.toLowerCase()
    const bookmarkMatches = !showBookmarked.value || getBookmarkedPostIds().includes(post.id)
    return categoryMatches && bookmarkMatches && (!query || searchable.includes(query))
  })
})
function refreshPosts() { posts.value = getPosts() }
function formatDate(value) { return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(new Date(value)) }
</script>

<template>
  <section class="board-page">
    <div class="page-heading"><div><p class="eyebrow">SEOUL COMMUNITY</p><h1>서울 지역 게시판</h1><p class="page-description">로그인 없이 여행 경험과 지역 정보를 공유해 보세요.</p></div><RouterLink class="primary-link icon-action" to="/board/new" aria-label="글쓰기" title="글쓰기"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg><span class="sr-only">글쓰기</span></RouterLink></div>
    <div class="board-toolbar"><div class="category-tabs" aria-label="게시판 카테고리"><button v-for="category in categories" :key="category" class="category-tab" :class="{ active: selectedCategory === category }" type="button" @click="selectedCategory = category">{{ category }}</button><button class="category-tab" :class="{ active: showBookmarked }" type="button" @click="showBookmarked = !showBookmarked">★ 북마크</button></div><label class="search-box"><span class="sr-only">게시글 검색</span><input v-model="keyword" type="search" placeholder="제목, 내용, 태그 검색" /></label></div>
    <div class="board-summary">총 {{ filteredPosts.length }}개의 게시글</div>
    <div v-if="filteredPosts.length" class="post-list"><RouterLink v-for="post in filteredPosts" :key="post.id" class="post-row" :to="`/board/${post.id}`"><span class="post-category">{{ post.category }}</span><span class="post-main"><strong>{{ post.title }}</strong><small>{{ post.author }} · {{ formatDate(post.createdAt) }} · 좋아요 {{ post.likeCount || 0 }} · 댓글 {{ post.comments?.length || 0 }}</small><span v-if="post.tags?.length" class="tag-list"><span v-for="tag in post.tags" :key="tag" class="post-tag">#{{ tag }}</span></span></span><span class="post-views">조회 {{ post.viewCount || 0 }}</span></RouterLink></div>
    <div v-else class="empty-state"><strong>검색 결과가 없습니다.</strong><span>다른 검색어를 입력하거나 카테고리를 바꿔 보세요.</span></div>
    <button class="text-button icon-action compact-icon-action" type="button" @click="refreshPosts" aria-label="게시글 새로고침" title="게시글 새로고침"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 11a8 8 0 0 0-14.8-4L3 10M3 5v5h5M4 13a8 8 0 0 0 14.8 4L21 14m0 5v-5h-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg><span class="sr-only">게시글 새로고침</span></button>
  </section>
</template>
