"use client"

import { useState, useMemo, useRef, memo, useEffect, useCallback, type Dispatch, type SetStateAction } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import {
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
  Link2,
  ChevronDown,
  X,
  SlidersHorizontal,
  Columns3,
  Sparkles,
  Layers,
  Check,
  AlarmClock,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  Inbox,
  MoreHorizontal,
  LayoutList,
  LayoutGrid,
  Search,
  Bell,
  Clock,
  Merge,
  Minus,
  ChevronsUp,
  ChevronUp,
  FolderOpen,
  Lightbulb,
  Calendar,
} from "lucide-react"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { usePlotStore } from "@/lib/store"
import { useSettingsStore, useUIStore } from "@/lib/settings-store"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { getSnoozeTime, type SnoozePreset } from "@/lib/queries/notes"
import { useNotesView } from "@/lib/view-engine/use-notes-view"
import type { ViewContextKey, SortField, SortDirection, GroupBy, FilterRule, NoteGroup } from "@/lib/view-engine/types"
import { StatusDropdown, PriorityDropdown, StatusBadge } from "@/components/note-fields"
import { format } from "date-fns"
import { shortRelative } from "@/lib/format-utils"
import type { Note, NoteStatus, NotePriority, Folder } from "@/lib/types"
import { toast } from "sonner"
import { FloatingActionBar } from "@/components/floating-action-bar"
import { FilterButton, FilterChipBar } from "@/components/filter-bar"
import { setActiveFolderId } from "@/lib/table-route"

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
        className="flex items-center gap-1.5 rounded-md bg-secondary/60 px-2.5 py-1.5 text-[14px] text-foreground transition-colors hover:bg-secondary"
      >
        {current?.label ?? value}
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-md border border-border bg-popover py-1 shadow-md animate-in fade-in-0 zoom-in-95 duration-100">
          {options.map((opt) => {
            const active = opt.value === value
            return (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-[14px] transition-colors hover:bg-accent hover:text-accent-foreground ${
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

/* ── Helpers ───────────────────────────────────────────── */

function absDate(dateStr: string): string {
  return format(new Date(dateStr), "MMM d")
}

/* ── Context tabs ──────────────────────────────────────── */

const TABS: { id: ViewContextKey; label: string }[] = [
  { id: "all", label: "All Notes" },
  { id: "inbox", label: "Inbox" },
  { id: "capture", label: "Capture" },
  { id: "permanent", label: "Permanent" },
  { id: "unlinked", label: "Unlinked" },
]

/* ── Column + group config ─────────────────────────────── */

const COLUMN_DEFS: { id: string; label: string; width: string; align?: string; sortField: SortField }[] = [
  { id: "title", label: "Name", width: "flex-1 min-w-0", sortField: "title" },
  { id: "status", label: "Status", width: "w-[120px] shrink-0", align: "text-right", sortField: "status" },
  { id: "folder", label: "Folder", width: "w-[80px] shrink-0", align: "text-center", sortField: "folder" },
  { id: "links", label: "Links", width: "w-[56px] shrink-0", align: "text-center", sortField: "links" },
  { id: "reads", label: "Reads", width: "w-[56px] shrink-0", align: "text-center", sortField: "reads" },
  { id: "priority", label: "Priority", width: "w-[72px] shrink-0", align: "text-center", sortField: "priority" },
  { id: "updatedAt", label: "Updated", width: "w-[80px] shrink-0", align: "text-right", sortField: "updatedAt" },
  { id: "createdAt", label: "Created", width: "w-[80px] shrink-0", align: "text-right", sortField: "createdAt" },
]

const GROUP_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: "none", label: "No grouping" },
  { value: "status", label: "Status" },
  { value: "priority", label: "Priority" },
  { value: "date", label: "Date" },
  { value: "folder", label: "Folder" },
]

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "title", label: "Title" },
  { value: "status", label: "Status" },
  { value: "folder", label: "Folder" },
  { value: "links", label: "Links" },
  { value: "reads", label: "Reads" },
  { value: "priority", label: "Priority" },
  { value: "updatedAt", label: "Updated" },
  { value: "createdAt", label: "Created" },
]

/* ── Virtual item type ─────────────────────────────────── */

type VirtualItem =
  | { type: "header"; label: string; count: number }
  | { type: "note"; note: Note }

/* ── Header cell ───────────────────────────────────────── */

function TH({
  label,
  col,
  sortCol,
  sortDir,
  onSort,
  className = "",
}: {
  label: string
  col: SortField
  sortCol: SortField
  sortDir: SortDirection
  onSort: (c: SortField) => void
  className?: string
}) {
  const active = sortCol === col
  return (
    <button
      className={`group/th inline-flex items-center gap-1 text-[14px] font-medium text-muted-foreground transition-colors hover:text-foreground ${className}`}
      onClick={() => onSort(col)}
    >
      {label}
      {active ? (
        sortDir === "asc" ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />
      ) : (
        <ArrowUpDown className="h-2.5 w-2.5 opacity-0 group-hover/th:opacity-40" />
      )}
    </button>
  )
}

/* ── NotesTable ────────────────────────────────────────── */

export function NotesTable({
  onRowClick,
  activePreviewId,
  context,
  title,
  showTabs = true,
  createNoteOverrides,
  hideCreateButton = false,
  folderId,
}: {
  onRowClick?: (noteId: string) => void
  activePreviewId?: string | null
  context?: ViewContextKey
  title?: string
  showTabs?: boolean
  createNoteOverrides?: Partial<import("@/lib/types").Note>
  hideCreateButton?: boolean
  folderId?: string
}) {
  const notes = usePlotStore((s) => s.notes)
  const updateNote = usePlotStore((s) => s.updateNote)
  const openNote = usePlotStore((s) => s.openNote)
  const createNote = usePlotStore((s) => s.createNote)
  const triageKeep = usePlotStore((s) => s.triageKeep)
  const triageSnooze = usePlotStore((s) => s.triageSnooze)
  const triageTrash = usePlotStore((s) => s.triageTrash)
  const promoteToPermanent = usePlotStore((s) => s.promoteToPermanent)
  const undoPromote = usePlotStore((s) => s.undoPromote)
  const moveBackToInbox = usePlotStore((s) => s.moveBackToInbox)
  const setReminder = usePlotStore((s) => s.setReminder)
  const setMergePickerOpen = usePlotStore((s) => s.setMergePickerOpen)
  const setLinkPickerOpen = usePlotStore((s) => s.setLinkPickerOpen)

  const [activeTab, setActiveTab] = useState<ViewContextKey>("all")

  const effectiveTab = context ?? activeTab

  const backlinksMap = useBacklinksIndex()

  const tabCounts = useMemo((): Record<string, number> => {
    const active = notes.filter((n) => !n.archived && !n.trashed)
    return {
      all: active.length,
      inbox: active.filter((n) => n.status === "inbox" && n.triageStatus !== "trashed").length,
      capture: active.filter((n) => n.status === "capture").length,
      permanent: active.filter((n) => n.status === "permanent").length,
      unlinked: active.filter((n) => (backlinksMap.get(n.id) ?? 0) === 0 && (n.linksOut?.length ?? 0) === 0).length,
    }
  }, [notes, backlinksMap])

  const folders = usePlotStore((s) => s.folders)
  const labels = usePlotStore((s) => s.labels)
  const tags = usePlotStore((s) => s.tags)

  const searchQuery = usePlotStore((s) => s.searchQuery)
  const setSearchQuery = usePlotStore((s) => s.setSearchQuery)

  const viewMode = useSettingsStore((s) => s.viewMode)
  const setViewMode = useSettingsStore((s) => s.setViewMode)
  const displayPopoverOpen = useUIStore((s) => s.displayPopoverOpen)
  const setDisplayPopoverOpen = useUIStore((s) => s.setDisplayPopoverOpen)

  const { flatNotes, groups, viewState, updateViewState } = useNotesView(effectiveTab, { backlinksMap, folderId })

  // ── Multi-select state ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const lastClickedRef = useRef<number | null>(null)

  // Drag selection
  const [dragRect, setDragRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const dragStartRef = useRef<{ x: number; y: number; scrollTop: number } | null>(null)
  const isDraggingRef = useRef(false)

  // Clear selection on tab change
  useEffect(() => { setSelectedIds(new Set()) }, [effectiveTab])

  // ESC to clear selection, Ctrl+A to select all
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedIds.size > 0) {
        setSelectedIds(new Set())
        e.preventDefault()
      }
      // Ctrl+A / Cmd+A: select all
      if ((e.metaKey || e.ctrlKey) && e.key === "a" && flatNotes.length > 0) {
        // Only if focus is not in an input/textarea/editor
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
        if (tag === "input" || tag === "textarea" || (e.target as HTMLElement)?.closest('[contenteditable="true"]')) return
        setSelectedIds(new Set(flatNotes.map(n => n.id)))
        e.preventDefault()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [selectedIds.size, flatNotes.length])

  const handleRowClick = useCallback((noteId: string, rowIndex: number, e: React.MouseEvent) => {
    // Shift+click: range select
    if (e.shiftKey && lastClickedRef.current !== null) {
      const start = Math.min(lastClickedRef.current, rowIndex)
      const end = Math.max(lastClickedRef.current, rowIndex)
      const rangeIds = flatNotes.slice(start, end + 1).map((n) => n.id)
      setSelectedIds(new Set(rangeIds))
      e.preventDefault()
      return
    }

    // Ctrl/Cmd+click: toggle
    if (e.metaKey || e.ctrlKey) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        if (next.has(noteId)) next.delete(noteId)
        else next.add(noteId)
        return next
      })
      lastClickedRef.current = rowIndex
      e.preventDefault()
      return
    }

    // Normal click: select this note + open preview
    setSelectedIds(new Set([noteId]))
    lastClickedRef.current = rowIndex
    onRowClick?.(noteId)
  }, [flatNotes, onRowClick])

  // ── Drag-to-select ──
  const DRAG_THRESHOLD = 5

  const handleDragMouseDown = useCallback((e: React.MouseEvent) => {
    // Only left button, ignore if on interactive elements
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    if (target.closest('button, a, input, [role="menuitem"], [data-radix-collection-item], [data-no-drag]')) return
    // Don't start drag from checkbox area
    if (target.closest('[data-checkbox]')) return

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollTop: scrollContainerRef.current?.scrollTop ?? 0
    }
    isDraggingRef.current = false
  }, [])

  function handleSort(col: SortField) {
    if (viewState.sortField === col) {
      updateViewState({ sortDirection: viewState.sortDirection === "asc" ? "desc" : "asc" })
    } else {
      updateViewState({ sortField: col, sortDirection: col === "title" ? "asc" : "desc" })
    }
  }

  function toggleFilter(field: FilterRule["field"], value: string, operator: FilterRule["operator"] = "eq") {
    const exists = viewState.filters.some(
      (f) => f.field === field && f.operator === operator && f.value === value
    )
    if (exists) {
      updateViewState({
        filters: viewState.filters.filter((f) => !(f.field === field && f.operator === operator && f.value === value)),
      })
    } else {
      updateViewState({ filters: [...viewState.filters, { field, operator, value }] })
    }
  }

  function removeFilter(idx: number) {
    updateViewState({ filters: viewState.filters.filter((_, i) => i !== idx) })
  }

  const isSingleStatusTab = ["inbox", "capture", "permanent"].includes(effectiveTab)

  function toggleColumn(colId: string) {
    const cols = viewState.visibleColumns
    const next = cols.includes(colId)
      ? cols.filter((c) => c !== colId)
      : [...cols, colId]
    updateViewState({ visibleColumns: next })
  }

  const visibleCols = viewState.visibleColumns

  const virtualItems = useMemo((): VirtualItem[] => {
    if (viewState.groupBy === "none") {
      return flatNotes.map((note) => ({ type: "note" as const, note }))
    }
    const items: VirtualItem[] = []
    for (const group of groups) {
      if (group.notes.length === 0 && !viewState.showEmptyGroups) continue
      items.push({ type: "header", label: group.label, count: group.notes.length })
      for (const note of group.notes) {
        items.push({ type: "note", note })
      }
    }
    return items
  }, [flatNotes, groups, viewState.groupBy, viewState.showEmptyGroups])

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: virtualItems.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: (i) => virtualItems[i].type === "header" ? 36 : 41,
    overscan: 5,
  })

  // Keep latest virtualItems in a ref so the drag mousemove handler always sees current data
  const virtualItemsRef = useRef(virtualItems)
  virtualItemsRef.current = virtualItems
  const rowVirtualizerRef = useRef(rowVirtualizer)
  rowVirtualizerRef.current = rowVirtualizer

  // ── Drag-to-select mouse tracking ──
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return
      const container = scrollContainerRef.current
      if (!container) return

      const dx = e.clientX - dragStartRef.current.x
      const dy = e.clientY - dragStartRef.current.y

      // Check threshold
      if (!isDraggingRef.current) {
        if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return
        isDraggingRef.current = true
      }

      // Prevent text selection during drag
      e.preventDefault()

      const containerRect = container.getBoundingClientRect()
      const scrollTop = container.scrollTop
      const headerHeight = 41 // sticky header height

      // Calculate rectangle in container-relative coords (accounting for scroll)
      const startY = dragStartRef.current.y - containerRect.top - headerHeight + dragStartRef.current.scrollTop
      const currentY = e.clientY - containerRect.top - headerHeight + scrollTop

      const rectTop = Math.min(startY, currentY)
      const rectBottom = Math.max(startY, currentY)
      const rectLeft = Math.min(dragStartRef.current.x - containerRect.left, e.clientX - containerRect.left)
      const rectWidth = Math.abs(e.clientX - dragStartRef.current.x)

      setDragRect({
        x: rectLeft,
        y: rectTop,
        w: rectWidth,
        h: rectBottom - rectTop,
      })

      // Find which rows intersect with the drag rectangle
      const items = virtualItemsRef.current
      const matchedIds = new Set<string>()
      for (const vRow of rowVirtualizerRef.current.getVirtualItems()) {
        const item = items[vRow.index]
        if (item.type !== "note") continue
        const rowTop = vRow.start
        const rowBottom = vRow.start + vRow.size
        if (rowBottom > rectTop && rowTop < rectBottom) {
          matchedIds.add(item.note.id)
        }
      }

      // Also check non-visible rows by index range
      const rowHeight = 41
      const firstVisibleIdx = Math.floor(rectTop / rowHeight)
      const lastVisibleIdx = Math.ceil(rectBottom / rowHeight)
      for (let i = Math.max(0, firstVisibleIdx); i < Math.min(items.length, lastVisibleIdx); i++) {
        const item = items[i]
        if (item.type === "note") matchedIds.add(item.note.id)
      }

      setSelectedIds(matchedIds)
    }

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        // Keep the selection, just clear the visual rect
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
  }, []) // stable — reads latest data via refs

  return (
    <main className="flex h-full flex-1 flex-col overflow-hidden bg-background">
      {/* ── Page title ─────────────────────────────────── */}
      <header className="flex shrink-0 items-center justify-between px-5 pt-5 pb-1">
        <h1 className="text-base font-semibold text-foreground">{title ?? "Notes"}</h1>
        {!hideCreateButton && (
          <button
            className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-[14px] font-medium text-accent-foreground transition-colors hover:bg-accent/80"
            onClick={() => createNote(createNoteOverrides ?? {})}
          >
            <Plus className="h-3.5 w-3.5" />
            New note
          </button>
        )}
      </header>

      {/* ── Context tabs + toolbar ─────────────────────── */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-5 pt-1 pb-0">
        {/* Tabs */}
        {showTabs && (
          <div className="flex items-center gap-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-3 py-2 text-[15px] font-medium transition-colors ${
                  effectiveTab === tab.id
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                <span className="ml-1.5 rounded-[3px] bg-white/15 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white">{tabCounts[tab.id]}</span>
                {effectiveTab === tab.id && (
                  <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-accent" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Right toolbar */}
        <div className="flex items-center gap-1.5">
          {/* Search input */}
          <div className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 transition-colors focus-within:border-accent">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[120px] bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground/60 outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-muted-foreground hover:text-foreground">
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </div>

          {viewState.groupBy !== "none" && (
            <button
              onClick={() => updateViewState({ groupBy: "none" })}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[14px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              title="Remove grouping"
            >
              <Layers className="h-4 w-4" />
              <span className="text-[13px]">{GROUP_OPTIONS.find(o => o.value === viewState.groupBy)?.label}</span>
              <X className="h-3 w-3" />
            </button>
          )}

          <FilterButton
            filters={viewState.filters}
            groupBy={viewState.groupBy}
            isSingleStatusTab={isSingleStatusTab}
            folders={folders}
            tags={tags}
            onToggleFilter={toggleFilter}
            onSetFilters={(f) => updateViewState({ filters: f })}
          />

          <Popover open={displayPopoverOpen} onOpenChange={setDisplayPopoverOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[14px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                <SlidersHorizontal className="h-4 w-4" />
                Display
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0" align="end">
              {/* View mode toggle — Linear-style tab buttons */}
              <div className="flex gap-1 border-b border-border px-3 py-2.5">
                <button
                  onClick={() => setViewMode("table")}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-md py-2 text-[14px] font-medium transition-colors ${
                    viewMode === "table" || viewMode === "list"
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <LayoutList className="h-4 w-4" />
                  List
                </button>
                <button
                  onClick={() => {
                    setViewMode("board")
                    if (viewState.groupBy === "none") {
                      updateViewState({ groupBy: "status" })
                    }
                  }}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-md py-2 text-[14px] font-medium transition-colors ${
                    viewMode === "board"
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                  Board
                </button>
                <button
                  onClick={() => setViewMode("insights")}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-md py-2 text-[14px] font-medium transition-colors ${
                    viewMode === "insights"
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <Lightbulb className="h-4 w-4" />
                  Insights
                </button>
                <button
                  onClick={() => setViewMode("calendar")}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-md py-2 text-[14px] font-medium transition-colors ${
                    viewMode === "calendar"
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  Calendar
                </button>
              </div>

              {viewMode !== "insights" && viewMode !== "calendar" && (
                <>
                  {/* Grouping / Columns row */}
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      <span className="text-[15px] text-foreground">{viewMode === "board" ? "Columns" : "Grouping"}</span>
                    </div>
                    <InlineSelect
                      value={viewState.groupBy}
                      options={viewMode === "board" ? GROUP_OPTIONS.filter((o) => o.value !== "none") : GROUP_OPTIONS}
                      onChange={(v) => updateViewState({ groupBy: v })}
                    />
                  </div>

                  {/* Ordering row */}
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                      <span className="text-[15px] text-foreground">Ordering</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <InlineSelect
                        value={viewState.sortField}
                        options={SORT_OPTIONS}
                        onChange={(v) => updateViewState({ sortField: v })}
                      />
                      <button
                        onClick={() => updateViewState({ sortDirection: viewState.sortDirection === "asc" ? "desc" : "asc" })}
                        className="flex items-center justify-center rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        {viewState.sortDirection === "asc"
                          ? <ArrowUp className="h-3.5 w-3.5" />
                          : <ArrowDown className="h-3.5 w-3.5" />
                        }
                      </button>
                    </div>
                  </div>

                  <div className="border-b border-border" />

                  {/* Show empty groups/columns */}
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Columns3 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-[15px] text-foreground">{viewMode === "board" ? "Show empty columns" : "Show empty groups"}</span>
                    </div>
                    <button
                      onClick={() => updateViewState({ showEmptyGroups: !viewState.showEmptyGroups })}
                      className={`relative inline-flex h-[18px] w-[32px] items-center rounded-full transition-colors duration-200 ${
                        viewState.showEmptyGroups ? "bg-accent" : "bg-muted-foreground/20"
                      }`}
                    >
                      <span
                        className={`inline-block h-[14px] w-[14px] rounded-full bg-white shadow-sm transition-transform duration-200 ${
                          viewState.showEmptyGroups ? "translate-x-[16px]" : "translate-x-[2px]"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Display properties (list mode only) */}
                  {viewMode !== "board" && (
                    <>
                      <div className="border-b border-border" />
                      <div>
                        <div className="px-4 pt-3 pb-1.5">
                          <span className="text-[12px] font-semibold text-muted-foreground">Display properties</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 px-4 pb-3">
                          {COLUMN_DEFS.filter((c) => c.id !== "title").map((col) => {
                            const active = visibleCols.includes(col.id)
                            return (
                              <button
                                key={col.id}
                                onClick={() => toggleColumn(col.id)}
                                className={`rounded-md px-2.5 py-1 text-[14px] font-medium transition-colors ${
                                  active
                                    ? "bg-foreground/10 text-foreground border border-foreground/20"
                                    : "border border-border text-muted-foreground/60 hover:text-muted-foreground"
                                }`}
                              >
                                {col.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* ── Filter chip bar (only when filters active) ── */}
      <FilterChipBar
        filters={viewState.filters}
        groupBy={viewState.groupBy}
        isSingleStatusTab={isSingleStatusTab}
        folders={folders}
        tags={tags}
        onToggleFilter={toggleFilter}
        onRemoveFilter={removeFilter}
        onClearAll={() => updateViewState({ filters: [] })}
        onSetFilters={(filters) => updateViewState({ filters })}
      />

      {/* ── Folder indicator ──────────────────────────────── */}
      {folderId && (() => {
        const folderName = folders.find((f) => f.id === folderId)?.name
        return folderName ? (
          <div className="flex shrink-0 items-center gap-1.5 border-b border-border px-5 py-1.5">
            <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[13px] text-foreground">{folderName}</span>
            <button
              onClick={() => setActiveFolderId(null)}
              className="ml-1 rounded-sm p-0.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : null
      })()}

      {/* ── Unlinked helper ─────────────────────────────── */}
      {effectiveTab === "unlinked" && flatNotes.length > 0 && (
        <div className="flex shrink-0 items-center gap-2 border-b border-border px-5 py-3">
          <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[12px] text-muted-foreground">
            These notes have no links. Add <span className="font-mono text-foreground/70">[[wiki-links]]</span> to connect them to your knowledge graph.
          </span>
        </div>
      )}

      {/* ── Table ──────────────────────────────────────── */}
      {virtualItems.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-center">
          <div>
            <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-[15px] text-muted-foreground">No notes found</p>
            <p className="mt-1 text-[14px] text-muted-foreground/60">
              {viewState.filters.length > 0 ? "Try adjusting your filters." : "Create your first note to get started."}
            </p>
          </div>
        </div>
      ) : (
        <div ref={scrollContainerRef} onMouseDown={handleDragMouseDown} className={`flex-1 overflow-y-auto ${dragRect ? "select-none" : ""} ${selectedIds.size > 0 ? "pb-20" : ""}`}>
          {/* Column headers */}
          <div className="sticky top-0 z-10 flex items-center border-b border-border bg-background px-5 py-2">
            <div className="w-8 shrink-0 flex items-center justify-center mr-0.5">
              <div
                className={`h-4 w-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                  selectedIds.size === flatNotes.length && flatNotes.length > 0
                    ? "bg-accent border-accent"
                    : selectedIds.size > 0
                      ? "bg-accent/50 border-accent"
                      : "border-muted-foreground/30 hover:border-muted-foreground/50"
                }`}
                onClick={() => {
                  if (selectedIds.size === flatNotes.length && flatNotes.length > 0) {
                    setSelectedIds(new Set())
                  } else {
                    setSelectedIds(new Set(flatNotes.map(n => n.id)))
                  }
                }}
              >
                {selectedIds.size === flatNotes.length && flatNotes.length > 0 && (
                  <Check className="h-2.5 w-2.5 text-accent-foreground" />
                )}
                {selectedIds.size > 0 && selectedIds.size < flatNotes.length && (
                  <Minus className="h-2.5 w-2.5 text-accent-foreground" />
                )}
              </div>
            </div>
            {COLUMN_DEFS.filter((col) => col.id === "title" || visibleCols.includes(col.id)).map((col) => (
              <div key={col.id} className={col.width + " " + (col.align ?? "")}>
                <TH
                  label={col.label}
                  col={col.sortField}
                  sortCol={viewState.sortField}
                  sortDir={viewState.sortDirection}
                  onSort={handleSort}
                  className={col.align === "text-right" ? "justify-end" : col.align === "text-center" ? "justify-center" : ""}
                />
              </div>
            ))}
          </div>

          {/* Virtualized rows */}
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const item = virtualItems[virtualRow.index]
              return (
                <div
                  key={virtualRow.index}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {item.type === "header" ? (
                    <div className="flex items-center gap-2 px-5 py-3 bg-secondary/30 border-b border-border">
                      <span className="text-[14px] font-semibold text-foreground">{item.label}</span>
                      <span className="text-[12px] text-muted-foreground">{item.count}</span>
                    </div>
                  ) : (
                    <NoteRow
                      note={item.note}
                      folders={folders}
                      links={backlinksMap.get(item.note.id) ?? 0}
                      isActive={activePreviewId === item.note.id}
                      isSelected={selectedIds.has(item.note.id)}
                      selectionActive={selectedIds.size > 0}
                      visibleColumns={visibleCols}
                      onOpen={() => onRowClick ? onRowClick(item.note.id) : openNote(item.note.id)}
                      onClick={(e: React.MouseEvent) => {
                        const flatIndex = flatNotes.findIndex((n) => n.id === item.note.id)
                        handleRowClick(item.note.id, flatIndex, e)
                      }}
                      onDoubleClick={() => openNote(item.note.id)}
                      onStatus={(s) => updateNote(item.note.id, { status: s })}
                      onPriority={(p) => updateNote(item.note.id, { priority: p })}
                      onSetFolder={(folderId) => updateNote(item.note.id, { folderId })}
                      onRemoveFolder={() => updateNote(item.note.id, { folderId: null })}
                      onKeep={() => triageKeep(item.note.id)}
                      onSnooze={(opt) => triageSnooze(item.note.id, getSnoozeTime(opt))}
                      onTrash={() => triageTrash(item.note.id)}
                      onPromote={() => promoteToPermanent(item.note.id)}
                      onDemote={() => undoPromote(item.note.id)}
                      onMoveBack={() => moveBackToInbox(item.note.id)}
                      onRemind={(isoDate) => { setReminder(item.note.id, isoDate); toast("Reminder set") }}
                      onMergeWith={() => setMergePickerOpen(true, item.note.id)}
                      onLinkWith={() => setLinkPickerOpen(true, item.note.id)}
                    />
                  )}
                </div>
              )
            })}
            {/* Drag selection rectangle */}
            {dragRect && (
              <div
                className="absolute bg-accent/10 border border-accent/30 pointer-events-none z-20 rounded-sm"
                style={{
                  left: dragRect.x,
                  top: dragRect.y,
                  width: dragRect.w,
                  height: dragRect.h,
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Floating Action Bar (multi-select) ──────── */}
      {selectedIds.size > 0 && (
        <FloatingActionBar
          selectedIds={selectedIds}
          effectiveTab={effectiveTab}
          notes={flatNotes}
          onClearSelection={() => setSelectedIds(new Set())}
        />
      )}
    </main>
  )
}

/* ── Row ───────────────────────────────────────────────── */

interface NoteRowProps {
  note: Note
  folders: Folder[]
  links: number
  isActive?: boolean
  isSelected?: boolean
  selectionActive?: boolean
  visibleColumns: string[]
  onOpen: () => void
  onClick?: (e: React.MouseEvent) => void
  onDoubleClick?: () => void
  onStatus: (s: NoteStatus) => void
  onPriority: (p: NotePriority) => void
  onSetFolder: (folderId: string) => void
  onRemoveFolder: () => void
  onKeep: () => void
  onSnooze: (opt: SnoozePreset) => void
  onTrash: () => void
  onPromote: () => void
  onDemote: () => void
  onMoveBack: () => void
  onRemind: (isoDate: string) => void
  onMergeWith: () => void
  onLinkWith: () => void
}

function NoteRowInner({
  note,
  folders,
  links,
  isActive,
  isSelected,
  selectionActive,
  visibleColumns,
  onOpen,
  onClick,
  onDoubleClick,
  onStatus,
  onPriority,
  onSetFolder,
  onRemoveFolder,
  onKeep,
  onSnooze,
  onTrash,
  onPromote,
  onDemote,
  onMoveBack,
  onRemind,
  onMergeWith,
  onLinkWith,
}: NoteRowProps) {
  const visibleCols = visibleColumns
  const labels = usePlotStore((s) => s.labels)
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={`group flex items-center px-5 py-3 transition-colors cursor-pointer ${
            isSelected
              ? "bg-accent/5"
              : isActive
                ? "bg-accent/8 border-l-2 border-l-accent"
                : "hover:bg-secondary/20"
          }`}
          onClick={onClick ?? onOpen}
          onDoubleClick={onDoubleClick}
        >
      {/* Checkbox */}
      <div
        data-checkbox
        className={`w-8 h-8 shrink-0 flex items-center justify-center mr-0.5 cursor-pointer rounded ${
          selectionActive || isSelected ? "visible" : "invisible group-hover:visible"
        }`}
        onClick={(e) => {
          e.stopPropagation()
          const syntheticEvent = { ...e, metaKey: true, ctrlKey: true, shiftKey: false } as React.MouseEvent
          onClick?.(syntheticEvent)
        }}
      >
        <div
          className={`h-4 w-4 rounded border flex items-center justify-center transition-colors pointer-events-none ${
            isSelected ? "bg-accent border-accent" : "border-muted-foreground/30 hover:border-muted-foreground/50"
          }`}
        >
          {isSelected && <Check className="h-2.5 w-2.5 text-accent-foreground" />}
        </div>
      </div>

      {/* Name */}
      <div className="flex flex-1 items-center gap-2.5 min-w-0 pr-3">
        <FileText className="h-4 w-4 shrink-0 text-muted-foreground/60" />
        <span className="truncate text-[15px] text-foreground">
          {note.title || "Untitled"}
        </span>
        {(() => {
          const label = note.labelId ? labels.find((l: { id: string; name: string; color: string }) => l.id === note.labelId) : null
          if (label) {
            return (
              <span
                className="shrink-0 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium"
                style={{ backgroundColor: `${label.color}18`, color: label.color }}
              >
                {label.name}
              </span>
            )
          }
          return (
            <span className="shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground/70 bg-muted/50">
              Memo
            </span>
          )
        })()}
        {note.preview.length > 0 && (
          <span
            className="shrink-0 text-[11px] tabular-nums font-medium"
            style={{ color: note.preview.length >= 80 ? "#45d483" : note.preview.length >= 30 ? "#60a5fa" : "#9ca3af" }}
          >
            {note.preview.length >= 120 ? "120+" : note.preview.length}자
          </span>
        )}
        {links === 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="shrink-0 flex items-center gap-0.5 text-[11px] text-muted-foreground/50">
                <Link2 className="h-2.5 w-2.5" />
              </span>
            </TooltipTrigger>
            <TooltipContent className="text-[12px]">Add at least 1 link to reduce orphan notes.</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Status */}
      {visibleCols.includes("status") && (
        <div className="w-[120px] shrink-0 flex items-center justify-end">
          <StatusBadge status={note.status} />
        </div>
      )}

      {/* Folder */}
      {visibleCols.includes("folder") && (
        <div className="w-[80px] shrink-0 flex items-center justify-center">
          {note.folderId ? (() => {
            const folder = folders.find((f: Folder) => f.id === note.folderId)
            if (!folder) return <span className="text-[15px] text-muted-foreground/30">—</span>
            return (
              <span className="text-[12px] text-muted-foreground truncate">{folder.name}</span>
            )
          })() : (
            <span className="text-[15px] text-muted-foreground/30">—</span>
          )}
        </div>
      )}

      {/* Links */}
      {visibleCols.includes("links") && (
        <div className="w-[56px] shrink-0 text-center">
          <span className={`text-[15px] tabular-nums ${links === 0 ? "text-muted-foreground/30" : "text-muted-foreground"}`}>
            {links}
          </span>
        </div>
      )}

      {/* Reads */}
      {visibleCols.includes("reads") && (
        <div className="w-[56px] shrink-0 text-center">
          <span className={`text-[15px] tabular-nums ${note.reads === 0 ? "text-muted-foreground/30" : "text-muted-foreground"}`}>
            {note.reads}
          </span>
        </div>
      )}

      {/* Priority */}
      {visibleCols.includes("priority") && (
        <div className="w-[72px] shrink-0 flex justify-center">
          {note.priority === "urgent" && <ChevronsUp className="h-4 w-4 text-red-400" />}
          {note.priority === "high" && <ChevronUp className="h-4 w-4 text-orange-400" />}
          {note.priority === "medium" && <Minus className="h-4 w-4 text-yellow-400" />}
          {note.priority === "low" && <ChevronDown className="h-4 w-4 text-blue-400" />}
          {(!note.priority || note.priority === "none") && <span className="text-[14px] text-muted-foreground">—</span>}
        </div>
      )}

      {/* Updated - relative time like Linear */}
      {visibleCols.includes("updatedAt") && (
        <div className="w-[80px] shrink-0 text-right">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-[15px] tabular-nums text-muted-foreground cursor-default">
                {shortRelative(note.updatedAt)}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[12px]">
              {format(new Date(note.updatedAt), "MMM d, yyyy 'at' h:mm a")}
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Created - absolute date like Linear */}
      {visibleCols.includes("createdAt") && (
        <div className="w-[80px] shrink-0 text-right">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-[15px] tabular-nums text-muted-foreground cursor-default">
                {absDate(note.createdAt)}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[12px]">
              {format(new Date(note.createdAt), "MMM d, yyyy 'at' h:mm a")}
            </TooltipContent>
          </Tooltip>
        </div>
      )}
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-52">
        {/* Inbox actions */}
        {note.status === "inbox" && note.triageStatus !== "trashed" && (
          <>
            <ContextMenuItem onClick={onKeep} className="text-[14px]">
              <Check className="h-4 w-4 mr-2 text-accent" />
              Done
              <span className="ml-auto text-[11px] text-muted-foreground">D</span>
            </ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger className="text-[14px]">
                <AlarmClock className="h-4 w-4 mr-2 text-muted-foreground" />
                Snooze
                <span className="ml-auto text-[11px] text-muted-foreground">S</span>
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-44">
                <ContextMenuItem onClick={() => onSnooze("3h")} className="text-[14px]">
                  3 hours
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onSnooze("tomorrow")} className="text-[14px]">
                  Tomorrow 10:00 AM
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onSnooze("3-days")} className="text-[14px]">
                  In 3 days
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onSnooze("next-week")} className="text-[14px]">
                  Next week 10:00 AM
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onSnooze("1-week")} className="text-[14px]">
                  In 1 week
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuItem onClick={onTrash} className="text-[14px] text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Trash
              <span className="ml-auto text-[11px]">T</span>
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}

        {/* Capture actions */}
        {note.status === "capture" && (
          <>
            <ContextMenuItem onClick={onPromote} className="text-[14px]">
              <ArrowUpRight className="h-4 w-4 mr-2 text-[#45d483]" />
              Promote to Permanent
              <span className="ml-auto text-[11px] text-muted-foreground">P</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={onMoveBack} className="text-[14px]">
              <Inbox className="h-4 w-4 mr-2 text-muted-foreground" />
              Back to Inbox
              <span className="ml-auto text-[11px] text-muted-foreground">B</span>
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}

        {/* Permanent actions */}
        {note.status === "permanent" && (
          <>
            <ContextMenuItem onClick={onDemote} className="text-[14px]">
              <ArrowDownLeft className="h-4 w-4 mr-2 text-muted-foreground" />
              Demote to Capture
              <span className="ml-auto text-[11px] text-muted-foreground">D</span>
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}

        {/* Remind me (all notes) */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="text-[14px]">
            <Bell className="h-4 w-4 mr-2 text-muted-foreground" />
            Remind me
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem onClick={() => onRemind(getSnoozeTime("3h"))} className="text-[14px]">
              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>Later today</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onRemind(getSnoozeTime("tomorrow"))} className="text-[14px]">
              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>Tomorrow</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onRemind(getSnoozeTime("3-days"))} className="text-[14px]">
              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>In 3 days</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onRemind(getSnoozeTime("next-week"))} className="text-[14px]">
              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>Next week</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onRemind(getSnoozeTime("1-week"))} className="text-[14px]">
              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>In 1 week</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />

        {/* Common actions */}
        <ContextMenuItem onClick={onOpen} className="text-[14px]">
          <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
          Open
        </ContextMenuItem>
        <ContextMenuItem onClick={onMergeWith} className="text-[14px]">
          <Merge className="h-4 w-4 mr-2 text-muted-foreground" />
          Merge with...
        </ContextMenuItem>
        <ContextMenuItem onClick={onLinkWith} className="text-[14px]">
          <Link2 className="h-4 w-4 mr-2 text-muted-foreground" />
          Link to...
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

const NoteRow = memo(NoteRowInner, (prev, next) =>
  prev.note.id === next.note.id &&
  prev.note.updatedAt === next.note.updatedAt &&
  prev.note.status === next.note.status &&
  prev.note.priority === next.note.priority &&
  prev.note.folderId === next.note.folderId &&
  prev.note.reads === next.note.reads &&
  prev.note.title === next.note.title &&
  prev.links === next.links &&
  prev.isActive === next.isActive &&
  prev.isSelected === next.isSelected &&
  prev.selectionActive === next.selectionActive &&
  prev.visibleColumns === next.visibleColumns
)
