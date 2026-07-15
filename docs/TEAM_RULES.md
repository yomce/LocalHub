# LocalHub 공통 결정 사항과 Git 규칙

## 공통 기반 결정

| 항목 | 결정 |
| --- | --- |
| 프론트엔드 | Vue 3 + Vite |
| 페이지 이동 | Vue Router |
| 공통 스타일 | `src/styles/reset.css`, `variables.css`, `main.css` |
| 데이터 초기 저장 | `public/data/`의 JSON 샘플 |
| 실제 API 키 | `.env`에서 관리하고 Git에 커밋하지 않음 |
| 데이터 형식 기준 | `docs/DATA_CONTRACT.md` |

## 폴더 사용 규칙

- 페이지 단위 화면은 `src/views/`에 만듭니다.
- 여러 화면에서 쓰는 UI는 `src/components/`에 만듭니다.
- 데이터 조회·변환은 `src/services/`에 만듭니다.
- 재사용 상태·동작은 `src/composables/`에 만듭니다.
- 공통 상수는 `src/utils/`, 공통 스타일은 `src/styles/`에 둡니다.

## Git 규칙

1. `main` 브랜치는 항상 실행 가능한 상태를 유지합니다.
2. 기능 개발은 `feat/기능명` 브랜치에서 합니다. 예: `feat/map-marker`
3. 오류 수정은 `fix/문제명`, 문서 작업은 `docs/문서명` 브랜치를 사용합니다.
4. 커밋 메시지는 `feat: 지도 핀 추가`, `fix: 빈 데이터 처리`처럼 목적을 앞에 씁니다.
5. 병합 전 `npm run build`가 성공하는지 확인합니다.
6. `.env`, API 키, 개인 정보, `node_modules`는 커밋하지 않습니다.

## 실행 방법

```bash
npm install
npm run dev
```

배포 또는 병합 전 확인:

```bash
npm run build
```

