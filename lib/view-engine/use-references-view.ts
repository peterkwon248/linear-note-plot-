"use client"

import { useMemo, useCallback } from "react"
import { usePlotStore } from "../store"
import type { ViewState, ViewContextKey, FilterRule } from "./types"
import { buildViewStateForContext } from "./defaults"
import type { Reference } from "../types"

/**
 * References-list pipeline result. Mirrors UseTagsViewResult /
 * UseLabelsViewResult / UseStickersViewResult shape so consumers can swap
 * with minimal friction.
 *
 * Scope guard: deliberately does NOT reuse `applyFilters / applySort /
 * applyGrouping` from the notes pipeline — those are typed against `Note`
 * and would require generic refactoring (=scope creep). Thin references-only
 * implementations live here.
 *
 * Context: `references` (Reference entity index at /library/references).
 *
 * Design decision (PR group-c-d-4):
 *   - Reference is a **rich entity** (title + content + fields + tags +
 *     imageUrl) — first non-Note entity in this series.
 *   - The hook accepts a **pre-filtered** Reference[] from the caller.
 *     ReferencesView keeps its existing local quickFilter (all / linked /
 *     unlinked / links) + fieldKey filter + search state — multi-state
 *     toggle UI doesn't fit `viewState.toggles` (boolean record). Future
 *     PR can lift those into `viewState.filters`.
 *   - The hook owns **sort + group + viewState persist** only.
 *   - Each enriched ref gets derived `fieldCount` / `hasImage` / `refType`
 *     so cards/sort don't need to recompute per-row.
 */

/** Inferred reference shape: "link" if any field key matches "url" (case
 *  insensitive), else "citation". Mirrors existing groupBy="type" logic
 *  in library-view.tsx. */
export type RefType = "link" | "citation"

/** Each reference enriched with derived metadata (not persisted on Reference). */
export interface ReferenceWithMeta extends Reference {
  fieldCount: number
  hasImage: boolean
  refType: RefType
}

export interface ReferenceGroup {
  key: string
  label: string
  refs: ReferenceWithMeta[]
}

export interface UseReferencesViewResult {
  groups: ReferenceGroup[]
  flatRefs: ReferenceWithMeta[]
  flatCount: number
  totalCount: number
  viewState: ViewState
  updateViewState: (patch: Partial<ViewState>) => void
  isHydrated: boolean
}

/* ── Stage 0: Enrich ──────────────────────────────────── */

function enrich(refs: Reference[]): ReferenceWithMeta[] {
  return refs.map((r) => {
    const fieldCount = r.fields?.length ?? 0
    const hasImage = !!r.imageUrl
    const refType: RefType = (r.fields ?? []).some((f) => f.key.trim().toLowerCase() === "url")
      ? "link"
      : "citation"
    return { ...r, fieldCount, hasImage, refType }
  })
}

/* ── Stage 0.5: Filter (Path-A-Step-2) ────────────────── */

function applyRefFilters(refs: ReferenceWithMeta[], filters: FilterRule[]): ReferenceWithMeta[] {
  if (filters.length === 0) return refs
  const byField = new Map<string, FilterRule[]>()
  for (const r of filters) {
    if (!byField.has(r.field)) byField.set(r.field, [])
    byField.get(r.field)!.push(r)
  }
  return refs.filter((ref) => {
    for (const [field, rules] of byField) {
      // OR within field
      const matchesAny = rules.some((rule) => {
        if (field === "type") {
          return rule.value === ref.refType
        }
        return false // unknown field → no-op (fail open)
      })
      if (!matchesAny) return false // AND across fields
    }
    return true
  })
}

/* ── Stage 1: Sort ────────────────────────────────────── */

function applyRefSort(refs: ReferenceWithMeta[], viewState: ViewState): ReferenceWithMeta[] {
  if (refs.length <= 1) return refs
  const rules = viewState.sortFields.length > 0
    ? viewState.sortFields
    : [{ field: "updatedAt" as const, direction: "desc" as const }]

  return [...refs].sort((a, b) => {
    for (const rule of rules) {
      const dir = rule.direction === "asc" ? 1 : -1
      let r = 0
      switch (rule.field) {
        case "title":
        case "name":
          r = dir * (a.title || "").localeCompare(b.title || "")
          break
        case "createdAt":
          r = dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          break
        case "updatedAt":
          r = dir * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())
          break
        case "fieldCount":
          // fieldCount desc default (more fields → top)
          r = dir * (a.fieldCount - b.fieldCount)
          break
        default:
          r = 0
      }
      if (r !== 0) return r
    }
    return 0
  })
}

/* ── Stage 2: Group ───────────────────────────────────── */

function applyRefGrouping(refs: ReferenceWithMeta[]): ReferenceGroup[] {
  // References-list only supports groupBy="none" in PR group-c-d-4.
  // Future PRs can add groupBy="type" (link/citation) or groupBy="fieldKey"
  // (matching the existing local-state logic in ReferencesView) — extend
  // this function only.
  return [{ key: "_all", label: "", refs }]
}

/* ── Hook ──────────────────────────────────────────────── */

/**
 * References-list pipeline hook. Wraps sort/group stages with staged
 * useMemo so individual pipeline stages don't recompute on unrelated
 * viewState changes (mirrors useTagsView / useLabelsView / useStickersView).
 *
 * `contextKey` is locked to "references" — passing it explicitly keeps the
 * call site consistent with sibling hooks.
 *
 * Caller passes a pre-filtered `Reference[]` (after applying local
 * quickFilter / fieldKey filter / search). The hook handles enrichment
 * (fieldCount / hasImage / refType), sort, and group.
 */
export function useReferencesView(
  filteredRefs: Reference[],
  contextKey: ViewContextKey = "references",
): UseReferencesViewResult {
  const viewState = usePlotStore((s) => s.viewStateByContext[contextKey]) ?? buildViewStateForContext(contextKey)
  const isHydrated = usePlotStore((s) => s._viewStateHydrated)
  const setViewState = usePlotStore((s) => s.setViewState)

  // Stage 0: enrich — derived fieldCount / hasImage / refType
  const enriched = useMemo(() => enrich(filteredRefs), [filteredRefs])

  // Stage 0.5: filter (Path-A-Step-2 — type filter from viewState.filters)
  const postFilter = useMemo(
    () => applyRefFilters(enriched, viewState.filters),
    [enriched, viewState.filters],
  )

  // Stage 1: sort
  const sorted = useMemo(
    () => applyRefSort(postFilter, viewState),
    [postFilter, viewState],
  )

  // Stage 2: group (none-only in this PR)
  const groups = useMemo(
    () => applyRefGrouping(sorted),
    [sorted],
  )

  const updateViewState = useCallback(
    (patch: Partial<ViewState>) => setViewState(contextKey, patch),
    [setViewState, contextKey],
  )

  return {
    groups,
    flatRefs: sorted,
    flatCount: sorted.length,
    totalCount: filteredRefs.length,
    viewState,
    updateViewState,
    isHydrated,
  }
}
