# Knowledge Features Plan

## Repository Architecture (Current)

### Note Storage
- **Store**: `lib/store/index.ts` — Zustand `usePlotStore` with `persist` middleware (IDB storage via `lib/idb-storage.ts`)
- **Store key**: `"plot-store"`, version 19
- **Store pattern**: Sliced — `lib/store/slices/{notes,workflow,folders,tags,categories,thinking,maps,ui,alerts}.ts`
- **State type**: `lib/store/types.ts` → `PlotState`
- **Data**: `state.notes: Note[]` (flat array), bodies separated into IndexedDB

### Links / Backlinks
- **`lib/backlinks.ts`** — `countBacklinks(noteId, allNotes)` and `buildBacklinksMap(allNotes)`
- **`lib/search/use-backlinks-index.ts`** — Incremental backlinks index
- **Precomputed**: `note.linksOut` (extracted wiki-link targets) stored on Note for performance
- Detection: `[[title]]` wiki-links

### Note Detail Panel
- **File**: `components/note-detail-panel.tsx`
- **Sections**: Workflow action bar, metadata, backlinks, connections graph, suggested links, SRS info
- **Width**: 420px side panel

### Note Editing
- **File**: `components/note-editor.tsx` + `components/editor/TipTapEditor.tsx`
- **Implementation**: Tiptap rich text editor with full toolbar
- **Link suggestion**: `components/link-suggestion.tsx` — popup on `[[` trigger

### Query Functions (`lib/queries/notes.ts`)
- `getInboxNotes`, `getCaptureNotes`, `getPermanentNotes`, `getUnlinkedNotes`
- `computeInboxRank`, `computeReadyScore`, `isReadyToPromote`
- `needsReview` (7d), `isStaleSuggest` (14d), `getSnoozeTime`
- `getReviewQueue` — aggregates all review items
- `suggestLinks` — editor link suggestion matching
- `getMapStats`, `getMapReviewItems` — knowledge map queries

### View Engine (`lib/view-engine/`)
- Per-context ViewState (sort, filter, group, columns) persisted in store
- Pipeline: context-filter → filter → sort → group → search
- 12 contexts: all, inbox, capture, reference, permanent, unlinked, review, archive, folder, category, tag, projects

### SRS System (`lib/srs/`)
- Spaced repetition with fixed intervals [1, 3, 7, 14, 30, 60, 120] days
- Ratings: 0=Again, 1=Hard, 2=Good, 3=Easy
- Permanent notes only, stored in `srsStateByNoteId`
- Enrollment: individual or bulk (`enrollAllPermanentSRS`)

### Alerts System (`lib/alerts.ts`)
- Computed alerts (not stored): SRS due, snooze expired, stale notes
- Only `dismissedAlertIds` persisted
- Severity levels: info, warning, urgent

---

## Feature Implementation Status

### Feature 1 — Daily Review Queue: COMPLETE
- `getReviewQueue()` in `lib/queries/notes.ts` aggregates: inbox untriaged, snoozed-due, stale captures, unlinked permanents, SRS due
- Page at `app/(app)/review/page.tsx` with grouped sections and action buttons
- Sidebar link with badge count in `components/linear-sidebar.tsx`

### Feature 2 — Link Suggestion (in Editor): COMPLETE
- `suggestLinks()` in `lib/queries/notes.ts` — matches note titles
- `components/link-suggestion.tsx` — popup component
- Triggered by `[[` in Tiptap editor
- Returns top 5 matches, excludes current note

### Feature 3 — Promotion Suggestion: COMPLETE
- `computeReadyScore()` with scoring: summary +2, tags +1, forward links +2, backlinks +2, headings +1, high priority +1
- `isReadyToPromote()` — threshold at score >= 5 OR (links >= 2 AND summary exists)
- "Ready" badge on capture rows, inspector, and detail panel
- Promote button highlighted when ready

### Feature 4 — Thinking Chain: COMPLETE
- `parentNoteId: string | null` on Note type
- `createChainNote(parentId)` action in store
- Navigation UI in detail panel: previous/next chain links
- Keyboard shortcut: Shift+Enter creates chain note
- ThinkingChainSession tracking with steps and status

### Feature 5 — Knowledge Maps: COMPLETE
- `KnowledgeMap` type with id, title, description, noteIds, color
- CRUD actions: `createKnowledgeMap`, `updateKnowledgeMap`, `deleteKnowledgeMap`, `addNoteToMap`, `removeNoteFromMap`
- Pages: `/maps` (list) and `/maps/[id]` (detail with canvas)
- Stats: `getMapStats()`, review items: `getMapReviewItems()`
- Visual canvas at `components/knowledge-map-canvas.tsx`

### Feature 6 — SRS (Spaced Repetition): COMPLETE
- Engine: `lib/srs/engine.ts` — `computeNextStep()`, `dueAtFromStep()`
- Types: `lib/srs/types.ts` — `SRSState`, `SRSRating`, `INTERVALS`
- Store actions: `reviewSRS`, `enrollSRS`, `unenrollSRS`, `enrollAllPermanentSRS`
- Integration with Review Queue (srs-due reason)

### Feature 7 — Alerts System: COMPLETE
- Computation: `lib/alerts.ts` — `computeAlerts()` derives alerts from state
- 3 types: srs-due (warning), snooze-expired (urgent), stale-note (info/warning at 14d)
- Store: `dismissedAlertIds` array, `dismissAlert()`, `clearDismissedAlerts()`
- Page: `app/(app)/alerts/page.tsx` with grouped display
- Sidebar: amber badge with active alert count
- Documented: `docs/alerts-system.md`

### Feature 8 — View Engine: COMPLETE
- Per-context persisted view state (sort, filter, group, column visibility)
- Pipeline architecture: context-filter → filter → sort → group → search
- 12 view contexts with independent settings
- Column management with `ensureRequiredColumns()` guaranteeing updatedAt/createdAt

### Feature 9 — Event Logging: COMPLETE
- NoteEvent type with 12 event types (created, updated, opened, promoted, archived, etc.)
- `createAppendEvent()` helper for consistent event recording
- Events stored in `noteEvents: NoteEvent[]`

---

## Summary Table

| Feature | Status |
|---------|--------|
| 1. Daily Review Queue | Complete |
| 2. Link Suggestion | Complete |
| 3. Promotion Suggestion | Complete |
| 4. Thinking Chain | Complete |
| 5. Knowledge Maps | Complete |
| 6. SRS (Spaced Repetition) | Complete |
| 7. Alerts System | Complete |
| 8. View Engine | Complete |
| 9. Event Logging | Complete |
