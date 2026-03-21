# Plot Project Memory

## Project Overview
- **Type**: Next.js knowledge management app (Linear UI + Obsidian linking + Anki-lite review)
- **Stack**: Next.js 16, React 19, TypeScript, Zustand 5 (persist w/ IDB), TipTap 3, Tailwind v4
- **Store**: `lib/store/index.ts` — 17-slice Zustand store with versioned migration (currently v43)
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
- **Workspace**: Binary tree layout (v35) — WorkspaceNode = Leaf | Branch, WorkspaceMode 3개 (default/zen/research)
- **Responsive NotesTable**: ONE grid for all sizes — ResizeObserver + minWidth thresholds
- **TipTap Editor**: 25+ extensions including SlashCommand, HashtagSuggestion, WikilinkSuggestion, Mathematics, WikiQuoteExtension
- **2-Level Routing**: `activeSpace` (inbox/notes/wiki/ontology/calendar) + `activeRoute`, `inferSpace()` 하위호환
- **PlotIcons**: 28 custom SVG icon components in `components/plot-icons.tsx` — Lucide 대체
- **Wiki Collection**: `wikiCollections: Record<string, WikiCollectionItem[]>` — per-wiki-note staging area for related material

## Store Slices (17 total)
notes, workflow, folders, tags, labels, thread, maps, relations, ui, autopilot, templates, editor, workspace, attachments, ontology, reflections, wiki-collections

## Completed PRs (recent)
- **PR #80**: Wiki system + Side Peek + soft-delete trash
- **PR #81**: 위키링크 UX 통합 — `[[` 하나로 통합
- **PR #84**: Architecture Redesign v2 Phase 1~5 완료
- **PR #85**: Phase 6 Wiki Evolution + 후속 작업 — auto-enroll, korean-utils, Graph 노드 형태, Wiki Overview 재구조, Calendar 승격, 위키 강등, Display 정리
- **PR #86**: Phase 7 Wiki Collection + Graph Insights + docs 정리
- **PR #87** (WIP): Filter & Display 시스템 — FilterPanel(2단계 nested), DisplayPanel(3모드 List/Board/Table), view-configs(5뷰별), ViewState 확장(subGroupBy, showThread, orderPermanentByRecency)

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
- **위키 강등 = 라이프사이클 역순**: complete→draft→stub, stub은 바닥(강등 없음, 삭제만)
- **Display = List/Board/Table 3모드**: List=Linear식 깔끔, Board=칸반, Table=스프레드시트. Notion 검증 패턴.
- **Graph Health → /graph-insights 페이지로 분리**: 사이드바는 필터/컨트롤 패널
- **Ontology → Graph 네이밍 분리**: Ontology = 엔진, Graph = 시각화
- **Show thread = Show sub-issues 매핑**: 노트앱에서 Linear의 sub-issue → Thread로 대체
- **Order permanent by recency**: 최근 Permanent 승격 노트 우선 정렬
- **Sub-grouping 필수**: 1만개+ 노트 스케일 기준 설계, collapse/expand
- **뷰별 Display 분리**: Notes=풀스펙(3모드), Wiki=3모드, Inbox=List only, Graph/Insights=모드 없음
- **Filter 2단계 nested**: Linear식 side-by-side 패널(hover 기반)

## Current Direction (as of 2026-03-21)

### 다음 작업 후보 (우선순위 순)
1. **List 뷰 Linear식 렌더링** — `notes-table.tsx`에서 viewMode=list일 때 dot+제목+칩+시간 깔끔한 리스트 (현재 List=Table 동일 렌더링 문제)
2. **Board 드래그&드롭** — 칸반 카드 드래그로 status 변경 (dnd-kit 이미 있음)
3. **Grouping/SubGrouping 실제 연동** — Display에서 변경 시 테이블/보드 렌더링에 반영
4. **사이드바 목업 매칭** — 필터 인프라 완성 후 Graph/Wiki/Inbox 사이드바를 목업에 맞추기
3. **Phase 4-D: Context Panel** (보류) — 기존 NoteDetailPanel 진화, 급하지 않음
4. **커스텀 뷰 시스템** — 유저가 필터 조합으로 뷰 저장
5. **Settings always-mounted**
6. **Phosphor Icons 마이그레이션**

### docs 현황
- `docs/CONTEXT.md` — 현재 상태 + 설계 결정
- `docs/MEMORY.md` — PR 히스토리 + 아키텍처
- `docs/DESIGN-TOKENS.md` — 디자인 토큰 (색상/타이포/스페이싱/아이콘 규칙)
- 완료된 설계 문서 9개 삭제 (architecture-redesign-v2.md, wiki-collection-design.md 등)
