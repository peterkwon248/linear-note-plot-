"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { ArrowLeft, ArrowUp, ArrowDown, ArrowUpDown, Plus, Trash2, Pencil, X, Zap, SlidersHorizontal, Layers, ChevronDown, Check, EyeOff, Bookmark } from "lucide-react"
import { usePlotStore } from "@/lib/store"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { ColorPickerGrid, PRESET_COLORS } from "@/components/color-picker-grid"
import { useNotesView } from "@/lib/view-engine/use-notes-view"
import { FilterButton, FilterChipBar } from "@/components/filter-bar"
import type { SortField, FilterRule, GroupBy } from "@/lib/view-engine/types"
import type { Label } from "@/lib/types"
import { ViewHeader } from "@/components/view-header"

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
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
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
                <Check className={`h-3.5 w-3.5 shrink-0 ${active ? "text-accent opacity-100" : "opacity-0"}`} />
                {opt.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

const DRAG_THRESHOLD = 5
const ROW_HEIGHT = 40
const HEADER_HEIGHT = 37

export function LabelsView() {
  const labels = usePlotStore((s) => s.labels)
  const notes = usePlotStore((s) => s.notes)
  const folders = usePlotStore((s) => s.folders)
  const tags = usePlotStore((s) => s.tags)
  const createLabel = usePlotStore((s) => s.createLabel)
  const deleteLabel = usePlotStore((s) => s.deleteLabel)
  const updateLabel = usePlotStore((s) => s.updateLabel)
  const openNote = usePlotStore((s) => s.openNote)

  // Search state
  const [search, setSearch] = useState("")

  // View state
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState(PRESET_COLORS[5]) // default blue
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editColor, setEditColor] = useState("")
  const nameInputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)
  const [displayPopoverOpen, setDisplayPopoverOpen] = useState(false)
  const [labelSortBy, setLabelSortBy] = useState<"name-asc" | "name-desc" | "count-desc" | "count-asc">("name-asc")
  const [hideEmptyLabels, setHideEmptyLabels] = useState(false)

  // View engine for label detail mode (must be called unconditionally)
  const labelExtras = useMemo(() => ({ labelId: selectedLabelId ?? undefined }), [selectedLabelId])
  const { flatNotes: labelNotes, flatCount: labelNoteCount, viewState: labelViewState, updateViewState: updateLabelView } = useNotesView("label", labelExtras)

  // Toggle filter for label detail
  const toggleFilter = useCallback((field: FilterRule["field"], value: string, operator?: FilterRule["operator"]) => {
    const op = operator ?? "eq"
    const exists = labelViewState.filters.some(f => f.field === field && f.operator === op && f.value === value)
    if (exists) {
      updateLabelView({ filters: labelViewState.filters.filter(f => !(f.field === field && f.operator === op && f.value === value)) })
    } else {
      updateLabelView({ filters: [...labelViewState.filters, { field, operator: op, value }] })
    }
  }, [labelViewState.filters, updateLabelView])

  const removeFilter = useCallback((idx: number) => {
    updateLabelView({ filters: labelViewState.filters.filter((_, i) => i !== idx) })
  }, [labelViewState.filters, updateLabelView])

  // Selection state
  const [checkedLabels, setCheckedLabels] = useState<Set<string>>(new Set())
  const lastClickedRef = useRef<number | null>(null)
  const [dragRect, setDragRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const dragStartRef = useRef<{ x: number; y: number; scrollTop: number } | null>(null)
  const isDraggingRef = useRef(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const labelsRef = useRef<typeof labels>(labels)

  // Active notes
  const activeNotes = useMemo(() =>
    notes.filter((n) => !n.archived && !n.trashed),
    [notes]
  )

  // Label note counts
  const labelCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const label of labels) {
      counts[label.id] = activeNotes.filter((n) => n.labelId === label.id).length
    }
    return counts
  }, [labels, activeNotes])

  // Sort and filter labels for list mode (excluding trashed)
  const sortedLabels = useMemo(() => {
    let result = labels.filter((l) => !l.trashed)
    if (hideEmptyLabels) {
      result = result.filter(l => (labelCounts[l.id] || 0) > 0)
    }
    if (search) {
      result = result.filter(l => l.name.toLowerCase().includes(search.toLowerCase()))
    }
    switch (labelSortBy) {
      case "name-asc": return result.sort((a, b) => a.name.localeCompare(b.name))
      case "name-desc": return result.sort((a, b) => b.name.localeCompare(a.name))
      case "count-desc": return result.sort((a, b) => (labelCounts[b.id] || 0) - (labelCounts[a.id] || 0))
      case "count-asc": return result.sort((a, b) => (labelCounts[a.id] || 0) - (labelCounts[b.id] || 0))
      default: return result
    }
  }, [labels, labelSortBy, hideEmptyLabels, labelCounts, search])

  labelsRef.current = sortedLabels

  const selectedLabel = labels.find((l) => l.id === selectedLabelId)

  // Auto-focus
  useEffect(() => {
    if (creating) setTimeout(() => nameInputRef.current?.focus(), 0)
  }, [creating])

  useEffect(() => {
    if (editingId) setTimeout(() => editInputRef.current?.focus(), 0)
  }, [editingId])

  // Create handler
  const handleCreate = () => {
    const name = newName.trim()
    if (name) {
      createLabel(name, newColor)
    }
    setCreating(false)
    setNewName("")
    setNewColor(PRESET_COLORS[5])
  }

  const handleCreateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleCreate()
    else if (e.key === "Escape") {
      setCreating(false)
      setNewName("")
    }
  }

  // Edit handler
  const handleEditSubmit = () => {
    if (editingId) {
      const name = editName.trim()
      if (name) {
        updateLabel(editingId, { name: editName, color: editColor })
      }
    }
    setEditingId(null)
    setEditName("")
    setEditColor("")
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleEditSubmit()
    else if (e.key === "Escape") {
      setEditingId(null)
      setEditName("")
    }
  }

  // Format relative time
  const formatRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}d`
    return new Date(dateStr).toLocaleDateString("en", { month: "short", day: "numeric" })
  }

  // Selection handlers
  const toggleCheck = (labelId: string) => {
    setCheckedLabels(prev => {
      const next = new Set(prev)
      if (next.has(labelId)) next.delete(labelId)
      else next.add(labelId)
      return next
    })
  }

  const toggleAll = () => {
    if (checkedLabels.size === sortedLabels.length) {
      setCheckedLabels(new Set())
    } else {
      setCheckedLabels(new Set(sortedLabels.map(l => l.id)))
    }
  }

  const handleDeleteChecked = () => {
    for (const id of checkedLabels) {
      deleteLabel(id)
    }
    setCheckedLabels(new Set())
  }

  const handleRowClick = useCallback((labelId: string, rowIndex: number, e: React.MouseEvent) => {
    if (e.shiftKey && lastClickedRef.current !== null) {
      const start = Math.min(lastClickedRef.current, rowIndex)
      const end = Math.max(lastClickedRef.current, rowIndex)
      const rangeIds = labelsRef.current.slice(start, end + 1).map(l => l.id)
      setCheckedLabels(new Set(rangeIds))
      e.preventDefault()
      return
    }
    if (e.metaKey || e.ctrlKey) {
      setCheckedLabels(prev => {
        const next = new Set(prev)
        if (next.has(labelId)) next.delete(labelId)
        else next.add(labelId)
        return next
      })
      lastClickedRef.current = rowIndex
      e.preventDefault()
      return
    }
    toggleCheck(labelId)
    lastClickedRef.current = rowIndex
  }, [])

  // Keyboard ESC + Ctrl+A
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && checkedLabels.size > 0) {
        setCheckedLabels(new Set())
        e.preventDefault()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "a" && sortedLabels.length > 0) {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
        if (tag === "input" || tag === "textarea") return
        setCheckedLabels(new Set(sortedLabels.map(l => l.id)))
        e.preventDefault()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [checkedLabels.size, sortedLabels])

  // Drag-to-select mousedown handler
  const handleDragMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    if (target.closest('button, a, input, [data-no-drag]')) return
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollTop: scrollContainerRef.current?.scrollTop ?? 0
    }
    isDraggingRef.current = false
  }, [])

  // Drag-to-select mousemove/mouseup
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return
      const container = scrollContainerRef.current
      if (!container) return
      const dx = e.clientX - dragStartRef.current.x
      const dy = e.clientY - dragStartRef.current.y
      if (!isDraggingRef.current) {
        if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return
        isDraggingRef.current = true
      }
      e.preventDefault()
      const containerRect = container.getBoundingClientRect()
      const scrollTop = container.scrollTop

      const startY = dragStartRef.current.y - containerRect.top + dragStartRef.current.scrollTop
      const currentY = e.clientY - containerRect.top + scrollTop
      const rectTop = Math.min(startY, currentY)
      const rectBottom = Math.max(startY, currentY)
      const rectLeft = Math.min(
        dragStartRef.current.x - containerRect.left,
        e.clientX - containerRect.left
      )
      const rectWidth = Math.abs(e.clientX - dragStartRef.current.x)

      setDragRect({ x: rectLeft, y: rectTop, w: rectWidth, h: rectBottom - rectTop })

      const adjustedTop = rectTop - HEADER_HEIGHT
      const adjustedBottom = rectBottom - HEADER_HEIGHT
      const matchedIds = new Set<string>()
      const currentLabels = labelsRef.current
      for (let i = 0; i < currentLabels.length; i++) {
        const rowTop = i * ROW_HEIGHT
        const rowBottom = rowTop + ROW_HEIGHT
        if (rowBottom > adjustedTop && rowTop < adjustedBottom) {
          matchedIds.add(currentLabels[i].id)
        }
      }
      setCheckedLabels(matchedIds)
    }

    const handleMouseUp = () => {
      if (isDraggingRef.current) setDragRect(null)
      dragStartRef.current = null
      isDraggingRef.current = false
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [])

  // ── Label Detail Mode ──
  if (selectedLabelId && selectedLabel) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-6 py-4">
          <button
            onClick={() => setSelectedLabelId(null)}
            className="flex items-center justify-center h-7 w-7 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span
            className="w-3 h-3 rounded-sm shrink-0"
            style={{ backgroundColor: selectedLabel.color }}
          />
          <h1 className="text-ui font-semibold text-foreground">{selectedLabel.name}</h1>
          <span className="text-sm text-muted-foreground">{labelNoteCount} notes</span>
          <div className="flex-1" />
          <button
            onClick={() => {
              deleteLabel(selectedLabelId)
              setSelectedLabelId(null)
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete label
          </button>
        </div>

        {/* Toolbar: Filter + Display */}
        <div className="flex items-center gap-2 border-b border-border px-5 py-1.5">
          <FilterButton
            filters={labelViewState.filters}
            groupBy={labelViewState.groupBy}
            isSingleStatusTab={false}
            folders={folders}
            tags={tags}
            labels={labels}
            onToggleFilter={toggleFilter}
            onSetFilters={(f) => updateLabelView({ filters: f })}
          />
          <div className="flex-1" />
          <Popover open={displayPopoverOpen} onOpenChange={setDisplayPopoverOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                <SlidersHorizontal className="h-4 w-4" />
                Display
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0" align="end">
              {/* Grouping */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <span className="text-ui text-foreground">Grouping</span>
                </div>
                <InlineSelect
                  value={labelViewState.groupBy}
                  options={GROUP_OPTIONS}
                  onChange={(v) => updateLabelView({ groupBy: v })}
                />
              </div>
              {/* Ordering */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                  <span className="text-ui text-foreground">Ordering</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <InlineSelect
                    value={labelViewState.sortField}
                    options={SORT_OPTIONS}
                    onChange={(v) => updateLabelView({ sortField: v })}
                  />
                  <button
                    onClick={() => updateLabelView({ sortDirection: labelViewState.sortDirection === "asc" ? "desc" : "asc" })}
                    className="flex items-center justify-center rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    {labelViewState.sortDirection === "asc"
                      ? <ArrowUp className="h-3.5 w-3.5" />
                      : <ArrowDown className="h-3.5 w-3.5" />
                    }
                  </button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Filter chips */}
        <FilterChipBar
          filters={labelViewState.filters}
          groupBy={labelViewState.groupBy}
          isSingleStatusTab={false}
          folders={folders}
          tags={tags}
          labels={labels}
          onToggleFilter={toggleFilter}
          onRemoveFilter={removeFilter}
          onClearAll={() => updateLabelView({ filters: [] })}
          onSetFilters={(f) => updateLabelView({ filters: f })}
        />

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto">
          {labelNotes.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              No notes with this label
            </div>
          ) : (
            <div className="divide-y divide-border">
              {labelNotes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => openNote(note.id)}
                  className="flex w-full items-center gap-4 px-6 py-3 text-left hover:bg-secondary/50 transition-colors"
                >
                  <span className="flex-1 truncate text-ui text-foreground">
                    {note.title || "Untitled"}
                  </span>
                  <span className="text-sm text-muted-foreground capitalize">
                    {note.status}
                  </span>
                  <span className="text-sm text-muted-foreground tabular-nums">
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

  // ── Label List Mode ──
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ViewHeader
        icon={<Bookmark className="h-5 w-5" strokeWidth={1.5} />}
        title="Labels"
        count={labels.filter((l) => !l.trashed).length}
        searchPlaceholder="Search labels..."
        searchValue={search}
        onSearchChange={setSearch}
        actions={
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            New label
          </button>
        }
      />

      {/* Sort & Filter toolbar */}
      <div className="flex items-center gap-2 border-b border-border px-5 py-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <ArrowUpDown className="h-3.5 w-3.5" />
              {labelSortBy === "name-asc" ? "Name A-Z" : labelSortBy === "name-desc" ? "Name Z-A" : labelSortBy === "count-desc" ? "Most notes" : "Fewest notes"}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {([
              ["name-asc", "Name A-Z"],
              ["name-desc", "Name Z-A"],
              ["count-desc", "Most notes"],
              ["count-asc", "Fewest notes"],
            ] as const).map(([value, label]) => (
              <DropdownMenuItem key={value} onClick={() => setLabelSortBy(value)}>
                <Check className={cn("h-3.5 w-3.5 mr-2 shrink-0", labelSortBy === value ? "opacity-100" : "opacity-0")} />
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex-1" />
        <button
          onClick={() => setHideEmptyLabels(!hideEmptyLabels)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors",
            hideEmptyLabels ? "bg-accent/15 text-accent" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          <EyeOff className="h-3.5 w-3.5" />
          Hide empty
        </button>
      </div>

      {/* Label list */}
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            ref={scrollContainerRef}
            onMouseDown={handleDragMouseDown}
            className={`flex-1 overflow-y-auto relative${dragRect ? " select-none" : ""}${checkedLabels.size > 0 ? " pb-20" : ""}`}
          >
            {/* Creation form */}
            {creating && (
              <div className="px-6 py-4 border-b border-border space-y-3">
                <input
                  ref={nameInputRef}
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={handleCreateKeyDown}
                  placeholder="Label name"
                  className="h-8 w-full max-w-xs rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <ColorPickerGrid value={newColor} onChange={setNewColor} />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCreate}
                    className="px-3 py-1.5 rounded-md text-sm bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => { setCreating(false); setNewName("") }}
                    className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {labels.length === 0 && !creating ? (
              <div className="flex flex-col items-center justify-center h-32 gap-2">
                <span className="text-sm text-muted-foreground">No labels yet</span>
                <span className="text-xs text-muted-foreground">
                  Click &quot;New label&quot; to create one
                </span>
              </div>
            ) : (
              <div>
                {/* Header row */}
                <div className="flex items-center gap-3 px-6 py-2 text-sm font-medium text-muted-foreground border-b border-border">
                  <button
                    onClick={toggleAll}
                    className="flex h-4 w-4 items-center justify-center rounded border border-border transition-colors hover:border-foreground/50 shrink-0"
                  >
                    {checkedLabels.size === sortedLabels.length && sortedLabels.length > 0 && (
                      <div className="h-2 w-2 rounded-sm bg-accent" />
                    )}
                  </button>
                  <span className="w-3" /> {/* color dot spacer */}
                  <span className="flex-1">Name</span>
                  <span className="w-16 text-right">Notes</span>
                  <span className="w-16" />
                </div>

                {sortedLabels.map((label, index) => {
                  const isEditing = editingId === label.id
                  return (
                    <div
                      key={label.id}
                      data-label-index={index}
                      className={`flex items-start gap-3 px-6 py-2.5 transition-colors group cursor-default${
                        checkedLabels.has(label.id) ? " bg-accent/10" : " hover:bg-secondary/50"
                      }`}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest('button, input, [data-no-drag]')) return
                        if (isEditing) return
                        handleRowClick(label.id, index, e)
                      }}
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleCheck(label.id) }}
                        className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-border transition-colors hover:border-foreground/50 mt-0.5"
                      >
                        {checkedLabels.has(label.id) && (
                          <div className="h-2 w-2 rounded-sm bg-accent" />
                        )}
                      </button>
                      <span
                        className="w-3 h-3 rounded-sm shrink-0 mt-0.5"
                        style={{ backgroundColor: isEditing ? editColor : label.color }}
                      />
                      {isEditing ? (
                        <div className="flex-1 space-y-2">
                          <input
                            ref={editInputRef}
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={handleEditKeyDown}
                            onBlur={handleEditSubmit}
                            className="h-7 w-full max-w-xs rounded border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                          />
                          <ColorPickerGrid value={editColor} onChange={setEditColor} />
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedLabelId(label.id) }}
                          className="flex-1 text-left text-ui text-foreground hover:text-accent transition-colors"
                        >
                          {label.name}
                        </button>
                      )}
                      {!isEditing && (
                        <>
                          <span className="w-16 text-right text-sm text-muted-foreground tabular-nums self-center">
                            {labelCounts[label.id] || 0}
                          </span>
                          <div className="w-16 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingId(label.id)
                                setEditName(label.name)
                                setEditColor(label.color)
                              }}
                              className="flex items-center justify-center h-6 w-6 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteLabel(label.id) }}
                              className="flex items-center justify-center h-6 w-6 rounded hover:bg-red-400/10 text-muted-foreground hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
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
              setCreating(true)
            }}
            className="text-sm"
          >
            <Plus className="h-4 w-4 mr-2 text-muted-foreground" />
            New label
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Floating action bar */}
      {checkedLabels.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-xl border border-border bg-card shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="flex items-center gap-1 px-4 py-2.5">
            <div className="flex items-center gap-1.5 px-1.5">
              <Zap className="h-4 w-4 text-accent" />
              <span className="text-ui font-medium text-foreground whitespace-nowrap">
                {checkedLabels.size} selected
              </span>
              <button
                onClick={() => setCheckedLabels(new Set())}
                className="rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mx-1.5 h-7 w-px bg-border" />
            <button
              onClick={handleDeleteChecked}
              className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-3 py-2 text-ui font-medium text-destructive transition-colors hover:bg-destructive/20"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
