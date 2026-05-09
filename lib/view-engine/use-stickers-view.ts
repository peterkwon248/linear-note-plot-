"use client"

import { useMemo, useCallback } from "react"
import { usePlotStore } from "../store"
import type { ViewState, ViewContextKey, FilterRule } from "./types"
import { buildViewStateForContext } from "./defaults"
import type { Sticker } from "../types"

/**
 * Stickers-list pipeline result. Mirrors UseTagsViewResult / UseLabelsViewResult
 * shape so consumers can swap with minimal friction.
 *
 * Scope guard: deliberately does NOT reuse `applyFilters / applySort /
 * applyGrouping` from the notes pipeline — those are typed against `Note`
 * and would require generic refactoring (=scope creep). Thin stickers-only
 * implementations live here.
 *
 * Context: `stickers` (Sticker entity index at /stickers).
 *
 * Key differences from useTagsView / useLabelsView:
 *   - Sticker.color is required `string` (drives graph hull) — no fallback needed.
 *   - memberCount is **cross-entity** (note + wiki + tag/label/category/file/reference)
 *     via `Sticker.members: EntityRef[]` (single-forward 옵션 D2). Note/Wiki refs
 *     get an active-entity check (matches existing stickers-view.tsx behavior);
 *     other kinds count as-is for forward compatibility (Phase 3 Universal Picker).
 */
export interface StickerGroup {
  key: string
  label: string
  stickers: Sticker[]
}

/** Each sticker enriched with its derived memberCount (not persisted on Sticker). */
export interface StickerWithCount extends Sticker {
  memberCount: number
}

export interface UseStickersViewResult {
  groups: StickerGroup[]
  flatStickers: StickerWithCount[]
  flatCount: number
  totalCount: number
  viewState: ViewState
  updateViewState: (patch: Partial<ViewState>) => void
  isHydrated: boolean
}

/* ── Stage 1: Search ──────────────────────────────────── */

function applyStickerSearch(stickers: StickerWithCount[], query: string): StickerWithCount[] {
  const q = query.trim().toLowerCase()
  if (!q) return stickers
  return stickers.filter((s) => s.name.toLowerCase().includes(q))
}

/* ── Stage 1b: Filter ─────────────────────────────────── */

function applyStickerFilters(stickers: StickerWithCount[], filters: FilterRule[]): StickerWithCount[] {
  if (filters.length === 0) return stickers
  const byField = new Map<string, FilterRule[]>()
  for (const r of filters) {
    if (!byField.has(r.field)) byField.set(r.field, [])
    byField.get(r.field)!.push(r)
  }
  return stickers.filter((sticker) => {
    for (const [field, rules] of byField) {
      const matchesAny = rules.some((rule) => {
        if (field === "memberStatus") {
          if (rule.value === "has-members") return sticker.memberCount > 0
          if (rule.value === "empty") return sticker.memberCount === 0
          return false
        }
        if (field === "memberKind") {
          return (sticker.members ?? []).some((m) => m.kind === rule.value)
        }
        return false
      })
      if (!matchesAny) return false
    }
    return true
  })
}

/* ── Stage 2: Sort ────────────────────────────────────── */

function applyStickerSort(stickers: StickerWithCount[], viewState: ViewState): StickerWithCount[] {
  if (stickers.length <= 1) return stickers
  const rules = viewState.sortFields.length > 0
    ? viewState.sortFields
    : [{ field: "name" as const, direction: "asc" as const }]

  return [...stickers].sort((a, b) => {
    for (const rule of rules) {
      const dir = rule.direction === "asc" ? 1 : -1
      let r = 0
      switch (rule.field) {
        case "name":
        case "title":
          r = dir * a.name.localeCompare(b.name)
          break
        case "memberCount":
          // memberCount desc by default (more → top)
          r = dir * (a.memberCount - b.memberCount)
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

function applyStickerGrouping(stickers: StickerWithCount[]): StickerGroup[] {
  // Stickers-list only supports groupBy="none" in PR group-c-d-3.
  // Future PRs can add groupBy="memberKind" (dominant kind) etc. without
  // touching this hook's interface — just extend this function.
  return [{ key: "_all", label: "", stickers }]
}

/* ── Hook ──────────────────────────────────────────────── */

/**
 * Stickers-list pipeline hook. Wraps the stickers-only search/sort/group
 * stages with staged useMemo so individual pipeline stages don't recompute
 * on unrelated viewState changes (mirrors useTagsView / useLabelsView).
 *
 * `contextKey` is locked to "stickers" — passing it explicitly keeps the
 * call site consistent with useNotesView/useTagsView/useLabelsView.
 */
export function useStickersView(contextKey: ViewContextKey = "stickers"): UseStickersViewResult {
  const stickers = usePlotStore((s) => s.stickers)
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const viewState = usePlotStore((s) => s.viewStateByContext[contextKey]) ?? buildViewStateForContext(contextKey)
  const isHydrated = usePlotStore((s) => s._viewStateHydrated)
  const searchQuery = usePlotStore((s) => s.searchQuery)
  const setViewState = usePlotStore((s) => s.setViewState)

  // Stage 0: active (non-trashed) stickers only
  const activeStickers = useMemo(() => stickers.filter((s) => !s.trashed), [stickers])
  const totalCount = activeStickers.length

  // Active-entity lookup sets — match existing stickers-view.tsx behavior:
  // members may still reference trashed notes; filter them at read time.
  // Wiki articles have no `trashed` flag in the current model — count all.
  const activeNoteIds = useMemo(() => {
    const set = new Set<string>()
    for (const n of notes) {
      if (!n.trashed) set.add(n.id)
    }
    return set
  }, [notes])
  const activeWikiIds = useMemo(
    () => new Set(wikiArticles.map((w) => w.id)),
    [wikiArticles],
  )

  // Stage 0b: derive memberCount per sticker. Cross-entity (옵션 D2):
  // note/wiki refs get an active-entity check; other kinds count as-is
  // (forward-compat with Phase 3 Universal Picker for tag/label/category/file/reference).
  const stickersWithCount = useMemo((): StickerWithCount[] => {
    return activeStickers.map((s) => {
      let count = 0
      for (const ref of s.members ?? []) {
        if (ref.kind === "note") {
          if (activeNoteIds.has(ref.id)) count++
        } else if (ref.kind === "wiki") {
          if (activeWikiIds.has(ref.id)) count++
        } else {
          // tag / label / category / file / reference — no active check yet
          count++
        }
      }
      return { ...s, memberCount: count }
    })
  }, [activeStickers, activeNoteIds, activeWikiIds])

  // Stage 1: search (sticker name case-insensitive)
  const searched = useMemo(
    () => applyStickerSearch(stickersWithCount, searchQuery),
    [stickersWithCount, searchQuery],
  )

  // Stage 1b: filter
  const filtered = useMemo(
    () => applyStickerFilters(searched, viewState.filters),
    [searched, viewState.filters],
  )

  // Stage 2: sort
  const sorted = useMemo(
    () => applyStickerSort(filtered, viewState),
    [filtered, viewState],
  )

  // Stage 3: group (none-only in this PR)
  const groups = useMemo(
    () => applyStickerGrouping(sorted),
    [sorted],
  )

  const updateViewState = useCallback(
    (patch: Partial<ViewState>) => setViewState(contextKey, patch),
    [setViewState, contextKey],
  )

  return {
    groups,
    flatStickers: sorted,
    flatCount: sorted.length,
    totalCount,
    viewState,
    updateViewState,
    isHydrated,
  }
}
