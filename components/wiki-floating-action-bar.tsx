"use client"

import { useMemo } from "react"
import { toast } from "sonner"
import { usePlotStore } from "@/lib/store"
import type { WikiArticle } from "@/lib/types"
import { pushUndo } from "@/lib/undo-manager"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr/ArrowUpRight"
import { ArrowDownRight } from "@phosphor-icons/react/dist/ssr/ArrowDownRight"
import { GitMerge } from "@phosphor-icons/react/dist/ssr/GitMerge"
import { Scissors } from "@phosphor-icons/react/dist/ssr/Scissors"
import { Lightning } from "@phosphor-icons/react/dist/ssr/Lightning"

interface WikiFloatingActionBarProps {
  selectedIds: Set<string>
  articles: WikiArticle[]
  onClearSelection: () => void
  onMerge?: (sourceId: string) => void
  onMultiMerge?: (ids: string[]) => void
  onSplit?: (id: string) => void
}

function Divider() {
  return <div className="h-7 w-px bg-border mx-1.5" />
}

export function WikiFloatingActionBar({
  selectedIds,
  articles,
  onClearSelection,
  onMerge,
  onMultiMerge,
  onSplit,
}: WikiFloatingActionBarProps) {
  const deleteWikiArticle = usePlotStore((s) => s.deleteWikiArticle)
  const createWikiArticle = usePlotStore((s) => s.createWikiArticle)
  const setWikiArticleStatus = usePlotStore((s) => s.setWikiArticleStatus)

  const ids = useMemo(() => Array.from(selectedIds), [selectedIds])
  const count = ids.length

  const selectedArticles = useMemo(
    () => articles.filter((a) => selectedIds.has(a.id)),
    [articles, selectedIds],
  )

  // How many are stubs (can be promoted)
  const stubCount = selectedArticles.filter(a => a.wikiStatus === "stub" || (a.wikiStatus as string) === "draft").length
  // How many are articles (can be demoted)
  const articleCount = selectedArticles.filter(a => a.wikiStatus === "article" || (a.wikiStatus as string) === "complete").length

  const handleDelete = () => {
    // Save articles for undo
    const deletedArticles = selectedArticles.map(a => ({ ...a }))
    ids.forEach((id) => deleteWikiArticle(id))
    onClearSelection()
    toast.success(`Deleted ${count} article${count > 1 ? "s" : ""}`)

    pushUndo(
      `Delete ${count} article${count > 1 ? "s" : ""}`,
      () => {
        // Undo: recreate deleted articles
        for (const a of deletedArticles) {
          createWikiArticle({
            title: a.title,
            aliases: a.aliases,
            blocks: a.blocks,
            tags: a.tags,
            wikiStatus: a.wikiStatus,
          })
        }
        toast.success(`Restored ${deletedArticles.length} article${deletedArticles.length > 1 ? "s" : ""}`)
      }
    )
  }

  const handlePromote = () => {
    const promoted: { id: string; prevStatus: string }[] = []
    ids.forEach((id) => {
      const article = articles.find(a => a.id === id)
      if (article && (article.wikiStatus === "stub" || (article.wikiStatus as string) === "draft")) {
        promoted.push({ id, prevStatus: article.wikiStatus })
        setWikiArticleStatus(id, "article")
      }
    })
    onClearSelection()
    toast.success(`Promoted ${promoted.length} article${promoted.length > 1 ? "s" : ""} to Article`)
  }

  const handleDemote = () => {
    const demoted: { id: string; prevStatus: string }[] = []
    ids.forEach((id) => {
      const article = articles.find(a => a.id === id)
      if (article && (article.wikiStatus === "article" || (article.wikiStatus as string) === "complete")) {
        demoted.push({ id, prevStatus: article.wikiStatus })
        setWikiArticleStatus(id, "stub")
      }
    })
    onClearSelection()
    toast.success(`Demoted ${demoted.length} article${demoted.length > 1 ? "s" : ""} to Stub`)
  }

  const handleMerge = () => {
    if (count === 1 && onMerge) {
      onMerge(ids[0])
      onClearSelection()
    } else if (count >= 2 && onMultiMerge) {
      onMultiMerge(ids)
    }
  }

  if (count === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in slide-in-from-bottom-4 fade-in duration-200">
      <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-overlay px-3 py-2 shadow-2xl">
        {/* Selection info */}
        <button
          onClick={onClearSelection}
          className="mr-1 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-2xs font-medium text-muted-foreground hover:bg-active-bg transition-colors"
        >
          <Lightning size={14} weight="fill" className="text-accent" />
          {count} selected
          <PhX size={12} weight="regular" className="ml-0.5 text-muted-foreground/50" />
        </button>

        <Divider />

        {/* Promote stubs to article */}
        {stubCount > 0 && (
          <>
            <button
              onClick={handlePromote}
              className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-3 py-2 text-2xs font-medium text-foreground/80 transition-colors hover:bg-hover-bg hover:text-foreground"
              title="Promote selected stubs to Article"
            >
              <ArrowUpRight size={16} weight="regular" />
              Promote
            </button>
            <Divider />
          </>
        )}

        {/* Demote articles to stub */}
        {articleCount > 0 && (
          <>
            <button
              onClick={handleDemote}
              className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-3 py-2 text-2xs font-medium text-foreground/80 transition-colors hover:bg-hover-bg hover:text-foreground"
              title="Demote selected articles to Stub"
            >
              <ArrowDownRight size={16} weight="regular" />
              Demote
            </button>
            <Divider />
          </>
        )}

        {/* Merge (works for 1+ selected) */}
        {(onMerge || onMultiMerge) && (
          <>
            <button
              onClick={handleMerge}
              className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-3 py-2 text-2xs font-medium text-foreground/80 transition-colors hover:bg-hover-bg hover:text-foreground"
              title={count >= 2 ? "Open merge page with selected articles" : "Merge into another article"}
            >
              <GitMerge size={16} weight="regular" />
              Merge
            </button>
            <Divider />
          </>
        )}

        {/* Split (single selection only) */}
        {count === 1 && onSplit && (
          <>
            <button
              onClick={() => { onSplit(ids[0]); onClearSelection() }}
              className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-3 py-2 text-2xs font-medium text-foreground/80 transition-colors hover:bg-hover-bg hover:text-foreground"
            >
              <Scissors size={16} weight="regular" />
              Split
            </button>
            <Divider />
          </>
        )}

        {/* Delete */}
        <button
          onClick={handleDelete}
          className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-3 py-2 text-2xs font-medium text-destructive transition-colors hover:bg-destructive/20"
        >
          <Trash size={16} weight="regular" />
          Delete
        </button>
      </div>
    </div>
  )
}
