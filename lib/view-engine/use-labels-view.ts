"use client"

import { useMemo, useCallback } from "react"
import { usePlotStore } from "../store"
import type { ViewState, ViewContextKey } from "./types"
import { buildViewStateForContext } from "./defaults"
import type { Label } from "../types"

/**
 * Labels-list pipeline result. Mirrors UseTagsViewResult shape so
 * consumers can swap with minimal friction.
 *
 * Scope guard: deliberately does NOT reuse `applyFilters / applySort /
 * applyGrouping` from the notes pipeline — those are typed against `Note`
 * and would require generic refactoring (=scope creep). Thin labels-only
 * implementations live here.
 *
 * Context: `labels-list` (Label entity index at /labels).
 * Do NOT confuse with `label` context which is the per-label note-list view.
 *
 * Key differences from useTagsView:
 *   - Label.color is `string` (non-nullable) — Tag.color is `string | null`.
 *     No getEntityColor() fallback needed; label.color can be used directly.
 *   - noteCount via Note.labelId (string | undefined, 1:1 single-label per note)
 *     vs. Tag's Note.tags (string[], N:M). Single-pass countMap differs accordingly.
 */
export interface LabelGroup {
  key: string
  label: string
  labels: Label[]
}

/** Each label enriched with its derived noteCount (not persisted on Label). */
export interface LabelWithCount extends Label {
  noteCount: number
}

export interface UseLabelsViewResult {
  groups: LabelGroup[]
  flatLabels: LabelWithCount[]
  flatCount: number
  totalCount: number
  viewState: ViewState
  updateViewState: (patch: Partial<ViewState>) => void
  isHydrated: boolean
}

/* ── Stage 1: Search ──────────────────────────────────── */

function applyLabelSearch(labels: LabelWithCount[], query: string): LabelWithCount[] {
  const q = query.trim().toLowerCase()
  if (!q) return labels
  return labels.filter((l) => l.name.toLowerCase().includes(q))
}

/* ── Stage 2: Sort ────────────────────────────────────── */

function applyLabelSort(labels: LabelWithCount[], viewState: ViewState): LabelWithCount[] {
  if (labels.length <= 1) return labels
  const rules = viewState.sortFields.length > 0
    ? viewState.sortFields
    : [{ field: "name" as const, direction: "asc" as const }]

  return [...labels].sort((a, b) => {
    for (const rule of rules) {
      const dir = rule.direction === "asc" ? 1 : -1
      let r = 0
      switch (rule.field) {
        case "name":
        case "title":
          r = dir * a.name.localeCompare(b.name)
          break
        case "noteCount":
          // noteCount desc by default (more → top)
          r = dir * (a.noteCount - b.noteCount)
          break
        default:
          r = 0
      }
      if (r !== 0) return r
    }
    return 0
  })
}

/* ── Stage 3: Group ───────────────────────────────────── */

function applyLabelGrouping(labels: LabelWithCount[]): LabelGroup[] {
  // Labels-list only supports groupBy="none" in PR group-c-d-2.
  // Future PRs can add groupBy="color" etc. without touching this hook's
  // interface — just extend this function.
  return [{ key: "_all", label: "", labels }]
}

/* ── Hook ──────────────────────────────────────────────── */

/**
 * Labels-list pipeline hook. Wraps the labels-only search/sort/group stages
 * with staged useMemo so individual pipeline stages don't recompute on
 * unrelated viewState changes (mirrors useTagsView).
 *
 * `contextKey` is locked to "labels-list" — passing it explicitly keeps the
 * call site consistent with useNotesView/useTagsView.
 */
export function useLabelsView(contextKey: ViewContextKey = "labels-list"): UseLabelsViewResult {
  const labels = usePlotStore((s) => s.labels)
  const notes = usePlotStore((s) => s.notes)
  const viewState = usePlotStore((s) => s.viewStateByContext[contextKey]) ?? buildViewStateForContext(contextKey)
  const isHydrated = usePlotStore((s) => s._viewStateHydrated)
  const searchQuery = usePlotStore((s) => s.searchQuery)
  const setViewState = usePlotStore((s) => s.setViewState)

  // Stage 0: active (non-trashed) labels only
  const activeLabels = useMemo(() => labels.filter((l) => !l.trashed), [labels])
  const totalCount = activeLabels.length

  // Stage 0b: derive noteCount per label. Notes are filtered to non-trashed.
  // Label uses Note.labelId (1:1 single-label, string | undefined) — not arrays.
  // One pass: increment countMap[n.labelId] for each non-trashed note that has a labelId.
  const labelsWithCount = useMemo((): LabelWithCount[] => {
    const countMap: Record<string, number> = {}
    for (const label of activeLabels) {
      countMap[label.id] = 0
    }
    for (const n of notes) {
      if (n.trashed) continue
      if (n.labelId && n.labelId in countMap) {
        countMap[n.labelId]++
      }
    }
    return activeLabels.map((l) => ({ ...l, noteCount: countMap[l.id] ?? 0 }))
  }, [activeLabels, notes])

  // Stage 1: search (label name case-insensitive)
  const searched = useMemo(
    () => applyLabelSearch(labelsWithCount, searchQuery),
    [labelsWithCount, searchQuery],
  )

  // Stage 2: sort
  const sorted = useMemo(
    () => applyLabelSort(searched, viewState),
    [searched, viewState],
  )

  // Stage 3: group (none-only in this PR)
  const groups = useMemo(
    () => applyLabelGrouping(sorted),
    [sorted],
  )

  const updateViewState = useCallback(
    (patch: Partial<ViewState>) => setViewState(contextKey, patch),
    [setViewState, contextKey],
  )

  return {
    groups,
    flatLabels: sorted,
    flatCount: sorted.length,
    totalCount,
    viewState,
    updateViewState,
    isHydrated,
  }
}
