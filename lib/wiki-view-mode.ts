/**
 * Lightweight external store for Wiki View mode switching.
 * Allows sidebar to control WikiView's display mode (dashboard vs list).
 * Follows the same pattern as table-route.ts.
 */

import { useSyncExternalStore } from "react"

export type WikiViewMode = "dashboard" | "list" | "merge" | "split"

let _mode: WikiViewMode = "dashboard"
let _listeners: Array<() => void> = []

function notify() {
  _listeners.forEach((fn) => fn())
}

export function getWikiViewMode(): WikiViewMode {
  return _mode
}

export function setWikiViewMode(mode: WikiViewMode): void {
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

/** React hook to subscribe to wiki view mode changes. */
export function useWikiViewMode(): WikiViewMode {
  return useSyncExternalStore(subscribe, getWikiViewMode, () => "dashboard" as const)
}

/* ── Pending Merge IDs (for multi-select merge from floating action bar) ── */

let _pendingMergeIds: string[] = []

export function setPendingMergeIds(ids: string[]): void {
  _pendingMergeIds = ids
}

export function consumePendingMergeIds(): string[] {
  const result = _pendingMergeIds
  _pendingMergeIds = []
  return result
}
