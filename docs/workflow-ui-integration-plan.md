# Workflow UI Integration Plan

## Architecture Overview

### Note Detail Panel
- **File:** `components/note-detail-panel.tsx`
- **Role:** 420px side panel showing note preview, metadata, backlinks, connections graph
- **Contains:** Stage-aware WorkflowBar at top (inbox: Keep/Snooze/Trash, capture: Promote/Back, permanent: Demote)
- **Props:** `noteId`, `onClose`, `onOpenNote`, `onEditNote`, `onTriageAction`, `embedded`

### Notes Table
- **File:** `components/notes-table.tsx`
- **Role:** Full table view on `/notes` with sorting, filtering, context tabs (All/Capture/Reference/Permanent/Unlinked)
- **Contains:** Right-click ContextMenu with stage-aware actions per row
- **Props:** `onRowClick`, `activePreviewId`

### Note Inspector
- **File:** `components/note-inspector.tsx`
- **Role:** 320px editor-side panel showing metadata, workflow actions, outline, properties
- **Contains:** Inline workflow action buttons per stage

### selectedNoteId Handling
- **Store field:** `selectedNoteId` in `lib/store.ts` (Zustand + persist)
- **Set by:** `setSelectedNoteId(id)`, `openNote(id)` (also increments reads)
- **Cleared by:** ESC key handler in `app/(app)/layout.tsx`, close buttons in panels
- **Used by:** Page components to toggle between table/list view and editor view

### Stage-Specific Pages
| Page | File | Uses |
|------|------|------|
| Inbox | `app/(app)/inbox/page.tsx` | `getInboxNotes`, custom InboxRow, InboxDetailPanel with triage bar |
| Capture | `app/(app)/capture/page.tsx` | `getCaptureNotes`, readyScore, stale detection, CaptureDetailPanel |
| Permanent | `app/(app)/permanent/page.tsx` | `getPermanentNotes`, orphan detection, NoteDetailPanel |

---

## Implementation Status

### COMPLETED (already implemented)

#### Step 2 — Inbox Triage Bar
- `note-detail-panel.tsx`: WorkflowBar with Keep/Snooze(dropdown)/Trash + kbd hints (K/S/T)
- `note-inspector.tsx`: Inline Keep/Snooze/Trash buttons
- `inbox/page.tsx`: InboxDetailPanel with bottom triage bar
- Condition: `note.stage === "inbox" && note.triageStatus !== "trashed"`

#### Step 3 — Auto Select Next Inbox Note
- `note-detail-panel.tsx`: `advanceToNext()` — finds next inbox note after triage, calls `onOpenNote`
- `inbox/page.tsx`: `goNext(currentId)` — advances `previewId` to adjacent note
- `note-inspector.tsx`: `advanceToNextInbox()` — updates `selectedNoteId` to next inbox note
- If no more inbox notes → deselects / closes panel

#### Step 4 — Capture Promotion Suggestion
- `note-detail-panel.tsx`: Ready score display, Promote button (highlighted green when ready)
- `capture/page.tsx`: "Ready" badge on rows, inline Promote button, CaptureDetailPanel with ready score
- `note-inspector.tsx`: "Ready to promote" badge when `isReadyToPromote` returns true
- Uses `computeReadyScore`, `isReadyToPromote` from `lib/queries/notes.ts`

#### Step 5 — Stale Capture Banner
- `note-detail-panel.tsx`: 7-day warning banner + 14-day "Move back to Inbox?" banner with action button
- `note-inspector.tsx`: Same banners
- `capture/page.tsx`: Stale suggestion banner per row (14+ days)
- Uses `needsReview` (7d) and `isStaleSuggest` (14d) from `lib/queries/notes.ts`

#### Step 7 — Keyboard Shortcuts
- `note-detail-panel.tsx`: K/S/T (inbox), P/B (capture), D (permanent) — with input/textarea/dialog guard
- `inbox/page.tsx`: K/S/T when preview active
- `capture/page.tsx`: P/B when preview active
- `permanent/page.tsx`: D when preview active

### REMAINING (to implement)

#### Step 6 — Unlinked Helper Message
- **File to modify:** `components/notes-table.tsx`
- **Current state:** Unlinked tab filters notes via `getUnlinkedNotes()`. Each row has a tooltip on the link icon ("Add at least 1 link to reduce orphan notes"). Empty state is generic ("No notes found").
- **Gap:** No dedicated helper banner/message when viewing the Unlinked tab explaining why linking matters.
- **Plan:** Add a description bar below the Unlinked tab header (similar to capture/permanent pages) with the message: "These notes have no links. Add [[wiki-links]] to connect them to your knowledge graph."

---

## Files to Modify

| File | Change |
|------|--------|
| `components/notes-table.tsx` | Add Unlinked tab helper message |

No other files need modification. All other steps are complete.
