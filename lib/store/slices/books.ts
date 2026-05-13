import { generateKeyBetween } from "fractional-indexing"
import type { AutoSource, AutoSourceKind, Book, BookItem } from "../../types"
import { genId, now } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void
type Get = () => any

/**
 * Sort items by their fractional-indexing `order` string.
 * Returns a new array — does not mutate the input.
 */
function sortByOrder(items: BookItem[]): BookItem[] {
  return [...items].sort((a, b) => (a.order < b.order ? -1 : a.order > b.order ? 1 : 0))
}

/**
 * Append a new fractional-indexing key after the last item in `items`.
 * If `items` is empty, returns the first key (`"a0"` or similar).
 */
function appendOrder(items: BookItem[]): string {
  if (items.length === 0) return generateKeyBetween(null, null)
  const sorted = sortByOrder(items)
  const last = sorted[sorted.length - 1].order
  return generateKeyBetween(last, null)
}

/**
 * Books slice — cross-entity ordered sequences (Book Entity Phase 1).
 *
 * Books wrap notes + wiki articles in user-defined order. The book is a
 * thin container — member entities live independently in their own slices.
 * Membership is a forward reference on `Book.items[].refId`.
 *
 * Item ordering uses `fractional-indexing` (string keys). Inserting between
 * two items is O(1) and never requires re-indexing. See
 * `.omc/plans/book-entity-prd.md` §3 + §5.
 */
export interface BooksSlice {
  books: Book[]

  /* ── CRUD ── */
  /** Create a book with title only. Returns the new book id. */
  createBook: (title: string) => string
  updateBook: (id: string, patch: Partial<Book>) => void
  /** Soft delete — sets `trashed=true`, `trashedAt=now`. */
  deleteBook: (id: string) => void
  /** Restore a soft-deleted book. */
  restoreBook: (id: string) => void
  /** Hard delete — removes the book from the array entirely. */
  permanentlyDeleteBook: (id: string) => void

  /* ── Item management ── */
  /**
   * Append a note or wiki to the end of a book. Silently no-ops if the
   * same `(kind, refId)` is already in the book (dedup). Caller surfaces
   * a toast if needed (Phase 3).
   */
  addItemToBook: (bookId: string, item: { kind: "note" | "wiki"; refId: string }) => void
  /**
   * Insert a chapter-heading divider. If `afterItemId` is provided, the
   * heading is placed between that item and the next item; otherwise it
   * is appended to the end.
   */
  addChapterHeading: (bookId: string, title: string, afterItemId?: string) => void
  /** Remove a single item (by book-internal id) from a book. */
  removeItemFromBook: (bookId: string, itemId: string) => void
  /**
   * Reorder an item to sit between `newPrevId` and `newNextId`. Caller
   * (drag-drop UI) computes the target neighbors. Pass `null` for either
   * end to indicate "before all" or "after all".
   *
   * Generates a new fractional-indexing `order` between the two neighbors
   * and persists it on the moved item.
   */
  reorderBookItems: (
    bookId: string,
    itemId: string,
    newPrevId: string | null,
    newNextId: string | null,
  ) => void
  /** Update the title of a chapter-heading item. */
  updateChapterHeading: (bookId: string, itemId: string, title: string) => void

  /* ── Smart sources (Phase 5) ── */
  /**
   * Replace all smartSources of a book. Used for batch update (e.g.,
   * Smart tab in book creation dialog). Empty array clears all sources.
   */
  setBookSmartSources: (bookId: string, sources: AutoSource[]) => void
  /**
   * Add a single smartSource. Silently no-op if `(kind, refId)` already
   * exists (LOCKED #12 dedup guard). Returns true on add, false on dedup.
   */
  addSmartSource: (bookId: string, source: AutoSource) => boolean
  /** Remove a single smartSource by `(kind, refId)`. */
  removeSmartSource: (bookId: string, kind: AutoSourceKind, refId: string) => void
  /**
   * Add an entity id to excludeIds (idempotent). Used when user
   * removes an auto-resolved item from a Smart Book.
   */
  addExcludeId: (bookId: string, entityId: string) => void
  /** Remove an entity id from excludeIds (idempotent). */
  removeExcludeId: (bookId: string, entityId: string) => void

  /* ── Auto chapter ordering (v2 Phase G) ── */
  /**
   * Reorder a single auto item within its source group. Caller
   * (drag-drop UI) inspects the resolved items list and supplies the
   * neighbors' current sort keys (= `userOrder ?? order`). The store
   * generates a fractional key between them and persists on
   * `book.autoUserOrders[`${sourceRefId}::${entityId}`]`.
   *
   * `entityId` is the note/wiki id (NOT the auto book item id, since
   * auto item ids change on re-resolve).
   * `prevSortKey` / `nextSortKey` are the bordering items' effective
   * orders (null = "before all" / "after all" within the resolved
   * list). Caller is responsible for ensuring neighbors are in the
   * same source — cross-source reorder is not supported (Q1 A).
   *
   * Resolver picks up the userOrder transparently — sort uses
   * `(userOrder ?? order)` so unset items keep their natural updatedAt
   * desc order.
   */
  reorderAutoItem: (
    bookId: string,
    sourceRefId: string,
    entityId: string,
    prevSortKey: string | null,
    nextSortKey: string | null,
  ) => void
  /**
   * Clear all per-source user reorder for a single source — used by
   * the per-source "Auto-sort" toggle to revert back to `updatedAt desc`.
   * Returns the number of keys removed (caller renders undo toast).
   */
  clearAutoUserOrder: (bookId: string, sourceRefId: string) => number

  /* ── Reading position (v2 Phase H) ── */
  /**
   * Set the "last read" position for a book. Use the stable refId of
   * the note/wiki entity (not the auto book item id, which changes on
   * re-resolve). Caller is `NoteEditor` / `BookWikiReader` mount when
   * a book-anchored page renders. Pass `null` to clear (rare —
   * normally cleared by deleting the book or completing reading).
   */
  setLastRead: (bookId: string, refId: string | null) => void
}

export function createBooksSlice(set: Set, _get: Get): Omit<BooksSlice, "books"> {
  const touchBook = (state: any, bookId: string, mutator: (book: Book) => Book) => {
    const books = (state.books ?? []) as Book[]
    let mutated = false
    const next = books.map((b) => {
      if (b.id !== bookId) return b
      const updated = mutator(b)
      if (updated === b) return b
      mutated = true
      return { ...updated, updatedAt: now() }
    })
    return mutated ? { books: next } : {}
  }

  return {
    /* ── CRUD ── */

    createBook: (title: string): string => {
      const id = genId()
      const createdAt = now()
      const book: Book = {
        id,
        title,
        items: [],
        createdAt,
        updatedAt: createdAt,
      }
      set((state: any) => ({
        books: [...((state.books ?? []) as Book[]), book],
      }))
      return id
    },

    updateBook: (id: string, patch: Partial<Book>) => {
      set((state: any) =>
        touchBook(state, id, (book) => ({
          ...book,
          ...patch,
          // id immutable
          id: book.id,
          createdAt: book.createdAt,
        })),
      )
    },

    deleteBook: (id: string) => {
      set((state: any) =>
        touchBook(state, id, (book) =>
          book.trashed
            ? book
            : { ...book, trashed: true, trashedAt: now() },
        ),
      )
    },

    restoreBook: (id: string) => {
      set((state: any) =>
        touchBook(state, id, (book) =>
          !book.trashed
            ? book
            : { ...book, trashed: false, trashedAt: null },
        ),
      )
    },

    permanentlyDeleteBook: (id: string) => {
      set((state: any) => ({
        books: ((state.books ?? []) as Book[]).filter((b) => b.id !== id),
      }))
    },

    /* ── Item management ── */

    addItemToBook: (bookId: string, item: { kind: "note" | "wiki"; refId: string }) => {
      set((state: any) =>
        touchBook(state, bookId, (book) => {
          // Dedup: same (kind, refId) cannot appear twice in one book.
          const exists = book.items.some(
            (i) => i.kind === item.kind && (i as { refId?: string }).refId === item.refId,
          )
          if (exists) return book
          const newItem: BookItem = {
            kind: item.kind,
            id: genId(),
            refId: item.refId,
            order: appendOrder(book.items),
          } as BookItem
          return { ...book, items: [...book.items, newItem] }
        }),
      )
    },

    addChapterHeading: (bookId: string, title: string, afterItemId?: string) => {
      set((state: any) =>
        touchBook(state, bookId, (book) => {
          const sorted = sortByOrder(book.items)
          let order: string
          if (afterItemId) {
            const idx = sorted.findIndex((i) => i.id === afterItemId)
            if (idx === -1) {
              // Unknown id — fall back to append.
              order = appendOrder(book.items)
            } else {
              const prev = sorted[idx].order
              const next = sorted[idx + 1]?.order ?? null
              order = generateKeyBetween(prev, next)
            }
          } else {
            order = appendOrder(book.items)
          }
          const heading: BookItem = {
            kind: "chapter-heading",
            id: genId(),
            title,
            order,
          }
          return { ...book, items: [...book.items, heading] }
        }),
      )
    },

    removeItemFromBook: (bookId: string, itemId: string) => {
      set((state: any) =>
        touchBook(state, bookId, (book) => {
          const next = book.items.filter((i) => i.id !== itemId)
          if (next.length === book.items.length) return book
          return { ...book, items: next }
        }),
      )
    },

    reorderBookItems: (
      bookId: string,
      itemId: string,
      newPrevId: string | null,
      newNextId: string | null,
    ) => {
      set((state: any) =>
        touchBook(state, bookId, (book) => {
          const target = book.items.find((i) => i.id === itemId)
          if (!target) return book
          // Resolve neighbor orders. Items are looked up by id; when the
          // caller provides an id that isn't in the book (defensive), we
          // treat that side as null (= unbounded).
          const prevOrder = newPrevId
            ? book.items.find((i) => i.id === newPrevId)?.order ?? null
            : null
          const nextOrder = newNextId
            ? book.items.find((i) => i.id === newNextId)?.order ?? null
            : null
          // No-op if neighbors are unchanged (same order would be generated).
          if (prevOrder !== null && prevOrder >= target.order && (nextOrder === null || nextOrder > target.order)) {
            // target already > prev — but we still recompute to avoid
            // false-positive no-ops. Fall through to regenerate.
          }
          const newOrder = generateKeyBetween(prevOrder, nextOrder)
          if (newOrder === target.order) return book
          const items = book.items.map((i) =>
            i.id === itemId ? ({ ...i, order: newOrder } as BookItem) : i,
          )
          return { ...book, items }
        }),
      )
    },

    updateChapterHeading: (bookId: string, itemId: string, title: string) => {
      set((state: any) =>
        touchBook(state, bookId, (book) => {
          const target = book.items.find((i) => i.id === itemId)
          if (!target || target.kind !== "chapter-heading") return book
          if (target.title === title) return book
          const items = book.items.map((i) =>
            i.id === itemId && i.kind === "chapter-heading"
              ? ({ ...i, title } as BookItem)
              : i,
          )
          return { ...book, items }
        }),
      )
    },

    /* ── Smart sources (Phase 5) ── */

    setBookSmartSources: (bookId: string, sources: AutoSource[]) => {
      set((state: any) =>
        touchBook(state, bookId, (book) => ({
          ...book,
          smartSources: sources,
        })),
      )
    },

    addSmartSource: (bookId: string, source: AutoSource): boolean => {
      let added = false
      set((state: any) =>
        touchBook(state, bookId, (book) => {
          const existing = book.smartSources ?? []
          // LOCKED #12: dedup guard — silent no-op if (kind, refId) already exists.
          const isDup = existing.some(
            (s) => s.kind === source.kind && s.refId === source.refId,
          )
          if (isDup) return book
          added = true
          return { ...book, smartSources: [...existing, source] }
        }),
      )
      return added
    },

    removeSmartSource: (bookId: string, kind: AutoSourceKind, refId: string) => {
      set((state: any) =>
        touchBook(state, bookId, (book) => {
          const existing = book.smartSources ?? []
          const next = existing.filter((s) => !(s.kind === kind && s.refId === refId))
          if (next.length === existing.length) return book
          return { ...book, smartSources: next }
        }),
      )
    },

    addExcludeId: (bookId: string, entityId: string) => {
      set((state: any) =>
        touchBook(state, bookId, (book) => {
          const existing = book.excludeIds ?? []
          if (existing.includes(entityId)) return book
          return { ...book, excludeIds: [...existing, entityId] }
        }),
      )
    },

    removeExcludeId: (bookId: string, entityId: string) => {
      set((state: any) =>
        touchBook(state, bookId, (book) => {
          const existing = book.excludeIds ?? []
          const next = existing.filter((id) => id !== entityId)
          if (next.length === existing.length) return book
          return { ...book, excludeIds: next }
        }),
      )
    },

    /* ── Auto chapter ordering (v2 Phase G) ── */

    reorderAutoItem: (
      bookId: string,
      sourceRefId: string,
      entityId: string,
      prevSortKey: string | null,
      nextSortKey: string | null,
    ) => {
      set((state: any) =>
        touchBook(state, bookId, (book) => {
          const map = book.autoUserOrders ?? {}
          // Caller supplies the neighbors' effective sort keys
          // (`userOrder ?? order`) — they own the resolved view and
          // know exactly what bordering items look like. Store just
          // generates a fractional key between them.
          let newOrder: string
          try {
            newOrder = generateKeyBetween(prevSortKey, nextSortKey)
          } catch {
            // Neighbors out of order (rare race) — append at end of source.
            newOrder = generateKeyBetween(prevSortKey, null)
          }
          const key = `${sourceRefId}::${entityId}`
          if (map[key] === newOrder) return book
          return {
            ...book,
            autoUserOrders: { ...map, [key]: newOrder },
          }
        }),
      )
    },

    clearAutoUserOrder: (bookId: string, sourceRefId: string): number => {
      let removed = 0
      set((state: any) =>
        touchBook(state, bookId, (book) => {
          const map = book.autoUserOrders ?? {}
          const prefix = `${sourceRefId}::`
          const next: Record<string, string> = {}
          for (const [k, v] of Object.entries(map)) {
            if (k.startsWith(prefix)) {
              removed++
              continue
            }
            next[k] = v
          }
          if (removed === 0) return book
          return { ...book, autoUserOrders: next }
        }),
      )
      return removed
    },

    /* ── Reading position (v2 Phase H) ── */
    setLastRead: (bookId: string, refId: string | null) => {
      set((state: any) =>
        touchBook(state, bookId, (book) => {
          if (book.lastReadItemId === refId) return book
          return {
            ...book,
            lastReadItemId: refId,
            lastReadAt: refId ? now() : null,
          }
        }),
      )
    },
  }
}
