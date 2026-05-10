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
 * Phase A update (Step 2.9): `resolvedContentItems` / `findItemIndexInResolvedBook`
 * / `booksContainingEntityResolved` replace the manual-only variants for
 * in-book navigation so that auto items (from folder smart sources) are
 * included in the N/M counter and "In Books" membership.
 *
 * Spec: `.omc/plans/book-entity-prd.md` §8.
 */

import type { Book, BookItem, Note, Folder } from "@/lib/types"
import { resolveBookItems, type ResolvedBookItem } from "@/lib/books/resolver"

/** A BookItem that points at a real entity (not a divider). */
export type ContentBookItem = Extract<BookItem, { kind: "note" | "wiki" }>

/**
 * Returns the book's content items (notes + wikis) sorted by their
 * fractional-indexing `order` string. Chapter-headings are filtered out.
 *
 * Stable across renders — caller is expected to memoize on `book.items`.
 *
 * @deprecated Use `resolvedContentItems` instead so auto items (smart
 * sources) are included in the N/M counter and "In Books" membership.
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
 *
 * @deprecated Use `findItemIndexInResolvedBook` instead so auto items
 * are counted in the total denominator.
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
 *
 * @deprecated Use `booksContainingEntityResolved` instead so auto
 * memberships (smart source folder pulls) are included.
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

// ─── Resolved variants (Phase A Step 2.9) ──────────────────────────────────

/**
 * Minimal store snapshot for resolved-item helpers. Mirrors
 * `ResolverStore` from resolver.ts but re-exported here for
 * convenience so callers only need one import.
 */
export interface ResolverStoreSlice {
  notes: Note[]
  folders: Folder[]
}

/**
 * A `ResolvedBookItem` that is a navigation target (note or wiki).
 * Chapter-headings are filtered out — they are visual dividers only.
 */
export type ResolvedContentBookItem = Extract<ResolvedBookItem, { kind: "note" | "wiki" }>

/**
 * Returns the effective content items for a book — manual `book.items`
 * PLUS auto items resolved from `book.smartSources` (Phase A: folder
 * source only). Chapter-headings are excluded.
 *
 * This is the resolved equivalent of `bookContentItems` and must be
 * used for all in-book navigation (N/M counter, ↑↓ navigation) and
 * "In Books" membership checks so that auto notes are treated as
 * first-class pages (Linear-style page sequence).
 */
export function resolvedContentItems(
  book: Book,
  store: ResolverStoreSlice,
): ResolvedContentBookItem[] {
  return resolveBookItems(book, store).filter(
    (i): i is ResolvedContentBookItem => i.kind !== "chapter-heading",
  )
}

/**
 * Resolved equivalent of `findItemIndexInBook` — includes auto items in
 * both the index search and the total denominator.
 */
export function findItemIndexInResolvedBook(
  book: Book,
  store: ResolverStoreSlice,
  kind: "note" | "wiki",
  refId: string,
): { index: number; total: number } {
  const items = resolvedContentItems(book, store)
  const index = items.findIndex((i) => i.kind === kind && i.refId === refId)
  return { index, total: items.length }
}

/**
 * Resolved equivalent of `booksContainingEntity` — includes books where
 * the entity is pulled in via a smart source (e.g., folder source). A
 * note that lives in a folder assigned as a smart source will appear in
 * "In Books" even if it was never manually added to the book.
 *
 * Trashed books are always omitted.
 */
export function booksContainingEntityResolved(
  books: Book[],
  store: ResolverStoreSlice,
  kind: "note" | "wiki",
  refId: string,
): Array<{ book: Book; index: number; total: number }> {
  const result: Array<{ book: Book; index: number; total: number }> = []
  for (const book of books) {
    if (book.trashed) continue
    const items = resolvedContentItems(book, store)
    const index = items.findIndex((i) => i.kind === kind && i.refId === refId)
    if (index >= 0) {
      result.push({ book, index, total: items.length })
    }
  }
  return result
}
