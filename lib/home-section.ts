/**
 * @deprecated Since PR 7. Heavy Home insights (Orphans / Unresolved Links / Unlinked
 * Mentions / Suggestions) moved to Ontology > Insights. Home no longer has a
 * drill-down router — it is a single-page workflow surface.
 *
 * This module is kept as a no-op stub for back-compat with any caller that still
 * imports `setHomeSection` (currently: activity-bar.tsx during space switch).
 * It can be removed once all callers are cleaned up.
 *
 * Lightweight external store for Home view section drill-down.
 * Same pattern as lib/table-route.ts — synchronous updates, no React state.
 * Components subscribe via useSyncExternalStore.
 */

import { useSyncExternalStore } from "react"

export type HomeSection =
  | "overview"
  | "unlinked"
  | "suggestions"
  | "redlinks"
  | "orphans"

let _section: HomeSection = "overview"
let _listeners: Array<() => void> = []

function notify() {
  _listeners.forEach((fn) => fn())
}

export function getHomeSection(): HomeSection {
  return _section
}

/** Set active section. Clicking the same section toggles back to overview. */
export function setHomeSection(s: HomeSection): void {
  if (_section === s) {
    _section = "overview"
    notify()
    return
  }
  _section = s
  notify()
}

export function useHomeSection(): HomeSection {
  return useSyncExternalStore(
    (cb) => {
      _listeners.push(cb)
      return () => {
        _listeners = _listeners.filter((f) => f !== cb)
      }
    },
    getHomeSection,
    () => "overview" as HomeSection,
  )
}
