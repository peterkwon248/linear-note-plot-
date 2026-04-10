# Plot — TODO (2026-04-10 저녁)

## ✅ 최근 완료 (2026-04-10 세션)

### Split-First 복귀 완성
- **Phase 2**: Store cleanup (peek/secondarySidePanel 상태·액션 제거, v73 migration)
- **Phase 3**: Peek 파일/참조 제거 (14개 파일 + 5개 삭제)
- **Phase 4**: Split view picker 재설계 — `SecondaryOpenPicker` 다이얼로그 (`Cmd+Shift+\`) + `entity-search` + `secondary-suggestions` + `secondaryPins` store, v74 migration
- **Phase 5**: Focus tracking + 시각 피드백 — active pane `border-t-2 border-t-accent`, view-mode + editor-mode split 통일
- **Sticky `sidePanelContext` 버그 픽스** — `setActivePane`/`openInSecondary`/`openNote`에서 ctx 자동 클리어
- **9개 view 통합 픽스** — `wiki`/`ontology`/`labels`/`templates`/`insights`/`graph-insights`/`todo`/`home`/`search`에 Calendar와 같은 isEditing → WorkspaceEditorArea swap 패턴 적용

### UI 폴리싱
- **헤더 단차 픽스** — 4개 헤더 52px `h-(--header-height)` 통일
- **A|B 아이콘 → SplitHorizontal** (Phosphor, view-header split 버튼)
- **IconSplitView 자체에서도 A/B 텍스트 제거** (plot-icons.tsx)

### Calendar 리뉴얼
- **Stage A**: view-swap 버그 픽스 — `CalendarView`의 `isEditing → WorkspaceEditorArea` 패턴 + `usePaneOpenNote`
- **Stage B**: Wiki article 캘린더 통합 — `wikiToNoteShape()` 어댑터, dedupe, violet BookOpen 아이콘, click 분기 (wiki → `navigateToWikiArticle`, note → `openNote`)
- **Stage C**: 사이드바 재설계 — `components/sidebar/calendar-mini.tsx` (월간 그리드 + 날짜 점프), `components/sidebar/activity-heatmap.tsx` (last 30 days contribution), Today 섹션 Wiki 카운트 추가, `plot:calendar-jump`/`plot:calendar-month-change` 이벤트 sync

---

## 🟡 P0-카드 (작은 후속)

- [ ] **FootnotesFooter 접기/펼치기 재검증** — PR #174 작업물. 기본 접힌 상태 "▶ FOOTNOTES (N)", `[N]` 클릭 시 자동 펼침
- [ ] **referenceLink 노드 최종 검증** — Shift+클릭 시 referenceLink 삽입 동작
- [ ] **6곳 `setSidePanelContext` UX 재평가** — Phase 3에서 `openSidePeek`를 교체한 6곳. Sticky ctx가 자동 클리어되는 지금 시점에서 UX 관점 재검토
  - `side-panel-connections.tsx` (openConnectedNote/Wiki 헬퍼)
  - `wikilink-context-menu.tsx` (handlePeek)
  - `note-hover-preview.tsx` (handlePeek)
  - `nodes/note-embed-node.tsx` (onClick)
  - `wiki-block-renderer.tsx` ("Open in side panel" 메뉴)
  - `lib/note-reference-actions.ts` line 100 (regular click)

---

## P1 — 기능 확장 (이번 세션에서 보류)

- [ ] **Reference.history** — 데이터 모델 + UI (작업 중간에 멈춤)
- [ ] **Library + Wiki Overview Bento Grid 리디자인** — Premium stat card, Featured Article, Activity Feed
- [ ] **Library FilterPanel Notes 수준** — view-engine 인프라 재사용, 2단계 nested 필터

---

## P1-카드 (이번 세션에서 쌓인 debt)

- [ ] **InsightsView 내부 subcomponents** — `openNote` 3곳 (line 120, 187)을 `usePaneOpenNote`로 교체 (secondary pane에서 렌더 시 바른 동작)
- [ ] **ActivityHeatmap 고도화** — tooltip 확장, 월별 구분선, updatedAt 별도 레이어
- [ ] **Mini calendar 확장** — updatedAt 레이어, 이벤트 count 표시

---

## P2 — 인사이트 + 각주

- [ ] **인사이트 허브** — 온톨로지 Single Source of Insights. Knowledge WAR / Link Density / Stub Conversion Rate 등
- [ ] **각주 리치 텍스트** — plain text → 인라인 서식 + 위키링크 (미니 TipTap)
- [ ] **인포박스 고도화** — 대표 이미지, 섹션 구분 행, 접기/펼치기, 셀 위키링크

---

## P3 — 사이드패널 + 뷰 확장

- [ ] **사이드패널 리디자인** — Connections 인라인 프리뷰 (Obsidian식), 호버 프리뷰/사이드 패널 역할 정리
- [ ] **동음이의어 해소 페이지** — 멀티 링크 매칭 시 선택 화면
- [ ] **커맨드 팔레트 확장** — 풀페이지 검색, 북마크 커맨드
- [ ] **Calendar P2**: Layer Toggles UI (Notes/Wiki/Relations/Tags/Templates — DisplayPanel 위치), Time Range Quick Filters, Streaks/Stale/Patterns widget

---

## P4 — 지능 + 검색

- 요약 엔진, 풀페이지 검색 분리
- 웹 클리퍼, 가져오기/내보내기, View v2, 리스트 가상화
