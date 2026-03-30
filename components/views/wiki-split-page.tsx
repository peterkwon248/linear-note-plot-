"use client"

import { useState, useMemo, useCallback } from "react"
import { usePlotStore } from "@/lib/store"
import type { WikiArticle, WikiBlock } from "@/lib/types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  Search,
  Scissors,
  X,
  GripVertical,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Undo2,
  Check,
  Layers,
  FileText,
} from "lucide-react"
import { WikiStatusBadge } from "@/components/views/wiki-shared"
import { navigateToWikiArticle } from "@/lib/wiki-article-nav"
import { setWikiViewMode } from "@/lib/wiki-view-mode"

/* ── Block Content Display ── */

function BlockLabel({ block, noteTitleMap }: { block: WikiBlock; noteTitleMap: Map<string, string> }) {
  switch (block.type) {
    case "section":
      return (
        <div className="flex items-center gap-1.5">
          <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-2xs font-medium uppercase text-white/30">
            H{block.level ?? 2}
          </span>
          <span className="font-semibold text-white/90">{block.title ?? "Untitled Section"}</span>
        </div>
      )
    case "text":
      return (
        <span className="text-white/60">
          {block.content
            ? block.content.length > 100
              ? block.content.slice(0, 100) + "…"
              : block.content
            : "Empty text"}
        </span>
      )
    case "note-ref": {
      const noteTitle = block.noteId ? noteTitleMap.get(block.noteId) : undefined
      return <span className="text-white/60">📝 {noteTitle ?? "Note reference"}</span>
    }
    case "image":
      return <span className="text-white/60">🖼 {block.caption ?? "Image"}</span>
    default:
      return <span className="text-white/60 capitalize">{block.type}</span>
  }
}

/* ── Main Component ── */

export function WikiSplitPage() {
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const notes = usePlotStore((s) => s.notes)
  const splitWikiArticle = usePlotStore((s) => s.splitWikiArticle)
  const unmergeWikiArticle = usePlotStore((s) => s.unmergeWikiArticle)

  // Article selection
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Block selection for split
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set())
  const [rightBlocks, setRightBlocks] = useState<string[]>([]) // blocks moved to "new article" column
  const [lastClickedIdx, setLastClickedIdx] = useState<number | null>(null)

  // New article config
  const [newTitle, setNewTitle] = useState("")
  const [newStatus, setNewStatus] = useState<"stub" | "article">("stub")

  // Note title map
  const noteTitleMap = useMemo(() => {
    const map = new Map<string, string>()
    notes.forEach((n) => map.set(n.id, n.title))
    return map
  }, [notes])

  const article = wikiArticles.find((a) => a.id === selectedArticleId)

  const filteredArticles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return wikiArticles.filter(
      (a) => q.length === 0 || a.title.toLowerCase().includes(q),
    )
  }, [wikiArticles, searchQuery])

  // Blocks remaining in left column (not moved to right)
  const leftBlocks = useMemo(() => {
    if (!article) return []
    const rightSet = new Set(rightBlocks)
    return article.blocks.filter((b) => !rightSet.has(b.id))
  }, [article, rightBlocks])

  // Right column blocks with full data
  const rightBlockData = useMemo(() => {
    if (!article) return []
    const blockMap = new Map(article.blocks.map((b) => [b.id, b]))
    return rightBlocks.map((id) => blockMap.get(id)).filter(Boolean) as WikiBlock[]
  }, [article, rightBlocks])

  // Merge history dividers
  const mergeDividers = useMemo(() => {
    if (!article) return []
    return article.blocks.filter((b) => b.mergedFrom)
  }, [article])

  // Block click with Shift support
  const handleBlockClick = useCallback((blockId: string, idx: number, shiftKey: boolean) => {
    if (shiftKey && lastClickedIdx !== null) {
      // Range select
      const start = Math.min(lastClickedIdx, idx)
      const end = Math.max(lastClickedIdx, idx)
      setSelectedBlockIds((prev) => {
        const next = new Set(prev)
        for (let i = start; i <= end; i++) {
          if (leftBlocks[i]) next.add(leftBlocks[i].id)
        }
        return next
      })
    } else {
      setSelectedBlockIds((prev) => {
        const next = new Set(prev)
        if (next.has(blockId)) next.delete(blockId)
        else next.add(blockId)
        return next
      })
    }
    setLastClickedIdx(idx)
  }, [lastClickedIdx, leftBlocks])

  // Move selected blocks to right column
  const moveToRight = useCallback(() => {
    const toMove = leftBlocks.filter((b) => selectedBlockIds.has(b.id)).map((b) => b.id)
    setRightBlocks((prev) => [...prev, ...toMove])
    setSelectedBlockIds(new Set())
  }, [leftBlocks, selectedBlockIds])

  // Move block back to left
  const moveToLeft = useCallback((blockId: string) => {
    setRightBlocks((prev) => prev.filter((id) => id !== blockId))
  }, [])

  // Move all back
  const moveAllToLeft = useCallback(() => {
    setRightBlocks([])
  }, [])

  // Reorder within right column
  const reorderRight = useCallback((fromIdx: number, toIdx: number) => {
    setRightBlocks((prev) => {
      const next = [...prev]
      const [moved] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, moved)
      return next
    })
  }, [])

  // Split action
  const handleSplit = () => {
    if (!selectedArticleId || rightBlocks.length === 0 || !newTitle.trim()) return
    const newId = splitWikiArticle(selectedArticleId, rightBlocks, newTitle.trim(), newStatus)
    if (newId) {
      toast.success(`Split "${newTitle}" from "${article?.title}"`)
      navigateToWikiArticle(newId)
      setWikiViewMode("list")
    }
  }

  // Unmerge action
  const handleUnmerge = (dividerBlockId: string) => {
    if (!selectedArticleId) return
    const divider = article?.blocks.find((b) => b.id === dividerBlockId)
    const restoredId = unmergeWikiArticle(selectedArticleId, dividerBlockId)
    if (restoredId) {
      toast.success(`Unmerged "${divider?.mergedFrom?.title}" back to separate article`)
    }
  }

  // Select article
  const selectArticle = (id: string) => {
    setSelectedArticleId(id)
    setSelectedBlockIds(new Set())
    setRightBlocks([])
    setNewTitle("")
    setSearchQuery("")
  }

  /* ── Article Selector View ── */
  if (!selectedArticleId) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 border-b border-white/[0.06] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
              <Scissors size={16} className="text-white/70" />
            </div>
            <div>
              <h2 className="text-note font-semibold text-white/90">Split Article</h2>
              <p className="text-2xs text-white/40">Choose an article to split</p>
            </div>
            <div className="ml-auto">
              <button
                onClick={() => setWikiViewMode("list")}
                className="rounded-md px-3 py-2 text-note text-white/50 transition-colors hover:bg-white/5 hover:text-white/70"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Search + list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="relative mb-4 max-w-lg">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles…"
              className="h-8 w-full rounded-md border border-white/[0.08] bg-white/[0.03] pl-8 pr-3 text-2xs text-white/90 placeholder:text-white/30 focus:border-white/20 focus:outline-none"
            />
          </div>

          <div className="max-w-lg space-y-1">
            {filteredArticles.map((a) => (
              <button
                key={a.id}
                onClick={() => selectArticle(a.id)}
                className="flex w-full items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-left transition-colors hover:bg-white/[0.05] hover:border-white/[0.1]"
              >
                <WikiStatusBadge status={a.wikiStatus} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-note font-medium text-white/85">{a.title}</p>
                  <p className="text-2xs text-white/30">{a.blocks.length} blocks</p>
                </div>
                <ChevronRight size={14} className="shrink-0 text-white/20" />
              </button>
            ))}
            {filteredArticles.length === 0 && (
              <p className="py-8 text-center text-2xs text-white/25">No articles found</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  /* ── Split Editor View ── */
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-white/[0.06] px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedArticleId(null)
              setSelectedBlockIds(new Set())
              setRightBlocks([])
            }}
            className="rounded-md px-2 py-1 text-2xs text-white/50 transition-colors hover:bg-white/5 hover:text-white/70"
          >
            ← Back
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
            <Scissors size={16} className="text-white/70" />
          </div>
          <div>
            <h2 className="text-note font-semibold text-white/90">Split: {article?.title}</h2>
            <p className="text-2xs text-white/40">
              {leftBlocks.length} blocks remaining · {rightBlocks.length} blocks to split
            </p>
          </div>
          <div className="ml-auto">
            <button
              onClick={() => setWikiViewMode("list")}
              className="rounded-md px-3 py-2 text-note text-white/50 transition-colors hover:bg-white/5 hover:text-white/70"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Merge History (if any) */}
      {mergeDividers.length > 0 && (
        <div className="shrink-0 border-b border-white/[0.06] bg-chart-3/[0.03] px-6 py-3">
          <h4 className="mb-2 text-2xs font-medium text-chart-3/80 uppercase tracking-wider">Previously Merged</h4>
          <div className="flex flex-wrap gap-2">
            {mergeDividers.map((b) => (
              <div
                key={b.id}
                className="inline-flex items-center gap-2 rounded-md border border-chart-3/15 bg-chart-3/5 px-3 py-1.5"
              >
                <span className="text-2xs text-white/70">{b.mergedFrom?.title}</span>
                <span className="text-2xs text-white/30">
                  {b.mergedFrom?.blockIds.length} blocks
                </span>
                <button
                  onClick={() => handleUnmerge(b.id)}
                  className="ml-1 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-2xs font-medium text-chart-3 transition-colors hover:bg-chart-3/10"
                >
                  <Undo2 size={10} />
                  Unmerge
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className="flex min-h-0 flex-1">
        {/* Left Column: Original Article */}
        <div className="flex w-1/2 flex-col border-r border-white/[0.06]">
          <div className="shrink-0 px-4 pt-3 pb-2 flex items-center justify-between">
            <h3 className="text-note font-medium text-white/50 uppercase tracking-wider">Original Article</h3>
            {selectedBlockIds.size > 0 && (
              <button
                onClick={moveToRight}
                className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-2 py-1 text-2xs font-medium text-accent transition-colors hover:bg-accent/20"
              >
                Move {selectedBlockIds.size} →
                <ArrowRight size={12} />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-4">
            {leftBlocks.map((block, idx) => {
              const isSelected = selectedBlockIds.has(block.id)
              const isMergeDivider = !!block.mergedFrom
              return (
                <div
                  key={block.id}
                  onClick={(e) => handleBlockClick(block.id, idx, e.shiftKey)}
                  className={cn(
                    "group flex cursor-pointer items-start gap-2.5 rounded-md px-3 py-2.5 transition-all duration-100",
                    isSelected
                      ? "bg-blue-500/10 ring-1 ring-blue-500/30"
                      : "hover:bg-white/[0.03]",
                    isMergeDivider && "border-l-2 border-chart-3/30",
                  )}
                >
                  {/* Checkbox */}
                  <div
                    className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                      isSelected
                        ? "border-blue-500 bg-blue-500"
                        : "border-white/15",
                    )}
                  >
                    {isSelected && <Check size={10} className="text-white" />}
                  </div>

                  <div className="min-w-0 flex-1 text-note">
                    {isMergeDivider && (
                      <p className="mb-0.5 text-2xs text-chart-3/70">
                        ↳ From: {block.mergedFrom?.title}
                      </p>
                    )}
                    <BlockLabel block={block} noteTitleMap={noteTitleMap} />
                  </div>

                  <span className="mt-0.5 shrink-0 rounded bg-white/[0.04] px-1 py-0.5 text-2xs uppercase text-white/20">
                    {block.type}
                  </span>
                </div>
              )
            })}
            {leftBlocks.length === 0 && (
              <div className="flex h-full items-center justify-center">
                <p className="text-2xs text-white/20">All blocks moved to new article</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: New Article */}
        <div className="flex w-1/2 flex-col">
          <div className="shrink-0 px-4 pt-3 pb-2 flex items-center justify-between">
            <h3 className="text-note font-medium text-white/50 uppercase tracking-wider">New Article</h3>
            {rightBlocks.length > 0 && (
              <button
                onClick={moveAllToLeft}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-2xs text-white/40 transition-colors hover:bg-white/5 hover:text-white/60"
              >
                <ArrowLeft size={12} />
                Return all
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-4">
            {rightBlockData.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-lg border-2 border-dashed border-white/[0.08] bg-white/[0.02]">
                <div className="text-center px-4">
                  <Layers size={32} className="mx-auto mb-3 text-white/10" />
                  <p className="text-note text-white/25">
                    Select blocks and click <span className="text-accent">Move →</span>
                  </p>
                  <p className="mt-1 text-note text-white/15">or Shift+Click for range selection</p>
                </div>
              </div>
            ) : (
              <div className="space-y-0.5">
                {rightBlockData.map((block, idx) => (
                  <div
                    key={block.id}
                    className="group flex items-start gap-2.5 rounded-md bg-white/[0.04] px-3 py-2.5"
                  >
                    <GripVertical size={12} className="mt-0.5 shrink-0 cursor-grab text-white/15" />

                    <div className="min-w-0 flex-1 text-note">
                      <BlockLabel block={block} noteTitleMap={noteTitleMap} />
                    </div>

                    <span className="mt-0.5 shrink-0 rounded bg-white/[0.04] px-1 py-0.5 text-2xs uppercase text-white/20">
                      {block.type}
                    </span>

                    {/* Reorder buttons */}
                    {idx > 0 && (
                      <button
                        onClick={() => reorderRight(idx, idx - 1)}
                        className="rounded p-0.5 text-white/15 opacity-0 transition-opacity hover:bg-white/5 hover:text-white/40 group-hover:opacity-100"
                        title="Move up"
                      >
                        <ChevronRight size={10} className="-rotate-90" />
                      </button>
                    )}
                    {idx < rightBlockData.length - 1 && (
                      <button
                        onClick={() => reorderRight(idx, idx + 1)}
                        className="rounded p-0.5 text-white/15 opacity-0 transition-opacity hover:bg-white/5 hover:text-white/40 group-hover:opacity-100"
                        title="Move down"
                      >
                        <ChevronRight size={10} className="rotate-90" />
                      </button>
                    )}

                    <button
                      onClick={() => moveToLeft(block.id)}
                      className="rounded p-0.5 text-white/15 opacity-0 transition-opacity hover:bg-white/5 hover:text-destructive group-hover:opacity-100"
                      title="Remove"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-white/[0.06] bg-white/[0.02] px-6 py-4">
        <div className="flex items-center gap-4">
          {/* Title input */}
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-note text-white/40">New Article Title</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Title for the split article…"
              className="h-9 w-full rounded-md border border-white/[0.08] bg-white/[0.03] px-3 text-note text-white/90 placeholder:text-white/30 focus:border-white/20 focus:outline-none"
            />
          </div>

          {/* Status */}
          <div>
            <label className="mb-1 block text-note text-white/40">Status</label>
            <div className="flex gap-1 rounded-md bg-white/[0.04] p-0.5">
              <button
                onClick={() => setNewStatus("stub")}
                className={cn(
                  "rounded px-3 py-1.5 text-note font-medium transition-colors",
                  newStatus === "stub"
                    ? "bg-chart-3/20 text-chart-3"
                    : "text-white/40 hover:text-white/60",
                )}
              >
                Stub
              </button>
              <button
                onClick={() => setNewStatus("article")}
                className={cn(
                  "rounded px-3 py-1.5 text-note font-medium transition-colors",
                  newStatus === "article"
                    ? "bg-wiki-complete/20 text-wiki-complete"
                    : "text-white/40 hover:text-white/60",
                )}
              >
                Article
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-end gap-3 pt-4">
            <button
              onClick={handleSplit}
              disabled={rightBlocks.length === 0 || !newTitle.trim()}
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-note font-medium text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Scissors size={14} />
              Split {rightBlocks.length} Block{rightBlocks.length !== 1 ? "s" : ""}
            </button>
            <button
              onClick={() => setWikiViewMode("list")}
              className="rounded-md px-3 py-2 text-note text-white/50 transition-colors hover:bg-white/5 hover:text-white/70"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
