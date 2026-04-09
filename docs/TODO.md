# Plot — TODO (2026-04-09)

## 🔴 P0 — 최우선: Peek-First 아키텍처 마이그레이션

> **방향 결정 (2026-04-09)**: Split View를 폐기하고 Peek를 확장하여 단일 보조 콘텐츠 모델로 전환.
> Phase 0+1 (사이드바 단일 책임 구조)은 완료. Phase 2~5 남음.

### Phase 2: Peek 확장 (Wiki 지원)
- [ ] **Peek가 Note + Wiki 모두 표시 가능하게** — 현재 Note만 지원
- [ ] **SidePanelPeek 컴포넌트가 wiki article도 렌더** — WikiArticleView를 좁은 폭으로 임베드
- [ ] **Peek context 타입 확장** — `{ type: "note" | "wiki", id }` 형태로
- [ ] **Library는 제외 검토** — 단일 Reference는 이미 사이드패널 Detail에서 처리됨
- [ ] **Calendar/Ontology는 명시적으로 제외** — Peek로는 의미 없음

### Phase 3: 사이즈 시스템 (Min / Mid / Max + Drag)
- [ ] **Peek + Side Panel에 사이즈 토글 버튼 추가** — `[─] [□] [▣]` (min/mid/max)
- [ ] **Min**: 280px (좁은 인스펙터, 미리보기)
- [ ] **Mid**: 480px (표준 작업, 현재 default)
- [ ] **Max**: 50% (Split View 대체, 평행 작업)
- [ ] **드래그 리사이즈 유지** — react-resizable-panels 기능 그대로
- [ ] **키보드 단축키 검토** — `Cmd+1/2/3` for min/mid/max?

### Phase 4: Peek 독립 네비게이션
- [ ] **Peek 안에서 위키링크 클릭 시 Peek 안에서 navigate** — 메인 영역 영향 없음
- [ ] **Peek history (back/forward)** — 현재 secondaryHistory 로직을 Peek로 이동
- [ ] **Peek breadcrumb** — 어떤 노트/위키 보고있는지

### Phase 5: Split View 폐기
- [ ] **Split View 코드/UI 전부 제거** — secondaryNoteId, secondarySpace, SecondaryPanelContent 등
- [ ] **모든 진입점을 Peek로 리다이렉트** — wikilink 우클릭, hover preview, command palette
- [ ] **"Split View" 용어 → "Peek"** — UI 텍스트 + 코드 변수명
- [ ] **단축키 Ctrl+\ → Peek 토글로 변경**
- [ ] **WorkspaceEditorArea 단순화** — 단일 에디터만 책임 (split 코드 제거)

### 호버 프리뷰는 유지 (Peek와 별개)
- 호버 = 일시적 floating tooltip (자동 hide)
- Peek = 지속 패널 (수동 open/close)
- 두 개념 분리 유지

---

## P0-카드 — 작은 후속 작업

- [ ] **나머지 뷰 컴포넌트 pane 인식** — wiki-view, calendar-view, ontology-view 등에서 openNote 호출 시 usePaneOpenNote 적용 (Phase 5에서 자동 해결될 수도)
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
  - [ ] **Split View 사이드패널 pane-aware 전환** — 사이드패널 리뉴얼 시 같이 작업
    - `setSecondarySidePanelContext` 스토어 추가 (현재 setter 없음)
    - pane-aware 훅: `usePaneSidePanelOpen()`, `usePaneSidePanelContext()` — usePane()에 따라 자동 분기
    - 각 View 수정: wiki-view, library-view, notes-table, calendar-view, ontology-view에서 pane-aware 훅으로 교체
    - 현재: 에디터 split view 사이드패널은 A안(우측 고정, active pane 추적)으로 작동 ✅
    - 미작업: 뷰 모드(Wiki/Library/Calendar 등) secondary pane에서 사이드패널 context 미연동
- [ ] **호버 프리뷰 → Peek 통합 검토** — 역할 중복 정리
- [ ] **커맨드 팔레트 확장** — 풀페이지 검색, 북마크 커맨드, J/K 네비게이션

## 완료 (2026-04-09)

- [x] **Peek-First 아키텍처 Phase 0+1 — 사이드바 단일 책임 (layout.tsx)**
  - WorkspaceEditorArea에서 사이드바 코드 전부 제거
  - layout.tsx가 단독/스플릿 모든 케이스의 사이드바 렌더링 책임
  - WorkspaceEditorArea는 [Editor] 또는 [Editor]|[Editor] 만 책임
  - View-mode split (no editor)은 layout.tsx의 별도 panel로 처리
  - hasViewSplit / hasSplit / showSidePanel 명확한 분기
- [x] Split View 사이드패널 A안 — unified side panel (우측 고정, active pane 추적)
  - PaneProvider로 secondary SmartSidePanel 감싸기 (usePane() 정상 작동)
  - SidePanelContext noteId prop 주입 (useSidePanelEntity → SidePanelContext 데이터 플로우)
  - layout.tsx + WorkspaceEditorArea 동일 패턴: split 시 맨 오른쪽 1개 패널, pane 전환 시 content만 교체
  - alwaysVisible prop으로 pane 전환 시 깜빡임 방지
  - X 닫기 시 양쪽 open 상태 동시 해제
  - fade-in 150ms 전환 애니메이션
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
