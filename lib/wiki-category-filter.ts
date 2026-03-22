/**
 * Lightweight external store for wiki category filter.
 * Sidebar sets the filter tag ID, WikiView reads it and applies.
 * Uses useSyncExternalStore for React integration.
 */

import { useSyncExternalStore } from "react"

let _filterTagId: string | null = null
const _listeners = new Set<() => void>()

function notify() {
  for (const fn of _listeners) fn()
}

/** Set the active wiki category filter (tag ID). Pass null to clear. */
export function setWikiCategoryFilter(tagId: string | null) {
  _filterTagId = tagId
  notify()
}

/** Get the current wiki category filter tag ID. */
export function getWikiCategoryFilter(): string | null {
  return _filterTagId
}

/** React hook to subscribe to wiki category filter changes. */
export function useWikiCategoryFilter(): string | null {
  return useSyncExternalStore(
    (cb) => { _listeners.add(cb); return () => _listeners.delete(cb) },
    () => _filterTagId,
    () => null
  )
}
