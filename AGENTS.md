# AGENTS.md — Plot Codebase Guide

Plot is a local-first knowledge management app. No backend. No API calls. All data lives in IndexedDB via Zustand persist.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, `"use client"` where needed)
- **State**: Zustand 5 with custom IDB persist storage
- **Editor**: Tiptap 3 with multi-tab split view
- **UI**: shadcn/ui (Radix UI primitives + Tailwind v4)
- **Testing**: Vitest (`npm run test`)
- **Search**: FlexSearch in a Web Worker
- **Charts**: Recharts
- **Drag & drop**: dnd-kit
- **Virtualization**: @tanstack/react-virtual

---

## Read These Files First

Before making changes, read these in order:

1. `lib/types.ts` — All core types: `Note`, `Folder`, `Tag`, `Label`, `NoteTemplate`, `AutopilotRule`, `NoteEvent`, etc.
2. `lib/store/types.ts` — `PlotState` interface: every state field and every action, plus `EditorTab`, `EditorPanel`, `EditorState`
3. `lib/store/index.ts` — Store composition, persist config, `partialize`, current version (`version: 30`)
4. `lib/store/migrate.ts` — All migration logic (v6→v30); read before touching store shape
5. `lib/view-engine/types.ts` — `ViewState`, `ViewContextKey`, `ViewMode`, `PipelineResult`, sort/group/filter enums

---

## Core Architectural Rules

### 1. Never Persist Computed Data

These are derived at render time and must never be stored in `PlotState`:

| Value | Where it's computed |
|---|---|
| `backlinks` | `useBacklinksIndex()` in `lib/search/use-backlinks-index.ts` |
| `readyScore` / `inboxRank` | `lib/queries/notes.ts` |
| `linksOut` / `preview` | These ARE stored on `Note` as precomputed fields — see below |

### 2. `preview` and `linksOut` Are Precomputed, Not Derived at Render

`Note.preview` (first ~120 chars of plaintext) and `Note.linksOut` (extracted `[[wiki-link]]` targets, lowercased) are computed from content and **stored on the note** for fast list rendering. They are always updated synchronously in `createNote` and `updateNote` via `extractPreview()` / `extractLinksOut()` from `lib/body-helpers.ts`.

Do not use raw `note.content` for link or preview logic in list views — use these precomputed fields.

### 3. Body Separation

Note bodies (`content` + `contentJson`) are stored in a separate IndexedDB database (`plot-note-bodies`) via `lib/note-body-store.ts`. The main Zustand persist store strips them via `partialize`:

```ts
notes: state.notes.map((n) => ({ ...n, content: "", contentJson: null }))
```

Bodies are loaded async at startup by `components/providers/body-provider.tsx` which calls `store._hydrateNoteBodies()`. The app shows a loading screen until hydration completes.

**Consequence**: Never assume `note.content` is populated in list/table views. It's only available after `BodyProvider` completes.

### 4. Every New Store Field Needs Migration

The store version is `30` (in `lib/store/index.ts`). When you add a field to `PlotState`:

1. Add the field to `lib/store/types.ts`
2. Implement the slice logic in `lib/store/slices/{name}.ts`
3. Wire the slice in `lib/store/index.ts`
4. Add migration in `lib/store/migrate.ts` with `?? defaultValue` guard
5. Bump `version` in `lib/store/index.ts`

Always use `?? defaultValue` when reading new fields in migration — Zustand rehydration from IDB can return `undefined` for fields that didn't exist in an older snapshot.

---

## Store Structure

### Slices in `lib/store/slices/`

Each slice is a function `(set, get?, appendEvent?) => sliceObject`. They are spread into the store in `lib/store/index.ts`.

| Slice file | Responsibility |
|---|---|
| `notes.ts` | createNote, updateNote, batchUpdateNotes, deleteNote, duplicateNote, mergeNotes, togglePin, toggleArchive, toggleTrash, touchNote, createChainNote |
| `workflow.ts` | triageKeep, triageSnooze, triageTrash, promoteToPermanent, undoPromote, moveBackToInbox, setReminder, clearReminder, batchSetReminder, all SRS actions |
| `folders.ts` | createFolder, updateFolder, deleteFolder, accessFolder, toggleFolderPin |
| `tags.ts` | createTag, updateTag, deleteTag, addTagToNote, removeTagFromNote |
| `labels.ts` | createLabel, updateLabel, deleteLabel, setNoteLabel |
| `thinking.ts` | startThinkingChain, addThinkingStep, endThinkingChain, addWikiLink, setGraphFocusDepth, setCommandPaletteMode |
| `maps.ts` | createKnowledgeMap, updateKnowledgeMap, deleteKnowledgeMap, addNoteToMap, removeNoteFromMap |
| `ui.ts` | setActiveView, setSelectedNoteId, openNote, search, sidebar, navigation history, setViewState, merge/link picker |
| `views.ts` | createSavedView, updateSavedView, deleteSavedView |
| `autopilot.ts` | autopilot rule CRUD, runAutopilotOnNote, undoAutopilotAction, clearAutopilotLog |
| `templates.ts` | template CRUD, toggleTemplatePin, createNoteFromTemplate |
| `editor.ts` | openNoteInTab, closeTab, closeOtherTabs, setActiveTab, setActivePanel, toggleSplit, moveTabToPanel, togglePinTab, setSplitRatio |

### Helpers in `lib/store/helpers.ts`

- `genId()` — `crypto.randomUUID()`
- `now()` — `new Date().toISOString()`
- `workflowDefaults(status)` — default workflow fields for new notes
- `persistBody(body)` / `removeBody(id)` — fire-and-forget IDB writes
- `createAppendEvent(set)` — returns `appendEvent(noteId, type, meta?)` for audit trail

### Event Log

Every meaningful action calls `appendEvent(noteId, type, meta?)`. This appends to `noteEvents: NoteEvent[]`. Capped at 1000 events per note (oldest trimmed first).

---

## Editor System (v30)

Multi-tab, multi-panel editor with VS Code-style split view.

```ts
EditorState {
  panels: EditorPanel[]      // up to 2 panels
  activePanelId: string
  splitMode: boolean
  splitRatio: number          // 0.2~0.8, default 0.5
}

EditorPanel {
  id: string                  // "panel-left" | "panel-right"
  tabs: EditorTab[]
  activeTabId: string | null
}

EditorTab {
  id: string                  // nanoid
  noteId: string
  isPinned?: boolean
}
```

Key components:
- `components/editor/editor-split-view.tsx` — Split panel layout
- `components/editor/editor-tab-bar.tsx` — Tab bar with pin/close
- `components/editor/editor-panel-container.tsx` — Panel wrapper
- `components/editor/TipTapEditor.tsx` — Core Tiptap rich text editor

---

## Tags & Labels Views

Dedicated full-page views for managing tags and labels, accessible from sidebar NavLinks.

### Tags View (`components/views/tags-view.tsx`)
- Tag list with `#tagname` format, note counts, alphabetical sort
- Comma-separated bulk creation input (`tag1, tag2, tag3`)
- Search filtering
- Tag detail mode: filtered notes list for selected tag
- Multi-select: checkboxes, select-all, drag-to-select, shift+click range, ctrl+click toggle
- Bottom floating action bar for bulk delete (matches `FloatingActionBar` pattern)
- Tags have NO colors in UI

### Labels View (`components/views/labels-view.tsx`)
- Label list with colored dots (`rounded-sm`), note counts
- "New label" creation form with `ColorPickerGrid`
- Inline edit (name + color) via pencil icon
- Label detail mode: filtered notes list for selected label
- Multi-select: checkboxes, select-all, drag-to-select, shift+click range, ctrl+click toggle
- Bottom floating action bar for bulk delete
- Labels HAVE colors (from `PRESET_COLORS`)

### Shared Patterns
- Both use mount-once/keep-alive in `app/(app)/layout.tsx`
- Route pages (`app/(app)/tags/page.tsx`, `app/(app)/labels/page.tsx`) return null
- Selection state: `checkedTags`/`checkedLabels` (Set), `dragRect`, `lastClickedRef`
- ESC clears selection, Ctrl+A selects all
- `ColorPickerGrid` component in `components/color-picker-grid.tsx` (10 preset colors, 5x2 grid)

---

## View Engine Pipeline

Pipeline stages in order: **context-filter → filter → search → sort → group**

Never bypass this pipeline. Each stage is a pure function in `lib/view-engine/`.

| Stage | File | Input |
|---|---|---|
| context-filter | `context-filter.ts` | `applyContext(notes, contextKey, extras)` |
| filter | `filter.ts` | `applyFilters(notes, rules)` |
| search | `search.ts` | `applySearch(notes, query)` |
| sort | `sort.ts` | `applySort(notes, field, direction, backlinksMap?)` |
| group | `group.ts` | `applyGrouping(notes, groupBy)` |

In React components, use `useNotesView(contextKey, extras?)` from `lib/view-engine/use-notes-view.ts`. It memoizes each stage independently so changing sort doesn't re-run filtering.

`PipelineExtras` carries `backlinksMap`, `searchQuery`, `folderId`, `tagId`, `labelId` — route-specific data the context filter needs.

### ViewState per Context

Each route has its own `ViewState` stored under `viewStateByContext[contextKey]`. Valid context keys:

```
"all" | "pinned" | "inbox" | "capture" | "permanent" | "unlinked" | "review" | "archive" | "folder" | "tag" | "label" | "trash" | "savedView"
```

### View Modes

```ts
ViewMode = "list" | "table" | "board" | "insights" | "calendar"
```

### Valid Enums (for migration normalization)

```ts
VALID_SORT_FIELDS: ["updatedAt", "createdAt", "priority", "title", "status", "links", "reads", "folder", "label"]
VALID_GROUP_BY: ["none", "status", "priority", "date", "folder", "label", "triage", "linkCount"]
VALID_COLUMNS: ["title", "status", "folder", "links", "reads", "priority", "createdAt", "updatedAt"]
```

---

## Domain Routes

| Route | Context key | Status filter | Key actions |
|---|---|---|---|
| `/inbox` | `"inbox"` | `status === "inbox"`, untriaged or snoozed-due | triageKeep, triageSnooze, triageTrash |
| `/capture` | `"capture"` | `status === "capture"` | promoteToPermanent, readyScore |
| `/permanent` | `"permanent"` | `status === "permanent"` | enrollSRS, reviewSRS, unenrollSRS |
| `/notes` | `"all"` | all non-trashed notes | full view engine |
| `/review` | `"review"` | aggregated queue | `getReviewQueue()` from `lib/queries/notes.ts` |
| `/activity` | n/a | n/a | Datalog activity feed/stats/timeline |
| `/tags` | n/a | n/a | Tag list, bulk create (#tag1,tag2), drag select, detail view |
| `/labels` | n/a | n/a | Label list with colors, CRUD, drag select, detail view |
| `/trash` | `"trash"` | `trashed === true` | deleteNote (permanent) |

### Note Status Lifecycle

```
inbox → (triageKeep) → capture → (promoteToPermanent) → permanent
inbox → (triageSnooze) → inbox (snoozed)
inbox → (triageTrash) → inbox (trashed, hidden)
permanent → (undoPromote) → capture
capture/permanent → (moveBackToInbox) → inbox
```

`promoteToPermanent` automatically calls `enrollSRS`.

---

## Autopilot System

Rule-based automation engine. Rules evaluate conditions on notes and apply actions automatically.

- Engine: `lib/autopilot/engine.ts` — `evaluateRule()`, `runAutopilotOnNote()`
- Conditions: `lib/autopilot/conditions.ts` — field/operator/value matching
- Defaults: `lib/autopilot/defaults.ts` — `DEFAULT_AUTOPILOT_RULES`
- Types: `lib/autopilot/types.ts` — `AutopilotContext`, `AutopilotEvalResult`, `AutopilotRunResult`

Condition fields: `status`, `priority`, `content_length`, `word_count`, `reads`, `age_days`, `has_links`, `has_tags`, `has_label`, `has_folder`, `link_count`, `tag_count`, `title_length`, `snooze_count`, `triage_status`

Action types: `set_status`, `set_priority`, `set_label`, `set_triage`, `archive`, `pin`, `add_tag`, `remove_tag`

Store fields: `autopilotEnabled`, `autopilotRules`, `autopilotLog`

---

## Analysis System

Read-only analysis engine producing insights about notes.

- Engine: `lib/analysis/engine.ts` — `runAnalysis()`
- Rules: `lib/analysis/rules.ts` — 7 built-in rules
- Types: `lib/analysis/types.ts` — `AnalysisRule`, `AnalysisResult`, `RuleContext`

---

## SRS System

- Engine: `lib/srs/engine.ts` — pure functions only, no side effects
- Types: `lib/srs/types.ts`
- Fixed intervals: `[1, 3, 7, 14, 30, 60, 120]` days (index = step)
- `SRSRating`: `0=Again` (reset to step 0), `1=Hard` (hold/step back), `2=Good` (+1 step), `3=Easy` (+2 steps)
- State stored as `srsStateByNoteId: Record<string, SRSState>` in the main store
- Only `status === "permanent"` notes can be enrolled
- `SRSState` fields: `step`, `dueAt` (ISO), `lastReviewedAt`, `introducedAt`, `lapses`

---

## Datalog System

Activity event logging and analytics.

- Config: `lib/datalog/event-config.ts` — event type definitions
- Helpers: `lib/datalog/helpers.ts` — event log utilities
- UI: `components/activity/` — `activity-feed.tsx`, `activity-stats.tsx`, `activity-timeline.tsx`
- Route: `/activity`

---

## Key Utility Files

| File | Purpose |
|---|---|
| `lib/body-helpers.ts` | `extractPreview(content)`, `extractLinksOut(content)` |
| `lib/format-utils.ts` | `shortRelative()` for relative time display |
| `lib/queries/notes.ts` | `computeInboxRank()`, `computeReadyScore()`, `getReviewQueue()`, `suggestLinks()`, `getSnoozeTime()`, `getMapStats()` |
| `lib/store/seeds.ts` | Seed notes/folders/tags/labels/templates for first-run |
| `lib/idb-storage.ts` | Zustand persist storage backed by IDB (debounced 500ms writes) |
| `lib/note-body-store.ts` | CRUD for note bodies in `plot-note-bodies` IDB |
| `lib/settings-store.ts` | Separate Zustand store for app settings |
| `lib/table-route.ts` | Route store: `TABLE_VIEW_ROUTES` (/notes, /pinned, /trash), `VIEW_ROUTES` (/inbox, /activity, /tags, /labels), active folder/tag/label IDs with mutual exclusion |
| `components/color-picker-grid.tsx` | 10-color preset grid for label color selection |
| `lib/graph.ts` | Graph data structures for connections visualization |
| `lib/backlinks.ts` | Backlink computation utilities |

---

## Search

Full-text search runs in a Web Worker (`lib/search/search-worker.ts`). The main thread communicates via `lib/search/search-client.ts`. Search indexes are persisted to IDB via `lib/search/search-index-db.ts`.

The in-memory view-engine search (`applySearch` in `lib/view-engine/search.ts`) is a simple `toLowerCase().includes()` filter on `title` + `preview` for synchronous list filtering. The worker-based FlexSearch is used for the global search dialog.

Backlinks are computed by `useBacklinksIndex()` from `lib/search/use-backlinks-index.ts` — it builds a `Map<noteId, backlink_count>` from `note.linksOut` across all notes.

---

## Testing

```bash
npm run test        # run all tests once
npm run test:watch  # watch mode
```

Test locations:
- `lib/__tests__/body-helpers.test.ts` — preview/link extraction
- `lib/srs/__tests__/engine.test.ts` — SRS engine logic
- `lib/analysis/__tests__/engine.test.ts` — analysis rules
- `lib/autopilot/__tests__/engine.test.ts` — autopilot conditions/actions
- `lib/view-engine/__tests__/pipeline.test.ts` — pipeline stages

Tests use Vitest. No mocked IDB calls — all tests are pure function tests with no side effects.

---

## Common Pitfalls

**Do not call `updateNote` with `content` changes and assume IDB is updated.** The slice calls `persistBody()` automatically whenever `content` or `contentJson` is in `updates`, but only after reading the updated note back from state. Do not call `persistBody` manually from components.

**Do not add new fields to `Note` without also handling `preview` / `linksOut`.** If your new field derives from content, compute it in `createNote` and `updateNote` in `lib/store/slices/notes.ts`.

**Do not add to `VALID_COLUMNS` / `VALID_SORT_FIELDS` / `VALID_GROUP_BY` / `VALID_VIEW_CONTEXT_KEYS` in `lib/view-engine/types.ts` without also handling them in the pipeline functions.** These constants are used in `normalizeViewStatesMap` during migration to strip invalid persisted values.

**Do not use `sidebarPeek` or `_viewStateHydrated` as persistent state.** Both are always reset in `partialize` and `migrate.ts` respectively. They are ephemeral UI flags.

**`triageTrash` does not delete the note.** It sets `trashed: true` and `trashedAt`. Trashed notes are hidden by context filters but remain in state. Use `deleteNote` for permanent deletion.

**`promoteToPermanent` automatically enrolls SRS.** Do not call `enrollSRS` separately after promoting.

**EditorState tabs reference noteIds.** When deleting a note, the editor slice automatically closes any tabs referencing that note.

---

## IDB Databases

Two separate IDB databases:

| DB name | Managed by | Purpose |
|---|---|---|
| `plot-zustand` | `lib/idb-storage.ts` | Zustand persist (note meta, folders, tags, etc.) |
| `plot-note-bodies` | `lib/note-body-store.ts` | Note bodies (content + contentJson) |

The main store is keyed as `"plot-store"` inside `plot-zustand`.

---

## Orphaned Code (pending cleanup)

These entities/routes exist in code but have no active UI path:

- `KnowledgeMap` type + `maps.ts` slice + `/maps` routes — Maps feature hidden from sidebar
- `SavedView` type + `views.ts` slice + `/views` route — Saved Views hidden from sidebar
- `/alerts` route — Alerts system removed (dismissedAlertIds removed in v25)
- `/category/[id]` route — Categories replaced by Tags
- `/projects` routes — Projects replaced by Folders

---

## Design Quality

See `docs/DESIGN-TOKENS.md` for all design token standards (colors, typography, icons, spacing, transitions, border-radius, scrollbar).

The `design-quality-gate` skill auto-activates on UI changes and enforces:
- **Icons**: strokeWidth 1.5 only, size scale h-2/h-3.5/h-4/h-5
- **Colors**: No hardcoded hex — CSS variables only (`text-accent`, `bg-chart-*`, etc.)
- **Typography**: Fixed scale (11/12/13/14/15/24px)
- **Transitions**: Only duration-75/150/200 allowed
- **Spacing**: 4px grid, density-aware padding
- **WCAG**: AccessLint contrast verification on color changes
