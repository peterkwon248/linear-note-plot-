"use client"

import { useState, useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import type { WikiArticle } from "@/lib/types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { GitMerge } from "@phosphor-icons/react/dist/ssr/GitMerge"
import { ArrowsLeftRight } from "@phosphor-icons/react/dist/ssr/ArrowsLeftRight"
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass"
import { IconWikiStub, IconWikiArticle } from "@/components/plot-icons"
import { navigateToWikiArticle } from "@/lib/wiki-article-nav"
import { setWikiViewMode } from "@/lib/wiki-view-mode"

export function WikiMergePage() {
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const mergeWikiArticles = usePlotStore((s) => s.mergeWikiArticles)

  const [sourceId, setSourceId] = useState<string | null>(null)
  const [targetId, setTargetId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [primarySide, setPrimarySide] = useState<"source" | "target">("target")

  const source = wikiArticles.find((a) => a.id === sourceId)
  const target = wikiArticles.find((a) => a.id === targetId)

  const filteredArticles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return wikiArticles.filter(
      (a) => q.length === 0 || a.title.toLowerCase().includes(q),
    )
  }, [wikiArticles, searchQuery])

  const handleMerge = () => {
    if (!sourceId || !targetId) return
    const pId = primarySide === "source" ? sourceId : targetId
    const sId = primarySide === "source" ? targetId : sourceId
    mergeWikiArticles(pId, sId)
    const pTitle = (primarySide === "source" ? source : target)?.title ?? ""
    const sTitle = (primarySide === "source" ? target : source)?.title ?? ""
    toast.success(`Merged "${sTitle}" into "${pTitle}"`)
    setSourceId(null)
    setTargetId(null)
    navigateToWikiArticle(pId)
    setWikiViewMode("dashboard")
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-foreground">
        <GitMerge size={20} weight="regular" />
        Merge Articles
      </h2>
      <p className="mb-6 text-sm text-muted-foreground/60">
        Select two articles to merge into one
      </p>

      {/* Selection area */}
      <div className="mb-8 flex items-start gap-4">
        {/* Source card */}
        <ArticleSelector
          label="Source"
          selected={source}
          articles={filteredArticles.filter((a) => a.id !== targetId)}
          onSelect={setSourceId}
          isPrimary={primarySide === "source"}
        />

        {/* Swap button */}
        <div className="flex flex-col items-center gap-2 pt-8">
          <button
            onClick={() =>
              setPrimarySide((p) => (p === "source" ? "target" : "source"))
            }
            className="rounded-full border border-border p-2 transition-colors hover:bg-secondary"
            title="Swap primary"
          >
            <ArrowsLeftRight size={16} weight="regular" />
          </button>
          <p className="text-2xs text-muted-foreground/40">Swap</p>
        </div>

        {/* Target card */}
        <ArticleSelector
          label="Target"
          selected={target}
          articles={filteredArticles.filter((a) => a.id !== sourceId)}
          onSelect={setTargetId}
          isPrimary={primarySide === "target"}
        />
      </div>

      {/* Search */}
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

      {/* Merge button */}
      {source && target && (
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={handleMerge}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90"
          >
            <GitMerge
              size={14}
              weight="regular"
              className="mr-1.5 inline"
            />
            Merge Articles
          </button>
          <p className="text-xs text-muted-foreground">
            &ldquo;
            {(primarySide === "source" ? target : source)?.title}
            &rdquo; will be absorbed into &ldquo;
            {(primarySide === "source" ? source : target)?.title}
            &rdquo;
          </p>
        </div>
      )}
    </div>
  )
}

function ArticleSelector({
  label,
  selected,
  articles,
  onSelect,
  isPrimary,
}: {
  label: string
  selected: WikiArticle | undefined
  articles: WikiArticle[]
  onSelect: (id: string) => void
  isPrimary: boolean
}) {
  return (
    <div
      className={cn(
        "flex-1 rounded-xl border-2 p-4 transition-colors",
        isPrimary ? "border-accent/30 bg-accent/5" : "border-border/40",
        selected && "min-h-[120px]",
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-2xs font-medium uppercase tracking-wider text-muted-foreground/50">
          {label}
        </span>
        {isPrimary && (
          <span className="text-2xs font-medium text-accent">
            Primary (survives)
          </span>
        )}
      </div>
      {selected ? (
        <div>
          <h4 className="text-sm font-semibold text-foreground">
            {selected.title}
          </h4>
          <p className="mt-1 text-2xs text-muted-foreground">
            {selected.blocks.length} blocks &middot; {selected.wikiStatus}
          </p>
          <button
            onClick={() => onSelect("")}
            className="mt-2 text-2xs text-muted-foreground hover:text-foreground"
          >
            Change
          </button>
        </div>
      ) : (
        <div className="max-h-[200px] space-y-1 overflow-y-auto">
          {articles.map((a) => (
            <button
              key={a.id}
              onClick={() => onSelect(a.id)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-foreground/80 transition-colors hover:bg-secondary"
            >
              {a.wikiStatus === "article" ||
              (a.wikiStatus as string) === "complete" ? (
                <IconWikiArticle
                  size={14}
                  className="shrink-0 text-wiki-complete"
                />
              ) : (
                <IconWikiStub size={14} className="shrink-0 text-chart-3" />
              )}
              <span className="truncate">{a.title}</span>
            </button>
          ))}
          {articles.length === 0 && (
            <p className="py-4 text-center text-2xs text-muted-foreground/40">
              No articles available
            </p>
          )}
        </div>
      )}
    </div>
  )
}
