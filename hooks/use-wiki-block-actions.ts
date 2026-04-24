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

  const [urlBlockDialog, setUrlBlockDialog] = useState<{ open: boolean; afterBlockId?: string }>({ open: false })

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

    if (type === "navbox") {
      const block: Omit<WikiBlock, "id"> = {
        type: "navbox",
        navboxColumns: 4,
      }
      addWikiBlock(articleId, block, afterBlockId)
      return
    }

    if (type === "nav") {
      const block: Omit<WikiBlock, "id"> = {
        type: "nav",
        navTitle: "",
        navPrev: { text: "" },
        navCurrent: { text: "" },
        navNext: { text: "" },
      }
      addWikiBlock(articleId, block, afterBlockId)
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
    addWikiBlock(articleId, block, afterBlockId)
  }, [articleId, addWikiBlock])

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
    handleAddBlock,
    handleDeleteBlock,
    handleSplitSection,
    handleMoveToArticle,
    urlBlockDialog,
    setUrlBlockDialog,
  }
}
