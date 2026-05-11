"use client"

import { useMemo, useCallback } from "react"
import { usePlotStore } from "../store"
import type { ViewState, ViewContextKey, FilterRule, SortRule, GroupBy } from "./types"
import { buildViewStateForContext } from "./defaults"
import type { Book } from "../types"

/**
 * Books pipeline result. Mirrors UseNotesViewResult shape (groups + flat +
 * viewState + updateViewState) so consumers can swap call sites with minimal
 * friction.
 *
 * Scope guard: deliberately does NOT reuse `applyFilters / applySort /
 * applyGrouping` from the notes pipeline — those are typed against `Note`
 * and would require generic refactoring (=scope creep). Thin books-only
 * implementations live here.
 *
 * PR scope progression (per .omc/plans/books-view-engine-integration.md):
 * - PR 1: grid preservation + viewState persist. filter = pinned only,
 *   sort = updatedAt/createdAt/title, group = none.
 * - PR 2 (this): list mode + itemCount sort + kind/sourceType/pinned filters
 *   + pinned-first sort.
 * - PR 3: board mode + kind/pinned group.
 * - PR 4: gallery mode (entity-agnostic adapter).
 *
 * INVARIANT (smart-book-prd.md §2): Book entity list view only. resolver/
 * BookDetailPage/SourcesSection unchanged.
 */
export type BookKind = "smart" | "manual" | "hybrid"

/** Compute the kind of a book from its items + smartSources. */
export function getBookKind(b: Book): BookKind {
  const hasSources = (b.smartSources?.length ?? 0) > 0
  const hasItems = (b.items?.length ?? 0) > 0
  if (hasSources && hasItems) return "hybrid"
  if (hasSources) return "smart"
  return "manual"
}

export interface BookGroup {
  key: string
  label: string
  books: Book[]
}

export interface UseBooksViewResult {
  groups: BookGroup[]
  flatBooks: Book[]
  flatCount: number
  totalCount: number
  viewState: ViewState
  updateViewState: (patch: Partial<ViewState>) => void
}

/* ── Stage 1: User filters ────────────────────────────── */

function bookMatchesRule(b: Book, rule: FilterRule): boolean {
  const { field, operator, value } = rule
  const eq = (a: unknown, b: unknown) => operator === "eq" ? a === b : a !== b
  switch (field) {
    case "pinned": {
      const target = value === "true"
      return eq(Boolean(b.pinned), target)
    }
    // books-view-engine-2: Smart/Manual/Hybrid filter.
    case "kind": {
      return eq(getBookKind(b), value)
    }
    // books-view-engine-2: which smart-source kinds are configured for this
    // book. value ∈ folder/category/tag/label/sticker. "_none" = manual-only
    // books (no smart sources).
    case "sourceType": {
      const sources = b.smartSources ?? []
      if (value === "_none") return eq(sources.length === 0, true)
      const has = sources.some((s) => s.kind === value)
      return eq(has, true)
    }
    // PR 3 will add: itemCount thresholds.
    // Stale rules referencing unknown fields fall through to `default: true`
    // and are no-ops until the user clears them via the filter UI.
    default:
      return true
  }
}

function applyBookFilters(books: Book[], filters: FilterRule[]): Book[] {
  if (filters.length === 0) return books
  // OR within field, AND across fields — same semantics as note filters.
  const byField = new Map<string, FilterRule[]>()
  for (const r of filters) {
    const bucket = byField.get(r.field) ?? []
    bucket.push(r)
    byField.set(r.field, bucket)
  }
  const groups = Array.from(byField.values())
  return books.filter((b) =>
    groups.every((rules) => rules.some((r) => bookMatchesRule(b, r))),
  )
}

/* ── Stage 2: Search ──────────────────────────────────── */

function applyBookSearch(books: Book[], query: string): Book[] {
  const q = query.trim().toLowerCase()
  if (!q) return books
  return books.filter((b) =>
    b.title.toLowerCase().includes(q) ||
    (b.description?.toLowerCase().includes(q) ?? false),
  )
}

/* ── Stage 3: Sort ────────────────────────────────────── */

function compareBook(a: Book, b: Book, rule: SortRule): number {
  const dir = rule.direction === "asc" ? 1 : -1
  // Stale saved sort rules referencing unknown fields fall through to
  // `default: 0` (stable).
  switch (rule.field) {
    case "title":     return dir * a.title.localeCompare(b.title)
    case "name":      return dir * a.title.localeCompare(b.title)
    case "createdAt": return dir * a.createdAt.localeCompare(b.createdAt)
    case "updatedAt": return dir * a.updatedAt.localeCompare(b.updatedAt)
    // books-view-engine-2: count Book.items.length (manual + chapter-heading).
    // Auto-resolved items (Smart sources) are NOT counted here because the
    // resolver is invoked only on the detail page (avoids store dependency).
    // Future PR could lift resolvedContentItems to view layer if accuracy needed.
    case "itemCount": return dir * ((a.items?.length ?? 0) - (b.items?.length ?? 0))
    default:          return 0
  }
}

function applyBookSort(books: Book[], sortFields: SortRule[]): Book[] {
  if (books.length <= 1) return books
  const chain = sortFields.length > 0
    ? sortFields
    : [{ field: "updatedAt" as const, direction: "desc" as const }]
  // books-view-engine-2: pinned-first sort (mirrors Notes/Templates/Tags
  // semantics — "Pin" stays visible across sort changes). PR 1 preserved
  // legacy sort-only semantics; PR 2 introduces pinned-first now that sort
  // UI is exposed.
  return [...books].sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1
    for (const rule of chain) {
      const r = compareBook(a, b, rule)
      if (r !== 0) return r
    }
    return 0
  })
}

/* ── Stage 4: Group ───────────────────────────────────── */

function applyBookGrouping(books: Book[], groupBy: GroupBy): BookGroup[] {
  if (groupBy === "none") {
    return [{ key: "_all", label: "", books }]
  }

  // books-view-engine-3: kind = Smart / Manual / Hybrid. Fixed column order
  // mirrors the user mental model (Smart first → Hybrid → Manual gradient).
  if (groupBy === "kind") {
    const smartList: Book[] = []
    const manualList: Book[] = []
    const hybridList: Book[] = []
    for (const b of books) {
      const k = getBookKind(b)
      if (k === "smart") smartList.push(b)
      else if (k === "hybrid") hybridList.push(b)
      else manualList.push(b)
    }
    const out: BookGroup[] = []
    if (smartList.length > 0) out.push({ key: "smart", label: "Smart", books: smartList })
    if (hybridList.length > 0) out.push({ key: "hybrid", label: "Hybrid", books: hybridList })
    if (manualList.length > 0) out.push({ key: "manual", label: "Manual", books: manualList })
    // Empty groups stay hidden until showEmptyGroups toggle ships.
    return out
  }

  // books-view-engine-3: pinned = Pinned / Others. Two-column binary.
  if (groupBy === "pinned") {
    const pinned: Book[] = []
    const others: Book[] = []
    for (const b of books) {
      if (b.pinned) pinned.push(b)
      else others.push(b)
    }
    const out: BookGroup[] = []
    if (pinned.length > 0) out.push({ key: "pinned", label: "Pinned", books: pinned })
    if (others.length > 0) out.push({ key: "others", label: "Others", books: others })
    return out
  }

  // Unknown grouping → single bucket (stable for stale state).
  return [{ key: "_all", label: "", books }]
}

/* ── Hook ──────────────────────────────────────────────── */

/**
 * Books pipeline hook. Stage-by-stage useMemo so individual pipeline stages
 * don't recompute on unrelated viewState changes (mirrors useNotesView).
 *
 * `contextKey` is locked to "books" — passing explicitly keeps the call
 * site consistent with useNotesView/useTemplatesView/useTagsView.
 */
export function useBooksView(contextKey: ViewContextKey = "books"): UseBooksViewResult {
  const books = usePlotStore((s) => s.books) as Book[]
  const viewState = usePlotStore((s) => s.viewStateByContext[contextKey]) ?? buildViewStateForContext(contextKey)
  const searchQuery = usePlotStore((s) => s.searchQuery)
  const setViewState = usePlotStore((s) => s.setViewState)

  const showTrashed = Boolean(viewState.toggles?.showTrashed)

  // Stage 0: trash visibility (driven by viewState.toggles.showTrashed).
  // Mirrors the previous local `showTrashed` state in BooksGrid; moved into
  // viewState so toggle survives reload (Group C PR-D pattern).
  const visible = useMemo(
    () => (showTrashed ? books : books.filter((b) => !b.trashed)),
    [books, showTrashed],
  )
  const totalCount = visible.length

  // Stage 1: user filters
  const filtered = useMemo(
    () => applyBookFilters(visible, viewState.filters),
    [visible, viewState.filters],
  )

  // Stage 2: search
  const searched = useMemo(
    () => applyBookSearch(filtered, searchQuery),
    [filtered, searchQuery],
  )

  // Stage 3: sort (pinned-first then sortFields)
  const sorted = useMemo(
    () => applyBookSort(searched, viewState.sortFields),
    [searched, viewState.sortFields],
  )

  // Stage 4: group
  const groups = useMemo(
    () => applyBookGrouping(sorted, viewState.groupBy),
    [sorted, viewState.groupBy],
  )

  const updateViewState = useCallback(
    (patch: Partial<ViewState>) => setViewState(contextKey, patch),
    [setViewState, contextKey],
  )

  return {
    groups,
    flatBooks: sorted,
    flatCount: sorted.length,
    totalCount,
    viewState,
    updateViewState,
  }
}
