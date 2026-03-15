# Plot Project Memory

## Project Overview
- **Type**: Next.js knowledge management app (Linear UI + Obsidian linking + Anki-lite review)
- **Stack**: Next.js 16, React 19, TypeScript, Zustand 5 (persist w/ IDB), TipTap 3, Tailwind v4
- **Store**: `lib/store/index.ts` — 13-slice Zustand store with versioned migration (currently v35)
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
- **Search**: Worker-based FlexSearch with IDB persistence (fuse.js removed in PR #14)
- **Triage**: UI label "Done" (store action `triageKeep`)
- **Body separation**: Note content in separate IDB (`plot-note-bodies`), meta in Zustand persist
- **Multi-tab editor**: EditorState with panels/tabs/split (v30, legacy — replaced by workspace)
- **Autopilot**: Rule-based automation with conditions/actions on notes (v28)
- **Workspace**: Binary tree layout system (v35) — WorkspaceNode = Leaf | Branch, 5 presets, 9 view types, drag & drop, tab split to new leaf, right-click context menus for view switching, NoteList integrated as workspace leaf (not fixed panel)
- **TipTap Editor**: 24+ extensions — StarterKit, Placeholder (per-block), TaskList/Item, Highlight, Link, Underline, TextAlign, Color, TextStyle, Super/Subscript, Table, ResizableImage, CodeBlockLowlight (lowlight), Typography, Dropcursor, CharacterCount, FontFamily, YouTube, Details/Summary/Content, Mathematics (KaTeX), SlashCommand (custom), Typewriter, CurrentLineHighlight, HashtagSuggestion

## Store Slices (13 total)
notes, workflow, folders, tags, labels, thinking, maps, ui, views, autopilot, templates, editor, workspace

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
- **WIP**: NoteList를 workspace 트리로 통합, 에디터 없을 때 풀 테이블 자동 폴백

## Graph Architecture
- See [graph.md](./graph.md) for graph implementation details

## Current Direction (as of 2026-03-15)
- **REDESIGN PHASE 1 COMPLETE** — see [redesign-plan.md](./redesign-plan.md)
- Core idea: "기능 13개의 80점 → 기능 5개의 98점"
- **Done**: Project/Category/Alerts 삭제, sidebar 정리, NoteRow 리디자인, Detail Panel 축소, "reference" status 제거, Insights view mode, Autopilot, Calendar, Labels, Templates, multi-tab editor, Datalog, Layout 5 Modes, Workspace v35, TipTap 10 plugins, NoteList workspace 통합
- **In progress**: Context menu 정리, workspace 안정화
- **Remaining**: Phosphor Icons + design tokens, surface polish (위키링크, 검색), orphaned code cleanup
- **Deferred**: Phosphor Icons, 디자인 토큰 (typography/spacing/transitions)
- Orphaned in code: KnowledgeMap type + maps slice, SavedView type + views slice, alerts/category/projects routes
