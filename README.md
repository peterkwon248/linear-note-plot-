# Plot

A local-first knowledge management app inspired by Linear's design. Plot helps you capture, develop, and retain ideas through a structured Zettelkasten-inspired workflow — all stored privately in your browser via IndexedDB.

## The Core Workflow: Inbox → Capture → Permanent

Notes move through three lifecycle stages:

**Inbox** — Quick capture zone. New notes land here unstructured. You triage them: keep, snooze, or trash. Notes are ranked by `inboxRank` score to surface what needs attention first.

**Capture** — Working notes. Notes under active development. You link them, tag them, and build them out. A `readyScore` algorithm monitors maturity — when it hits 5, Plot suggests promoting the note to permanent.

**Permanent** — Polished, evergreen notes. These are enrolled in the SRS (Spaced Repetition System) to keep knowledge active over the long term.

## Features

- **Triage workflow** — Keep / Snooze / Trash actions for inbox notes
- **Promotion system** — `readyScore >= 5` triggers a promotion suggestion from capture to permanent
- **Review Queue** (`/review`) — Aggregates everything needing attention: untriaged inbox notes, snoozed-and-due notes, stale captures, unlinked permanents, and SRS-due reviews
- **Alerts System** (`/alerts`) — Proactive notifications for SRS due reviews, expired snoozes, and capture notes untouched for 7+ days
- **Spaced Repetition (SRS)** — Fixed-step intervals [1, 3, 7, 14, 30, 60, 120] days with Again / Hard / Good / Easy ratings
- **Knowledge Maps** — Named collections of notes with internal link analysis and map-level statistics
- **Thinking Chains** — Linked-list note sequences for developing ideas across multiple connected notes
- **Wiki-links** — `[[note title]]` syntax for inter-note linking with incrementally computed backlinks
- **Rich text editor** — Tiptap-based with tables, images, task lists, text highlighting, color, and more
- **View Engine** — Per-context view state (sort, filter, group, column visibility) for each section
- **Connections Graph** — SVG visualization of note relationships
- **Search** — FlexSearch-powered with a web worker for non-blocking indexing
- **Settings** — Appearance/themes, editor config, keyboard shortcuts, backup/restore, sync

## Architecture

| Concern | Technology |
|---------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, shadcn/ui, Radix primitives, Lucide icons, Tailwind v4 |
| State | Zustand v5 with persist middleware (IndexedDB), schema version 19 |
| Rich text | Tiptap |
| Search | FlexSearch (web worker) |
| Lists | @tanstack/react-virtual (virtualized) |
| Charts | Recharts |
| Tests | Vitest (113 tests) |

**Store pattern:** Slice-based Zustand store. Each feature lives in `lib/store/slices/` (notes, workflow, folders, tags, categories, thinking, maps, ui, alerts). The store is composed in `lib/store/index.ts`.

**Body separation:** Note content (`NoteBody`) is stored separately in IndexedDB for performance. The Zustand store holds metadata only.

**View Engine:** `lib/view-engine/` runs a pipeline — context-filter → filter → sort → group → search — to produce the note list for each view.

## Project Structure

```
app/
  (app)/                    # Main app layout group
    inbox/page.tsx          # Inbox triage view
    capture/page.tsx        # Capture stage view
    permanent/page.tsx      # Permanent notes
    review/page.tsx         # Daily review queue
    alerts/page.tsx         # Alerts page
    archive/page.tsx        # Archived notes
    maps/page.tsx           # Knowledge maps list
    maps/[id]/page.tsx      # Individual map view
    notes/page.tsx          # All notes
    projects/page.tsx       # Project notes
    folder/[id]/page.tsx    # Folder filter
    tag/[id]/page.tsx       # Tag filter
    category/[id]/page.tsx  # Category filter
    views/page.tsx          # Custom views
    layout.tsx              # App shell (sidebar + main)
  settings/                 # Settings pages (appearance, backup, editor, shortcuts, sync, about)

components/
  editor/                   # Tiptap editor components
  ui/                       # shadcn/ui primitives
  linear-sidebar.tsx        # Main navigation sidebar
  notes-table.tsx           # Table view
  note-list.tsx             # List view
  note-detail-panel.tsx     # Side detail panel (420px)
  note-editor.tsx           # Note editing view
  connections-graph.tsx     # SVG relationship graph
  knowledge-map-canvas.tsx  # Map visualization
  search-dialog.tsx         # Command palette search

lib/
  store/                    # Zustand store
    slices/                 # Feature slices (notes, workflow, folders, tags, etc.)
    index.ts                # Store composition
    types.ts                # PlotState interface
    migrate.ts              # Version migrations
    selectors.ts            # Memoized selectors
    seeds.ts                # Initial seed data
  view-engine/              # Note filtering/sorting pipeline
  search/                   # FlexSearch integration
  srs/                      # Spaced repetition engine
  queries/notes.ts          # Domain query functions
  alerts.ts                 # Alert computation
  backlinks.ts              # Backlink computation
  types.ts                  # Core type definitions
  body-helpers.ts           # Preview and link extraction

hooks/                      # Custom React hooks
docs/                       # Documentation
```

## Dev Setup

Requires Node.js.

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Production build
npm run build

# Run tests (Vitest)
npm run test

# Lint
npm run lint
```

The app runs entirely in the browser. All data is stored locally in IndexedDB — no backend, no account required.

## Key Dependencies

- `next@16.1.6`, `react@19.2.4`
- `zustand@5.0.11` — state management with IndexedDB persistence
- `@tiptap/*` — rich text editor
- `@tanstack/react-virtual` — virtualized lists
- `flexsearch` — full-text search
- `recharts` — charts
- `date-fns` — date formatting
- `shadcn/ui` (Radix + Tailwind v4) — component primitives
