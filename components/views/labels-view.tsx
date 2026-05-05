"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
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
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { PencilSimple } from "@phosphor-icons/react/dist/ssr/PencilSimple"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { Lightning } from "@phosphor-icons/react/dist/ssr/Lightning"
import { SlidersHorizontal } from "@phosphor-icons/react/dist/ssr/SlidersHorizontal"
import { Stack } from "@phosphor-icons/react/dist/ssr/Stack"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"
import { Minus } from "@phosphor-icons/react/dist/ssr/Minus"
import { EyeSlash } from "@phosphor-icons/react/dist/ssr/EyeSlash"
import { BookmarkSimple } from "@phosphor-icons/react/dist/ssr/BookmarkSimple"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { ColorPickerGrid } from "@/components/color-picker-grid"
import { PRESET_COLORS } from "@/lib/colors"
import { useNotesView } from "@/lib/view-engine/use-notes-view"
import { useLabelsView } from "@/lib/view-engine/use-labels-view"
import { FilterButton, FilterChipBar } from "@/components/filter-bar"
import { DisplayPanel } from "@/components/display-panel"
import { LABELS_LIST_VIEW_CONFIG } from "@/lib/view-engine/view-configs"
import { LabelNoteCountChip } from "@/components/property-chips"
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

const DRAG_THRESHOLD = 5
const ROW_HEIGHT = 40
const HEADER_HEIGHT = 37

export function LabelsView() {
  const labels = usePlotStore((s) => s.labels)
  const folders = usePlotStore((s) => s.folders)
  const tags = usePlotStore((s) => s.tags)
  const createLabel = usePlotStore((s) => s.createLabel)
  const deleteLabel = usePlotStore((s) => s.deleteLabel)
  const updateLabel = usePlotStore((s) => s.updateLabel)
  const openNote = usePlotStore((s) => s.openNote)

  // View state
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState<string>(PRESET_COLORS[5]) // default blue
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editColor, setEditColor] = useState("")
  const nameInputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)
  const [displayPopoverOpen, setDisplayPopoverOpen] = useState(false)
  const [colorPickerOpenId, setColorPickerOpenId] = useState<string | null>(null)
  const [contextMenuLabelId, setContextMenuLabelId] = useState<string | null>(null)
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Labels-list view engine (entity index) ─────────────
  // useLabelsView manages: search (via global searchQuery), sort, group.
  const {
    flatLabels: sortedLabels,
    flatCount,
    totalCount,
    viewState: labelsListViewState,
    updateViewState: updateLabelsListView,
  } = useLabelsView()

  // hideEmpty toggle — stored in viewState.toggles
  const hideEmptyLabels = labelsListViewState.toggles?.hideEmpty ?? false

  // Apply hideEmpty filter on top of the view-engine result
  const visibleLabels = useMemo(
    () => hideEmptyLabels ? sortedLabels.filter((l) => l.noteCount > 0) : sortedLabels,
    [sortedLabels, hideEmptyLabels],
  )

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
  // labelsRef tracks the currently-rendered list for drag-to-select row math
  const labelsRef = useRef<typeof visibleLabels>(visibleLabels)

  labelsRef.current = visibleLabels

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
    setColorPickerOpenId(null)
  }

  const startEdit = useCallback((label: Label) => {
    setEditingId(label.id)
    setEditName(label.name)
    setEditColor(label.color)
  }, [])

  const handleNameClick = useCallback((label: Label, e: React.MouseEvent) => {
    e.stopPropagation()
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current)
      clickTimerRef.current = null
      setSelectedLabelId(label.id)
      return
    }
    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null
      startEdit(label)
    }, 200)
  }, [startEdit])

  const handleColorDotClick = useCallback((label: Label, e: React.MouseEvent) => {
    e.stopPropagation()
    setColorPickerOpenId(label.id)
  }, [])

  // Quick color change (no rename mode) — used by dot click and FAB Recolor
  const handleQuickColorChange = useCallback((labelId: string, color: string) => {
    updateLabel(labelId, { color })
  }, [updateLabel])

  const handleFabRename = useCallback(() => {
    const id = Array.from(checkedLabels)[0]
    const label = labels.find((l) => l.id === id)
    if (label) {
      setCheckedLabels(new Set())
      startEdit(label)
    }
  }, [checkedLabels, labels, startEdit])

  const handleFabRecolor = useCallback(() => {
    const id = Array.from(checkedLabels)[0]
    if (id) {
      setCheckedLabels(new Set())
      setColorPickerOpenId(id)
    }
  }, [checkedLabels])

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleEditSubmit()
    else if (e.key === "Escape") {
      setEditingId(null)
      setEditName("")
    }
  }

  // Persist color change immediately so popover clicks can't be lost to onBlur races
  const handleEditColorChange = (color: string) => {
    setEditColor(color)
    if (editingId) updateLabel(editingId, { color })
  }

  // Don't submit on blur if focus moved into the color picker popover
  const handleEditBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const next = e.relatedTarget as HTMLElement | null
    if (next?.closest("[data-radix-popper-content-wrapper]")) return
    handleEditSubmit()
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
    if (checkedLabels.size === visibleLabels.length) {
      setCheckedLabels(new Set())
    } else {
      setCheckedLabels(new Set(visibleLabels.map(l => l.id)))
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
      if ((e.metaKey || e.ctrlKey) && e.key === "a" && visibleLabels.length > 0) {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
        if (tag === "input" || tag === "textarea") return
        setCheckedLabels(new Set(visibleLabels.map(l => l.id)))
        e.preventDefault()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [checkedLabels.size, visibleLabels])

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
            className="flex items-center justify-center h-7 w-7 rounded-md hover:bg-hover-bg text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} weight="regular" />
          </button>
          <span
            className="w-3 h-3 rounded-sm shrink-0"
            style={{ backgroundColor: selectedLabel.color }}
          />
          <h1 className="text-ui font-semibold text-foreground">{selectedLabel.name}</h1>
          <span className="text-note text-muted-foreground">{labelNoteCount} notes</span>
          <div className="flex-1" />
          <button
            onClick={() => {
              deleteLabel(selectedLabelId)
              setSelectedLabelId(null)
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-note text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <Trash size={14} weight="regular" />
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
                  value={labelViewState.groupBy}
                  options={GROUP_OPTIONS}
                  onChange={(v) => updateLabelView({ groupBy: v })}
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
                    value={labelViewState.sortField}
                    options={SORT_OPTIONS}
                    onChange={(v) => updateLabelView({ sortField: v })}
                  />
                  <button
                    onClick={() => updateLabelView({ sortDirection: labelViewState.sortDirection === "asc" ? "desc" : "asc" })}
                    className="flex items-center justify-center rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
                  >
                    {labelViewState.sortDirection === "asc"
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
            <div className="flex items-center justify-center h-32 text-note text-muted-foreground">
              No notes with this label
            </div>
          ) : (
            <div>
              {labelNotes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => openNote(note.id)}
                  className="flex w-full items-center gap-4 px-6 py-3 text-left hover:bg-hover-bg transition-colors"
                >
                  <span className="flex-1 truncate text-ui text-foreground">
                    {note.title || "Untitled"}
                  </span>
                  <span className="text-note text-muted-foreground capitalize">
                    {note.status}
                  </span>
                  <span className="text-note text-muted-foreground tabular-nums">
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
  const isGridMode = labelsListViewState.viewMode === "grid"

  // Current sort indicator helpers (for list header columns)
  const currentSortField = labelsListViewState.sortFields[0]?.field ?? "name"
  const currentSortDir = labelsListViewState.sortFields[0]?.direction ?? "asc"

  const handleSortToggle = (field: "name" | "noteCount") => {
    const isCurrent = currentSortField === field || (field === "name" && currentSortField === "title")
    if (isCurrent) {
      updateLabelsListView({ sortFields: [{ field, direction: currentSortDir === "asc" ? "desc" : "asc" }] })
    } else {
      const dir = field === "noteCount" ? "desc" : "asc"
      updateLabelsListView({ sortFields: [{ field, direction: dir }] })
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ViewHeader
        icon={<BookmarkSimple size={20} weight="regular" />}
        title="Labels"
        count={flatCount}
        onCreateNew={() => setCreating(true)}
        showDisplay={LABELS_LIST_VIEW_CONFIG.showDisplay}
        displayContent={
          <DisplayPanel
            config={LABELS_LIST_VIEW_CONFIG.displayConfig}
            viewState={labelsListViewState}
            onViewStateChange={updateLabelsListView}
            showViewMode={true}
            toggleStates={labelsListViewState.toggles}
            onToggleChange={(key, val) =>
              updateLabelsListView({ toggles: { ...labelsListViewState.toggles, [key]: val } })
            }
          />
        }
      />

      {/* Label list / grid */}
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
                  className="h-8 w-full max-w-xs rounded-md border border-border bg-background px-3 text-note text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <ColorPickerGrid value={newColor} onChange={setNewColor} />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCreate}
                    className="px-3 py-1.5 rounded-md text-note bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => { setCreating(false); setNewName("") }}
                    className="px-3 py-1.5 rounded-md text-note text-muted-foreground hover:text-foreground hover:bg-hover-bg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {labels.length === 0 && !creating ? (
              <div className="flex flex-col items-center justify-center h-32 gap-2">
                <span className="text-note text-muted-foreground">No labels yet</span>
                <span className="text-2xs text-muted-foreground">
                  Click &quot;New label&quot; to create one
                </span>
              </div>
            ) : (
              <>
                {/* ── Grid Mode ── */}
                {isGridMode && visibleLabels.length > 0 && (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2 p-4">
                    {visibleLabels.map((label) => (
                      <ContextMenu key={label.id}>
                        <ContextMenuTrigger asChild>
                          <div
                            className={cn(
                              "group relative flex flex-col gap-2 rounded-lg border border-border/60 p-3 transition-all cursor-pointer",
                              checkedLabels.has(label.id)
                                ? "bg-accent/8 border-accent/40"
                                : "bg-card hover:bg-hover-bg hover:border-border",
                            )}
                            onClick={(e) => {
                              if ((e.target as HTMLElement).closest("button")) return
                              toggleCheck(label.id)
                            }}
                          >
                            {/* Checkbox (top-right) */}
                            <div
                              onClick={(e) => { e.stopPropagation(); toggleCheck(label.id) }}
                              className={cn(
                                "absolute right-2 top-2 h-4 w-4 shrink-0 rounded-[4px] border flex items-center justify-center cursor-pointer transition-all shadow-sm",
                                checkedLabels.has(label.id)
                                  ? "bg-accent border-accent opacity-100"
                                  : "opacity-0 group-hover:opacity-100 bg-card border-zinc-400 dark:border-zinc-600",
                              )}
                            >
                              {checkedLabels.has(label.id) && (
                                <PhCheck size={10} weight="bold" className="text-accent-foreground" />
                              )}
                            </div>

                            {/* Color dot — Label.color is non-nullable, use directly */}
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: label.color }}
                            />

                            {/* Label name */}
                            <button
                              onClick={() => setSelectedLabelId(label.id)}
                              className="text-left text-ui text-foreground transition-colors hover:text-accent leading-tight"
                            >
                              {label.name}
                            </button>

                            {/* PropertyChip row */}
                            <div className="flex items-center gap-1 min-w-0">
                              <LabelNoteCountChip count={label.noteCount} />
                            </div>
                          </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="w-48">
                          <ContextMenuItem
                            onClick={() => startEdit(label)}
                            className="text-note"
                          >
                            <PencilSimple className="mr-2 text-muted-foreground" size={14} weight="regular" />
                            Rename
                          </ContextMenuItem>
                          <ContextMenuItem
                            onClick={() => setColorPickerOpenId(label.id)}
                            className="text-note"
                          >
                            <span className="mr-2 h-3 w-3 shrink-0 rounded-full inline-block" style={{ backgroundColor: label.color }} />
                            Change color
                          </ContextMenuItem>
                          <ContextMenuItem
                            onClick={() => setSelectedLabelId(label.id)}
                            className="text-note"
                          >
                            <Stack className="mr-2 text-muted-foreground" size={14} weight="regular" />
                            View notes
                          </ContextMenuItem>
                          <ContextMenuItem
                            onClick={() => deleteLabel(label.id)}
                            className="text-note text-destructive focus:text-destructive"
                          >
                            <Trash className="mr-2" size={14} weight="regular" />
                            Delete
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    ))}
                  </div>
                )}

                {/* ── List Mode ── */}
                {!isGridMode && (
                  <div>
                    {/* Header row */}
                    <div
                      data-header-row
                      className="sticky top-0 z-10 flex items-center gap-3 border-b border-border-subtle bg-background px-6 py-2.5"
                    >
                      <div
                        onClick={toggleAll}
                        className={cn(
                          "h-4 w-4 shrink-0 rounded-[4px] border flex items-center justify-center cursor-pointer transition-colors shadow-sm",
                          checkedLabels.size === visibleLabels.length && visibleLabels.length > 0
                            ? "bg-accent border-accent"
                            : checkedLabels.size > 0
                              ? "bg-accent/50 border-accent"
                              : "bg-card border-zinc-400 dark:border-zinc-600 hover:border-zinc-500 dark:hover:border-zinc-500"
                        )}
                      >
                        {checkedLabels.size === visibleLabels.length && visibleLabels.length > 0 && (
                          <PhCheck size={10} weight="bold" className="text-accent-foreground" />
                        )}
                        {checkedLabels.size > 0 && checkedLabels.size < visibleLabels.length && (
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
                          updateLabelsListView({ toggles: { ...labelsListViewState.toggles, hideEmpty: !hideEmptyLabels } })
                        }
                        className={cn(
                          "ml-2 rounded p-1 transition-colors",
                          hideEmptyLabels ? "text-accent" : "text-muted-foreground hover:text-foreground"
                        )}
                        title={hideEmptyLabels ? "Show all" : "Hide empty"}
                      >
                        <EyeSlash size={14} weight="regular" />
                      </button>
                    </div>

                    {visibleLabels.map((label, index) => {
                      const isEditing = editingId === label.id
                      const dotColor = isEditing ? editColor : label.color
                      return (
                        <ContextMenu key={label.id} onOpenChange={(open) => {
                          if (open) setContextMenuLabelId(label.id)
                          else setContextMenuLabelId(null)
                        }}>
                          <ContextMenuTrigger asChild>
                            <div
                              data-label-index={index}
                              className={`flex items-start gap-3 px-6 py-2.5 transition-colors group cursor-default${
                                checkedLabels.has(label.id) ? " bg-accent/10" : " hover:bg-hover-bg"
                              }`}
                              onClick={(e) => {
                                if ((e.target as HTMLElement).closest('button, input, [data-no-drag]')) return
                                if (isEditing) return
                                handleRowClick(label.id, index, e)
                              }}
                            >
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleCheck(label.id) }}
                                className={cn(
                                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors mt-0.5 shadow-sm",
                                  checkedLabels.has(label.id)
                                    ? "bg-accent border-accent text-accent-foreground"
                                    : "bg-card border-zinc-400 dark:border-zinc-600 hover:border-zinc-500",
                                  checkedLabels.size > 0 || checkedLabels.has(label.id) ? "visible" : "invisible group-hover:visible"
                                )}
                              >
                                {checkedLabels.has(label.id) && (
                                  <PhCheck size={10} weight="bold" />
                                )}
                              </button>

                              {/* Color dot — always a popover trigger */}
                              <Popover
                                open={colorPickerOpenId === label.id}
                                onOpenChange={(open) => {
                                  if (!open) setColorPickerOpenId(null)
                                }}
                              >
                                <PopoverTrigger asChild>
                                  <button
                                    onClick={(e) => handleColorDotClick(label, e)}
                                    className="h-3 w-3 rounded-full shrink-0 mt-0.5 ring-1 ring-black/5 dark:ring-white/10 hover:ring-2 hover:ring-foreground/20 transition-all cursor-pointer"
                                    style={{ backgroundColor: dotColor }}
                                    title="Change color"
                                    type="button"
                                  />
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-[280px] p-3"
                                  align="start"
                                  sideOffset={6}
                                  onClick={(e) => e.stopPropagation()}
                                  onOpenAutoFocus={(e) => e.preventDefault()}
                                >
                                  <ColorPickerGrid
                                    value={dotColor}
                                    onChange={(color) => {
                                      if (isEditing) handleEditColorChange(color)
                                      else handleQuickColorChange(label.id, color)
                                    }}
                                  />
                                </PopoverContent>
                              </Popover>

                              {/* Name — click to rename, double-click to navigate */}
                              {isEditing ? (
                                <div className="flex-1 flex items-center gap-2">
                                  <input
                                    ref={editInputRef}
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    onKeyDown={handleEditKeyDown}
                                    onBlur={handleEditBlur}
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex-1 h-7 max-w-md rounded-md border border-border bg-card px-2.5 text-note text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                                    placeholder="Label name"
                                  />
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => handleNameClick(label, e)}
                                  className="flex-1 text-left text-ui text-foreground hover:text-accent transition-colors"
                                  title="Click to rename · Double-click to view notes"
                                >
                                  {label.name}
                                </button>
                              )}

                              {!isEditing && (
                                <span className="w-16 text-right text-note text-muted-foreground tabular-nums self-center">
                                  {label.noteCount}
                                </span>
                              )}
                            </div>
                          </ContextMenuTrigger>
                          <ContextMenuContent className="w-48">
                            <ContextMenuItem
                              onClick={() => startEdit(label)}
                              className="text-note"
                            >
                              <PencilSimple className="mr-2 text-muted-foreground" size={14} weight="regular" />
                              Rename
                            </ContextMenuItem>
                            <ContextMenuItem
                              onClick={() => setColorPickerOpenId(label.id)}
                              className="text-note"
                            >
                              <span className="mr-2 h-3 w-3 shrink-0 rounded-full inline-block" style={{ backgroundColor: label.color }} />
                              Change color
                            </ContextMenuItem>
                            <ContextMenuItem
                              onClick={() => setSelectedLabelId(label.id)}
                              className="text-note"
                            >
                              <Stack className="mr-2 text-muted-foreground" size={14} weight="regular" />
                              View notes
                            </ContextMenuItem>
                            <ContextMenuItem
                              onClick={() => deleteLabel(label.id)}
                              className="text-note text-destructive focus:text-destructive"
                            >
                              <Trash className="mr-2" size={14} weight="regular" />
                              Delete
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      )
                    })}
                  </div>
                )}
              </>
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
            onClick={() => setCreating(true)}
            className="text-note"
          >
            <PhPlus className="mr-2 text-muted-foreground" size={16} weight="regular" />
            New label
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Floating action bar */}
      {checkedLabels.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="flex items-center gap-1 rounded-xl border border-border bg-surface-overlay px-4 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <button
              onClick={() => setCheckedLabels(new Set())}
              className="mr-1 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-2xs font-medium text-muted-foreground hover:bg-active-bg transition-colors"
            >
              <Lightning size={14} weight="fill" className="text-accent" />
              {checkedLabels.size} selected
              <PhX size={12} weight="regular" className="ml-0.5 text-muted-foreground/70" />
            </button>
            <div className="h-7 w-px bg-border mx-1.5" />
            {checkedLabels.size === 1 && (
              <>
                <button
                  onClick={handleFabRename}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-2xs font-medium text-foreground hover:bg-hover-bg transition-colors"
                >
                  <PencilSimple size={14} weight="regular" /> Rename
                </button>
                <button
                  onClick={handleFabRecolor}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-2xs font-medium text-foreground hover:bg-hover-bg transition-colors"
                >
                  {(() => {
                    const id = Array.from(checkedLabels)[0]
                    const lbl = labels.find((l) => l.id === id)
                    return <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: lbl?.color ?? "#6b7280" }} />
                  })()}
                  Recolor
                </button>
                <div className="h-7 w-px bg-border mx-0.5" />
              </>
            )}
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
