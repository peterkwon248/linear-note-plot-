/**
 * Helpers for Saved View snapshot UX.
 *
 * Resolve the active ViewContextKey from a (space, route) pair so we can read
 * the current viewState (in viewStateByContext) when:
 *  - User clicks sidebar "+ New view" → capture current state, not empty default
 *  - User clicks ViewHeader "Save view" → same
 *  - User right-clicks a saved view → "Update view" (overwrite with current state)
 *
 * Notes space is dynamic (folder/tag/label/savedView). The resolver returns the
 * narrowest applicable key; consumers may fall back to "all" when in doubt.
 */

import type { ActivitySpace } from "../types"
import type { ViewContextKey } from "./types"

/**
 * Resolve the ViewContextKey currently in effect for a given space + route.
 *
 * Used by Saved Views snapshot UX:
 * - "+ New view" should capture *this* context's state, not a fresh default
 * - "Save view" / "Update view" likewise need to know which slice to read
 *
 * Notes space routes:
 *   /notes              → "all"
 *   /inbox              → "inbox"
 *   /capture            → "capture"
 *   /permanent          → "permanent"
 *   /pinned             → "pinned"
 *   /trash              → "trash"
 *   /folder/[id]        → "folder"
 *   /tag/[id]           → "tag"
 *   /label/[id]         → "label"
 *
 * Other spaces:
 *   wiki                → "wiki"
 *   ontology            → "graph"
 *   calendar            → "calendar"
 */
export function getCurrentViewContextKey(
  space: ActivitySpace | string,
  route: string | null,
): ViewContextKey {
  if (space === "wiki") return "wiki"
  if (space === "ontology") return "graph"
  if (space === "calendar") return "calendar"

  // Notes space — route-based
  if (!route) return "all"
  if (route === "/inbox") return "inbox"
  if (route === "/capture") return "capture"
  if (route === "/permanent") return "permanent"
  if (route === "/pinned") return "pinned"
  if (route === "/trash") return "trash"
  if (route.startsWith("/folder/")) return "folder"
  if (route.startsWith("/tag/")) return "tag"
  if (route.startsWith("/label/")) return "label"
  return "all"
}

/**
 * Map ActivitySpace → SavedView["space"] for createSavedView calls.
 *
 * SavedView.space is a narrower type ("inbox" | "notes" | "wiki" | "calendar"
 * | "ontology" | "all"); ActivitySpace includes "home" and "library" which
 * don't have saved views. Defaults to "all" for unknown spaces.
 */
export function getSavedViewSpaceForActivity(
  space: ActivitySpace | string,
): "inbox" | "notes" | "wiki" | "calendar" | "ontology" | "all" {
  if (space === "notes") return "notes"
  if (space === "wiki") return "wiki"
  if (space === "calendar") return "calendar"
  if (space === "ontology") return "ontology"
  return "all"
}

/**
 * Shallow-equal two viewStates for "dirty" detection.
 *
 * Compares the structural fields a SavedView captures: viewMode, sortField,
 * sortDirection, groupBy, filters, visibleColumns, showEmptyGroups. Toggles
 * (per-context flags like showWikilinks) are intentionally ignored — they're
 * not part of the persisted SavedView shape.
 *
 * Returns true when the two states match (no save needed); false when they
 * differ (Save button should be active).
 */
export function viewStateEquals(
  a: Record<string, unknown> | null | undefined,
  b: Record<string, unknown> | null | undefined,
): boolean {
  if (!a || !b) return a === b
  const keys = ["viewMode", "sortField", "sortDirection", "groupBy", "showEmptyGroups"] as const
  for (const k of keys) {
    if (a[k] !== b[k]) return false
  }
  // Filters: array of {field, operator, value}
  const af = (a.filters as unknown[]) ?? []
  const bf = (b.filters as unknown[]) ?? []
  if (af.length !== bf.length) return false
  for (let i = 0; i < af.length; i++) {
    const x = af[i] as Record<string, unknown>
    const y = bf[i] as Record<string, unknown>
    if (x?.field !== y?.field || x?.operator !== y?.operator || x?.value !== y?.value) {
      return false
    }
  }
  // visibleColumns: array of strings
  const ac = (a.visibleColumns as string[]) ?? []
  const bc = (b.visibleColumns as string[]) ?? []
  if (ac.length !== bc.length) return false
  for (let i = 0; i < ac.length; i++) {
    if (ac[i] !== bc[i]) return false
  }
  return true
}
