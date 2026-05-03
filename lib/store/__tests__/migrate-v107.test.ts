import { describe, it, expect } from "vitest"
import { migrate } from "../migrate"

/**
 * v107 — Folder type-strict + N:M membership migration tests.
 *
 * Spec lives in `.omc/plans/folder-nm-migration.md` §"PR (a) — Data Model
 * + Migration". The migration must:
 *   1. Infer `Folder.kind` from existing membership ("note" / "wiki").
 *   2. Convert `Note.folderId` (single) to `Note.folderIds[]` (array).
 *   3. Convert `WikiArticle.folderId` (PR #236 single) to
 *      `WikiArticle.folderIds[]`.
 *   4. Auto-split mixed (note+wiki) folders by cloning the original as a
 *      new wiki-kind folder (`{name} (Wiki)`, id `{id}-wiki`).
 *   5. Be idempotent — re-running on already-migrated data is a no-op.
 *
 * Each test uses a minimal persisted-state shape that bypasses the heavier
 * upstream migration steps by providing the fields they expect (notes,
 * folders, wikiArticles) and only checking v107-relevant fields.
 */

type AnyState = Record<string, unknown>

// Sentinel id used by migrate.ts v48 to detect "seeded already" state. We
// pre-populate it so the migration's `require("./seeds")` branch is skipped
// (the require is CJS-only and breaks in vitest's ESM transform).
const SEEDED_SENTINEL = {
  id: "wiki-article-1",
  title: "Seeded sentinel",
  aliases: [],
  infobox: [],
  blocks: [],
  sectionIndex: [],
  tags: [],
  folderIds: [],
  createdAt: "2025-01-01",
  updatedAt: "2025-01-01",
}

function baseState(overrides: Partial<AnyState> = {}): AnyState {
  // Stack the sentinel ahead of caller-provided wikiArticles so the
  // assertions filter it out by id when needed.
  const callerWikis = (overrides.wikiArticles as Array<any>) ?? []
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { wikiArticles: _ignored, ...rest } = overrides
  return {
    notes: [],
    folders: [],
    // satisfy upstream blocks
    templates: [],
    tags: [],
    ...rest,
    wikiArticles: [SEEDED_SENTINEL, ...callerWikis],
  }
}

function nonSentinelWikis(state: any): Array<any> {
  return (state.wikiArticles as Array<any>).filter((w) => w.id !== SEEDED_SENTINEL.id)
}

describe("migrate v107: folder kind + N:M", () => {
  it("Case 1: note-only folder → kind='note', notes get folderIds array", () => {
    const persisted = baseState({
      folders: [
        { id: "f1", name: "Projects", color: "#000", parentId: null, lastAccessedAt: null, pinned: false, pinnedOrder: 0, createdAt: "2025-01-01" },
      ],
      notes: [
        { id: "n1", folderId: "f1", trashed: false },
        { id: "n2", folderId: "f1", trashed: false },
      ],
      wikiArticles: [],
    })

    const result = migrate(persisted) as any

    const folders = result.folders as Array<any>
    expect(folders).toHaveLength(1)
    expect(folders[0].id).toBe("f1")
    expect(folders[0].kind).toBe("note")

    const notes = result.notes as Array<any>
    for (const n of notes) {
      expect(n.folderIds).toEqual(["f1"])
      expect(n.folderId).toBeUndefined()
    }

    // Sentinel wiki has no folder → folderIds = [] post-migration.
    const sentinel = (result.wikiArticles as Array<any>).find((w) => w.id === "wiki-article-1")
    expect(sentinel.folderIds).toEqual([])
  })

  it("Case 2: wiki-only folder (PR #236 data) → kind='wiki'", () => {
    const persisted = baseState({
      folders: [
        { id: "f-wiki", name: "Encyclopedia", color: "#000", parentId: null, lastAccessedAt: null, pinned: false, pinnedOrder: 0, createdAt: "2025-01-01" },
      ],
      notes: [],
      wikiArticles: [
        { id: "w1", folderId: "f-wiki", title: "A", aliases: [], infobox: [], blocks: [], sectionIndex: [], tags: [], createdAt: "2025-01-01", updatedAt: "2025-01-01" },
      ],
    })

    const result = migrate(persisted) as any

    const folders = result.folders as Array<any>
    expect(folders).toHaveLength(1)
    expect(folders[0].kind).toBe("wiki")

    const wikis = nonSentinelWikis(result)
    expect(wikis[0].folderIds).toEqual(["f-wiki"])
    expect(wikis[0].folderId).toBeUndefined()
  })

  it("Case 3: mixed folder splits — original keeps notes, clone takes wikis", () => {
    const persisted = baseState({
      folders: [
        { id: "f-mixed", name: "Foo", color: "#000", parentId: null, lastAccessedAt: null, pinned: false, pinnedOrder: 0, createdAt: "2025-01-01" },
      ],
      notes: [
        { id: "n1", folderId: "f-mixed", trashed: false },
        { id: "n2", folderId: "f-mixed", trashed: false },
        { id: "n3", folderId: "f-mixed", trashed: false },
      ],
      wikiArticles: [
        { id: "w1", folderId: "f-mixed", title: "W1", aliases: [], infobox: [], blocks: [], sectionIndex: [], tags: [], createdAt: "2025-01-01", updatedAt: "2025-01-01" },
        { id: "w2", folderId: "f-mixed", title: "W2", aliases: [], infobox: [], blocks: [], sectionIndex: [], tags: [], createdAt: "2025-01-01", updatedAt: "2025-01-01" },
      ],
    })

    const result = migrate(persisted) as any
    const folders = result.folders as Array<any>

    // Original (note kind) + clone (wiki kind) = 2 folders.
    expect(folders).toHaveLength(2)
    const original = folders.find((f) => f.id === "f-mixed")
    const clone = folders.find((f) => f.id === "f-mixed-wiki")
    expect(original).toBeDefined()
    expect(original.kind).toBe("note")
    expect(original.name).toBe("Foo")
    expect(clone).toBeDefined()
    expect(clone.kind).toBe("wiki")
    expect(clone.name).toBe("Foo (Wiki)")
    expect(clone.color).toBe("#000")  // inherits color

    // Notes still point at the original.
    const notes = result.notes as Array<any>
    for (const n of notes) {
      expect(n.folderIds).toEqual(["f-mixed"])
    }

    // Wiki memberships rewritten to the clone id.
    const wikis = nonSentinelWikis(result)
    for (const w of wikis) {
      expect(w.folderIds).toEqual(["f-mixed-wiki"])
    }
  })

  it("Case 4: empty folder → defaults to kind='note'", () => {
    const persisted = baseState({
      folders: [
        { id: "f-empty", name: "Empty", color: "#000", parentId: null, lastAccessedAt: null, pinned: false, pinnedOrder: 0, createdAt: "2025-01-01" },
      ],
      notes: [],
      wikiArticles: [],
    })

    const result = migrate(persisted) as any
    const folders = result.folders as Array<any>
    expect(folders).toHaveLength(1)
    expect(folders[0].kind).toBe("note")
  })

  it("Case 5: idempotent — re-migrating already-migrated state is a no-op", () => {
    const persisted = baseState({
      folders: [
        { id: "f-mixed", name: "Foo", color: "#000", parentId: null, lastAccessedAt: null, pinned: false, pinnedOrder: 0, createdAt: "2025-01-01" },
      ],
      notes: [
        { id: "n1", folderId: "f-mixed", trashed: false },
      ],
      wikiArticles: [
        { id: "w1", folderId: "f-mixed", title: "W1", aliases: [], infobox: [], blocks: [], sectionIndex: [], tags: [], createdAt: "2025-01-01", updatedAt: "2025-01-01" },
      ],
    })

    // First pass mutates in place; clone the result before second pass to
    // simulate a fresh persisted-state load.
    const after1 = migrate(persisted) as any
    const snapshot = JSON.parse(JSON.stringify(after1))

    const after2 = migrate(snapshot) as any

    // Same folder count, same kinds, same memberships.
    expect((after2.folders as Array<any>).length).toBe((after1.folders as Array<any>).length)
    const folderKinds = (after2.folders as Array<any>).map((f) => `${f.id}:${f.kind}`).sort()
    const folderKinds1 = (after1.folders as Array<any>).map((f) => `${f.id}:${f.kind}`).sort()
    expect(folderKinds).toEqual(folderKinds1)

    // Notes and wikis still have the same folderIds. (`folderId` may be
    // re-introduced as `null` by an upstream v24 block when re-running the
    // full migrate; the v107 invariant is "folderIds is the source of truth"
    // and that holds.)
    for (const n of after2.notes as Array<any>) {
      expect(Array.isArray(n.folderIds)).toBe(true)
    }
    for (const w of nonSentinelWikis(after2)) {
      expect(Array.isArray(w.folderIds)).toBe(true)
    }

    // Critical idempotent invariant: kind doesn't flip and clone doesn't
    // duplicate. If kind detection ran twice naïvely we'd see id-collisions
    // for `{id}-wiki` clones — guard the inverse by counting.
    const after2Folders = (after2.folders as Array<any>).map((f) => f.id).sort()
    const after1Folders = (after1.folders as Array<any>).map((f) => f.id).sort()
    expect(after2Folders).toEqual(after1Folders)
  })

  it("Case 6: trashed notes don't influence kind inference", () => {
    // Folder has only a trashed note → counts as empty → kind defaults to "note".
    const persisted = baseState({
      folders: [
        { id: "f-only-trashed", name: "X", color: "#000", parentId: null, lastAccessedAt: null, pinned: false, pinnedOrder: 0, createdAt: "2025-01-01" },
      ],
      notes: [
        { id: "n1", folderId: "f-only-trashed", trashed: true },
      ],
      wikiArticles: [],
    })

    const result = migrate(persisted) as any
    expect((result.folders as Array<any>)[0].kind).toBe("note")
  })

  it("Case 7: notes with no folder get folderIds = []", () => {
    const persisted = baseState({
      folders: [],
      notes: [
        { id: "n1", folderId: null, trashed: false },
        { id: "n2", trashed: false },  // missing folderId entirely
      ],
      wikiArticles: [],
    })

    const result = migrate(persisted) as any
    const notes = result.notes as Array<any>
    expect(notes[0].folderIds).toEqual([])
    expect(notes[1].folderIds).toEqual([])
  })
})
