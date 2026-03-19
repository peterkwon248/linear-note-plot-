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

### 핵심 설계 결정
- **Insights ≠ Ontology** → 별개 뷰로 유지
- **Wiki = Plot 제텔카스텐의 출력물 중 하나** — 특별 취급 X, 기존 노트/태그/온톨로지 인프라 재활용
- **위키 = 내가 정리한 신뢰할 수 있는 참고자료** — 다른 글 쓸 때 내부 참조
- **`[[` 통합** — 노트/위키 구분 없이 하나로 검색, 대상이 타입 결정
- **Side Peek** — 위키링크 클릭 → 우측 패널 슬라이드 (레이아웃 모드 안 바뀜)
- **소프트 삭제** — 태그/라벨/템플릿 삭제 시 노트 연결 유지, 복구 가능

### 향후 작업 순서

#### Tier 1: Wiki 고도화 (Phase 4-C 완성) ✅ DONE
1. ~~Red/Blue 링크 색상 분기~~ ✅
2. ~~빨간 링크 클릭 → 위키 자동 생성~~ ✅
3. ~~사이드바 TOC~~ ✅
4. ~~위키 읽기 타이포그래피~~ ✅
5. ~~하단 분류 표시~~ ✅

#### Tier 2: 기존 기능 마무리 ✅ DONE
6. ~~Reflections~~ ✅ — append-only 회고 패널, 타임라인 UI, reflection_added 이벤트
7. ~~Insights 뷰 고도화~~ ✅ — Activity 대시보드 + Health 이슈 통합
8. ~~Ontology View 고도화~~ ✅ — Canvas 미니맵, 위키 노드 배지(이중링+W), 라벨 기반 클러스터링(forceX/Y + convex hull)

#### Tier 3: 디자인 폴리시 ✅ DONE
9. ~~디자인 토큰 통일~~ ✅ (PR #68)
10. ~~고아 코드 정리~~ ✅ (PR #68)
11. ~~뷰 필터/디스플레이~~ ✅ (PR #71)
12. ~~레이아웃 스위처 사이드바 이동~~ ✅ (PR #71)

#### 완료된 기능 (docs 미반영이었던 것)
- ~~Thread (ThinkingChain → thread rename + ThreadPanel)~~ ✅ — thinking slice → thread slice, components/editor/thread-panel.tsx
- ~~읽기/편집 뷰모드 토글~~ ✅ — isReadMode state + Ctrl+Shift+E in note-editor.tsx

#### Tier 4: 사이드바 재구성 + 위키 고도화 + 검색 (진행 중)
- ✅ Wiki 사이드바 섹션 추가 (WikiView, Articles + Red Links)
- ✅ LayoutMode "list" 추가 + Back 네비게이션 개선
- ✅ 사이드바/위키 재설계 브레인스토밍 + 설계 문서 (docs/sidebar-wiki-redesign.md)
- ✅ Linear식 풀페이지 SearchView (PR #78) — 노트+태그+라벨+템플릿+폴더 검색, Cmd+K/사이드바 연결
- ✅ Wiki ViewHeader 전환 + 버튼 bg-accent 통일
- ✅ ViewHeader 드롭다운 자동완성 (로컬 검색 + 노트 드롭다운)
- ✅ SearchDialog 엔티티 검색 (태그/라벨/템플릿/폴더)
- TODO: SearchDialog 모달 축소 (커맨드/링크 모드만 유지)
- TODO: 사이드바 재구성 (Views/Folders/Tools)
- TODO: 위키 수집함 + 자동 배치 블록 구조
- TODO: 커스텀 뷰 시스템
- TODO: Filter/Display Layout 통합

#### 다음 작업 (Deferred에서 승격 가능)
- Phase 4-D: Context Panel
- Phosphor Icons 적용
- WIKI 초성 검색 (ㄱㄴㄷ 인덱싱)
- Settings always-mounted
