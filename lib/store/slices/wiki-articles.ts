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

    mergeWikiArticles: (primaryId: string, secondaryId: string, options?: { title?: string; status?: WikiStatus }) => {
      const state = get()
      const primary = (state.wikiArticles as WikiArticle[]).find((a) => a.id === primaryId)
      const secondary = (state.wikiArticles as WikiArticle[]).find((a) => a.id === secondaryId)
      if (!primary || !secondary) return

      // Divider section for merged content
      const dividerBlock: WikiBlock = {
        id: genId(),
        type: "section" as const,
        title: `From: ${secondary.title}`,
        level: 2,
      }

      // Concat blocks: primary + divider + secondary
      const mergedBlocks = [...primary.blocks, dividerBlock, ...secondary.blocks]

      // Status: use option override, else keep higher rank
      const STATUS_RANK: Record<string, number> = { article: 2, complete: 2, stub: 1, draft: 1 }
      const mergedStatus = options?.status
        ?? ((STATUS_RANK[secondary.wikiStatus] ?? 0) > (STATUS_RANK[primary.wikiStatus] ?? 0) ? secondary.wikiStatus : primary.wikiStatus)

      // Infobox: merge (primary values take precedence for duplicate keys)
      const primaryKeys = new Set(primary.infobox.map((e) => e.key))
      const mergedInfobox = [...primary.infobox, ...secondary.infobox.filter((e) => !primaryKeys.has(e.key))]

      // Title: use option override, else keep primary title
      const mergedTitle = options?.title ?? primary.title

      // Update primary with merged data
      set((state: any) => ({
        wikiArticles: state.wikiArticles.map((a: WikiArticle) => {
          if (a.id !== primaryId) return a
          const sectionIndex = buildSectionIndex(mergedBlocks)
          return {
            ...a,
            title: mergedTitle,
            blocks: mergedBlocks,
            sectionIndex,
            wikiStatus: mergedStatus,
            infobox: mergedInfobox,
            aliases: [...new Set([...a.aliases, secondary.title, ...secondary.aliases].filter((al) => al !== mergedTitle))],
            tags: [...new Set([...a.tags, ...secondary.tags])],
            updatedAt: now(),
          }
        }),
      }))

      // Persist merged blocks to IDB
      persistArticleBlocks(primaryId, mergedBlocks)

      // Delete secondary article (removes its block metadata from IDB)
      // But DON'T remove text block bodies since they now belong to the primary
      removeArticleBlocks(secondaryId)
      set((state: any) => ({
        wikiArticles: state.wikiArticles.filter((a: WikiArticle) => a.id !== secondaryId),
      }))
    },

    splitWikiArticle: (sourceId: string, blockIds: string[], newTitle: string): string | null => {
      const state = get()
      const source = (state.wikiArticles as WikiArticle[]).find((a) => a.id === sourceId)
      if (!source) return null

      const blockIdSet = new Set(blockIds)
      const extractedBlocks = source.blocks.filter((b) => blockIdSet.has(b.id))
      const remainingBlocks = source.blocks.filter((b) => !blockIdSet.has(b.id))

      if (extractedBlocks.length === 0 || remainingBlocks.length === 0) return null

      // Create new article with extracted blocks
      const newId = genId()
      const newArticle: WikiArticle = {
        id: newId,
        title: newTitle,
        aliases: [],
        wikiStatus: "stub",
        stubSource: "manual",
        infobox: [],
        blocks: extractedBlocks,
        sectionIndex: buildSectionIndex(extractedBlocks),
        tags: [...source.tags],
        createdAt: now(),
        updatedAt: now(),
      }

      // Update source: remove extracted blocks
      set((state: any) => ({
        wikiArticles: [
          ...state.wikiArticles.map((a: WikiArticle) => {
            if (a.id !== sourceId) return a
            return {
              ...a,
              blocks: remainingBlocks,
              sectionIndex: buildSectionIndex(remainingBlocks),
              updatedAt: now(),
            }
          }),
          newArticle,
        ],
      }))

      // Persist both
      persistArticleBlocks(sourceId, remainingBlocks)
      persistArticleBlocks(newId, extractedBlocks)
      for (const b of extractedBlocks) {
        if (b.type === "text" && b.content) {
          persistBlockBody({ id: b.id, content: b.content })
        }
      }

      return newId
    },
  }
}
