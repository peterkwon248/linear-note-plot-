# 구조 변경 리서칭 — Plane + Notion + Plot 현재 코드 분석

> 2026-03-31 리서칭 결과 종합

---

## 1. Plane (오픈소스) 핵심 패턴

### Home 대시보드
- 5개 위젯: quick_links, recents, my_stickies, new_at_plane, quick_tutorial
- 각 위젯 `is_enabled` + `sort_order`로 토글/재정렬
- 위젯 컨테이너 = vertical stack with dividers
- 인사말(시간대 기반) + 최근 활동(이슈/페이지/프로젝트) + 빠른 링크

### Issue vs Page = 완전 분리
- Issue: state_id, priority, cycle_id, module_ids, 날짜, 관계
- Page: description, access, color, logo_props, project_ids(복수)
- 공유 base type 없음. 각자 목적에 맞는 필드만

### 사이드바 3섹션
- Header (워크스페이스 전환) → ScrollArea (네비 + 프로젝트) → Footer (유저)
- Static 항목(home, projects) + Dynamic 항목(user-sortable)

### 이슈 생성 = 모달, 템플릿은 인라인 필드
- Project → Type → Template → Title → Description → Properties
- 템플릿 선택이 별도 스텝이 아니라 폼 안의 한 필드

### Peek = 3모드
- side-peek (우측 50%) / modal (83%) / full-screen (전체)
- full-screen만 2칼럼 레이아웃 (콘텐츠 + 속성 사이드바)

---

## 2. Notion UX 핵심 패턴

### 새 페이지 = 빈 캔버스 + 인라인 힌트
- 모달 아님. 빈 페이지가 바로 열리고 타이틀 아래 힌트 메뉴
- 옵션: 빈 페이지 / 빈+아이콘 / 템플릿 / Import / DB 바로가기
- 첫 키 입력 시 힌트 사라짐
- "타입 선택 안 함" — 콘텐츠가 타입을 결정

### 인라인 DB = /slash로 생성
- /table, /board, /calendar 등 → inline vs full-page 선택
- Linked DB = 같은 데이터, 독립 뷰 설정 (핵심 패턴)
- 데이터 편집은 원본에 반영, 뷰 설정(필터/정렬)은 로컬

### 레이아웃 = per-page 플래그
- full_width (bool), font (default/serif/mono), small_text (bool)
- ••• 메뉴에서 접근
- icon (emoji/image) + cover (banner)

### Turn Into = 6점 핸들 메뉴
- 텍스트 블록만 변환 가능, 유효한 타겟만 표시
- /turn* 슬래시 커맨드도 지원
- "Turn into page" = 모든 블록에서 가능

### 템플릿 3계층
- 마켓플레이스 (30,000+) → DB별 템플릿 → 인라인 Template Button
- DB 템플릿 = 속성+콘텐츠 프리셋

---

## 3. Plot 현재 코드 분석

### Note vs WikiArticle
- Note: 23필드 (워크플로우+편집), WikiArticle: 14필드 (조립+구조)
- 공유 필드 8개, Note 고유 17개, Wiki 고유 5개
- isWiki: 104곳/35파일, WikiArticle: 303곳/35파일
- View engine은 Note[]만 처리 — Wiki는 별도 렌더링

### Store 액션 (합쳐야 할 것)
- Notes slice: 15 액션 (6개가 wiki 관련)
- WikiArticles slice: 15 액션 (블록 CRUD + merge/split)
- 통합 시: notes의 wiki 관련 6개 제거, WikiArticles의 블록 작업은 유지

### 라우팅 — Home 추가 시 터치 포인트 (5~6파일)
- ActivitySpace 타입 정의 (lib/types.ts:19)
- SPACES 배열 (activity-bar.tsx:31)
- DEFAULT_ROUTES (table-route.ts:25)
- inferSpace() (table-route.ts:92)
- VIEW_ROUTES (table-route.ts:19)
- layout.tsx mount-once 패턴
- SavedView.space 타입

### 노트 생성 = 중앙화 안 됨
- CreateItemDialog = 폴더/태그/라벨 전용 (노트 아님)
- createNote() 직접 호출 9곳에 산재
- 중앙화된 "새 페이지 생성 다이얼로그" 필요

### View engine 확장 용이
- ViewContextKey 추가 = 타입 + context-filter + defaults + config
- "todo" 컨텍스트 추가 간단
- 단, Note[]만 처리 — 통합 후 WikiArticle에도 자동 적용

---

## 4. Plot 구조 변경 시사점

### Plane에서 배울 것
- Home = 위젯 기반 대시보드 (is_enabled + sort_order)
- Peek 3모드 (side-peek/modal/full-screen)
- 템플릿 = 생성 폼의 인라인 필드 (별도 스텝 아님)
- 사이드바 Static + Dynamic 항목 분리

### Notion에서 배울 것
- 새 페이지 = 빈 캔버스 + 인라인 힌트 (모달 아님)
- 타입 선택 안 함 — 콘텐츠가 결정
- 인라인 쿼리 뷰 = /slash 커맨드 기반
- Turn Into = 유효한 타겟만 보여주는 문맥 메뉴
- per-page 레이아웃 플래그 (full_width, font, small_text)

### Plot 통합 전략
- Note에 필드 추가하는 게 가장 안전 (303곳 WikiArticle 참조 제거보다)
- `noteType: "note" | "wiki"` 디스크리미네이터로 isWiki 대체
- View engine이 Note-only인 게 장점 — 통합 후 Wiki도 자동 필터/정렬
- 새 페이지 경험 = Notion 스타일 (빈 캔버스 + 힌트)
- Home = Plane 스타일 (위젯 대시보드)
