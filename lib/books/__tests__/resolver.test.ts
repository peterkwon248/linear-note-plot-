import { describe, it, expect } from "vitest"
import { resolveBookItems, type ResolverStore } from "../resolver"
import type { Book, Note, Folder } from "@/lib/types"

function makeNote(
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

function makeFolder(id: string, name: string, kind: "note" | "wiki" = "note"): Folder {
  return { id, name, kind } as unknown as Folder
}

function makeBook(overrides: Partial<Book> = {}): Book {
  return {
    id: "book-1",
    title: "Test Book",
    items: [],
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    ...overrides,
  }
}

describe("resolveBookItems — manual only (no smart sources)", () => {
  it("returns manual items as-is with source='manual'", () => {
    const book = makeBook({
      items: [
        { kind: "note", id: "i1", refId: "n1", order: "a0" },
        { kind: "chapter-heading", id: "i2", title: "Ch1", order: "a1" },
      ],
    })
    const store: ResolverStore = { notes: [makeNote("n1", [])], folders: [] }
    const result = resolveBookItems(book, store)
    expect(result).toHaveLength(2)
    expect(result.every((r) => r.source === "manual")).toBe(true)
  })

  it("returns empty array for empty book", () => {
    const result = resolveBookItems(makeBook(), { notes: [], folders: [] })
    expect(result).toEqual([])
  })
})

describe("resolveBookItems — folder source", () => {
  it("auto-resolves notes from folder source with chapter heading", () => {
    const folder = makeFolder("f1", "Projects")
    const notes = [
      makeNote("n1", ["f1"], "2026-01-02"),
      makeNote("n2", ["f1"], "2026-01-03"),
      makeNote("n3", ["other"], "2026-01-04"),
    ]
    const book = makeBook({ smartSources: [{ kind: "folder", refId: "f1" }] })
    const result = resolveBookItems(book, { notes, folders: [folder] })

    expect(result).toHaveLength(3) // heading + 2 notes
    expect(result[0].kind).toBe("chapter-heading")
    expect((result[0] as any).title).toBe("📁 Projects")
    expect(result[0].source).toBe("auto")
    // updatedAt desc: n2 (2026-01-03) before n1 (2026-01-02)
    expect((result[1] as any).refId).toBe("n2")
    expect((result[2] as any).refId).toBe("n1")
  })

  it("excludes trashed notes", () => {
    const folder = makeFolder("f1", "Projects")
    const notes = [
      makeNote("n1", ["f1"], "2026-01-01", false),
      makeNote("n2", ["f1"], "2026-01-02", true),
    ]
    const book = makeBook({ smartSources: [{ kind: "folder", refId: "f1" }] })
    const result = resolveBookItems(book, { notes, folders: [folder] })
    const noteItems = result.filter((r) => r.kind === "note")
    expect(noteItems).toHaveLength(1)
    expect((noteItems[0] as any).refId).toBe("n1")
  })

  it("respects excludeIds (manual override exclusion)", () => {
    const folder = makeFolder("f1", "Projects")
    const notes = [makeNote("n1", ["f1"]), makeNote("n2", ["f1"])]
    const book = makeBook({
      smartSources: [{ kind: "folder", refId: "f1" }],
      excludeIds: ["n1"],
    })
    const result = resolveBookItems(book, { notes, folders: [folder] })
    const noteItems = result.filter((r) => r.kind === "note")
    expect(noteItems).toHaveLength(1)
    expect((noteItems[0] as any).refId).toBe("n2")
  })

  it("skips notes already manual-positioned (manual override placement)", () => {
    const folder = makeFolder("f1", "Projects")
    const notes = [makeNote("n1", ["f1"]), makeNote("n2", ["f1"])]
    const book = makeBook({
      items: [{ kind: "note", id: "manual-1", refId: "n1", order: "a0" }],
      smartSources: [{ kind: "folder", refId: "f1" }],
    })
    const result = resolveBookItems(book, { notes, folders: [folder] })
    // n1 = manual (one occurrence), n2 = auto. heading + n2 + manual-n1.
    const noteItems = result.filter((r) => r.kind === "note")
    expect(noteItems).toHaveLength(2)
    const refs = noteItems.map((r) => (r as any).refId)
    expect(refs).toContain("n1")
    expect(refs).toContain("n2")
    // n1 should be manual, n2 should be auto
    const n1Item = noteItems.find((r) => (r as any).refId === "n1")!
    const n2Item = noteItems.find((r) => (r as any).refId === "n2")!
    expect(n1Item.source).toBe("manual")
    expect(n2Item.source).toBe("auto")
  })

  it("skips deleted folder source (hard-delete safety)", () => {
    const notes = [makeNote("n1", ["f1"])]
    const book = makeBook({ smartSources: [{ kind: "folder", refId: "f1" }] })
    // No folder in store (hard-deleted)
    const result = resolveBookItems(book, { notes, folders: [] })
    expect(result).toEqual([])
  })

  it("LOCKED #5c — manual items always before auto items by order", () => {
    const folder = makeFolder("f1", "Projects")
    const notes = [makeNote("n1", ["f1"]), makeNote("n2", ["f1"])]
    const book = makeBook({
      items: [{ kind: "note", id: "m1", refId: "manual-only", order: "a0" }],
      smartSources: [{ kind: "folder", refId: "f1" }],
    })
    const result = resolveBookItems(book, {
      notes: [...notes, makeNote("manual-only", [])],
      folders: [folder],
    })
    expect(result[0].source).toBe("manual")
    // All manual items appear before all auto items
    const lastManualIdx = result
      .map((r, i) => ({ src: r.source, i }))
      .filter((x) => x.src === "manual")
      .pop()!.i
    const firstAutoIdx = result
      .map((r, i) => ({ src: r.source, i }))
      .find((x) => x.src === "auto")!.i
    expect(lastManualIdx).toBeLessThan(firstAutoIdx)
  })

  it("multiple folder sources — each gets own heading + dedup across sources", () => {
    const f1 = makeFolder("f1", "Projects")
    const f2 = makeFolder("f2", "Personal")
    const notes = [
      makeNote("shared", ["f1", "f2"], "2026-01-03"),
      makeNote("only-f1", ["f1"], "2026-01-02"),
      makeNote("only-f2", ["f2"], "2026-01-01"),
    ]
    const book = makeBook({
      smartSources: [
        { kind: "folder", refId: "f1" },
        { kind: "folder", refId: "f2" },
      ],
    })
    const result = resolveBookItems(book, { notes, folders: [f1, f2] })
    // Expect 2 chapter-headings + 3 unique notes (shared appears once, under f1)
    const headings = result.filter((r) => r.kind === "chapter-heading")
    const noteItems = result.filter((r) => r.kind === "note")
    expect(headings).toHaveLength(2)
    expect(noteItems).toHaveLength(3)
    // shared appears under f1 (first source)
    const sharedItem = noteItems.find((r) => (r as any).refId === "shared")!
    expect(sharedItem.sourceRefId).toBe("f1")
  })

  it("ignores non-folder source kinds (Phase B-E guard)", () => {
    const folder = makeFolder("f1", "Projects")
    const book = makeBook({
      smartSources: [
        { kind: "tag", refId: "t1" },
        { kind: "category", refId: "c1" },
        { kind: "folder", refId: "f1" },
      ],
    })
    const result = resolveBookItems(book, {
      notes: [makeNote("n1", ["f1"])],
      folders: [folder],
    })
    // Only folder source resolves — 1 heading + 1 note
    expect(result).toHaveLength(2)
    expect((result[0] as any).title).toBe("📁 Projects")
  })

  it("auto book-internal id is deterministic (`auto-{sourceRefId}-{noteId}`)", () => {
    const folder = makeFolder("f1", "Projects")
    const book = makeBook({ smartSources: [{ kind: "folder", refId: "f1" }] })
    const result = resolveBookItems(book, {
      notes: [makeNote("n1", ["f1"])],
      folders: [folder],
    })
    const noteItem = result.find((r) => r.kind === "note")!
    expect(noteItem.id).toBe("auto-f1-n1")
    const heading = result.find((r) => r.kind === "chapter-heading")!
    expect(heading.id).toBe("auto-heading-f1")
  })

  it("ignores wiki folder source (Phase A: kind=note only, PRD §5.3)", () => {
    const wikiFolder = makeFolder("f1", "Wiki Folder", "wiki")
    const book = makeBook({ smartSources: [{ kind: "folder", refId: "f1" }] })
    const result = resolveBookItems(book, { notes: [], folders: [wikiFolder] })
    expect(result).toEqual([]) // No heading, no notes
  })

  it("empty note folder skips heading entirely (LOCKED #10 revised v1.2)", () => {
    const folder = makeFolder("f1", "Empty Folder")
    const book = makeBook({ smartSources: [{ kind: "folder", refId: "f1" }] })
    const result = resolveBookItems(book, { notes: [], folders: [folder] })
    // v1.2: orphan heading hidden — source visibility lives in SourcesSection chip
    expect(result).toEqual([])
  })

  it("source where every note is already manual skips heading (LOCKED #10 revised)", () => {
    const folder = makeFolder("f1", "Daily Log")
    const notes = [makeNote("n1", ["f1"]), makeNote("n2", ["f1"])]
    const book = makeBook({
      items: [
        { kind: "note", id: "m1", refId: "n1", order: "a0" },
        { kind: "note", id: "m2", refId: "n2", order: "a1" },
      ],
      smartSources: [{ kind: "folder", refId: "f1" }],
    })
    const result = resolveBookItems(book, { notes, folders: [folder] })
    // Both notes are manual → auto candidates empty → no auto heading emitted
    const headings = result.filter((r) => r.kind === "chapter-heading")
    expect(headings).toHaveLength(0)
    expect(result).toHaveLength(2) // only manual items
    expect(result.every((r) => r.source === "manual")).toBe(true)
  })
})
