import type { Note } from "../types"
import type { ViewState, ViewContextKey, PipelineExtras, PipelineResult } from "./types"
import { applyContext } from "./context-filter"
import { applyFilters } from "./filter"
import { applySearch } from "./search"
import { applySort } from "./sort"
import { applyGrouping } from "./group"

/**
 * Run the full query pipeline:
 *   context → filter → search → sort → group
 *
 * Each stage is a pure function. In React components, prefer
 * `useNotesView` which memoizes each stage independently.
 * This function is for non-React usage or testing.
 */
export function runPipeline(
  notes: Note[],
  context: ViewContextKey,
  viewState: ViewState,
  extras?: PipelineExtras
): PipelineResult {
  const totalCount = notes.length

  // Stage 1: Context filter
  const contextFiltered = applyContext(notes, context, extras)

  // Stage 2: User filters
  const filtered = applyFilters(contextFiltered, viewState.filters)

  // Stage 3: Search
  const searched = applySearch(filtered, extras?.searchQuery ?? "")

  // Stage 4: Sort
  const sorted = applySort(
    searched,
    viewState.sortField,
    viewState.sortDirection,
    extras?.backlinksMap
  )

  // Stage 5: Group
  const groups = applyGrouping(sorted, viewState.groupBy, { backlinksMap: extras?.backlinksMap })

  return {
    groups,
    flatNotes: sorted,
    flatCount: sorted.length,
    totalCount,
  }
}
