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
  const viewState = usePlotStore((s) => s.viewStateByContext[contextKey]) ?? buildViewStateForContext(contextKey)
  const searchQuery = usePlotStore((s) => s.searchQuery)
  const setViewState = usePlotStore((s) => s.setViewState)
  const isHydrated = usePlotStore((s) => s._viewStateHydrated)

  // ── Stage 1: Context filter ───────────────────────────
  const contextFiltered = useMemo(
    () => applyContext(notes, contextKey, extras),
    [notes, contextKey, extras?.backlinksMap, extras?.folderId, extras?.tagId]
  )

  const totalCount = notes.length

  // ── Stage 2: User filters ─────────────────────────────
  const filtered = useMemo(
    () => applyFilters(contextFiltered, viewState.filters),
    [contextFiltered, viewState.filters]
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
  const groups = useMemo(
    () => applyGrouping(sorted, viewState.groupBy, { backlinksMap: extras?.backlinksMap }),
    [sorted, viewState.groupBy, extras?.backlinksMap]
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
