import type { WikiArticle, WikiBlock, WikiStatus, StubSource } from "../../types"
import { genId, now, persistBlockBody, removeBlockBody, persistArticleBlocks, removeArticleBlocks, type AppendEventFn } from "../helpers"
import { buildSectionIndex } from "../../wiki-section-index"

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
      const blocks = partial.blocks ?? [
        // Default template: Overview + Details + See Also sections
        { id: genId(), type: "section" as const, title: "Overview", level: 2 },
        { id: genId(), type: "text" as const, content: "" },
        { id: genId(), type: "section" as const, title: "Details", level: 2 },
        { id: genId(), type: "section" as const, title: "See Also", level: 2 },
      ]
      const article: WikiArticle = {
        id,
        title: partial.title,
        aliases: partial.aliases ?? [],
        wikiStatus: partial.wikiStatus ?? "stub",
        stubSource: partial.stubSource ?? "manual",
        infobox: [],
        blocks,
        sectionIndex: buildSectionIndex(blocks),
        tags: partial.tags ?? [],
        createdAt: now(),
        updatedAt: now(),
      }
      set((state: any) => ({
        wikiArticles: [...state.wikiArticles, article],
      }))
      // Persist text block bodies to IDB
      for (const b of article.blocks) {
        if (b.type === "text" && b.content) {
          persistBlockBody({ id: b.id, content: b.content })
        }
      }
      // Persist block metadata to IDB
      persistArticleBlocks(id, article.blocks)
      return id
    },

    updateWikiArticle: (articleId: string, patch: Partial<Omit<WikiArticle, "id" | "createdAt">>) => {
      set((state: any) => ({
        wikiArticles: state.wikiArticles.map((a: WikiArticle) => {
          if (a.id !== articleId) return a
          const updated = { ...a, ...patch, updatedAt: now() }
          // If blocks were replaced, rebuild sectionIndex and persist
          if (patch.blocks) {
            updated.sectionIndex = buildSectionIndex(patch.blocks)
            persistArticleBlocks(articleId, patch.blocks)
          }
          return updated
        }),
      }))
    },

    deleteWikiArticle: (articleId: string) => {
      // Clean up block bodies from IDB before removing
      const article = get().wikiArticles.find((a: WikiArticle) => a.id === articleId)
      if (article) {
        for (const b of article.blocks) {
          if (b.type === "text") removeBlockBody(b.id)
        }
      }
      // Remove block metadata from IDB
      removeArticleBlocks(articleId)
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
          const sectionIndex = buildSectionIndex(blocks)
          persistArticleBlocks(articleId, blocks)
          return { ...a, blocks, sectionIndex, updatedAt: now() }
        }),
      }))
      // Persist text block body to IDB
      if (newBlock.type === "text" && newBlock.content) {
        persistBlockBody({ id: newBlock.id, content: newBlock.content })
      }
      return newBlock.id
    },

    removeWikiBlock: (articleId: string, blockId: string) => {
      set((state: any) => ({
        wikiArticles: state.wikiArticles.map((a: WikiArticle) => {
          if (a.id !== articleId) return a
          const blocks = a.blocks.filter((b) => b.id !== blockId)
          const sectionIndex = buildSectionIndex(blocks)
          persistArticleBlocks(articleId, blocks)
          return { ...a, blocks, sectionIndex, updatedAt: now() }
        }),
      }))
      // Remove block body from IDB
      removeBlockBody(blockId)
    },

    updateWikiBlock: (articleId: string, blockId: string, patch: Partial<Omit<WikiBlock, "id">>) => {
      // Check if patch affects section index (section title, level, collapsed, or type change)
      const affectsIndex = patch.title !== undefined || patch.level !== undefined || patch.collapsed !== undefined || patch.type !== undefined
      set((state: any) => ({
        wikiArticles: state.wikiArticles.map((a: WikiArticle) => {
          if (a.id !== articleId) return a
          const blocks = a.blocks.map((b) =>
            b.id === blockId ? { ...b, ...patch } : b
          )
          persistArticleBlocks(articleId, blocks)
          const sectionIndex = affectsIndex ? buildSectionIndex(blocks) : a.sectionIndex
          return { ...a, blocks, sectionIndex, updatedAt: now() }
        }),
      }))
      // Persist updated content to IDB
      if (patch.content !== undefined) {
        persistBlockBody({ id: blockId, content: patch.content })
      }
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
          const sectionIndex = buildSectionIndex(blocks)
          persistArticleBlocks(articleId, blocks)
          return { ...a, blocks, sectionIndex, updatedAt: now() }
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
          const sectionIndex = buildSectionIndex(ordered)
          persistArticleBlocks(articleId, ordered)
          return { ...a, blocks: ordered, sectionIndex, updatedAt: now() }
        }),
      }))
    },

    mergeWikiArticles: (targetId: string, sourceId: string) => {
      const state = get()
      const target = (state.wikiArticles as WikiArticle[]).find((a) => a.id === targetId)
      const source = (state.wikiArticles as WikiArticle[]).find((a) => a.id === sourceId)
      if (!target || !source) return

      // Divider section for merged content
      const dividerBlock: WikiBlock = {
        id: genId(),
        type: "section" as const,
        title: `From: ${source.title}`,
        level: 2,
      }

      // Concat blocks: target + divider + source
      const mergedBlocks = [...target.blocks, dividerBlock, ...source.blocks]

      // Update target with merged blocks
      set((state: any) => ({
        wikiArticles: state.wikiArticles.map((a: WikiArticle) => {
          if (a.id !== targetId) return a
          const sectionIndex = buildSectionIndex(mergedBlocks)
          return {
            ...a,
            blocks: mergedBlocks,
            sectionIndex,
            aliases: [...new Set([...a.aliases, source.title, ...source.aliases])],
            tags: [...new Set([...a.tags, ...source.tags])],
            updatedAt: now(),
          }
        }),
      }))

      // Persist merged blocks to IDB
      persistArticleBlocks(targetId, mergedBlocks)

      // Delete source article (removes its block metadata from IDB)
      // But DON'T remove text block bodies since they now belong to the target
      removeArticleBlocks(sourceId)
      set((state: any) => ({
        wikiArticles: state.wikiArticles.filter((a: WikiArticle) => a.id !== sourceId),
      }))
    },
  }
}
