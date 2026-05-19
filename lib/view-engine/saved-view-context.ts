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
 * Map ActivitySpace → SavedView["space"] for createSavedView calls.
 *
 * SavedView.space includes "library" (2026-05-19) — Library entity별 saved
 * view를 Library sidebar Views section에 통합 표시. contextKey는 entity별
 * ("tags-list" / "labels-list" 등) 그대로 사용하지만 space는 통합 "library".
 *
 * SavedView.space is "stone" | "notes" | "wiki" | "calendar" | "ontology"
 * | "books" | "library" | "all". "home" 은 saved views 없어 "all" fallback.
 */
export function getSavedViewSpaceForActivity(
  space: ActivitySpace | string,
): "stone" | "notes" | "wiki" | "calendar" | "ontology" | "books" | "library" | "all" {
  if (space === "notes") return "notes"
  if (space === "wiki") return "wiki"
  if (space === "calendar") return "calendar"
  if (space === "ontology") return "ontology"
  if (space === "books") return "books"
  if (space === "library") return "library"
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
