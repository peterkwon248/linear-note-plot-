"use client"

import { useState, useMemo, useRef, useCallback, useEffect } from "react"
import { usePlotStore } from "@/lib/store"
import { pickColor } from "@/components/note-fields"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { ColorPickerGrid } from "@/components/color-picker-grid"
import { getEntityColor } from "@/lib/colors"
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
import { Minus } from "@phosphor-icons/react/dist/ssr/Minus"
import { EyeSlash } from "@phosphor-icons/react/dist/ssr/EyeSlash"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { IconTag } from "@/components/plot-icons"
import { ViewHeader } from "@/components/view-header"
import { useNotesView } from "@/lib/view-engine/use-notes-view"
import { useTagsView } from "@/lib/view-engine/use-tags-view"
import { FilterButton, FilterChipBar } from "@/components/filter-bar"
import { DisplayPanel } from "@/components/display-panel"
import { TAGS_LIST_VIEW_CONFIG } from "@/lib/view-engine/view-configs"
import { TagNoteCountChip } from "@/components/property-chips"
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
        className="flex items-center gap-1.5 rounded-md bg-secondary/60 px-2.5 py-1.5 text-note text-foreground transition-colors hover:bg-hover-bg"
      >
        {current?.label ?? value}
        <CaretDown className={`text-muted-foreground transition-transform duration-150 ${open ? "rotate-180" : ""}`} size={14} weight="regular" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-md border border-border bg-surface-overlay py-1 shadow-md animate-in fade-in-0 zoom-in-95 duration-200">
          {options.map((opt) => {
            const active = opt.value === value
            return (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-note transition-colors hover:bg-accent hover:text-accent-foreground ${
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
  const folders = usePlotStore((s) => s.folders)
  const createTag = usePlotStore((s) => s.createTag)
  const deleteTag = usePlotStore((s) => s.deleteTag)
  const updateTag = usePlotStore((s) => s.updateTag)
  const openNote = usePlotStore((s) => s.openNote)

  // View state
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState("")
  const [creatingTag, setCreatingTag] = useState(false)
  const [checkedTags, setCheckedTags] = useState<Set<string>>(new Set())
  const tagInputRef = useRef<HTMLInputElement>(null)

  // ── Tags-list view engine (entity index) ─────────────
  // useTagsView manages: search (via global searchQuery), sort, group.
  const {
    flatTags: sortedTags,
    flatCount,
    totalCount,
    viewState: tagsListViewState,
    updateViewState: updateTagsListView,
  } = useTagsView()

  // hideEmpty toggle — stored in viewState.toggles
  const hideEmpty = tagsListViewState.toggles?.hideEmpty ?? false

  // Apply hideEmpty filter on top of the view-engine result
  const visibleTags = useMemo(
    () => hideEmpty ? sortedTags.filter((t) => t.noteCount > 0) : sortedTags,
    [sortedTags, hideEmpty],
  )

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
        // Check if tag already exists (case-insensitive)
        const exists = tags.some(
          (t) => t.name.toLowerCase() === name.toLowerCase(),
        )
        if (!exists) {
          // v109: opt-in color — tag starts uncolored.
          createTag(name)
        }
      }
      setTagInput("")
      setCreatingTag(false)
    } else if (e.key === "Escape") {
      setTagInput("")
      setCreatingTag(false)
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
    if (checkedTags.size === visibleTags.length) {
      setCheckedTags(new Set())
    } else {
      setCheckedTags(new Set(visibleTags.map((t) => t.id)))
    }
  }

  // Row click handler for shift/ctrl modifiers
  const handleRowClick = useCallback((tagId: string, rowIndex: number, e: React.MouseEvent) => {
    if (e.shiftKey && lastClickedRef.current !== null) {
      const start = Math.min(lastClickedRef.current, rowIndex)
      const end = Math.max(lastClickedRef.current, rowIndex)
      const rangeIds = visibleTags.slice(start, end + 1).map((t) => t.id)
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
  }, [visibleTags, toggleCheck])

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
      for (let i = 0; i < visibleTags.length; i++) {
        const rowTop = i * ROW_HEIGHT
        const rowBottom = rowTop + ROW_HEIGHT
        if (rowBottom > adjustedTop && rowTop < adjustedBottom) {
          matchedIds.add(visibleTags[i].id)
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
  }, [visibleTags])

  // Keyboard handlers: ESC to clear, Ctrl+A to select all
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && checkedTags.size > 0) {
        setCheckedTags(new Set())
        e.preventDefault()
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "a" && visibleTags.length > 0) {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
        if (tag === "input" || tag === "textarea") return
        setCheckedTags(new Set(visibleTags.map((t) => t.id)))
        e.preventDefault()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [checkedTags.size, visibleTags])

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

  const isGridMode = tagsListViewState.viewMode === "grid"

  // Current sort indicator helpers (for list header columns)
  const currentSortField = tagsListViewState.sortFields[0]?.field ?? "name"
  const currentSortDir = tagsListViewState.sortFields[0]?.direction ?? "asc"

  const handleSortToggle = (field: "name" | "noteCount") => {
    const isCurrent = currentSortField === field || (field === "name" && currentSortField === "title")
    if (isCurrent) {
      // Toggle direction
      updateTagsListView({ sortFields: [{ field, direction: currentSortDir === "asc" ? "desc" : "asc" }] })
    } else {
      // Default direction per field
      const dir = field === "noteCount" ? "desc" : "asc"
      updateTagsListView({ sortFields: [{ field, direction: dir }] })
    }
  }

  // ── Tag Detail Mode ──
  if (selectedTagId && selectedTag) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-6 py-4">
          <button
            onClick={() => setSelectedTagId(null)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
          >
            <ArrowLeft size={16} weight="regular" />
          </button>
          <h1 className="text-ui font-semibold text-foreground">
            #{selectedTag.name}
          </h1>
          <span className="text-note text-muted-foreground">
            {tagNoteCount} notes
          </span>
          <div className="flex-1" />
          <button
            onClick={() => {
              deleteTag(selectedTagId)
              setSelectedTagId(null)
            }}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-note text-red-400 transition-colors hover:bg-red-400/10"
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
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-note text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground">
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
                    className="flex items-center justify-center rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
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
            <div className="flex h-32 items-center justify-center text-note text-muted-foreground">
              No notes with this tag
            </div>
          ) : (
            <div>
              {tagNotes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => openNote(note.id)}
                  className="flex w-full items-center gap-4 px-6 py-3 text-left transition-colors hover:bg-hover-bg"
                >
                  <span className="flex-1 truncate text-ui text-foreground">
                    {note.title || "Untitled"}
                  </span>
                  <span className="text-note capitalize text-muted-foreground">
                    {note.status}
                  </span>
                  <span className="text-note tabular-nums text-muted-foreground">
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

  // ── Tag List Mode ──
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ViewHeader
        icon={<IconTag size={20} />}
        title="Tags"
        count={flatCount}
        onCreateNew={() => {
          setCreatingTag(true)
          setTimeout(() => tagInputRef.current?.focus(), 100)
        }}
        showDisplay={TAGS_LIST_VIEW_CONFIG.showDisplay}
        displayContent={
          <DisplayPanel
            config={TAGS_LIST_VIEW_CONFIG.displayConfig}
            viewState={tagsListViewState}
            onViewStateChange={updateTagsListView}
            showViewMode={true}
            toggleStates={tagsListViewState.toggles}
            onToggleChange={(key, val) =>
              updateTagsListView({ toggles: { ...tagsListViewState.toggles, [key]: val } })
            }
          />
        }
      />

      {/* Tag list / grid */}
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            ref={scrollContainerRef}
            className={`relative flex-1 overflow-y-auto ${isDraggingRef.current ? "select-none" : ""} ${checkedTags.size > 0 ? "pb-20" : ""}`}
            onMouseDown={handleDragMouseDown}
          >
            {/* Create tag form */}
            {creatingTag && (
              <div className="px-6 py-3 border-b border-border flex items-center gap-3">
                <PhHash className="text-muted-foreground shrink-0" size={14} weight="regular" />
                <input
                  ref={tagInputRef}
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  onBlur={() => { if (!tagInput.trim()) setCreatingTag(false) }}
                  placeholder="tag1, tag2, tag3 — Enter to create"
                  className="h-8 flex-1 rounded-md border border-border bg-background px-3 text-note text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <button onClick={() => { setTagInput(""); setCreatingTag(false) }} className="text-muted-foreground hover:text-foreground transition-colors">
                  <PhX size={14} weight="regular" />
                </button>
              </div>
            )}

            {visibleTags.length === 0 && !creatingTag && (
              <div className="flex h-32 flex-col items-center justify-center gap-2">
                <span className="text-note text-muted-foreground">No tags yet</span>
                <span className="text-2xs text-muted-foreground">Click + to create a tag</span>
              </div>
            )}

            {/* ── Grid Mode ── */}
            {isGridMode && visibleTags.length > 0 && (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2 p-4">
                {visibleTags.map((tag) => (
                  <ContextMenu key={tag.id}>
                    <ContextMenuTrigger asChild>
                      <div
                        className={cn(
                          "group relative flex flex-col gap-2 rounded-lg border border-border/60 p-3 transition-all cursor-pointer",
                          checkedTags.has(tag.id)
                            ? "bg-accent/8 border-accent/40"
                            : "bg-card hover:bg-hover-bg hover:border-border",
                        )}
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest("button")) return
                          toggleCheck(tag.id)
                        }}
                      >
                        {/* Checkbox (top-right) */}
                        <div
                          onClick={(e) => { e.stopPropagation(); toggleCheck(tag.id) }}
                          className={cn(
                            "absolute right-2 top-2 h-4 w-4 shrink-0 rounded-[4px] border flex items-center justify-center cursor-pointer transition-all shadow-sm",
                            checkedTags.has(tag.id)
                              ? "bg-accent border-accent opacity-100"
                              : "opacity-0 group-hover:opacity-100 bg-card border-zinc-400 dark:border-zinc-600",
                          )}
                        >
                          {checkedTags.has(tag.id) && (
                            <PhCheck size={10} weight="bold" className="text-accent-foreground" />
                          )}
                        </div>

                        {/* Color dot */}
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: getEntityColor(tag.color) }}
                        />

                        {/* Tag name */}
                        <button
                          onClick={() => setSelectedTagId(tag.id)}
                          className="text-left text-ui text-foreground transition-colors hover:text-accent leading-tight"
                        >
                          <span className="text-muted-foreground text-note">#</span>
                          {tag.name}
                        </button>

                        {/* PropertyChip row */}
                        <div className="flex items-center gap-1 min-w-0">
                          <TagNoteCountChip count={tag.noteCount} />
                        </div>
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-48">
                      <ContextMenuSub>
                        <ContextMenuSubTrigger>Change color</ContextMenuSubTrigger>
                        <ContextMenuSubContent className="p-2">
                          <ColorPickerGrid
                            value={getEntityColor(tag.color)}
                            onChange={(color) => updateTag(tag.id, { color })}
                          />
                        </ContextMenuSubContent>
                      </ContextMenuSub>
                      <ContextMenuItem onClick={() => updateTag(tag.id, { color: null })}>
                        Reset color
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem
                        onClick={() => deleteTag(tag.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        Delete
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
              </div>
            )}

            {/* ── List Mode ── */}
            {!isGridMode && visibleTags.length > 0 && (
              <div>
                {/* Header row with select-all checkbox */}
                <div
                  data-header-row
                  className="sticky top-0 z-10 flex items-center gap-3 border-b border-border-subtle bg-background px-6 py-2.5"
                >
                  <div
                    onClick={toggleAll}
                    className={cn(
                      "h-4 w-4 rounded-[4px] border flex items-center justify-center cursor-pointer transition-colors shadow-sm",
                      checkedTags.size === visibleTags.length && visibleTags.length > 0
                        ? "bg-accent border-accent"
                        : checkedTags.size > 0
                          ? "bg-accent/50 border-accent"
                          : "bg-card border-zinc-400 dark:border-zinc-600 hover:border-zinc-500 dark:hover:border-zinc-500"
                    )}
                  >
                    {checkedTags.size === visibleTags.length && visibleTags.length > 0 && (
                      <PhCheck size={10} weight="bold" className="text-accent-foreground" />
                    )}
                    {checkedTags.size > 0 && checkedTags.size < visibleTags.length && (
                      <Minus size={10} weight="regular" className="text-accent-foreground" />
                    )}
                  </div>
                  <button
                    className="flex flex-1 items-center gap-1 text-left text-2xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                    onClick={() => handleSortToggle("name")}
                  >
                    Name
                    {(currentSortField === "name" || currentSortField === "title") && (
                      currentSortDir === "asc"
                        ? <ArrowUp size={12} weight="regular" className="text-accent" />
                        : <ArrowDown size={12} weight="regular" className="text-accent" />
                    )}
                  </button>
                  <button
                    className="flex w-16 items-center justify-end gap-1 text-2xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                    onClick={() => handleSortToggle("noteCount")}
                  >
                    Notes
                    {currentSortField === "noteCount" && (
                      currentSortDir === "desc"
                        ? <ArrowDown size={12} weight="regular" className="text-accent" />
                        : <ArrowUp size={12} weight="regular" className="text-accent" />
                    )}
                  </button>
                  <button
                    onClick={() =>
                      updateTagsListView({ toggles: { ...tagsListViewState.toggles, hideEmpty: !hideEmpty } })
                    }
                    className={cn(
                      "ml-2 rounded p-1 transition-colors",
                      hideEmpty ? "text-accent" : "text-muted-foreground hover:text-foreground"
                    )}
                    title={hideEmpty ? "Show all" : "Hide empty"}
                  >
                    <EyeSlash size={14} weight="regular" />
                  </button>
                </div>
                {visibleTags.map((tag, index) => (
                  // v109: row-level ContextMenu — Set color picker entry point.
                  <ContextMenu key={tag.id}>
                    <ContextMenuTrigger asChild>
                      <div
                        data-tag-index={index}
                        className={`group flex items-center gap-3 px-6 py-2.5 border-b border-border/50 transition-colors ${
                          checkedTags.has(tag.id) ? "bg-accent/8" : "hover:bg-hover-bg"
                        }`}
                        onClick={(e) => {
                          // Only handle if click is on the row background (not buttons)
                          if ((e.target as HTMLElement).closest("button")) return
                          handleRowClick(tag.id, index, e)
                        }}
                      >
                        <div
                          data-checkbox
                          onClick={(e) => { e.stopPropagation(); toggleCheck(tag.id) }}
                          className={cn(
                            "h-4 w-4 shrink-0 rounded-[4px] border flex items-center justify-center cursor-pointer transition-colors shadow-sm",
                            checkedTags.has(tag.id)
                              ? "bg-accent border-accent"
                              : "bg-card border-zinc-400 dark:border-zinc-600 hover:border-zinc-500 dark:hover:border-zinc-500"
                          )}
                        >
                          {checkedTags.has(tag.id) && (
                            <PhCheck size={10} weight="bold" className="text-accent-foreground" />
                          )}
                        </div>
                        {/* v109: leading dot — gray when no color set, hex otherwise. */}
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: getEntityColor(tag.color) }}
                        />
                        <button
                          onClick={() => setSelectedTagId(tag.id)}
                          className="flex-1 text-left text-ui text-foreground transition-colors hover:text-accent"
                        >
                          <span className="text-muted-foreground">#</span>
                          {tag.name}
                        </button>
                        <span className="w-16 text-right text-note tabular-nums text-muted-foreground">
                          {tag.noteCount}
                        </span>
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-48">
                      <ContextMenuSub>
                        <ContextMenuSubTrigger>Change color</ContextMenuSubTrigger>
                        <ContextMenuSubContent className="p-2">
                          <ColorPickerGrid
                            value={getEntityColor(tag.color)}
                            onChange={(color) => updateTag(tag.id, { color })}
                          />
                        </ContextMenuSubContent>
                      </ContextMenuSub>
                      <ContextMenuItem onClick={() => updateTag(tag.id, { color: null })}>
                        Reset color
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem
                        onClick={() => deleteTag(tag.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        Delete
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
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
            className="text-note"
          >
            <PhPlus className="mr-2 text-muted-foreground" size={16} weight="regular" />
            New tag
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Floating action bar (bottom) — unified with Notes/References */}
      {checkedTags.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="flex items-center gap-1 rounded-xl border border-border bg-surface-overlay px-4 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <button
              onClick={() => setCheckedTags(new Set())}
              className="mr-1 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-2xs font-medium text-muted-foreground hover:bg-active-bg transition-colors"
            >
              <Lightning size={14} weight="fill" className="text-accent" />
              {checkedTags.size} selected
              <PhX size={12} weight="regular" className="ml-0.5 text-muted-foreground/70" />
            </button>
            <div className="h-7 w-px bg-border mx-1.5" />
            <button
              onClick={handleDeleteChecked}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-2xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash size={16} weight="regular" /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
