# Knowledge Features Plan

## Repository Architecture

### Note Storage
- **Store:** `lib/store.ts` — Zustand `usePlotStore` with `persist` middleware
- **Key:** `"plot-store"`, version 4
- **Data:** `state.notes: Note[]` (all notes in a flat array)

### Links / Backlinks Computation
- **`lib/backlinks.ts`** — `countBacklinks(noteId, allNotes)` and `buildBacklinksMap(allNotes)`
- **`components/note-detail-panel.tsx`** — local helpers `getBacklinkNotes()` and `getSuggestedLinks()` (match by shared tags, folder, category, status)
- Detection: `[[title]]` wiki-links + plain title mentions (titles > 3 chars)

### Note Detail Panel
- **File:** `components/note-detail-panel.tsx`
- **Sections:** Workflow action bar, metadata, backlinks, connections graph, suggested links
- **Width:** 420px side panel

### Note Editing
- **File:** `components/note-editor.tsx`
- **Implementation:** Plain `<input>` for title + `<textarea>` for content, 300ms debounce auto-save
- **No inline link suggestion** — raw textarea with no `[[` trigger or autocomplete

### Existing Query Functions (`lib/queries/notes.ts`)
- `getInboxNotes`, `getCaptureNotes`, `getPermanentNotes`, `getUnlinkedNotes`
- `computeInboxRank`, `computeReadyScore`, `isReadyToPromote`
- `needsReview` (7d), `isStaleSuggest` (14d), `getSnoozeTime`

---

## Feature Implementation Status

### Feature 3 — Promotion Suggestion: ALREADY COMPLETE
- `computeReadyScore()` with scoring: summary +2, tags +1, links +2, backlinks +2, headings +1, high priority +1
- `isReadyToPromote()` — threshold at score >= 5
- "Ready" badge on capture rows, inspector, and detail panel
- Promote button highlighted green when ready
- **No work needed.**

---

## Features to Implement

### Feature 1 — Daily Review Queue

**New files:**
| File | Purpose |
|------|---------|
| `app/(app)/review/page.tsx` | Review queue page |

**Modified files:**
| File | Change |
|------|--------|
| `lib/queries/notes.ts` | Add `getReviewQueue()` function |
| `components/linear-sidebar.tsx` | Add "Review" nav link with badge count |

**Query logic (`getReviewQueue`):**
Compose from existing helpers, return prioritized list:
1. Inbox untriaged (`stage=inbox`, `triageStatus=untriaged`)
2. Snoozed due (`stage=inbox`, `triageStatus=snoozed`, `reviewAt <= now`)
3. Stale capture (`stage=capture`, `lastTouchedAt > 7 days`) — use `needsReview()`
4. Unlinked permanent (`stage=permanent`, `links === 0`) — use `countBacklinks()`

**UI:** Reuse existing table layout pattern. Group by reason (section headers).

---

### Feature 2 — Backlink Suggestion (in Editor)

**New files:**
| File | Purpose |
|------|---------|
| `components/link-suggestion.tsx` | Suggestion popup component |

**Modified files:**
| File | Change |
|------|--------|
| `lib/queries/notes.ts` | Add `suggestLinks(text, notes, currentNoteId)` function |
| `components/note-editor.tsx` | Add suggestion trigger on typing, show popup below textarea |

**Logic (`suggestLinks`):**
- Split current line/word being typed
- Match against all note titles (case-insensitive, partial match)
- Exclude current note
- Return top 5 matches

**UI:** Small dropdown below cursor position, click to insert `[[Title]]` at cursor.

---

### Feature 4 — Thinking Chain

**Modified files:**
| File | Change |
|------|--------|
| `lib/types.ts` | Add `parentNoteId?: string \| null` to Note interface |
| `lib/store.ts` | Migrate to version 5 (add `parentNoteId: null` default), add `createChainNote(parentId)` action |
| `components/note-detail-panel.tsx` | Add "Previous Note" / "Next Note" navigation |
| `components/note-editor.tsx` | Add Shift+Enter shortcut to create chain note |
| `components/note-inspector.tsx` | Show chain context (parent/child info) |

**Data model:**
- `parentNoteId: string | null` — points to previous note in chain
- Child = any note where `parentNoteId === currentNote.id`
- Chain = linked list traversal (parent → current → child)

**Navigation UI:** Small bar in detail panel: `← Previous Note | Next →`

**Keyboard:** `Shift+Enter` in editor → `createChainNote(currentNoteId)` → focus new note

---

## Summary

| Feature | Status | Work Required |
|---------|--------|---------------|
| 1. Daily Review Queue | New | Query + route + sidebar link |
| 2. Backlink Suggestion | New (editor) | Title matching + popup in editor |
| 3. Promotion Suggestion | ✅ Complete | None |
| 4. Thinking Chain | New | Type change + store migration + UI |
