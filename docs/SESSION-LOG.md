# Plot — Session Log

> 시간순 chronological 세션 기록 (append-only). 직전 세션 멘탈 상태 복원용.
> 가장 최근이 위에. 오래된 세션은 아래로 밀려남.
> Session entry 형식: 날짜 + 머신 + 완료 + 결정 + 다음

---

## 2026-04-10 (긴 세션, 커밋 2개)

### 완료 — 2차 커밋 (P1-카드 + P2 각주 + Reference 개선)
- **P1-카드 3개**: InsightsView openNote→usePaneOpenNote (2곳), ActivityHeatmap 월별 구분선, Mini calendar updatedAt 레이어 (accent/amber 2-dot)
- **P2 각주 리치 텍스트**: FootnoteMiniEditor (미니 TipTap, 툴바 없음 나무위키 패턴), Footer URL 전용 input (텍스트/URL 분리), 본문 팝오버 읽기 전용 + Edit 버튼 → Footer 연동, content JSON 자동 마이그레이션
- **Reference 개선**: "Rebuild links" 버튼 (IDB 전체 스캔), Used In에 wiki article 지원
- **버그 수정**: WikilinkSuggestion/MentionSuggestion key 충돌 (type:id prefix)
- **Store v76**: Reference.usedInNoteIds

### 완료 — 1차 커밋 (Split-First + Calendar + 11 view + Reference.history + Library)
- **Phase 2**: Store cleanup — `SidePanelMode 'peek'`, `PeekContext`, `secondarySidePanel*` 전부 제거, v72 → v73 migration
- **Phase 3**: Peek 파일/참조 제거 — `side-panel-peek.tsx`, `peek-empty-state.tsx`, `lib/peek/*` 5개 파일 삭제 + `openSidePeek` 호출 14곳 정리 (대부분 `setSidePanelContext`로 교체, 일부는 `openInSecondary`)
- **Phase 4**: Split view picker 재설계 — 새 파일 3개 (`lib/workspace/entity-search.ts`, `lib/workspace/secondary-suggestions.ts`, `components/workspace/secondary-open-picker.tsx`) + store 확장 (`secondaryPins`, `secondaryPickerOpen`, `toggleSecondaryPin`) + v73 → v74 migration + `Cmd+Shift+\` 단축키
- **Phase 5**: Focus tracking + 시각 피드백 — `onMouseDownCapture`는 이미 `WorkspaceEditorArea`에 있었음, `opacity-80` → `border-t-2 border-t-accent`로 교체 + layout.tsx의 view-mode split에도 동일 적용
- **Sticky `sidePanelContext` 버그 픽스** — `setActivePane`/`openInSecondary`/`openNote`에서 ctx 자동 클리어 (sticky → transient preview 동작)

### 완료 — UI 폴리싱
- **헤더 단차 픽스**: 4개 헤더 모두 52px `h-(--header-height)` 통일 (note-editor / linear-sidebar / smart-side-panel / wiki-secondary)
- **A|B 아이콘 → SplitHorizontal**: view-header의 split 버튼 + `IconSplitView` 자체에서 A/B 텍스트 제거

### 완료 — Calendar 리뉴얼 (Stage A/B/C)
- **Stage A**: view-swap 버그 픽스 (`CalendarView`에 `isEditing → WorkspaceEditorArea swap` 패턴 + `usePaneOpenNote`)
- **Stage B**: Wiki article 캘린더 통합 (`wikiToNoteShape()` 어댑터, dedupe, violet BookOpen 아이콘, 클릭 분기)
- **Stage C**: 사이드바 재설계 (`components/sidebar/calendar-mini.tsx` 미니 월간 캘린더, `components/sidebar/activity-heatmap.tsx` last 30 days heatmap, Today 섹션 Wiki 카운트 추가, `plot:calendar-jump`/`plot:calendar-month-change` 이벤트 sync, SSR hydration 가드)

### 완료 — 9개 view 통합 픽스 (Calendar와 같은 버그)
- **wiki-view**, **ontology-view**, **labels-view**, **templates-view**, **insights-view**, **graph-insights-view**, **todo-view**, **home-view**, **search-view**에 동일 패턴 적용
- `WorkspaceEditorArea` import + `isEditing` 체크 + 조건부 return
- openNote 호출 view는 `usePaneOpenNote`로 교체 (home/search는 setSelectedNoteId 유지)

### 큰 결정
- **🎯 Split-First 복귀 확정** — Peek-First 실험 (PR #176 초반) 폐기 최종화
- **Calendar = 지식 활동 시간 대시보드** — docs/CONTEXT.md의 Calendar 설계 spec 부분 구현 (Wiki layer, activity heatmap, mini calendar)
- **노트/위키 시각 통일** — violet BookOpen (WIKI_STATUS_HEX.article), 노트 status shape
- **9개 view 패턴 통일** — 모든 뷰가 NotesTableView와 동일하게 isEditing 감지 → WorkspaceEditorArea 렌더

### 다음
- P0-카드 (FootnotesFooter 재검증, referenceLink, 6곳 setSidePanelContext UX 재평가)
- P1 (Reference.history, Library/Wiki Bento Grid, Library FilterPanel)

### Watch Out
- **git stash 실수**: `git stash 2>&1 | head -3` 명령을 디버깅 중 실행 → 세션 전체 변경사항이 stash로 이동함. `git stash pop stash@{0}`으로 즉시 복원함. 교훈: git stash는 `-u` 없어도 위험, 세션 중에는 사용 금지
- **.next 캐시 stale**: HMR이 삭제된 peek-empty-state.tsx를 참조하려 해서 에러. `rm -rf .next` + 서버 재시작으로 해결
- **Hydration mismatch**: `new Date()` in useState initializer → SSR/CSR 시간 차이. mount 가드 패턴으로 해결
- **InsightsView subcomponents**: openNote 3곳 미처리 (P1-카드로 쌓임)

### 머신
(현재 세션)

---

## 2026-04-09 오후~저녁 (회사)

### 완료
- **크로스노트 북마크 5 Phase** 전부 구현
  - GlobalBookmark store slice + migration v72
  - extractAnchorsFromContentJson 공용 유틸
  - Bookmarks 탭 2섹션 (Pinned + This Note) + Ctrl+Shift+B
  - WikilinkNode anchorId attr + 2단계 앵커 피커
  - 플로팅 TOC 핀 + 앵커 우클릭 Pin to Bookmarks
- **FootnotesFooter 접기/펼치기** — 기본 접힌 상태, [N] 클릭 시 자동 펼침
- **Wiki Sources 클릭 fix** — openNote + setActiveRoute로 네비게이션 정상화
- **Outline 개선** — TipTap JSON 기반, TOC 블록 우선, 헤딩 fallback, 클릭 스크롤
- **ReferencedInBadges dedupe** — 위키 article ID 기준 중복 제거 + secondary 컴팩트 모드
- **Peek-First 아키텍처 Phase 0+1** — 사이드바 단일 책임 (layout.tsx)
  - WorkspaceEditorArea에서 사이드바 코드 전부 제거
  - layout.tsx가 모든 케이스 처리 (단독/스플릿/뷰스플릿/에디터스플릿)
  - hasSplit/hasViewSplit/showSidePanel 명확한 분기

### 브레인스토밍 & 큰 결정
- **Outline = 단순 구조 시각화** — 앵커는 별개 Bookmarks 탭으로 분리
- **사이드바 아키텍처 = A안 (layout.tsx 단일 책임)** — 여러 위치 렌더링 충돌 해결
- 🎯 **Split View 폐기 + Peek 확장 (Peek-First 마이그레이션)** — 가장 큰 방향 결정
  - Phase 0~5로 단계적 진행
  - Peek 지원: Note + Wiki만 (Calendar/Ontology 제외)
  - 사이즈 시스템: Min/Mid/Max + Drag
  - 호버 프리뷰는 유지 (Peek와 별개)
- **워크플로우 개선 결정** — NEXT-ACTION.md + SESSION-LOG.md 도입

### 다음
- **Phase 2: Peek가 Wiki 표시 가능하게** (NEXT-ACTION.md 참조)

### Watch Out
- Reference.history 작업 중간에 멈춤 — Peek 마이그레이션 후 복귀
- 단독 에디터 사이드바 버그 디버깅에 시간 많이 씀 — root cause는 여러 곳에서 사이드바 렌더링 시도 + react-resizable-panels의 id+order 누락

### 머신
회사

---

## 2026-04-08 (이전 세션)

PR #169~171 작업 — Library 고도화, Reference 하이브리드 통합, Trash 뷰 확장 등.
상세는 docs/MEMORY.md PR 목록 참조.
