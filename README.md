# Plot

A local-first knowledge management app inspired by Linear's design quality. Plot helps you capture, develop, and retain ideas through a structured Zettelkasten-inspired workflow — all stored privately in your browser via IndexedDB.

## The Core Workflow: Inbox → Capture → Permanent

Notes move through three lifecycle stages:

**Inbox** — Quick capture zone. New notes land here unstructured. You triage them: keep, snooze, or trash. Notes are ranked by `inboxRank` score to surface what needs attention first.

**Capture** — Working notes under active development. You link them, tag them, and build them out. A `readyScore` algorithm monitors maturity — when it hits 5, Plot suggests promoting the note to permanent.

**Permanent** — Polished, evergreen notes. These are enrolled in the SRS (Spaced Repetition System) to keep knowledge active over the long term.

## Features

- **Triage workflow** — Keep / Snooze / Trash actions for inbox notes
- **Promotion system** — `readyScore >= 5` triggers a promotion suggestion from capture to permanent
- **Review Queue** (`/review`) — Aggregates everything needing attention: untriaged inbox notes, snoozed-and-due notes, stale captures, unlinked permanents, and SRS-due reviews
- **Spaced Repetition (SRS)** — Fixed-step intervals [1, 3, 7, 14, 30, 60, 120] days with Again / Hard / Good / Easy ratings
- **Wiki-links** — `[[note title]]` syntax for inter-note linking with incrementally computed backlinks
- **Thinking Chains** — Linked-list note sequences for developing ideas across multiple connected notes
- **Multi-tab editor** — VS Code-style tabbed editing with split view support
- **Rich text editor** — Tiptap-based with tables, images, task lists, text highlighting, color, and more
- **5 view modes** — List, Table, Board (kanban), Insights (analysis), Calendar
- **View Engine** — Per-context view state (sort, filter, group, column visibility) for each section
- **Autopilot rules** — Rule-based automation: conditions on notes trigger actions automatically
- **Templates** — Pre-configured note templates with placeholders
- **Labels** — Single-select classification (1:1 per note, complementing N:N tags)
- **Analysis insights** — 7 built-in rules surface actionable suggestions about your notes
- **Activity feed** — Datalog-based activity history, stats, and timeline
- **Connections graph** — SVG visualization of note relationships
- **Search** — FlexSearch-powered full-text search with web worker for non-blocking indexing
- **Settings** — Appearance/themes, editor config, keyboard shortcuts, backup/restore, sync

## Architecture

| Concern | Technology |
|---------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, shadcn/ui, Radix primitives, Lucide icons, Tailwind v4 |
| State | Zustand v5 with persist middleware (IndexedDB), schema version 30 |
| Rich text | Tiptap 3 |
| Search | FlexSearch (web worker) |
| Lists | @tanstack/react-virtual (virtualized) |
| Charts | Recharts |
| Tests | Vitest |

**Store pattern:** Slice-based Zustand store with 12 slices in `lib/store/slices/` (notes, workflow, folders, tags, labels, thinking, maps, ui, views, autopilot, templates, editor). Composed in `lib/store/index.ts`.

**Body separation:** Note content (`NoteBody`) is stored separately in IndexedDB for performance. The Zustand store holds metadata only.

**View Engine:** `lib/view-engine/` runs a pipeline — context-filter → filter → search → sort → group — to produce the note list for each view.

## Project Structure

```
app/
  (app)/                    # Main app layout group
    inbox/page.tsx          # Inbox triage view
    capture/page.tsx        # Capture stage view
    permanent/page.tsx      # Permanent notes
    notes/page.tsx          # All notes
    review/page.tsx         # Daily review queue
    activity/page.tsx       # Activity feed & analytics
    trash/page.tsx          # Trashed notes
    pinned/page.tsx         # Pinned notes
    folder/[id]/page.tsx    # Folder filter
    tag/[id]/page.tsx       # Tag filter
    layout.tsx              # App shell (sidebar + main)
  settings/                 # Settings pages (preferences, appearance, editor, shortcuts, backup, sync, about)

components/
  editor/                   # Tiptap editor (multi-tab, split view, toolbar)
  activity/                 # Activity feed, stats, timeline
  ui/                       # shadcn/ui primitives
  linear-sidebar.tsx        # Main navigation sidebar
  notes-table.tsx           # Table view with columns
  note-list.tsx             # Virtualized list view
  notes-board.tsx           # Board (kanban) view
  calendar-view.tsx         # Calendar view
  insights-view.tsx         # Analysis insights view
  note-detail-panel.tsx     # Side detail panel
  note-editor.tsx           # Note editing container
  connections-graph.tsx     # SVG relationship graph
  filter-bar.tsx            # Filter bar with presets
  floating-action-bar.tsx   # Batch action bar
  search-dialog.tsx         # Command palette search

lib/
  store/                    # Zustand store
    slices/                 # 12 feature slices
    index.ts                # Store composition (version 30)
    types.ts                # PlotState interface
    migrate.ts              # Version migrations (v6→v30)
    selectors.ts            # Memoized selectors
    seeds.ts                # Initial seed data
  view-engine/              # Note filtering/sorting pipeline
  search/                   # FlexSearch web worker integration
  srs/                      # Spaced repetition engine
  autopilot/                # Rule-based automation engine
  analysis/                 # Analysis rules engine
  datalog/                  # Activity event logging
  queries/notes.ts          # Domain query functions
  types.ts                  # Core type definitions
  body-helpers.ts           # Preview and link extraction

hooks/                      # Custom React hooks
docs/                       # Documentation
```

## Dev Setup

Requires Node.js.

```bash
npm install        # Install dependencies
npm run dev        # Start dev server
npm run build      # Production build
npm run test       # Run tests (Vitest)
npm run lint       # Lint
```

The app runs entirely in the browser. All data is stored locally in IndexedDB — no backend, no account required.
