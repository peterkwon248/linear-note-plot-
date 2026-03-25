"use client"

import { useMemo } from "react"
import { toast } from "sonner"
import { usePlotStore } from "@/lib/store"
import type { WikiArticle } from "@/lib/types"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr/ArrowUpRight"
import { GitMerge } from "@phosphor-icons/react/dist/ssr/GitMerge"
import { Lightning } from "@phosphor-icons/react/dist/ssr/Lightning"

interface WikiFloatingActionBarProps {
  selectedIds: Set<string>
  articles: WikiArticle[]
  onClearSelection: () => void
  onMerge?: (sourceId: string) => void
}

function Divider() {
  return <div className="h-7 w-px bg-border mx-1.5" />
}

export function WikiFloatingActionBar({
  selectedIds,
  articles,
  onClearSelection,
  onMerge,
}: WikiFloatingActionBarProps) {
  const deleteWikiArticle = usePlotStore((s) => s.deleteWikiArticle)
  const setWikiArticleStatus = usePlotStore((s) => s.setWikiArticleStatus)

  const ids = useMemo(() => Array.from(selectedIds), [selectedIds])
  const count = ids.length

  const selectedArticles = useMemo(
    () => articles.filter((a) => selectedIds.has(a.id)),
    [articles, selectedIds],
  )

  // How many are stubs (can be promoted)
  const stubCount = selectedArticles.filter(a => a.wikiStatus === "stub" || (a.wikiStatus as string) === "draft").length

  const handleDelete = () => {
    ids.forEach((id) => deleteWikiArticle(id))
    onClearSelection()
    toast.success(`Deleted ${count} article${count > 1 ? "s" : ""}`)
  }

  const handlePromote = () => {
    ids.forEach((id) => {
      const article = articles.find(a => a.id === id)
      if (article && (article.wikiStatus === "stub" || (article.wikiStatus as string) === "draft")) {
        setWikiArticleStatus(id, "article")
      }
    })
    onClearSelection()
    toast.success(`Promoted ${stubCount} article${stubCount > 1 ? "s" : ""} to Article`)
  }

  if (count === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-1 rounded-xl border border-border bg-popover px-3 py-2 shadow-2xl">
        {/* Selection info */}
        <button
          onClick={onClearSelection}
          className="mr-1 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-active-bg transition-colors"
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
              className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-3 py-2 text-xs font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ArrowUpRight size={16} weight="regular" />
              Promote
            </button>
            <Divider />
          </>
        )}

        {/* Merge (single selection only) */}
        {count === 1 && onMerge && (
          <>
            <button
              onClick={() => { onMerge(ids[0]); onClearSelection() }}
              className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-3 py-2 text-xs font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
            >
              <GitMerge size={16} weight="regular" />
              Merge
            </button>
            <Divider />
          </>
        )}

        {/* Delete */}
        <button
          onClick={handleDelete}
          className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20"
        >
          <Trash size={16} weight="regular" />
          Delete
        </button>
      </div>
    </div>
  )
}
