"use client"

/**
 * useListContextNav — pane-aware "list peek" navigation (sibling of
 * useBookContextNav).
 *
 * Reads the current pane's FROZEN `listNavContext` snapshot and exposes
 * prev / next / jumpTo / back handlers for the editor's
 * "‹ {label} ⌄  N / M  ‹ ›" bar (TOC dropdown parity with BookContextNav).
 *
 * Difference from useBookContextNav: a book is a persistent ordered entity,
 * so that hook re-resolves its items every render. A list snapshot, by
 * contrast, is frozen at open time — we navigate `ctx.ids` directly and never
 * re-derive it. `items`/`groups` resolve each frozen id to its current title +
 * status (for the dropdown) but the id ORDER stays frozen. When the list was
 * grouped (status/folder/…) `groups` carries section labels; otherwise it's
 * null and the dropdown renders the flat `items`.
 *
 * Priority: if both bookContext and listNavContext exist for a pane, the
 * editor renders BookContextNav (book anchor wins).
 *
 * Spec: docs/01-plan/features/list-context-navigation.plan.md §4–§6.
 */

import { useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { usePlotStore } from "@/lib/store"
import { usePane } from "@/components/workspace/pane-context"
import {
  setActiveRoute,
  setActiveFolderId,
  setActiveTagId,
  setActiveLabelId,
  setActiveViewId,
} from "@/lib/table-route"
import { navigateToWikiArticle } from "@/lib/wiki-article-nav"
import type { NoteStatus } from "@/lib/types"

/** A frozen-list entry resolved for the TOC dropdown. */
export interface ListNavItem {
  id: string
  title: string
  status?: NoteStatus
  /** Position within the frozen `ids` (jumpTo target). */
  index: number
}

/** A resolved group section for the TOC dropdown (status/folder/…). */
export interface ListNavGroup {
  label: string
  items: ListNavItem[]
}

export interface UseListContextNavReturn {
  /** Resolved active context for this pane, or null when none / entity not in snapshot. */
  active: { index: number; total: number; label: string } | null
  /** Frozen-order items (flat) for the dropdown, or null when no context. */
  items: ListNavItem[] | null
  /** Grouped sections for the dropdown (when opened from a grouped list), or null. */
  groups: ListNavGroup[] | null
  /** Open the previous entity in the frozen list. No-op at the first item. */
  goPrev: () => void
  /** Open the next entity in the frozen list. No-op at the last item. */
  goNext: () => void
  /**
   * Return to the originating list screen: restore route + active filter and
   * close this pane's editor. Wiki articles live in WikiView's local state,
   * so the mount site clears its own `selectedWikiArticleId` before calling.
   */
  goBack: () => void
  /** Jump to a specific index in the frozen list (TOC dropdown). */
  jumpTo: (index: number) => void
}

export function useListContextNav(
  kind: "note" | "wiki",
  refId: string | null | undefined,
): UseListContextNavReturn {
  const router = useRouter()
  const pane = usePane()
  const ctx = usePlotStore((s) => s.listNavContext?.[pane] ?? null)
  const setListNavContext = usePlotStore((s) => s.setListNavContext)
  const openNote = usePlotStore((s) => s.openNote)
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)

  // Frozen snapshot: locate the mounted entity by refId. The snapshot's space
  // must match the entity kind — a notes list never navigates wiki articles
  // and vice versa.
  const liveIndex = useMemo(() => {
    if (!ctx || !refId) return -1
    if (ctx.space !== (kind === "note" ? "notes" : "wiki")) return -1
    return ctx.ids.indexOf(refId)
  }, [ctx, refId, kind])

  // Resolve a frozen id → current title + status (+ its index in `ids`).
  const resolve = useCallback(
    (byId: Map<string, { title?: string; status?: NoteStatus }>, id: string, index: number): ListNavItem => {
      const e = byId.get(id)
      return { id, title: e?.title || "Untitled", status: e?.status, index }
    },
    [],
  )

  // Flat dropdown items (always available). Order stays frozen.
  const items = useMemo<ListNavItem[] | null>(() => {
    if (!ctx) return null
    const src = ctx.space === "notes" ? notes : wikiArticles
    const byId = new Map(src.map((x) => [x.id, x])) as Map<string, { title?: string; status?: NoteStatus }>
    return ctx.ids.map((id, idx) => resolve(byId, id, idx))
  }, [ctx, notes, wikiArticles, resolve])

  // Grouped sections (status/folder/…) — only when the list was grouped at
  // capture time. Each item's `index` points back into the flat frozen `ids`.
  const groups = useMemo<ListNavGroup[] | null>(() => {
    if (!ctx?.groups) return null
    const src = ctx.space === "notes" ? notes : wikiArticles
    const byId = new Map(src.map((x) => [x.id, x])) as Map<string, { title?: string; status?: NoteStatus }>
    const idIndex = new Map(ctx.ids.map((id, idx) => [id, idx]))
    return ctx.groups.map((g) => ({
      label: g.label,
      items: g.ids.map((id) => resolve(byId, id, idIndex.get(id) ?? -1)),
    }))
  }, [ctx, notes, wikiArticles, resolve])

  const navigateTo = useCallback(
    (targetId: string, newIndex: number) => {
      if (!ctx) return
      // Update the stored index first so the destination editor reads the
      // anchor immediately. `ids` stays frozen.
      setListNavContext(pane, { ...ctx, index: newIndex })
      if (ctx.space === "notes") {
        openNote(targetId, { pane })
      } else if (pane === "secondary") {
        usePlotStore.getState().openInSecondary(targetId)
      } else {
        navigateToWikiArticle(targetId)
      }
    },
    [ctx, pane, openNote, setListNavContext],
  )

  const goPrev = useCallback(() => {
    if (!ctx || liveIndex <= 0) return
    navigateTo(ctx.ids[liveIndex - 1], liveIndex - 1)
  }, [ctx, liveIndex, navigateTo])

  const goNext = useCallback(() => {
    if (!ctx || liveIndex < 0 || liveIndex >= ctx.ids.length - 1) return
    navigateTo(ctx.ids[liveIndex + 1], liveIndex + 1)
  }, [ctx, liveIndex, navigateTo])

  const jumpTo = useCallback(
    (index: number) => {
      if (!ctx || index < 0 || index >= ctx.ids.length || index === liveIndex) return
      navigateTo(ctx.ids[index], index)
    },
    [ctx, liveIndex, navigateTo],
  )

  const goBack = useCallback(() => {
    if (!ctx) return
    const space = ctx.space === "wiki" ? "wiki" : "notes"
    setActiveRoute(ctx.backRoute, space)
    // folder / view / tag / label are mutually exclusive in table-route —
    // restore exactly one (or clear all).
    if (ctx.backFolderId) setActiveFolderId(ctx.backFolderId)
    else if (ctx.backViewId) setActiveViewId(ctx.backViewId)
    else if (ctx.backTagId) setActiveTagId(ctx.backTagId)
    else if (ctx.backLabelId) setActiveLabelId(ctx.backLabelId)
    else setActiveFolderId(null)
    // Close this pane's editor so the list shows again. Notes use the store;
    // wiki selection is local to WikiView (cleared by the mount site).
    if (ctx.space === "notes") {
      if (pane === "secondary") usePlotStore.getState().closeSecondary()
      else usePlotStore.getState().setSelectedNoteId(null)
    }
    router.push(ctx.backRoute)
  }, [ctx, pane, router])

  const active =
    ctx && liveIndex >= 0
      ? { index: liveIndex, total: ctx.ids.length, label: ctx.label }
      : null

  return { active, items, groups, goPrev, goNext, goBack, jumpTo }
}
