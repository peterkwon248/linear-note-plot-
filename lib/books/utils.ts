/**
 * Book navigation utilities (Phase 4 — In-book navigation).
 *
 * Helpers that derive content-only item lists from a Book and locate
 * specific items within them. Shared between BookDetailPage (sets
 * bookContext) and the in-editor navigation chrome (reads bookContext,
 * renders N/M counter + ↑↓).
 *
 * Chapter-headings are excluded everywhere — they are visual dividers,
 * not navigation targets, and are NOT counted in the M denominator.
 *
 * Spec: `.omc/plans/book-entity-prd.md` §8.
 */

import type { Book, BookItem } from "@/lib/types"

/** A BookItem that points at a real entity (not a divider). */
export type ContentBookItem = Extract<BookItem, { kind: "note" | "wiki" }>

/**
 * Returns the book's content items (notes + wikis) sorted by their
 * fractional-indexing `order` string. Chapter-headings are filtered out.
 *
 * Stable across renders — caller is expected to memoize on `book.items`.
 */
export function bookContentItems(book: Book): ContentBookItem[] {
  return book.items
    .filter((i): i is ContentBookItem => i.kind !== "chapter-heading")
    .sort((a, b) => (a.order < b.order ? -1 : a.order > b.order ? 1 : 0))
}

/**
 * Locate an entity inside a book by `(kind, refId)` and return both its
 * 0-based index in the content-only list and the total content count.
 *
 * Returns `index: -1` when the entity is not found (e.g., it was
 * removed from the book mid-session). Callers are expected to detect
 * `-1` and clear their bookContext.
 */
export function findItemIndexInBook(
  book: Book,
  kind: "note" | "wiki",
  refId: string,
): { index: number; total: number } {
  const items = bookContentItems(book)
  const index = items.findIndex((i) => i.kind === kind && i.refId === refId)
  return { index, total: items.length }
}

/**
 * Find all non-trashed books that contain a given entity (note or wiki
 * article) and return the entity's 0-based content index and total
 * content count within each book.
 *
 * Chapter-headings are excluded from both position and count (consistent
 * with `bookContentItems`). Trashed books are always omitted.
 */
export function booksContainingEntity(
  books: Book[],
  kind: "note" | "wiki",
  refId: string,
): Array<{ book: Book; index: number; total: number }> {
  const result: Array<{ book: Book; index: number; total: number }> = []
  for (const book of books) {
    if (book.trashed) continue
    const items = bookContentItems(book)
    const index = items.findIndex((i) => i.kind === kind && i.refId === refId)
    if (index >= 0) {
      result.push({ book, index, total: items.length })
    }
  }
  return result
}
