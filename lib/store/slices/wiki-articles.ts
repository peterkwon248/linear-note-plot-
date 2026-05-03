import type { WikiArticle, WikiBlock, WikiMergeSnapshot } from "../../types"
import { genId, now, persistBlockBody, removeBlockBody, persistArticleBlocks, removeArticleBlocks, type AppendEventFn } from "../helpers"
import { buildSectionIndex } from "../../wiki-section-index"
import { extractLinksFromWikiBlocks } from "../../body-helpers"
import { wouldCreateCycle } from "../../wiki-hierarchy"

type Set = (fn: ((state: any) => any) | any) => void
type Get = () => any

export function createWikiArticlesSlice(set: Set, get: Get) {
  return {
    /* ── CRUD ── */

    createWikiArticle: (partial: {
      title: string
      aliases?: string[]
      tags?: string[]
      blocks?: WikiBlock[]
      /**
       * Optional folder containment (v107 N:M). Set when created from inside
       * a folder page so the new article is automatically a member of that
       * folder. Caller is responsible for passing only `kind="wiki"` folder
       * ids — kind validation lives in PR (b) UI layer.
       */
      folderIds?: string[]
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
        infobox: [],
        blocks,
        sectionIndex: buildSectionIndex(blocks),
        tags: partial.tags ?? [],
        folderIds: partial.folderIds ?? [],
        linksOut: extractLinksFromWikiBlocks(blocks),
        reads: 0,
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
          // If blocks were replaced, rebuild sectionIndex, linksOut and persist
          if (patch.blocks) {
            updated.sectionIndex = buildSectionIndex(patch.blocks)
            updated.linksOut = extractLinksFromWikiBlocks(patch.blocks)
            persistArticleBlocks(articleId, patch.blocks)
          }
          return updated
        }),
      }))
    },

    addArticleReference: (articleId: string, referenceId: string) => {
      set((state: any) => ({
        wikiArticles: state.wikiArticles.map((a: WikiArticle) =>
          a.id !== articleId ? a : {
            ...a,
            referenceIds: [...new Set([...(a.referenceIds ?? []), referenceId])],
            updatedAt: now(),
          }
        ),
      }))
    },

    removeArticleReference: (articleId: string, referenceId: string) => {
      set((state: any) => ({
        wikiArticles: state.wikiArticles.map((a: WikiArticle) =>
          a.id !== articleId ? a : {
            ...a,
            referenceIds: (a.referenceIds ?? []).filter((id: string) => id !== referenceId),
            updatedAt: now(),
          }
        ),
      }))
    },

    setWikiArticleParent: (articleId: string, parentId: string | null): boolean => {
      const state = get()
      const articles: WikiArticle[] = state.wikiArticles

      // Guard: article must exist
      if (!articles.find((a: WikiArticle) => a.id === articleId)) return false

      // Guard: self-parent
      if (parentId === articleId) return false

      // Guard: cycle (candidateParent is a descendant of article)
      if (parentId !== null && wouldCreateCycle(articleId, parentId, { wikiArticles: articles })) return false

      set((state: any) => ({
        wikiArticles: state.wikiArticles.map((a: WikiArticle) =>
          a.id === articleId ? { ...a, parentArticleId: parentId, updatedAt: now() } : a
        ),
      }))
      return true
    },

    /** Increment view count (reads) by 1. Does NOT update updatedAt. */
    incrementWikiArticleReads: (articleId: string) => {
      set((state: any) => ({
        wikiArticles: state.wikiArticles.map((a: WikiArticle) =>
          a.id === articleId
            ? { ...a, reads: (a.reads ?? 0) + 1 }
            : a
        ),
      }))
    },

    /** Toggle whole-article pin. Mirrors Note.pinned semantics. */
    toggleWikiArticlePin: (articleId: string) => {
      set((state: any) => ({
        wikiArticles: state.wikiArticles.map((a: WikiArticle) =>
          a.id === articleId
            ? { ...a, pinned: !a.pinned, updatedAt: now() }
            : a
        ),
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
        // Sticker membership cascade — drop {kind:"wiki", id} refs from
        // every Sticker.members[] (옵션 D2 — single forward reference).
        stickers: (state.stickers ?? []).map((s: any) => {
          const members = s.members ?? []
          const next = members.filter((m: any) => !(m.kind === "wiki" && m.id === articleId))
          if (next.length === members.length) return s
          return { ...s, members: next }
        }),
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
          if (afterBlockId === "__prepend__") {
            blocks.unshift(newBlock)
          } else if (afterBlockId) {
            const idx = blocks.findIndex((b) => b.id === afterBlockId)
            blocks.splice(idx + 1, 0, newBlock)
          } else {
            blocks.push(newBlock)
          }
          const sectionIndex = buildSectionIndex(blocks)
          const linksOut = extractLinksFromWikiBlocks(blocks)
          persistArticleBlocks(articleId, blocks)
          return { ...a, blocks, sectionIndex, linksOut, updatedAt: now() }
        }),
      }))
      // Persist text block body to IDB
      if (newBlock.type === "text" && (newBlock.content || newBlock.contentJson)) {
        persistBlockBody({ id: newBlock.id, content: newBlock.content ?? "", contentJson: newBlock.contentJson })
      }
      return newBlock.id
    },

    removeWikiBlock: (articleId: string, blockId: string) => {
      set((state: any) => ({
        wikiArticles: state.wikiArticles.map((a: WikiArticle) => {
          if (a.id !== articleId) return a
          const blocks = a.blocks.filter((b) => b.id !== blockId)
          const sectionIndex = buildSectionIndex(blocks)
          const linksOut = extractLinksFromWikiBlocks(blocks)
          persistArticleBlocks(articleId, blocks)
          return { ...a, blocks, sectionIndex, linksOut, updatedAt: now() }
        }),
      }))
      // Remove block body from IDB
      removeBlockBody(blockId)
    },

    updateWikiBlock: (articleId: string, blockId: string, patch: Partial<Omit<WikiBlock, "id">>) => {
      // Check if patch affects section index (section title, level, collapsed, or type change)
      const affectsIndex = patch.title !== undefined || patch.level !== undefined || patch.collapsed !== undefined || patch.type !== undefined
      // Check if patch affects links (content or title changes in text/section blocks)
      const affectsLinks = patch.content !== undefined || patch.title !== undefined
      set((state: any) => ({
        wikiArticles: state.wikiArticles.map((a: WikiArticle) => {
          if (a.id !== articleId) return a
          const blocks = a.blocks.map((b) =>
            b.id === blockId ? { ...b, ...patch } : b
          )
          persistArticleBlocks(articleId, blocks)
          const sectionIndex = affectsIndex ? buildSectionIndex(blocks) : a.sectionIndex
          const linksOut = affectsLinks ? extractLinksFromWikiBlocks(blocks) : a.linksOut
          return { ...a, blocks, sectionIndex, linksOut, updatedAt: now() }
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
          return { ...a, blocks: ordered, sectionIndex, linksOut: extractLinksFromWikiBlocks(ordered), updatedAt: now() }
        }),
      }))
    },

    mergeWikiArticles: (primaryId: string, secondaryId: string, options?: { title?: string }) => {
      const state = get()
      const primary = (state.wikiArticles as WikiArticle[]).find((a) => a.id === primaryId)
      const secondary = (state.wikiArticles as WikiArticle[]).find((a) => a.id === secondaryId)
      if (!primary || !secondary) return

      // Divider section with merge snapshot for unmerge
      const secondaryBlockIds = secondary.blocks.map((b) => b.id)
      const dividerBlock: WikiBlock = {
        id: genId(),
        type: "section" as const,
        title: `From: ${secondary.title}`,
        level: 2,
        mergedFrom: {
          articleId: secondary.id,
          title: secondary.title,
          aliases: [...secondary.aliases],
          tags: [...secondary.tags],
          infobox: [...secondary.infobox],
          blockIds: secondaryBlockIds,
          blocks: JSON.parse(JSON.stringify(secondary.blocks)),
          mergedAt: now(),
        },
      }

      // Concat blocks: primary + divider + secondary
      const mergedBlocks = [...primary.blocks, dividerBlock, ...secondary.blocks]

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
            infobox: mergedInfobox,
            aliases: [...new Set([...a.aliases, secondary.title, ...secondary.aliases].filter((al) => al !== mergedTitle))],
            tags: [...new Set([...a.tags, ...secondary.tags])],
            linksOut: extractLinksFromWikiBlocks(mergedBlocks),
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

      // Create new article with extracted blocks. Folder membership inherits
      // from the source so the split-off article stays grouped with siblings.
      const newId = genId()
      const newArticle: WikiArticle = {
        id: newId,
        title: newTitle,
        aliases: [],
        infobox: [],
        blocks: extractedBlocks,
        sectionIndex: buildSectionIndex(extractedBlocks),
        tags: [...source.tags],
        folderIds: [...(source.folderIds ?? [])],
        linksOut: extractLinksFromWikiBlocks(extractedBlocks),
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
              linksOut: extractLinksFromWikiBlocks(remainingBlocks),
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

    /** Copy blocks to a new article WITHOUT removing from source (non-destructive) */
    copyToNewArticle: (sourceId: string, blockIds: string[], newTitle: string): string | null => {
      const state = get()
      const source = (state.wikiArticles as WikiArticle[]).find((a) => a.id === sourceId)
      if (!source) return null

      const blockIdSet = new Set(blockIds)
      const blocksToCopy = source.blocks.filter((b) => blockIdSet.has(b.id))
      if (blocksToCopy.length === 0) return null

      // Deep-clone blocks with new IDs
      const clonedBlocks = blocksToCopy.map((b) => ({
        ...b,
        id: genId(),
      }))

      const newId = genId()
      const newArticle: WikiArticle = {
        id: newId,
        title: newTitle,
        aliases: [],
        infobox: [],
        blocks: clonedBlocks,
        sectionIndex: buildSectionIndex(clonedBlocks),
        tags: [...source.tags],
        folderIds: [...(source.folderIds ?? [])],
        linksOut: extractLinksFromWikiBlocks(clonedBlocks),
        createdAt: now(),
        updatedAt: now(),
      }

      // Source is NOT modified — only add the new article
      set((state: any) => ({
        wikiArticles: [...state.wikiArticles, newArticle],
      }))

      // Persist new article blocks + bodies
      persistArticleBlocks(newId, clonedBlocks)
      for (const b of clonedBlocks) {
        if (b.type === "text" && b.content) {
          persistBlockBody({ id: b.id, content: b.content })
        }
      }

      return newId
    },

    unmergeWikiArticle: (articleId: string, dividerBlockId: string): string | null => {
      const state = get()
      const article = (state.wikiArticles as WikiArticle[]).find((a) => a.id === articleId)
      if (!article) return null

      const divider = article.blocks.find((b) => b.id === dividerBlockId)
      if (!divider?.mergedFrom) return null

      const snapshot = divider.mergedFrom
      const mergedBlockIdSet = new Set(snapshot.blockIds)

      // Extract merged blocks + remove divider from original
      const extractedBlocks = article.blocks.filter((b) => mergedBlockIdSet.has(b.id))
      const remainingBlocks = article.blocks.filter((b) => b.id !== dividerBlockId && !mergedBlockIdSet.has(b.id))

      if (extractedBlocks.length === 0) return null

      // Recreate the original article from snapshot. Folder membership
      // is not part of the merge snapshot (legacy field) — restored articles
      // start unfoldered; user can re-file them.
      const restoredId = genId()
      const restoredArticle: WikiArticle = {
        id: restoredId,
        title: snapshot.title,
        aliases: snapshot.aliases,
        infobox: snapshot.infobox,
        blocks: extractedBlocks,
        sectionIndex: buildSectionIndex(extractedBlocks),
        tags: snapshot.tags,
        folderIds: [],
        createdAt: snapshot.mergedAt,
        updatedAt: now(),
      }

      // Remove merged aliases/tags from the original
      const snapshotAliasSet = new Set([snapshot.title, ...snapshot.aliases])
      const snapshotTagSet = new Set(snapshot.tags)

      set((state: any) => ({
        wikiArticles: [
          ...state.wikiArticles.map((a: WikiArticle) => {
            if (a.id !== articleId) return a
            return {
              ...a,
              blocks: remainingBlocks,
              sectionIndex: buildSectionIndex(remainingBlocks),
              aliases: a.aliases.filter((al) => !snapshotAliasSet.has(al)),
              tags: a.tags.filter((t) => !snapshotTagSet.has(t) || a.tags.indexOf(t) < snapshot.tags.length),
              updatedAt: now(),
            }
          }),
          restoredArticle,
        ],
      }))

      persistArticleBlocks(articleId, remainingBlocks)
      persistArticleBlocks(restoredId, extractedBlocks)

      return restoredId
    },

    mergeMultipleWikiArticles: (
      sourceIds: string[],
      options: {
        title: string
        mode: "new" | "into"
        targetId?: string
        blockOrder: WikiBlock[]
        categories?: string[]
        categoryIds?: string[]
        tags?: string[]
        aliases?: string[]
      }
    ): string => {
      const state = get()
      const articles = (state.wikiArticles as WikiArticle[])
      const sources = sourceIds
        .map((id) => articles.find((a) => a.id === id))
        .filter(Boolean) as WikiArticle[]

      if (sources.length === 0) return ""

      // Build merge history snapshots for each source
      const mergeHistory: WikiMergeSnapshot[] = sources.map((src) => ({
        articleId: src.id,
        title: src.title,
        aliases: [...src.aliases],
        tags: [...src.tags],
        infobox: [...src.infobox],
        blockIds: src.blocks.map((b) => b.id),
        blocks: JSON.parse(JSON.stringify(src.blocks)),
        mergedAt: now(),
      }))

      const blocks = options.blockOrder
      const sectionIndex = buildSectionIndex(blocks)
      const linksOut = extractLinksFromWikiBlocks(blocks)

      // Collect all aliases from sources + explicit aliases
      const allAliases = new Set<string>(options.aliases ?? [])
      for (const src of sources) {
        allAliases.add(src.title)
        for (const a of src.aliases) allAliases.add(a)
      }
      allAliases.delete(options.title) // don't alias self

      // Collect all tags
      const allTags = new Set<string>(options.tags ?? [])
      for (const src of sources) {
        for (const t of src.tags) allTags.add(t)
      }

      // Merge infoboxes (first source takes precedence for duplicate keys)
      const seenKeys = new Set<string>()
      const mergedInfobox: WikiArticle["infobox"] = []
      for (const src of sources) {
        for (const entry of src.infobox) {
          if (!seenKeys.has(entry.key)) {
            seenKeys.add(entry.key)
            mergedInfobox.push(entry)
          }
        }
      }

      if (options.mode === "into" && options.targetId) {
        // Mode: merge into existing article
        const targetId = options.targetId

        // Filter mergeHistory to exclude the target itself
        const targetMergeHistory = mergeHistory.filter((s) => s.articleId !== targetId)

        // Get existing mergeHistory from target
        const target = articles.find((a) => a.id === targetId)
        const existingHistory = target?.mergeHistory ?? []

        set((state: any) => ({
          wikiArticles: state.wikiArticles
            .filter((a: WikiArticle) => sourceIds.includes(a.id) && a.id !== targetId ? false : true)
            .map((a: WikiArticle) => {
              if (a.id !== targetId) return a
              return {
                ...a,
                title: options.title,
                blocks,
                sectionIndex,
                aliases: Array.from(allAliases),
                tags: Array.from(allTags),
                categoryIds: options.categoryIds ?? a.categoryIds,
                infobox: mergedInfobox,
                linksOut,
                mergeHistory: [...existingHistory, ...targetMergeHistory],
                updatedAt: now(),
              }
            }),
        }))

        // Persist blocks
        persistArticleBlocks(targetId, blocks)
        for (const b of blocks) {
          if (b.type === "text" && b.content) {
            persistBlockBody({ id: b.id, content: b.content })
          }
        }

        // Clean up deleted sources' IDB data (but not text block bodies since they may be in use)
        for (const id of sourceIds) {
          if (id !== targetId) removeArticleBlocks(id)
        }

        return targetId
      } else {
        // Mode: create new article. Union of folder memberships across
        // sources — keeps the merged article reachable from every folder
        // that previously contained any constituent.
        const folderIdsUnion = Array.from(
          new Set(sources.flatMap((s) => s.folderIds ?? [])),
        )
        const newId = genId()
        const newArticle: WikiArticle = {
          id: newId,
          title: options.title,
          aliases: Array.from(allAliases),
          infobox: mergedInfobox,
          blocks,
          sectionIndex,
          tags: Array.from(allTags),
          categoryIds: options.categoryIds,
          folderIds: folderIdsUnion,
          linksOut,
          mergeHistory,
          createdAt: now(),
          updatedAt: now(),
        }

        set((state: any) => ({
          wikiArticles: [
            ...state.wikiArticles.filter((a: WikiArticle) => !sourceIds.includes(a.id)),
            newArticle,
          ],
        }))

        // Persist blocks
        persistArticleBlocks(newId, blocks)
        for (const b of blocks) {
          if (b.type === "text" && b.content) {
            persistBlockBody({ id: b.id, content: b.content })
          }
        }

        // Clean up deleted sources' IDB data
        for (const id of sourceIds) {
          removeArticleBlocks(id)
        }

        return newId
      }
    },

    unmergeFromHistory: (articleId: string, snapshotIndex: number): string[] => {
      const state = get()
      const article = (state.wikiArticles as WikiArticle[]).find((a) => a.id === articleId)
      if (!article || !article.mergeHistory) return []

      const snapshot = article.mergeHistory[snapshotIndex]
      if (!snapshot) return []

      const snapshotBlockIdSet = new Set(snapshot.blockIds)

      // Extract blocks that belong to this snapshot from current article
      const extractedBlocks = article.blocks.filter((b) => snapshotBlockIdSet.has(b.id))
      // Remaining blocks = blocks NOT in this snapshot
      const remainingBlocks = article.blocks.filter((b) => !snapshotBlockIdSet.has(b.id))

      // If no blocks could be extracted, use the snapshot's stored blocks
      const restorationBlocks = extractedBlocks.length > 0
        ? extractedBlocks
        : JSON.parse(JSON.stringify(snapshot.blocks)) as WikiBlock[]

      // Create restored article from snapshot. Folder membership is not
      // captured in the snapshot (legacy field) — restored article starts
      // unfoldered for the user to re-file.
      const restoredId = genId()
      const restoredArticle: WikiArticle = {
        id: restoredId,
        title: snapshot.title,
        aliases: [...snapshot.aliases],
        infobox: [...snapshot.infobox],
        blocks: restorationBlocks,
        sectionIndex: buildSectionIndex(restorationBlocks),
        tags: [...snapshot.tags],
        folderIds: [],
        linksOut: extractLinksFromWikiBlocks(restorationBlocks),
        createdAt: snapshot.mergedAt,
        updatedAt: now(),
      }

      // Remove the used snapshot from mergeHistory
      const updatedHistory = [
        ...article.mergeHistory.slice(0, snapshotIndex),
        ...article.mergeHistory.slice(snapshotIndex + 1),
      ]

      // Remove snapshot's aliases/tags from the current article
      const snapshotAliasSet = new Set([snapshot.title, ...snapshot.aliases])
      const snapshotTagSet = new Set(snapshot.tags)

      const updatedRemainingBlocks = remainingBlocks.length > 0 ? remainingBlocks : article.blocks
      const remainingLinksOut = extractLinksFromWikiBlocks(updatedRemainingBlocks)

      set((state: any) => ({
        wikiArticles: [
          ...state.wikiArticles.map((a: WikiArticle) => {
            if (a.id !== articleId) return a
            return {
              ...a,
              blocks: updatedRemainingBlocks,
              sectionIndex: buildSectionIndex(updatedRemainingBlocks),
              aliases: a.aliases.filter((al) => !snapshotAliasSet.has(al)),
              tags: a.tags.filter((t) => !snapshotTagSet.has(t)),
              linksOut: remainingLinksOut,
              mergeHistory: updatedHistory.length > 0 ? updatedHistory : undefined,
              updatedAt: now(),
            }
          }),
          restoredArticle,
        ],
      }))

      persistArticleBlocks(articleId, updatedRemainingBlocks)
      persistArticleBlocks(restoredId, restorationBlocks)
      for (const b of restorationBlocks) {
        if (b.type === "text" && b.content) {
          persistBlockBody({ id: b.id, content: b.content })
        }
      }

      return [restoredId]
    },
  }
}
