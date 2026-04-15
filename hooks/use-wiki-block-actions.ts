"use client"

import { useState, useCallback } from "react"
import { usePlotStore } from "@/lib/store"
import type { WikiBlock } from "@/lib/types"
import { getInitialContentJson } from "@/lib/wiki-block-utils"
import { toast } from "sonner"
import { navigateToWikiArticle } from "@/lib/wiki-article-nav"

export function useWikiBlockActions(articleId: string) {
  const addWikiBlock = usePlotStore((s) => s.addWikiBlock)
  const removeWikiBlock = usePlotStore((s) => s.removeWikiBlock)
  const splitWikiArticle = usePlotStore((s) => s.splitWikiArticle)
  const moveBlockToColumn = usePlotStore((s) => s.moveBlockToColumn)

  // Phase 2-2-B-3-b: urlBlockDialog carries either `afterBlockId` (existing insertion
  // point semantics) or `columnPath` (brand-new block scoped to an empty column).
  const [urlBlockDialog, setUrlBlockDialog] = useState<{
    open: boolean
    afterBlockId?: string
    columnPath?: number[]
  }>({ open: false })

  const handleAddBlock = useCallback((type: string, afterBlockId?: string, level?: number) => {
    if (type === "table") {
      const block: Omit<WikiBlock, "id"> = {
        type: "table",
        tableCaption: "",
        tableHeaders: ["Header 1", "Header 2", "Header 3"],
        tableRows: [["", "", ""]],
        tableColumnAligns: ["center", "center", "center"],
      }
      addWikiBlock(articleId, block, afterBlockId)
      return
    }

    if (type === "url") {
      setUrlBlockDialog({ open: true, afterBlockId })
      return
    }

    // Content blocks: create Text block with pre-filled TipTap content
    if (type.startsWith("text:")) {
      const subtype = type.split(":")[1]
      const contentJson = getInitialContentJson(subtype)
      const block: Omit<WikiBlock, "id"> = { type: "text", content: "", contentJson }
      addWikiBlock(articleId, block, afterBlockId)
      return
    }

    const block: Omit<WikiBlock, "id"> = { type: type as WikiBlock["type"] }
    if (type === "section") { block.title = ""; block.level = level ?? 2 }
    if (type === "text") { block.content = "" }
    if (type === "infobox") { block.fields = []; block.headerColor = null }
    if (type === "toc") { block.tocCollapsed = false }
    addWikiBlock(articleId, block, afterBlockId)
  }, [articleId, addWikiBlock])

  /**
   * Phase 2-2-B-3-b: Create a new block inside an (empty) column.
   *
   * Mirrors `handleAddBlock`'s type-dispatch logic, but additionally calls
   * `moveBlockToColumn` to route the new block to `path`. URL blocks defer to
   * the shared urlBlockDialog — the submit handler consumes `columnPath` to
   * finish the column-scoped placement.
   */
  const handleAddBlockToColumn = useCallback(
    (path: number[], type: string, level?: number) => {
      if (type === "url") {
        setUrlBlockDialog({ open: true, columnPath: path })
        return
      }

      let newBlockId: string | undefined

      if (type === "table") {
        const block: Omit<WikiBlock, "id"> = {
          type: "table",
          tableCaption: "",
          tableHeaders: ["Header 1", "Header 2", "Header 3"],
          tableRows: [["", "", ""]],
          tableColumnAligns: ["center", "center", "center"],
        }
        newBlockId = addWikiBlock(articleId, block)
      } else if (type.startsWith("text:")) {
        const subtype = type.split(":")[1]
        const contentJson = getInitialContentJson(subtype)
        newBlockId = addWikiBlock(articleId, { type: "text", content: "", contentJson })
      } else {
        const block: Omit<WikiBlock, "id"> = { type: type as WikiBlock["type"] }
        if (type === "section") {
          block.title = ""
          block.level = level ?? 2
        }
        if (type === "text") {
          block.content = ""
        }
        if (type === "infobox") {
          block.fields = []
          block.headerColor = null
        }
        if (type === "toc") {
          block.tocCollapsed = false
        }
        newBlockId = addWikiBlock(articleId, block)
      }

      if (newBlockId) moveBlockToColumn(articleId, newBlockId, path)
    },
    [articleId, addWikiBlock, moveBlockToColumn],
  )

  const handleDeleteBlock = useCallback((blockId: string) => {
    removeWikiBlock(articleId, blockId)
  }, [articleId, removeWikiBlock])

  const handleSplitSection = useCallback((sectionBlockId: string) => {
    const store = usePlotStore.getState()
    const article = store.wikiArticles.find((a) => a.id === articleId)
    if (!article) return

    const blocks = article.blocks
    const sectionIdx = blocks.findIndex((b) => b.id === sectionBlockId)
    if (sectionIdx === -1) return

    const sectionBlock = blocks[sectionIdx]
    const sectionLevel = sectionBlock.level ?? 2

    const blockIds: string[] = [sectionBlockId]
    for (let i = sectionIdx + 1; i < blocks.length; i++) {
      const b = blocks[i]
      if (b.type === "section" && (b.level ?? 2) <= sectionLevel) break
      blockIds.push(b.id)
    }

    const title = sectionBlock.title || "Untitled Section"
    const newId = splitWikiArticle(articleId, blockIds, title)
    if (newId) {
      toast.success(`Moved "${title}" to new article`)
      navigateToWikiArticle(newId)
    }
  }, [articleId, splitWikiArticle])

  const handleMoveToArticle = useCallback((sectionBlockId: string, targetArticleId: string) => {
    const store = usePlotStore.getState()
    const article = store.wikiArticles.find((a) => a.id === articleId)
    if (!article) return

    const blocks = article.blocks
    const sectionIdx = blocks.findIndex((b) => b.id === sectionBlockId)
    if (sectionIdx === -1) return

    const sectionBlock = blocks[sectionIdx]
    const sectionLevel = sectionBlock.level ?? 2

    const blockIds: string[] = [sectionBlockId]
    if (sectionBlock.type === "section") {
      for (let i = sectionIdx + 1; i < blocks.length; i++) {
        const b = blocks[i]
        if (b.type === "section" && (b.level ?? 2) <= sectionLevel) break
        blockIds.push(b.id)
      }
    }

    const targetArticle = store.wikiArticles.find((a) => a.id === targetArticleId)
    if (!targetArticle) return

    const blocksToMove = blocks.filter((b) => blockIds.includes(b.id))
    const remainingBlocks = blocks.filter((b) => !blockIds.includes(b.id))

    store.updateWikiArticle(targetArticleId, {
      blocks: [...targetArticle.blocks, ...blocksToMove],
    })
    store.updateWikiArticle(articleId, {
      blocks: remainingBlocks,
    })

    toast.success(`Moved ${blockIds.length} block(s) to "${targetArticle.title}"`)
  }, [articleId])

  return {
    addWikiBlock,
    moveBlockToColumn,
    handleAddBlock,
    handleAddBlockToColumn,
    handleDeleteBlock,
    handleSplitSection,
    handleMoveToArticle,
    urlBlockDialog,
    setUrlBlockDialog,
  }
}
