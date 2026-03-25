"use client"

import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { usePlotStore } from "@/lib/store"
import type { WikiArticle, WikiBlock, WikiStatus } from "@/lib/types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  Search,
  GitMerge,
  X,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Plus,
  Check,
  FileText,
  Layers,
} from "lucide-react"
import { WikiStatusBadge } from "@/components/views/wiki-shared"
import { navigateToWikiArticle } from "@/lib/wiki-article-nav"
import { setWikiViewMode } from "@/lib/wiki-view-mode"

/* ── Block Content Renderer ── */

function BlockContent({ block, noteTitleMap }: { block: WikiBlock; noteTitleMap: Map<string, string> }) {
  switch (block.type) {
    case "section":
      return (
        <span className="font-medium text-white/80">
          <span className="mr-1.5 text-white/30 text-2xs">H{block.level ?? 2}</span>
          {block.title ?? "Untitled Section"}
        </span>
      )
    case "text":
      return (
        <span className="text-white/60">
          {block.content ? (block.content.length > 120 ? block.content.slice(0, 120) + "…" : block.content) : "Empty text"}
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

export function WikiMergePage() {
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const notes = usePlotStore((s) => s.notes)
  const mergeWikiArticles = usePlotStore((s) => s.mergeWikiArticles)

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showPreview, setShowPreview] = useState(false)

  // Final step state
  const [mergeTitle, setMergeTitle] = useState("")
  const [mergeMode, setMergeMode] = useState<"new" | "existing">("existing")
  const [survivorId, setSurvivorId] = useState<string | null>(null)
  const [mergeStatus, setMergeStatus] = useState<WikiStatus>("article")

  // Category state
  const [categories, setCategories] = useState<string[]>([])
  const [newCategory, setNewCategory] = useState("")

  // Dropdown open states
  const [titleDropdownOpen, setTitleDropdownOpen] = useState(false)
  const [survivorDropdownOpen, setSurvivorDropdownOpen] = useState(false)
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)
  const [newCategoryInputValue, setNewCategoryInputValue] = useState("")

  // Dropdown refs for click-outside
  const titleDropdownRef = useRef<HTMLDivElement>(null)
  const survivorDropdownRef = useRef<HTMLDivElement>(null)
  const categoryDropdownRef = useRef<HTMLDivElement>(null)
  const newCategoryInputRef = useRef<HTMLInputElement>(null)

  // Click-outside handlers
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (titleDropdownRef.current && !titleDropdownRef.current.contains(e.target as Node)) {
        setTitleDropdownOpen(false)
      }
    }
    if (titleDropdownOpen) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [titleDropdownOpen])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (survivorDropdownRef.current && !survivorDropdownRef.current.contains(e.target as Node)) {
        setSurvivorDropdownOpen(false)
      }
    }
    if (survivorDropdownOpen) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [survivorDropdownOpen])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setCategoryDropdownOpen(false)
        setShowNewCategoryInput(false)
        setNewCategoryInputValue("")
      }
    }
    if (categoryDropdownOpen) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [categoryDropdownOpen])

  // Focus new category input when shown
  useEffect(() => {
    if (showNewCategoryInput && newCategoryInputRef.current) {
      newCategoryInputRef.current.focus()
    }
  }, [showNewCategoryInput])

  // Note title map for note-ref blocks
  const noteTitleMap = useMemo(() => {
    const map = new Map<string, string>()
    notes.forEach((n) => map.set(n.id, n.title))
    return map
  }, [notes])

  // All existing category names across all articles (for dropdown)
  const allCategoryNames = useMemo(() => {
    const set = new Set<string>()
    wikiArticles.forEach(a => (a.tags ?? []).forEach(t => set.add(t)))
    return Array.from(set).sort()
  }, [wikiArticles])

  const filteredArticles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return wikiArticles.filter(
      (a) => q.length === 0 || a.title.toLowerCase().includes(q),
    )
  }, [wikiArticles, searchQuery])

  const selectedArticles = useMemo(
    () => selectedIds.map((id) => wikiArticles.find((a) => a.id === id)).filter(Boolean) as WikiArticle[],
    [selectedIds, wikiArticles],
  )

  // When selection changes, update derived state
  const toggleArticle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      // Auto-set title from first selected
      if (next.length > 0 && !prev.includes(id)) {
        const first = wikiArticles.find((a) => a.id === next[0])
        if (first && prev.length === 0) {
          setMergeTitle(first.title)
          setSurvivorId(first.id)
        }
      }
      // Aggregate categories
      const arts = next.map((nid) => wikiArticles.find((a) => a.id === nid)).filter(Boolean) as WikiArticle[]
      const allCats = new Set<string>()
      arts.forEach((a) => (a.categoryIds ?? []).forEach((c) => allCats.add(c)))
      setCategories(Array.from(allCats))
      return next
    })
  }, [wikiArticles])

  const removeSelected = useCallback((id: string) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id))
  }, [])

  const moveSelected = useCallback((fromIdx: number, toIdx: number) => {
    setSelectedIds((prev) => {
      const next = [...prev]
      const [moved] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, moved)
      return next
    })
  }, [])

  const handleMerge = () => {
    if (selectedIds.length < 2) return

    if (mergeMode === "existing" && survivorId) {
      // Merge all others into survivor sequentially
      const othersIds = selectedIds.filter((id) => id !== survivorId)
      for (const otherId of othersIds) {
        mergeWikiArticles(survivorId, otherId, { title: mergeTitle, status: mergeStatus })
      }
      toast.success(`Merged ${othersIds.length} article${othersIds.length > 1 ? "s" : ""} into "${mergeTitle}"`)
      navigateToWikiArticle(survivorId)
    } else {
      // "New Article" mode: merge into the first, rename
      const [primaryId, ...rest] = selectedIds
      for (const otherId of rest) {
        mergeWikiArticles(primaryId, otherId, { title: mergeTitle, status: mergeStatus })
      }
      toast.success(`Created merged article "${mergeTitle}"`)
      navigateToWikiArticle(primaryId)
    }
    setWikiViewMode("list")
  }

  const addCategory = () => {
    const c = newCategory.trim()
    if (c && !categories.includes(c)) {
      setCategories((prev) => [...prev, c])
    }
    setNewCategory("")
  }

  const confirmNewCategory = () => {
    const val = newCategoryInputValue.trim()
    if (val && !categories.includes(val)) {
      setCategories(prev => [...prev, val])
    }
    setNewCategoryInputValue("")
    setShowNewCategoryInput(false)
    setCategoryDropdownOpen(false)
  }

  // Determine title dropdown display value
  const titleIsCustom = !selectedArticles.some(a => a.title === mergeTitle)
  const titleDropdownLabel = titleIsCustom ? "Custom title…" : (mergeTitle || "Select title…")

  // Survivor label
  const survivorLabel = selectedArticles.find(a => a.id === survivorId)?.title ?? "Select survivor"

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-white/[0.06] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
            <GitMerge size={16} className="text-white/70" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white/90">Merge Articles</h2>
            <p className="text-2xs text-white/40">Select articles to combine into one</p>
          </div>
          <div className="ml-auto">
            <button
              onClick={() => setWikiViewMode("list")}
              className="rounded-md px-3 py-1.5 text-xs text-white/50 transition-colors hover:bg-white/5 hover:text-white/70"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex min-h-0 flex-1">
        {/* Left: Source Panel */}
        <div className="flex w-1/2 flex-col border-r border-white/[0.06]">
          <div className="shrink-0 px-4 pt-4 pb-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter articles…"
                className="h-8 w-full rounded-md border border-white/[0.08] bg-white/[0.03] pl-8 pr-3 text-xs text-white/90 placeholder:text-white/30 focus:border-white/20 focus:outline-none"
              />
            </div>
            <p className="mt-2 text-2xs text-white/30">
              {filteredArticles.length} article{filteredArticles.length !== 1 ? "s" : ""} · {selectedIds.length} selected
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-4">
            {filteredArticles.map((a) => {
              const isSelected = selectedIds.includes(a.id)
              return (
                <button
                  key={a.id}
                  onClick={() => toggleArticle(a.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-all duration-100",
                    isSelected
                      ? "bg-accent/10 ring-1 ring-accent/25"
                      : "hover:bg-white/[0.04]",
                  )}
                >
                  {/* Checkbox */}
                  <div
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                      isSelected
                        ? "border-accent bg-accent"
                        : "border-white/20",
                    )}
                  >
                    {isSelected && <Check size={10} className="text-white" />}
                  </div>

                  {/* Status badge */}
                  <WikiStatusBadge status={a.wikiStatus} />

                  {/* Title + block count */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-white/85">{a.title}</p>
                  </div>
                  <span className="shrink-0 text-2xs tabular-nums text-white/30">
                    {a.blocks.length} blocks
                  </span>
                </button>
              )
            })}
            {filteredArticles.length === 0 && (
              <p className="py-8 text-center text-xs text-white/25">No articles found</p>
            )}
          </div>
        </div>

        {/* Right: Selected Panel + Preview */}
        <div className="flex w-1/2 flex-col">
          {/* Selected articles */}
          <div className="shrink-0 border-b border-white/[0.06] px-4 pt-4 pb-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-medium text-white/50 uppercase tracking-wider">Selected ({selectedIds.length})</h3>
              {selectedIds.length >= 2 && (
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-2xs text-accent transition-colors hover:bg-accent/10"
                >
                  {showPreview ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  {showPreview ? "Hide Preview" : "Preview Merge"}
                </button>
              )}
            </div>

            {selectedArticles.length === 0 ? (
              <p className="py-6 text-center text-xs text-white/20">
                Select articles from the left panel
              </p>
            ) : (
              <div className="max-h-[200px] space-y-1 overflow-y-auto">
                {selectedArticles.map((a, idx) => (
                  <div
                    key={a.id}
                    className="group flex items-center gap-2 rounded-md bg-white/[0.04] px-2.5 py-1.5"
                  >
                    <GripVertical size={12} className="shrink-0 cursor-grab text-white/20" />
                    <span className="text-2xs tabular-nums text-white/25 w-4 text-center">{idx + 1}</span>
                    <WikiStatusBadge status={a.wikiStatus} />
                    <span className="min-w-0 flex-1 truncate text-xs text-white/80">{a.title}</span>
                    <span className="shrink-0 text-2xs text-white/25">{a.blocks.length}</span>
                    {/* Move up/down */}
                    {idx > 0 && (
                      <button
                        onClick={() => moveSelected(idx, idx - 1)}
                        className="rounded p-0.5 text-white/20 opacity-0 transition-opacity hover:bg-white/5 hover:text-white/50 group-hover:opacity-100"
                        title="Move up"
                      >
                        <ChevronRight size={12} className="-rotate-90" />
                      </button>
                    )}
                    {idx < selectedArticles.length - 1 && (
                      <button
                        onClick={() => moveSelected(idx, idx + 1)}
                        className="rounded p-0.5 text-white/20 opacity-0 transition-opacity hover:bg-white/5 hover:text-white/50 group-hover:opacity-100"
                        title="Move down"
                      >
                        <ChevronRight size={12} className="rotate-90" />
                      </button>
                    )}
                    <button
                      onClick={() => removeSelected(a.id)}
                      className="rounded p-0.5 text-white/20 opacity-0 transition-opacity hover:bg-white/5 hover:text-destructive group-hover:opacity-100"
                      title="Remove"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Content Preview */}
          {showPreview && selectedArticles.length >= 2 && (
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <h3 className="mb-3 text-xs font-medium text-white/50 uppercase tracking-wider">Content Preview</h3>
              {selectedArticles.map((a, artIdx) => (
                <div key={a.id} className="mb-4">
                  {/* Source header */}
                  <div className="mb-1.5 flex items-center gap-2">
                    <Layers size={12} className="text-accent/60" />
                    <span className="text-2xs font-medium text-accent/80">{a.title}</span>
                    <span className="text-2xs text-white/20">{a.blocks.length} blocks</span>
                  </div>
                  {/* Blocks */}
                  <div className="ml-1 space-y-0.5 border-l border-white/[0.06] pl-3">
                    {a.blocks.map((block) => (
                      <div
                        key={block.id}
                        className="flex items-start gap-2 rounded px-2 py-1 text-2xs transition-colors hover:bg-white/[0.03]"
                      >
                        <span className="mt-0.5 shrink-0 rounded bg-white/[0.06] px-1 py-0.5 text-[9px] uppercase text-white/25">
                          {block.type}
                        </span>
                        <div className="min-w-0 flex-1">
                          <BlockContent block={block} noteTitleMap={noteTitleMap} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Separator */}
                  {artIdx < selectedArticles.length - 1 && (
                    <div className="my-3 border-t border-dashed border-white/[0.06]" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Empty state when no preview */}
          {!showPreview && selectedArticles.length >= 2 && (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <FileText size={32} className="mx-auto mb-2 text-white/10" />
                <p className="text-xs text-white/25">Click "Preview Merge" to see combined content</p>
              </div>
            </div>
          )}
          {selectedArticles.length < 2 && selectedArticles.length > 0 && (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-xs text-white/25">Select at least 2 articles to merge</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer — merge controls */}
      {selectedIds.length >= 2 && (
        <div className="shrink-0 border-t border-white/[0.06] bg-white/[0.02] px-6 py-4">
          <div className="flex flex-wrap items-start gap-4">
            {/* Title */}
            <div className="min-w-[200px] flex-1">
              <label className="mb-1 block text-2xs text-white/40">Title</label>
              {mergeMode === "existing" ? (
                /* Merge into existing: title is locked to survivor */
                <div className="flex h-8 items-center rounded-md border border-white/[0.08] bg-white/[0.02] px-3 text-xs text-white/50">
                  {selectedArticles.find(a => a.id === survivorId)?.title ?? "Select survivor"}
                </div>
              ) : (
                /* New Article: custom dropdown */
                <div className="space-y-1">
                  <div ref={titleDropdownRef} className="relative">
                    <button
                      onClick={() => setTitleDropdownOpen(!titleDropdownOpen)}
                      className="flex h-8 w-full items-center justify-between rounded-md border border-white/[0.08] bg-white/[0.03] px-3 text-xs text-white/80 hover:border-white/15 transition-colors"
                    >
                      <span className="truncate">{titleDropdownLabel}</span>
                      <ChevronDown size={12} className="ml-2 shrink-0 text-white/30" />
                    </button>
                    {titleDropdownOpen && (
                      <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-white/[0.08] bg-[#1a1a1a] py-1 shadow-xl">
                        {selectedArticles.map(a => (
                          <button
                            key={a.id}
                            onClick={() => { setMergeTitle(a.title); setTitleDropdownOpen(false) }}
                            className={cn(
                              "flex w-full items-center px-3 py-1.5 text-xs transition-colors",
                              mergeTitle === a.title && !titleIsCustom
                                ? "bg-white/10 text-white/90"
                                : "text-white/60 hover:bg-white/5 hover:text-white/80"
                            )}
                          >
                            {a.title}
                          </button>
                        ))}
                        <div className="my-1 border-t border-white/[0.06]" />
                        <button
                          onClick={() => { setMergeTitle(""); setTitleDropdownOpen(false) }}
                          className={cn(
                            "flex w-full items-center px-3 py-1.5 text-xs transition-colors",
                            titleIsCustom
                              ? "bg-white/10 text-white/90"
                              : "text-white/40 hover:bg-white/5 hover:text-white/60"
                          )}
                        >
                          Custom title…
                        </button>
                      </div>
                    )}
                  </div>
                  {titleIsCustom && (
                    <input
                      type="text"
                      value={mergeTitle}
                      onChange={(e) => setMergeTitle(e.target.value)}
                      placeholder="Enter custom title…"
                      autoFocus
                      className="h-8 w-full rounded-md border border-white/[0.08] bg-white/[0.03] px-3 text-xs text-white/90 placeholder:text-white/30 focus:border-white/20 focus:outline-none"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Mode */}
            <div>
              <label className="mb-1 block text-2xs text-white/40">Mode</label>
              <div className="flex gap-1 rounded-md bg-white/[0.04] p-0.5">
                <button
                  onClick={() => setMergeMode("existing")}
                  className={cn(
                    "rounded px-2.5 py-1 text-2xs font-medium transition-colors",
                    mergeMode === "existing"
                      ? "bg-white/10 text-white/90"
                      : "text-white/40 hover:text-white/60",
                  )}
                >
                  Merge into existing
                </button>
                <button
                  onClick={() => setMergeMode("new")}
                  className={cn(
                    "rounded px-2.5 py-1 text-2xs font-medium transition-colors",
                    mergeMode === "new"
                      ? "bg-white/10 text-white/90"
                      : "text-white/40 hover:text-white/60",
                  )}
                >
                  New Article
                </button>
              </div>
            </div>

            {/* Survivor (only for "existing" mode) */}
            {mergeMode === "existing" && (
              <div className="min-w-[160px]">
                <label className="mb-1 block text-2xs text-white/40">Survives</label>
                <div ref={survivorDropdownRef} className="relative">
                  <button
                    onClick={() => setSurvivorDropdownOpen(!survivorDropdownOpen)}
                    className="flex h-8 w-full items-center justify-between rounded-md border border-white/[0.08] bg-white/[0.03] px-3 text-xs text-white/80 hover:border-white/15 transition-colors"
                  >
                    <span className="truncate">{survivorLabel}</span>
                    <ChevronDown size={12} className="ml-2 shrink-0 text-white/30" />
                  </button>
                  {survivorDropdownOpen && (
                    <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-white/[0.08] bg-[#1a1a1a] py-1 shadow-xl">
                      {selectedArticles.map(a => (
                        <button
                          key={a.id}
                          onClick={() => { setSurvivorId(a.id); setMergeTitle(a.title); setSurvivorDropdownOpen(false) }}
                          className={cn(
                            "flex w-full items-center px-3 py-1.5 text-xs transition-colors",
                            survivorId === a.id
                              ? "bg-white/10 text-white/90"
                              : "text-white/60 hover:bg-white/5 hover:text-white/80"
                          )}
                        >
                          {a.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Status */}
            <div>
              <label className="mb-1 block text-2xs text-white/40">Status</label>
              <div className="flex gap-1 rounded-md bg-white/[0.04] p-0.5">
                <button
                  onClick={() => setMergeStatus("stub")}
                  className={cn(
                    "rounded px-2.5 py-1 text-2xs font-medium transition-colors",
                    mergeStatus === "stub"
                      ? "bg-chart-3/20 text-chart-3"
                      : "text-white/40 hover:text-white/60",
                  )}
                >
                  Stub
                </button>
                <button
                  onClick={() => setMergeStatus("article")}
                  className={cn(
                    "rounded px-2.5 py-1 text-2xs font-medium transition-colors",
                    mergeStatus === "article"
                      ? "bg-wiki-complete/20 text-wiki-complete"
                      : "text-white/40 hover:text-white/60",
                  )}
                >
                  Article
                </button>
              </div>
            </div>

            {/* Categories */}
            <div className="min-w-[200px] flex-1">
              <label className="mb-1 block text-2xs text-white/40">Categories</label>
              <div className="flex flex-wrap items-center gap-1.5">
                {categories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-2xs text-accent"
                  >
                    {cat}
                    <button onClick={() => setCategories(prev => prev.filter(c => c !== cat))} className="hover:text-accent/60">
                      <X size={10} />
                    </button>
                  </span>
                ))}
                {/* Custom category dropdown */}
                <div ref={categoryDropdownRef} className="relative">
                  <button
                    onClick={() => { setCategoryDropdownOpen(!categoryDropdownOpen); setShowNewCategoryInput(false); setNewCategoryInputValue("") }}
                    className="flex h-6 items-center gap-1 rounded border border-white/[0.08] bg-white/[0.03] px-1.5 text-2xs text-white/50 hover:border-white/15 hover:text-white/70 transition-colors"
                  >
                    <Plus size={10} />
                    Add
                  </button>
                  {categoryDropdownOpen && (
                    <div className="absolute left-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-white/[0.08] bg-[#1a1a1a] py-1 shadow-xl">
                      {showNewCategoryInput ? (
                        <div className="px-2 py-1">
                          <input
                            ref={newCategoryInputRef}
                            type="text"
                            value={newCategoryInputValue}
                            onChange={(e) => setNewCategoryInputValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") confirmNewCategory()
                              if (e.key === "Escape") { setShowNewCategoryInput(false); setNewCategoryInputValue("") }
                            }}
                            placeholder="Category name…"
                            className="h-7 w-full rounded border border-white/[0.12] bg-white/[0.06] px-2 text-2xs text-white/90 placeholder:text-white/30 focus:border-white/20 focus:outline-none"
                          />
                          <div className="mt-1 flex gap-1">
                            <button
                              onClick={confirmNewCategory}
                              className="flex-1 rounded bg-white/[0.08] py-1 text-2xs text-white/70 hover:bg-white/[0.12] transition-colors"
                            >
                              Add
                            </button>
                            <button
                              onClick={() => { setShowNewCategoryInput(false); setNewCategoryInputValue("") }}
                              className="flex-1 rounded py-1 text-2xs text-white/40 hover:bg-white/5 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {allCategoryNames.filter(c => !categories.includes(c)).length === 0 && (
                            <p className="px-3 py-1.5 text-2xs text-white/25">No existing categories</p>
                          )}
                          {allCategoryNames
                            .filter(c => !categories.includes(c))
                            .map(c => (
                              <button
                                key={c}
                                onClick={() => { setCategories(prev => [...prev, c]); setCategoryDropdownOpen(false) }}
                                className="flex w-full items-center px-3 py-1.5 text-2xs text-white/60 transition-colors hover:bg-white/5 hover:text-white/80"
                              >
                                {c}
                              </button>
                            ))
                          }
                          {allCategoryNames.filter(c => !categories.includes(c)).length > 0 && (
                            <div className="my-1 border-t border-white/[0.06]" />
                          )}
                          <button
                            onClick={() => setShowNewCategoryInput(true)}
                            className="flex w-full items-center gap-1.5 px-3 py-1.5 text-2xs text-white/40 transition-colors hover:bg-white/5 hover:text-white/60"
                          >
                            <Plus size={10} />
                            New category…
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={handleMerge}
              disabled={!mergeTitle.trim()}
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <GitMerge size={14} />
              Merge {selectedIds.length} Articles
            </button>
            <button
              onClick={() => setWikiViewMode("list")}
              className="rounded-md px-3 py-1.5 text-xs text-white/50 transition-colors hover:bg-white/5 hover:text-white/70"
            >
              Cancel
            </button>
            <p className="text-2xs text-white/30">
              {mergeMode === "existing"
                ? `${selectedIds.length - 1} article${selectedIds.length - 1 > 1 ? "s" : ""} will be absorbed into "${selectedArticles.find((a) => a.id === survivorId)?.title ?? mergeTitle}"`
                : `All ${selectedIds.length} articles will be combined into a new article`}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
