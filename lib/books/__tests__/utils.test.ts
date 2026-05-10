import { describe, it, expect } from "vitest"
import { generateKeyBetween } from "fractional-indexing"
import type { Book, BookItem, Note, Folder } from "../../types"
import {
  bookContentItems,
  findItemIndexInBook,
  resolvedContentItems,
  booksContainingEntityResolved,
} from "../utils"

/**
 * Phase 4 — `lib/books/utils` contract tests.
 *
 * These helpers drive the in-book navigation chrome (N/M counter + ↑↓).
 * The most important invariant tested here: chapter-headings are
 * EXCLUDED from both the sorted content list and the M denominator.
 *
 * Phase A Step 2.9 additions: `resolvedContentItems` and
 * `booksContainingEntityResolved` cover manual + auto item sequences.
 *
 * Spec: `.omc/plans/book-entity-prd.md` §8 (CRITIC #5).
 */

// ─── Manual-only factories (Phase 4 tests) ─────────────────────────────────

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

// ─── Resolved-item factories (Phase A Step 2.9 tests) ──────────────────────

function makeNoteEntity(
  id: string,
  folderIds: string[],
  updatedAt = "2026-01-01",
  trashed = false,
): Note {
  return {
    id,
    title: `Note ${id}`,
    content: "",
    status: "stone",
    folderIds,
    tags: [],
    labelId: null,
    reads: 0,
    createdAt: updatedAt,
    updatedAt,
    trashed,
  } as unknown as Note
}

function makeFolderEntity(id: string, name: string, kind: "note" | "wiki" = "note"): Folder {
  return { id, name, kind } as unknown as Folder
}

function makeResolvedBook(overrides: Partial<Book> = {}): Book {
  return {
    id: "book-resolved",
    title: "Resolved Book",
    items: [],
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    ...overrides,
  }
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

// ─── Phase A Step 2.9: resolvedContentItems ────────────────────────────────

describe("resolvedContentItems", () => {
  it("includes auto items from folder source", () => {
    const folder = makeFolderEntity("f1", "Daily")
    const notes = [makeNoteEntity("n1", ["f1"]), makeNoteEntity("n2", ["f1"])]
    const book = makeResolvedBook({ smartSources: [{ kind: "folder", refId: "f1" }] })
    const items = resolvedContentItems(book, { notes, folders: [folder] })
    expect(items).toHaveLength(2)
    expect(items.every((i) => i.kind === "note")).toBe(true)
  })

  it("combines manual + auto in correct order (manual top, auto bottom)", () => {
    const folder = makeFolderEntity("f1", "Daily")
    const manualNote = makeNoteEntity("manual", [])
    const autoNote = makeNoteEntity("auto", ["f1"])
    const book = makeResolvedBook({
      items: [{ kind: "note", id: "m1", refId: "manual", order: "a0" }],
      smartSources: [{ kind: "folder", refId: "f1" }],
    })
    const items = resolvedContentItems(book, {
      notes: [manualNote, autoNote],
      folders: [folder],
    })
    expect(items).toHaveLength(2)
    expect((items[0] as { refId: string }).refId).toBe("manual")
    expect((items[1] as { refId: string }).refId).toBe("auto")
    expect(items[0].source).toBe("manual")
    expect(items[1].source).toBe("auto")
  })

  it("excludes chapter-headings (all returned items are note or wiki)", () => {
    const folder = makeFolderEntity("f1", "Daily")
    const book = makeResolvedBook({
      smartSources: [{ kind: "folder", refId: "f1" }],
    })
    const items = resolvedContentItems(book, {
      notes: [makeNoteEntity("n1", ["f1"])],
      folders: [folder],
    })
    // ResolvedContentBookItem type guarantees kind is "note" | "wiki" —
    // assert the runtime value confirms no chapter-heading slipped through.
    expect(items.every((i) => i.kind === "note" || i.kind === "wiki")).toBe(true)
  })

  it("returns empty for empty book with no sources", () => {
    const book = makeResolvedBook()
    const items = resolvedContentItems(book, { notes: [], folders: [] })
    expect(items).toEqual([])
  })
})

// ─── Phase A Step 2.9: booksContainingEntityResolved ──────────────────────

describe("booksContainingEntityResolved", () => {
  it("finds entity in auto items (smart source membership)", () => {
    const folder = makeFolderEntity("f1", "Daily")
    const note = makeNoteEntity("n1", ["f1"])
    const book = makeResolvedBook({
      smartSources: [{ kind: "folder", refId: "f1" }],
    })
    const memberships = booksContainingEntityResolved(
      [book],
      { notes: [note], folders: [folder] },
      "note",
      "n1",
    )
    expect(memberships).toHaveLength(1)
    expect(memberships[0].index).toBe(0)
    expect(memberships[0].total).toBe(1)
  })

  it("excludes trashed books", () => {
    const folder = makeFolderEntity("f1", "Daily")
    const book = makeResolvedBook({
      trashed: true,
      smartSources: [{ kind: "folder", refId: "f1" }],
    })
    const memberships = booksContainingEntityResolved(
      [book],
      { notes: [makeNoteEntity("n1", ["f1"])], folders: [folder] },
      "note",
      "n1",
    )
    expect(memberships).toEqual([])
  })

  it("finds entity in manual items of a book with no smart sources", () => {
    const book = makeResolvedBook({
      items: [{ kind: "note", id: "m1", refId: "n1", order: "a0" }],
    })
    const memberships = booksContainingEntityResolved(
      [book],
      { notes: [], folders: [] },
      "note",
      "n1",
    )
    expect(memberships).toHaveLength(1)
    expect(memberships[0].index).toBe(0)
    expect(memberships[0].total).toBe(1)
  })

  it("returns empty when entity is not in any book", () => {
    const book = makeResolvedBook({
      items: [{ kind: "note", id: "m1", refId: "other", order: "a0" }],
    })
    const memberships = booksContainingEntityResolved(
      [book],
      { notes: [], folders: [] },
      "note",
      "n-missing",
    )
    expect(memberships).toEqual([])
  })

  it("reports correct index+total for entity alongside other pages", () => {
    const folder = makeFolderEntity("f1", "Daily")
    const notes = [
      makeNoteEntity("n1", ["f1"], "2026-01-03"),
      makeNoteEntity("n2", ["f1"], "2026-01-02"),
    ]
    const book = makeResolvedBook({
      smartSources: [{ kind: "folder", refId: "f1" }],
    })
    // n1 newest → index 0, n2 → index 1; total = 2
    const m1 = booksContainingEntityResolved(
      [book],
      { notes, folders: [folder] },
      "note",
      "n1",
    )
    expect(m1[0].index).toBe(0)
    expect(m1[0].total).toBe(2)

    const m2 = booksContainingEntityResolved(
      [book],
      { notes, folders: [folder] },
      "note",
      "n2",
    )
    expect(m2[0].index).toBe(1)
    expect(m2[0].total).toBe(2)
  })
})
