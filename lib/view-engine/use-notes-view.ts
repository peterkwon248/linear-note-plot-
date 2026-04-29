"use client"

import { useMemo, useCallback } from "react"
import { usePlotStore } from "../store"
import type { ViewState, ViewContextKey, PipelineExtras, NoteGroup } from "./types"
import { buildViewStateForContext } from "./defaults"
import { applyContext } from "./context-filter"
import { applyFilters } from "./filter"
import { applySearch } from "./search"
import { applySort } from "./sort"
import { applyGrouping } from "./group"
import type { Note } from "../types"

interface UseNotesViewResult {
  /** Grouped notes (for rendering grouped lists/tables) */
  groups: NoteGroup[]
  /** Flat sorted notes (for non-grouped rendering) */
  flatNotes: Note[]
  /** Number of notes after all filters */
  flatCount: number
  /** Total notes before context filter */
  totalCount: number
  /** Current view state for this context */
  viewState: ViewState
  /** Update view state (partial merge) */
  updateViewState: (patch: Partial<ViewState>) => void
  /** Whether view state has been hydrated from IDB */
  isHydrated: boolean
}

/**
 * React hook for the view engine pipeline with staged memoization.
 *
 * Each pipeline stage has its own useMemo, so changing sort doesn't
 * re-run filtering, and changing filters doesn't re-run context filtering.
 *
 * @param contextKey - Which context this view represents
 * @param extras - Additional data (backlinksMap, folderId, etc.)
 */
export function useNotesView(
  contextKey: ViewContextKey,
  extras?: PipelineExtras
): UseNotesViewResult {
  // ── Store selectors (fine-grained subscriptions) ──────
  const notes = usePlotStore((s) => s.notes)
  const labels = usePlotStore((s) => s.labels)
  const folders = usePlotStore((s) => s.folders)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const viewState = usePlotStore((s) => s.viewStateByContext[contextKey]) ?? buildViewStateForContext(contextKey)
  const searchQuery = usePlotStore((s) => s.searchQuery)
  const setViewState = usePlotStore((s) => s.setViewState)
  const isHydrated = usePlotStore((s) => s._viewStateHydrated)

  // ── Name maps for grouping labels ──────────────────────
  const labelNames = useMemo(() => {
    const map = new Map<string, string>()
    for (const l of labels) map.set(l.id, l.name)
    return map
  }, [labels])
  const folderNames = useMemo(() => {
    const map = new Map<string, string>()
    for (const f of folders) map.set(f.id, f.name)
    return map
  }, [folders])

  // ── Wiki titles set (for wikiRegistered filter) ────────
  const wikiTitles = useMemo(() => {
    const set = new Set<string>()
    for (const a of wikiArticles) {
      set.add(a.title.toLowerCase())
      for (const alias of a.aliases ?? []) {
        set.add(alias.toLowerCase())
      }
    }
    return set
  }, [wikiArticles])

  // ── Stage 1: Context filter ───────────────────────────
  const showTrashed = viewState.toggles?.showTrashed === true
  const contextFiltered = useMemo(
    () => applyContext(notes, contextKey, { ...extras, showTrashed }),
    [notes, contextKey, extras?.backlinksMap, extras?.folderId, extras?.tagId, extras?.labelId, showTrashed]
  )

  const totalCount = notes.length

  // ── Stage 2: User filters ─────────────────────────────
  const filterExtras = useMemo(
    () => ({ backlinksMap: extras?.backlinksMap, wikiTitles }),
    [extras?.backlinksMap, wikiTitles]
  )
  const filtered = useMemo(
    () => applyFilters(contextFiltered, viewState.filters, filterExtras),
    [contextFiltered, viewState.filters, filterExtras]
  )

  // ── Stage 3: Search ───────────────────────────────────
  // searchQuery is NOT from ViewState (not persisted per plan)
  const searched = useMemo(
    () => applySearch(filtered, searchQuery),
    [filtered, searchQuery]
  )

  // ── Stage 4: Sort ─────────────────────────────────────
  const sorted = useMemo(
    () => applySort(searched, viewState.sortField, viewState.sortDirection, extras?.backlinksMap),
    [searched, viewState.sortField, viewState.sortDirection, extras?.backlinksMap]
  )

  // ── Stage 5: Group ────────────────────────────────────
  const customOrder = viewState.groupOrder?.[viewState.groupBy] ?? undefined
  const subGroupBy = viewState.subGroupBy !== "none" ? viewState.subGroupBy : undefined
  const subGroupCustomOrder = viewState.subGroupOrder?.[viewState.subGroupBy] ?? undefined
  const subGroupSortBy = viewState.subGroupSortBy ?? "default"
  const groups = useMemo(
    () => applyGrouping(sorted, viewState.groupBy, { backlinksMap: extras?.backlinksMap, labelNames, folderNames, customOrder, subGroupBy, subGroupCustomOrder, subGroupSortBy }),
    [sorted, viewState.groupBy, subGroupBy, extras?.backlinksMap, labelNames, folderNames, customOrder, subGroupCustomOrder, subGroupSortBy]
  )

  // ── Actions ───────────────────────────────────────────
  const updateViewState = useCallback(
    (patch: Partial<ViewState>) => setViewState(contextKey, patch),
    [setViewState, contextKey]
  )

  return {
    groups,
    flatNotes: sorted,
    flatCount: sorted.length,
    totalCount,
    viewState,
    updateViewState,
    isHydrated,
  }
}
