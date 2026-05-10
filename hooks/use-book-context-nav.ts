"use client"

/**
 * useBookContextNav — pane-aware in-book navigation hook (Phase 4).
 *
 * Reads the current pane's `bookContext` from the store, validates it
 * against the live book + entity (auto-clears on staleness), and exposes
 * prev/next handlers that:
 *  - jump to the next/previous CONTENT item in the book (skipping
 *    chapter-headings)
 *  - update bookContext.itemIndex on the same pane
 *  - dispatch the right open call for note vs. wiki kinds
 *
 * Pane awareness is mandatory — same note can be in book A in primary
 * and book B in secondary simultaneously. The hook reads pane from
 * `usePane()` and uses the matching slice in `bookContext`.
 *
 * Spec: `.omc/plans/book-entity-prd.md` §8.
 */

import { useCallback, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { usePlotStore } from "@/lib/store"
import { usePane } from "@/components/workspace/pane-context"
import { setActiveRoute } from "@/lib/table-route"
import { navigateToWikiArticle } from "@/lib/wiki-article-nav"
import { resolvedContentItems, type ResolvedContentBookItem } from "@/lib/books/utils"
export type { ResolvedContentBookItem }

export interface UseBookContextNavReturn {
  /** Resolved active pane book context, or null if none / invalid. */
  active: {
    bookId: string
    itemIndex: number
    total: number
  } | null
  /** Move to the previous content item. No-op when already first. */
  goPrev: () => void
  /** Move to the next content item. No-op when already last. */
  goNext: () => void
  /** Resolved content items in this book (manual + auto, headings excluded). */
  items: ResolvedContentBookItem[]
  /** Jump to a specific item by index (used by the table-of-contents dropdown). */
  jumpTo: (index: number) => void
}

/**
 * `kind` and `refId` describe the entity currently displayed in this pane.
 * The hook validates the bookContext against them — if `(kind, refId)`
 * isn't in the book at the recorded index (item removed from book, etc.),
 * the bookContext is auto-cleared and `active` becomes null.
 */
export function useBookContextNav(
  kind: "note" | "wiki",
  refId: string | null | undefined,
): UseBookContextNavReturn {
  const router = useRouter()
  const pane = usePane()
  const books = usePlotStore((s) => s.books)
  const notes = usePlotStore((s) => s.notes)
  const folders = usePlotStore((s) => s.folders)
  // Select only this pane's slice — avoids re-renders when the *other*
  // pane's bookContext changes.
  const ctx = usePlotStore((s) => s.bookContext?.[pane] ?? null)
  const setBookContext = usePlotStore((s) => s.setBookContext)
  const openNote = usePlotStore((s) => s.openNote)

  // Resolve book + content items once per render.
  const book = useMemo(
    () => (ctx ? books.find((b) => b.id === ctx.bookId) ?? null : null),
    [books, ctx],
  )

  // Use resolvedContentItems so auto items (smart source folder pulls)
  // are included in the N/M counter and ↑↓ navigation sequence.
  const items: ResolvedContentBookItem[] = useMemo(
    () => (book ? resolvedContentItems(book, { notes, folders }) : []),
    [book, notes, folders],
  )

  // Locate the current entity inside the content items.
  // Use refId as the source of truth — itemIndex on the stored ctx may be
  // stale if items were reordered. The recomputed index becomes the
  // displayed counter value.
  const liveIndex = useMemo(() => {
    if (!refId || items.length === 0) return -1
    return items.findIndex((i) => i.kind === kind && i.refId === refId)
  }, [items, kind, refId])

  // Auto-clear stale contexts:
  //  - Book deleted / hard-removed
  //  - User opened a *different* entity that isn't in the book
  //  - Item removed from this book mid-session
  //
  // We deliberately do NOT clear when `refId` is null — that just means
  // the editor is between renders (route push, BookDetailPage handing
  // off to /wiki, etc.). The bookContext is harmless while no entity
  // is mounted (counter renders nothing because `active` requires a
  // matched index), and the next entity-bearing render will validate.
  //
  // Cleanup happens in an effect so React doesn't get a setState-during-
  // render warning. We compare to the stored ctx directly to avoid an
  // infinite loop.
  useEffect(() => {
    if (!ctx) return
    // Book deleted / hard-removed → orphaned ctx, clear.
    if (!book) {
      setBookContext(pane, null)
      return
    }
    // No entity mounted (refId null) → leave ctx alone; the next
    // entity-bearing render will validate and clear if needed.
    if (!refId) return
    // Entity mounted but not in book → user navigated away from
    // book-anchored content. Clear ctx so other panes / future opens
    // don't inherit a stale anchor.
    if (liveIndex < 0) {
      setBookContext(pane, null)
      return
    }
    // Sync the stored ctx with the live values. If items were reordered
    // (or another item was removed earlier in the list), the index/total
    // shift and we re-persist. This keeps the displayed counter correct
    // without tunneling everything through component state.
    if (ctx.itemIndex !== liveIndex || ctx.total !== items.length) {
      setBookContext(pane, {
        bookId: ctx.bookId,
        itemIndex: liveIndex,
        total: items.length,
      })
    }
  }, [ctx, book, refId, liveIndex, items.length, pane, setBookContext])

  const navigateTo = useCallback(
    (target: ResolvedContentBookItem, newIndex: number) => {
      if (!book) return
      // Update bookContext FIRST so the destination view picks up the
      // anchor immediately (before its render settles). The
      // pane-scoped setter leaves the other pane untouched.
      setBookContext(pane, {
        bookId: book.id,
        itemIndex: newIndex,
        total: items.length,
      })
      if (target.kind === "note") {
        openNote(target.refId, { pane })
      } else {
        // Wiki articles: secondary pane uses openInSecondary (resolves
        // note vs wiki via wikiArticles.find). Primary pane stays on
        // the /books/{id} route — BookDetailPage mounts WikiArticleView
        // when selectedNoteId references a wiki entity (Step 2.11b).
        if (pane === "secondary") {
          usePlotStore.getState().openInSecondary(target.refId)
        } else {
          usePlotStore.getState().setSelectedNoteId(target.refId)
        }
      }
    },
    [book, items.length, openNote, pane, router, setBookContext],
  )

  const goPrev = useCallback(() => {
    if (!book || liveIndex <= 0) return
    const target = items[liveIndex - 1]
    if (!target) return
    navigateTo(target, liveIndex - 1)
  }, [book, items, liveIndex, navigateTo])

  const goNext = useCallback(() => {
    if (!book || liveIndex < 0 || liveIndex >= items.length - 1) return
    const target = items[liveIndex + 1]
    if (!target) return
    navigateTo(target, liveIndex + 1)
  }, [book, items, liveIndex, navigateTo])

  const jumpTo = useCallback((index: number) => {
    if (!book || index < 0 || index >= items.length || index === liveIndex) return
    const target = items[index]
    if (!target) return
    navigateTo(target, index)
  }, [book, items, liveIndex, navigateTo])

  const active = book && liveIndex >= 0
    ? { bookId: book.id, itemIndex: liveIndex, total: items.length }
    : null

  return { active, goPrev, goNext, items, jumpTo }
}
