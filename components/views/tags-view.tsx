"use client"

import { useState, useMemo, useRef, useCallback, useEffect } from "react"
import { usePlotStore } from "@/lib/store"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr/ArrowLeft"
import { ArrowUp } from "@phosphor-icons/react/dist/ssr/ArrowUp"
import { ArrowDown } from "@phosphor-icons/react/dist/ssr/ArrowDown"
import { ArrowsDownUp } from "@phosphor-icons/react/dist/ssr/ArrowsDownUp"
import { Hash as PhHash } from "@phosphor-icons/react/dist/ssr/Hash"
import { Tag as PhTag } from "@phosphor-icons/react/dist/ssr/Tag"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { Lightning } from "@phosphor-icons/react/dist/ssr/Lightning"
import { SlidersHorizontal } from "@phosphor-icons/react/dist/ssr/SlidersHorizontal"
import { Stack } from "@phosphor-icons/react/dist/ssr/Stack"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"
import { EyeSlash } from "@phosphor-icons/react/dist/ssr/EyeSlash"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { ViewHeader } from "@/components/view-header"
import { useNotesView } from "@/lib/view-engine/use-notes-view"
import { FilterButton, FilterChipBar } from "@/components/filter-bar"
import type { SortField, FilterRule, GroupBy } from "@/lib/view-engine/types"

/* ── Sort/Group options for detail view ─────────────────── */

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "updatedAt", label: "Updated" },
  { value: "createdAt", label: "Created" },
  { value: "title", label: "Title" },
  { value: "status", label: "Status" },
  { value: "priority", label: "Priority" },
  { value: "links", label: "Links" },
]

const GROUP_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: "none", label: "No grouping" },
  { value: "status", label: "Status" },
  { value: "priority", label: "Priority" },
  { value: "folder", label: "Folder" },
  { value: "label", label: "Label" },
]

/* ── Inline Select (portal-free, works inside Popover) ── */

function InlineSelect<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  const current = options.find((o) => o.value === value)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-md bg-secondary/60 px-2.5 py-1.5 text-sm text-foreground transition-colors hover:bg-secondary"
      >
        {current?.label ?? value}
        <CaretDown className={`text-muted-foreground transition-transform duration-150 ${open ? "rotate-180" : ""}`} size={14} weight="regular" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-md border border-border bg-popover py-1 shadow-md animate-in fade-in-0 zoom-in-95 duration-200">
          {options.map((opt) => {
            const active = opt.value === value
            return (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <PhCheck className={`shrink-0 ${active ? "text-accent opacity-100" : "opacity-0"}`} size={14} weight="bold" />
                {opt.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

const ROW_HEIGHT = 40 // py-2.5 ≈ 40px
const HEADER_HEIGHT = 37 // the header row height
const DRAG_THRESHOLD = 5

export function TagsView() {
  const tags = usePlotStore((s) => s.tags)
  const labels = usePlotStore((s) => s.labels)
  const notes = usePlotStore((s) => s.notes)
  const folders = usePlotStore((s) => s.folders)
  const createTag = usePlotStore((s) => s.createTag)
  const deleteTag = usePlotStore((s) => s.deleteTag)
  const openNote = usePlotStore((s) => s.openNote)

  // View state
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [checkedTags, setCheckedTags] = useState<Set<string>>(new Set())
  const tagInputRef = useRef<HTMLInputElement>(null)
  const [displayPopoverOpen, setDisplayPopoverOpen] = useState(false)
  const [tagSortBy, setTagSortBy] = useState<"name-asc" | "name-desc" | "count-desc" | "count-asc">("name-asc")
  const [hideEmptyTags, setHideEmptyTags] = useState(false)

  // View engine for tag detail mode (must be called unconditionally)
  const tagExtras = useMemo(() => ({ tagId: selectedTagId ?? undefined }), [selectedTagId])
  const { flatNotes: tagNotes, flatCount: tagNoteCount, viewState: tagViewState, updateViewState: updateTagView } = useNotesView("tag", tagExtras)

  // Toggle filter for tag detail
  const toggleFilter = useCallback((field: FilterRule["field"], value: string, operator?: FilterRule["operator"]) => {
    const op = operator ?? "eq"
    const exists = tagViewState.filters.some(f => f.field === field && f.operator === op && f.value === value)
    if (exists) {
      updateTagView({ filters: tagViewState.filters.filter(f => !(f.field === field && f.operator === op && f.value === value)) })
    } else {
      updateTagView({ filters: [...tagViewState.filters, { field, operator: op, value }] })
    }
  }, [tagViewState.filters, updateTagView])

  const removeFilter = useCallback((idx: number) => {
    updateTagView({ filters: tagViewState.filters.filter((_, i) => i !== idx) })
  }, [tagViewState.filters, updateTagView])

  // Drag-to-select state
  const lastClickedRef = useRef<number | null>(null)
  const [dragRect, setDragRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const dragStartRef = useRef<{ x: number; y: number; scrollTop: number } | null>(null)
  const isDraggingRef = useRef(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Active (non-trashed, non-archived) notes only
  const activeNotes = useMemo(
    () => notes.filter((n) => !n.trashed),
    [notes],
  )

  // PhTag note counts
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const tag of tags) {
      counts[tag.id] = activeNotes.filter((n) =>
        n.tags.includes(tag.id),
      ).length
    }
    return counts
  }, [tags, activeNotes])

  // Filtered tags (by search, excluding trashed)
  const filteredTags = useMemo(() => {
    const activeTags = tags.filter((t) => !t.trashed)
    if (!searchQuery.trim()) return activeTags
    const q = searchQuery.toLowerCase()
    return activeTags.filter((t) => t.name.toLowerCase().includes(q))
  }, [tags, searchQuery])

  // Sort and filter tags
  const sortedTags = useMemo(() => {
    let result = [...filteredTags]
    if (hideEmptyTags) {
      result = result.filter(t => (tagCounts[t.id] || 0) > 0)
    }
    switch (tagSortBy) {
      case "name-asc": return result.sort((a, b) => a.name.localeCompare(b.name))
      case "name-desc": return result.sort((a, b) => b.name.localeCompare(a.name))
      case "count-desc": return result.sort((a, b) => (tagCounts[b.id] || 0) - (tagCounts[a.id] || 0))
      case "count-asc": return result.sort((a, b) => (tagCounts[a.id] || 0) - (tagCounts[b.id] || 0))
      default: return result
    }
  }, [filteredTags, tagSortBy, hideEmptyTags, tagCounts])

  const selectedTag = tags.find((t) => t.id === selectedTagId)

  // Handle tag input: parse #tag1 #tag2 format
  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault()
      // Parse input: split by commas, each part can optionally start with #
      const names = tagInput
        .split(/,/)
        .map((s) => s.replace(/^#+/, "").trim())
        .filter((s) => s.length > 0)

      for (const name of names) {
        // PhCheck if tag already exists (case-insensitive)
        const exists = tags.some(
          (t) => t.name.toLowerCase() === name.toLowerCase(),
        )
        if (!exists) {
          createTag(name, "#6b7280")
        }
      }
      setTagInput("")
    } else if (e.key === "Escape") {
      setTagInput("")
      tagInputRef.current?.blur()
    }
  }

  // Delete checked tags
  const handleDeleteChecked = () => {
    for (const id of checkedTags) {
      deleteTag(id)
    }
    setCheckedTags(new Set())
  }

  // Toggle check
  const toggleCheck = useCallback((tagId: string) => {
    setCheckedTags((prev) => {
      const next = new Set(prev)
      if (next.has(tagId)) next.delete(tagId)
      else next.add(tagId)
      return next
    })
  }, [])

  // Toggle all
  const toggleAll = () => {
    if (checkedTags.size === sortedTags.length) {
      setCheckedTags(new Set())
    } else {
      setCheckedTags(new Set(sortedTags.map((t) => t.id)))
    }
  }

  // Row click handler for shift/ctrl modifiers
  const handleRowClick = useCallback((tagId: string, rowIndex: number, e: React.MouseEvent) => {
    if (e.shiftKey && lastClickedRef.current !== null) {
      const start = Math.min(lastClickedRef.current, rowIndex)
      const end = Math.max(lastClickedRef.current, rowIndex)
      const rangeIds = sortedTags.slice(start, end + 1).map((t) => t.id)
      setCheckedTags(new Set(rangeIds))
      e.preventDefault()
      return
    }
    if (e.metaKey || e.ctrlKey) {
      setCheckedTags((prev) => {
        const next = new Set(prev)
        if (next.has(tagId)) next.delete(tagId)
        else next.add(tagId)
        return next
      })
      lastClickedRef.current = rowIndex
      e.preventDefault()
      return
    }
    // Normal click on row background — toggle check
    toggleCheck(tagId)
    lastClickedRef.current = rowIndex
  }, [sortedTags, toggleCheck])

  // Drag-to-select: mousedown on scroll container
  const handleDragMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Ignore clicks on interactive elements
    if ((e.target as HTMLElement).closest("button, input, a")) return
    // Only left button
    if (e.button !== 0) return

    const container = scrollContainerRef.current
    if (!container) return

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollTop: container.scrollTop,
    }
    isDraggingRef.current = false
  }, [])

  // Drag-to-select: document-level mousemove/mouseup
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return
      const container = scrollContainerRef.current
      if (!container) return

      const dx = e.clientX - dragStartRef.current.x
      const dy = e.clientY - dragStartRef.current.y

      if (!isDraggingRef.current && Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return
      isDraggingRef.current = true

      const containerRect = container.getBoundingClientRect()
      const scrollTop = container.scrollTop

      const startY = dragStartRef.current.y - containerRect.top + dragStartRef.current.scrollTop
      const currentY = e.clientY - containerRect.top + scrollTop

      const startX = dragStartRef.current.x - containerRect.left
      const currentX = e.clientX - containerRect.left

      const rectTop = Math.min(startY, currentY)
      const rectBottom = Math.max(startY, currentY)
      const rectLeft = Math.min(startX, currentX)
      const rectRight = Math.max(startX, currentX)

      setDragRect({
        x: rectLeft,
        y: rectTop,
        w: rectRight - rectLeft,
        h: rectBottom - rectTop,
      })

      // Calculate intersecting rows
      const adjustedTop = rectTop - HEADER_HEIGHT
      const adjustedBottom = rectBottom - HEADER_HEIGHT

      const matchedIds = new Set<string>()
      for (let i = 0; i < sortedTags.length; i++) {
        const rowTop = i * ROW_HEIGHT
        const rowBottom = rowTop + ROW_HEIGHT
        if (rowBottom > adjustedTop && rowTop < adjustedBottom) {
          matchedIds.add(sortedTags[i].id)
        }
      }
      setCheckedTags(matchedIds)
    }

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        setDragRect(null)
      }
      dragStartRef.current = null
      isDraggingRef.current = false
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [sortedTags])

  // Keyboard handlers: ESC to clear, Ctrl+A to select all
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && checkedTags.size > 0) {
        setCheckedTags(new Set())
        e.preventDefault()
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "a" && sortedTags.length > 0) {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
        if (tag === "input" || tag === "textarea") return
        setCheckedTags(new Set(sortedTags.map((t) => t.id)))
        e.preventDefault()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [checkedTags.size, sortedTags])

  // Format relative time
  const formatRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}d`
    return new Date(dateStr).toLocaleDateString("en", {
      month: "short",
      day: "numeric",
    })
  }

  // ── PhTag Detail Mode ──
  if (selectedTagId && selectedTag) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-6 py-4">
          <button
            onClick={() => setSelectedTagId(null)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ArrowLeft size={16} weight="regular" />
          </button>
          <h1 className="text-ui font-semibold text-foreground">
            #{selectedTag.name}
          </h1>
          <span className="text-sm text-muted-foreground">
            {tagNoteCount} notes
          </span>
          <div className="flex-1" />
          <button
            onClick={() => {
              deleteTag(selectedTagId)
              setSelectedTagId(null)
            }}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm text-red-400 transition-colors hover:bg-red-400/10"
          >
            <Trash size={14} weight="regular" />
            Delete tag
          </button>
        </div>

        {/* Toolbar: Filter + Display */}
        <div className="flex items-center gap-2 border-b border-border px-5 py-1.5">
          <FilterButton
            filters={tagViewState.filters}
            groupBy={tagViewState.groupBy}
            isSingleStatusTab={false}
            folders={folders}
            tags={tags}
            labels={labels}
            onToggleFilter={toggleFilter}
            onSetFilters={(f) => updateTagView({ filters: f })}
          />
          <div className="flex-1" />
          <Popover open={displayPopoverOpen} onOpenChange={setDisplayPopoverOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                <SlidersHorizontal size={16} weight="regular" />
                Display
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0" align="end">
              {/* Grouping */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <Stack className="text-muted-foreground" size={16} weight="regular" />
                  <span className="text-ui text-foreground">Grouping</span>
                </div>
                <InlineSelect
                  value={tagViewState.groupBy}
                  options={GROUP_OPTIONS}
                  onChange={(v) => updateTagView({ groupBy: v })}
                />
              </div>
              {/* Ordering */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <ArrowsDownUp className="text-muted-foreground" size={16} weight="regular" />
                  <span className="text-ui text-foreground">Ordering</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <InlineSelect
                    value={tagViewState.sortField}
                    options={SORT_OPTIONS}
                    onChange={(v) => updateTagView({ sortField: v })}
                  />
                  <button
                    onClick={() => updateTagView({ sortDirection: tagViewState.sortDirection === "asc" ? "desc" : "asc" })}
                    className="flex items-center justify-center rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    {tagViewState.sortDirection === "asc"
                      ? <ArrowUp size={14} weight="regular" />
                      : <ArrowDown size={14} weight="regular" />
                    }
                  </button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Filter chips */}
        <FilterChipBar
          filters={tagViewState.filters}
          groupBy={tagViewState.groupBy}
          isSingleStatusTab={false}
          folders={folders}
          tags={tags}
          labels={labels}
          onToggleFilter={toggleFilter}
          onRemoveFilter={removeFilter}
          onClearAll={() => updateTagView({ filters: [] })}
          onSetFilters={(f) => updateTagView({ filters: f })}
        />

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto">
          {tagNotes.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              No notes with this tag
            </div>
          ) : (
            <div className="divide-y divide-border">
              {tagNotes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => openNote(note.id)}
                  className="flex w-full items-center gap-4 px-6 py-3 text-left transition-colors hover:bg-secondary/50"
                >
                  <span className="flex-1 truncate text-ui text-foreground">
                    {note.title || "Untitled"}
                  </span>
                  <span className="text-sm capitalize text-muted-foreground">
                    {note.status}
                  </span>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {formatRelativeTime(note.updatedAt)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── PhTag List Mode ──
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ViewHeader
        icon={<PhTag size={20} weight="regular" />}
        title="Tags"
        count={filteredTags.length}
        searchPlaceholder="Search tags..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        actions={
          <div className="relative flex items-center">
            <PhHash className="pointer-events-none absolute left-2.5 text-muted-foreground" size={14} weight="regular" />
            <input
              ref={tagInputRef}
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              placeholder="tag1, tag2, tag3"
              className="h-8 w-56 rounded-md border border-border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        }
      />

      {/* Sort & Filter toolbar */}
      <div className="flex items-center gap-2 border-b border-border px-5 py-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <ArrowsDownUp size={14} weight="regular" />
              {tagSortBy === "name-asc" ? "Name A-Z" : tagSortBy === "name-desc" ? "Name Z-A" : tagSortBy === "count-desc" ? "Most notes" : "Fewest notes"}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {([
              ["name-asc", "Name A-Z"],
              ["name-desc", "Name Z-A"],
              ["count-desc", "Most notes"],
              ["count-asc", "Fewest notes"],
            ] as const).map(([value, label]) => (
              <DropdownMenuItem key={value} onClick={() => setTagSortBy(value)}>
                <PhCheck className={cn(" mr-2 shrink-0", tagSortBy === value ? "opacity-100" : "opacity-0")} size={14} weight="bold" />
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex-1" />
        <button
          onClick={() => setHideEmptyTags(!hideEmptyTags)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors",
            hideEmptyTags ? "bg-accent/15 text-accent" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          <EyeSlash size={14} weight="regular" />
          Hide empty
        </button>
      </div>

      {/* PhTag list */}
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            ref={scrollContainerRef}
            className={`relative flex-1 overflow-y-auto ${isDraggingRef.current ? "select-none" : ""} ${checkedTags.size > 0 ? "pb-20" : ""}`}
            onMouseDown={handleDragMouseDown}
          >
            {sortedTags.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {searchQuery ? "No tags match your search" : "No tags yet"}
                </span>
                {!searchQuery && (
                  <span className="text-xs text-muted-foreground">
                    Type #tagname above and press Enter to create
                  </span>
                )}
              </div>
            ) : (
              <div>
                {/* Header row with select-all checkbox */}
                <div className="flex items-center gap-3 border-b border-border px-6 py-2 text-sm font-medium text-muted-foreground">
                  <button
                    onClick={toggleAll}
                    className="flex h-4 w-4 items-center justify-center rounded border border-border transition-colors hover:border-foreground/50"
                  >
                    {checkedTags.size === sortedTags.length &&
                      sortedTags.length > 0 && (
                        <div className="h-2 w-2 rounded-sm bg-accent" />
                      )}
                  </button>
                  <span className="flex-1">Name</span>
                  <span className="w-16 text-right">Notes</span>
                </div>
                {sortedTags.map((tag, index) => (
                  <div
                    key={tag.id}
                    data-tag-index={index}
                    className={`group flex items-center gap-3 px-6 py-2.5 transition-colors ${
                      checkedTags.has(tag.id) ? "bg-accent/10" : "hover:bg-secondary/50"
                    }`}
                    onClick={(e) => {
                      // Only handle if click is on the row background (not buttons)
                      if ((e.target as HTMLElement).closest("button")) return
                      handleRowClick(tag.id, index, e)
                    }}
                  >
                    <button
                      onClick={() => toggleCheck(tag.id)}
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-border transition-colors hover:border-foreground/50"
                    >
                      {checkedTags.has(tag.id) && (
                        <div className="h-2 w-2 rounded-sm bg-accent" />
                      )}
                    </button>
                    <button
                      onClick={() => setSelectedTagId(tag.id)}
                      className="flex-1 text-left text-ui text-foreground transition-colors hover:text-accent"
                    >
                      <span className="text-muted-foreground">#</span>
                      {tag.name}
                    </button>
                    <span className="w-16 text-right text-sm tabular-nums text-muted-foreground">
                      {tagCounts[tag.id] || 0}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Drag selection rectangle */}
            {dragRect && (
              <div
                className="pointer-events-none absolute z-20 rounded border border-accent/50 bg-accent/10"
                style={{ left: dragRect.x, top: dragRect.y, width: dragRect.w, height: dragRect.h }}
              />
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem
            onClick={() => {
              setTimeout(() => tagInputRef.current?.focus(), 100)
            }}
            className="text-sm"
          >
            <PhPlus className="mr-2 text-muted-foreground" size={16} weight="regular" />
            New tag
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Floating action bar (bottom) */}
      {checkedTags.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-xl border border-border bg-card shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="flex items-center gap-1 px-4 py-2.5">
            <div className="flex items-center gap-1.5 px-1.5">
              <Lightning className="text-accent" size={16} weight="regular" />
              <span className="text-ui font-medium text-foreground whitespace-nowrap">
                {checkedTags.size} selected
              </span>
              <button
                onClick={() => setCheckedTags(new Set())}
                className="rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <PhX size={16} weight="regular" />
              </button>
            </div>
            <div className="mx-1.5 h-7 w-px bg-border" />
            <button
              onClick={handleDeleteChecked}
              className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-3 py-2 text-ui font-medium text-destructive transition-colors hover:bg-destructive/20"
            >
              <Trash size={16} weight="regular" /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
