<div align="center">

# LocalHub

### 공공데이터 기반 서울 지역 정보 커뮤니티

서울의 관광지, 맛집, 문화시설, 축제 정보를 확인하고
지역 경험을 공유할 수 있는 Vue 3 기반 웹 서비스입니다.

<br>

<img src="https://img.shields.io/badge/Vue.js_3-4FC08D?style=flat-square&logo=vuedotjs&logoColor=white">
<img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white">
<img src="https://img.shields.io/badge/Leaflet-199900?style=flat-square&logo=leaflet&logoColor=white">

</div>

---

## 현재 구성

현재는 협업을 위한 공통 기반을 포함합니다.

* Vue 3 라우팅 및 공통 스타일
* Git 협업 규칙
* 장소·게시글 데이터 계약
* 샘플 JSON 데이터

---

## 주요 기능

* 서울 지역 정보 조회
* Leaflet 기반 지도 시각화 및 경로 안내
* 익명 게시판 CRUD
* AI 기반 지역 정보 챗봇
* 소셜 공유 및 실시간 알림

---

## 시작하기

```bash
git clone https://github.com/사용자명/LocalHub.git
cd LocalHub

npm install
npm run dev
```

AI 챗봇 사용 시 서버 환경 변수로 OpenAI 키를 설정합니다.

```bash
# 프로젝트 루트에서 실행
set OPENAI_API_KEY=your_api_key
# 또는 PowerShell: $env:OPENAI_API_KEY="your_api_key"
```

Vite 개발 서버는 `/api/chat` 경로로 요청을 프록시해 서버 측에서 OpenAI를 호출합니다.

---

## 공통 문서

* `docs/TEAM_RULES.md` : 기술·폴더·Git 규칙
* `docs/DATA_CONTRACT.md` : 장소·게시글 데이터 형식
* `public/data/samples/` : 샘플 JSON 데이터

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

| 이름  | 담당                  |
| --- | ------------------- |
| 권순일 | CRUD, 추가 기능, 실시간 알림 |
| 김경연 | AI 챗봇, 소셜 공유 연동     |
| 이승재 | 지도 시각화, 경로 안내       |

---

<div align="center">

**LocalHub Team**

</div>
