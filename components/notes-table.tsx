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
  Check,
  AlarmClock,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  Inbox,
  MoreHorizontal,
  Bell,
  Clock,
  Merge,
  Minus,
  FolderOpen,
  RotateCcw,
  Globe,
  Download,
  Share2,
  Zap,
  Pencil,
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
import { usePlotStore } from "@/lib/store"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { getSnoozeTime, type SnoozePreset } from "@/lib/queries/notes"
import { useNotesView } from "@/lib/view-engine/use-notes-view"
import type { ViewContextKey, ViewMode, SortField, SortDirection, GroupBy, FilterRule, NoteGroup } from "@/lib/view-engine/types"
import { StatusDropdown, StatusBadge } from "@/components/note-fields"
import { format } from "date-fns"
import { shortRelative } from "@/lib/format-utils"
import type { Note, NoteStatus, Folder, NoteSource, Tag, Label, NoteTemplate } from "@/lib/types"
import { toast } from "sonner"
import { FloatingActionBar } from "@/components/floating-action-bar"
import { FilterChipBar } from "@/components/filter-bar"
import { ViewHeader } from "@/components/view-header"
import { FilterPanel } from "@/components/filter-panel"
import { DisplayPanel } from "@/components/display-panel"
import { ViewDistributionPanel } from "@/components/view-distribution-panel"
import type { DistributionItem } from "@/components/view-distribution-panel"
import { NOTES_VIEW_CONFIG } from "@/lib/view-engine/view-configs"
import { setActiveFolderId } from "@/lib/table-route"
import { setNoteDragData } from "@/lib/drag-helpers"
import { NOTE_STATUS_HEX } from "@/lib/colors"
import { pushUndo } from "@/lib/undo-manager"

/* ── Helpers ───────────────────────────────────────────── */

function absDate(dateStr: string): string {
  return format(new Date(dateStr), "MMM d")
}

/* ── Trash sub-filter tabs ────────────────────────────── */

type TrashFilter = "all" | "notes" | "wiki" | "tags" | "labels" | "templates"

const TRASH_TABS: { id: TrashFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "notes", label: "Notes" },
  { id: "wiki", label: "Wiki" },
  { id: "tags", label: "Tags" },
  { id: "labels", label: "Labels" },
  { id: "templates", label: "Templates" },
]

/* ── Column + group config ─────────────────────────────── */

const SORT_FIELD_LABELS: Record<SortField, string> = {
  updatedAt: "Updated",
  createdAt: "Created",
  priority: "Priority",
  title: "Name",
  status: "Status",
  links: "Links",
  reads: "Reads",
  folder: "Folder",
  label: "Label",
}

const COLUMN_DEFS: { id: string; label: string; width: string; align?: string; sortField: SortField; minWidth?: number }[] = [
  { id: "title", label: "Name", width: "flex-1 min-w-0", sortField: "title" },
  { id: "status", label: "Status", width: "w-[120px] shrink-0", align: "text-right", sortField: "status", minWidth: 400 },
  { id: "folder", label: "Folder", width: "w-[80px] shrink-0", align: "text-center", sortField: "folder", minWidth: 560 },
  { id: "links", label: "Links", width: "w-[56px] shrink-0", align: "text-center", sortField: "links", minWidth: 640 },
  { id: "reads", label: "Reads", width: "w-[56px] shrink-0", align: "text-center", sortField: "reads", minWidth: 720 },
  { id: "updatedAt", label: "Updated", width: "w-[80px] shrink-0", align: "text-right", sortField: "updatedAt", minWidth: 280 },
  { id: "createdAt", label: "Created", width: "w-[80px] shrink-0", align: "text-right", sortField: "createdAt", minWidth: 800 },
]

/* ── Virtual item type ─────────────────────────────────── */

type VirtualItem =
  | { type: "header"; label: string; count: number; groupKey: string; groupBy: GroupBy }
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
      className={`group/th inline-flex items-center gap-1 text-[11px] uppercase tracking-wider font-medium text-muted-foreground/30 transition-colors hover:text-muted-foreground/60 ${className}`}
      onClick={() => onSort(col)}
    >
      {label}
      {active ? (
        sortDir === "asc" ? <ArrowUp className="h-2.5 w-2.5 text-muted-foreground/50" /> : <ArrowDown className="h-2.5 w-2.5 text-muted-foreground/50" />
      ) : (
        <ArrowUpDown className="h-2.5 w-2.5 opacity-0 group-hover/th:opacity-50" />
      )}
    </button>
  )
}

/* ── TrashEntityList ───────────────────────────────────── */

function TrashEntityList({ type }: { type: "tags" | "labels" | "templates" }) {
  const store = usePlotStore()

  const items: (Tag | Label | NoteTemplate)[] = type === "tags"
    ? (store.tags || []).filter((t: Tag) => t.trashed)
    : type === "labels"
    ? (store.labels || []).filter((l: Label) => l.trashed)
    : (store.templates || []).filter((t: NoteTemplate) => t.trashed)

  const handleRestore = (id: string) => {
    if (type === "tags") store.restoreTag(id)
    else if (type === "labels") store.restoreLabel(id)
    else store.restoreTemplate(id)
    toast(`Restored ${type.slice(0, -1)}`)
  }

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Permanently delete "${name}"? This cannot be undone.`)) return
    if (type === "tags") store.permanentlyDeleteTag(id)
    else if (type === "labels") store.permanentlyDeleteLabel(id)
    else store.permanentlyDeleteTemplate(id)
    toast(`Deleted ${type.slice(0, -1)}`)
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-center">
        <div>
          <Trash2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-ui text-muted-foreground">No trashed {type}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header row */}
      <div className="sticky top-0 z-10 flex items-center border-b border-border bg-background px-5 py-2">
        <div className="flex-1 text-sm font-medium text-muted-foreground">Name</div>
        <div className="w-16 shrink-0 text-center text-sm font-medium text-muted-foreground">Color</div>
        <div className="w-32 shrink-0 text-right text-sm font-medium text-muted-foreground">Trashed</div>
        <div className="w-32 shrink-0 text-right text-sm font-medium text-muted-foreground">Actions</div>
      </div>
      {items.map((item) => {
        const color = (item as Tag).color ?? ""
        const trashedAt = (item as Tag).trashedAt ?? null
        return (
          <div
            key={item.id}
            className="flex items-center border-b border-border px-5 py-2.5 hover:bg-secondary/30 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-foreground truncate">{item.name}</span>
            </div>
            <div className="w-16 shrink-0 flex items-center justify-center">
              {color ? (
                <span
                  className="h-3.5 w-3.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </div>
            <div className="w-32 shrink-0 text-right text-sm text-muted-foreground">
              {trashedAt ? shortRelative(trashedAt) : "—"}
            </div>
            <div className="w-32 shrink-0 flex items-center justify-end gap-1.5">
              <button
                onClick={() => handleRestore(item.id)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                title="Restore"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Restore
              </button>
              <button
                onClick={() => handleDelete(item.id, item.name)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-destructive transition-colors hover:bg-destructive/10"
                title="Delete permanently"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── NotesTable ────────────────────────────────────────── */

export function NotesTable({
  onRowClick,
  activePreviewId,
  context,
  title,
  createNoteOverrides,
  hideCreateButton = false,
  folderId,
  tagId,
  labelId,
}: {
  onRowClick?: (noteId: string) => void
  activePreviewId?: string | null
  context?: ViewContextKey
  title?: string
  createNoteOverrides?: Partial<import("@/lib/types").Note>
  hideCreateButton?: boolean
  folderId?: string
  tagId?: string
  labelId?: string
}) {
  const notes = usePlotStore((s) => s.notes)
  const updateNote = usePlotStore((s) => s.updateNote)
  const openNote = usePlotStore((s) => s.openNote)
  const createNote = usePlotStore((s) => s.createNote)
  const toggleTrash = usePlotStore((s) => s.toggleTrash)
  const deleteNote = usePlotStore((s) => s.deleteNote)
  const triageKeep = usePlotStore((s) => s.triageKeep)
  const triageSnooze = usePlotStore((s) => s.triageSnooze)
  const triageTrash = usePlotStore((s) => s.triageTrash)
  const promoteToPermanent = usePlotStore((s) => s.promoteToPermanent)
  const undoPromote = usePlotStore((s) => s.undoPromote)
  const moveBackToInbox = usePlotStore((s) => s.moveBackToInbox)
  const setReminder = usePlotStore((s) => s.setReminder)
  const setMergePickerOpen = usePlotStore((s) => s.setMergePickerOpen)
  const setLinkPickerOpen = usePlotStore((s) => s.setLinkPickerOpen)

  const [trashFilter, setTrashFilter] = useState<TrashFilter>("all")

  const effectiveTab = context ?? "all"
  const isTrashView = effectiveTab === "trash"

  const backlinksMap = useBacklinksIndex()

  const folders = usePlotStore((s) => s.folders)
  const labels = usePlotStore((s) => s.labels)
  const tags = usePlotStore((s) => s.tags)

  const searchQuery = usePlotStore((s) => s.searchQuery)
  const setSearchQuery = usePlotStore((s) => s.setSearchQuery)

  const { flatNotes: rawFlatNotes, groups: rawGroups, viewState, updateViewState } = useNotesView(effectiveTab, { backlinksMap, folderId, tagId, labelId })

  // ── Trash sub-filter ──
  const storeTemplates = usePlotStore((s) => s.templates)
  const trashTabCounts = useMemo((): Record<TrashFilter, number> => {
    if (!isTrashView) return { all: 0, notes: 0, wiki: 0, tags: 0, labels: 0, templates: 0 }
    const trashed = notes.filter((n) => n.trashed)
    const trashedTags = tags.filter((t) => t.trashed)
    const trashedLabels = labels.filter((l) => l.trashed)
    const trashedTemplates = storeTemplates.filter((t) => t.trashed)
    return {
      all: trashed.length + trashedTags.length + trashedLabels.length + trashedTemplates.length,
      notes: trashed.filter((n) => !n.isWiki).length,
      wiki: trashed.filter((n) => n.isWiki).length,
      tags: trashedTags.length,
      labels: trashedLabels.length,
      templates: trashedTemplates.length,
    }
  }, [notes, isTrashView, tags, labels, storeTemplates])

  const trashFilterFn = useCallback((note: Note): boolean => {
    if (!isTrashView || trashFilter === "all") return true
    if (trashFilter === "wiki") return note.isWiki === true
    return !note.isWiki
  }, [isTrashView, trashFilter])

  const flatNotes = useMemo(
    () => rawFlatNotes.filter(trashFilterFn),
    [rawFlatNotes, trashFilterFn]
  )

  const groups = useMemo(
    () => isTrashView && trashFilter !== "all"
      ? rawGroups.map((g) => ({ ...g, notes: g.notes.filter(trashFilterFn) }))
      : rawGroups,
    [rawGroups, isTrashView, trashFilter, trashFilterFn]
  )

  // ── Multi-select state ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const lastClickedRef = useRef<number | null>(null)

  // ── Distribution panel state ──
  const [showDistribution, setShowDistribution] = useState(false)

  // ── Group collapse state ──
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const toggleGroupCollapse = useCallback((groupKey: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupKey)) next.delete(groupKey)
      else next.add(groupKey)
      return next
    })
  }, [])

  // Drag selection
  const [dragRect, setDragRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const dragStartRef = useRef<{ x: number; y: number; scrollTop: number } | null>(null)
  const isDraggingRef = useRef(false)

  // Clear selection on tab change
  useEffect(() => { setSelectedIds(new Set()) }, [effectiveTab])

  // Clear collapsed groups when groupBy changes
  useEffect(() => { setCollapsedGroups(new Set()) }, [viewState.groupBy])

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

  // ── Dynamic filter categories (merge static config with store data) ──
  const notesFilterCategories = useMemo(() => {
    return NOTES_VIEW_CONFIG.filterCategories.map(cat => {
      if (cat.key === "folder") {
        return { ...cat, values: folders.map(f => ({ key: f.id, label: f.name, count: notes.filter(n => !n.trashed && !n.archived && n.folderId === f.id).length })) }
      }
      if (cat.key === "label") {
        return { ...cat, values: labels.filter(l => !l.trashed).map(l => ({ key: l.id, label: l.name, color: l.color, count: notes.filter(n => !n.trashed && !n.archived && n.labelId === l.id).length })) }
      }
      if (cat.key === "tags") {
        return { ...cat, values: tags.filter(t => !t.trashed).map(t => ({ key: t.id, label: t.name, count: notes.filter(n => !n.trashed && !n.archived && n.tags?.includes(t.id)).length })) }
      }
      if (cat.key === "status") {
        return { ...cat, values: cat.values.map(v => ({ ...v, count: notes.filter(n => !n.trashed && !n.archived && n.status === v.key).length })) }
      }
      return cat
    })
  }, [folders, labels, tags, notes])

  // ── Filter toggle handler for FilterPanel ──
  const handleFilterToggle = useCallback((rule: FilterRule) => {
    const exists = viewState.filters.some(
      f => f.field === rule.field && f.operator === rule.operator && f.value === rule.value
    )
    const newFilters = exists
      ? viewState.filters.filter(f => !(f.field === rule.field && f.operator === rule.operator && f.value === rule.value))
      : [...viewState.filters, rule]
    updateViewState({ filters: newFilters })
  }, [viewState.filters, updateViewState])

  // ── Distribution panel data ──
  const getDistribution = useCallback((tabKey: string): DistributionItem[] => {
    switch (tabKey) {
      case "status": {
        const counts: Record<string, number> = {}
        for (const n of flatNotes) {
          counts[n.status] = (counts[n.status] ?? 0) + 1
        }
        return Object.entries(counts).map(([key, count]) => ({
          key,
          label: key.charAt(0).toUpperCase() + key.slice(1),
          count,
        }))
      }
      case "folder": {
        const counts: Record<string, number> = {}
        const noFolder = flatNotes.filter(n => !n.folderId).length
        for (const n of flatNotes) {
          if (n.folderId) counts[n.folderId] = (counts[n.folderId] ?? 0) + 1
        }
        const items: DistributionItem[] = Object.entries(counts).map(([fId, count]) => ({
          key: fId,
          label: folders.find(f => f.id === fId)?.name ?? "Unknown",
          count,
        }))
        if (noFolder > 0) items.push({ key: "__none__", label: "No folder", count: noFolder })
        return items
      }
      case "tags": {
        const counts: Record<string, number> = {}
        for (const n of flatNotes) {
          for (const tId of n.tags) {
            counts[tId] = (counts[tId] ?? 0) + 1
          }
        }
        return Object.entries(counts).map(([tId, count]) => ({
          key: tId,
          label: tags.find(t => t.id === tId)?.name ?? "Unknown",
          count,
        }))
      }
      case "labels": {
        const counts: Record<string, number> = {}
        const noLabel = flatNotes.filter(n => !n.labelId).length
        for (const n of flatNotes) {
          if (n.labelId) counts[n.labelId] = (counts[n.labelId] ?? 0) + 1
        }
        const items: DistributionItem[] = Object.entries(counts).map(([lId, count]) => ({
          key: lId,
          label: labels.find(l => l.id === lId)?.name ?? "Unknown",
          color: labels.find(l => l.id === lId)?.color,
          count,
        }))
        if (noLabel > 0) items.push({ key: "__none__", label: "No label", count: noLabel })
        return items
      }
      default:
        return []
    }
  }, [flatNotes, folders, tags, labels])

  const handleDistributionItemClick = useCallback((tabKey: string, itemKey: string) => {
    const fieldMap: Record<string, FilterRule["field"]> = {
      status: "status",
      folder: "folder",
      tags: "tags",
      labels: "label",
    }
    const field = fieldMap[tabKey]
    if (!field) return
    const rule: FilterRule = { field, operator: "eq", value: itemKey }
    const exists = viewState.filters.some(
      f => f.field === rule.field && f.operator === rule.operator && f.value === rule.value
    )
    if (!exists) {
      updateViewState({ filters: [...viewState.filters, rule] })
    }
  }, [viewState.filters, updateViewState])

  const distributionTabs = useMemo(() => [
    { key: "status", label: "Status" },
    { key: "folder", label: "Folder" },
    { key: "tags", label: "Tags" },
    { key: "labels", label: "Labels" },
  ], [])

  // ── Side peek state for detail panel ──
  const sidePeekNoteId = usePlotStore((s) => s.sidePanelPeekNoteId)
  const setSidePeekNoteId = usePlotStore((s) => s.openSidePeek)

  function toggleColumn(colId: string) {
    const cols = viewState.visibleColumns
    const next = cols.includes(colId)
      ? cols.filter((c) => c !== colId)
      : [...cols, colId]
    updateViewState({ visibleColumns: next })
  }

  const visibleCols = viewState.visibleColumns

  // ── Container width tracking (for responsive column hiding) ──
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(1200)

  useEffect(() => {
    const el = tableContainerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 1200
      setContainerWidth(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const effectiveVisibleCols = useMemo(() => {
    return visibleCols.filter((colId) => {
      const def = COLUMN_DEFS.find((c) => c.id === colId)
      if (!def || !def.minWidth) return true // title always visible
      return containerWidth >= def.minWidth
    })
  }, [visibleCols, containerWidth])

  const isCompact = containerWidth < 480

  const virtualItems = useMemo((): VirtualItem[] => {
    if (viewState.groupBy === "none") {
      return flatNotes.map((note) => ({ type: "note" as const, note }))
    }
    const items: VirtualItem[] = []
    for (const group of groups) {
      if (group.notes.length === 0 && !viewState.showEmptyGroups) continue
      items.push({ type: "header", label: group.label, count: group.notes.length, groupKey: group.key, groupBy: viewState.groupBy })
      if (!collapsedGroups.has(group.key)) {
        for (const note of group.notes) {
          items.push({ type: "note", note })
        }
      }
    }
    return items
  }, [flatNotes, groups, viewState.groupBy, viewState.showEmptyGroups, collapsedGroups])

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: virtualItems.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: (i) => virtualItems[i].type === "header" ? 36 : (viewState.viewMode === "list" ? 40 : 44),
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
      const rowHeight = 44
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
    <main ref={tableContainerRef} className="flex h-full flex-1 flex-col overflow-hidden bg-background">
      {/* ── Page title ─────────────────────────────────── */}
      <ViewHeader
        icon={<FileText className="h-5 w-5" strokeWidth={1.5} />}
        title={title ?? "Notes"}
        count={flatNotes.length}
        searchPlaceholder="Search..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        actions={
          !hideCreateButton && (
            <button
              className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/80"
              onClick={() => createNote(createNoteOverrides ?? {})}
            >
              <Plus className="h-3.5 w-3.5" />
              {!isCompact && "New note"}
            </button>
          )
        }
        showFilter
        hasActiveFilters={viewState.filters.length > 0}
        filterContent={
          <FilterPanel
            categories={notesFilterCategories}
            activeFilters={viewState.filters}
            onToggle={handleFilterToggle}
            quickFilters={NOTES_VIEW_CONFIG.quickFilters as any}
            onQuickFilter={(rules) => updateViewState({ filters: rules })}
          />
        }
        showDisplay
        displayContent={
          <DisplayPanel
            config={NOTES_VIEW_CONFIG.displayConfig}
            viewState={viewState}
            onViewStateChange={(patch) => updateViewState(patch)}
            showViewMode
          />
        }
        showDetailPanel
        detailPanelOpen={showDistribution}
        onDetailPanelToggle={() => setShowDistribution(!showDistribution)}
      >
        {/* Trash sub-filter tabs */}
        {isTrashView && (
          <div className="flex shrink-0 items-center gap-0 border-b border-border px-5 pt-1 pb-0">
            {TRASH_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTrashFilter(tab.id)}
                className={`relative px-3 py-2 text-ui font-medium transition-colors ${
                  trashFilter === tab.id
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                <span className="ml-1.5 rounded-[3px] bg-white/15 px-1.5 py-0.5 text-2xs font-medium tabular-nums text-white">{trashTabCounts[tab.id]}</span>
                {trashFilter === tab.id && (
                  <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-accent" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* ── Filter chip bar (only when filters active) ── */}
        <FilterChipBar
          filters={viewState.filters}
          groupBy={viewState.groupBy}
          isSingleStatusTab={isSingleStatusTab}
          folders={folders}
          tags={tags.filter((t) => !t.trashed)}
          labels={labels.filter((l) => !l.trashed)}
          onToggleFilter={toggleFilter}
          onRemoveFilter={removeFilter}
          onClearAll={() => updateViewState({ filters: [] })}
          onSetFilters={(filters) => updateViewState({ filters })}
        />

        {/* ── Sort order chip ── */}
        {viewState.sortField !== "updatedAt" && (
          <div className="flex items-center px-5 pb-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border border-accent/30 bg-accent/10 text-accent text-[12px] font-medium">
              Order by {SORT_FIELD_LABELS[viewState.sortField]}
              <span>{viewState.sortDirection === "asc" ? "↑" : "↓"}</span>
              <button
                onClick={() => updateViewState({ sortField: "updatedAt", sortDirection: "desc" })}
                className="ml-0.5 hover:text-accent/80 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          </div>
        )}
      </ViewHeader>

      <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-1 flex-col overflow-hidden">

      {/* ── Folder indicator ──────────────────────────────── */}
      {folderId && (() => {
        const folderName = folders.find((f) => f.id === folderId)?.name
        return folderName ? (
          <div className="flex shrink-0 items-center gap-1.5 border-b border-border px-5 py-1.5">
            <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-note text-foreground">{folderName}</span>
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
          <span className="text-xs text-muted-foreground">
            These notes have no links. Add <span className="font-mono text-foreground/70">[[wiki-links]]</span> to connect them to your knowledge graph.
          </span>
        </div>
      )}

      {/* ── Entity trash list OR Note table ────────────── */}
      {isTrashView && (trashFilter === "tags" || trashFilter === "labels" || trashFilter === "templates") ? (
        <TrashEntityList type={trashFilter} />
      ) : (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="flex-1 flex flex-col">
            {virtualItems.length === 0 ? (
              <div className="flex flex-1 items-center justify-center text-center">
                <div>
                  <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                  <p className="text-ui text-muted-foreground">
                    {context === "trash" ? "Trash is empty" : "No notes found"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground/60">
                    {context === "trash"
                      ? "Deleted notes will appear here."
                      : viewState.filters.length > 0
                        ? "Try adjusting your filters."
                        : "Create your first note to get started."}
                  </p>
                </div>
              </div>
            ) : (
              <div ref={scrollContainerRef} onMouseDown={handleDragMouseDown} className={`flex-1 overflow-y-auto ${dragRect ? "select-none" : ""} ${selectedIds.size > 0 ? "pb-20" : ""}`}>
                {/* Column headers (table mode — removed, never renders) */}
                {(viewState.viewMode as string) === "table" && (
                <div className="sticky top-0 z-10 flex items-center border-b border-border/30 bg-background px-5 py-2.5">
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
                  {COLUMN_DEFS.filter((col) => col.id === "title" || effectiveVisibleCols.includes(col.id)).map((col) => (
                    <div key={col.id} className={col.width + " " + (col.align ?? "")}>
                      <TH
                        label={col.label}
                        col={col.sortField}
                        sortCol={viewState.sortField}
                        sortDir={viewState.sortDirection}
                        onSort={handleSort}
                        className={`${col.align === "text-right" ? "justify-end" : col.align === "text-center" ? "justify-center" : ""} ${isCompact ? "!text-xs" : ""}`}
                      />
                    </div>
                  ))}
                </div>
                )}

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
                          viewState.viewMode === "list" ? (
                          <div
                            className="flex items-center gap-2.5 px-5 py-2 border-b border-border/50 cursor-pointer select-none hover:bg-secondary/20 transition-colors"
                            onClick={() => toggleGroupCollapse(item.groupKey)}
                          >
                            <ChevronDown className={`h-3 w-3 text-muted-foreground/60 transition-transform ${collapsedGroups.has(item.groupKey) ? "-rotate-90" : ""}`} />
                            <GroupHeaderIcon groupBy={item.groupBy} groupKey={item.groupKey} label={item.label} folders={folders} labels={labels} />
                            <span className="text-[12px] font-semibold text-foreground/80 tracking-wider">
                              {resolveGroupLabel(item.groupBy, item.groupKey, item.label, folders, labels)}
                            </span>
                            <span className="text-[11px] text-muted-foreground/50 tabular-nums">{item.count}</span>
                          </div>
                          ) : (
                          <div
                            className="flex items-center gap-2 px-5 py-2.5 bg-secondary/20 border-b border-border/30 cursor-pointer select-none hover:bg-secondary/30 transition-colors"
                            onClick={() => toggleGroupCollapse(item.groupKey)}
                          >
                            <ChevronDown className={`h-3 w-3 text-muted-foreground/60 transition-transform ${collapsedGroups.has(item.groupKey) ? "-rotate-90" : ""}`} />
                            <GroupHeaderIcon groupBy={item.groupBy} groupKey={item.groupKey} label={item.label} folders={folders} labels={labels} />
                            <span className="text-[12px] font-semibold text-foreground/80 tracking-wider">
                              {resolveGroupLabel(item.groupBy, item.groupKey, item.label, folders, labels)}
                            </span>
                            <span className="text-[11px] text-muted-foreground/50 tabular-nums">{item.count}</span>
                          </div>
                          )
                        ) : (
                          <NoteRow
                            note={item.note}
                            folders={folders}
                            links={backlinksMap.get(item.note.id) ?? 0}
                            isActive={activePreviewId === item.note.id}
                            isSelected={selectedIds.has(item.note.id)}
                            selectionActive={selectedIds.size > 0}
                            visibleColumns={effectiveVisibleCols}
                            isCompact={isCompact}
                            viewMode={viewState.viewMode}
                            onOpen={() => onRowClick ? onRowClick(item.note.id) : openNote(item.note.id)}
                            onClick={(e: React.MouseEvent) => {
                              const flatIndex = flatNotes.findIndex((n) => n.id === item.note.id)
                              handleRowClick(item.note.id, flatIndex, e)
                            }}
                            onDoubleClick={() => openNote(item.note.id)}
                            onStatus={(s) => updateNote(item.note.id, { status: s })}
                            onSetFolder={(folderId) => updateNote(item.note.id, { folderId })}
                            onRemoveFolder={() => updateNote(item.note.id, { folderId: null })}
                            onKeep={() => { triageKeep(item.note.id); pushUndo("Triage to Capture", () => moveBackToInbox(item.note.id)) }}
                            onSnooze={(opt) => triageSnooze(item.note.id, getSnoozeTime(opt))}
                            onTrash={() => { triageTrash(item.note.id); pushUndo("Trash note", () => toggleTrash(item.note.id)) }}
                            onPromote={() => { promoteToPermanent(item.note.id); pushUndo("Promote to Permanent", () => undoPromote(item.note.id)) }}
                            onDemote={() => { undoPromote(item.note.id); pushUndo("Demote to Capture", () => promoteToPermanent(item.note.id)) }}
                            onMoveBack={() => { moveBackToInbox(item.note.id); pushUndo("Move back to Inbox", () => triageKeep(item.note.id)) }}
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
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
            {context === "trash" ? (
              <>
                <ContextMenuItem
                  onClick={() => {
                    const noteIds = flatNotes.map((n) => n.id)
                    flatNotes.forEach((n) => toggleTrash(n.id))
                    pushUndo(`Restore ${flatNotes.length} note${flatNotes.length !== 1 ? "s" : ""}`, () => noteIds.forEach((id) => toggleTrash(id)))
                    toast(`Restored ${flatNotes.length} note${flatNotes.length !== 1 ? "s" : ""}`)
                  }}
                  disabled={flatNotes.length === 0}
                  className="text-sm"
                >
                  <RotateCcw className="h-4 w-4 mr-2 text-muted-foreground" />
                  Restore all
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                  onClick={() => {
                    if (window.confirm(`Permanently delete ${flatNotes.length} note${flatNotes.length !== 1 ? "s" : ""}? This cannot be undone.`)) {
                      flatNotes.forEach((n) => deleteNote(n.id))
                      toast(`Permanently deleted ${flatNotes.length} note${flatNotes.length !== 1 ? "s" : ""}`)
                    }
                  }}
                  disabled={flatNotes.length === 0}
                  className="text-sm text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Empty trash
                </ContextMenuItem>
              </>
            ) : (
              <ContextMenuItem
                onClick={() => {
                  const id = createNote(createNoteOverrides ?? {})
                  openNote(id)
                }}
                className="text-sm"
              >
                <Plus className="h-4 w-4 mr-2 text-muted-foreground" />
                New note
              </ContextMenuItem>
            )}
          </ContextMenuContent>
        </ContextMenu>
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
      </div>
      {showDistribution && (
        <ViewDistributionPanel
          tabs={distributionTabs}
          getDistribution={getDistribution}
          onItemClick={handleDistributionItemClick}
          onClose={() => setShowDistribution(false)}
        />
      )}
      </div>
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
  isCompact?: boolean
  viewMode?: ViewMode
  visibleColumns: string[]
  onOpen: () => void
  onClick?: (e: React.MouseEvent) => void
  onDoubleClick?: () => void
  onStatus: (s: NoteStatus) => void
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

function SourceIcon({ source }: { source: NoteSource }) {
  const Icon = {
    manual: Pencil,
    webclip: Globe,
    import: Download,
    share: Share2,
    api: Zap,
  }[source ?? "manual"]
  if (!Icon) return null
  return <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" strokeWidth={1.5} />
}

const STATUS_DOT_COLORS: Record<NoteStatus, string> = {
  inbox: NOTE_STATUS_HEX.inbox,
  capture: NOTE_STATUS_HEX.capture,
  permanent: NOTE_STATUS_HEX.permanent,
}

/** Status icon with shape differentiation (Linear-style) */
function StatusShapeIcon({ status, size = 8 }: { status: NoteStatus; size?: number }) {
  const color = STATUS_DOT_COLORS[status]
  if (status === "inbox") {
    // ○ Empty circle — not yet processed
    return (
      <svg width={size} height={size} viewBox="0 0 8 8" className="shrink-0">
        <circle cx="4" cy="4" r="3" fill="none" stroke={color} strokeWidth="1.5" />
      </svg>
    )
  }
  if (status === "capture") {
    // ◐ Half circle — in progress
    return (
      <svg width={size} height={size} viewBox="0 0 8 8" className="shrink-0">
        <circle cx="4" cy="4" r="3" fill="none" stroke={color} strokeWidth="1.5" />
        <path d="M4 1a3 3 0 010 6z" fill={color} />
      </svg>
    )
  }
  // ● Filled circle — permanent
  return (
    <svg width={size} height={size} viewBox="0 0 8 8" className="shrink-0">
      <circle cx="4" cy="4" r="3.5" fill={color} />
    </svg>
  )
}

/** Resolve display label for group headers (folder/label use IDs as keys) */
function resolveGroupLabel(groupBy: GroupBy, groupKey: string, fallback: string, folders: Folder[], labels: Label[]): string {
  if (groupBy === "folder" && groupKey !== "_no_folder") {
    return folders.find((f) => f.id === groupKey)?.name ?? fallback
  }
  if (groupBy === "label" && groupKey !== "_no_label") {
    return labels.find((l) => l.id === groupKey)?.name ?? fallback
  }
  return fallback
}

/** Dynamic group header icon based on groupBy type */
function GroupHeaderIcon({ groupBy, groupKey, label, folders, labels }: {
  groupBy: GroupBy
  groupKey: string
  label: string
  folders: Folder[]
  labels: Label[]
}) {
  switch (groupBy) {
    case "status":
      return <StatusShapeIcon status={label.toLowerCase() as NoteStatus} size={8} />
    case "folder":
      return <FolderOpen className="h-3.5 w-3.5 text-muted-foreground/70" strokeWidth={1.5} />
    case "label": {
      const labelColor = labels.find((l) => l.id === groupKey)?.color
      return labelColor ? (
        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: labelColor }} />
      ) : (
        <span className="h-2 w-2 rounded-full shrink-0 bg-muted-foreground/30" />
      )
    }
    default:
      // priority, date, triage, linkCount — text-only, no special icon
      return null
  }
}

function NoteRowInner({
  note,
  folders,
  links,
  isActive,
  isSelected,
  selectionActive,
  isCompact,
  viewMode,
  visibleColumns,
  onOpen,
  onClick,
  onDoubleClick,
  onStatus,
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

  /* ── List mode rendering ── */
  if (viewMode === "list") {
    const label = note.labelId ? labels.find((l: { id: string; name: string; color: string }) => l.id === note.labelId) : null
    const folderName = note.folderId ? folders.find((f: Folder) => f.id === note.folderId)?.name : null
    const statusColor = STATUS_DOT_COLORS[note.status] ?? "rgba(255,255,255,0.32)"

    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            draggable
            onDragStart={(e) => setNoteDragData(e, note.id)}
            className={`group flex items-center gap-3 px-5 py-2.5 cursor-pointer transition-colors ${
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
              className={`shrink-0 flex items-center justify-center cursor-pointer rounded w-6 h-6 ${
                selectionActive || isSelected ? "visible" : "invisible group-hover:visible"
              }`}
              onClick={(e) => {
                e.stopPropagation()
                const syntheticEvent = { ...e, metaKey: true, ctrlKey: true, shiftKey: false } as React.MouseEvent
                onClick?.(syntheticEvent)
              }}
            >
              <div
                className={`rounded border flex items-center justify-center transition-colors pointer-events-none h-3.5 w-3.5 ${
                  isSelected ? "bg-accent border-accent" : "border-muted-foreground/30 hover:border-muted-foreground/50"
                }`}
              >
                {isSelected && <Check className="h-2 w-2 text-accent-foreground" />}
              </div>
            </div>

            {/* Status icon (shape-differentiated) */}
            {visibleCols.includes("status") && (
              <StatusShapeIcon status={note.status} size={8} />
            )}

            {/* Title */}
            <span className="text-[13px] font-medium text-foreground truncate flex-1">{note.title || "Untitled"}</span>

            {/* Label badge (always visible — part of note identity) */}
            {label ? (
              <span
                className="shrink-0 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium"
                style={{ backgroundColor: `${label.color}18`, color: label.color }}
              >
                {label.name}
              </span>
            ) : (
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-white/[0.06] text-muted-foreground shrink-0">
                Memo
              </span>
            )}

            {/* Tags (max 2) */}
            {visibleCols.includes("tags") && note.tags?.slice(0, 2).map((tagId) => {
              const tagStore = usePlotStore.getState().tags
              const tag = tagStore.find((t: Tag) => t.id === tagId)
              return tag ? (
                <span key={tagId} className="text-[11px] px-1.5 py-0.5 rounded border border-border/60 text-muted-foreground/60 shrink-0">
                  {tag.name}
                </span>
              ) : null
            })}

            {/* Folder */}
            {visibleCols.includes("folder") && folderName && (
              <span className="text-[12px] text-muted-foreground/50 shrink-0">{folderName}</span>
            )}

            {/* Links */}
            {visibleCols.includes("links") && links > 0 && (
              <span className="flex items-center gap-0.5 text-[12px] text-muted-foreground/40 tabular-nums shrink-0">
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
                  <path d="M6.7 8.7a3.3 3.3 0 005 .4l2-2a3.3 3.3 0 00-4.7-4.7L8.4 3"/>
                  <path d="M9.3 7.3a3.3 3.3 0 00-5-.4l-2 2a3.3 3.3 0 004.7 4.7l.6-.6"/>
                </svg>
                {links}
              </span>
            )}

            {/* Reads */}
            {visibleCols.includes("reads") && note.reads > 0 && (
              <span className="flex items-center gap-0.5 text-[12px] text-muted-foreground/40 tabular-nums shrink-0">
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
                  <path d="M1 8s2.7-5 7-5 7 5 7 5-2.7 5-7 5-7-5-7-5z"/>
                  <circle cx="8" cy="8" r="2"/>
                </svg>
                {note.reads}
              </span>
            )}

            {/* Updated (relative time) */}
            {visibleCols.includes("updatedAt") && (
              <span className="flex items-center gap-0.5 text-[12px] text-muted-foreground/40 tabular-nums shrink-0 text-right">
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 shrink-0">
                  <circle cx="8" cy="8" r="6"/>
                  <polyline points="8 4.5 8 8 10.5 9.5"/>
                </svg>
                {shortRelative(note.updatedAt)}
              </span>
            )}

            {/* Created (absolute date) */}
            {visibleCols.includes("createdAt") && (
              <span className="flex items-center gap-0.5 text-[12px] text-muted-foreground/40 tabular-nums shrink-0 text-right">
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 shrink-0">
                  <rect x="2" y="3" width="12" height="11" rx="1.5"/>
                  <line x1="2" y1="7" x2="14" y2="7"/>
                  <line x1="5.3" y1="1.3" x2="5.3" y2="4.7"/>
                  <line x1="10.7" y1="1.3" x2="10.7" y2="4.7"/>
                </svg>
                {absDate(note.createdAt)}
              </span>
            )}
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-52">
          {/* Inbox actions */}
          {note.status === "inbox" && note.triageStatus !== "trashed" && (
            <>
              <ContextMenuItem onClick={onKeep} className="text-sm">
                <Check className="h-4 w-4 mr-2 text-accent" />
                Done
              </ContextMenuItem>
              <ContextMenuSub>
                <ContextMenuSubTrigger className="text-sm">
                  <AlarmClock className="h-4 w-4 mr-2 text-muted-foreground" />
                  Snooze
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-44">
                  <ContextMenuItem onClick={() => onSnooze("3h")} className="text-sm">3 hours</ContextMenuItem>
                  <ContextMenuItem onClick={() => onSnooze("tomorrow")} className="text-sm">Tomorrow 10:00 AM</ContextMenuItem>
                  <ContextMenuItem onClick={() => onSnooze("3-days")} className="text-sm">In 3 days</ContextMenuItem>
                  <ContextMenuItem onClick={() => onSnooze("next-week")} className="text-sm">Next week 10:00 AM</ContextMenuItem>
                  <ContextMenuItem onClick={() => onSnooze("1-week")} className="text-sm">In 1 week</ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>
              <ContextMenuItem onClick={onTrash} className="text-sm text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Trash
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          )}
          {note.status === "capture" && (
            <>
              <ContextMenuItem onClick={onPromote} className="text-sm">
                <ArrowUpRight className="h-4 w-4 mr-2 text-chart-5" />
                Promote to Permanent
              </ContextMenuItem>
              <ContextMenuItem onClick={onMoveBack} className="text-sm">
                <Inbox className="h-4 w-4 mr-2 text-muted-foreground" />
                Back to Inbox
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          )}
          {note.status === "permanent" && (
            <>
              <ContextMenuItem onClick={onDemote} className="text-sm">
                <ArrowDownLeft className="h-4 w-4 mr-2 text-muted-foreground" />
                Demote to Capture
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          )}
          <ContextMenuItem onClick={onOpen} className="text-sm">
            <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
            Open
          </ContextMenuItem>
          <ContextMenuItem onClick={onMergeWith} className="text-sm">
            <Merge className="h-4 w-4 mr-2 text-muted-foreground" />
            Merge with...
          </ContextMenuItem>
          <ContextMenuItem onClick={onLinkWith} className="text-sm">
            <Link2 className="h-4 w-4 mr-2 text-muted-foreground" />
            Link to...
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    )
  }

  /* ── Table mode rendering (existing) ── */
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          draggable
          onDragStart={(e) => setNoteDragData(e, note.id)}
          className={`group flex items-center transition-colors cursor-pointer border-b border-border/30 ${
            isCompact ? "px-3 py-1.5" : "px-5 py-0"
          } ${
            isSelected
              ? "bg-accent/5"
              : isActive
                ? "bg-accent/8 border-l-2 border-l-accent"
                : "hover:bg-white/[0.02]"
          }`}
          onClick={onClick ?? onOpen}
          onDoubleClick={onDoubleClick}
        >
      {/* Checkbox */}
      <div
        data-checkbox
        className={`shrink-0 flex items-center justify-center mr-0.5 cursor-pointer rounded ${
          isCompact ? "w-6 h-6" : "w-8 h-8"
        } ${
          selectionActive || isSelected ? "visible" : "invisible group-hover:visible"
        }`}
        onClick={(e) => {
          e.stopPropagation()
          const syntheticEvent = { ...e, metaKey: true, ctrlKey: true, shiftKey: false } as React.MouseEvent
          onClick?.(syntheticEvent)
        }}
      >
        <div
          className={`rounded border flex items-center justify-center transition-colors pointer-events-none ${
            isCompact ? "h-3 w-3" : "h-4 w-4"
          } ${
            isSelected ? "bg-accent border-accent" : "border-muted-foreground/30 hover:border-muted-foreground/50"
          }`}
        >
          {isSelected && <Check className={`text-accent-foreground ${isCompact ? "h-2 w-2" : "h-2.5 w-2.5"}`} />}
        </div>
      </div>

      {/* Name */}
      <div className="flex flex-1 items-center gap-2.5 min-w-0 pr-4">
        <FileText className={`shrink-0 text-muted-foreground/60 ${isCompact ? "h-3.5 w-3.5" : "h-4 w-4"}`} />
        <span className={`truncate text-foreground ${isCompact ? "text-note" : "text-ui"}`}>
          {note.title || "Untitled"}
        </span>
        {(() => {
          const label = note.labelId ? labels.find((l: { id: string; name: string; color: string }) => l.id === note.labelId) : null
          if (label) {
            return (
              <span
                className="shrink-0 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-2xs font-medium"
                style={{ backgroundColor: `${label.color}18`, color: label.color }}
              >
                {label.name}
              </span>
            )
          }
          return (
            <span className="shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5 text-2xs font-medium text-muted-foreground/70 bg-muted/50">
              Memo
            </span>
          )
        })()}
        <SourceIcon source={note.source} />
        {note.preview.length > 0 && (
          <span
            className="shrink-0 text-2xs tabular-nums font-medium"
            style={{ color: note.preview.length >= 80 ? "#45d483" : note.preview.length >= 30 ? "#60a5fa" : "#9ca3af" }}
          >
            {note.preview.length >= 120 ? "120+" : note.preview.length}
          </span>
        )}
        {links === 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="shrink-0 flex items-center gap-0.5 text-2xs text-muted-foreground/50">
                <Link2 className="h-2.5 w-2.5" />
              </span>
            </TooltipTrigger>
            <TooltipContent className="text-xs">Add at least 1 link to reduce orphan notes.</TooltipContent>
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
        <div className="w-[80px] shrink-0 flex items-center justify-center px-2">
          {note.folderId ? (() => {
            const folder = folders.find((f: Folder) => f.id === note.folderId)
            if (!folder) return <span className="text-[11px] text-muted-foreground/20">—</span>
            return (
              <span className="text-[11px] text-muted-foreground/50 truncate">{folder.name}</span>
            )
          })() : (
            <span className="text-[11px] text-muted-foreground/20">—</span>
          )}
        </div>
      )}

      {/* Links */}
      {visibleCols.includes("links") && (
        <div className="w-[56px] shrink-0 text-center px-1">
          <span className={`tabular-nums text-[12px] ${links === 0 ? "text-muted-foreground/20" : "text-muted-foreground/60"}`}>
            {links}
          </span>
        </div>
      )}

      {/* Reads */}
      {visibleCols.includes("reads") && (
        <div className="w-[56px] shrink-0 text-center px-1">
          <span className={`tabular-nums text-[12px] ${note.reads === 0 ? "text-muted-foreground/20" : "text-muted-foreground/60"}`}>
            {note.reads}
          </span>
        </div>
      )}

      {/* Updated - relative time like Linear */}
      {visibleCols.includes("updatedAt") && (
        <div className="w-[80px] shrink-0 text-right px-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="tabular-nums text-[12px] text-muted-foreground/50 cursor-default">
                {shortRelative(note.updatedAt)}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {format(new Date(note.updatedAt), "MMM d, yyyy 'at' h:mm a")}
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Created - absolute date like Linear */}
      {visibleCols.includes("createdAt") && (
        <div className="w-[80px] shrink-0 text-right px-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="tabular-nums text-[12px] text-muted-foreground/50 cursor-default">
                {absDate(note.createdAt)}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
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
            <ContextMenuItem onClick={onKeep} className="text-sm">
              <Check className="h-4 w-4 mr-2 text-accent" />
              Done
              <span className="ml-auto text-2xs text-muted-foreground">D</span>
            </ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger className="text-sm">
                <AlarmClock className="h-4 w-4 mr-2 text-muted-foreground" />
                Snooze
                <span className="ml-auto text-2xs text-muted-foreground">S</span>
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-44">
                <ContextMenuItem onClick={() => onSnooze("3h")} className="text-sm">
                  3 hours
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onSnooze("tomorrow")} className="text-sm">
                  Tomorrow 10:00 AM
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onSnooze("3-days")} className="text-sm">
                  In 3 days
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onSnooze("next-week")} className="text-sm">
                  Next week 10:00 AM
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onSnooze("1-week")} className="text-sm">
                  In 1 week
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuItem onClick={onTrash} className="text-sm text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Trash
              <span className="ml-auto text-2xs">T</span>
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}

        {/* Capture actions */}
        {note.status === "capture" && (
          <>
            <ContextMenuItem onClick={onPromote} className="text-sm">
              <ArrowUpRight className="h-4 w-4 mr-2 text-chart-5" />
              Promote to Permanent
              <span className="ml-auto text-2xs text-muted-foreground">P</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={onMoveBack} className="text-sm">
              <Inbox className="h-4 w-4 mr-2 text-muted-foreground" />
              Back to Inbox
              <span className="ml-auto text-2xs text-muted-foreground">B</span>
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}

        {/* Permanent actions */}
        {note.status === "permanent" && (
          <>
            <ContextMenuItem onClick={onDemote} className="text-sm">
              <ArrowDownLeft className="h-4 w-4 mr-2 text-muted-foreground" />
              Demote to Capture
              <span className="ml-auto text-2xs text-muted-foreground">D</span>
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}

        {/* Remind me (all notes) */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="text-sm">
            <Bell className="h-4 w-4 mr-2 text-muted-foreground" />
            Remind me
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem onClick={() => onRemind(getSnoozeTime("3h"))} className="text-sm">
              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>Later today</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onRemind(getSnoozeTime("tomorrow"))} className="text-sm">
              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>Tomorrow</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onRemind(getSnoozeTime("3-days"))} className="text-sm">
              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>In 3 days</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onRemind(getSnoozeTime("next-week"))} className="text-sm">
              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>Next week</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onRemind(getSnoozeTime("1-week"))} className="text-sm">
              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>In 1 week</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />

        {/* Common actions */}
        <ContextMenuItem onClick={onOpen} className="text-sm">
          <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
          Open
        </ContextMenuItem>
        <ContextMenuItem onClick={onMergeWith} className="text-sm">
          <Merge className="h-4 w-4 mr-2 text-muted-foreground" />
          Merge with...
        </ContextMenuItem>
        <ContextMenuItem onClick={onLinkWith} className="text-sm">
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
  prev.note.folderId === next.note.folderId &&
  prev.note.reads === next.note.reads &&
  prev.note.title === next.note.title &&
  prev.links === next.links &&
  prev.isActive === next.isActive &&
  prev.isSelected === next.isSelected &&
  prev.selectionActive === next.selectionActive &&
  prev.isCompact === next.isCompact &&
  prev.viewMode === next.viewMode &&
  prev.visibleColumns === next.visibleColumns
)
