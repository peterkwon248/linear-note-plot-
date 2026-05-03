import { describe, it, expect, beforeEach } from "vitest"
import { createFoldersSlice } from "../slices/folders"
import type { Folder, Note, WikiArticle } from "../../types"

/**
 * PR (c) — N:M folder membership action semantics.
 *
 * The slice actions for adding / removing / replacing folder membership
 * were introduced in PR (a) but only exercised through the migration
 * tests. PR (c) makes them user-facing (chip strip, multi-picker, DnD
 * "Add to folder" modifier), so we lock down the contract:
 *
 *   - addNoteToFolder + addWikiToFolder are idempotent and kind-validated.
 *   - removeNoteFromFolder + removeWikiFromFolder are idempotent.
 *   - setNoteFolders + setWikiFolders replace wholesale, dedup, and
 *     filter wrong-kind ids defensively.
 *
 * We mock the Zustand `set` callback with a thin in-memory state holder
 * so we don't depend on the full store / persistence layer. Each action
 * mutates the holder via the same callback API the real store exposes.
 */

type State = {
  folders: Folder[]
  notes: Note[]
  wikiArticles: WikiArticle[]
}

function makeFolder(id: string, kind: "note" | "wiki", name = id): Folder {
  return {
    id,
    name,
    color: "#000000",
    parentId: null,
    lastAccessedAt: null,
    pinned: false,
    pinnedOrder: 0,
    createdAt: "2025-01-01T00:00:00.000Z",
    kind,
  }
}

function makeNote(id: string, folderIds: string[]): Note {
  // Cast: the test only exercises folderIds — other Note fields are not
  // touched by these actions and the slice doesn't validate them.
  return {
    id,
    folderIds,
    trashed: false,
  } as unknown as Note
}

function makeWiki(id: string, folderIds: string[]): WikiArticle {
  return {
    id,
    folderIds,
  } as unknown as WikiArticle
}

function setupSlice(initial: State) {
  let state = initial
  const set = (fn: ((s: any) => any) | any) => {
    if (typeof fn === "function") {
      const patch = fn(state)
      // The slice returns either a partial state or the full state object
      // unchanged when an action no-ops — replicate Zustand's shallow
      // merge so call sites that return `state` (no-op) stay stable.
      state = { ...state, ...patch }
    } else {
      state = { ...state, ...fn }
    }
  }
  const slice = createFoldersSlice(set)
  return {
    slice,
    get: () => state,
  }
}

describe("PR (c): N:M folder membership actions", () => {
  let env: ReturnType<typeof setupSlice>

  beforeEach(() => {
    env = setupSlice({
      folders: [
        makeFolder("fn1", "note", "Notes A"),
        makeFolder("fn2", "note", "Notes B"),
        makeFolder("fw1", "wiki", "Wiki A"),
      ],
      notes: [
        makeNote("n1", []),
        makeNote("n2", ["fn1"]),
      ],
      wikiArticles: [
        makeWiki("w1", []),
        makeWiki("w2", ["fw1"]),
      ],
    })
  })

  /* ── addNoteToFolder ────────────────────────────────── */

  it("addNoteToFolder: adds folder id to a note's folderIds", () => {
    env.slice.addNoteToFolder("n1", "fn1")
    const n1 = env.get().notes.find((n) => n.id === "n1")!
    expect(n1.folderIds).toEqual(["fn1"])
  })

  it("addNoteToFolder: idempotent — re-adding an existing folder is a no-op", () => {
    env.slice.addNoteToFolder("n2", "fn1")
    const n2 = env.get().notes.find((n) => n.id === "n2")!
    expect(n2.folderIds).toEqual(["fn1"])
  })

  it("addNoteToFolder: appends — preserves prior memberships", () => {
    env.slice.addNoteToFolder("n2", "fn2")
    const n2 = env.get().notes.find((n) => n.id === "n2")!
    expect(n2.folderIds).toEqual(["fn1", "fn2"])
  })

  it("addNoteToFolder: refuses kind='wiki' folder (no mutation)", () => {
    env.slice.addNoteToFolder("n1", "fw1")
    const n1 = env.get().notes.find((n) => n.id === "n1")!
    expect(n1.folderIds).toEqual([])
  })

  it("addNoteToFolder: refuses unknown folder id (no mutation)", () => {
    env.slice.addNoteToFolder("n1", "doesnotexist")
    const n1 = env.get().notes.find((n) => n.id === "n1")!
    expect(n1.folderIds).toEqual([])
  })

  /* ── removeNoteFromFolder ───────────────────────────── */

  it("removeNoteFromFolder: removes the membership", () => {
    env.slice.removeNoteFromFolder("n2", "fn1")
    const n2 = env.get().notes.find((n) => n.id === "n2")!
    expect(n2.folderIds).toEqual([])
  })

  it("removeNoteFromFolder: idempotent — removing absent folder is a no-op", () => {
    env.slice.removeNoteFromFolder("n1", "fn1")
    const n1 = env.get().notes.find((n) => n.id === "n1")!
    expect(n1.folderIds).toEqual([])
  })

  /* ── setNoteFolders (multi picker Apply) ────────────── */

  it("setNoteFolders: replaces the entire set wholesale", () => {
    env.slice.setNoteFolders("n2", ["fn2"])
    const n2 = env.get().notes.find((n) => n.id === "n2")!
    expect(n2.folderIds).toEqual(["fn2"])
  })

  it("setNoteFolders: empty array clears membership", () => {
    env.slice.setNoteFolders("n2", [])
    const n2 = env.get().notes.find((n) => n.id === "n2")!
    expect(n2.folderIds).toEqual([])
  })

  it("setNoteFolders: dedups duplicate ids in the input", () => {
    env.slice.setNoteFolders("n1", ["fn1", "fn2", "fn1"])
    const n1 = env.get().notes.find((n) => n.id === "n1")!
    expect(n1.folderIds).toEqual(["fn1", "fn2"])
  })

  it("setNoteFolders: filters wrong-kind ids defensively", () => {
    // fw1 is a wiki folder — must be silently dropped.
    env.slice.setNoteFolders("n1", ["fn1", "fw1", "fn2"])
    const n1 = env.get().notes.find((n) => n.id === "n1")!
    expect(n1.folderIds).toEqual(["fn1", "fn2"])
  })

  it("setNoteFolders: filters unknown ids defensively", () => {
    env.slice.setNoteFolders("n1", ["fn1", "ghost", "fn2"])
    const n1 = env.get().notes.find((n) => n.id === "n1")!
    expect(n1.folderIds).toEqual(["fn1", "fn2"])
  })

  /* ── addWikiToFolder ────────────────────────────────── */

  it("addWikiToFolder: adds a wiki folder membership", () => {
    env.slice.addWikiToFolder("w1", "fw1")
    const w1 = env.get().wikiArticles.find((w) => w.id === "w1")!
    expect(w1.folderIds).toEqual(["fw1"])
  })

  it("addWikiToFolder: refuses kind='note' folder", () => {
    env.slice.addWikiToFolder("w1", "fn1")
    const w1 = env.get().wikiArticles.find((w) => w.id === "w1")!
    expect(w1.folderIds).toEqual([])
  })

  it("addWikiToFolder: idempotent on existing membership", () => {
    env.slice.addWikiToFolder("w2", "fw1")
    const w2 = env.get().wikiArticles.find((w) => w.id === "w2")!
    expect(w2.folderIds).toEqual(["fw1"])
  })

  /* ── removeWikiFromFolder ───────────────────────────── */

  it("removeWikiFromFolder: removes the membership", () => {
    env.slice.removeWikiFromFolder("w2", "fw1")
    const w2 = env.get().wikiArticles.find((w) => w.id === "w2")!
    expect(w2.folderIds).toEqual([])
  })

  /* ── setWikiFolders ─────────────────────────────────── */

  it("setWikiFolders: replaces wholesale + filters note-kind ids", () => {
    env.slice.setWikiFolders("w2", ["fw1", "fn1"])
    const w2 = env.get().wikiArticles.find((w) => w.id === "w2")!
    // fn1 is a note folder — dropped. fw1 survives.
    expect(w2.folderIds).toEqual(["fw1"])
  })

  it("setWikiFolders: dedup", () => {
    env.slice.setWikiFolders("w1", ["fw1", "fw1"])
    const w1 = env.get().wikiArticles.find((w) => w.id === "w1")!
    expect(w1.folderIds).toEqual(["fw1"])
  })
})
