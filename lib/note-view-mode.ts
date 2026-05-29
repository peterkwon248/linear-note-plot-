/**
 * Lightweight external store for Note standalone view mode.
 *
 * Notes have no single "NotesView" container the way Wiki does (the notes
 * area is the always-mounted NotesTableView). This store lets the sidebar
 * "More" section put the notes primary area into a standalone Merge or Split
 * mode, which the layout renders as an absolute overlay over the primary
 * panel (mirroring the existing NoteSplitOverlay driven by
 * `note-split-mode.ts`).
 *
 * Mirrors the `wikiViewMode` getter / setter (unchanged-early-return) /
 * notify / useSyncExternalStore pattern in `wiki-view-mode.ts`.
 *
 * "default" = no standalone mode (regular notes list / editor).
 * "merge"   = standalone Merge mode (NoteMergePage overlay).
 * "split"   = standalone Split mode (NoteSplitPicker overlay → hands off to
 *             the existing NoteSplitPage via `setSplitTargetNoteId`).
 */

import { useSyncExternalStore } from "react"

export type NoteViewMode = "default" | "merge" | "split"

let _mode: NoteViewMode = "default"
let _listeners: Array<() => void> = []

function notify() {
  _listeners.forEach((fn) => fn())
}

export function getNoteViewMode(): NoteViewMode {
  return _mode
}

export function setNoteViewMode(mode: NoteViewMode): void {
  if (_mode === mode) return
  _mode = mode
  notify()
}

function subscribe(fn: () => void): () => void {
  _listeners.push(fn)
  return () => {
    _listeners = _listeners.filter((f) => f !== fn)
  }
}

/** React hook to subscribe to note view mode changes. */
export function useNoteViewMode(): NoteViewMode {
  return useSyncExternalStore(subscribe, getNoteViewMode, () => "default" as const)
}
