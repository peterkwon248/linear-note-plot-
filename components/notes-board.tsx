"use client"

import { useState, useEffect, useMemo, useRef, memo, useCallback } from "react"
import {
  DndContext,
  DragOverlay,
  useDroppable,
  useDraggable,
  PointerSensor,
  KeyboardSensor,
  useSensors,
  useSensor,
} from "@dnd-kit/core"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { ArrowsDownUp } from "@phosphor-icons/react/dist/ssr/ArrowsDownUp"
import { ArrowUp } from "@phosphor-icons/react/dist/ssr/ArrowUp"
import { ArrowDown } from "@phosphor-icons/react/dist/ssr/ArrowDown"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { Link as PhLink } from "@phosphor-icons/react/dist/ssr/Link"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"
import { Alarm } from "@phosphor-icons/react/dist/ssr/Alarm"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr/ArrowUpRight"
import { ArrowDownLeft } from "@phosphor-icons/react/dist/ssr/ArrowDownLeft"
import { Tray as InboxIcon } from "@phosphor-icons/react/dist/ssr/Tray"
import { Clock as PhClock } from "@phosphor-icons/react/dist/ssr/Clock"
import { Bell } from "@phosphor-icons/react/dist/ssr/Bell"
import { FolderOpen } from "@phosphor-icons/react/dist/ssr/FolderOpen"
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core"
import { SortableContext, horizontalListSortingStrategy, arrayMove, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
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
import { usePlotStore } from "@/lib/store"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { toast } from "sonner"
import { getSnoozeTime, type SnoozePreset } from "@/lib/queries/notes"
import { useNotesView } from "@/lib/view-engine/use-notes-view"
import type { ViewContextKey, SortField, GroupBy, NoteGroup, FilterRule } from "@/lib/view-engine/types"
import { StatusBadge, PriorityBadge, STATUS_CONFIG, PRIORITY_CONFIG } from "@/components/note-fields"
import { BoardWorkbench } from "@/components/board-workbench"
import type { Note, NoteStatus, NotePriority, TriageStatus, Folder } from "@/lib/types"
import { FilterChipBar } from "@/components/filter-bar"
import { ViewHeader } from "@/components/view-header"
import { FilterPanel } from "@/components/filter-panel"
import { DisplayPanel } from "@/components/display-panel"
import { NOTES_VIEW_CONFIG } from "@/lib/view-engine/view-configs"
import { setActiveFolderId } from "@/lib/table-route"
import { TRIAGE_HEX, LINK_DENSITY_HEX } from "@/lib/colors"
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
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-md border border-border bg-surface-overlay py-1 shadow-md animate-in fade-in-0 zoom-in-95 duration-200">
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

const COLUMN_CARD_LIMIT = 10

/* ── Constants ─────────────────────────────────────────── */

/** Default groupBy per context tab for board mode */
const BOARD_DEFAULT_GROUP: Partial<Record<ViewContextKey, GroupBy>> = {
  inbox: "triage",
  capture: "linkCount",
  permanent: "linkCount",
}

/** Tabs that filter to a single status — status grouping produces only 1 column */
const SINGLE_STATUS_TABS: ViewContextKey[] = ["inbox", "capture", "permanent"]

const GROUP_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: "none", label: "No grouping" },
  { value: "status", label: "Status" },
  { value: "priority", label: "Priority" },
  { value: "triage", label: "Triage" },
  { value: "linkCount", label: "Links" },
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

/* ── BoardColumn ─────────────────────────────────────── */

function BoardColumn({
  group,
  groupBy,
  children,
  isDragDisabled,
  dragCount,
  activeDragId,
}: {
  group: NoteGroup
  groupBy: GroupBy
  children: React.ReactNode
  isDragDisabled: boolean
  dragCount: number
  activeDragId: string | null
}) {
  // Sortable for column reorder (drag handle on header)
  const {
    setNodeRef: setSortableRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `col-${group.key}`,
    disabled: isDragDisabled,
  })

  // Droppable for card drops (cards land on the column)
  const { setNodeRef: setDropRef, isOver: isCardOver } = useDroppable({
    id: group.key,
    disabled: isDragDisabled,
  })

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const headerColor = useMemo(() => {
    if (groupBy === "status") {
      const cfg = STATUS_CONFIG[group.key as NoteStatus]
      return cfg ? { color: cfg.color, bg: cfg.bg } : null
    }
    if (groupBy === "priority") {
      const cfg = PRIORITY_CONFIG[group.key as NotePriority]
      return cfg ? { color: cfg.color, bg: `${cfg.color}1a` } : null
    }
    if (groupBy === "triage") {
      const c = TRIAGE_HEX[group.key as keyof typeof TRIAGE_HEX]
      return c ? { color: c, bg: `${c}1a` } : null
    }
    if (groupBy === "linkCount") {
      const c = LINK_DENSITY_HEX[group.key as keyof typeof LINK_DENSITY_HEX]
      return c ? { color: c, bg: `${c}1a` } : null
    }
    if (groupBy === "label") {
      const labels = usePlotStore.getState().labels
      const label = labels.find((l) => l.id === group.key)
      return label ? { color: label.color, bg: `${label.color}1a` } : null
    }
    if (groupBy === "folder") {
      const folders = usePlotStore.getState().folders
      const folder = folders.find((f) => f.id === group.key)
      return folder?.color ? { color: folder.color, bg: `${folder.color}1a` } : null
    }
    return null
  }, [groupBy, group.key])

  return (
    <div
      ref={(node) => { setSortableRef(node); setDropRef(node); }}
      style={sortableStyle}
      className={`flex w-[260px] shrink-0 flex-col rounded-lg transition-colors ${
        isCardOver ? "bg-accent/8 ring-1 ring-accent/30" : "bg-secondary/20"
      }`}
    >
      {/* Column header — drag handle for column reorder */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        {headerColor && (
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: headerColor.color }} />
        )}
        <span className="text-sm font-semibold text-foreground">{group.label}</span>
        <span className="text-xs text-muted-foreground">{group.notes.length}</span>
      </div>
      {/* Drop feedback banner */}
      {isCardOver && activeDragId && !activeDragId.startsWith("col-") && (
        <div className="mx-1.5 mb-1 rounded-md bg-accent/10 px-2.5 py-1.5 text-center text-xs font-medium text-accent animate-in fade-in duration-150">
          Move {dragCount && dragCount > 1 ? `${dragCount} notes` : "here"}
        </div>
      )}
      {/* Cards container */}
      <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-1.5 pb-1.5 max-h-[calc(100vh-200px)]">
        {children}
      </div>
    </div>
  )
}

/* ── BoardCard ───────────────────────────────────────── */

interface BoardCardProps {
  note: Note
  links: number
  folders: Folder[]
  isActive?: boolean
  isSelected?: boolean
  isDragOverlay?: boolean
  showCardPreview?: boolean
  groupBy: GroupBy
  onClick: () => void
  onDoubleClick?: () => void
  onSelect?: (noteId: string, e: React.MouseEvent) => void
  onStatus: (s: NoteStatus) => void
  onPriority: (p: NotePriority) => void
  onKeep: () => void
  onSnooze: (opt: SnoozePreset) => void
  onTrash: () => void
  onPromote: () => void
  onDemote: () => void
  onMoveBack: () => void
  onRemind: (isoDate: string) => void
}

function BoardCardInner({
  note,
  links,
  folders,
  isActive,
  isSelected,
  isDragOverlay,
  showCardPreview,
  groupBy,
  onClick,
  onDoubleClick,
  onSelect,
  onKeep,
  onSnooze,
  onTrash,
  onPromote,
  onDemote,
  onMoveBack,
  onRemind,
}: BoardCardProps) {
  const isDragDisabled = groupBy === "date" || groupBy === "linkCount"
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: note.id,
    disabled: isDragDisabled,
  })

  const dragStyle = transform
    ? { transform: CSS.Transform.toString(transform), opacity: isDragging ? 0.5 : 1, touchAction: "none" as const }
    : { touchAction: "none" as const }

  const folder = note.folderId ? folders.find((f) => f.id === note.folderId) : null

  /* Visual card — no drag refs, just presentation + click */
  const cardVisual = (
    <div
      data-board-card
      data-note-id={note.id}
      onClick={(e) => {
        if (isDragOverlay) return
        if (onSelect) {
          e.stopPropagation()
          onSelect(note.id, e)
        } else {
          onClick()
        }
      }}
      onDoubleClick={(e) => {
        if (isDragOverlay) return
        e.stopPropagation()
        onDoubleClick?.()
      }}
      className={`group relative cursor-pointer rounded-md border bg-background p-2.5 transition-all hover:border-muted-foreground/30 ${
        isSelected ? "border-accent/50 bg-accent/5 ring-1 ring-accent/20"
        : isActive ? "border-accent ring-1 ring-accent/30"
        : "border-border"
      } ${isDragOverlay ? "shadow-lg rotate-[2deg]" : ""} ${isDragging ? "opacity-50" : ""}`}
    >
      {/* Selection checkbox — hover or selected */}
      <div
        className={`absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded border transition-all cursor-pointer ${
          isSelected
            ? "bg-accent border-accent"
            : "border-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:border-muted-foreground/50 bg-background"
        }`}
        onClick={(e) => {
          e.stopPropagation()
          onSelect?.(note.id, e)
        }}
      >
        {isSelected && <PhCheck className="text-accent-foreground" size={10} weight="bold" />}
      </div>

      {/* Title row */}
      <div className="flex items-start gap-2">
        {groupBy !== "status" && (
          <StatusBadge status={note.status} />
        )}
        <span className="flex-1 truncate text-ui font-medium text-foreground leading-snug">
          {note.title || "Untitled"}
        </span>
      </div>

      {/* Preview text */}
      {showCardPreview !== false && note.preview && (
        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground leading-relaxed">
          {note.preview}
        </p>
      )}

      {/* Bottom row: priority + project + links */}
      <div className="mt-2 flex items-center gap-2">
        {groupBy !== "priority" && note.priority !== "none" && (
          <PriorityBadge priority={note.priority} />
        )}
        {folder && (
          <span className="truncate rounded-sm bg-secondary px-1.5 py-0.5 text-2xs font-medium text-muted-foreground">
            {folder.name}
          </span>
        )}
        {links > 0 && (
          <span className="flex items-center gap-0.5 text-2xs text-muted-foreground">
            <PhLink size={10} weight="regular" />
            {links}
          </span>
        )}
      </div>
    </div>
  )

  /* Drag overlay: just the visual, no drag handling */
  if (isDragOverlay) return cardVisual

  /* Drag wrapper (outer) → ContextMenu (inner) → card visual */
  const contextWrapped = isDragDisabled ? cardVisual : (
    <ContextMenu>
      <ContextMenuTrigger asChild>{cardVisual}</ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        {note.status === "inbox" && note.triageStatus !== "trashed" && (
          <>
            <ContextMenuItem onClick={onKeep} className="text-sm">
              <PhCheck className="mr-2 text-accent" size={16} weight="bold" /> Done
            </ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger className="text-sm">
                <Alarm className="mr-2 text-muted-foreground" size={16} weight="regular" /> Snooze
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
              <Trash className="mr-2" size={16} weight="regular" /> Trash
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        {note.status === "capture" && (
          <>
            <ContextMenuItem onClick={onPromote} className="text-sm">
              <ArrowUpRight className="mr-2 text-chart-5" size={16} weight="regular" /> Promote to Permanent
            </ContextMenuItem>
            <ContextMenuItem onClick={onMoveBack} className="text-sm">
              <InboxIcon className="mr-2 text-muted-foreground" size={16} weight="regular" /> Back to Inbox
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        {note.status === "permanent" && (
          <>
            <ContextMenuItem onClick={onDemote} className="text-sm">
              <ArrowDownLeft className="mr-2 text-muted-foreground" size={16} weight="regular" /> Demote to Capture
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        {/* Remind me (all notes) */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="text-sm">
            <Bell className="mr-2 text-muted-foreground" size={16} weight="regular" />
            Remind me
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem onClick={() => onRemind(getSnoozeTime("3h"))} className="text-sm">
              <PhClock className="mr-2 text-muted-foreground" size={16} weight="regular" />
              <span>Later today</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onRemind(getSnoozeTime("tomorrow"))} className="text-sm">
              <PhClock className="mr-2 text-muted-foreground" size={16} weight="regular" />
              <span>Tomorrow</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onRemind(getSnoozeTime("3-days"))} className="text-sm">
              <PhClock className="mr-2 text-muted-foreground" size={16} weight="regular" />
              <span>In 3 days</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onRemind(getSnoozeTime("next-week"))} className="text-sm">
              <PhClock className="mr-2 text-muted-foreground" size={16} weight="regular" />
              <span>Next week</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onRemind(getSnoozeTime("1-week"))} className="text-sm">
              <PhClock className="mr-2 text-muted-foreground" size={16} weight="regular" />
              <span>In 1 week</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />

        <ContextMenuItem onClick={onClick} className="text-sm">
          <FileText className="mr-2 text-muted-foreground" size={16} weight="regular" /> Open
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )

  return (
    <div ref={setNodeRef} style={dragStyle} {...attributes} {...listeners} data-drag-id={note.id}>
      {contextWrapped}
    </div>
  )
}

const BoardCard = memo(BoardCardInner, (prev, next) =>
  prev.note.id === next.note.id &&
  prev.note.updatedAt === next.note.updatedAt &&
  prev.note.status === next.note.status &&
  prev.note.priority === next.note.priority &&
  prev.note.folderId === next.note.folderId &&
  prev.note.title === next.note.title &&
  prev.note.preview === next.note.preview &&
  prev.links === next.links &&
  prev.showCardPreview === next.showCardPreview &&
  prev.isActive === next.isActive &&
  prev.isSelected === next.isSelected &&
  prev.groupBy === next.groupBy &&
  prev.onDoubleClick === next.onDoubleClick
)

/* ── Field update helper for drag & drop ─────────────── */

function getFieldUpdate(groupBy: GroupBy, targetKey: string): Partial<Note> | null {
  switch (groupBy) {
    case "status": return { status: targetKey as NoteStatus }
    case "priority": return { priority: targetKey as NotePriority }
    case "triage": return { triageStatus: targetKey as TriageStatus }
    case "folder": return { folderId: targetKey === "_no_folder" ? null : targetKey }
    default: return null
  }
}

/* ── NotesBoard ──────────────────────────────────────── */

export function NotesBoard({
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
  createNoteOverrides?: Partial<Note>
  hideCreateButton?: boolean
  folderId?: string
  tagId?: string
  labelId?: string
}) {
  const notes = usePlotStore((s) => s.notes)
  const updateNote = usePlotStore((s) => s.updateNote)
  const batchUpdateNotes = usePlotStore((s) => s.batchUpdateNotes)
  const openNote = usePlotStore((s) => s.openNote)
  const createNote = usePlotStore((s) => s.createNote)
  const triageKeep = usePlotStore((s) => s.triageKeep)
  const triageSnooze = usePlotStore((s) => s.triageSnooze)
  const triageTrash = usePlotStore((s) => s.triageTrash)
  const promoteToPermanent = usePlotStore((s) => s.promoteToPermanent)
  const undoPromote = usePlotStore((s) => s.undoPromote)
  const moveBackToInbox = usePlotStore((s) => s.moveBackToInbox)
  const setReminder = usePlotStore((s) => s.setReminder)
  const folders = usePlotStore((s) => s.folders)
  const tags = usePlotStore((s) => s.tags)
  const labels = usePlotStore((s) => s.labels)

  const searchQuery = usePlotStore((s) => s.searchQuery)
  const setSearchQuery = usePlotStore((s) => s.setSearchQuery)
  const sidePanelOpen = usePlotStore((s) => s.sidePanelOpen)

  const effectiveTab = context ?? "all"

  const backlinksMap = useBacklinksIndex()

  const { flatNotes, groups, viewState, updateViewState } = useNotesView(effectiveTab, { backlinksMap, folderId, tagId, labelId })

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
      if (cat.key === "priority") {
        return { ...cat, values: cat.values.map(v => ({ ...v, count: notes.filter(n => !n.trashed && n.priority === v.key).length })) }
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

  // Auto-set groupBy: board requires grouping, and single-status tabs need contextual grouping
  const isSingleStatusTab = SINGLE_STATUS_TABS.includes(effectiveTab)
  const tabDefault = BOARD_DEFAULT_GROUP[effectiveTab]
  useEffect(() => {
    if (viewState.groupBy === "none") {
      // Board requires grouping — use tab-specific default or "status"
      updateViewState({ groupBy: tabDefault ?? "status" })
    } else if (viewState.groupBy === "status" && isSingleStatusTab) {
      // Single-status tab + status grouping = 1 column → use tab default
      updateViewState({ groupBy: tabDefault ?? "priority" })
    }
  }, [effectiveTab, isSingleStatusTab, tabDefault, viewState.groupBy, updateViewState])

  // Clear selection when tab changes
  useEffect(() => {
    setSelectedIds(new Set())
  }, [effectiveTab])

  // Column card limit state
  const [expandedColumns, setExpandedColumns] = useState<Set<string>>(new Set())

  // Sub-group collapse state
  const [collapsedSubGroups, setCollapsedSubGroups] = useState<Set<string>>(new Set())
  const toggleSubGroup = useCallback((key: string) => {
    setCollapsedSubGroups(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Drag-select state
  const [dragRect, setDragRect] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  const isDragSelectingRef = useRef(false)
  const wasDragSelectingRef = useRef(false)
  const boardContainerRef = useRef<HTMLDivElement>(null)

  // DnD state
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const isColumnDrag = activeDragId?.startsWith("col-") ?? false
  const activeDragNote = activeDragId && !isColumnDrag ? notes.find((n) => n.id === activeDragId) : null
  const dragCount = activeDragId && !isColumnDrag && selectedIds.has(activeDragId) ? selectedIds.size : 1

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  const isDragDisabled = viewState.groupBy === "date" || viewState.groupBy === "linkCount"

  // Resolve folder names for folder-grouped board
  const resolvedGroups = useMemo(() => {
    if (viewState.groupBy !== "folder") return groups
    return groups.map((g) => {
      if (g.key === "_no_folder") return g
      const folder = folders.find((f) => f.id === g.key)
      return folder ? { ...g, label: folder.name } : g
    })
  }, [groups, viewState.groupBy, folders])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const dragId = event.active.id as string
    setActiveDragId(dragId)
    // Column drag — no card selection logic
    if (dragId.startsWith("col-")) return
    // If dragging an unselected card, clear multi-selection
    if (!selectedIds.has(dragId)) {
      setSelectedIds(new Set())
    }
  }, [selectedIds])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over) { setActiveDragId(null); return }

    const activeId = active.id as string
    const overId = over.id as string

    // ── Column reorder: both IDs start with "col-" ──
    if (activeId.startsWith("col-") && overId.startsWith("col-")) {
      const activeKey = activeId.replace("col-", "")
      const overKey = overId.replace("col-", "")
      if (activeKey !== overKey) {
        const currentOrder = resolvedGroups.map(g => g.key)
        const oldIndex = currentOrder.indexOf(activeKey)
        const newIndex = currentOrder.indexOf(overKey)
        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(currentOrder, oldIndex, newIndex)
          updateViewState({
            groupOrder: {
              ...(viewState.groupOrder ?? {}),
              [viewState.groupBy]: newOrder,
            },
          })
        }
      }
      setActiveDragId(null)
      return
    }

    // ── Card drag (existing logic) ──
    const noteId = activeId
    const targetKey = overId

    // Find which group the note is currently in
    const currentGroup = groups.find((g) => g.notes.some((n) => n.id === noteId))
    if (currentGroup && currentGroup.key === targetKey) { setActiveDragId(null); return }

    const fieldUpdate = getFieldUpdate(viewState.groupBy, targetKey)
    if (!fieldUpdate) { setActiveDragId(null); return }

    const targetGroup = groups.find(g => g.key === targetKey)

    // Multi-card or single-card update
    const idsToUpdate = selectedIds.has(noteId) && selectedIds.size > 1
      ? Array.from(selectedIds)
      : [noteId]

    if (idsToUpdate.length > 1) {
      batchUpdateNotes(idsToUpdate, fieldUpdate)
      toast.success(`Moved ${idsToUpdate.length} notes to ${targetGroup?.label ?? targetKey}`)
    } else {
      updateNote(idsToUpdate[0], fieldUpdate)
      const draggedNote = notes.find(n => n.id === idsToUpdate[0])
      toast.success(`Moved "${draggedNote?.title ?? "Note"}" to ${targetGroup?.label ?? targetKey}`)
    }

    setSelectedIds(new Set())
    setActiveDragId(null)
  }, [groups, resolvedGroups, viewState, updateViewState, updateNote, batchUpdateNotes, selectedIds, notes])

  // Drag-select mouse handlers
  const handleBoardMouseDown = useCallback((e: React.MouseEvent) => {
    // Only respond to primary button
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    // Let dnd-kit handle card drags and column headers/checkboxes
    if (target.closest('[data-board-card]')) return
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    isDragSelectingRef.current = false
    e.preventDefault()
  }, [])

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!dragStartRef.current) return
      const dx = e.clientX - dragStartRef.current.x
      const dy = e.clientY - dragStartRef.current.y
      // Start drag-select only after 5px movement
      if (!isDragSelectingRef.current && Math.sqrt(dx * dx + dy * dy) < 5) return
      isDragSelectingRef.current = true

      const rect = {
        x1: dragStartRef.current.x,
        y1: dragStartRef.current.y,
        x2: e.clientX,
        y2: e.clientY,
      }
      setDragRect(rect)

      // Calculate selection from intersecting cards
      const selLeft = Math.min(rect.x1, rect.x2)
      const selRight = Math.max(rect.x1, rect.x2)
      const selTop = Math.min(rect.y1, rect.y2)
      const selBottom = Math.max(rect.y1, rect.y2)

      const cards = document.querySelectorAll<HTMLElement>('[data-board-card]')
      const newSelected = new Set<string>()
      cards.forEach((card) => {
        const cardRect = card.getBoundingClientRect()
        const intersects =
          cardRect.left < selRight &&
          cardRect.right > selLeft &&
          cardRect.top < selBottom &&
          cardRect.bottom > selTop
        if (intersects) {
          const noteId = card.dataset.noteId
          if (noteId) {
            newSelected.add(noteId)
          }
        }
      })
      setSelectedIds(newSelected)
    }

    function handleMouseUp() {
      if (isDragSelectingRef.current) {
        setDragRect(null)
        wasDragSelectingRef.current = true
        // Reset after a tick so the subsequent click event is suppressed
        requestAnimationFrame(() => { wasDragSelectingRef.current = false })
      }
      dragStartRef.current = null
      isDragSelectingRef.current = false
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const handleCardSelect = useCallback((noteId: string, e: React.MouseEvent) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(noteId)) {
        next.delete(noteId)
      } else {
        next.add(noteId)
      }
      return next
    })
  }, [])

  // When exactly 1 note selected, set previewNoteId so SidePanel can show it
  useEffect(() => {
    if (selectedIds.size === 1) {
      onRowClick?.(Array.from(selectedIds)[0])
    }
  }, [selectedIds.size]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectMany = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids))
  }, [])

  return (
    <main className="flex h-full flex-1 flex-col overflow-hidden bg-background">
      <ViewHeader
        icon={<FileText size={20} weight="regular" />}
        title={title ?? "Notes"}
        count={flatNotes.length}
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
        <FilterChipBar
          filters={viewState.filters}
          groupBy={viewState.groupBy}
          isSingleStatusTab={isSingleStatusTab}
          folders={folders}
          tags={tags}
          labels={labels}
          onToggleFilter={(field, value, op) => {
            const exists = viewState.filters.some(
              (f) => f.field === field && f.operator === (op ?? "eq") && f.value === value
            )
            if (exists) {
              updateViewState({
                filters: viewState.filters.filter((f) => !(f.field === field && f.operator === (op ?? "eq") && f.value === value)),
              })
            } else {
              updateViewState({ filters: [...viewState.filters, { field, operator: op ?? "eq", value }] })
            }
          }}
          onRemoveFilter={(idx) => updateViewState({ filters: viewState.filters.filter((_, i) => i !== idx) })}
          onClearAll={() => updateViewState({ filters: [] })}
          onSetFilters={(filters) => updateViewState({ filters })}
        />
      </ViewHeader>

      {/* ── Folder indicator ──────────────────────────────── */}
      {folderId && (() => {
        const folderName = folders.find((f) => f.id === folderId)?.name
        return folderName ? (
          <div className="flex shrink-0 items-center gap-1.5 border-b border-border px-5 py-1.5">
            <FolderOpen className="text-muted-foreground" size={14} weight="regular" />
            <span className="text-note text-foreground">{folderName}</span>
            <button
              onClick={() => setActiveFolderId(null)}
              className="ml-1 rounded-sm p-0.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <PhX size={12} weight="regular" />
            </button>
          </div>
        ) : null
      })()}

      {/* Board area + Distribution panel */}
      <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
      {flatNotes.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-center">
          <div>
            <FileText className="mx-auto mb-3 text-muted-foreground/40" size={40} weight="regular" />
            <p className="text-ui text-muted-foreground">No notes found</p>
            <p className="mt-1 text-sm text-muted-foreground/60">
              {viewState.filters.length > 0 ? "Try adjusting your filters." : "Create your first note to get started."}
            </p>
          </div>
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div
            ref={boardContainerRef}
            className="flex flex-1 gap-3 overflow-x-auto px-5 py-4"
            onMouseDown={handleBoardMouseDown}
            onClick={(e) => {
              // Suppress click after drag-select
              if (wasDragSelectingRef.current) return
              // Clear selection when clicking empty space (not on a card or workbench)
              const target = e.target as HTMLElement
              if (!target.closest('[data-board-card]') && !target.closest('[data-board-workbench]') && !target.closest('button')) {
                setSelectedIds(new Set())
                usePlotStore.getState().setPreviewNoteId(null)
              }
            }}
          >
            <SortableContext
              items={resolvedGroups.map(g => `col-${g.key}`)}
              strategy={horizontalListSortingStrategy}
            >
              {resolvedGroups.map((group) => {
                if (group.notes.length === 0 && !viewState.showEmptyGroups) return null
                const isExpanded = expandedColumns.has(group.key)
                const totalNotes = group.notes.length
                const cardLimit = isExpanded ? Infinity : COLUMN_CARD_LIMIT
                const hiddenCount = totalNotes - COLUMN_CARD_LIMIT

                const renderCard = (note: Note) => (
                  <BoardCard
                    key={note.id}
                    note={note}
                    links={backlinksMap.get(note.id) ?? 0}
                    folders={folders}
                    isActive={activePreviewId === note.id}
                    isSelected={selectedIds.has(note.id)}
                    showCardPreview={viewState.toggles?.showCardPreview !== false}
                    groupBy={viewState.groupBy}
                    onClick={() => {
                      setSelectedIds(new Set())
                      onRowClick?.(note.id)
                    }}
                    onDoubleClick={() => {
                      openNote(note.id)
                    }}
                    onSelect={handleCardSelect}
                    onStatus={(s) => updateNote(note.id, { status: s })}
                    onPriority={(p) => updateNote(note.id, { priority: p })}
                    onKeep={() => triageKeep(note.id)}
                    onSnooze={(opt) => triageSnooze(note.id, getSnoozeTime(opt))}
                    onTrash={() => triageTrash(note.id)}
                    onPromote={() => promoteToPermanent(note.id)}
                    onDemote={() => undoPromote(note.id)}
                    onMoveBack={() => moveBackToInbox(note.id)}
                    onRemind={(isoDate) => { setReminder(note.id, isoDate); toast("Reminder set") }}
                  />
                )

                return (
                  <BoardColumn key={group.key} group={group} groupBy={viewState.groupBy} isDragDisabled={isDragDisabled} dragCount={dragCount} activeDragId={activeDragId}>
                    {group.subGroups && group.subGroups.length > 0 ? (
                      // Render sub-groups with headers
                      (() => {
                        let cardCount = 0
                        let limitReached = false
                        return (
                          <>
                            {group.subGroups.map(sub => {
                              if (limitReached) return null
                              const subKey = `${group.key}::${sub.key}`
                              const isCollapsed = collapsedSubGroups.has(subKey)
                              const subLabel = sub.key === "_none"
                                ? `No ${viewState.subGroupBy === "folder" ? "Folder" : viewState.subGroupBy === "label" ? "Label" : viewState.subGroupBy === "priority" ? "Priority" : viewState.subGroupBy === "status" ? "Status" : "Group"}`
                                : sub.label
                              // Calculate how many cards we can show in this sub-group
                              const remaining = cardLimit - cardCount
                              const notesToShow = isCollapsed ? [] : sub.notes.slice(0, remaining)
                              cardCount += notesToShow.length
                              if (cardCount >= cardLimit && !isExpanded) limitReached = true
                              return (
                                <div key={sub.key}>
                                  <button
                                    onClick={() => toggleSubGroup(subKey)}
                                    className="flex items-center gap-1.5 w-full px-1.5 py-1 mt-2 first:mt-0 rounded-md text-2xs text-muted-foreground hover:bg-hover-bg transition-colors"
                                  >
                                    <CaretRight className={`shrink-0 transition-transform ${isCollapsed ? "" : "rotate-90"}`} size={12} weight="regular" />
                                    <span className="font-medium truncate">{subLabel}</span>
                                    <span className="text-muted-foreground/50 tabular-nums ml-auto">{sub.notes.length}</span>
                                  </button>
                                  {!isCollapsed && notesToShow.map(renderCard)}
                                </div>
                              )
                            })}
                            {!isExpanded && hiddenCount > 0 && (
                              <button
                                onClick={() => setExpandedColumns((prev) => new Set([...prev, group.key]))}
                                className="mx-1.5 mb-1.5 rounded-md py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                              >
                                + {hiddenCount} more
                              </button>
                            )}
                          </>
                        )
                      })()
                    ) : (
                      // No sub-groups — flat card list (original logic)
                      <>
                        {(isExpanded ? group.notes : group.notes.slice(0, COLUMN_CARD_LIMIT)).map(renderCard)}
                        {!isExpanded && hiddenCount > 0 && (
                          <button
                            onClick={() => setExpandedColumns((prev) => new Set([...prev, group.key]))}
                            className="mx-1.5 mb-1.5 rounded-md py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                          >
                            + {hiddenCount} more
                          </button>
                        )}
                      </>
                    )}
                  </BoardColumn>
                )
              })}
            </SortableContext>

            {/* Processing Workbench: fills remaining space */}
            <BoardWorkbench
              selectedIds={selectedIds}
              effectiveTab={effectiveTab}
              groupBy={viewState.groupBy}
              notes={flatNotes}
              folders={folders}
              backlinksMap={backlinksMap}
              onClearSelection={() => setSelectedIds(new Set())}
              onSelectAll={() => setSelectedIds(new Set(flatNotes.map((n) => n.id)))}
              onSelectMany={handleSelectMany}
              onCardClick={onRowClick}
            />
          </div>

          <DragOverlay>
            {isColumnDrag && (() => {
              const key = activeDragId!.replace("col-", "")
              const group = resolvedGroups.find(g => g.key === key)
              if (!group) return null
              return (
                <div className="w-[260px] rounded-lg bg-secondary/40 border border-accent/30 px-3 py-2.5 opacity-80 shadow-lg">
                  <span className="text-sm font-semibold text-foreground">{group.label}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{group.notes.length}</span>
                </div>
              )
            })()}
            {activeDragNote && (
              <div className="relative">
                {/* Stacked cards behind for multi-drag */}
                {dragCount > 1 && (
                  <>
                    <div className="absolute inset-0 translate-x-1 translate-y-1 rounded-md border border-border bg-background opacity-60" />
                    <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-md border border-border bg-background opacity-30" />
                  </>
                )}
                {/* Main card */}
                <div className="relative">
                  <BoardCard
                    note={activeDragNote}
                    links={backlinksMap.get(activeDragNote.id) ?? 0}
                    folders={folders}
                    isDragOverlay
                    groupBy={viewState.groupBy}
                    onClick={() => {}}
                    onStatus={() => {}}
                    onPriority={() => {}}
                    onKeep={() => {}}
                    onSnooze={() => {}}
                    onTrash={() => {}}
                    onPromote={() => {}}
                    onDemote={() => {}}
                    onMoveBack={() => {}}
                    onRemind={() => {}}
                  />
                  {/* Count badge */}
                  {dragCount > 1 && (
                    <div className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-2xs font-bold text-accent-foreground shadow-sm">
                      {dragCount}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DragOverlay>

          {/* Drag-select rectangle overlay */}
          {dragRect && (
            <div
              className="fixed border border-accent/40 bg-accent/10 pointer-events-none z-50"
              style={{
                left: Math.min(dragRect.x1, dragRect.x2),
                top: Math.min(dragRect.y1, dragRect.y2),
                width: Math.abs(dragRect.x2 - dragRect.x1),
                height: Math.abs(dragRect.y2 - dragRect.y1),
              }}
            />
          )}
        </DndContext>
      )}
      </div>
      </div>
    </main>
  )
}
