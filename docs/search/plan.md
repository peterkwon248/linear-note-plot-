# Implementation Plan — Delta from research.md

## Scope Expansion

Three non-negotiable goals added beyond original MVP:

1. **Off-main-thread search** — Web Worker (not FlexSearch built-in `worker: true`)
2. **List virtualization** — @tanstack/react-virtual for NotesTable + NoteList
3. **Incremental backlinks** — replace O(n^2) `buildBacklinksMap` with diffing index

## A) FlexSearch Web Worker

**Files:**
| File | Action |
|------|--------|
| `lib/search/search-worker.ts` | NEW — Web Worker: FlexSearch index, handles INIT/QUERY/UPSERT/DELETE messages |
| `lib/search/search-client.ts` | NEW — Main thread: Worker wrapper, message protocol, debounced query |
| `lib/search/use-search.ts` | NEW — React hook: lifecycle, store sync, incremental updates |
| `components/search-dialog.tsx` | MODIFY — Replace Fuse with useSearch hook |
| `next.config.mjs` | MODIFY — Add webpack worker config if needed |

**Message Protocol:**
```
Main -> Worker: { type: "INIT", notes: {id,title,content}[] }
Main -> Worker: { type: "QUERY", query: string, limit: number, reqId: number }
Main -> Worker: { type: "UPSERT", note: {id,title,content} }
Main -> Worker: { type: "DELETE", id: string }

Worker -> Main: { type: "READY" }
Worker -> Main: { type: "PROGRESS", indexed: number, total: number }
Worker -> Main: { type: "RESULTS", ids: string[], reqId: number }
```

**Chunked Indexing:** INIT processes notes in chunks of 500 with `setTimeout(0)` between chunks, sending PROGRESS updates.

**Query Debounce:** 150ms in useSearch hook via setTimeout.

## B) List Virtualization

**Files:**
| File | Action |
|------|--------|
| `package.json` | ADD `@tanstack/react-virtual` |
| `components/notes-table.tsx` | MODIFY — Virtualize rows with useVirtualizer |
| `components/note-list.tsx` | MODIFY — Virtualize rows with useVirtualizer |

**Approach:**
- Wrap existing row rendering with `useVirtualizer({ count, getScrollElement, estimateSize })`
- Keep all existing table layout, sorting, filtering, context menus
- Estimated row height: 41px (table), 72px (list)
- Overscan: 5 rows

## C) Incremental Backlinks Index

**Files:**
| File | Action |
|------|--------|
| `lib/backlinks.ts` | MODIFY — Add BacklinksIndex class with incremental add/remove/diff |
| `lib/search/use-backlinks-index.ts` | NEW — React hook: maintains index, syncs with store |
| `components/notes-table.tsx` | MODIFY — Use index instead of buildBacklinksMap |
| `components/search-dialog.tsx` | MODIFY — Use index instead of buildBacklinksMap |
| Pages using backlinks | MODIFY — Pass index prop or use hook |

**Data Structures:**
```ts
class BacklinksIndex {
  private outlinks: Map<string, Set<string>>   // noteId -> Set<linkedNoteId>
  private backlinks: Map<string, Set<string>>   // noteId -> Set<referrerId>

  upsert(noteId: string, content: string, allNoteTitles: Map<string, string>): void
  remove(noteId: string): void
  getBacklinkCount(noteId: string): number
  getBacklinks(noteId: string): Set<string>
  buildFromScratch(notes: Note[]): void
}
```

**On note save:** Parse links from that single note's content, diff old vs new outlinks, update both maps.
**On note delete:** Remove outlinks and clean up backlink references.
**Complexity:** O(k) per update where k = links in changed note. Full rebuild only on init.

## Deliverables Checklist
- [ ] Worker-based FlexSearch
- [ ] Virtualized NotesTable
- [ ] Virtualized NoteList
- [ ] Incremental BacklinksIndex
- [ ] docs/search/manual-perf.md
- [ ] Build passes with 0 errors
