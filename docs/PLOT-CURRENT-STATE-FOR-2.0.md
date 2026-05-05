# Plot 현재 상태 — Plot 2.0 진화를 위한 종합 매핑

> 작성일: 2026-05-06
> 목적: designer-high agent의 목업 제작 입력 자료
> 자유도: 데이터 모델 변경 가능 (사용자 합의)
> 출처: explore-high agent 코드베이스 정독 결과

---

## 0. Executive Summary

Plot은 **22개 store slice**, **8개 first-class entity** (Note / Wiki / Folder / Tag / Label / Sticker / Reference / Template), **6개 activity space** (home / notes / wiki / calendar / ontology / library), **현재 store version v111**, **17개 ViewContextKey**, **7개 ViewMode**를 가진 Linear/Reflect/Notion-tier knowledge management 앱이다.

**Plot 2.0 핵심 진화 5가지**:
1. **분류 체계 4-system → 3-system 재정렬** (Label → Type, Category → Type, Sticker → Bundle, Tag 유지)
2. **Detail Panel 강화** (통계 차트 + 미니 그래프 + Activity timeline)
3. **Focus Mode 시스템** (Default / Focus / Zen / Compact)
4. **Books 엔티티 신규** (cross-entity ordered sequence)
5. **Timeline View 신규** (`noteEvents` 기반 ViewMode 추가)

**전체 아키텍처는 단단하다**. 진화의 80%는 표면 강화, 20%는 새 layer 추가로 가능.

---

## 1. Entity 모델 — 정확한 shape (lib/types.ts)

### 1.1. Note (lib/types.ts:332-380)
```ts
interface Note {
  id, title, content: string
  contentJson: Record<string, unknown> | null  // body는 IDB로 분리 (plot-note-bodies)
  folderIds: string[]                          // v107: N:M
  tags: string[]
  labelId: string | null                       // 1:1 single
  status: NoteStatus                           // "inbox" | "capture" | "permanent"
  priority: NotePriority                       // none/urgent/high/medium/low
  reads: number; pinned, trashed: boolean
  createdAt, updatedAt: string
  triageStatus: TriageStatus
  reviewAt, summary, source, promotedAt, lastTouchedAt, snoozeCount, trashedAt, parentNoteId
  noteType: NoteType                           // "note" | "wiki"
  aliases: string[]
  wikiInfobox: WikiInfoboxEntry[]
  referenceIds: string[]
  preview: string                              // ~120 chars precomputed
  linksOut: string[]                           // [[wiki-link]] targets
}
```
**🔄 Plot 2.0**: `labelId` → `typeId` rename (데이터 그대로). 영향: lib/store/slices/notes.ts:23-28 ("Memo" 자동 라벨), property-chips.tsx:142, components/note-fields.tsx (LabelDropdown).

### 1.2. WikiArticle (lib/types.ts:271-307)
```ts
interface WikiArticle {
  id, title; aliases: string[]
  infobox: WikiInfoboxEntry[]
  infoboxHeaderColor?, infoboxPreset?           // 11종 프리셋
  blocks: WikiBlock[]                           // IDB 분리
  sectionIndex: WikiSectionIndex[]              // light persist
  tags: string[]; categoryIds?, folderIds: string[]
  layout?: WikiLayout                           // "default" | "encyclopedia"
  fontSize?, fontScales?, contentAlign?
  linksOut?, referenceIds?, mergeHistory?
  parentArticleId?, pinned?, reads?
  createdAt, updatedAt
}
```

### 1.3. WikiBlock (lib/types.ts:153-240) — 9가지 타입
`section | text | note-ref | image | table | url | navbox | nav | banner`

### 1.4. Folder (lib/types.ts:389-412)
```ts
interface Folder {
  id, name; color: string | null               // v109 opt-in
  parentId, lastAccessedAt, pinned, pinnedOrder
  createdAt; kind: "note" | "wiki"             // v107 type-strict
}
```

### 1.5. Tag (lib/types.ts:414-425)
```ts
interface Tag { id, name; color: string | null; trashed?, trashedAt? }
```
**🔄 Plot 2.0**: 그대로 유지. 사이드바 인라인 색 dot 추가.

### 1.6. Label (lib/types.ts:446-452)
```ts
interface Label { id, name, color: string; trashed?, trashedAt? }
```
**🔄 Plot 2.0**: **Type rename 후보 #1** — Note 풀 Type. emoji/icon 필드 추가 검토:
```ts
icon?: { type: "emoji" | "custom"; value: string }
```

### 1.7. Sticker (lib/types.ts:482-508)
```ts
interface Sticker {
  id, name, color: string                      // non-nullable
  members: EntityRef[]                         // 옵션 D2 정참조 단일
  trashed?, trashedAt?, createdAt
}
type EntityKind = "note"|"wiki"|"tag"|"label"|"category"|"file"|"reference"
interface EntityRef { kind: EntityKind, id: string }
```
**🔄 Plot 2.0**: **Bundle rename**. 데이터 그대로.

### 1.8. WikiCategory (lib/types.ts:78-86) — DAG
```ts
interface WikiCategory {
  id, name; parentIds: string[]                // 다중 부모 = DAG
  description?; color: string                   // graph hull
  createdAt, updatedAt
}
```
**🔄 Plot 2.0**: **Wiki-pool Type rename**. DAG 유지.

### 1.9. NoteTemplate (lib/types.ts:563-589) — v108 slim
```ts
interface NoteTemplate {
  id, name; title, content                     // {date} {time} placeholder
  contentJson; labelId, tags, folderId
  pinned; trashed?, trashedAt?, createdAt, updatedAt
}
```

### 1.10. NoteEvent (lib/types.ts:628-634) + 26 NoteEventType
`created/updated/opened/promoted/trashed/untrashed/triage_keep|snooze|trash/link_added|removed/thread_*/label_changed/srs_reviewed/autopilot_applied/relation_*/alias_changed/wiki_converted/attachment_*/reflection_added/split`

**Bounded MAX_EVENTS_PER_NOTE=1000**. Timeline View 데이터 source.

---

## 2. Store Architecture (lib/store/)

### 2.1. 22 slices

| Slice | 책임 | Plot 2.0 변화 |
|---|---|---|
| notes | Note CRUD + 자동 "Memo" 라벨 | labelId → typeId rename |
| workflow | triage / promote / SRS | 그대로 |
| folders | type-strict CRUD + N:M action | 그대로 |
| tags | tag CRUD, opt-in color | 그대로 (사이드바 인라인) |
| labels | label CRUD | **Type rename 핵심** |
| stickers | members[] 정참조 | **Bundle rename** |
| thinking | Thread (legacy) | 폐기 가능 |
| maps | srsStateByNoteId, backlinksIndex | 그대로 |
| ui | sidePanelOpen, sidebarCollapsed, listPaneWidth | **Focus Mode 도입 위치** |
| autopilot | rules + log | 그대로 |
| templates | NoteTemplate CRUD | 그대로 |
| relations | typed Relation (5종) | 그대로 |
| editor | EditorState (panels, splitMode) | 그대로 |
| workspace | secondaryNoteId, dual-pane | 그대로 |
| attachments | Attachment CRUD | 그대로 |
| ontology | coOccurrences, suggestions, positions | 그대로 |
| wiki-collections | per-wiki staging | 그대로 |
| saved-views | SavedView CRUD | 그대로 |
| wiki-articles | block CRUD, merge/split, infobox | 그대로 |
| wiki-categories | DAG categories | **Type rename (wiki pool)** |
| references | Reference CRUD | 그대로 |
| global-bookmarks | bookmark CRUD | 그대로 |
| comments | block-anchored comments | 그대로 |

### 2.2. Persist + Migrate
- **현재 version v111** (lib/store/migrate.ts:1671-1683)
- **IDB 분리**: plot-note-bodies, plot-wiki-block-meta, plot-wiki-block-bodies
- **마이그레이션 history**: v95 → v111 (모두 idempotent)
- **PlotState 핵심 필드** (lib/store/types.ts):
  - `editorState`, `sidePanelMode`, `sidePanelContext`
  - `secondaryNoteId, secondaryEntityContext, secondaryHistory`
  - `viewStateByContext: Record<ViewContextKey, ViewState>`
  - `navigationHistory[], navigationIndex`

---

## 3. UI 구조

### 3.1. Activity Bar (components/activity-bar.tsx, 164 lines, w-11 = 44px)

**6개 space NavLink**:
| Space | Route | Icon | SPACE_COLORS hex |
|---|---|---|---|
| home | /home | IconHome | #5e6ad2 Indigo |
| notes | /notes | IconNotes | #06b6d4 Cyan |
| wiki | /wiki | BookOpen | #8b5cf6 Violet |
| calendar | /calendar | IconCalendar | #ec4899 Pink |
| ontology | /ontology | Graph | #0f766e Teal-700 |
| library | /library | Books | #b45309 Amber-700 |

**구조**: w-11, pt-2, border-r, h-9 w-9 button + **4px left active indicator** (SPACE_COLOR).
- 사이드바 collapse 시 SidebarSimple 토글 (top, sidebarCollapsed=true 일 때만)
- Tier 2: 하단 ThemeToggle

**🔄 Plot 2.0**:
- **Activity Bar collapse 추가** 필요 (현재 없음). new state `activityBarCollapsed`.
- **새 entity (Books) 추가** 시 SPACES 배열 + ActivitySpace union type 확장.

### 3.2. Sidebar (components/linear-sidebar.tsx, 1638 lines, default 220px)

**Header**: RecentlyViewed + Back/Forward + Search (⌘K) + Close (collapse).

#### Notes context (lines 800-1035)
1. **Status section**: All Notes / Inbox / Capture / Permanent / Pinned
2. **Views section** (renderViewsSection)
3. **Folders section** (kind="note", sortFolders + collapseSplit 30일)
4. **More section**: Labels / Templates / Insights (Stickers 의도적 제외)
5. **Pinned section** (조건부)
6. **Recent section** (조건부, navigationHistory)

#### Wiki context (lines 1038-1278)
1. Overview / Merge / Split / Categories
2. Views / Folders (kind="wiki") / Pinned / Recent

#### Calendar context (lines 1281-1359)
1. Calendar / Todos
2. Today / Upcoming / Views

#### Ontology context (lines 1362-1554)
1. Graph / Insights / Dashboard (3 tabs)
2. Views
3. **Stats section**: Notes/Wiki/Orphans%/Untagged%/Wiki coverage/Most linked/total edges

#### Library context (lines 1557-1599)
1. Overview / References / Tags / Files / **Stickers** (5 NavLink)

#### Home context (lines 1604-1616)
1. Inbox NavLink만

**Footer**: Settings + Trash

**🔄 Plot 2.0**:
- 사이드바 Tags 섹션 인라인 색 dot 추가 (More section만 변경)
- Books 신규 추가는 새 context 분기

### 3.3. Side Panel (components/side-panel/smart-side-panel.tsx)

**4-tab system**:
| Tab | Component | Source |
|---|---|---|
| Detail | SidePanelDetail | entity-aware delegate |
| Connections | SidePanelConnections | backlinks + linksOut + Discover |
| Activity | SidePanelActivity | Comments + ActivityTimeline (noteEvents) |
| Bookmarks | SidePanelBookmarks | globalBookmarks |

**Entity-aware Detail delegate**:
- ontology → GraphDetailPlaceholder
- wiki → WikiArticleDetailPanel
- reference → ReferenceDetailPanel
- template → TemplateDetailPanel
- 기본 → SidePanelContext (note 전용)

**SidePanelContext** (562 lines, note 전용): Status/Workflow/Dates/Status/Folders/Label/Tags/Outline/Properties/Actions/Attachments

**🔄 Plot 2.0**:
- 통계 차트 + 미니 그래프 추가 — 5번째 tab "Insights" 신설 또는 Detail tab 내부 InspectorSection 추가
- Detail Panel collapse 단축키 ⌘. 추가

### 3.4. Layout 계층
- `--header-height: 52px`
- `--activity-bar-width: 44px`
- `--sidebar-default-width: 220px`
- Editor: max-width 720px, padding-x 48px, padding-y 32px, font-size 15px, line-height 1.75

### 3.5. Routing (lib/table-route.ts)
External store + useSyncExternalStore (Next.js 우회로 즉시 전환):
- `_activeRoute, _activeSpace, _activeFolderId, _activeTagId, _activeLabelId, _activeViewId`
- `_routeHistory[]` (50 cap), routeGoBack/Forward
- Secondary pane: `_secondaryRoute, _secondarySpace` 독립

**Route 분류**:
- TABLE_VIEW_ROUTES (always-mounted notes-table): /notes, /inbox, /capture, /permanent, /pinned, /trash
- VIEW_ROUTES: /home, /labels, /stickers, /templates, /ontology, /insights, /wiki, /search, /calendar, /graph-insights, /todos, /library, /library/references, /library/tags, /library/files
- DEFAULT_ROUTES[ActivitySpace]

---

## 4. View Engine (lib/view-engine/)

### 4.1. ViewContextKey 17개 (types.ts:5-26)
```
all | pinned | inbox | capture | permanent | unlinked | review |
folder | tag | label | trash | savedView |
wiki | wiki-category | graph | calendar | templates |
tags-list | labels-list | query-${string}
```

**🔄 Plot 2.0 신규 후보**: timeline, books, book-list, book

### 4.2. ViewMode union (types.ts:30)
`list | board | grid | insights | calendar | graph | dashboard`

VALID_VIEW_MODES (types.ts:215): `["list", "board", "grid", "insights", "calendar", "graph"]`

**🔄 Plot 2.0**: timeline 추가

### 4.3. SortField (types.ts:32-48)
`updatedAt | createdAt | priority | title | status | links | reads | folder | label | sub | tier | parent | name | noteCount`

### 4.4. GroupBy (types.ts:61-73)
`none | status | priority | date | folder | label | triage | linkCount | tier | parent | family | role | tag | category | connections | sticker`

### 4.5. FilterField (types.ts:78-95)
24개 필드 (생략, types.ts 참조)

### 4.6. ViewState (types.ts:106-138)
```ts
interface ViewState {
  viewMode; sortFields: SortRule[]               // multi-sort max 3
  sortField, sortDirection                       // @deprecated mirror
  groupBy, subGroupBy
  filters: FilterRule[]
  visibleColumns: string[]
  showEmptyGroups
  toggles: Record<string, boolean>               // showArchived, showAlphaIndex
  groupOrder, subGroupOrder
  subGroupSortBy
  hiddenEdgeIds?, hiddenEdgeKinds?, isolatedNodeIds? // graph-only
}
```

### 4.7. CONTEXT_DEFAULTS (defaults.ts:30-55)
각 context별 viewMode + sort + groupBy + visibleColumns + toggles 기본값.

### 4.8. VIEW_CONFIGS (view-configs.tsx:599-610) — 10개
notes, wiki, wiki-category, graph, inbox, insights, calendar, templates, tags-list, labels-list

각 ViewConfig:
- showFilter, showDisplay, showDetailPanel: boolean
- filterCategories: FilterCategory[] (drilldown filters)
- quickFilters: QuickFilter[] (preset combos)
- displayConfig: { supportedModes, orderingOptions, groupingOptions, toggles, properties, boardDefaultGroupBy }

### 4.9. Pipeline (pipeline.ts:17-51) — 5-stage pure function chain
**context → filter → search → sort → group**
- React: `useNotesView` (memo per stage)
- Wiki: 별도 `wiki-list-pipeline.ts`
- Templates: thin fork `useTemplatesView`
- Tags-list / Labels-list: `useTagsView` / `useLabelsView`

---

## 5. 색상 / 디자인 토큰

### 5.1. CSS 변수 (app/globals.css:6-166)

**Light theme**:
- `--background: #fafafa`, `--foreground: #18181b`, `--card: #ffffff`
- `--accent: #4f46e5` (Indigo), `--destructive: #dc2626`
- `--chart-1..5`: #4f46e5 / #0e7490 / #c2410c / #dc2626 / #15803d
- `--wiki-complete: #10b981` (emerald, mirrors Notes-permanent)
- `--priority-medium: #d97706`
- `--sidebar-bg: #fafafa`, `--sidebar-active: rgba(0,0,0,0.05)`

**Dark theme**:
- `--background: #0f0f11`, `--foreground: #f4f4f5`, `--card: #18181b`
- `--accent: #818cf8`
- `--chart-1..5`: #818cf8 / #22d3ee / #fb923c / #f87171 / #4ade80
- `--wiki-complete: #34d399`
- `--sidebar-bg: #141416`

**Tailwind exposure (globals.css:168-233)**:
- `--font-size-2xs: 11px` (text-2xs)
- `--font-size-note: 13px` (text-note)
- `--font-size-ui: 15px` (text-ui)
- `--font-size-title: 28px` (text-title)
- 모든 CSS var → Tailwind class mapping

**Density modes**:
- `[data-density="compact"]` → `--density-py: 4px`
- `[data-density="default"]` → `--density-py: 10px`
- `[data-density="comfortable"]` → `--density-py: 14px`

**Editor**:
- font-size: 15px / line-height: 1.75 / letter-spacing: -0.01em
- h1: 28px, h2: 23px, h3: 19px, h4: 16px, h5: 14.5px, h6: 13px
- block-gap: 0.4em
- max-width: 720px, padding: 48px / 32px

### 5.2. lib/colors.ts — Single source of truth

- **SPACE_COLORS** (16-24): 6 spaces 정확한 hex
- **STATUS_COLORS** (warning/error/success/info)
- **ENTITY_COLORS** (tag/label/folder/bookmark/reference/note/wiki)
- **KNOWLEDGE_INDEX_COLORS** (81-112): 6 cross-cutting entities
- **NOTE_STATUS_HEX** (126-130): inbox=#22d3ee, capture=#f97316, permanent=#22c55e
- **WIKI_STATUS_HEX**: stub=#f97316, article=#10b981
- **PRIORITY_HEX**: none=gray, urgent=red, high=orange, medium=amber, low=indigo
- **TRIAGE_HEX, RELATION_HEX, GRAPH_NODE_HEX, GRAPH_CLUSTER_PALETTE** (8 colors)
- **PRESET_COLORS** (211-230): 18 colors (Tailwind 500 tier)
- **getEntityColor(color: string|null|undefined): string** (line 279) — v109 fallback `STATUS_DOT_FALLBACK = "#6b7280"`

### 5.3. PropertyChip 12 패턴 (components/property-chips.tsx)

**ChipShell 공통**: `h-5 / px-1.5 / gap-1 / text-2xs / font-medium / leading-none / whitespace-nowrap / shrink-0`.
**PropertyChipRow**: flex gap-1 min-w-0, hard cap maxVisible=3, +N MoreChip 자동.

| Chip | Style |
|---|---|
| StatusChip | wraps StatusBadge |
| PriorityChip | wraps PriorityBadge |
| FolderChip | bg ${color}1a, color full, PhFolder icon |
| MultiFolderMarker | bg-secondary/60 muted, "+N" |
| LabelChip | tinted border 1.5px, text+icon |
| TagChip | bg ${color}1a, # prefix |
| LinksChip / WordsChip / ReadsChip | bare (no bg) |
| CategoryChip | optional color |
| UpdatedChip / CreatedChip | bare 70% muted |
| ParentChip / ChildrenChip | secondary bg muted |
| AliasesChip | italic 80% muted |
| PinnedChip | accent color, no bg |
| TagNoteCountChip / LabelNoteCountChip | bare neutral |
| MoreChip | "+N" overflow |

---

## 6. 에디터 / 컨텐츠 (TipTap)

### 6.1. 6-tier system (shared-editor-config.ts:247)
```ts
type EditorTier = "base" | "note" | "wiki" | "template" | "footnote" | "comment"
```

### 6.2. 25+ extensions
StarterKit, Placeholder, TaskList/Item, Highlight, Link, Underline, TextAlign, Color, TextStyle, Sup/Sub, Table family, Typography, Dropcursor, Gapcursor, CharacterCount, FontFamily, Youtube, CodeBlockLowlight, Details/Summary/Content, Mention, Emoji, Audio, **UniqueID** (split 핵심), FileHandler, TableOfContents.

**Custom nodes**: WikilinkNode, WikiEmbedNode, NoteEmbedNode, LinkCardNode, TocBlockNode, CalloutBlockNode, SummaryBlockNode, ColumnsBlockNode/ColumnCellNode, InfoboxBlockNode, BannerBlockNode, ContentBlockNode, AnchorMarkNode, AnchorDividerNode, FootnoteRefExtension, ReferenceLinkNode, QueryBlockNode, AgeMacroNode, DDayMacroNode, InlineMathNode, BlockMathNode.

### 6.3. 본문 분리 패턴
- **Note**: meta는 Zustand, content+contentJson은 IDB `plot-note-bodies`
- **Wiki**: blocks meta는 IDB `plot-wiki-block-meta`, text content는 IDB `plot-wiki-block-bodies`

---

## 7. Ontology / Graph (components/ontology/)

8개 컴포넌트:
- ontology-graph-canvas.tsx — d3-force, hull
- ontology-detail-panel/dashboard-panel/insights-panel
- ontology-tab-bar (3-mode: Graph / Insights / Dashboard)
- node-context-menu, metric-row, ontology-nudge-section

**OntologyFilters**: tagIds[], labelId, status, relationTypes[], showWikilinks, showTagNodes, showNotes, showWiki

**Sticker hull** — graph view에서 cross-entity 시각화. groupBy="sticker" 사용.
**Edge kinds**: wikilink / tag / relation types (related-to/inspired-by/contradicts/extends/depends-on)

**🔄 Plot 2.0**: Sticker → Bundle rename 시 hull color 그대로, label만 변경.

---

## 8. 영구 결정 (반드시 보존)

| 결정 | 위치 |
|---|---|
| **"Gentle by default, powerful when needed"** | docs/MEMORY.md:5 |
| **Note/Wiki 2-entity 영구 분리** | entity 통합 영구 폐기 |
| **노트앱 본질**: 범용 + 제텔카스텐 | user MEMORY.md |
| **색 정책 4사분면**: Label/Sticker 필수 / Folder/Tag opt-in (v109) | docs/MEMORY.md:42-47 |
| **Folder type-strict + N:M (kind="note"|"wiki")** | v107, lib/types.ts:411 |
| **Sticker = cross-everything (옵션 D2 단일 정참조)** | lib/types.ts:482-508 |
| **위키 컬럼 레이아웃 = 컬럼 + 섹션 = 템플릿** (3-layer 폐기) | user MEMORY |
| **다중 기기 sync LOCKED** (Supabase B + E2E + Yjs + Free/$5/$10) | 2026-04-29 |
| **Note split = UniqueID로 가능** (Phase 7) | user MEMORY |
| **Korean communication, casual tone** | CLAUDE.md |
| **Worktree-based development** | CLAUDE.md |
| **Linear-level polish** | CLAUDE.md |
| **LLM/API 미사용 (규칙 + 통계 + 그래프)** | user MEMORY |
| **3-status (Inbox/Capture/Permanent)** | lib/types.ts:1 |
| **TipTap 6-tier** | shared-editor-config.ts:247 |
| **4-Layer Architecture**: Raw Data → Ontology → Wiki → Insights | user MEMORY |
| **Activity Bar 6-space** | user MEMORY |
| **Split View dual-pane PaneContext** | user MEMORY |
| **Library = 6th space (cross-cutting)** | user MEMORY |
| **Expand/Collapse All 나무위키 패턴** | user MEMORY |

---

## 9. 🔄 Plot 2.0 진화 — 변화 매트릭스

### 9.1. 분류 체계 (4-system → 3-system)

| 현재 (v111) | Plot 2.0 | 변경 영향 | 위치 |
|---|---|---|---|
| Label | **Type (note pool, 단일)** | rename + 데이터 그대로 + emoji/icon 추가 검토 | lib/types.ts:446, slices/labels.ts, note-fields.tsx, property-chips.tsx:142, views/labels-view.tsx |
| WikiCategory | **Type (wiki pool, DAG, 다중)** | rename + DAG 유지 | lib/types.ts:78, slices/wiki-categories.ts, wiki-category-page.tsx |
| Tag | **Tag (그대로)** | 변화 없음 (사이드바 인라인 색 dot 표면 추가) | lib/types.ts:414 |
| Sticker | **Bundle (rename)** | rename만 (members[] EntityRef 그대로) | lib/types.ts:482, slices/stickers.ts, views/stickers-view.tsx, ontology hull |

**마이그레이션 step (v112)**:
- 데이터 모델 그대로 유지하면서 string label만 변경 (안전)
- 또는 Type 신규 type 도입 + Label deprecated mark (3-PR 시리즈)
- emoji/icon 필드 추가는 별도 PR (사용자 직접 디자인 진행 중)

**영향 파일 (rename 적용 시)**:
- lib/types.ts (Label type, NoteTemplate.labelId)
- lib/store/slices/{labels,notes}.ts ("Memo" 자동 라벨 → 기본 Type)
- lib/colors.ts (ENTITY_COLORS.label)
- lib/view-engine/types.ts (FilterField "label", SortField "label", GroupBy "label")
- lib/view-engine/{view-configs.tsx,defaults.ts}
- components/note-fields.tsx (LabelDropdown → TypeDropdown)
- components/property-chips.tsx:142-158 (LabelChip)
- components/views/labels-view.tsx → types-view.tsx (route /labels → /types)
- components/linear-sidebar.tsx:967-993 (More section "Labels")
- components/side-panel/side-panel-context.tsx:401-408 (Label inspector)

### 9.2. Detail Panel 강화

**현재** (smart-side-panel.tsx): 4 tabs Detail / Connections / Activity / Bookmarks

**추가할 것**:
- 통계 차트 미니 — Words/Reads/Activity sparkline (noteEvents 활용)
- 미니 그래프 — backlinksIndex + linksOut 시각화
- Activity timeline 확장 — 시간축 zoom, 이벤트 type별 필터

**위치 옵션**:
- A: Detail tab 내부에 새 InspectorSection 추가
- B: 5번째 tab "Insights" 신설
- C: Connections tab 내부에 미니 그래프 추가

### 9.3. Focus Mode 시스템

**새 layer: Layout state**:
```ts
type FocusMode = "default" | "focus" | "zen" | "compact"
```

| Mode | Activity Bar | Sidebar | Side Panel |
|---|---|---|---|
| default | visible | visible | visible (toggleable) |
| focus | hidden | hidden | visible |
| zen | hidden | hidden | hidden (editor only) |
| compact | visible | narrow | visible (narrow) |

**도입 위치**: lib/store/slices/ui.ts 확장 또는 신규 layout.ts

### 9.4. Books 엔티티 신규

**데이터 shape**:
```ts
interface Book {
  id, title; cover?, description?, color: string
  chapters: BookChapter[]
  autoSources?: AutoSource[]                   // 비어있지 않으면 Smart Book
  excludeIds?: string[]
  readingProgress?: { chapterId, offset }
  pinned, trashed?, trashedAt?, createdAt, updatedAt
}
interface BookChapter { kind: "note"|"wiki"; id; order; addedBy: "manual"|"auto"; sourceId? }
interface AutoSource { id, type: "folder"|"category"|"tag"|"label"|"sticker"; targetKind: "note"|"wiki"|"both"; targetId }
```

**Store slice**: 신규 lib/store/slices/books.ts (slice #23)

**위치 제안**:
- Activity Bar 신규 7번째 space `books`
- 또는 Library 안 6번째 NavLink

**Reading view**: components/views/book-reader.tsx (slideshow)
**Graph 통합**: hull (Sticker처럼) + sequence edge
**Wikilink**: `[[Book]]` / `[[Book#Chapter]]`

### 9.5. Timeline View 신규

**ViewMode 확장**: VALID_VIEW_MODES에 `timeline` 추가
**컨텍스트**: 새 ViewContextKey `timeline` 또는 기존 viewMode toggle
**컴포넌트**: components/views/timeline-view.tsx

**Data source**: `noteEvents` (26개 event type)
- group by date (day/week/month bucketing)
- filter by event type
- 시각: vertical scrollable + horizontal entries

### 9.6. 반응형 + 패널 토글

**현재**:
- Sidebar collapse: 있음 (`sidebarCollapsed`, ui.ts)
- Side Panel: `sidePanelOpen` state, 단축키 없음
- **Activity Bar collapse: 없음** (Plot 2.0 신규 추가 필요)

**Plot 2.0 추가**:
- `activityBarCollapsed: boolean` (ui.ts 확장)
- 단축키: ⌘B sidebar / ⌘. side panel / ⌘⇧B activity bar
- 모바일 break point < 768px (Tailwind md) → activity bar/sidebar hidden, hamburger menu

---

## 10. 디자이너에게 알려줄 핵심 정보

### 10.1. 해야 할 것
1. **CSS 변수 그대로 사용** — globals.css의 모든 색/폰트/spacing 변수. hex inline 금지 (lib/colors.ts 외)
2. **Status 색은 NOTE_STATUS_HEX 정확히** — inbox=#22d3ee (cyan), capture=#f97316 (orange), permanent=#22c55e (green)
3. **Wiki status** — stub=#f97316 (orange), article=#10b981 (emerald). 위키 entity 자체 색은 violet #8b5cf6
4. **Chip baseline**: h-5 (20px), text-2xs (11px), font-medium, leading-none, gap-1, px-1.5
5. **PropertyChipRow 하드 캡 3** — overflow → MoreChip "+N"
6. **시드 데이터 정확히 사용**:
   - SEED_FOLDERS=2 (Projects/Daily Log)
   - SEED_TAGS=5 (Knowledge Management/Zettelkasten/Productivity/Reading/Tech)
   - SEED_LABELS=5 (Idea/Research/Meeting/Diary/Memo)
   - SEED_TEMPLATES=13
7. **Activity Bar**: w-11, 4px left indicator, h-4 rounded-full, SPACE_COLOR 정확히
8. **Sidebar 기본 220px**, `--sidebar-default-width` 변수 활용
9. **Editor**: max-width 720px, padding-x 48px, font-size 15px, line-height 1.75, letter-spacing -0.01em (Plot typography 지문)
10. **반응형**: 768/1024/1280/1536 break point 고려

### 10.2. 하지 말아야 할 것
1. 이모지 type 컬럼 모든 row에 강제 X — default empty OK
2. **Tag 색 강제 X** — opt-in, default 회색 (`getEntityColor` fallback)
3. Folder 색 강제 X — Tag와 동일 v109
4. Status 색을 Plot 전체 색감으로 확장 X
5. Note/Wiki 통합 X — 영구 결정
6. Toolbar/header 보라색 강조 X — Plot 정체성 보호
7. Sticker → Bundle rename 시 데이터 모델 변경 X
8. 모든 기능 한 번에 X — 2-4개월 단계별

### 10.3. 데이터 정확도 (시드 기준 카운트)

**활성 카운트 표시 패턴** (linear-sidebar.tsx:391-399):
```ts
inboxCount = filter(n.status==="inbox" && !trashed && triageStatus !== "trashed")
allNotesCount = filter(!trashed)
captureCount = filter(n.status==="capture" && !trashed)
permanentCount = filter(n.status==="permanent" && !trashed)
trashCount = filter(trashed)
wikiCount = filter(n.noteType==="wiki" && !trashed)
```

**자동 생성 라벨**: Note 생성 시 labelId 없으면 "Memo" (color: #f5a623) 자동 부여 (slices/notes.ts:18-28).

### 10.4. 폰트 / Spacing 시스템

```
font-size:
  --font-size-2xs: 11px  (text-2xs)  — tiny labels, count chips
  --font-size-note: 13px (text-note) — note content, secondary text
  --font-size-ui:   15px (text-ui)   — sidebar nav active, section headers
  --font-size-title: 28px (text-title)

editor (지문):
  font-size: 15px / line-height: 1.75 / letter-spacing: -0.01em
  h1: 28px, h2: 23px, h3: 19px, h4: 16px, h5: 14.5px, h6: 13px
  block-gap: 0.4em
  max-width: 720px, padding: 48px / 32px
```

---

## 11. Open Questions (사용자 결정 필요)

1. **Books 엔티티 위치** — Activity Bar 7번째 space (notes/wiki/calendar/ontology/library/**books**)? 또는 Library 안 6번째 NavLink?
2. **Templates 위치 재정렬** — 현재 More section 안. Plot 2.0에서 Activity Bar 승격? Library 이동?
3. **Type rename 시점/방식** — 한 번에? PR 단위? 데이터 그대로 + UI 레이블만 변경? 또는 Type 신규 type 도입?
4. **이모지 vs Custom Icon 전환 시점** — 사용자 직접 디자인 진행 중. 완성 시점에 같이 작업? 또는 emoji prep 후 추후 확장?
5. **Books 색감** — SPACE_COLORS 신규 추가? 어떤 hex?
6. **Focus Mode UI 진입점** — ⌘. 단축키만? 우상단 toggle button? settings?
7. **Timeline View ViewContextKey** — 별도 신규 (`timeline`)? 또는 기존 (`all`)에 viewMode toggle?
8. **Sticker → Bundle rename 사용자 승인** — 데이터 그대로지만 UI 레이블 변경
9. **Detail Panel 통계 차트 위치** — Detail tab 내부 (긴 scroll) vs 5번째 tab "Insights" 신설?
10. **Activity Bar collapse 단축키 + 위치** — 어디에 toggle button? 또는 단축키만?

---

## 핵심 발견 7개 요약

1. **현재 store version v111** — Group C PR-D 진행 중. Plot 2.0 v112+에서 데이터 모델 변경 가능.

2. **View-engine은 17 ViewContextKey + 7 ViewMode + 16 GroupBy + 24 FilterField + 14 SortField** — 매우 단단함. Timeline ViewMode, Books context 추가 비용 작음.

3. **사이드바는 6 context별 분기** (notes/wiki/calendar/ontology/library/home, linear-sidebar.tsx 1638 lines). Tags 인라인 색 dot 추가는 More section만 변경하면 됨.

4. **Plot 2.0 가장 큰 영향 영역: Label → Type rename** — 30+ 위치 영향. 데이터 그대로 유지가 안전.

5. **SmartSidePanel 4-tab 단일 인스턴스**. 통계 차트는 5번째 "Insights" tab 신설 또는 Detail tab 내부 InspectorSection 추가.

6. **Focus Mode 도입은 ui.ts slice 확장** — activityBarCollapsed + focusMode field 추가 + responsive grid template 변경.

7. **Plot은 LLM/API 미사용** (영구 결정) — 모든 추천/insights는 규칙 + 통계 + 그래프 알고리즘. Plot 2.0도 같은 원칙 유지.
