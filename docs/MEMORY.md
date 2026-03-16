# Plot Project Memory

## Project Overview
- **Type**: Next.js knowledge management app (Linear UI + Obsidian linking + Anki-lite review)
- **Stack**: Next.js 16, React 19, TypeScript, Zustand 5 (persist w/ IDB), TipTap 3, Tailwind v4
- **Store**: `lib/store/index.ts` — 16-slice Zustand store with versioned migration (currently v38)
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
- **Workspace**: Binary tree layout system (v35) — WorkspaceNode = Leaf | Branch, 5 presets, 9 view types, drag & drop, tab split to new leaf, right-click context menus for view switching, NoteList integrated as workspace leaf (not fixed panel)
- **Responsive NotesTable**: ONE grid component for all sizes — ResizeObserver + minWidth thresholds on COLUMN_DEFS. CompactNoteList 삭제됨 (모든 곳에서 NotesTable로 교체)
- **TipTap Editor**: 24+ extensions — StarterKit, Placeholder (per-block), TaskList/Item, Highlight, Link, Underline, TextAlign, Color, TextStyle, Super/Subscript, Table, ResizableImage, CodeBlockLowlight (lowlight), Typography, Dropcursor, CharacterCount, FontFamily, YouTube, Details/Summary/Content, Mathematics (KaTeX), SlashCommand (custom), Typewriter, CurrentLineHighlight, HashtagSuggestion

## Store Slices (16 total)
notes, workflow, folders, tags, labels, thinking, maps, ui, views, autopilot, templates, editor, workspace, attachments, ontology, relations

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
- **Phase 4-C**: WIKI View (나무위키 스타일) — WikiInfobox, WikiTOC, redirect, link 색상
- **Phase 4-D**: Context Panel
- **Ontology View**: SVG force-directed graph (d3-force), filter bar, detail panel, workspace 통합

## Current Direction (as of 2026-03-16)

### 완료된 작업 (이번 세션)
- **반응형 NotesTable 통합**: CompactNoteList 제거, ONE grid for all sizes
  - COLUMN_DEFS에 minWidth 추가, ResizeObserver로 컨테이너 너비 측정
  - effectiveVisibleCols로 좁을 때 자동 컬럼 숨김
  - isCompact (< 480px)로 패딩/텍스트 축소
- **ListEditorLayout 개선**: NotesTable 사용 + 리사이즈 핸들 (280-800px)
- **workspace-view-dispatch**: note-list 리프도 NotesTable로 교체
- **사이드바 뷰 전환 수정**: Tags/Labels 클릭 시 해당 뷰가 풀와이드로 정상 렌더

### 뷰 라우팅 구조 (확정)
- **layout.tsx**: Tags, Labels, Templates, Ontology → 항상 풀와이드 렌더 (레이아웃 모드 무관)
- **ListEditorLayout**: Notes 전용 (three-column/split 모드)
- Tags/Labels: 자체 디테일 모드 (태그 이름 클릭 → 풀와이드 노트 목록)

### 설계 결정 (이번 세션)
1. **Activity 삭제 완료** → Insights 뷰에 통합. 현재 Activity는 로그 덤프에 불과, 유용한 인사이트 없음
2. **Insights ≠ Ontology** → 별개 뷰로 유지
   - Insights = 행동 분석 (How) — 편집 빈도, 방치 노트, inbox 체류일, 트렌드
   - Ontology = 구조 시각화 (What) — 노트 간 관계/연결 그래프
   - 접점: 온톨로지 노드 색상을 인사이트 데이터로 레이어링 가능
3. **Wiki = 나무위키식 데이터베이스** (단순 isWiki 플래그 X)
   - 노트 시스템 안에 통합 (Approach A)
   - `[[내부링크]]` 클릭 → 해당 문서로 이동, 없으면 자동 생성
   - 백링크 (이 문서를 참조하는 문서들)
   - 목차 자동생성 (헤딩 기반 TOC)
   - 에디터는 같은 TipTap, 위키 모드일 때 기능 확장
   - Obsidian/Logseq 방식

### 향후 작업 순서 (최신)
1. ~~Activity 삭제~~ ✅ 완료
2. ~~Thread~~ ✅ 이미 구현됨 (thinking slice + ThreadPanel)
3. ~~읽기/편집 뷰모드 토글~~ ✅ 이미 구현됨 (Ctrl+Shift+E in note-editor.tsx)
4. **Relations** (refutes/extends/related, 수동+자동 통합)
5. **Wiki 리빌드** — 나무위키식 (내부링크 + 백링크 + TOC + 읽기모드 기본)
6. **Reflections** (시간축, 쌓임만 가능한 회고)
7. **Insights 뷰** (Activity 대체, 행동 분석 대시보드)
8. **Ontology View 고도화** (Relations 구현 후)

### Deferred
- Phosphor Icons, 디자인 토큰 (typography/spacing/transitions)
- Orphaned store data: KnowledgeMap type + maps slice, SavedView type + views slice, legacy editor slice
