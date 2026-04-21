/**
 * Book Pivot Phase 1A-2 — Selectors for Book data.
 *
 * These read from existing `state.wikiArticles` and convert on-the-fly via
 * `adapter.ts`. No storage changes. Phase 1A-3 will add a real `books` slice
 * and flip these to read from `state.books` directly.
 *
 * Usage:
 *   const book = useStore((s) => selectBookById(s, id))
 *   const books = useStore(selectAllBooks)
 */

import type { WikiArticle } from "../types"
import type { Book } from "./types"
import { wikiArticleToBook } from "./adapter"

// Plot stores wikiArticles as a flat array (lib/store/types.ts:120).
interface StoreReadable {
  wikiArticles: WikiArticle[]
}

/** Get a single Book by ID. Returns null if not found. */
export function selectBookById(state: StoreReadable, id: string): Book | null {
  const article = state.wikiArticles.find((a) => a.id === id)
  if (!article) return null
  return wikiArticleToBook(article)
}

/** Get all Books as an array. Order matches wikiArticles insertion order. */
export function selectAllBooks(state: StoreReadable): Book[] {
  return state.wikiArticles.map(wikiArticleToBook)
}

/** Count. */
export function selectBookCount(state: StoreReadable): number {
  return state.wikiArticles.length
}
