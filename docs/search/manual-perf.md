# Manual Performance Test Checklist

## Prerequisites
- Dev server running (`npm run dev`)
- Browser DevTools open (Performance + Console tabs)
- At least 50+ notes seeded (for meaningful measurement)

## A) Search Worker

| # | Test | Pass Criteria |
|---|------|---------------|
| 1 | Open search dialog (Ctrl+K) | Opens instantly, no lag |
| 2 | Type a query while console is open | No `[Violation]` long task warnings on main thread |
| 3 | Rapid typing (10+ chars in <1s) | Results appear after typing stops (150ms debounce), no stutter |
| 4 | Search with no matches | "No notes found." displayed |
| 5 | Close and reopen dialog | No duplicate worker initialization (check Network tab for workers) |
| 6 | Create a new note, then search for it | New note appears in results immediately (incremental upsert) |
| 7 | Delete a note, then search for it | Deleted note does NOT appear in results |

## B) List Virtualization — NotesTable

| # | Test | Pass Criteria |
|---|------|---------------|
| 1 | Open /notes page with 50+ notes | DOM has only ~15-20 row elements (not 50+), check via DevTools Elements |
| 2 | Scroll to bottom | Rows render smoothly, no blank gaps |
| 3 | Click a row | Opens the note (existing click handler works) |
| 4 | Right-click a row | Context menu appears with correct actions |
| 5 | Sort by any column | Table re-sorts, virtualization continues working |
| 6 | Apply a filter | Filtered rows re-virtualize correctly |
| 7 | Switch tabs (All/Inbox/Capture...) | Tab content virtualizes correctly |

## C) List Virtualization — NoteList

| # | Test | Pass Criteria |
|---|------|---------------|
| 1 | Open a sidebar section (Inbox, Capture, etc.) | NoteList renders with date group headers |
| 2 | Scroll through groups | Headers and notes render correctly |
| 3 | Click a note | Opens the note |
| 4 | Dropdown menu (three dots) | Works on visible rows |

## D) Backlinks Index

| # | Test | Pass Criteria |
|---|------|---------------|
| 1 | Open /notes — check Links column | Link counts shown (same as before) |
| 2 | Add a `[[wiki-link]]` in a note | Link count updates on save (no full page refresh needed) |
| 3 | Remove a wiki-link | Link count decreases |
| 4 | Delete a note with backlinks | Referring notes' counts update |
| 5 | Search dialog sublabel | Shows correct "X backlinks" text |

## E) Performance Profiling (Optional Deep Test)

| # | Test | Tool | Pass Criteria |
|---|------|------|---------------|
| 1 | Record performance trace while scrolling /notes | DevTools Performance tab | No frames >16ms, no long tasks |
| 2 | Record trace while typing in search | DevTools Performance tab | Main thread idle during search (work happens in worker) |
| 3 | Check memory with 100+ notes | DevTools Memory tab | No memory leaks on repeated search open/close |
| 4 | Check worker thread | DevTools Sources > Threads | Search worker listed as separate thread |
