"use client"

import { useState, useMemo, useRef, memo, useEffect, useCallback, type Dispatch, type SetStateAction } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
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
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { ArrowsDownUp } from "@phosphor-icons/react/dist/ssr/ArrowsDownUp"
import { ArrowUp } from "@phosphor-icons/react/dist/ssr/ArrowUp"
import { ArrowDown } from "@phosphor-icons/react/dist/ssr/ArrowDown"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { Link as PhLink } from "@phosphor-icons/react/dist/ssr/Link"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"
import { Alarm } from "@phosphor-icons/react/dist/ssr/Alarm"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr/ArrowUpRight"
import { ArrowDownLeft } from "@phosphor-icons/react/dist/ssr/ArrowDownLeft"
import { Tray } from "@phosphor-icons/react/dist/ssr/Tray"
import { StatusShapeIcon } from "@/components/status-icon"
import { DotsThree } from "@phosphor-icons/react/dist/ssr/DotsThree"
import { Bell } from "@phosphor-icons/react/dist/ssr/Bell"
import { Clock as PhClock } from "@phosphor-icons/react/dist/ssr/Clock"
import { GitMerge } from "@phosphor-icons/react/dist/ssr/GitMerge"
import { SplitHorizontal } from "@phosphor-icons/react/dist/ssr/SplitHorizontal"
import { Scissors } from "@phosphor-icons/react/dist/ssr/Scissors"
import { setSplitTargetNoteId } from "@/lib/note-split-mode"
import { Minus as PhMinus } from "@phosphor-icons/react/dist/ssr/Minus"
import { FolderOpen } from "@phosphor-icons/react/dist/ssr/FolderOpen"
import { ArrowCounterClockwise } from "@phosphor-icons/react/dist/ssr/ArrowCounterClockwise"
import { Globe } from "@phosphor-icons/react/dist/ssr/Globe"
import { DownloadSimple } from "@phosphor-icons/react/dist/ssr/DownloadSimple"
import { ShareNetwork } from "@phosphor-icons/react/dist/ssr/ShareNetwork"
import { Lightning } from "@phosphor-icons/react/dist/ssr/Lightning"
import { PencilSimple } from "@phosphor-icons/react/dist/ssr/PencilSimple"
import { NotePencil as PhNotePencil } from "@phosphor-icons/react/dist/ssr/NotePencil"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { usePlotStore } from "@/lib/store"
import { usePaneOpenNote } from "@/components/workspace/pane-context"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { getSnoozeTime, type SnoozePreset } from "@/lib/queries/notes"
import { useNotesView } from "@/lib/view-engine/use-notes-view"
import type { ViewContextKey, ViewMode, SortField, SortDirection, GroupBy, FilterRule, NoteGroup } from "@/lib/view-engine/types"
import { StatusDropdown, StatusBadge } from "@/components/note-fields"
import { format } from "date-fns"
import { shortRelative } from "@/lib/format-utils"
import type { Note, NoteStatus, Folder, NoteSource, Tag, Label, NoteTemplate, Attachment, Reference } from "@/lib/types"
import { File as PhFile } from "@phosphor-icons/react/dist/ssr/File"
import { BookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"
import { toast } from "sonner"
import { FloatingActionBar } from "@/components/floating-action-bar"
import { FilterChipBar } from "@/components/filter-bar"
import { ViewHeader } from "@/components/view-header"
import { FilterPanel } from "@/components/filter-panel"
import { DisplayPanel } from "@/components/display-panel"
import { NOTES_VIEW_CONFIG } from "@/lib/view-engine/view-configs"
import { setActiveFolderId, usePendingFilters, clearPendingFilters } from "@/lib/table-route"
import { setNoteDragData } from "@/lib/drag-helpers"
import { pushUndo } from "@/lib/undo-manager"

/* ── Helpers ───────────────────────────────────────────── */

function absDate(dateStr: string): string {
  return format(new Date(dateStr), "MMM d")
}

/* ── Trash sub-filter tabs ────────────────────────────── */

type TrashFilter = "all" | "notes" | "wiki" | "tags" | "labels" | "templates" | "references" | "files"

const TRASH_TABS: { id: TrashFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "notes", label: "Notes" },
  { id: "wiki", label: "Wiki" },
  { id: "tags", label: "Tags" },
  { id: "labels", label: "Labels" },
  { id: "templates", label: "Templates" },
  { id: "references", label: "References" },
  { id: "files", label: "Files" },
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
  sub: "Sub",
  tier: "Tier",
  parent: "Parent",
}

const COLUMN_DEFS: { id: string; label: string; width: string; align?: string; sortField: SortField; minWidth?: number }[] = [
  { id: "title", label: "Name", width: "flex-1 min-w-0", sortField: "title" },
  { id: "status", label: "Status", width: "w-[120px] shrink-0", align: "text-right", sortField: "status", minWidth: 400 },
  { id: "folder", label: "Folder", width: "w-[80px] shrink-0", align: "text-center", sortField: "folder", minWidth: 560 },
  { id: "links", label: "Links", width: "w-[56px] shrink-0", align: "text-center", sortField: "links", minWidth: 600 },
  { id: "reads", label: "Reads", width: "w-[56px] shrink-0", align: "text-center", sortField: "reads", minWidth: 720 },
  { id: "wordCount", label: "Words", width: "w-[56px] shrink-0", align: "text-right", sortField: "reads", minWidth: 760 },
  { id: "updatedAt", label: "Updated", width: "w-[80px] shrink-0", align: "text-right", sortField: "updatedAt", minWidth: 280 },
  { id: "createdAt", label: "Created", width: "w-[80px] shrink-0", align: "text-right", sortField: "createdAt", minWidth: 800 },
]

/* ── Virtual item type ─────────────────────────────────── */

type VirtualItem =
  | { type: "header"; label: string; count: number; groupKey: string; groupBy: GroupBy }
  | { type: "subheader"; label: string; count: number; groupKey: string; parentKey: string; groupBy: GroupBy }
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
      className={`group/th inline-flex items-center gap-1 text-note font-medium text-muted-foreground transition-colors hover:text-foreground ${className}`}
      onClick={() => onSort(col)}
    >
      {label}
      {active ? (
        sortDir === "asc" ? <ArrowUp className="text-muted-foreground" size={12} weight="regular" /> : <ArrowDown className="text-muted-foreground" size={12} weight="regular" />
      ) : (
        <ArrowsDownUp className="opacity-0 group-hover/th:opacity-60" size={12} weight="regular" />
      )}
    </button>
  )
}

/* ── TrashEntityList ───────────────────────────────────── */

function TrashEntityList({ type }: { type: "tags" | "labels" | "templates" | "references" | "files" }) {
  const store = usePlotStore()

  const items: (Tag | Label | NoteTemplate | Reference | Attachment)[] = type === "tags"
    ? (store.tags || []).filter((t: Tag) => t.trashed)
    : type === "labels"
    ? (store.labels || []).filter((l: Label) => l.trashed)
    : type === "templates"
    ? (store.templates || []).filter((t: NoteTemplate) => t.trashed)
    : type === "references"
    ? Object.values(store.references || {}).filter((r: Reference) => r.trashed)
    : (store.attachments || []).filter((a: Attachment) => a.trashed)

  const handleRestore = (id: string) => {
    if (type === "tags") store.restoreTag(id)
    else if (type === "labels") store.restoreLabel(id)
    else if (type === "templates") store.restoreTemplate(id)
    else if (type === "references") store.restoreReference(id)
    else store.restoreAttachment(id)
    toast(`Restored ${type === "files" ? "file" : type.slice(0, -1)}`)
  }

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Permanently delete "${name}"? This cannot be undone.`)) return
    if (type === "tags") store.permanentlyDeleteTag(id)
    else if (type === "labels") store.permanentlyDeleteLabel(id)
    else if (type === "templates") store.permanentlyDeleteTemplate(id)
    else if (type === "references") store.permanentlyDeleteReference(id)
    else store.permanentlyDeleteAttachment(id)
    toast(`Deleted ${type === "files" ? "file" : type.slice(0, -1)}`)
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-center">
        <div>
          <Trash className="mx-auto mb-3 text-muted-foreground/40" size={40} weight="regular" />
          <p className="text-ui text-muted-foreground">No trashed {type}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header row */}
      <div className="sticky top-0 z-10 flex items-center border-b border-border bg-background px-5 py-2">
        <div className="flex-1 text-note font-medium text-foreground/80">Name</div>
        <div className="w-16 shrink-0 text-center text-note font-medium text-foreground/80">Color</div>
        <div className="w-32 shrink-0 text-right text-note font-medium text-foreground/80">Trashed</div>
        <div className="w-32 shrink-0 text-right text-note font-medium text-foreground/80">Actions</div>
      </div>
      {items.map((item) => {
        const color = (item as Tag).color ?? ""
        const trashedAt = (item as Tag).trashedAt ?? null
        return (
          <div
            key={item.id}
            className="flex items-center border-b border-border px-5 py-2.5 hover:bg-hover-bg transition-colors"
          >
            <div className="flex-1 min-w-0">
              <span className="text-note font-medium text-foreground truncate">
                {(item as any).title ?? (item as any).name}
              </span>
            </div>
            <div className="w-16 shrink-0 flex items-center justify-center">
              {color ? (
                <span
                  className="h-3.5 w-3.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
              ) : (
                <span className="text-2xs text-muted-foreground">—</span>
              )}
            </div>
            <div className="w-32 shrink-0 text-right text-note text-muted-foreground">
              {trashedAt ? shortRelative(trashedAt) : "—"}
            </div>
            <div className="w-32 shrink-0 flex items-center justify-end gap-1.5">
              <button
                onClick={() => handleRestore(item.id)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-note text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
                title="Restore"
              >
                <ArrowCounterClockwise size={14} weight="regular" />
                Restore
              </button>
              <button
                onClick={() => handleDelete(item.id, (item as any).title ?? (item as any).name)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-note text-destructive transition-colors hover:bg-destructive/10"
                title="Delete permanently"
              >
                <Trash size={14} weight="regular" />
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
  const _storeOpenNote = usePlotStore((s) => s.openNote)
  const _paneOpenNote = usePaneOpenNote()
  // Use pane-aware openNote if inside a PaneProvider, otherwise use store directly
  const openNote = _paneOpenNote
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
  const sidePanelOpen = usePlotStore((s) => s.sidePanelOpen)

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

  // ── Pending filters from Home cards ──
  const pendingFilters = usePendingFilters()
  useEffect(() => {
    if (pendingFilters && pendingFilters.length > 0) {
      updateViewState({ filters: pendingFilters })
      clearPendingFilters()
    }
  }, [pendingFilters, updateViewState])

  // ── Trash sub-filter ──
  const storeTemplates = usePlotStore((s) => s.templates)
  const storeReferences = usePlotStore((s) => s.references)
  const storeAttachments = usePlotStore((s) => s.attachments)
  const trashTabCounts = useMemo((): Record<TrashFilter, number> => {
    if (!isTrashView) return { all: 0, notes: 0, wiki: 0, tags: 0, labels: 0, templates: 0, references: 0, files: 0 }
    const trashed = notes.filter((n) => n.trashed)
    const trashedTags = tags.filter((t) => t.trashed)
    const trashedLabels = labels.filter((l) => l.trashed)
    const trashedTemplates = storeTemplates.filter((t) => t.trashed)
    const trashedRefs = Object.values(storeReferences || {}).filter((r) => r.trashed)
    const trashedFiles = (storeAttachments || []).filter((a) => a.trashed)
    return {
      all: trashed.length + trashedTags.length + trashedLabels.length + trashedTemplates.length + trashedRefs.length + trashedFiles.length,
      notes: trashed.filter((n) => n.noteType !== "wiki").length,
      wiki: trashed.filter((n) => n.noteType === "wiki").length,
      tags: trashedTags.length,
      labels: trashedLabels.length,
      templates: trashedTemplates.length,
      references: trashedRefs.length,
      files: trashedFiles.length,
    }
  }, [notes, isTrashView, tags, labels, storeTemplates, storeReferences, storeAttachments])

  const trashFilterFn = useCallback((note: Note): boolean => {
    if (!isTrashView || trashFilter === "all") return true
    if (trashFilter === "wiki") return note.noteType === "wiki"
    return note.noteType !== "wiki"
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

  // List-mode multi-select → side panel mirror.
  // When exactly one row is checkbox-selected, point the side panel's Detail tab
  // at that note. 0 selected = preserve last context (don't flicker), 2+ = ambiguous.
  // Mirrors the wiki-list behavior so list views feel consistent.
  useEffect(() => {
    if (selectedIds.size !== 1) return
    const onlyId = [...selectedIds][0]
    usePlotStore.getState().setSidePanelContext({ type: "note", id: onlyId })
    usePlotStore.getState().setSidePanelOpen(true)
  }, [selectedIds])

  // ── Group collapse state ──
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  // ── Group header pointer-based reorder state ──
  const [reorderSource, setReorderSource] = useState<string | null>(null)
  const [reorderTarget, setReorderTarget] = useState<string | null>(null)
  const reorderMoved = useRef(false)
  const toggleGroupCollapse = useCallback((groupKey: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupKey)) next.delete(groupKey)
      else next.add(groupKey)
      return next
    })
  }, [])

  // ── Group header pointer-based reorder handlers ──
  const handleGroupPointerDown = useCallback((e: React.PointerEvent, groupKey: string) => {
    if (e.button !== 0) return
    if (viewState.groupBy === "none") return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setReorderSource(groupKey)
    reorderMoved.current = false
  }, [viewState.groupBy])

  const handleGroupPointerMove = useCallback((e: React.PointerEvent) => {
    if (!reorderSource) return
    reorderMoved.current = true

    const target = document.elementFromPoint(e.clientX, e.clientY)
    const headerEl = target?.closest("[data-group-key]") as HTMLElement | null
    const targetKey = headerEl?.dataset.groupKey ?? null

    if (targetKey && targetKey !== reorderSource) {
      setReorderTarget(targetKey)
    } else if (!targetKey) {
      setReorderTarget(null)
    }
  }, [reorderSource])

  const handleGroupPointerUp = useCallback(() => {
    if (reorderSource && reorderTarget && reorderSource !== reorderTarget) {
      const currentOrder = groups.map(g => g.key)
      const oldIndex = currentOrder.indexOf(reorderSource)
      const newIndex = currentOrder.indexOf(reorderTarget)
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = [...currentOrder]
        newOrder.splice(oldIndex, 1)
        newOrder.splice(newIndex, 0, reorderSource)
        updateViewState({
          groupOrder: {
            ...(viewState.groupOrder ?? {}),
            [viewState.groupBy]: newOrder,
          },
        })
      }
    }
    setReorderSource(null)
    setReorderTarget(null)
  }, [reorderSource, reorderTarget, groups, updateViewState, viewState.groupOrder, viewState.groupBy])

  // ── Sub-group header pointer-based reorder state ──
  const [subReorderSource, setSubReorderSource] = useState<string | null>(null)
  const [subReorderTarget, setSubReorderTarget] = useState<string | null>(null)
  const subReorderMoved = useRef(false)

  const handleSubGroupPointerDown = useCallback((e: React.PointerEvent, subGroupKey: string) => {
    if (e.button !== 0) return
    if (!viewState.subGroupBy || viewState.subGroupBy === "none") return
    // Only allow drag reorder when sub-group sort is set to "manual"
    if (viewState.subGroupSortBy !== "manual") return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setSubReorderSource(subGroupKey)
    subReorderMoved.current = false
  }, [viewState.subGroupBy, viewState.subGroupSortBy])

  const handleSubGroupPointerMove = useCallback((e: React.PointerEvent) => {
    if (!subReorderSource) return
    subReorderMoved.current = true

    const target = document.elementFromPoint(e.clientX, e.clientY)
    const headerEl = target?.closest("[data-subgroup-key]") as HTMLElement | null
    const targetKey = headerEl?.dataset.subgroupKey ?? null

    // Only allow reorder within the same parent group
    if (targetKey && targetKey !== subReorderSource) {
      const sourceParent = subReorderSource.split("::")[0]
      const targetParent = targetKey.split("::")[0]
      if (sourceParent === targetParent) {
        setSubReorderTarget(targetKey)
      }
    } else if (!targetKey) {
      setSubReorderTarget(null)
    }
  }, [subReorderSource])

  const handleSubGroupPointerUp = useCallback(() => {
    if (subReorderSource && subReorderTarget && subReorderSource !== subReorderTarget) {
      const sourceParent = subReorderSource.split("::")[0]
      const parentGroup = groups.find(g => g.key === sourceParent)
      if (parentGroup?.subGroups) {
        const currentOrder = parentGroup.subGroups.map(sg => `${sourceParent}::${sg.key}`)
        const oldIndex = currentOrder.indexOf(subReorderSource)
        const newIndex = currentOrder.indexOf(subReorderTarget)
        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = [...currentOrder]
          newOrder.splice(oldIndex, 1)
          newOrder.splice(newIndex, 0, subReorderSource)
          // Store only the sub-keys (without parent prefix)
          const subKeys = newOrder.map(k => k.split("::")[1])
          updateViewState({
            subGroupOrder: {
              ...(viewState.subGroupOrder ?? {}),
              [viewState.subGroupBy]: subKeys,
            },
          })
        }
      }
    }
    setSubReorderSource(null)
    setSubReorderTarget(null)
  }, [subReorderSource, subReorderTarget, groups, updateViewState, viewState.subGroupOrder, viewState.subGroupBy])

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
    // If we just finished a drag-select, ignore the click
    if (isDraggingRef.current) return
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

    // Click on empty space (not on a note row) → clear selection
    if (!target.closest('[data-note-row]')) {
      setSelectedIds(new Set())
    }

    // Prevent native drag (draggable rows) from hijacking the selection drag
    e.preventDefault()

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
        return { ...cat, values: folders.map(f => ({ key: f.id, label: f.name, count: notes.filter(n => !n.trashed && n.folderId === f.id).length })) }
      }
      if (cat.key === "label") {
        return { ...cat, values: labels.filter(l => !l.trashed).map(l => ({ key: l.id, label: l.name, color: l.color, count: notes.filter(n => !n.trashed && n.labelId === l.id).length })) }
      }
      if (cat.key === "tags") {
        return { ...cat, values: tags.filter(t => !t.trashed).map(t => ({ key: t.id, label: t.name, count: notes.filter(n => !n.trashed && n.tags?.includes(t.id)).length })) }
      }
      if (cat.key === "status") {
        return { ...cat, values: cat.values.map(v => ({ ...v, count: notes.filter(n => !n.trashed && n.status === v.key).length })) }
      }
      return cat
    })
  }, [folders, labels, tags, notes])

  // Inbox/Capture/Permanent: hide Status from filter categories (already pre-filtered)
  const filteredCategories = useMemo(() => {
    if (isSingleStatusTab) {
      return notesFilterCategories.filter(cat => cat.key !== "status")
    }
    return notesFilterCategories
  }, [notesFilterCategories, isSingleStatusTab])

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

  // Map groupBy values to column IDs to hide when grouped
  const groupByColumnMap: Record<string, string> = {
    status: "status",
    folder: "folder",
    label: "label",
  }

  const effectiveVisibleCols = useMemo(() => {
    const hiddenByGroup = groupByColumnMap[viewState.groupBy] ?? ""
    return visibleCols.filter((colId) => {
      if (colId === hiddenByGroup) return false
      const def = COLUMN_DEFS.find((c) => c.id === colId)
      if (!def || !def.minWidth) return true // title always visible
      return containerWidth >= def.minWidth
    })
  }, [visibleCols, containerWidth, viewState.groupBy])

  // ── Grid template for table-mode columns ──
  const gridTemplate = useMemo(() => {
    const cols = ["32px", "1fr"] // checkbox + name (always)
    if (effectiveVisibleCols.includes("status")) cols.push("120px")
    if (effectiveVisibleCols.includes("folder")) cols.push("80px")
    if (effectiveVisibleCols.includes("links")) cols.push("56px")
    if (effectiveVisibleCols.includes("reads")) cols.push("56px")
    if (effectiveVisibleCols.includes("wordCount")) cols.push("56px")
    if (effectiveVisibleCols.includes("updatedAt")) cols.push("80px")
    if (effectiveVisibleCols.includes("createdAt")) cols.push("80px")
    return cols.join(" ")
  }, [effectiveVisibleCols])

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
        if (group.subGroups && group.subGroups.length > 0) {
          // Render sub-groups
          for (const sub of group.subGroups) {
            if (sub.notes.length === 0 && !viewState.showEmptyGroups) continue
            const subKey = `${group.key}::${sub.key}`
            items.push({ type: "subheader", label: sub.label, count: sub.notes.length, groupKey: subKey, parentKey: group.key, groupBy: viewState.subGroupBy })
            if (!collapsedGroups.has(subKey)) {
              for (const note of sub.notes) {
                items.push({ type: "note", note })
              }
            }
          }
        } else {
          for (const note of group.notes) {
            items.push({ type: "note", note })
          }
        }
      }
    }
    return items
  }, [flatNotes, groups, viewState.groupBy, viewState.subGroupBy, viewState.showEmptyGroups, collapsedGroups])

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: virtualItems.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: (i) => {
      const t = virtualItems[i].type
      if (t === "header") return 36
      if (t === "subheader") return 32
      if (isCompact) return 32
      return 40
    },
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

      // PhCheck threshold
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
        // Keep isDraggingRef true briefly so the subsequent click event is suppressed
        dragStartRef.current = null
        requestAnimationFrame(() => { isDraggingRef.current = false })
        return
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
    <main ref={tableContainerRef} onMouseDown={handleDragMouseDown} className="flex h-full flex-1 flex-col overflow-hidden bg-background">
      {/* ── Page title ─────────────────────────────────── */}
      <ViewHeader
        icon={<FileText size={20} weight="regular" />}
        title={title ?? "Notes"}
        count={flatNotes.length}
        extraToolbarButtons={viewState.groupBy !== "none" && groups.length > 0 ? (
          <button
            onClick={() => {
              const allKeys = groups.map(g => g.key)
              const allCollapsed = allKeys.every(k => collapsedGroups.has(k))
              if (allCollapsed) {
                setCollapsedGroups(new Set())
              } else {
                setCollapsedGroups(new Set(allKeys))
              }
            }}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/50 hover:bg-hover-bg hover:text-muted-foreground transition-all duration-100"
            title={groups.every(g => collapsedGroups.has(g.key)) ? "Expand all groups" : "Collapse all groups"}
          >
            <svg width={15} height={15} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              {groups.every(g => collapsedGroups.has(g.key)) ? (
                <>
                  <path d="M4 6l4 4 4-4" />
                </>
              ) : (
                <>
                  <path d="M12 10l-4-4-4 4" />
                </>
              )}
            </svg>
          </button>
        ) : undefined}
        showFilter
        hasActiveFilters={viewState.filters.length > 0}
        filterContent={
          <FilterPanel
            categories={filteredCategories}
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
            toggleStates={viewState.toggles ?? {}}
            onToggleChange={(key, value) =>
              updateViewState({ toggles: { ...(viewState.toggles ?? {}), [key]: value } })
            }
          />
        }
        showDetailPanel
        detailPanelOpen={sidePanelOpen}
        onDetailPanelToggle={() => {
          const store = usePlotStore.getState()
          if (!store.sidePanelOpen) {
            store.setSidePanelOpen(true)
            usePlotStore.setState({ sidePanelMode: 'detail' })
          } else if (store.sidePanelMode === 'detail') {
            store.setSidePanelOpen(false)
          } else {
            usePlotStore.setState({ sidePanelMode: 'detail' })
          }
        }}
        onCreateNew={!hideCreateButton ? () => { const id = createNote(createNoteOverrides ?? {}); if (id) openNote(id) } : undefined}
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
                <span className="ml-1.5 rounded-sm bg-foreground/15 px-1.5 py-0.5 text-2xs font-medium tabular-nums text-foreground">{trashTabCounts[tab.id]}</span>
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
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border border-accent/30 bg-accent/10 text-accent text-2xs font-medium">
              Order by {SORT_FIELD_LABELS[viewState.sortField]}
              <span>{viewState.sortDirection === "asc" ? "↑" : "↓"}</span>
              <button
                onClick={() => updateViewState({ sortField: "updatedAt", sortDirection: "desc" })}
                className="ml-0.5 hover:text-accent/80 transition-colors"
              >
                <PhX size={12} weight="regular" />
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
            <FolderOpen className="text-muted-foreground" size={14} weight="regular" />
            <span className="text-note text-foreground">{folderName}</span>
            <button
              onClick={() => setActiveFolderId(null)}
              className="ml-1 rounded-sm p-0.5 text-muted-foreground hover:text-foreground hover:bg-hover-bg transition-colors"
            >
              <PhX size={12} weight="regular" />
            </button>
          </div>
        ) : null
      })()}

      {/* ── Unlinked helper ─────────────────────────────── */}
      {effectiveTab === "unlinked" && flatNotes.length > 0 && (
        <div className="flex shrink-0 items-center gap-2 border-b border-border px-5 py-3">
          <PhLink className="text-muted-foreground" size={14} weight="regular" />
          <span className="text-2xs text-muted-foreground">
            These notes have no links. Add <span className="font-mono text-foreground/70">[[wiki-links]]</span> to connect them to your knowledge graph.
          </span>
        </div>
      )}

      {/* ── Entity trash list OR Note table ────────────── */}
      {isTrashView && (trashFilter === "tags" || trashFilter === "labels" || trashFilter === "templates" || trashFilter === "references" || trashFilter === "files") ? (
        <TrashEntityList type={trashFilter} />
      ) : (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="flex-1 flex flex-col">
            {virtualItems.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
                <PhNotePencil size={32} weight="light" className="text-muted-foreground/40" />
                <p className="text-note">
                  {context === "trash" ? "Trash is empty" : "No notes yet"}
                </p>
                <p className="text-2xs text-muted-foreground/60">
                  {context === "trash"
                    ? "Deleted notes will appear here."
                    : viewState.filters.length > 0
                      ? "Try adjusting your filters."
                      : "Press + to create your first note"}
                </p>
              </div>
            ) : (
              <div
                ref={scrollContainerRef}
                className={`flex-1 overflow-y-auto ${dragRect ? "select-none" : ""} ${selectedIds.size > 0 ? "pb-20" : ""}`}
                onClick={(e) => {
                  // Clear selection when clicking empty space (not on a row)
                  const target = e.target as HTMLElement
                  if (!target.closest('[data-note-row]') && !target.closest('[data-header-row]') && !target.closest('button')) {
                    if (selectedIds.size > 0) setSelectedIds(new Set())
                    usePlotStore.getState().setPreviewNoteId(null)
                  }
                }}
              >
                {/* Column headers (table mode) */}
                {effectiveVisibleCols.length > 0 && (
                <div
                  style={{ display: "grid", gridTemplateColumns: gridTemplate }}
                  className="sticky top-0 z-10 items-center border-b border-border-subtle bg-background px-5 py-2.5"
                >
                  <div className="flex items-center justify-center">
                    <div
                      className={`h-4 w-4 rounded-[4px] border flex items-center justify-center cursor-pointer transition-colors shadow-sm ${
                        selectedIds.size === flatNotes.length && flatNotes.length > 0
                          ? "bg-accent border-accent"
                          : selectedIds.size > 0
                            ? "bg-accent/50 border-accent"
                            : "bg-card border-zinc-400 dark:border-zinc-600 hover:border-zinc-500 dark:hover:border-zinc-500"
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
                        <PhCheck className="text-accent-foreground" size={10} weight="bold" />
                      )}
                      {selectedIds.size > 0 && selectedIds.size < flatNotes.length && (
                        <PhMinus className="text-accent-foreground" size={10} weight="regular" />
                      )}
                    </div>
                  </div>
                  {COLUMN_DEFS.filter((col) => col.id === "title" || effectiveVisibleCols.includes(col.id)).map((col) => (
                    <div key={col.id} className={col.align ?? ""}>
                      <TH
                        label={col.label}
                        col={col.sortField}
                        sortCol={viewState.sortField}
                        sortDir={viewState.sortDirection}
                        onSort={handleSort}
                        className={`${col.align === "text-right" ? "justify-end" : col.align === "text-center" ? "justify-center" : ""}`}
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
                            data-group-key={item.groupKey}
                            onPointerDown={(e) => handleGroupPointerDown(e, item.groupKey)}
                            onPointerMove={handleGroupPointerMove}
                            onPointerUp={handleGroupPointerUp}
                            className={`flex items-center gap-2.5 px-5 py-2 mt-4 mb-0.5 select-none transition-colors ${
                              reorderSource ? "cursor-grabbing" : "cursor-pointer"
                            } ${
                              reorderTarget === item.groupKey ? "bg-accent/10 border-l-2 border-l-accent" : "hover:bg-hover-bg"
                            } ${
                              reorderSource === item.groupKey ? "opacity-50 bg-secondary/30" : ""
                            }`}
                            onClick={() => {
                              if (!reorderMoved.current) toggleGroupCollapse(item.groupKey)
                            }}
                          >
                            <CaretDown className={`text-muted-foreground transition-transform ${collapsedGroups.has(item.groupKey) ? "-rotate-90" : ""}`} size={12} weight="regular" />
                            <GroupHeaderIcon groupBy={item.groupBy} groupKey={item.groupKey} label={item.label} folders={folders} labels={labels} />
                            <span className="text-note font-semibold text-foreground">
                              {resolveGroupLabel(item.groupBy, item.groupKey, item.label, folders, labels)}
                            </span>
                            <span className="text-2xs text-muted-foreground tabular-nums">{item.count}</span>
                          </div>
                          ) : (
                          <div
                            data-group-key={item.groupKey}
                            onPointerDown={(e) => handleGroupPointerDown(e, item.groupKey)}
                            onPointerMove={handleGroupPointerMove}
                            onPointerUp={handleGroupPointerUp}
                            className={`flex items-center gap-2 px-5 py-2.5 bg-secondary/20 mt-3 mb-0.5 select-none transition-colors ${
                              reorderSource ? "cursor-grabbing" : "cursor-pointer"
                            } ${
                              reorderTarget === item.groupKey ? "bg-accent/10 border-l-2 border-l-accent" : "hover:bg-hover-bg"
                            } ${
                              reorderSource === item.groupKey ? "opacity-50 bg-secondary/30" : ""
                            }`}
                            onClick={() => {
                              if (!reorderMoved.current) toggleGroupCollapse(item.groupKey)
                            }}
                          >
                            <CaretDown className={`text-muted-foreground transition-transform ${collapsedGroups.has(item.groupKey) ? "-rotate-90" : ""}`} size={12} weight="regular" />
                            <GroupHeaderIcon groupBy={item.groupBy} groupKey={item.groupKey} label={item.label} folders={folders} labels={labels} />
                            <span className="text-note font-semibold text-foreground">
                              {resolveGroupLabel(item.groupBy, item.groupKey, item.label, folders, labels)}
                            </span>
                            <span className="text-2xs text-muted-foreground tabular-nums">{item.count}</span>
                          </div>
                          )
                        ) : item.type === "subheader" ? (
                          <div
                            data-subgroup-key={item.groupKey}
                            onPointerDown={(e) => handleSubGroupPointerDown(e, item.groupKey)}
                            onPointerMove={handleSubGroupPointerMove}
                            onPointerUp={handleSubGroupPointerUp}
                            className={`flex items-center gap-2 pl-10 pr-5 py-1.5 select-none transition-colors ${
                              subReorderSource ? "cursor-grabbing" : "cursor-pointer"
                            } ${
                              subReorderTarget === item.groupKey ? "bg-accent/10 border-l-2 border-l-accent" : "hover:bg-hover-bg"
                            } ${
                              subReorderSource === item.groupKey ? "opacity-50 bg-secondary/30" : ""
                            }`}
                            onClick={() => {
                              if (!subReorderMoved.current) toggleGroupCollapse(item.groupKey)
                            }}
                          >
                            <CaretDown className={`text-muted-foreground transition-transform ${collapsedGroups.has(item.groupKey) ? "-rotate-90" : ""}`} size={10} weight="regular" />
                            <GroupHeaderIcon groupBy={item.groupBy} groupKey={item.groupKey.split("::")[1] ?? item.groupKey} label={item.label} folders={folders} labels={labels} />
                            <span className="text-2xs font-medium text-foreground">
                              {resolveGroupLabel(item.groupBy, item.groupKey.split("::")[1] ?? item.groupKey, item.label, folders, labels)}
                            </span>
                            <span className="text-2xs text-muted-foreground tabular-nums">{item.count}</span>
                          </div>
                        ) : (
                          <NoteRow
                            note={item.note}
                            folders={folders}
                            links={backlinksMap.get(item.note.id) ?? 0}
                            isActive={activePreviewId === item.note.id}
                            isSelected={selectedIds.has(item.note.id)}
                            selectionActive={selectedIds.size > 0}
                            visibleColumns={effectiveVisibleCols}
                            gridTemplate={gridTemplate}
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
                            onKeep={() => { triageKeep(item.note.id); pushUndo("Triage to Capture", () => moveBackToInbox(item.note.id), () => triageKeep(item.note.id)) }}
                            onSnooze={(opt) => triageSnooze(item.note.id, getSnoozeTime(opt))}
                            onTrash={() => { triageTrash(item.note.id); pushUndo("Trash note", () => toggleTrash(item.note.id), () => triageTrash(item.note.id)) }}
                            onPromote={() => { promoteToPermanent(item.note.id); pushUndo("Promote to Permanent", () => undoPromote(item.note.id), () => promoteToPermanent(item.note.id)) }}
                            onDemote={() => { undoPromote(item.note.id); pushUndo("Demote to Capture", () => promoteToPermanent(item.note.id), () => undoPromote(item.note.id)) }}
                            onMoveBack={() => { moveBackToInbox(item.note.id); pushUndo("Move back to Inbox", () => triageKeep(item.note.id), () => moveBackToInbox(item.note.id)) }}
                            onRemind={(isoDate) => { setReminder(item.note.id, isoDate); toast("Reminder set") }}
                            onMergeWith={() => setMergePickerOpen(true, item.note.id)}
                            onLinkWith={() => setLinkPickerOpen(true, item.note.id)}
                            showCardPreview={false}
                            groupBy={viewState.groupBy}
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
                    pushUndo(`Restore ${flatNotes.length} note${flatNotes.length !== 1 ? "s" : ""}`, () => noteIds.forEach((id) => toggleTrash(id)), () => noteIds.forEach((id) => toggleTrash(id)))
                    toast(`Restored ${flatNotes.length} note${flatNotes.length !== 1 ? "s" : ""}`)
                  }}
                  disabled={flatNotes.length === 0}
                  className="text-note"
                >
                  <ArrowCounterClockwise className="mr-2 text-muted-foreground" size={16} weight="regular" />
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
                  className="text-note text-destructive focus:text-destructive"
                >
                  <Trash className="mr-2" size={16} weight="regular" />
                  Empty trash
                </ContextMenuItem>
              </>
            ) : (
              <ContextMenuItem
                onClick={() => {
                  const id = createNote(createNoteOverrides ?? {})
                  openNote(id)
                }}
                className="text-note"
              >
                <PhPlus className="mr-2 text-muted-foreground" size={16} weight="regular" />
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
  gridTemplate?: string
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
  showCardPreview?: boolean
  groupBy?: string
}

function SourceIcon({ source }: { source: NoteSource }) {
  const Icon = {
    manual: PencilSimple,
    webclip: Globe,
    import: DownloadSimple,
    share: ShareNetwork,
    api: Lightning,
  }[source ?? "manual"]
  if (!Icon) return null
  return <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
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
      return <StatusShapeIcon status={label.toLowerCase() as NoteStatus} size={16} />
    case "folder":
      return <FolderOpen className="text-muted-foreground" size={16} weight="regular" />
    case "label": {
      const labelColor = labels.find((l) => l.id === groupKey)?.color
      return labelColor ? (
        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: labelColor }} />
      ) : (
        <span className="h-2.5 w-2.5 rounded-full shrink-0 bg-muted-foreground" />
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
  gridTemplate,
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
  showCardPreview,
  groupBy,
}: NoteRowProps) {
  const visibleCols = visibleColumns
  const labels = usePlotStore((s) => s.labels)

  /* ── Table mode rendering (CSS Grid) ── */

  const wordCount = useMemo(() => {
    if (!note.preview) return 0
    return note.preview.split(/\s+/).filter(Boolean).length
  }, [note.preview])

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          data-note-row
          draggable
          onDragStart={(e) => setNoteDragData(e, note.id)}
          style={{ display: "grid", gridTemplateColumns: gridTemplate }}
          className={`group items-center transition-colors cursor-pointer ${
            isCompact ? "px-3 py-1.5" : "px-5 py-2"
          } ${
            isSelected
              ? "bg-accent/5"
              : isActive
                ? "bg-accent/8 border-l-2 border-l-accent"
                : "hover:bg-hover-bg"
          }`}
          onClick={onClick ?? onOpen}
          onDoubleClick={onDoubleClick}
        >
      {/* Checkbox */}
      <div
        data-checkbox
        className={`flex items-center justify-center cursor-pointer rounded ${
          isCompact ? "h-6" : "h-8"
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
          className={`rounded-[4px] border flex items-center justify-center transition-colors pointer-events-none shadow-sm ${
            isCompact ? "h-3 w-3" : "h-4 w-4"
          } ${
            isSelected ? "bg-accent border-accent" : "bg-card border-zinc-400 dark:border-zinc-600 hover:border-zinc-500"
          }`}
        >
          {isSelected && <PhCheck className="text-accent-foreground" size={8} weight="bold" />}
        </div>
      </div>

      {/* Name */}
      <div className="flex flex-col min-w-0 pr-4">
        <div className="flex items-center gap-2">
          {groupBy !== "status" && <StatusShapeIcon status={note.status} size={14} />}
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
            return null
          })()}
          <SourceIcon source={note.source} />
        </div>
        {showCardPreview && note.preview && (
          <span className="text-2xs text-muted-foreground truncate pl-6 mt-0.5">{note.preview}</span>
        )}
      </div>

      {/* Status */}
      {visibleCols.includes("status") && (
        <div className="flex items-center justify-end">
          <StatusBadge status={note.status} />
        </div>
      )}

      {/* Folder */}
      {visibleCols.includes("folder") && (
        <div className="flex items-center justify-center px-2">
          {note.folderId ? (() => {
            const folder = folders.find((f: Folder) => f.id === note.folderId)
            if (!folder) return <span className="text-note text-muted-foreground">—</span>
            return (
              <span className="text-note text-foreground truncate">{folder.name}</span>
            )
          })() : (
            <span className="text-note text-muted-foreground">—</span>
          )}
        </div>
      )}

      {/* Links */}
      {visibleCols.includes("links") && (
        <div className="text-center px-1">
          <span className={`tabular-nums text-note ${links === 0 ? "text-muted-foreground" : "text-foreground"}`}>
            {links}
          </span>
        </div>
      )}

      {/* Reads */}
      {visibleCols.includes("reads") && (
        <div className="text-center px-1">
          <span className={`tabular-nums text-note ${note.reads === 0 ? "text-muted-foreground" : "text-foreground"}`}>
            {note.reads}
          </span>
        </div>
      )}

      {/* Word Count */}
      {visibleCols.includes("wordCount") && (
        <div className="text-right px-1">
          <span className={`tabular-nums text-note ${wordCount === 0 ? "text-muted-foreground" : "text-foreground"}`}>
            {wordCount}
          </span>
        </div>
      )}

      {/* Updated - relative time like Linear */}
      {visibleCols.includes("updatedAt") && (
        <div className="text-right px-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="tabular-nums text-note text-muted-foreground cursor-default">
                {shortRelative(note.updatedAt)}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-2xs">
              {format(new Date(note.updatedAt), "MMM d, yyyy 'at' h:mm a")}
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Created - absolute date like Linear */}
      {visibleCols.includes("createdAt") && (
        <div className="text-right px-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="tabular-nums text-note text-muted-foreground cursor-default">
                {absDate(note.createdAt)}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-2xs">
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
            <ContextMenuItem onClick={onKeep} className="text-note">
              <PhCheck className="mr-2 text-accent" size={16} weight="bold" />
              Done
              <span className="ml-auto text-2xs text-muted-foreground">D</span>
            </ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger className="text-note">
                <Alarm className="mr-2 text-muted-foreground" size={16} weight="regular" />
                Snooze
                <span className="ml-auto text-2xs text-muted-foreground">S</span>
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-44">
                <ContextMenuItem onClick={() => onSnooze("3h")} className="text-note">
                  3 hours
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onSnooze("tomorrow")} className="text-note">
                  Tomorrow 10:00 AM
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onSnooze("3-days")} className="text-note">
                  In 3 days
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onSnooze("next-week")} className="text-note">
                  Next week 10:00 AM
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onSnooze("1-week")} className="text-note">
                  In 1 week
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuItem onClick={onTrash} className="text-note text-destructive focus:text-destructive">
              <Trash className="mr-2" size={16} weight="regular" />
              Trash
              <span className="ml-auto text-2xs">T</span>
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}

        {/* Capture actions */}
        {note.status === "capture" && (
          <>
            <ContextMenuItem onClick={onPromote} className="text-note">
              <ArrowUpRight className="mr-2 text-chart-5" size={16} weight="regular" />
              Promote to Permanent
              <span className="ml-auto text-2xs text-muted-foreground">P</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={onMoveBack} className="text-note">
              <Tray className="mr-2 text-muted-foreground" size={16} weight="regular" />
              Back to Inbox
              <span className="ml-auto text-2xs text-muted-foreground">B</span>
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}

        {/* Permanent actions */}
        {note.status === "permanent" && (
          <>
            <ContextMenuItem onClick={onDemote} className="text-note">
              <ArrowDownLeft className="mr-2 text-muted-foreground" size={16} weight="regular" />
              Demote to Capture
              <span className="ml-auto text-2xs text-muted-foreground">D</span>
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}

        {/* Remind me (all notes) */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="text-note">
            <Bell className="mr-2 text-muted-foreground" size={16} weight="regular" />
            Remind me
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem onClick={() => onRemind(getSnoozeTime("3h"))} className="text-note">
              <PhClock className="mr-2 text-muted-foreground" size={16} weight="regular" />
              <span>Later today</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onRemind(getSnoozeTime("tomorrow"))} className="text-note">
              <PhClock className="mr-2 text-muted-foreground" size={16} weight="regular" />
              <span>Tomorrow</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onRemind(getSnoozeTime("3-days"))} className="text-note">
              <PhClock className="mr-2 text-muted-foreground" size={16} weight="regular" />
              <span>In 3 days</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onRemind(getSnoozeTime("next-week"))} className="text-note">
              <PhClock className="mr-2 text-muted-foreground" size={16} weight="regular" />
              <span>Next week</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onRemind(getSnoozeTime("1-week"))} className="text-note">
              <PhClock className="mr-2 text-muted-foreground" size={16} weight="regular" />
              <span>In 1 week</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />

        {/* Common actions */}
        <ContextMenuItem onClick={onOpen} className="text-note">
          <FileText className="mr-2 text-muted-foreground" size={16} weight="regular" />
          Open
        </ContextMenuItem>
        <ContextMenuItem onClick={onMergeWith} className="text-note">
          <GitMerge className="mr-2 text-muted-foreground" size={16} weight="regular" />
          GitMerge with...
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => setSplitTargetNoteId(note.id)}
          className="text-note"
        >
          <Scissors className="mr-2 text-muted-foreground" size={16} weight="regular" />
          Split this note...
        </ContextMenuItem>
        <ContextMenuItem onClick={onLinkWith} className="text-note">
          <PhLink className="mr-2 text-muted-foreground" size={16} weight="regular" />
          Link to...
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => usePlotStore.getState().openInSecondary(note.id)} className="text-note">
          <SplitHorizontal className="mr-2 text-muted-foreground" size={16} weight="regular" />
          Open in Split View
          <span className="ml-auto text-2xs text-muted-foreground">{navigator?.platform?.includes("Mac") ? "⌘\\" : "Ctrl+\\"}</span>
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
  prev.note.preview === next.note.preview &&
  prev.links === next.links &&
  prev.isActive === next.isActive &&
  prev.isSelected === next.isSelected &&
  prev.selectionActive === next.selectionActive &&
  prev.isCompact === next.isCompact &&
  prev.viewMode === next.viewMode &&
  prev.visibleColumns === next.visibleColumns &&
  prev.gridTemplate === next.gridTemplate &&
  prev.showCardPreview === next.showCardPreview &&
  prev.groupBy === next.groupBy
)
