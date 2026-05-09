import { describe, it, expect, beforeEach } from "vitest"
import { createBooksSlice } from "../slices/books"
import type { Book, BookItem } from "../../types"

/**
 * Book Entity Phase 1 — slice contract tests.
 *
 * The slice manages cross-entity ordered sequences (notes + wiki articles
 * + chapter-heading dividers). Item order uses fractional-indexing string
 * keys, so inserts between items are O(1) without reindexing.
 *
 * Spec: `.omc/plans/book-entity-prd.md` §3 + §5.
 *
 * Tests use a thin in-memory state holder that mocks the Zustand `set`
 * callback API — same pattern as `folders-nm-actions.test.ts`.
 */

type State = {
  books: Book[]
}

function setupSlice(initial: State = { books: [] }) {
  let state = initial
  const set = (fn: ((s: any) => any) | any) => {
    if (typeof fn === "function") {
      const patch = fn(state)
      state = { ...state, ...patch }
    } else {
      state = { ...state, ...fn }
    }
  }
  const get = () => state
  const slice = createBooksSlice(set, get)
  return {
    slice,
    get: () => state,
    getBook: (id: string) => state.books.find((b) => b.id === id)!,
  }
}

/** Sort items by their fractional-indexing order field. */
function sortByOrder(items: BookItem[]): BookItem[] {
  return [...items].sort((a, b) => (a.order < b.order ? -1 : a.order > b.order ? 1 : 0))
}

describe("BooksSlice — CRUD", () => {
  let env: ReturnType<typeof setupSlice>

  beforeEach(() => {
    env = setupSlice()
  })

  it("createBook returns an id and inserts the book into the list", () => {
    const id = env.slice.createBook("My First Book")
    expect(typeof id).toBe("string")
    expect(id.length).toBeGreaterThan(0)
    const books = env.get().books
    expect(books).toHaveLength(1)
    expect(books[0].id).toBe(id)
    expect(books[0].title).toBe("My First Book")
    expect(books[0].items).toEqual([])
    expect(books[0].createdAt).toBeTruthy()
    expect(books[0].updatedAt).toBe(books[0].createdAt)
    expect(books[0].trashed).toBeUndefined()
  })

  it("createBook generates distinct ids for multiple books", () => {
    const a = env.slice.createBook("A")
    const b = env.slice.createBook("B")
    expect(a).not.toBe(b)
    expect(env.get().books).toHaveLength(2)
  })

  it("updateBook patches mutable fields and bumps updatedAt", async () => {
    const id = env.slice.createBook("Initial")
    const before = env.getBook(id).updatedAt
    // Sleep 5ms so the ISO timestamp differs.
    await new Promise((r) => setTimeout(r, 5))
    env.slice.updateBook(id, { title: "Renamed", description: "Hello" })
    const after = env.getBook(id)
    expect(after.title).toBe("Renamed")
    expect(after.description).toBe("Hello")
    expect(after.updatedAt > before).toBe(true)
    // id and createdAt are immutable
    expect(after.id).toBe(id)
  })

  it("updateBook with an unknown id is a no-op", () => {
    env.slice.createBook("A")
    env.slice.updateBook("ghost", { title: "X" })
    expect(env.get().books).toHaveLength(1)
    expect(env.get().books[0].title).toBe("A")
  })

  it("deleteBook (soft) sets trashed=true + trashedAt", () => {
    const id = env.slice.createBook("Test")
    env.slice.deleteBook(id)
    const b = env.getBook(id)
    expect(b.trashed).toBe(true)
    expect(b.trashedAt).toBeTruthy()
    expect(typeof b.trashedAt).toBe("string")
    // Book is still in the array (soft delete).
    expect(env.get().books).toHaveLength(1)
  })

  it("restoreBook clears trashed flag", () => {
    const id = env.slice.createBook("Test")
    env.slice.deleteBook(id)
    env.slice.restoreBook(id)
    const b = env.getBook(id)
    expect(b.trashed).toBe(false)
    expect(b.trashedAt).toBeNull()
  })

  it("permanentlyDeleteBook removes the book entirely", () => {
    const id = env.slice.createBook("Test")
    env.slice.permanentlyDeleteBook(id)
    expect(env.get().books).toHaveLength(0)
  })

  it("permanentlyDeleteBook is a no-op for unknown ids", () => {
    env.slice.createBook("A")
    env.slice.permanentlyDeleteBook("ghost")
    expect(env.get().books).toHaveLength(1)
  })
})

describe("BooksSlice — Item management", () => {
  let env: ReturnType<typeof setupSlice>
  let bookId: string

  beforeEach(() => {
    env = setupSlice()
    bookId = env.slice.createBook("Test Book")
  })

  it("addItemToBook appends a note item with a fractional-indexing order", () => {
    env.slice.addItemToBook(bookId, { kind: "note", refId: "note-1" })
    const book = env.getBook(bookId)
    expect(book.items).toHaveLength(1)
    const item = book.items[0]
    expect(item.kind).toBe("note")
    expect((item as any).refId).toBe("note-1")
    expect(typeof item.order).toBe("string")
    expect(item.order.length).toBeGreaterThan(0)
  })

  it("addItemToBook appends a wiki item", () => {
    env.slice.addItemToBook(bookId, { kind: "wiki", refId: "wiki-1" })
    const book = env.getBook(bookId)
    expect(book.items).toHaveLength(1)
    expect(book.items[0].kind).toBe("wiki")
    expect((book.items[0] as any).refId).toBe("wiki-1")
  })

  it("addItemToBook dedups same (kind, refId) silently", () => {
    env.slice.addItemToBook(bookId, { kind: "note", refId: "note-1" })
    env.slice.addItemToBook(bookId, { kind: "note", refId: "note-1" })
    const book = env.getBook(bookId)
    expect(book.items).toHaveLength(1)
  })

  it("addItemToBook allows same refId for different kinds (note vs wiki)", () => {
    // Edge case: hypothetical id collision across slices is allowed because
    // dedup is keyed by (kind, refId), not refId alone.
    env.slice.addItemToBook(bookId, { kind: "note", refId: "shared-id" })
    env.slice.addItemToBook(bookId, { kind: "wiki", refId: "shared-id" })
    expect(env.getBook(bookId).items).toHaveLength(2)
  })

  it("addItemToBook items remain sorted by order field as a sequence", () => {
    env.slice.addItemToBook(bookId, { kind: "note", refId: "a" })
    env.slice.addItemToBook(bookId, { kind: "note", refId: "b" })
    env.slice.addItemToBook(bookId, { kind: "note", refId: "c" })
    const book = env.getBook(bookId)
    const sorted = sortByOrder(book.items)
    // Insertion order matches lexicographic order
    expect(sorted.map((i) => (i as any).refId)).toEqual(["a", "b", "c"])
    // All orders distinct
    const orders = new Set(sorted.map((i) => i.order))
    expect(orders.size).toBe(3)
  })

  it("addChapterHeading appends with valid order when no anchor", () => {
    env.slice.addItemToBook(bookId, { kind: "note", refId: "n1" })
    env.slice.addChapterHeading(bookId, "Chapter 1")
    const book = env.getBook(bookId)
    expect(book.items).toHaveLength(2)
    const sorted = sortByOrder(book.items)
    expect(sorted[1].kind).toBe("chapter-heading")
    expect((sorted[1] as any).title).toBe("Chapter 1")
  })

  it("addChapterHeading inserts after a specific item when anchor given", () => {
    env.slice.addItemToBook(bookId, { kind: "note", refId: "a" })
    env.slice.addItemToBook(bookId, { kind: "note", refId: "b" })
    env.slice.addItemToBook(bookId, { kind: "note", refId: "c" })
    const aId = env.getBook(bookId).items.find((i) => (i as any).refId === "a")!.id
    env.slice.addChapterHeading(bookId, "Between A and B", aId)
    const sorted = sortByOrder(env.getBook(bookId).items)
    expect(sorted.map((i) => (i.kind === "chapter-heading" ? `H:${(i as any).title}` : (i as any).refId))).toEqual([
      "a",
      "H:Between A and B",
      "b",
      "c",
    ])
  })

  it("removeItemFromBook drops a single item by id", () => {
    env.slice.addItemToBook(bookId, { kind: "note", refId: "a" })
    env.slice.addItemToBook(bookId, { kind: "note", refId: "b" })
    const aId = env.getBook(bookId).items.find((i) => (i as any).refId === "a")!.id
    env.slice.removeItemFromBook(bookId, aId)
    const remaining = env.getBook(bookId).items
    expect(remaining).toHaveLength(1)
    expect((remaining[0] as any).refId).toBe("b")
  })

  it("removeItemFromBook is a no-op for unknown id", () => {
    env.slice.addItemToBook(bookId, { kind: "note", refId: "a" })
    env.slice.removeItemFromBook(bookId, "ghost")
    expect(env.getBook(bookId).items).toHaveLength(1)
  })

  it("updateChapterHeading changes the title in place", () => {
    env.slice.addChapterHeading(bookId, "Original")
    const id = env.getBook(bookId).items[0].id
    env.slice.updateChapterHeading(bookId, id, "New Title")
    const heading = env.getBook(bookId).items[0]
    expect(heading.kind).toBe("chapter-heading")
    expect((heading as any).title).toBe("New Title")
  })

  it("updateChapterHeading is a no-op when the item is not a heading", () => {
    env.slice.addItemToBook(bookId, { kind: "note", refId: "n1" })
    const id = env.getBook(bookId).items[0].id
    env.slice.updateChapterHeading(bookId, id, "Should not stick")
    const item = env.getBook(bookId).items[0]
    // Note item still has no `title` field
    expect((item as any).title).toBeUndefined()
  })
})

describe("BooksSlice — Reorder", () => {
  let env: ReturnType<typeof setupSlice>
  let bookId: string

  beforeEach(() => {
    env = setupSlice()
    bookId = env.slice.createBook("Reorder Test")
    env.slice.addItemToBook(bookId, { kind: "note", refId: "a" })
    env.slice.addItemToBook(bookId, { kind: "note", refId: "b" })
    env.slice.addItemToBook(bookId, { kind: "note", refId: "c" })
  })

  it("reorderBookItems moves an item between two neighbors and updates order", () => {
    const items = env.getBook(bookId).items
    const aId = items.find((i) => (i as any).refId === "a")!.id
    const bId = items.find((i) => (i as any).refId === "b")!.id
    const cId = items.find((i) => (i as any).refId === "c")!.id

    // Move "c" between "a" and "b" — sequence becomes a, c, b
    env.slice.reorderBookItems(bookId, cId, aId, bId)

    const sorted = sortByOrder(env.getBook(bookId).items)
    expect(sorted.map((i) => (i as any).refId)).toEqual(["a", "c", "b"])

    // Orders are still distinct strings
    const orders = sorted.map((i) => i.order)
    expect(new Set(orders).size).toBe(3)
  })

  it("reorderBookItems can move to the front (newPrevId=null)", () => {
    const items = env.getBook(bookId).items
    const aId = items.find((i) => (i as any).refId === "a")!.id
    const cId = items.find((i) => (i as any).refId === "c")!.id

    env.slice.reorderBookItems(bookId, cId, null, aId)
    const sorted = sortByOrder(env.getBook(bookId).items)
    expect(sorted.map((i) => (i as any).refId)).toEqual(["c", "a", "b"])
  })

  it("reorderBookItems can move to the end (newNextId=null)", () => {
    const items = env.getBook(bookId).items
    const aId = items.find((i) => (i as any).refId === "a")!.id
    const cId = items.find((i) => (i as any).refId === "c")!.id

    env.slice.reorderBookItems(bookId, aId, cId, null)
    const sorted = sortByOrder(env.getBook(bookId).items)
    expect(sorted.map((i) => (i as any).refId)).toEqual(["b", "c", "a"])
  })

  it("100 inserts at position 0 produce distinct, sortable orders", () => {
    // The classic fractional-indexing test: rapidly inserting at the front
    // must not collapse to underflow (this is what halving-integer schemes
    // get wrong). The `fractional-indexing` package handles this cleanly.
    const localEnv = setupSlice()
    const bid = localEnv.slice.createBook("Stress")

    // Seed with one item so we have a "next" anchor.
    localEnv.slice.addItemToBook(bid, { kind: "note", refId: "anchor" })

    for (let i = 0; i < 100; i++) {
      localEnv.slice.addItemToBook(bid, { kind: "note", refId: `n${i}` })
      // After append, immediately move the new item to the very front.
      const items = localEnv.getBook(bid).items
      const newest = items.find((it) => (it as any).refId === `n${i}`)!
      const sorted = sortByOrder(items)
      const first = sorted[0]
      if (first.id === newest.id) continue // already first
      // newPrev=null, newNext=current first
      localEnv.slice.reorderBookItems(bid, newest.id, null, first.id)
    }

    const sorted = sortByOrder(localEnv.getBook(bid).items)
    // 101 items total (anchor + 100)
    expect(sorted).toHaveLength(101)
    // All orders distinct
    const orders = sorted.map((i) => i.order)
    expect(new Set(orders).size).toBe(101)
    // Last 100 should be in reverse-insertion order at the front
    // (n99 first, n98 second, …, n0 100th, anchor last)
    const refIds = sorted.map((i) => (i as any).refId)
    expect(refIds[0]).toBe("n99")
    expect(refIds[refIds.length - 1]).toBe("anchor")
  })
})

describe("BooksSlice — Cross-cutting", () => {
  it("dedup is per-book — same refId can live in multiple books", () => {
    const env = setupSlice()
    const aBookId = env.slice.createBook("A")
    const bBookId = env.slice.createBook("B")
    env.slice.addItemToBook(aBookId, { kind: "note", refId: "shared" })
    env.slice.addItemToBook(bBookId, { kind: "note", refId: "shared" })
    expect(env.getBook(aBookId).items).toHaveLength(1)
    expect(env.getBook(bBookId).items).toHaveLength(1)
  })

  it("addItemToBook bumps the book's updatedAt", async () => {
    const env = setupSlice()
    const id = env.slice.createBook("X")
    const before = env.getBook(id).updatedAt
    await new Promise((r) => setTimeout(r, 5))
    env.slice.addItemToBook(id, { kind: "note", refId: "n" })
    const after = env.getBook(id).updatedAt
    expect(after > before).toBe(true)
  })
})
