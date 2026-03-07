# AGENTS.md — Plot Codebase Guide

Plot is a local-first knowledge management app. No backend. No API calls. All data lives in IndexedDB via Zustand persist.

---

## Tech Stack

- **Framework**: Next.js (App Router, `"use client"` where needed)
- **State**: Zustand 5 with custom IDB persist storage
- **Editor**: Tiptap 3
- **UI**: shadcn/ui (Radix UI primitives + Tailwind)
- **Testing**: Vitest (`npm run test`)
- **Search**: FlexSearch in a Web Worker

---

## Read These Files First

Before making changes, read these in order:

1. `lib/types.ts` — All core types: `Note`, `Folder`, `Tag`, `Category`, `Alert`, `KnowledgeMap`, `NoteEvent`, etc.
2. `lib/store/types.ts` — `PlotState` interface: every state field and every action
3. `lib/store/index.ts` — Store composition, persist config, `partialize`, current version (`version: 19`)
4. `lib/store/migrate.ts` — All migration logic; read before touching store shape
5. `lib/view-engine/types.ts` — `ViewState`, `ViewContextKey`, `PipelineResult`, sort/group/filter enums

---

## Core Architectural Rules

### 1. Never Persist Computed Data

These are derived at render time and must never be stored in `PlotState`:

| Value | Where it's computed |
|---|---|
| `alerts` | `computeAlerts()` in `lib/alerts.ts` |
| `backlinks` | `useBacklinksIndex()` in `lib/search/use-backlinks-index.ts` |
| `readyScore` / `inboxRank` | `lib/queries/notes.ts` |
| `linksOut` / `preview` | These ARE stored on `Note` as precomputed fields — see below |

The only alert-related field persisted is `dismissedAlertIds: string[]`.

### 2. `preview` and `linksOut` Are Precomputed, Not Derived at Render

`Note.preview` (first ~120 chars of plaintext) and `Note.linksOut` (extracted `[[wiki-link]]` targets, lowercased) are computed from content and **stored on the note** for fast list rendering. They are always updated synchronously in `createNote` and `updateNote` via `extractPreview()` / `extractLinksOut()` from `lib/body-helpers.ts`.

Do not use raw `note.content` for link or preview logic in list views — use these precomputed fields.

### 3. Body Separation

Note bodies (`content` + `contentJson`) are stored in a separate IndexedDB database (`plot-note-bodies`) via `lib/note-body-store.ts`. The main Zustand persist store strips them via `partialize`:

```ts
notes: state.notes.map((n) => ({ ...n, content: "", contentJson: null }))
```

Bodies are loaded async at startup by `components/providers/body-provider.tsx` which calls `store._hydrateNoteBodies()`. The app shows a loading screen until hydration completes.

**Consequence**: Never assume `note.content` is populated in list/table views. It's only available after `BodyProvider` completes, and only when a note is opened for editing.

### 4. Every New Store Field Needs Migration

The store version is `19` (in `lib/store/index.ts`). When you add a field to `PlotState`:

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
| `notes.ts` | createNote, updateNote, deleteNote, duplicateNote, togglePin, toggleArchive, touchNote, createChainNote |
| `workflow.ts` | triageKeep, triageSnooze, triageTrash, promoteToPermament, undoPromote, moveBackToInbox, all SRS actions |
| `folders.ts` | createFolder, updateFolder, deleteFolder |
| `tags.ts` | createTag, updateTag, deleteTag, addTagToNote, removeTagFromNote |
| `categories.ts` | createCategory, updateCategory, deleteCategory |
| `thinking.ts` | startThinkingChain, addThinkingStep, endThinkingChain, addWikiLink |
| `maps.ts` | createKnowledgeMap, updateKnowledgeMap, deleteKnowledgeMap, addNoteToMap, removeNoteFromMap |
| `ui.ts` | setActiveView, setSelectedNoteId, openNote, search, sidebar, setViewState |
| `alerts.ts` | dismissAlert, clearDismissedAlerts |

### Helpers in `lib/store/helpers.ts`

- `genId()` — `crypto.randomUUID()`
- `now()` — `new Date().toISOString()`
- `workflowDefaults(status)` — default workflow fields for new notes
- `persistBody(body)` / `removeBody(id)` — fire-and-forget IDB writes
- `createAppendEvent(set)` — returns `appendEvent(noteId, type, meta?)` for audit trail

### Event Log

Every meaningful action calls `appendEvent(noteId, type, meta?)`. This appends to `noteEvents: NoteEvent[]`. Capped at 1000 events per note (oldest trimmed first).

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

`PipelineExtras` carries `backlinksMap`, `folderId`, `categoryId`, `tagId` — route-specific data the context filter needs.

### ViewState per Context

Each route has its own `ViewState` stored under `viewStateByContext[contextKey]`. Valid context keys are in `lib/view-engine/types.ts`:

```
"all" | "inbox" | "capture" | "reference" | "permanent" | "unlinked" | "review" | "archive" | "folder" | "category" | "tag" | "projects"
```

`viewStateByContext` is persisted. `_viewStateHydrated` is always reset to `false` on persist (it's set to `true` by `onRehydrateStorage`).

### Valid Column IDs

```ts
["title", "status", "project", "links", "reads", "priority", "createdAt", "updatedAt"]
```

In `components/notes-table.tsx`, `COLUMN_DEFS` controls header render order. The `NoteRow` component has hardcoded column blocks that must match this order. If you add a column to `COLUMN_DEFS`, you must add a corresponding block in `NoteRow`.

---

## Domain Domains

| Route | Context key | Status filter | Key actions |
|---|---|---|---|
| `/inbox` | `"inbox"` | `status === "inbox"`, untriaged or snoozed-due | triageKeep, triageSnooze, triageTrash |
| `/capture` | `"capture"` | `status === "capture"` | promoteToPermament, readyScore |
| `/permanent` | `"permanent"` | `status === "permanent"` | enrollSRS, reviewSRS, unenrollSRS |
| `/review` | `"review"` | aggregated queue | `getReviewQueue()` from `lib/queries/notes.ts` |
| `/alerts` | n/a | derived | `computeAlerts()` from `lib/alerts.ts` |
| `/maps/[id]` | n/a | explicit noteIds | addNoteToMap, removeNoteFromMap |

### Note Status Lifecycle

```
inbox → (triageKeep) → capture → (promoteToPermament) → permanent
inbox → (triageSnooze) → inbox (snoozed)
inbox → (triageTrash) → inbox (trashed, hidden)
permanent → (undoPromote) → capture
capture/permanent → (moveBackToInbox) → inbox
```

`promoteToPermament` automatically calls `enrollSRS`.

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

## Alert System

- `computeAlerts(notes, srsMap, dismissedIds)` in `lib/alerts.ts` — not stored
- Alert types: `"srs-due"`, `"snooze-expired"`, `"stale-note"`
- Deterministic IDs: `` `${type}:${noteId}` ``
- Only `dismissedAlertIds: string[]` is persisted
- Severities: `"info"` | `"warning"` | `"urgent"`
- Display config (labels, colors) in `ALERT_TYPE_CONFIG` and `ALERT_TYPE_ORDER` at bottom of `lib/alerts.ts`

Stale-note threshold: 7 days. Severity upgrades to `"warning"` at 14 days.

---

## Key Utility Files

| File | Purpose |
|---|---|
| `lib/body-helpers.ts` | `extractPreview(content)`, `extractLinksOut(content)` |
| `lib/format-utils.ts` | `shortRelative()` for relative time display |
| `lib/queries/notes.ts` | `computeInboxRank()`, `computeReadyScore()`, `getReviewQueue()`, `suggestLinks()`, `getSnoozeTime()`, `getMapStats()` |
| `lib/store/seeds.ts` | Seed notes/folders/tags/categories for first-run |
| `lib/idb-storage.ts` | Zustand persist storage backed by IDB (debounced 500ms writes) |
| `lib/note-body-store.ts` | CRUD for note bodies in `plot-note-bodies` IDB |

---

## Search

Full-text search runs in a Web Worker (`lib/search/search-worker.ts`). The main thread communicates via `lib/search/search-client.ts`. The in-memory view-engine search (`applySearch` in `lib/view-engine/search.ts`) is a simple `toLowerCase().includes()` filter on `title` + `preview` for synchronous list filtering. The worker-based FlexSearch is used for the global search dialog.

Backlinks are computed by `useBacklinksIndex()` from `lib/search/use-backlinks-index.ts` — it builds a `Map<noteId, backlink_count>` from `note.linksOut` across all notes.

---

## Testing

```bash
npm run test        # run all tests once
npm run test:watch  # watch mode
```

Test locations:
- `lib/__tests__/*.test.ts` — body helpers and other lib utilities
- `lib/srs/__tests__/*.test.ts` — SRS engine logic
- `lib/view-engine/__tests__/*.test.ts` — pipeline stages

Tests use Vitest. There are no mocked IDB calls — SRS engine and view-engine tests are pure function tests with no side effects.

---

## Common Pitfalls

**Do not call `updateNote` with `content` changes and assume IDB is updated.** The slice calls `persistBody()` automatically whenever `content` or `contentJson` is in `updates`, but only after reading the updated note back from state. Do not call `persistBody` manually from components.

**Do not add new fields to `Note` without also handling `preview` / `linksOut`.** If your new field derives from content, compute it in `createNote` and `updateNote` in `lib/store/slices/notes.ts`.

**Do not add to `VALID_COLUMNS` / `VALID_SORT_FIELDS` / `VALID_GROUP_BY` / `VALID_VIEW_CONTEXT_KEYS` in `lib/view-engine/types.ts` without also handling them in the pipeline functions.** These constants are used in `normalizeViewStatesMap` during migration to strip invalid persisted values.

**Do not use `sidebarPeek` or `_viewStateHydrated` as persistent state.** Both are always reset in `partialize` and `migrate.ts` respectively. They are ephemeral UI flags.

**`triageTrash` does not delete the note.** It sets `triageStatus: "trashed"` and `archivedAt`. Trashed notes are hidden by context filters but remain in state. Use `deleteNote` for permanent deletion.

**Alert IDs are deterministic.** When checking if an alert is dismissed, always use `${type}:${noteId}`. Do not generate random IDs for alerts.

**`promoteToPermament` (note the typo in the action name) automatically enrolls SRS.** Do not call `enrollSRS` separately after promoting.

---

## IDB Databases

Two separate IDB databases:

| DB name | Managed by | Purpose |
|---|---|---|
| `plot-zustand` | `lib/idb-storage.ts` | Zustand persist (note meta, folders, tags, etc.) |
| `plot-note-bodies` | `lib/note-body-store.ts` | Note bodies (content + contentJson) |

The main store is keyed as `"plot-store"` inside `plot-zustand`.
