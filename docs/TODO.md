# Plot — TODO (2026-04-09)

## 🔴 P0 — 최우선 (다음 세션): Split View 진입점 + 후속

- [ ] **Split View 진입점 브레인스토밍** — 에디터 헤더 버튼(SplitSquareHorizontal), Ctrl+\ 단축키, 커맨드 팔레트 "Split View", 노트 리스트 우클릭 "Open in Split". 현재 wikilink 우클릭/호버 프리뷰/Peek에만 진입점 있어서 디스커버리 부족
- [ ] **"Side by Side" → "Split View" 네이밍 변경** — 전체 UI 텍스트 + 코드 변수명
- [ ] **나머지 뷰 컴포넌트 pane 인식** — wiki-view, calendar-view, ontology-view 등에서 openNote 호출 시 usePaneOpenNote 적용
- [ ] **FootnotesFooter 접기/펼치기** — 기본 접힌 상태 "▶ FOOTNOTES (2)", `[1]` 클릭 시 자동 펼침
- [ ] **referenceLink 노드 최종 검증** — Shift+클릭 시 referenceLink 삽입 동작 확인

## P1

- [ ] **크로스노트 북마크** — GlobalBookmark store slice, 사이드패널 Bookmarks 탭 리뉴얼, Ctrl+Shift+B 단축키, 자동 라벨 추출
- [ ] **Library + Wiki Overview Bento Grid 리디자인** — Premium stat card, Featured Article, Activity Feed
- [ ] **Library FilterPanel Notes 수준** — view-engine 인프라 재사용, 2단계 nested 필터
- [ ] **createdAt + Reference.history** — 각주 타임스탬프 + 수정 이력

## P2

- [ ] **인사이트 중앙 허브** — 온톨로지 사이드바 Insights 섹션
- [ ] **각주 리치 텍스트** — plain text → 인라인 서식 + 위키링크 (미니 TipTap)
- [ ] **인포박스 고도화** — 대표 이미지, 섹션 구분 행, 접기/펼치기

## P3

- [ ] **사이드패널 리디자인** — Connections 인라인 프리뷰 (Obsidian식), Peek에서 직접 Quote 삽입
- [ ] **호버 프리뷰 → Peek 통합 검토** — 역할 중복 정리
- [ ] **커맨드 팔레트 확장** — 풀페이지 검색, 북마크 커맨드, J/K 네비게이션

## 완료 (2026-04-09)

- [x] Split View 독립 패널 시스템 — 하이브리드 모델 설계 + 전체 구현
  - selectedNoteId/secondaryNoteId 완전 분리 (setActivePane에서 덮어쓰기 제거)
  - openNote에 pane 파라미터 추가 (하위 호환)
  - secondaryHistory[] 독립 네비게이션 (goBack/goForward)
  - secondaryRoute/secondarySpace 독립 라우팅 (table-route.ts)
  - PaneContext + usePaneOpenNote + usePaneActiveRoute 훅
  - SecondaryPanelContent — note/wiki/뷰 렌더러
  - breadcrumb space 드롭다운 (6 spaces)
  - SecondaryWikiArticle — Aa/접기/레이아웃/Edit 컨트롤
  - setRouteInterceptForSecondary — 우측 클릭 시 글로벌 라우트 인터셉트
  - NotesTableView 재귀 렌더링 방지 (usePane() + isEditing 스킵)
  - LibraryView usePaneActiveRoute 적용
  - 사이드패널 focusedPane 추적
  - wikilink Ctrl+클릭 패널 인식

## 완료 (2026-04-08)

- [x] 이전 세션 작업 (PR #169~171)
