# Plot Project Memory

## Project Overview
- **Type**: Next.js knowledge management app (Linear UI + Obsidian linking + Anki-lite review)
- **Stack**: Next.js 16, React 19, TypeScript, Zustand 5 (persist w/ IDB), TipTap 3, Tailwind v4
- **Store**: `lib/store/index.ts` — 15-slice Zustand store with versioned migration (currently v37)
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
- **Multi-tab editor**: EditorState with panels/tabs/split (v30, legacy — replaced by workspace)
- **Autopilot**: Rule-based automation with conditions/actions on notes (v28)
- **Workspace**: Binary tree layout system (v35) — WorkspaceNode = Leaf | Branch, 5 presets, 9 view types, drag & drop, tab split to new leaf, right-click context menus for view switching, NoteList integrated as workspace leaf (not fixed panel)
- **TipTap Editor**: 24+ extensions — StarterKit, Placeholder (per-block), TaskList/Item, Highlight, Link, Underline, TextAlign, Color, TextStyle, Super/Subscript, Table, ResizableImage, CodeBlockLowlight (lowlight), Typography, Dropcursor, CharacterCount, FontFamily, YouTube, Details/Summary/Content, Mathematics (KaTeX), SlashCommand (custom), Typewriter, CurrentLineHighlight, HashtagSuggestion

## Store Slices (15 total)
notes, workflow, folders, tags, labels, thinking, maps, ui, views, autopilot, templates, editor, workspace, attachments, ontology

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
- **REDESIGN PHASE 1 COMPLETE** — see [redesign-plan.md](./redesign-plan.md)
- Core idea: "기능 13개의 80점 → 기능 5개의 98점"
- **Done**: Project/Category/Alerts 삭제, sidebar 정리, NoteRow 리디자인, Detail Panel 축소, "reference" status 제거, Insights view mode, Autopilot, Calendar, Labels, Templates, multi-tab editor, Datalog, Layout 5 Modes, Workspace v35, TipTap 10 plugins, NoteList workspace 통합, Ontology Engine Phase 4-A/4-B, Ontology Phase 5 Premium Graph
- **Remaining**: Phase 4-C (Wiki View), Phase 4-D (Context Panel), Phosphor Icons + design tokens, surface polish, orphaned code cleanup
- **Deferred**: Phosphor Icons, 디자인 토큰 (typography/spacing/transitions)
- Orphaned in code: KnowledgeMap type + maps slice, SavedView type + views slice, alerts/category/projects routes
