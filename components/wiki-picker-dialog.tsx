"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { usePlotStore } from "@/lib/store"
import { formatDistanceToNow } from "date-fns"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BookOpen, X, Plus, CaretDown, Check, FolderOpen } from "@/lib/editor/editor-icons"

/* ── Filter Types ──────────────────────────────── */

interface FilterValue {
  value: string
  label: string
}

/* ── Chip label helper ─────────────────────────── */

function getChipSummary(values: FilterValue[], selected: Set<string>): string {
  const total = values.length
  const count = selected.size
  if (count === 0) return "None"
  if (count >= total) return "All"
  if (count <= 2) {
    return values
      .filter((v) => selected.has(v.value))
      .map((v) => v.label)
      .join(", ")
  }
  const deselectedCount = total - count
  if (deselectedCount === 1) {
    const deselected = values.find((v) => !selected.has(v.value))
    return `All except ${deselected?.label ?? "?"}`
  }
  return `${count} selected`
}

/* ── Props ─────────────────────────────────────── */

interface WikiPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  onSelect: (articleId: string) => void
}

/* ── Component ─────────────────────────────────── */

export function WikiPickerDialog({
  open,
  onOpenChange,
  title = "Select a wiki article",
  onSelect,
}: WikiPickerDialogProps) {
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const wikiCategories = usePlotStore((s) => s.wikiCategories)

  const [activeFilter, setActiveFilter] = useState<Set<string> | null>(null)
  const [search, setSearch] = useState("")

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setActiveFilter(null)
      setSearch("")
    }
  }, [open])

  // Build category filter values
  const categoryValues = useMemo<FilterValue[]>(() => {
    return [
      { value: "_none", label: "Uncategorized" },
      ...wikiCategories.map((c) => ({ value: c.id, label: c.name })),
    ]
  }, [wikiCategories])

  // Deduplicate by title (keep most recently updated)
  const deduped = useMemo(() => {
    const byTitle = new Map<string, (typeof wikiArticles)[0]>()
    for (const a of wikiArticles) {
      const key = a.title.toLowerCase()
      const existing = byTitle.get(key)
      if (!existing || new Date(a.updatedAt) > new Date(existing.updatedAt)) {
        byTitle.set(key, a)
      }
    }
    return [...byTitle.values()].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
  }, [wikiArticles])

  // Apply category filter
  const afterCategoryFilter = useMemo(() => {
    if (!activeFilter) return deduped
    return deduped.filter((a) => {
      if (!a.categoryIds?.length) return activeFilter.has("_none")
      return a.categoryIds.some((cid) => activeFilter.has(cid))
    })
  }, [deduped, activeFilter])

  // Apply text search
  const candidates = useMemo(() => {
    if (!search.trim()) return afterCategoryFilter
    const q = search.toLowerCase()
    return afterCategoryFilter.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.aliases.some((alias) => alias.toLowerCase().includes(q)),
    )
  }, [afterCategoryFilter, search])

  // Category name lookup
  const categoryMap = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of wikiCategories) m.set(c.id, c.name)
    return m
  }, [wikiCategories])

  const handleSelect = useCallback(
    (articleId: string) => {
      onSelect(articleId)
      onOpenChange(false)
    },
    [onSelect, onOpenChange],
  )

  // ── Filter handlers ──────────────────────────────

  const activateFilter = useCallback(() => {
    setActiveFilter(new Set(categoryValues.map((v) => v.value)))
  }, [categoryValues])

  const toggleValue = useCallback((value: string) => {
    setActiveFilter((prev) => {
      if (!prev) return prev
      const next = new Set(prev)
      if (next.has(value)) {
        next.delete(value)
      } else {
        next.add(value)
      }
      if (next.size === 0) return null
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setActiveFilter(new Set(categoryValues.map((v) => v.value)))
  }, [categoryValues])

  const clearFilter = useCallback(() => {
    setActiveFilter(null)
  }, [])

  // Custom cmdk filter
  const cmdkFilter = useCallback((value: string, search: string) => {
    const q = search.toLowerCase().trim()
    if (!q) return 1
    return value.toLowerCase().includes(q) ? 1 : 0
  }, [])

  const isFilterActive = activeFilter !== null

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Search and select a wiki article"
      showCloseButton={false}
      filter={cmdkFilter}
      className="sm:max-w-[960px]"
    >
      <CommandInput placeholder="Search wiki articles..." />

      {/* ── Chip-based filter bar ── */}
      <div
        className="flex items-center gap-1.5 border-b border-border px-3 py-1.5 overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {/* Active category chip */}
        {isFilterActive && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="shrink-0 inline-flex items-center gap-1 rounded-md border border-accent/25 bg-accent/5 px-1.5 py-0.5 text-2xs text-foreground transition-colors hover:bg-accent/10">
                <FolderOpen className="h-3 w-3 text-accent/70" />
                <span className="font-medium">Category:</span>
                <span className="max-w-[120px] truncate text-muted-foreground">
                  {getChipSummary(categoryValues, activeFilter)}
                </span>
                <CaretDown className="text-muted-foreground/50" size={10} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52" onCloseAutoFocus={(e) => e.preventDefault()}>
              {categoryValues.map(({ value, label }) => (
                <DropdownMenuItem
                  key={value}
                  onSelect={(e) => {
                    e.preventDefault()
                    toggleValue(value)
                  }}
                >
                  <Check
                    className={`shrink-0 ${activeFilter.has(value) ? "text-accent opacity-100" : "opacity-0"}`}
                    size={14}
                  />
                  <span className="text-note">{label}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <div className="flex items-center justify-between px-2 py-1">
                <button
                  onClick={selectAll}
                  className="text-2xs text-muted-foreground hover:text-foreground"
                >
                  Select all
                </button>
                <button
                  onClick={clearFilter}
                  className="text-2xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              </div>
            </DropdownMenuContent>
            {/* × remove chip */}
            <button
              onClick={clearFilter}
              className="shrink-0 -ml-0.5 rounded-sm p-0.5 text-muted-foreground/50 transition-colors hover:bg-hover-bg hover:text-foreground"
            >
              <X size={10} />
            </button>
          </DropdownMenu>
        )}

        {/* Add category filter button (when inactive) */}
        {!isFilterActive && (
          <button
            onClick={activateFilter}
            className="shrink-0 inline-flex items-center gap-1 rounded-md px-2 py-1 text-2xs font-medium text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
          >
            <Plus size={12} />
            Category
          </button>
        )}

        {/* Right side counter */}
        <div className="shrink-0 flex items-center gap-1.5 ml-auto">
          <span className="text-2xs tabular-nums text-muted-foreground/50">
            {candidates.length}/{deduped.length}
          </span>
          {isFilterActive && (
            <button
              onClick={clearFilter}
              className="text-2xs text-muted-foreground hover:text-foreground"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <CommandList className="max-h-[560px]">
        <CommandEmpty>
          <div className="flex flex-col items-center gap-1.5 py-2">
            <BookOpen className="text-muted-foreground/30" size={32} />
            <p className="text-note text-muted-foreground">No wiki articles found</p>
            {isFilterActive && (
              <button
                onClick={clearFilter}
                className="text-2xs text-accent hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </CommandEmpty>
        <CommandGroup>
          {candidates.map((article) => {
            const cats = (article.categoryIds ?? [])
              .map((cid) => categoryMap.get(cid))
              .filter(Boolean)

            return (
              <CommandItem
                key={article.id}
                value={`${article.title} ${article.aliases.join(" ")}`}
                onSelect={() => handleSelect(article.id)}
                className="flex items-center gap-3 px-3 py-2.5"
              >
                <BookOpen className="shrink-0 text-teal-500/60" size={16} />
                <div className="flex-1 min-w-0">
                  <span className="truncate text-note font-medium text-foreground block">
                    {article.title}
                  </span>
                  {article.aliases.length > 0 && (
                    <p className="truncate text-2xs text-muted-foreground/50 mt-0.5">
                      {article.aliases.join(", ")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {cats.length > 0 && (
                    <span className="text-2xs text-muted-foreground/50 max-w-[140px] truncate">
                      {cats.join(", ")}
                    </span>
                  )}
                  <span className="text-2xs tabular-nums text-muted-foreground/40">
                    {formatDistanceToNow(new Date(article.updatedAt), { addSuffix: true })}
                  </span>
                </div>
              </CommandItem>
            )
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
