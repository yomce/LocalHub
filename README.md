<div align="center">

# LocalHub

### 공공데이터 기반 서울 지역 정보 커뮤니티

서울의 관광지, 맛집, 문화시설, 축제 정보를 확인하고
익명으로 지역 경험을 공유할 수 있는 웹 서비스입니다.

<br>

<img src="https://img.shields.io/badge/Vue.js_3-4FC08D?style=flat-square&logo=vuedotjs&logoColor=white">
<img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white">
<img src="https://img.shields.io/badge/Leaflet-199900?style=flat-square&logo=leaflet&logoColor=white">

</div>

---

## 주요 기능

* 서울 관광지, 맛집, 문화시설, 축제 정보 조회
* Leaflet 기반 지도 탐색
* 로그인 없는 익명 게시판
* AI 기반 지역 정보 챗봇

---

## 기술 스택

`Vue 3` `Vite` `Vue Router` `Pinia` `Leaflet` `OpenAI API` `Netlify`

---

## 실행 방법

```bash
git clone https://github.com/사용자명/LocalHub.git
cd LocalHub

npm install
npm run dev
```

프로젝트 루트에 `.env` 파일을 생성합니다.

```env
VITE_OPENAI_API_KEY=your_api_key
```

---

## 협업 규칙

```text
main
└─ develop
   ├─ feature/*
   └─ fix/*
```

```text
feat: 기능 추가
fix: 오류 수정
style: UI 수정
docs: 문서 수정
```

기능별 브랜치에서 작업한 뒤 Pull Request를 통해 `develop`에 병합합니다.

---

## 팀원

| 이름   | 담당         |
| ---- | ---------- |
| 권순일 | 지역 정보 및 지도 |
| 김경연 | 게시판        |
| 이승재 | AI 챗봇      |

---

<div align="center">

**LocalHub Team**

</div>
