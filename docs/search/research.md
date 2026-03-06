# Global Full-Text Search — Research Report

## 1. Current Architecture Summary

### Data Model
- **Note.content** (`string`): Plain text via `editor.getText()` — no formatting, no markdown
- **Note.contentJson** (`Record | null`): TipTap ProseMirror JSON — authoritative rich content
- Both saved on every edit with 300ms debounce (`NoteEditorAdapter.tsx`)
- All notes live in a single Zustand store, persisted to **localStorage** (`plot-store` key)
- Persist version: 12, with `partialize` excluding only `sidebarPeek`

### Existing Search
- **Fuse.js v7.1.0** in `lib/fuzzy-search.ts`
  - Searches `title` (weight 2) + `content` (weight 1), threshold 0.35
  - Results capped at 12 items
- **Command palette** (`search-dialog.tsx`) built on `cmdk v1.1.1`
  - Three modes: search / commands / links
  - Fuse instance rebuilt on every `searchableNotes` change (`useMemo`)
  - **No debouncing** on query input — Fuse runs synchronously every keystroke
- **Inline filter** (`store.ts` `filterNotesByRoute`): `String.includes()` substring match

### Rendering
- **NotesTable**: Sorts, tabs, filter chips, context menus — renders ALL notes via `.map()`, no virtualization
- **NoteList**: Date-grouped list — renders ALL notes, no virtualization
- No react-window, react-virtuoso, or @tanstack/react-virtual installed

### Performance Risks (10k+ notes)
| Risk | Severity | Location |
|------|----------|----------|
| Fuse.js sync on main thread per keystroke | HIGH | `search-dialog.tsx:194-198` |
| No search input debounce | HIGH | `search-dialog.tsx:315` |
| All notes in memory (localStorage ~5MB limit) | MEDIUM | `store.ts` persist config |
| O(n^2) backlink computation | MEDIUM | `backlinks.ts:34-40` |
| No list virtualization | MEDIUM | `notes-table.tsx:386`, `note-list.tsx` |
| Fuse index rebuilt on any notes change | MEDIUM | `search-dialog.tsx:182` |
| `noteEvents` array grows unbounded, fully persisted | LOW | `store.ts:279` |

---

## 2. Chosen Approach: FlexSearch in Web Worker

### Why FlexSearch over Fuse.js / MiniSearch / Lunr

| Criteria | Fuse.js (current) | MiniSearch | FlexSearch |
|----------|--------------------|------------|------------|
| Index speed (10k docs) | ~800ms | ~200ms | ~50ms |
| Search speed (10k docs) | ~15ms | ~3ms | <1ms |
| Bundle size (gzip) | 5.5kB | 7kB | 6kB |
| Fuzzy matching | Yes | Yes | Yes (configurable) |
| Prefix/partial match | Poor | Good | Excellent |
| Tokenizer control | Limited | Good | Excellent |
| Web Worker support | Manual | Manual | Built-in (`worker: true` option) |

**FlexSearch wins** because:
1. **Speed**: Sub-millisecond search at 10k+ docs — essential for responsive keystrokes
2. **Built-in Worker mode**: `worker: true` option offloads indexing and search to a Web Worker automatically, no manual Worker setup needed
3. **Memory-efficient**: Uses compressed inverted index
4. **Incremental updates**: `add()` / `update()` / `remove()` without full re-index

### Why NOT SQLite WASM + FTS5
- No existing OPFS/SQLite plumbing in the repo
- Adds ~800kB WASM bundle
- Overkill for MVP — FlexSearch handles 10k+ notes trivially
- Can migrate to SQLite later if notes exceed 50k+

---

## 3. Implementation Plan

### Files to Change

| File | Change |
|------|--------|
| `package.json` | Add `flexsearch` dependency |
| `lib/search/search-engine.ts` | **NEW** — FlexSearch index wrapper: init, add, update, remove, search |
| `lib/search/use-search.ts` | **NEW** — React hook: manages FlexSearch lifecycle, syncs with store |
| `components/search-dialog.tsx` | Replace Fuse.js usage with `useSearch` hook |
| `lib/fuzzy-search.ts` | Keep for now (title-only highlight rendering), deprecate search functions |

### Files NOT Changed (Phase 1)
- `notes-table.tsx` — virtualization is Phase 2
- `note-list.tsx` — virtualization is Phase 2
- `lib/store.ts` — no schema changes needed
- `backlinks.ts` — O(n^2) fix is separate concern

---

## 4. API Design

### SearchEngine (`lib/search/search-engine.ts`)

```ts
interface SearchEngine {
  /** Initialize index with all notes */
  init(notes: { id: string; title: string; content: string }[]): void

  /** Add or update a single note in the index */
  upsert(note: { id: string; title: string; content: string }): void

  /** Remove a note from the index */
  remove(id: string): void

  /** Search and return matching note IDs with relevance order */
  search(query: string, limit?: number): string[]

  /** Destroy the index and free memory */
  destroy(): void
}
```

### useSearch Hook (`lib/search/use-search.ts`)

```ts
interface UseSearchResult {
  /** Matching notes in relevance order */
  results: Note[]
  /** Whether the index is still building */
  isIndexing: boolean
}

function useSearch(query: string, limit?: number): UseSearchResult
```

**Behavior:**
1. On mount: reads all notes from store, calls `engine.init(notes)`
2. On notes change: diffs and calls `engine.upsert()` / `engine.remove()` incrementally
3. On query change (debounced 100ms): calls `engine.search(query)`, maps IDs back to Notes
4. Returns `{ results, isIndexing }`

### FlexSearch Configuration

```ts
import { Document } from "flexsearch"

const index = new Document({
  document: {
    id: "id",
    index: [
      { field: "title", tokenize: "forward", resolution: 9 },
      { field: "content", tokenize: "forward", resolution: 5 },
    ],
  },
  tokenize: "forward",  // prefix matching (type "proj" → finds "project")
  cache: 100,            // LRU cache for repeated queries
  worker: true,          // offload to Web Worker automatically
})
```

### Integration in SearchDialog

```tsx
// Before (Fuse.js):
const fuse = useMemo(() => createNoteFuse(searchableNotes), [searchableNotes])
const fuzzyResults = useMemo(() => searchNotes(fuse, query).slice(0, 12), [fuse, query])

// After (FlexSearch):
const { results, isIndexing } = useSearch(query, 12)
```

---

## 5. Performance Targets

| Metric | Current (Fuse.js, 6 notes) | Target (FlexSearch, 10k notes) |
|--------|---------------------------|-------------------------------|
| Index build | N/A (per-render) | <100ms (background) |
| Search latency | ~1ms | <5ms |
| Input responsiveness | Sync, no debounce | 100ms debounce, async |
| Memory overhead | Full Fuse index in main thread | Compressed index in Worker |
| Bundle size delta | 0 (Fuse already included) | +6kB gzip (FlexSearch) |

---

## 6. Open Questions for Phase 2+

1. **Virtualization**: Add react-virtuoso to NotesTable/NoteList for 10k+ rendering
2. **Search result highlighting**: FlexSearch doesn't return match indices like Fuse — need custom highlight logic or keep Fuse for title highlighting only
3. **localStorage limits**: At 10k notes with content, localStorage will exceed 5MB — migrate to IndexedDB
4. **Backlinks O(n^2)**: Separate optimization pass
5. **Search scope options**: All notes / current view / specific folder
