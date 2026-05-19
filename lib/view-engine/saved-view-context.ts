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
 *   /stone              → "stone"
 *   /brick              → "brick"
 *   /keystone           → "keystone"
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
  // Library sub-route with own view (Plan A++ Phase 1) — must come BEFORE the
  // generic `space === "library"` paths since activeSpace for this route is
  // "library" via inferSpace().
  if (route === "/library/categories") return "library-categories"
  if (space === "wiki") return "wiki"
  if (space === "ontology") return "graph"
  if (space === "calendar") return "calendar"

  // Notes space — route-based
  if (!route) return "all"
  if (route === "/stone") return "stone"
  if (route === "/brick") return "brick"
  if (route === "/keystone") return "keystone"
  if (route === "/pinned") return "pinned"
  if (route === "/trash") return "trash"
  if (route.startsWith("/folder/")) return "folder"
  if (route.startsWith("/tag/")) return "tag"
  if (route.startsWith("/label/")) return "label"
  return "all"
}

/**
 * Map (ActivitySpace, route) → SavedView["space"] for createSavedView calls.
 *
 * Plan A++ Phase 2 (2026-05-19): Library hub은 cross-entity 분류 hub로 own
 * view 없음 — own view를 갖는 유일한 sub-entity는 Categories (hierarchy +
 * grouping 본질). 따라서 SavedView.space "library"는 폐기되고, /library/
 * categories만 own space "library-categories"를 가짐. 다른 Library sub-route
 * (Tags / Labels / Files / References / Stickers)는 own view 없음 — "all"로
 * fallback (sidebar Views section 없음).
 *
 * SavedView.space is "stone" | "notes" | "wiki" | "calendar" | "ontology"
 * | "books" | "library-categories" | "all".
 */
export function getSavedViewSpaceForActivity(
  space: ActivitySpace | string,
  route?: string | null,
): "stone" | "notes" | "wiki" | "calendar" | "ontology" | "books" | "library-categories" | "all" {
  // Library sub-route with own view — checked before generic "library" fall-
  // through since activeSpace for /library/categories is "library".
  if (route === "/library/categories") return "library-categories"
  if (space === "notes") return "notes"
  if (space === "wiki") return "wiki"
  if (space === "calendar") return "calendar"
  if (space === "ontology") return "ontology"
  if (space === "books") return "books"
  return "all"
}

/**
 * Shallow-equal two viewStates for "dirty" detection.
 *
 * Compares the structural fields a SavedView captures: viewMode, sortField,
 * sortDirection, groupBy, filters, visibleColumns, showEmptyGroups, and the
 * `toggles` map (for showAlphaIndex on lists, plus graph-only flags like
 * showWikilinks/showTagNodes). Saved views persist toggles too, so changes
 * there must trigger Save view's dirty state.
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
  // toggles: shallow-equal map of boolean flags. Compares every key on both
  // sides (no key-order dependence). Empty/missing toggles treated as {}.
  const at = (a.toggles as Record<string, boolean> | undefined) ?? {}
  const bt = (b.toggles as Record<string, boolean> | undefined) ?? {}
  const atKeys = Object.keys(at)
  const btKeys = Object.keys(bt)
  if (atKeys.length !== btKeys.length) return false
  for (const k of atKeys) {
    if (at[k] !== bt[k]) return false
  }
  return true
}
