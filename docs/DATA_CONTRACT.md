# 데이터 계약

기능 담당자가 달라도 같은 데이터를 연결할 수 있도록 필드 이름과 자료형을 고정합니다. 원본 API나 JSON의 필드명이 다르면 서비스 파일에서 아래 형식으로 변환합니다.

## 장소(Place)

```js
{
  id: 'place-seoul-cityhall', // string, 고유값
  name: '서울시청', // string, 장소명
  category: '문화시설', // string, 공통 카테고리명
  description: '소개 문구', // string, 없으면 빈 문자열
  address: '서울특별시 중구 세종대로 110', // string, 없으면 빈 문자열
  lat: 37.5663, // number, 위도
  lng: 126.9779, // number, 경도
  image: '', // string, 이미지 URL이 없으면 빈 문자열
  phone: '02-120', // string, 전화번호가 없으면 빈 문자열
  tags: ['도심', '무료'] // string[]
}
```

규칙:

- 지도는 `lat`, `lng` 숫자 좌표만 사용합니다.
- 화면에는 원본 필드 대신 `name`, `address`, `image` 등 위 이름을 사용합니다.
- 좌표가 없거나 유효하지 않은 장소는 지도 핀으로 표시하지 않습니다.
- 샘플 파일: `public/data/samples/places.json`

## 게시글(Post)

```js
{
  id: 'post-welcome', // string, 고유값
  category: '자유', // string
  title: '제목', // string
  content: '본문', // string
  author: '작성자', // string
  passwordHash: '', // string, 비밀번호 평문은 저장하지 않음
  createdAt: '2026-07-15T09:00:00.000Z', // ISO 8601 string
  updatedAt: '2026-07-15T09:00:00.000Z' // ISO 8601 string
}
```

규칙:

- `createdAt`, `updatedAt`은 ISO 8601 문자열로 저장합니다.
- 실제 서비스에서는 비밀번호 평문을 저장하지 않습니다.
- 샘플 파일: `public/data/samples/posts.json`

