"use client"

import { useMemo, useCallback } from "react"
import { usePlotStore } from "../store"
import type { ViewState, ViewContextKey } from "./types"
import { buildViewStateForContext } from "./defaults"
import type { Tag } from "../types"

/**
 * Tags-list pipeline result. Mirrors UseTemplatesViewResult shape so
 * consumers can swap with minimal friction.
 *
 * Scope guard: deliberately does NOT reuse `applyFilters / applySort /
 * applyGrouping` from the notes pipeline — those are typed against `Note`
 * and would require generic refactoring (=scope creep). Thin tags-only
 * implementations live here.
 *
 * Context: `tags-list` (Tag entity index at /library/tags).
 * Do NOT confuse with `tag` context which is the per-tag note-list view.
 */
export interface TagGroup {
  key: string
  label: string
  tags: Tag[]
}

/** Each tag enriched with its derived noteCount (not persisted on Tag). */
export interface TagWithCount extends Tag {
  noteCount: number
}

export interface UseTagsViewResult {
  groups: TagGroup[]
  flatTags: TagWithCount[]
  flatCount: number
  totalCount: number
  viewState: ViewState
  updateViewState: (patch: Partial<ViewState>) => void
  isHydrated: boolean
}

/* ── Stage 1: Search ──────────────────────────────────── */

function applyTagSearch(tags: TagWithCount[], query: string): TagWithCount[] {
  const q = query.trim().toLowerCase()
  if (!q) return tags
  return tags.filter((t) => t.name.toLowerCase().includes(q))
}

/* ── Stage 2: Sort ────────────────────────────────────── */

function applyTagSort(tags: TagWithCount[], viewState: ViewState): TagWithCount[] {
  if (tags.length <= 1) return tags
  const rules = viewState.sortFields.length > 0
    ? viewState.sortFields
    : [{ field: "name" as const, direction: "asc" as const }]

  return [...tags].sort((a, b) => {
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

function applyTagGrouping(tags: TagWithCount[]): TagGroup[] {
  // Tags-list only supports groupBy="none" in PR group-c-d-1.
  // Future PRs can add groupBy="color" etc. without touching this hook's
  // interface — just extend this function.
  return [{ key: "_all", label: "", tags }]
}

/* ── Hook ──────────────────────────────────────────────── */

/**
 * Tags-list pipeline hook. Wraps the tags-only search/sort/group stages
 * with staged useMemo so individual pipeline stages don't recompute on
 * unrelated viewState changes (mirrors useTemplatesView).
 *
 * `contextKey` is locked to "tags-list" — passing it explicitly keeps the
 * call site consistent with useNotesView/useTemplatesView.
 */
export function useTagsView(contextKey: ViewContextKey = "tags-list"): UseTagsViewResult {
  const tags = usePlotStore((s) => s.tags)
  const notes = usePlotStore((s) => s.notes)
  const viewState = usePlotStore((s) => s.viewStateByContext[contextKey]) ?? buildViewStateForContext(contextKey)
  const isHydrated = usePlotStore((s) => s._viewStateHydrated)
  const searchQuery = usePlotStore((s) => s.searchQuery)
  const setViewState = usePlotStore((s) => s.setViewState)

  // Stage 0: active (non-trashed) tags only
  const activeTags = useMemo(() => tags.filter((t) => !t.trashed), [tags])
  const totalCount = activeTags.length

  // Stage 0b: derive noteCount per tag. Notes are filtered to non-trashed
  // to match the tags-view.tsx existing `tagCounts` logic.
  const tagsWithCount = useMemo((): TagWithCount[] => {
    // Build a noteCount per tag in one pass
    const countMap: Record<string, number> = {}
    for (const tag of activeTags) {
      countMap[tag.id] = 0
    }
    for (const n of notes) {
      if (n.trashed) continue
      for (const tid of n.tags) {
        if (tid in countMap) countMap[tid]++
      }
    }
    return activeTags.map((t) => ({ ...t, noteCount: countMap[t.id] ?? 0 }))
  }, [activeTags, notes])

  // Stage 1: search (tag name case-insensitive)
  const searched = useMemo(
    () => applyTagSearch(tagsWithCount, searchQuery),
    [tagsWithCount, searchQuery],
  )

  // Stage 2: sort
  const sorted = useMemo(
    () => applyTagSort(searched, viewState),
    [searched, viewState],
  )

  // Stage 3: group (none-only in this PR)
  const groups = useMemo(
    () => applyTagGrouping(sorted),
    [sorted],
  )

  const updateViewState = useCallback(
    (patch: Partial<ViewState>) => setViewState(contextKey, patch),
    [setViewState, contextKey],
  )

  return {
    groups,
    flatTags: sorted,
    flatCount: sorted.length,
    totalCount,
    viewState,
    updateViewState,
    isHydrated,
  }
}
