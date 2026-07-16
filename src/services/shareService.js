const KAKAO_SDK_SRC = 'https://developers.kakao.com/sdk/js/kakao.min.js'
let kakaoInitPromise = null
let kakaoReady = false

function updateMetaTag(attrName, name, content) {
  if (typeof document === 'undefined') {
    return
  }

  const selector = `${attrName}="${name}"`
  let element = Array.from(document.head.querySelectorAll('meta')).find((tag) => tag.getAttribute(attrName) === name)

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attrName, name)
    document.head.appendChild(element)
  }

  element.content = content || ''
}

export function getShareUrl(path) {
  if (typeof window === 'undefined') {
    return path
  }

  const origin = window.location.origin || ''
  return `${origin}${path}`
}

export function setSocialMeta({ title, description, image, url }) {
  if (typeof document === 'undefined') {
    return
  }

  if (title) {
    document.title = title
    updateMetaTag('property', 'og:title', title)
    updateMetaTag('name', 'twitter:title', title)
  }

  if (description) {
    updateMetaTag('name', 'description', description)
    updateMetaTag('property', 'og:description', description)
    updateMetaTag('name', 'twitter:description', description)
  }

  if (url) {
    updateMetaTag('property', 'og:url', url)
  }

  if (image) {
    updateMetaTag('property', 'og:image', image)
    updateMetaTag('name', 'twitter:image', image)
  }

  updateMetaTag('property', 'og:type', 'website')
  updateMetaTag('name', 'twitter:card', 'summary_large_image')
}

export async function copyTextToClipboard(text) {
  if (typeof navigator === 'undefined') {
    throw new Error('Clipboard is not available.')
  }

  const trimmed = String(text || '').trim()
  if (!trimmed) {
    throw new Error('복사할 텍스트가 없습니다.')
  }

  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(trimmed)
  }

  const textarea = document.createElement('textarea')
  textarea.value = trimmed
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()

  try {
    document.execCommand('copy')
  } finally {
    document.body.removeChild(textarea)
  }
}

export async function shareNative(shareData) {
  if (typeof navigator === 'undefined' || !navigator.share) {
    throw new Error('Web Share API를 지원하지 않는 브라우저입니다.')
  }

  return navigator.share(shareData)
}

async function loadKakaoSdk() {
  if (kakaoInitPromise) {
    return kakaoInitPromise
  }

  kakaoInitPromise = new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('브라우저 환경이 필요합니다.'))
      return
    }

    const existing = document.querySelector(`script[src="${KAKAO_SDK_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('카카오 SDK 로드 실패')))
      return
    }

    const script = document.createElement('script')
    script.src = KAKAO_SDK_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('카카오 SDK 로드 실패'))
    document.head.appendChild(script)
  })

  return kakaoInitPromise
}

export async function initKakao() {
  if (typeof window === 'undefined') {
    return
  }

  const appKey = import.meta.env.VITE_KAKAO_APP_KEY
  if (!appKey) {
    throw new Error('Kakao 앱 키가 설정되지 않았습니다. VITE_KAKAO_APP_KEY를 확인하세요.')
  }

  await loadKakaoSdk()

  if (!window.Kakao) {
    throw new Error('카카오 SDK가 준비되지 않았습니다.')
  }

  if (!window.Kakao.isInitialized?.()) {
    window.Kakao.init(appKey)
  }

  kakaoReady = true
}

export async function shareKakao({ title, description, url, tags = [], viewCount = 0, likeCount = 0, commentCount = 0 }) {
  if (!kakaoReady) {
    await initKakao()
  }

  if (!window.Kakao || !window.Kakao.Share) {
    throw new Error('카카오 링크 공유 기능을 사용할 수 없습니다.')
  }

  const defaultImageUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/assets/localhub-share-logo.png`
    : ''

  return window.Kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title: title || 'LocalHub 공유',
      description: description || '서울 여행 정보와 게시글을 공유해보세요.',
      imageUrl: defaultImageUrl,
      link: {
        mobileWebUrl: url || "https://localhub-1.netlify.app",
        webUrl: url || "https://localhub-1.netlify.app",
      },
    },
    itemContent: {
      profileText: 'LocalHub 서울 여행 게시판',
      sum: '조회수',
      sumOp: `${Number(viewCount || 0)}회`,
    },
    social: {
      likeCount: Number(likeCount || 0),
      commentCount: Number(commentCount || 0),
      sharedCount: 0,
    },
    buttons: [
      {
        title: '게시글 보러가기',
        link: {
          webUrl: url || "https://localhub-1.netlify.app",
        },
      },
    ],
  })
}
