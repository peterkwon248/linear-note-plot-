import { describe, it, expect } from "vitest"
import { generateKeyBetween } from "fractional-indexing"
import type { Book, BookItem } from "../../types"
import { bookContentItems, findItemIndexInBook } from "../utils"

/**
 * Phase 4 — `lib/books/utils` contract tests.
 *
 * These helpers drive the in-book navigation chrome (N/M counter + ↑↓).
 * The most important invariant tested here: chapter-headings are
 * EXCLUDED from both the sorted content list and the M denominator.
 *
 * Spec: `.omc/plans/book-entity-prd.md` §8 (CRITIC #5).
 */

function makeBook(items: BookItem[]): Book {
  return {
    id: "book-1",
    title: "Test Book",
    items,
    createdAt: "2026-05-09T00:00:00Z",
    updatedAt: "2026-05-09T00:00:00Z",
  }
}

function makeNote(refId: string, order: string): BookItem {
  return { kind: "note", id: `note-row-${refId}`, refId, order }
}

function makeWiki(refId: string, order: string): BookItem {
  return { kind: "wiki", id: `wiki-row-${refId}`, refId, order }
}

function makeHeading(title: string, order: string): BookItem {
  return { kind: "chapter-heading", id: `head-${title}`, title, order }
}

describe("bookContentItems", () => {
  it("returns empty array for empty book", () => {
    const book = makeBook([])
    expect(bookContentItems(book)).toEqual([])
  })

  it("filters out chapter-headings", () => {
    const a0 = generateKeyBetween(null, null)
    const a1 = generateKeyBetween(a0, null)
    const a2 = generateKeyBetween(a1, null)
    const book = makeBook([
      makeNote("n1", a0),
      makeHeading("Part II", a1),
      makeNote("n2", a2),
    ])
    const items = bookContentItems(book)
    expect(items).toHaveLength(2)
    expect(items.map((i) => i.refId)).toEqual(["n1", "n2"])
    // ContentBookItem narrows kind to "note" | "wiki" — assertion confirms
    // bookContentItems removed the chapter-heading and the type narrows.
    expect(items.every((i) => i.kind === "note" || i.kind === "wiki")).toBe(true)
  })

  it("sorts items by fractional-indexing order", () => {
    // Insert in scrambled order to confirm sorting happens
    const a0 = generateKeyBetween(null, null)
    const a1 = generateKeyBetween(a0, null)
    const a2 = generateKeyBetween(a1, null)
    const book = makeBook([
      makeWiki("w-z", a2),
      makeNote("n-a", a0),
      makeWiki("w-m", a1),
    ])
    const items = bookContentItems(book)
    expect(items.map((i) => i.refId)).toEqual(["n-a", "w-m", "w-z"])
  })

  it("returns 0 content items for headings-only book", () => {
    const a0 = generateKeyBetween(null, null)
    const a1 = generateKeyBetween(a0, null)
    const book = makeBook([makeHeading("One", a0), makeHeading("Two", a1)])
    expect(bookContentItems(book)).toEqual([])
  })

  it("preserves note + wiki kinds in mixed book", () => {
    const a0 = generateKeyBetween(null, null)
    const a1 = generateKeyBetween(a0, null)
    const a2 = generateKeyBetween(a1, null)
    const book = makeBook([
      makeNote("n1", a0),
      makeWiki("w1", a1),
      makeNote("n2", a2),
    ])
    const items = bookContentItems(book)
    expect(items.map((i) => i.kind)).toEqual(["note", "wiki", "note"])
  })
})

describe("findItemIndexInBook", () => {
  it("returns index 0 and total 1 for single-item book", () => {
    const a0 = generateKeyBetween(null, null)
    const book = makeBook([makeNote("n1", a0)])
    expect(findItemIndexInBook(book, "note", "n1")).toEqual({ index: 0, total: 1 })
  })

  it("returns -1 index when entity not in book", () => {
    const a0 = generateKeyBetween(null, null)
    const book = makeBook([makeNote("n1", a0)])
    expect(findItemIndexInBook(book, "note", "missing")).toEqual({ index: -1, total: 1 })
  })

  it("excludes headings from total denominator", () => {
    const a0 = generateKeyBetween(null, null)
    const a1 = generateKeyBetween(a0, null)
    const a2 = generateKeyBetween(a1, null)
    const book = makeBook([
      makeNote("n1", a0),
      makeHeading("Part II", a1),
      makeNote("n2", a2),
    ])
    expect(findItemIndexInBook(book, "note", "n1")).toEqual({ index: 0, total: 2 })
    // Heading at order=a1 doesn't get counted; n2 is the 2nd content item.
    expect(findItemIndexInBook(book, "note", "n2")).toEqual({ index: 1, total: 2 })
  })

  it("disambiguates by kind: note id and wiki id share namespace", () => {
    // Same refId across note + wiki — index must respect kind.
    const a0 = generateKeyBetween(null, null)
    const a1 = generateKeyBetween(a0, null)
    const book = makeBook([
      makeNote("xyz", a0),
      makeWiki("xyz", a1),
    ])
    expect(findItemIndexInBook(book, "note", "xyz")).toEqual({ index: 0, total: 2 })
    expect(findItemIndexInBook(book, "wiki", "xyz")).toEqual({ index: 1, total: 2 })
  })

  it("returns total 0 for headings-only book", () => {
    const a0 = generateKeyBetween(null, null)
    const book = makeBook([makeHeading("Only Heading", a0)])
    expect(findItemIndexInBook(book, "note", "n1")).toEqual({ index: -1, total: 0 })
  })

  it("computes correct index after reorder", () => {
    // Caller mutates order; helper should respect new sort.
    const a0 = generateKeyBetween(null, null)
    const a1 = generateKeyBetween(a0, null)
    const a2 = generateKeyBetween(a1, null)
    const book = makeBook([
      makeNote("n1", a0),
      makeNote("n2", a1),
      makeNote("n3", a2),
    ])
    expect(findItemIndexInBook(book, "note", "n3")).toEqual({ index: 2, total: 3 })

    // Move n3 to between n1 and n2 by giving it a new order key.
    const between = generateKeyBetween(a0, a1)
    const reorderedBook: Book = {
      ...book,
      items: book.items.map((i) =>
        i.kind === "note" && i.refId === "n3" ? { ...i, order: between } : i,
      ),
    }
    expect(findItemIndexInBook(reorderedBook, "note", "n3")).toEqual({ index: 1, total: 3 })
    expect(findItemIndexInBook(reorderedBook, "note", "n2")).toEqual({ index: 2, total: 3 })
  })
})
