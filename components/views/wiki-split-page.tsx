"use client"

import { useState, useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import type { WikiArticle } from "@/lib/types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Scissors } from "@phosphor-icons/react/dist/ssr/Scissors"
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass"
import { IconWikiStub, IconWikiArticle } from "@/components/plot-icons"
import { navigateToWikiArticle } from "@/lib/wiki-article-nav"
import { setWikiViewMode } from "@/lib/wiki-view-mode"

export function WikiSplitPage() {
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const splitWikiArticle = usePlotStore((s) => s.splitWikiArticle)
  const unmergeWikiArticle = usePlotStore((s) => s.unmergeWikiArticle)

  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(
    null,
  )
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(
    new Set(),
  )
  const [newTitle, setNewTitle] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const article = wikiArticles.find((a) => a.id === selectedArticleId)

  const filteredArticles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return wikiArticles.filter(
      (a) => q.length === 0 || a.title.toLowerCase().includes(q),
    )
  }, [wikiArticles, searchQuery])

  // Blocks with merge dividers highlighted
  const mergeDividers = useMemo(() => {
    if (!article) return []
    return article.blocks.filter((b) => b.mergedFrom)
  }, [article])

  const toggleBlock = (blockId: string) => {
    setSelectedBlockIds((prev) => {
      const next = new Set(prev)
      if (next.has(blockId)) next.delete(blockId)
      else next.add(blockId)
      return next
    })
  }

  const handleSplit = () => {
    if (!selectedArticleId || selectedBlockIds.size === 0 || !newTitle.trim())
      return
    const newId = splitWikiArticle(
      selectedArticleId,
      Array.from(selectedBlockIds),
      newTitle.trim(),
    )
    if (newId) {
      toast.success(`Split "${newTitle}" from "${article?.title}"`)
      setSelectedBlockIds(new Set())
      setNewTitle("")
      navigateToWikiArticle(newId)
      setWikiViewMode("dashboard")
    }
  }

  const handleUnmerge = (dividerBlockId: string) => {
    if (!selectedArticleId) return
    const divider = article?.blocks.find((b) => b.id === dividerBlockId)
    const restoredId = unmergeWikiArticle(selectedArticleId, dividerBlockId)
    if (restoredId) {
      toast.success(
        `Unmerged "${divider?.mergedFrom?.title}" back to separate article`,
      )
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-foreground">
        <Scissors size={20} weight="regular" />
        Split Article
      </h2>
      <p className="mb-6 text-sm text-muted-foreground/60">
        Select an article and choose blocks to extract into a new article
      </p>

      {!selectedArticleId ? (
        /* Article selection */
        <>
          <div className="relative mb-4 max-w-md">
            <MagnifyingGlass
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40"
              size={14}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles..."
              className="h-9 w-full rounded-md border border-border bg-secondary/30 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-accent focus:outline-none"
            />
          </div>
          <div className="grid max-w-2xl gap-2">
            {filteredArticles.map((a) => (
              <button
                key={a.id}
                onClick={() => {
                  setSelectedArticleId(a.id)
                  setSelectedBlockIds(new Set())
                  setNewTitle("")
                }}
                className="flex items-center gap-3 rounded-lg border border-border/40 px-4 py-3 text-left transition-colors hover:bg-secondary/30"
              >
                {a.wikiStatus === "article" ||
                (a.wikiStatus as string) === "complete" ? (
                  <IconWikiArticle
                    size={16}
                    className="shrink-0 text-wiki-complete"
                  />
                ) : (
                  <IconWikiStub size={16} className="shrink-0 text-chart-3" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {a.title}
                  </p>
                  <p className="text-2xs text-muted-foreground">
                    {a.blocks.length} blocks
                  </p>
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        /* Block selection */
        <>
          <div className="mb-4 flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedArticleId(null)
                setSelectedBlockIds(new Set())
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              &larr; Back
            </button>
            <h3 className="text-sm font-semibold text-foreground">
              {article?.title}
            </h3>
          </div>

          {/* Unmerge section */}
          {mergeDividers.length > 0 && (
            <div className="mb-6 rounded-lg border border-chart-3/20 bg-chart-3/5 p-4">
              <h4 className="mb-2 text-xs font-medium text-chart-3">
                Previously merged &mdash; click to unmerge
              </h4>
              <div className="space-y-1">
                {mergeDividers.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => handleUnmerge(b.id)}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-foreground/80 transition-colors hover:bg-chart-3/10"
                  >
                    <span className="font-medium text-chart-3">Unmerge</span>
                    <span className="truncate">{b.mergedFrom?.title}</span>
                    <span className="ml-auto text-2xs text-muted-foreground">
                      {b.mergedFrom?.blockIds.length} blocks
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Block list with checkboxes */}
          <div className="mb-6 max-w-2xl space-y-0.5">
            {article?.blocks.map((block) => (
              <div
                key={block.id}
                onClick={() => toggleBlock(block.id)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition-colors",
                  selectedBlockIds.has(block.id)
                    ? "bg-accent/10 ring-1 ring-accent/20"
                    : "hover:bg-secondary/30",
                )}
              >
                <div
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                    selectedBlockIds.has(block.id)
                      ? "border-accent bg-accent text-white"
                      : "border-muted-foreground/30",
                  )}
                >
                  {selectedBlockIds.has(block.id) && (
                    <PhCheck size={10} weight="bold" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-foreground/80">
                    {block.type === "section"
                      ? `\u00A7 ${block.title ?? "Untitled"}`
                      : block.type === "text"
                        ? (block.content?.slice(0, 80) || "Empty text")
                        : block.type === "note-ref"
                          ? "Note reference"
                          : block.type === "image"
                            ? "Image"
                            : block.type}
                  </p>
                </div>
                <span className="shrink-0 text-2xs uppercase text-muted-foreground/40">
                  {block.type}
                </span>
              </div>
            ))}
          </div>

          {/* Split controls */}
          <div className="sticky bottom-0 max-w-2xl border-t border-border bg-background py-4">
            <p className="mb-2 text-xs text-muted-foreground">
              {selectedBlockIds.size} block
              {selectedBlockIds.size !== 1 ? "s" : ""} selected
            </p>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="New article title..."
                className="h-9 flex-1 rounded-md border border-border bg-secondary/30 px-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-accent focus:outline-none"
              />
              <button
                onClick={handleSplit}
                disabled={selectedBlockIds.size === 0 || !newTitle.trim()}
                className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Scissors
                  size={14}
                  weight="regular"
                  className="mr-1.5 inline"
                />
                Split
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
