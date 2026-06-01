import { describe, it, expect } from "vitest"
import { createNotesSlice } from "../slices/notes"
import { createWikiArticlesSlice } from "../slices/wiki-articles"
import { createTagsSlice } from "../slices/tags"
import { createLabelsSlice } from "../slices/labels"
import { createReferencesSlice } from "../slices/references"
import { createBooksSlice } from "../slices/books"

/**
 * Data-lifecycle audit (출시 전 필수) — delete cascade contract tests.
 *
 * 감사 발견: deleteNote가 가장 완전한 패턴이고, deleteWikiArticle은 그걸
 * 불완전 복제했으며, cross-entity 정리(tag/label/reference)가 3-entity 중
 * 일부만 적용돼 dangling id가 남았다. 이 테스트는 각 영구삭제 액션이
 * 자신을 참조하는 다른 엔티티/멤버십을 완전히 정리하는지 고정한다.
 *
 * vitest는 node 환경이라 `indexedDB`가 undefined → helpers의 IDB 가드가
 * 작동해 별도 store(removeBody/removeAttachmentBlob/removeArticleBlocks)는
 * no-op이 된다. 따라서 여기서는 persisted **array/record** cascade만 검증한다
 * (IDB blob 정리는 helpers 호출 추가로 보장 — 코드 리뷰 영역).
 *
 * 여러 slice가 하나의 state를 공유하므로 통합 state holder로 묶는다
 * (books-slice.test.ts의 단일 slice 패턴 확장).
 */
function setupStore(initial: Record<string, unknown> = {}) {
  let state: any = {
    notes: [],
    wikiArticles: [],
    books: [],
    tags: [],
    labels: [],
    references: {},
    comments: {},
    attachments: [],
    stickers: [],
    hooks: [],
    relations: [],
    relationSuggestions: [],
    entityEvents: [],
    threads: [],
    wikiCollections: {},
    navigationHistory: [],
    navigationIndex: 0,
    selectedNoteId: null,
    ...initial,
  }
  const set = (fn: ((s: any) => any) | any) => {
    state = typeof fn === "function" ? { ...state, ...fn(state) } : { ...state, ...fn }
  }
  const get = () => state
  const noop = (() => {}) as any
  const actions = {
    ...createNotesSlice(set, get, noop),
    ...createWikiArticlesSlice(set, get, noop),
    ...createTagsSlice(set, noop),
    ...createLabelsSlice(set, noop),
    ...createReferencesSlice(set, noop),
    ...createBooksSlice(set, get, noop),
  }
  return { get: () => state, ...actions }
}

describe("delete cascade — deleteNote", () => {
  it("cascades comments, book items, and note-origin attachments", () => {
    const env = setupStore({
      notes: [{ id: "n1", title: "T", tags: [], referenceIds: [], status: "backlog" }],
      comments: {
        c1: { id: "c1", anchor: { kind: "note", noteId: "n1" }, body: "x" },
        c2: { id: "c2", anchor: { kind: "note-block", noteId: "n1", nodeId: "b" }, body: "y" },
        c3: { id: "c3", anchor: { kind: "note", noteId: "n2" }, body: "keep" },
      },
      books: [
        {
          id: "bk1",
          title: "B",
          items: [
            { kind: "note", id: "i1", refId: "n1", order: "a0" },
            { kind: "note", id: "i2", refId: "n2", order: "a1" },
          ],
        },
      ],
      attachments: [
        { id: "att1", originEntity: { kind: "note", id: "n1" }, name: "f" },
        { id: "att2", originEntity: { kind: "note", id: "n2" }, name: "g" },
      ],
    })
    env.deleteNote("n1")
    const s = env.get()
    expect(s.notes).toHaveLength(0)
    // comments anchored to n1 (note + note-block) removed; n2 comment kept
    expect(Object.keys(s.comments)).toEqual(["c3"])
    // book item referencing n1 dropped; n2 item kept
    expect(s.books[0].items.map((i: any) => i.refId)).toEqual(["n2"])
    // note-origin attachment array entry removed; n2-origin kept
    expect(s.attachments.map((a: any) => a.id)).toEqual(["att2"])
  })
})

describe("delete cascade — deleteWikiArticle", () => {
  it("cascades children reparent, comments, book items, attachments, relations, collections", () => {
    const env = setupStore({
      wikiArticles: [
        { id: "w1", title: "W", blocks: [], tags: [], aliases: [], sectionIndex: [], folderIds: [] },
        { id: "w2", title: "child", blocks: [], tags: [], aliases: [], sectionIndex: [], folderIds: [], parentArticleId: "w1" },
      ],
      comments: {
        c1: { id: "c1", anchor: { kind: "wiki", articleId: "w1" }, body: "x" },
        c2: { id: "c2", anchor: { kind: "wiki-block", articleId: "w1", blockId: "b" }, body: "y" },
        c3: { id: "c3", anchor: { kind: "wiki", articleId: "w2" }, body: "keep" },
      },
      books: [{ id: "bk1", title: "B", items: [{ kind: "wiki", id: "i1", refId: "w1", order: "a0" }] }],
      attachments: [{ id: "att1", originEntity: { kind: "wiki", id: "w1" }, name: "f" }],
      relations: [{ id: "r1", sourceNoteId: "w1", targetNoteId: "n9", type: "related" }],
      wikiCollections: { w1: [{ id: "ci", kind: "note", refId: "x", addedAt: "t" }], w2: [] },
    })
    env.deleteWikiArticle("w1")
    const s = env.get()
    expect(s.wikiArticles.map((a: any) => a.id)).toEqual(["w2"])
    // orphaned child reparented to root
    expect(s.wikiArticles[0].parentArticleId).toBeNull()
    // wiki/wiki-block comments on w1 removed; w2 comment kept
    expect(Object.keys(s.comments)).toEqual(["c3"])
    expect(s.books[0].items).toHaveLength(0)
    expect(s.attachments).toHaveLength(0)
    expect(s.relations).toHaveLength(0)
    // w1 collection bucket dropped; w2 bucket kept
    expect(s.wikiCollections.w1).toBeUndefined()
    expect(s.wikiCollections.w2).toBeDefined()
  })
})

describe("delete cascade — cross-entity facets", () => {
  it("permanentlyDeleteTag strips the tag id from note/wiki/book tags", () => {
    const env = setupStore({
      tags: [{ id: "t1", name: "T", color: null }],
      notes: [{ id: "n1", tags: ["t1", "t2"], referenceIds: [] }],
      wikiArticles: [{ id: "w1", tags: ["t1"], blocks: [], aliases: [], sectionIndex: [], folderIds: [] }],
      books: [{ id: "bk1", title: "B", items: [], tags: ["t1", "t3"] }],
    })
    env.permanentlyDeleteTag("t1")
    const s = env.get()
    expect(s.tags).toHaveLength(0)
    expect(s.notes[0].tags).toEqual(["t2"])
    expect(s.wikiArticles[0].tags).toEqual([])
    expect(s.books[0].tags).toEqual(["t3"])
  })

  it("permanentlyDeleteLabel clears labelId on note/wiki/book", () => {
    const env = setupStore({
      labels: [{ id: "l1", name: "L", color: "#fff" }],
      notes: [{ id: "n1", labelId: "l1", tags: [], referenceIds: [] }],
      wikiArticles: [{ id: "w1", labelId: "l1", tags: [], blocks: [], aliases: [], sectionIndex: [], folderIds: [] }],
      books: [{ id: "bk1", title: "B", items: [], labelId: "l1" }],
    })
    env.permanentlyDeleteLabel("l1")
    const s = env.get()
    expect(s.labels).toHaveLength(0)
    expect(s.notes[0].labelId).toBeNull()
    expect(s.wikiArticles[0].labelId).toBeNull()
    expect(s.books[0].labelId).toBeNull()
  })

  it("permanentlyDeleteReference strips the id from note/wiki referenceIds", () => {
    const env = setupStore({
      references: { ref1: { id: "ref1", title: "R", content: "", fields: [], createdAt: "t", updatedAt: "t" } },
      notes: [{ id: "n1", referenceIds: ["ref1", "ref2"], tags: [] }],
      wikiArticles: [{ id: "w1", referenceIds: ["ref1"], tags: [], blocks: [], aliases: [], sectionIndex: [], folderIds: [] }],
    })
    env.permanentlyDeleteReference("ref1")
    const s = env.get()
    expect(s.references.ref1).toBeUndefined()
    expect(s.notes[0].referenceIds).toEqual(["ref2"])
    expect(s.wikiArticles[0].referenceIds).toEqual([])
  })

  it("permanentlyDeleteBook drops the book from sticker members", () => {
    const env = setupStore({
      books: [{ id: "bk1", title: "B", items: [] }],
      stickers: [{ id: "s1", members: [{ kind: "book", id: "bk1" }, { kind: "note", id: "n1" }] }],
    })
    env.permanentlyDeleteBook("bk1")
    const s = env.get()
    expect(s.books).toHaveLength(0)
    expect(s.stickers[0].members).toEqual([{ kind: "note", id: "n1" }])
  })
})
