/**
 * Lightweight external store for Note Split target.
 * When non-null, the workspace renders <NoteSplitPage noteId={...} /> instead
 * of the regular NoteEditor for that note. Mirrors the wiki-view-mode pattern.
 */

import { useSyncExternalStore } from "react"

let _targetNoteId: string | null = null
let _listeners: Array<() => void> = []

function notify() {
  _listeners.forEach((fn) => fn())
}

export function getSplitTargetNoteId(): string | null {
  return _targetNoteId
}

export function setSplitTargetNoteId(id: string | null): void {
  if (_targetNoteId === id) return
  _targetNoteId = id
  notify()
}

function subscribe(fn: () => void): () => void {
  _listeners.push(fn)
  return () => {
    _listeners = _listeners.filter((f) => f !== fn)
  }
}

/** React hook to subscribe to split target note id changes. */
export function useSplitTargetNoteId(): string | null {
  return useSyncExternalStore(subscribe, getSplitTargetNoteId, () => null)
}
