import type { WikiArticle, WikiBlock, WikiStatus, StubSource } from "../../types"
import { genId, now, type AppendEventFn } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void
type Get = () => any

export function createWikiArticlesSlice(set: Set, get: Get) {
  return {
    /* ── CRUD ── */

    createWikiArticle: (partial: {
      title: string
      aliases?: string[]
      wikiStatus?: WikiStatus
      stubSource?: StubSource
      tags?: string[]
      blocks?: WikiBlock[]
    }) => {
      const id = genId()
      const article: WikiArticle = {
        id,
        title: partial.title,
        aliases: partial.aliases ?? [],
        wikiStatus: partial.wikiStatus ?? "stub",
        stubSource: partial.stubSource ?? "manual",
        infobox: [],
        blocks: partial.blocks ?? [
          // Default template: Overview + Details + See Also sections
          { id: genId(), type: "section", title: "Overview", level: 2 },
          { id: genId(), type: "text", content: "" },
          { id: genId(), type: "section", title: "Details", level: 2 },
          { id: genId(), type: "section", title: "See Also", level: 2 },
        ],
        tags: partial.tags ?? [],
        createdAt: now(),
        updatedAt: now(),
      }
      set((state: any) => ({
        wikiArticles: [...state.wikiArticles, article],
      }))
      return id
    },

    updateWikiArticle: (articleId: string, patch: Partial<Omit<WikiArticle, "id" | "createdAt">>) => {
      set((state: any) => ({
        wikiArticles: state.wikiArticles.map((a: WikiArticle) =>
          a.id === articleId ? { ...a, ...patch, updatedAt: now() } : a
        ),
      }))
    },

    deleteWikiArticle: (articleId: string) => {
      set((state: any) => ({
        wikiArticles: state.wikiArticles.filter((a: WikiArticle) => a.id !== articleId),
      }))
    },

    setWikiArticleStatus: (articleId: string, wikiStatus: WikiStatus) => {
      set((state: any) => ({
        wikiArticles: state.wikiArticles.map((a: WikiArticle) =>
          a.id === articleId ? { ...a, wikiStatus, updatedAt: now() } : a
        ),
      }))
    },

    setWikiArticleInfobox: (articleId: string, infobox: WikiArticle["infobox"]) => {
      set((state: any) => ({
        wikiArticles: state.wikiArticles.map((a: WikiArticle) =>
          a.id === articleId ? { ...a, infobox, updatedAt: now() } : a
        ),
      }))
    },

    /* ── Block Operations ── */

    addWikiBlock: (articleId: string, block: Omit<WikiBlock, "id">, afterBlockId?: string) => {
      const newBlock: WikiBlock = { ...block, id: genId() }
      set((state: any) => ({
        wikiArticles: state.wikiArticles.map((a: WikiArticle) => {
          if (a.id !== articleId) return a
          const blocks = [...a.blocks]
          if (afterBlockId) {
            const idx = blocks.findIndex((b) => b.id === afterBlockId)
            blocks.splice(idx + 1, 0, newBlock)
          } else {
            blocks.push(newBlock)
          }
          return { ...a, blocks, updatedAt: now() }
        }),
      }))
      return newBlock.id
    },

    removeWikiBlock: (articleId: string, blockId: string) => {
      set((state: any) => ({
        wikiArticles: state.wikiArticles.map((a: WikiArticle) =>
          a.id === articleId
            ? { ...a, blocks: a.blocks.filter((b) => b.id !== blockId), updatedAt: now() }
            : a
        ),
      }))
    },

    updateWikiBlock: (articleId: string, blockId: string, patch: Partial<Omit<WikiBlock, "id">>) => {
      set((state: any) => ({
        wikiArticles: state.wikiArticles.map((a: WikiArticle) =>
          a.id === articleId
            ? {
                ...a,
                blocks: a.blocks.map((b) =>
                  b.id === blockId ? { ...b, ...patch } : b
                ),
                updatedAt: now(),
              }
            : a
        ),
      }))
    },

    moveWikiBlock: (articleId: string, blockId: string, targetIndex: number) => {
      set((state: any) => ({
        wikiArticles: state.wikiArticles.map((a: WikiArticle) => {
          if (a.id !== articleId) return a
          const blocks = [...a.blocks]
          const fromIdx = blocks.findIndex((b) => b.id === blockId)
          if (fromIdx === -1) return a
          const [moved] = blocks.splice(fromIdx, 1)
          const insertAt = Math.min(targetIndex, blocks.length)
          blocks.splice(insertAt, 0, moved)
          return { ...a, blocks, updatedAt: now() }
        }),
      }))
    },

    reorderWikiBlocks: (articleId: string, blockIds: string[]) => {
      set((state: any) => ({
        wikiArticles: state.wikiArticles.map((a: WikiArticle) => {
          if (a.id !== articleId) return a
          const blockMap = new Map(a.blocks.map((b) => [b.id, b]))
          const ordered = blockIds
            .map((id) => blockMap.get(id))
            .filter(Boolean) as WikiBlock[]
          return { ...a, blocks: ordered, updatedAt: now() }
        }),
      }))
    },
  }
}
