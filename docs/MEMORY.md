# Plot Project Memory

## Project Overview
- **Type**: Next.js knowledge management app (Linear UI + Obsidian linking + Anki-lite review)
- **Stack**: Next.js 16, React 19, TypeScript, Zustand 5 (persist w/ IDB), TipTap 3, Tailwind v4
- **Store**: `lib/store/index.ts` — 20-slice Zustand store with versioned migration (currently v64)
- **Workflow**: Inbox -> Capture -> Permanent (3 statuses only)

## User Preferences
- Korean communication preferred (casual tone)
- Pragmatic over theoretical — values working code over perfect design
- Prefers simple solutions (YAGNI principle)
- Commit workflow: commit -> push -> PR -> squash merge to main
- Worktree-based development (branch per session)
- Design quality is top priority — Linear-level polish
- 범용 노트앱 + 제텔카스텐

## Key Patterns
- **Separate map pattern**: `srsStateByNoteId`, `viewStateByContext`, `backlinksIndex` — avoid polluting Note type
- **Store migration**: Bump version, add migration block in `migrate()` function
- **Event system**: `noteEvents` with `NoteEventType` union, bounded to MAX_EVENTS_PER_NOTE=1000
- **Attachment IDB**: Binary blob data in separate IDB (`plot-attachments`), metadata in Zustand persist
- **Alias resolution**: BacklinksIndex + graph.ts register note aliases in `titleToId` Map (no-clobber)
- **Search**: Worker-based FlexSearch with IDB persistence
- **Body separation**: Note content in separate IDB (`plot-note-bodies`), meta in Zustand persist
- **Wiki block body separation**: Text block content in `plot-wiki-block-bodies` IDB, block metadata in `plot-wiki-block-meta` IDB
- **Workspace**: Simplified dual-pane (v52) — `selectedNoteId` (primary) + `secondaryNoteId` (right editor), react-resizable-panels
- **Side Panel**: Unified `SmartSidePanel` — 4-tab: Detail(메타데이터) + Connections(Connected/Discover) + Activity(Thread/Reflection) + Peek(미리보기). v64
- **Wiki sectionIndex**: `WikiSectionIndex[]` in Zustand for lightweight TOC, full blocks in IDB for scalability (v53)
- **Responsive NotesTable**: ONE grid for all sizes — ResizeObserver + minWidth thresholds
- **TipTap Editor**: Shared config factory (`components/editor/core/shared-editor-config.ts`) with 4-tier system (base/note/wiki/template). Title 노드 통합 (`core/title-node.ts`) — 제목과 본문이 하나의 TipTap 문서. 25+ extensions.
- **2-Level Routing**: `activeSpace` (inbox/notes/wiki/ontology/calendar) + `activeRoute`, `inferSpace()` 하위호환
- **Phosphor Icons**: Lucide→Phosphor 전체 마이그레이션 완료 (PR #104, 83파일). `components/plot-icons.tsx`는 레거시
- **Wiki Collection**: `wikiCollections: Record<string, WikiCollectionItem[]>` — per-wiki-note staging area for related material
- **Undo Manager**: `lib/undo-manager.ts` — LinkedList 기반 글로벌 Undo/Redo (capacity 50), Zustand state diff 기반
- **Sub-grouping**: `group.ts` 재귀 호출로 2단계 그룹핑. NoteGroup.subGroups에 저장. VirtualItem "subheader" 타입으로 렌더
- **Thread Nested Replies**: ThreadStep.parentId 기반 트리 구조. Thread 패널에서 들여쓰기 렌더 + Reply 버튼
- **Wiki Categories**: wiki-categories slice, DAG 트리 (parentIds[]), 2-panel 트리 에디터 (드래그 계층 편집)
- **Wiki Layout Preset**: `WikiLayout = "default" | "encyclopedia"` — article별 레이아웃 전환
- **Wiki URL Block**: `WikiBlockType` 'url' 추가, 유튜브 iframe embed + 일반 링크 카드
- **Unified Pipeline**: Filter/Display/SidePanel 통합 — 5개 space가 공유 컴포넌트 사용
- **ToggleSwitch**: `components/ui/toggle-switch.tsx` — 라이트/다크 모드 공통, off=회색 on=accent+white knob
- **ChipDropdown**: `components/ui/chip-dropdown.tsx` — 제네릭 드롭다운, DisplayPanel에서 추출
- **Graph Filter Adapter**: `lib/view-engine/graph-filter-adapter.ts` — OntologyFilters ↔ FilterRule[] 변환
- **Discover Engine**: `lib/search/discover-engine.ts` — keyword+tag+backlink+folder 4신호 로컬 추천
- **SidePanel 4탭**: Detail(메타데이터) + Connections(Connected/Discover) + Activity(Thread/Reflection) + Peek(미리보기), SidePanelMode v64
- **Toolbar Config**: `lib/editor/toolbar-config.ts` — 42 item IDs, normalizeLayout(), Arrange Mode (dnd-kit drag-and-drop). Settings store에 persist
- **Toolbar Primitives**: `components/editor/toolbar/toolbar-primitives.tsx` — ToolbarButton(40×40), ToolbarDivider, ToolbarGroup, ToolbarSpacer. Phosphor weight="light"
- **Editor Colors**: `lib/editor-colors.ts` — 16 TEXT_COLORS + 16 HIGHLIGHT_COLORS, 8-column grid

## Store Slices (20 total)
notes, workflow, folders, tags, labels, thread, maps, relations, ui, autopilot, templates, editor, workspace, attachments, ontology, reflections, wiki-collections, saved-views, wiki-articles, wiki-categories

## Completed PRs (recent)
- **PR #80**: Wiki system + Side Peek + soft-delete trash
- **PR #81**: 위키링크 UX 통합 — `[[` 하나로 통합
- **PR #84**: Architecture Redesign v2 Phase 1~5 완료
- **PR #85**: Phase 6 Wiki Evolution + 후속 작업 — auto-enroll, korean-utils, Graph 노드 형태, Wiki Overview 재구조, Calendar 승격, 위키 강등, Display 정리
- **PR #86**: Phase 7 Wiki Collection + Graph Insights + docs 정리
- **PR #91**: Custom Views + Calendar 리디자인 + 분포 패널 + 디자인 라이브러리
- **PR #88**: Filter & Display 시스템 v2 — Linear 철학 적용
  - FilterPanel 2단계 nested (hover 기반 side-by-side)
  - DisplayPanel 2모드 (List/Board, Table 제거)
  - List 모드 Linear식 렌더링 (status shape icon + 제목 + 칩 + 시간)
  - Status 형태 차별화 (○ Inbox / ◐ Capture / ● Permanent)
  - Priority 제거 (Pin + Labels로 대체)
  - Grouping/Sub-grouping 드롭다운 추가
  - view-configs 5뷰별 설정 분리
  - ViewState 확장 (subGroupBy, showThread, orderPermanentByRecency)
  - Links/Reads/Updated/Created 아이콘 구분자
- **PR #89**: 후속 개선 — EditorToolbar hooks 수정, Board toast, Grouping 동적 연동
- **PR #90** (WIP): 레이아웃 리팩토링 + List 디자인 품질 개선
  - List/Table 컬럼 디자인 Linear 수준으로 (선 제거, 연한 헤더, 44px 행)
  - "Order by X" 정렬 칩 (ViewHeader에 표시)
  - ViewDistributionPanel 신규 (Linear식 우측 데이터 분포 패널)
  - deprecated LayoutMode(6값) 완전 삭제
  - Research 모드 + 6개 서브프리셋 삭제
  - Zen 모드 삭제 → sidebarCollapsed + detailsOpen 독립 토글
  - WorkspaceMode 타입 삭제, store migration v44
  - Filter sub-panel hover 위치 동적 계산 (Linear식)
  - Quick Filter 클릭 연동

- **PR #101**: Board SubGroup Rows + Distribution Panel + 필터 토글
  - Board 컬럼 내 SubGroup(Rows) 렌더링 — 서브그룹 헤더 + 접기/펼치기 + COLUMN_CARD_LIMIT 유지
  - Display Panel Board 모드에 Rows + Group order 드롭다운 복원
  - Board에 ViewDistributionPanel 연결 (List와 동일한 Status/Folder/Tags/Labels 4탭)
  - Distribution 사이드바 항목 클릭 = 필터 토글 (List/Board 양쪽)
- **PR #100**: Linear Design Polish + Sub-group Order
  - 8-Phase 디자인 토큰 준수율 100% 달성 (~251건 위반 → 5건 의도적 유지)
  - globals.css에 11개 신규 시맨틱 토큰 추가 (sidebar-active, surface-overlay, hover-bg, active-bg, toolbar-active 등)
  - DESIGN-TOKENS.md에 Linear Polish Design Principles 6대 원칙 + Borderless Design 원칙 + Surface/인터랙션 토큰 문서화
  - DESIGN-TOKENS.md 다크테마 값 globals.css 실제값으로 동기화
  - linear-sidebar.tsx: 27건 rgba/hex → 시맨틱 토큰
  - view-header + filter-panel + display-panel: P0 라이트모드 깨짐 수정 (bg-[#1d1d20] → bg-surface-overlay)
  - notes-table.tsx: 24건 arbitrary value → 토큰 (text-[Npx], bg-white/, hex)
  - FixedToolbar + EditorToolbar + ColorPicker + TableMenu: 인라인 style → Tailwind (rgba(94,106,210,0.2) → bg-toolbar-active)
  - 나머지 ~20 파일: text-[Npx], bg-white/ 일괄 토큰화
  - Sub-group Order: ViewState.subGroupSortBy (default/manual/name/count) + 드롭다운 UI
  - Sub-group 드래그 순서 변경 (manual 모드)
  - Grouping/Sub-grouping 상호 배제 + 자동 리셋
  - Board 뷰에서 미지원 Rows/Group order 행 제거
  - Store migration v54→v58
- **PR #102**: 타이포그래피 밸런스 + 위키 카테고리 UX 대폭 개선
  - 위키/캘린더/스플릿 에디터 폰트 크기 조정
  - 카테고리 검색 필터, RECENT 최근 1개, 우클릭 컨텍스트 메뉴(Add subcategory/Rename/Delete)
  - 빈 공간 우클릭 "New category"
  - List 뷰 (Tree/List 전환), 전용 필터(Tier/Status), 디스플레이(Grouping/Ordering/토글/Display Properties)
  - 칼럼: Name/Parent/Tier/Articles/Stubs/Sub/Updated
  - 그룹핑: Tier별/Parent별/Family별 (Family=루트 조상 기준 계보+들여쓰기)
  - WikiCategory에 updatedAt 필드 추가 (store migration v61)
  - 카테고리 미선택 시 All Categories overview 표시
- **PR #103**: 카테고리 Board 뷰 + Notes Board 더블클릭 + 사이드바
  - Tree 모드 제거, List+Board 2모드 체제 전환
  - Board: Tier별 3칼럼(1st/2nd/3rd+), dnd-kit 드래그로 계층 이동
  - Board/List 공용 Columns/Rows/Sub-grouping 드롭다운 (Notes DisplayPanel 벤치마킹)
  - 전 칼럼 정렬 버튼 (7개: name/parent/tier/articles/stubs/sub/updated)
  - Display Properties 토글 → 실제 칼럼 표시/숨김 연동
  - Board Columns 드롭다운 → Tier/Parent/Family 보드 그룹핑 실제 반영
  - 우측 사이드바: All Overview / Category Detail / Batch Actions 3상태
  - Notes Board 더블클릭 → 에디터 열기 (싱글클릭=프리뷰)
  - Tier depth 무한 허용 (제한 해제), Board에서 3rd+ 합침
- **PR #120**: Unified Pipeline Phase 1~4 — Filter/Display/SidePanel 통합 + Design Spine + Discover 추천 엔진
- **PR #121**: Board UX — Trash→Tools, 드래그 선택, 그룹핑 컬럼 숨김, Tags 폐기, 필터 Status shape 아이콘, Mixed status 표시
- **PR #122**: Phase 7 즉시 개선 + 에디터 통합 프로젝트 플랜 수립
- **PR #123**: 에디터 Phase 1A+1B — Shared TipTap config 추출 (4-tier factory: base/note/wiki/template) + Title 노드 통합 (제목/본문 하나의 TipTap 에디터, title-node.ts 커스텀 노드, NoteEditorAdapter 변환 로직, note-editor.tsx title input 제거)
- **PR #125**: Phase 1C+ — Editor Toolbar Redesign + Side Panel 3→4탭 + Arrange Mode
  - Side Panel: Discover→Connections+Activity 분리. 4-tab (Detail/Connections/Activity/Peek). v64 migration
  - New: side-panel-connections.tsx (Connected: backlinks+wiki / Discover: suggestions+tags), side-panel-activity.tsx (Thread/Reflection/History)
  - side-panel-context.tsx 경량화 (~940줄→~400줄): Status/Workflow/Dates/Folder/Label/Tags만 유지
  - Connected/Discover 2-section model (← inbound / → outbound directional arrows)
  - Relations 기능 삭제 (store slice 유지, UI에서 제거)
  - Wiki article detection: note-ref blocks + wikiCollections 양쪽 체크
  - Peek wiki fallback: wiki article ID → title match → note lookup
  - Peek 닫기 3가지: X button, tab toggle, Esc key
  - Breadcrumb + "in Wiki" badge 크기/밝기 증가
  - Peek header breadcrumb 크기/밝기 증가
  - Editor context menu (우클릭)
  - Toolbar: h-14 bar, w-10 buttons, size={22} icons, Phosphor weight="light" (UpNote 스타일)
  - 42 toolbar items: text format, lists, alignment, block inserts, math, settings toggles
  - Arrange Mode: dnd-kit drag-and-drop 모달, 아이템 순서변경/숨기기, settings store persist
  - toolbar-config.ts: 42 IDs, labels, normalizeLayout(), DEFAULT_TOOLBAR_LAYOUT
  - toolbar-primitives.tsx: ToolbarButton/Divider/Group/Spacer 공유 컴포넌트
  - Color palette: 10→16색, 8-column grid layout
  - Custom commands: indent/outdent, removeFormatting, moveListItem up/down
  - InsertMenu: inline style→Tailwind, label 수정, 새 항목 추가
  - 10+ new packages: @tiptap/extension-subscript, superscript 등

## Architecture Redesign v2 — ALL PHASES COMPLETE

**사상**: 팔란티어 × 제텔카스텐. Layer 1(Raw Data) → Layer 2(Ontology) → Layer 3(Wiki) → Layer 4(Insights). LLM/API 사용 안 함.

### 구현 Phase (7단계, 전부 완료)
1. **Foundation** — v41 (wikiStatus), v42 (workspaceMode), 2-level routing ✅
2. **Layout Automation** — WorkspaceMode 3개, auto-collapse ✅
3. **Activity Bar + Top Utility Bar** — 5-space navigation ✅
4. **Sidebar Refactor** — 컨텍스트 반응형, PlotIcons ✅
5. **Breadcrumb** — space > folder > title ✅
6. **Wiki Evolution** — auto-enroll, wikiStatus lifecycle, 초성 인덱스, Graph 노드 형태 ✅
7. **Wiki Collection** — Collection slice (v43), WikiQuote TipTap node, Extract as Note, Collection sidebar ✅

### Key Design Decisions
- **Activity Bar 5-space**: Inbox / Notes / Wiki / Calendar / Graph
- **Wiki 사이드바 = Overview 단일 진입**: stat 카드 클릭으로 드릴다운
- **WikiStatus 2단계**: stub(미완성) → article(완성). Red Link = computed. draft/complete 제거 (v60)
- **위키 강등 = article→stub 1단계**: stub은 바닥(강등 없음, 삭제만)
- **Display = List/Board 2모드**: Table 제거 — List의 Display Properties가 Table 역할 (Linear 철학). List에서 컬럼 켜면 테이블처럼 보임.
- **Graph Health → /graph-insights 페이지로 분리**: 사이드바는 필터/컨트롤 패널
- **Ontology → Graph 네이밍 분리**: Ontology = 엔진, Graph = 시각화
- **Show thread = Show sub-issues 매핑**: 노트앱에서 Linear의 sub-issue → Thread로 대체
- **Order permanent by recency**: 최근 Permanent 승격 노트 우선 정렬
- **Sub-grouping 필수**: 1만개+ 노트 스케일 기준 설계, collapse/expand
- **뷰별 Display 분리**: Notes=풀스펙(2모드 List/Board), Wiki=2모드, Inbox=List only, Graph/Insights=모드 없음
- **Priority 삭제**: 노트앱에서 불필요 — Pin + Labels로 충분. 모든 뷰에서 무의미
- **Grouping collapse/expand**: 그룹 헤더 클릭으로 접기/펴기, chevron 회전 인디케이터
- **Filter 2단계 nested**: Linear식 side-by-side 패널(hover 기반)

## Current Direction (as of 2026-03-28)

### 이번 세션 완료 — Side Panel Connections 리디자인 + Peek 개선 (2026-03-28)
- **Connections 탭 2섹션**: Connected(← inbound: backlinks+wiki) / Discover(→ outbound: suggestions+tags)
- **Relations UI 삭제**: store slice 유지, UI에서만 제거
- **Wiki article detection 개선**: note-ref blocks + wikiCollections 양쪽 체크
- **Peek wiki fallback 체인**: wiki article ID → title match → note lookup
- **Peek 닫기 3가지**: X button, tab toggle, Esc key
- **Breadcrumb + badge 밝기/크기 증가**: "in Wiki" badge, Peek header breadcrumb
- **Editor context menu (우클릭)**: 기본 브라우저 컨텍스트 메뉴 대체

### 이번 세션 완료 — Phase 7 즉시 개선 + 에디터 통합 플랜 (2026-03-27)
- **StatusDropdown 추가**: 플로팅바에 일괄 status 변경 드롭다운. 선택된 전체 노트 status 한 번에 변경
- **Status badges per-status**: 플로팅바에서 선택된 노트의 status별 뱃지 표시 + 클릭 시 해당 노트 목록
- **Trash 버튼 독립 배치**: renderWorkflowButtons() 밖으로 이동, 항상 표시
- **Priority 필터 완전 제거**: filter-bar.tsx에서 Priority 관련 코드 전체 삭제
- **GitMerge 버튼 색상 수정**: 투명→bg-accent, 다크 테마에서 보임
- **빈 노트 자동 삭제**: openNote() 시 이전 노트가 제목+내용 비어있으면 자동 삭제
- **리스트 우측 컬럼 폰트/아이콘 크기 + 색상 밝기 개선**
- **우측 상단 필터/디스플레이/사이드바/+ 버튼 색상 밝기 개선**
- **Board previewNoteId 수정**: SidePanel 열려있을 때 Detail/Discover 정보 표시
- **< > 글로벌 화면 네비게이션**: routeHistory에 space 전환도 기록
- **에디터 통합 프로젝트 7-Phase 플랜 수립**: `.claude/plans/editor-unification.md`
  - Phase 1: 노트 에디터 리디자인 (shared config, title 통합, toolbar, 커스텀 노드)
  - Phase 2: 위키 TextBlock TipTap 전환 (lazy mount)
  - Phase 3: 템플릿 블록 레이아웃 에디터
  - Phase 4: Partial Quote (부분 인용 + 메타데이터 8필드)
  - Phase 5: Merge/Split 풀페이지 (섹션/문단 드래그 재배치)
  - Phase 6: Merge/Split 히스토리 (필터 + Insights)
  - Phase 7: 즉시 버그/개선 (완료)

### Key Design Decisions (추가)
- **WorkspaceMode 삭제**: zen/research 모드 불필요. sidebarCollapsed + detailsOpen 독립 토글만으로 충분
- **우측 사이드바 = Details 패널**: ViewDistributionPanel 삭제 → SmartSidePanel(Details)로 통합. 사이드바 버튼으로만 열림 (Linear 패턴)
- **Calendar = Cross-Space 시간 대시보드**: 독립 공간, Notes 뷰 모드 아님. 모든 엔티티 시간 축 표시
- **Custom Views = 사이드바 Views 섹션**: Linear식 savedView. 각 공간(Notes/Wiki/Graph/Calendar)별 독립
- **Back/Forward = note history + browser history fallback**: note history 없으면 router.back() 호출
- **디자인 라이브러리 13개 도입**: Phosphor/Motion/Sonner/Resizable/Radix Colors/dnd-kit/cmdk/Vaul/Iconoir/Tabler/Remix/React Spring + DESIGN-TOKENS.md에 사용 규칙 문서화
- **Side Panel 4탭**: Detail(메타데이터) + Connections(Connected/Discover 2섹션) + Activity(Thread/Reflection) + Peek(미리보기). Relations UI 삭제. Entity-aware — space에 따라 다른 detail 컴포넌트 렌더
- **Unified Pipeline 완료**: Filter/Display/SidePanel이 ViewConfig 기반으로 space별 주입. OntologyFilterBar 삭제, Wiki category 로컬 state → viewStateByContext 이관
- **Design Spine 통합**: 토큰 위반 일괄 수정 (typography/border/hover/icon/하드코딩). 별도 Phase 없이 구조 통합에 녹임
- **Discover = AI 없는 로컬 추천**: keyword overlap + tag co-occurrence + backlink proximity + folder proximity 4신호
- **그룹핑 컬럼 자동 숨김**: groupBy 필드와 동일한 컬럼은 테이블에서 자동 제외 (중복 제거)
- **Tags 컬럼 폐기**: COLUMN_DEFS, VALID_COLUMNS에서 삭제. 쓸모없다는 판단
- **Trash = Tools 섹션**: Board workbench에서 Workflow→Tools로 이동. Workflow = 순수 상태 전환만
- **Board 드래그 선택**: 빈 공간에서 마우스 드래그로 카드 범위 선택 (data-note-id + wasDragSelectingRef)
- **필터 Status shape 아이콘**: CircleDashed(Inbox), CircleHalf(Capture), CheckCircle(Permanent)
- **Workspace 단순화**: Binary tree → 듀얼 패인. react-resizable-panels. 9개 레거시 파일 삭제
- **위키 = 유저의 확장된 세계관**: 블록 무한 확장 대응 (IDB 분리 + virtuoso + lazy load + sectionIndex)

### 이번 세션 완료 — 카테고리 P0 + 에디터 (2026-03-26)
- **P0 Board Select All 시각 피드백**: 카드에 hover 체크박스 + accent 하이라이트 (Notes Board 패턴 동일)
- **P0 카테고리 Delete Undo**: pushUndo + toast Undo 버튼, 부모참조/아티클참조 전체 복원
- **카테고리 사이드바 → SmartSidePanel 통합**: 내장 CategorySidePanel 280px 제거, SidePanelContext에서 카테고리 모드 감지하여 글로벌 Details 패널에 표시. Notes와 동일 패턴
- **빈 공간 클릭 선택 해제**: activeCategoryId null + expandedCatId 리셋
- **카테고리 폼 에디터**: 더블클릭 → split view (280px 리스트 + 에디터). 이름/설명 인라인 편집 (hover/focus bg 피드백), Parent 드롭다운 변경, Info 카드 (Tier/Parent/Created/Updated)
- **서브카테고리 관리**: "+ New" 인라인 생성, "Move here" 기존 카테고리 이동 (순환참조 방지), Parent Categories 조상 체인 네비게이션
- **디자인 브레인스토밍**: Linear/Plane 수준 폴리시를 위한 "Design Spine" 논의 시작. spacing/sizing/typography 표준화 방향 설정 예정

### 이번 세션 완료 — 레이아웃 리디자인 (2026-03-26)
- **TopUtilityBar 제거 + 사이드바 헤더 리디자인**: Back/Forward/Search를 사이드바 상단으로 이동 (Linear 스타일)
- **사이드바 폭 260→220px**: 컴팩트화
- **사이드바 닫기/열기 Plane식**: ActivityBar 상단 열기 버튼, 다른 space 클릭 시 사이드바 안 열림
- **ViewDistributionPanel → SmartSidePanel(Details)**: 우측 사이드바 = 노트 디테일. NoteDetailPanel 오버레이도 제거. previewNoteId store 필드 추가
- **사이드바 버튼으로만 패널 열기**: 행 클릭 시 자동 패널 열기 제거
- **Priority UI 완전 삭제**: side-panel-context + note-detail-panel에서 제거
- **ViewHeader h-14→h-[52px]**: 컴팩트 헤더, text-sm font-medium
- **컬럼 헤더/버튼 밝기 개선**: text-muted-foreground/50→풀 opacity, compact 오버라이드 제거
- **Tags/Labels/Templates 카운트**: 사이드바 More 섹션에 갯수 표시

### 이번 세션 완료 (2026-03-25)
- **Wiki Merge UX 4가지 수정**: Overview 사이드바 네비게이션 복귀 버그 수정, 하단 드롭다운 위로 열림, New Article 타이틀 직접 입력, 카테고리 사이드바 CRUD
- **카테고리 계층구조 설계 결정**: 태그/라벨은 flat, 위키 카테고리만 트리 (parentId). 카테고리 페이지 = 사이드바 최상위 항목
- **캘린더 플로팅 액션바 삭제 결정**: 불필요
- **silly-mclaren 워크트리 복구**: 세션 크래시 후 커밋+푸시+PR+머지 완료 (PR #112)

### 이번 세션 브레인스토밍 결과 (2026-03-24)
- **글로벌 탭 도입 안 함** — 멀티패널과 역할 충돌. 사이드바가 탭 역할 수행
- **View = 사이드바 프리셋** — Linear View(탭)를 사이드바 Views 섹션으로 구현. FilterRule[] + groupBy + ordering + subGroupBy + visibleColumns + viewMode 저장
- **+ 버튼 통일** — top-utility-bar "New Note" 텍스트 제거 → ViewHeader 우측 `+` 아이콘만
- **커맨드 팔레트 확장 필요** — 현재 6개 → 20+개 컨텍스트 반응형 커맨드 (Note Actions, View, Navigation, Creation)
- **풀페이지 검색 분리** — ⌘K = 검색, ⌘/ = 커맨드 팔레트
- **멀티패널 뷰 타입 확장** — Wiki/Calendar/Graph + 에디터 조합 ("참조하면서 쓰기")
- **Wiki 대시보드 반응형** — Articles/Stubs/Red Links 카드가 탭/필터 역할
- **Linear 디자인 레퍼런스** — linear-design-mirror.tar.gz + SKILL.md 참고자료 저장 완료

### 이번 세션 완료 (2026-03-24)
- **Notes List 리니어식 그리드 통합**: list+table 2개 렌더러 → grid 하나 (~220줄 삭제), 컬럼 헤더 활성화
- **Phosphor 상태 아이콘**: CircleDashed(Inbox)/CircleHalf(Capture)/CheckCircle(Permanent)
- **Tray → Inbox 전체 교체**: 5+ 파일 라벨 통일
- **Capture/Permanent → NotesTable 통합**: 독립 페이지 삭제 (~520줄), TABLE_VIEW_ROUTES 추가
- **Tags/Labels 정상화**: sort 컬럼 헤더, 검색 제거, + 버튼, 아이콘 통일
- **Board 카드 개별 선택**: hover 체크박스 추가
- **isWiki 레거시 완전 폐기**: v59 마이그레이션 (isWiki→false, 빈 스텁 trash, wikiStatus→null)
- **템플릿 UX 개선**: Grid 프리뷰 강화, 생성 후 focus 모드, placeholder 힌트
- **위키 서브섹션 UI**: AddBlockButton에 Subsection 옵션 (level 3/4)
- **폰트/opacity 표준화**: text-xs 통일, opacity /30~/60, uppercase 제거
- Store v58→v59

### 이번 세션 완료 (2026-03-22)
- **Wiki 리디자인**: 파일 분리 (1500줄→6파일), Dashboard 새 설계, List→Linear-style 테이블, ArticleReader 폴리시, 사이드바 스타일링
- **첨부파일 시스템 개선**: data URL → IDB blob 저장 (attachment:// URL 스킴)
- **시드 데이터**: Zettelkasten 튜토리얼 (9 notes, 3 wiki articles), auto-migration v46
- **카테고리 클릭 필터**: 사이드바/Dashboard 카테고리 클릭 → List 모드 + 태그 필터
- **TOC 개선**: + Section/Subsection 인라인 추가, 빈 위키에도 TOC 표시
- **Wiki stub 자동 템플릿**: Overview/Details/See Also 기본 구조
- **+ Add file**: WikiCollectionSidebar에 파일 첨부 버튼 추가
- **Infobox editable**: read mode에서도 편집 가능, 비어있을 때 "Add infobox" 표시
- **Wiki Block Editor 1~3단계 완료**:
  - WikiArticle + WikiBlock 데이터 모델 (별도 엔티티, store v48)
  - createWikiArticlesSlice (10개 액션: CRUD + 블록 조작)
  - WikiBlockRenderer (Section/Text/NoteRef/Image 4종 + AddBlockButton)
  - WikiArticleView (TOC + 블록 목록 + Infobox 사이드바)
  - 블록 인라인 편집 (Section 제목, Text textarea, NoteRef 검색/삽입, Image 업로드)
  - Section 자동 번호 매기기 (TOC ↔ 본문 동기화)
  - 시드 WikiArticle 3개 (Zettelkasten/Permanent Note/Fleeting Note)
  - Note 기반 위키 클릭 시 같은 제목 WikiArticle로 자동 라우팅
  - Section 접기/펼치기 (collapsed → 하위 블록 숨김, store persist)
  - Sources 사이드바 (note-ref/image 블록 자동 추출, 클릭 시 SidePeek 열기)
  - Context Panel: NoteRef "Open" 버튼 → SidePeekPanel로 원본 노트 열기 (편집 + FixedToolbar)

### 이번 세션 완료 (2026-03-23)
- **Smart Side Panel**: NoteInspector + SidePeekPanel → 통합 SmartSidePanel (Context/Peek 두 모드)
  - react-resizable-panels로 리사이즈 가능
  - Details에서 백링크/관련 노트 클릭 → Peek 전환
  - ReferencedInBadges MAX 3개 + "+N more" Popover
- **Workspace 단순화**: Binary tree(14 액션, 9 컴포넌트) → 듀얼 패인(5 액션, 2 컴포넌트)
  - `secondaryNoteId` + `editorTabs` + `activePane` 모델
  - "나란히 열기" 버튼 (Peek → 듀얼 에디터 승격)
  - Store v50→v52 마이그레이션
- **위키 블록 무한 확장 대응**:
  - text block content → IDB 분리 (`plot-wiki-block-bodies`)
  - block metadata → IDB 분리 (`plot-wiki-block-meta`)
  - `WikiSectionIndex` — Zustand에 경량 섹션 인덱스만 보관 (v53)
  - react-virtuoso 가상 스크롤 (>50 블록)
  - 섹션 lazy load (접힌 섹션 렌더 스킵)
- **블록 DnD**: @dnd-kit 기반 드래그 앤 드롭 순서 변경 (edit 모드)
- **Wiki stats 버그 수정**: `notes.isWiki` → `wikiArticles` 기반으로 전환
- **Wiki article 클릭 버그 수정**: Dashboard에서 `onOpenArticle` → `onOpenWikiArticle`

### 이번 세션 완료 (2026-03-24)
- **Linear UI 폴리시 3차**:
  - ViewHeader "+ New note" 중복 제거 → top-utility-bar "+" 아이콘만 남김 (컨텍스트별 라벨: Notes→New Note, Wiki→New Article)
  - top-utility-bar에서 "+ New Note" 텍스트 버튼 제거, ViewHeader `onCreateNew` → "+" 아이콘 버튼으로 통일
  - Calendar onCreateNew 복원
  - Inbox 독립 viewState (Notes와 필터/디스플레이 분리, Status 필터 카테고리 자동 숨김)
  - Wiki Show stubs 토글 실제 동작 연결 (`filteredWikiNotes`에서 `toggles.showStubs` 필터링)
  - Wiki Red Links MiniStat 클릭 → 리스트 모드 전환 + 전용 Red Links 리스트 (제목+참조수+Create 버튼)
  - Wiki 리스트 탭 바에 "Red Links" 탭 추가 (빨간색 강조)
  - Wiki STATUS↔TITLE 간격 수정 (w-[80px] → w-[100px])
  - linear-design-mirror 스킬 생성 + SKILL.md 참고 자료 저장

### 이번 세션 완료 (2026-03-23, 세션 2)
- **글로벌 색상 체계 (`lib/colors.ts`)**: 15개 파일 하드코딩 → 단일 소스. CSS 변수 추가 (`--wiki-complete`, `--priority-medium`)
- **wiki-complete 색상 분리**: permanent 초록 → violet `#8b5cf6`로 분리
- **위키 상태 아이콘 3종**: IconWikiStub(점선 책), IconWikiDraft(연필 책), IconWikiComplete(북마크 책) — Linear 스타일 아이콘+텍스트
- **그래프 nodeType 버그 수정**: WikiArticle이 원(Note)으로 나오던 버그 → 헥사곤으로 정상 표시
- **그래프 색상 수정**: inbox/capture 색상이 뒤바뀐 거 수정 + 위키 상태별 색상(violet/indigo/orange)
- **그래프 범례 재구성**: Node Types → 상태별(Inbox/Capture/Permanent) + Wiki별(Complete/Draft/Stub)
- **태그 기본 OFF + pill 형태**: 그래프에서 태그 노드 기본 숨김, 다이아몬드 → pill 캡슐 형태
- **배경색 차콜 전환**: `#09090b` → `#141417`. 카드/팝오버/보더도 elevation 계층 조정
- **그래프 노드 제한**: MAX 200개(connectionCount 순), LOD 최적화(zoom < 0.3 라벨 숨김, < 0.15 노드 숨김)
- **글로벌 라우트 히스토리**: `table-route.ts`에 히스토리 스택. Back/Forward 버튼이 페이지 간 이동 지원
- **Backspace = 뒤로가기**: 에디터 밖에서 Backspace키로 이전 페이지/노트 이동
- **"Ontology" → "Graph"**: 헤더 타이틀 변경
- **위키 클릭 버그 수정**: openArticle이 WikiArticle.id 직접 인식하도록 수정
- **Node Types 범례 한글 → 영어**: "일반 노트/위키 문서/미완성 위키" 제거

### 이번 세션 완료 (2026-03-23, 세션 3)
- **필터 드롭다운 검색창**: 모든 필터 서브드롭다운에 검색 입력 추가 (Linear식, 임계값 제거)
- **Wiki Merge 스토어**: mergeWikiArticles (A+A), mergeNotesIntoWikiArticle (B: Note[]→WikiArticle)
- **Wiki Assembly Dialog**: Note[] → WikiArticle 조립 UI (FloatingActionBar + Dialog)
- **클러스터 감지 → 자동 제안**: detectClusters() + useClusterSuggestions hook + nudge toast
- **archive 제거**: 노트에서 isArchived 필드 + Show archived 토글 + 관련 로직 전부 삭제
- **위키 리스트 토글 버그 수정**: Show stubs/Show red links 토글 동작 수정
- **위키 클릭 버그 수정**: Dashboard/Overview에서 위키 아티클 클릭 시 열기 동작 수정
- **위키 카테고리 필터 버그 수정**: 드롭다운 열리지 않던 이슈 수정

### 이번 세션 완료 (2026-03-24)
- **List/Board 토글 활성화**: Show trashed / Compact mode / Show card preview 3개 토글 실제 동작 연결
- **Nested Replies (Thread 트리 구조)**: ThreadStep에 parentId 추가 + 트리 렌더링 + Reply 버튼 + store migration v54
- **Compact + Preview 공존**: isCompact 조건 제거하여 두 토글 독립 동작
- **Board 컬럼 헤더 라벨 색상 dot**: Label/Folder 그룹핑 시 컬럼 헤더에 색상 dot 표시
- **그룹 드래그 순서 변경 (List + Board)**: dnd-kit 기반 그룹 헤더/컬럼 드래그로 순서 커스텀. viewState.groupOrder에 persist
- **Collapse All / Expand All 버튼**: ViewHeader 필터 왼쪽에 토글 버튼 추가 (그룹핑 활성일 때만)
- **Breadcrumb/Sidebar 클릭 시 에디터 닫기**: 같은 라우트 router.push 시 IDB persist 덮어쓰기 문제 해결
- **글로벌 Undo/Redo**: Ctrl+Z / Ctrl+Y + UndoManager (linked list + capacity 50) + 에디터 focused 시 비활성
- **Sub-grouping 실제 동작 구현**: group.ts 재귀 그룹핑 + subheader VirtualItem + 들여쓰기된 서브그룹 헤더 렌더링
- **Show card preview 즉시 전환**: 토글 ON/OFF 시 리스트 즉시 반영

### 이번 세션 완료 (2026-03-24, 세션 2)
- **Design Polish Phase 1~5**: Lucide→Phosphor 아이콘 통일(83파일), hardcoded hex→lib/colors.ts 중앙화, 인라인 style→Tailwind 클래스, 비표준 값 정규화
- **NoteRow CSS Grid 컬럼 기반 재설계**: flex→CSS Grid 전환, word count 타이틀 옆 배치, ViewHeader 로컬 검색 제거→글로벌 검색 통합
- **전 뷰 행 구분선 제거**: notes-table, wiki-list, wiki-view, note-list, labels-view, tags-view — "Structure felt, not seen" 철학 전면 적용

### 이번 세션 완료 (2026-03-25)
- **WikiStatus 단순화**: stub/draft/complete → stub/article 2단계. v60 마이그레이션 (draft→stub, complete→article)
- **Import Note 2단계 리디자인**: Step 1(노트 선택) → Step 2(Article/Stub/Red Link/Create new 타겟 선택). WikiArticle 조립 모델 사용
- **Red Links 리스트 통합**: 별도 페이지 제거, All 탭에 Article/Stub/Red Link 동급 표시
- **위키 삭제**: 리스트 ··· 메뉴 + 에디터 사이드바 + 우클릭 컨텍스트 메뉴
- **위키 플로팅 액션바**: 체크박스 선택 + 하단 액션바 (Delete/Promote)
- **createWikiStub → createWikiArticle 전환**: WikilinkDecoration, search-view, wiki-collection-sidebar, wiki-view 4곳
- **아이콘 통일**: Wiki 섹션 헤더 IconWiki, Graph 액티비티바 Phosphor Graph
- **머지 개선**: 높은 status 유지 (article > stub), DRAFT/COMPLETE 라벨 → STUB/ARTICLE
- **Legacy fallback**: IDB의 draft/complete 값을 Stub/Article로 표시 (StatusBadge, WikiStatusDot, wiki-dashboard 등)
- **docs 최신화**: CLAUDE.md, CONTEXT.md, MEMORY.md store v60, WikiStatus 반영
- **Wiki Merge Preview**: 2단계 다이얼로그 (타겟 선택 → 방향 스왑/제목/상태 선택 + 블록 미리보기 + Undo toast). mergeWikiArticles 개선 (infobox 머지, title/status 옵션 파라미터)
- **Wiki Split**: 에디트 모드에서 블록 체크박스 선택 → "Extract" 버튼으로 새 아티클 분리. splitWikiArticle 스토어 액션 신규
- **Wiki Unmerge**: mergedFrom 스냅샷 (WikiMergeSnapshot) + "From: X" 구분선에 Unmerge 버튼 + unmergeWikiArticle 액션
- **섹션 컨텍스트 메뉴**: hover "..." → "Move to new article" / "Delete section"
- **드래그 Split**: TOC 사이드바 하단 드롭존. 에디트 모드에서 섹션 드래그 → 드롭존에 놓으면 새 아티클로 분리
- **위키 리스트 우클릭**: Split wiki + Merge into + Delete (컨텍스트 메뉴 3개)
- **Drag Split UX 폴리시 5개**: 드롭존 시각 피드백 강화, 제목 프롬프트, 모든 블록 타입 드래그 가능, DragOverlay 미리보기, 기존 아티클 드롭 타겟
- **플로팅 드롭존**: TOC 사이드바 드롭존 → 화면 하단 플로팅 바로 이동 (드래그 시에만 출현)
- **플로팅 액션바에 Split 추가**: 단일 선택 시 Promote + Merge + Split + Delete
- **사이드바 Merge/Split 풀페이지**: 좌측 사이드바에 Merge/Split 내비 추가 + 각각 전용 풀페이지 UI (WikiMergePage, WikiSplitPage)
- Store v59→v60

### 이번 세션 완료 (2026-03-25, 세션 2)
- **Wiki 카테고리 시스템 완성**:
  - WikiLayout 프리셋 (`"default" | "encyclopedia"`) — article별 레이아웃 전환 UI
  - 카테고리 전용 페이지 (WikiViewMode `"category"` 추가, WikiCategoryPage 컴포넌트)
  - 사이드바 카테고리: flat 트리 → nav 최상위 항목 ("Categories" = Overview/Merge/Split과 동급)
  - 2-panel 카테고리 트리 에디터: 왼쪽 드래그 가능 트리 + 오른쪽 상세 패널 (breadcrumb, 설명 편집, 하위 카테고리, 소속 아티클)
  - 아티클/스텁 카테고리 할당 UI: 인라인 태그 행 + Add 드롭다운 + 새 카테고리 생성
- **Encyclopedia 레이아웃** (나무위키식):
  - 상단 분류 태그 행, float-right 인포박스, 인라인 collapsible 목차(Contents), 번호 매긴 접기/펼치기 섹션
  - 텍스트 사이즈 밸런스 개선 (h1 3xl, 인포박스 xs/sm, 목차 sm)
- **URL 블록 타입**: WikiBlockType에 'url' 추가. 유튜브 iframe embed + 일반 링크 카드. AddBlockButton에 URL 옵션
- **Merge 카테고리 반영**: handleMerge → mergeMultipleWikiArticles 교체 (categoryIds, blockOrder 전달)
- **Split status 반영**: splitWikiArticle에 status 파라미터 추가 (기존 항상 stub → 선택 가능)
- **Chevron 방향 수정**: Title/Survives 드롭다운 ChevronDown → ChevronUp (위로 열리는 드롭다운)
- Store v60→v61 (WikiArticle.layout 기본값)

### 다음 작업 후보 (우선순위 순)
1. **타이포그래피 밸런스 전체 개선** — 컬럼 헤더/그룹 헤더/아이템 간 폰트 사이즈 균형 (Linear 참고)
2. **에디터 툴바 리디자인 + 제목/본문 통합** — UpNote식, infobox 통합
3. **커맨드 팔레트 확장** — 6개 → 20+개 컨텍스트 반응형 커맨드
4. **풀페이지 검색 분리** — ⌘K=검색, ⌘/=커맨드 팔레트
5. **J/K 리스트 네비게이션** — Linear식

### 완료 확인 (이전 TODO에서 제거)
- ~~Phosphor Icons 전체 마이그레이션~~ → PR #104 완료 (83파일)
- ~~Wiki Block 후속 (드래그/접기/펼치기)~~ → PR #94-95 완료
- ~~위키 카테고리 계층구조~~ → PR #112-113 완료
- ~~캘린더 플로팅 액션바~~ → 불필요 판단으로 삭제 (2026-03-25)

### docs 현황
- `docs/CONTEXT.md` — 현재 상태 + 설계 결정
- `docs/MEMORY.md` — PR 히스토리 + 아키텍처
- `docs/DESIGN-TOKENS.md` — 디자인 토큰 (색상/타이포/스페이싱/아이콘 규칙)
- 완료된 설계 문서 9개 삭제 (architecture-redesign-v2.md, wiki-collection-design.md 등)
