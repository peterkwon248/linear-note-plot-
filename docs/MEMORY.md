# Plot Project Memory

## Project Overview
- **Type**: Next.js knowledge management app (Linear UI + Obsidian linking + Anki-lite review)
- **Stack**: Next.js 16, React 19, TypeScript, Zustand 5 (persist w/ IDB), TipTap 3, Tailwind v4
- **Store**: `lib/store/index.ts` — 16-slice Zustand store with versioned migration (currently v40)
- **Workflow**: Inbox -> Capture -> Permanent (3 statuses only, "reference" removed in v26)

## Architecture Decisions
- See [architecture.md](./architecture.md) for detailed decisions
- See [srs.md](./srs.md) for SRS implementation details

## User Preferences
- Korean communication preferred (casual tone)
- Pragmatic over theoretical — values working code over perfect design
- Prefers simple solutions (YAGNI principle)
- Commit workflow: commit -> push -> PR -> squash merge to main
- Uses ChatGPT for external architecture review, asks Claude Code for implementation opinion
- Worktree-based development (branch per session)
- Design quality is top priority — "Linear 대비 2-3% 부족한 디테일" 해소가 목표
- 범용 노트앱 + 제텔카스텐 (not only one or the other)
- Folders + Tags + Labels. Projects/Categories 삭제 완료

## Key Patterns
- **Separate map pattern**: `srsStateByNoteId`, `viewStateByContext`, `backlinksIndex` — avoid polluting Note type
- **Store migration**: Bump version, add migration block in `migrate()` function
- **Event system**: `noteEvents` with `NoteEventType` union, bounded to MAX_EVENTS_PER_NOTE=1000
- **Attachment IDB**: Binary blob data in separate IDB (`plot-attachments`), metadata in Zustand persist
- **Alias resolution**: BacklinksIndex + graph.ts register note aliases in `titleToId` Map (no-clobber)
- **Search**: Worker-based FlexSearch with IDB persistence (fuse.js removed in PR #14)
- **Triage**: UI label "Done" (store action `triageKeep`)
- **Body separation**: Note content in separate IDB (`plot-note-bodies`), meta in Zustand persist
- **Autopilot**: Rule-based automation with conditions/actions on notes (v28)
- **Workspace**: Binary tree layout system (v35) — WorkspaceNode = Leaf | Branch, 5 presets, 9 view types, drag & drop, tab split to new leaf, right-click context menus for view switching, NoteList integrated as workspace leaf (not fixed panel), "+" dropdown note picker, Ctrl+click=new tab, Pinned/Recent drag to editor
- **Responsive NotesTable**: ONE grid component for all sizes — ResizeObserver + minWidth thresholds on COLUMN_DEFS. CompactNoteList 삭제됨 (모든 곳에서 NotesTable로 교체)
- **TipTap Editor**: 24+ extensions — StarterKit, Placeholder (per-block), TaskList/Item, Highlight, Link, Underline, TextAlign, Color, TextStyle, Super/Subscript, Table, ResizableImage, CodeBlockLowlight (lowlight), Typography, Dropcursor, CharacterCount, FontFamily, YouTube, Details/Summary/Content, Mathematics (KaTeX), SlashCommand (custom), Typewriter, CurrentLineHighlight, HashtagSuggestion

## Store Slices (16 total)
notes, workflow, folders, tags, labels, thread, maps, relations, ui, autopilot, templates, editor, workspace, attachments, ontology, reflections

## Completed PRs
- **PR #14**: noteEvents bounding, fuse.js removal, dead code cleanup
- **PR #15**: SRS engine (fixed-step [1,3,7,14,30,60,120]d, 4-button rating, auto-enroll on promote)
- **PR #16**: SRS bulk enrollment + individual enroll/unenroll toggle
- **PR #18-#25**: Store refactoring (sliced), column fixes, alerts system
- **PR #26**: Documentation (README, AGENTS.md)
- **PR #27**: Phase 2 — Knowledge map force-directed layout, zoom/pan, filters, path highlight
- **PR #35**: Analysis engine, Insights UI, drag select, header checkbox
- **PR #36**: Sidebar redesign (custom LinearSidebar, 4 nav items)
- **PR #37**: Week 1-3 리디자인 — store v23→v25, Project/Category/Alerts 삭제, 사이드바 정리, "reference" 제거 (v26)
- **PR #38**: Insights view as 4th view mode, Autopilot nudges, reference status removal
- **PR #39**: Calendar View, Labels (v27), Autopilot Rules (v28), Templates (v29)
- **PR #40**: Multi-tab editor + split view — EditorState (v30)
- **PR #41**: Datalog — activity history, stats, timeline
- **PR #52**: Layout 5 Modes system
- **PR #53**: Workspace v35 — binary tree layout system, 5 presets, 9 view types, D&D
- **PR #54**: Workspace completion — tab split to new leaf, auto-cleanup, context menus, sidebar D&D fix
- **PR #55**: docs/MEMORY.md added to repo
- **PR #56**: NoteList를 workspace 트리로 통합, 에디터 없을 때 풀 테이블 자동 폴백
- **PR #58**: Ontology Engine Phase 4-A — 데이터 기반 공사 (v36), Ontology View (그래프 시각화)
- **PR #59**: Ontology Engine Phase 4-B + Phase 5 — 위키링크, 공기어, 관계 제안, 프리미엄 그래프 뷰 (v37)
- **PR #60**: 온톨로지 그래프 force 파라미터 조정 — compact 레이아웃
- **PR #62**: 템플릿 시스템 Phase 2 — UpNote 스타일 TipTap 에디터 (v38)
- **PR #63**: 반응형 NotesTable 통합 — CompactNoteList 제거, ResizeObserver 기반 컬럼 숨김
- **PR #64**: dead code cleanup — Activity 삭제 + 고아 파일 22개 + 버그 수정
- **PR #65**: Relations 완성 + Wiki 기초 UI + 헤더 스타일 통일
- **PR #66**: 탭 시스템 강화 — 기존 노트 새 탭 열기
- **PR #67**: Tier 2 완료 + 고아 코드 정리 (-1151줄)
- **PR #68**: Tier 3 디자인 토큰 통일 + Trash UX 개선 + Ctrl+Z 글로벌 Undo
- **PR #69**: Trash 복원 시 Inbox 카운트 안 돌아오는 버그 수정
- **PR #70**: Research 모드 레이아웃 프리셋 시스템 + 패널 UX 개선
- **PR #71**: 뷰 필터/디스플레이 + 레이아웃 스위처 UX 개선 — Tags/Labels/Templates Sort/Filter/Display, LayoutModeSwitcher 사이드바 이동, 리스트 패널 닫기 버그 수정, 기본 시작뷰 inbox
- **PR #72**: docs: CONTEXT.md, MEMORY.md, CLAUDE.md 최신화
- **PR #73**: docs: 코드베이스 검증 후 docs 정확도 수정
- **PR #74**: Wiki 섹션 + List 레이아웃 + Back 네비게이션 — WikiView (Articles/Red Links), LayoutMode "list" 추가, 에디터 Back 버튼 이전 화면 복귀, workspace leaf onClose 전달, 패널 헤더 X 버튼 위치 수정, docs/sidebar-wiki-redesign.md 설계 문서
- **PR #78**: Linear식 풀페이지 SearchView + 글로벌 엔티티 검색 — SearchView (Notes/Tags/Labels/Templates/Folders 탭 검색), Wiki ViewHeader 전환, ViewHeader 드롭다운 자동완성, Templates 버튼 통일, SearchDialog 엔티티 검색, Cmd+K/사이드바 → 풀페이지 검색
- **PR #80**: Wiki system + Side Peek + soft-delete trash — Wiki 홈 대시보드 (나무위키 스타일), WikiView 내부 3단 읽기 레이아웃, Side Peek 패널, SearchView Wiki 탭, Tags/Labels/Templates 소프트 삭제 + Trash 탭 필터
- **PR #81**: 위키링크 UX 통합 — `[[[` 제거 → `[[` 통합, 브래킷 숨김 (font-size:0), 아이콘 클릭 드롭다운 (Peek/Open), Import Note, Side Peek 편집 토글, 사이드바 닫기 버튼, 라인 하이라이트 제거, 자기 자신 필터

## Graph Architecture
- See [graph.md](./graph.md) for graph implementation details

## Ontology Engine
- **Phase 4-A (DONE)**: 데이터 기반 공사 — types, store v36, IDB attachment store, backlinks alias support, graph alias support
  - Types: `WikiInfoboxEntry`, `Attachment`, `CoOccurrence`, `RelationSuggestion`
  - Note 확장: `aliases: string[]`, `wikiInfobox: WikiInfoboxEntry[]`
  - Slices: `attachments` (CRUD + IDB blob), `ontology` (co-occurrence + relation suggestions)
  - Wiki actions: `setNoteAliases`, `setWikiInfobox`, `createWikiStub`, `convertToWiki`, `revertFromWiki`
- **Phase 4-B (DONE)**: 엔진 코어 — WikilinkDecoration, WikilinkSuggestion, Co-occurrence engine, Unlinked Mentions, Relation Suggestions
- **Phase 5 (DONE)**: Ontology Graph Premium Upgrade (v37)
  - Web Worker 레이아웃 (`ontology-layout-worker.ts` + `ontology-layout-client.ts`)
  - 실시간 d3-force 시뮬 + 노드 드래그 (rAF 루프, fx/fy)
  - Bezier 곡선 엣지 + 엣지 라벨 + 평행 엣지 fan-out
  - Ambient Dim 검색 (비매칭 노드/엣지 페이드)
  - 호버 Tooltip (300ms 딜레이, 제목/프리뷰/status/tags)
  - LOD Zoom (줌아웃 시 라벨 숨김) + Viewport Culling
  - Status/Label 기반 노드 컬러, 도트 그리드 배경, 선택 pulse
  - 포지션 영속화 (ontologyPositions in store v37)
  - 미링크 멘션 UI (Ontology Detail Panel)
  - 관계 타입 자동 추론 (inferRelationType heuristic)
- **Phase 4-C (DONE)**: Wiki View 나무위키 스타일
  - Convert/Revert, WikiTOC (좌측 sidebar), WikiInfobox, isWiki filter, aliases, wiki badge
  - Red/Blue 링크 색상 (WikilinkDecoration), 빨간 링크→자동 생성 (createWikiStub)
  - 위키 타이포그래피 (wiki-read-content CSS), 하단 분류 (WikiCategories)
- **Phase 4-D**: Context Panel
- **Ontology View**: SVG force-directed graph (d3-force), filter bar, detail panel, workspace 통합

## Current Direction (as of 2026-03-19)

### Architecture Redesign v2 (확정, 구현 대기)

> 상세 문서: `docs/architecture-redesign-v2.md`

**사상**: 팔란티어 × 제텔카스텐. Layer 1(Raw Data) → Layer 2(Ontology) → Layer 3(Wiki, 표현) → Layer 4(Insights, 분석). LLM/API 사용 안 함.

#### 핵심 설계 결정 (기존 유지 + 신규)
- **Insights ≠ Ontology** → 별개 뷰로 유지
- **`[[` 통합** — 노트/위키 구분 없이 하나로 검색
- **Side Peek** — 위키링크 클릭 → 우측 패널 슬라이드
- **소프트 삭제** — 태그/라벨/템플릿 삭제 시 노트 연결 유지
- **Activity Bar** — Tier 1 (Inbox/Notes/Wiki/Ontology), Settings 하단. Search는 상단 유틸리티 바 (Linear 스타일)
- **2-Level Routing** — `activeSpace` + `activeRoute`, `inferSpace()` 하위호환
- **LayoutMode 삭제** → `WorkspaceMode = "default" | "zen" | "research"` 3개로 수렴. default 모드 auto-collapse
- **Wiki 병렬 라이프사이클** — `status`(inbox/capture/permanent)와 `wikiStatus`(stub/draft/complete) 독립. 어느 시점에서든 위키 진입 가능
- **Wiki 자동 등재** — 신호 기반 (red link refCount>=2, 태그 3+, backlinks>=3). 높은 확신=자동, 낮은 확신=제안. 기존 노트 있으면 convert, 없으면 create stub
- **Breadcrumb** — NoteEditor Back 버튼 → 브레드크럼 (`activeSpace > folder > title`)
- **Inbox = 워크플로우** (필터 아님). NotesTable 상태 탭 제거, FilterBar status 필터로 대체
- **New Note = 액션** (상태 아님). Editor는 항상 noteId를 가짐

#### 구현 Phase (7단계)
1. **Foundation** — v41 (wikiStatus), v42 (workspaceMode), table-route.ts (activeSpace)
2. **Layout Automation** — setWorkspaceMode(), auto-collapse, Cmd+0/1/2
3. **Activity Bar + Top Utility Bar** — activity-bar.tsx, top-utility-bar.tsx
4. **Sidebar Refactor** — 컨텍스트 반응형, Tier 3 섹션, 상태 탭 제거
5. **Breadcrumb** — editor-breadcrumb.tsx, Back 버튼 교체
6. **Wiki Evolution** — 자동 등재 엔진, wikiStatus UI, 초성 인덱스
7. **Wiki Collection** — wiki-collection-design.md Phase A~F

추천 순서: 1→2→3→4→5 (인프라 먼저), 6은 독립적으로 언제든

#### 다음 작업 (Deferred)
- Phase 4-D: Context Panel
- Phosphor Icons 적용
- 커스텀 뷰 시스템 (Phase 4 이후)
- Settings always-mounted
