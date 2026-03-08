"use client"

import { useState, useMemo, useRef, memo } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import {
  Plus,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
  Link2,
  Eye,
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
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
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
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { getSnoozeTime } from "@/lib/queries/notes"
import { useNotesView } from "@/lib/view-engine/use-notes-view"
import type { ViewContextKey, SortField, SortDirection, GroupBy, FilterRule, NoteGroup } from "@/lib/view-engine/types"
import { StatusDropdown, PriorityDropdown, StatusBadge, PriorityBadge, PROJECT_STATUS_CONFIG, ProjectStatusDropdown, ProjectDropdown } from "@/components/note-fields"
import { format } from "date-fns"
import { shortRelative } from "@/lib/format-utils"
import type { Note, NoteStatus, NotePriority, Project } from "@/lib/types"

/* ── Helpers ───────────────────────────────────────────── */

function absDate(dateStr: string): string {
  return format(new Date(dateStr), "MMM d")
}

/* ── Context tabs ──────────────────────────────────────── */

const TABS: { id: ViewContextKey; label: string }[] = [
  { id: "all", label: "All Notes" },
  { id: "inbox", label: "Inbox" },
  { id: "capture", label: "Capture" },
  { id: "reference", label: "Reference" },
  { id: "permanent", label: "Permanent" },
  { id: "unlinked", label: "Unlinked" },
]

/* ── Column + group config ─────────────────────────────── */

const COLUMN_DEFS: { id: string; label: string; width: string; align?: string; sortField: SortField }[] = [
  { id: "title", label: "Name", width: "flex-1 min-w-0", sortField: "title" },
  { id: "status", label: "Status", width: "w-[100px] shrink-0", align: "text-right", sortField: "status" },
  { id: "project", label: "Project", width: "w-[80px] shrink-0", align: "text-center", sortField: "project" },
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
  { value: "project", label: "Project" },
]

/* ── Filter chip display ───────────────────────────────── */

function formatFilterLabel(rule: FilterRule): string {
  if (rule.field === "links" && rule.operator === "eq" && rule.value === "0") return "Unlinked"
  if (rule.field === "reads" && rule.operator === "eq" && rule.value === "0") return "Unread"
  return `${rule.field}: ${rule.value}`
}

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
      className={`group/th inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground ${className}`}
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
}: {
  onRowClick?: (noteId: string) => void
  activePreviewId?: string | null
  context?: ViewContextKey
  title?: string
  showTabs?: boolean
  createNoteOverrides?: Partial<import("@/lib/types").Note>
  hideCreateButton?: boolean
}) {
  const notes = usePlotStore((s) => s.notes)
  const categories = usePlotStore((s) => s.categories)
  const updateNote = usePlotStore((s) => s.updateNote)
  const openNote = usePlotStore((s) => s.openNote)
  const createNote = usePlotStore((s) => s.createNote)
  const triageKeep = usePlotStore((s) => s.triageKeep)
  const triageSnooze = usePlotStore((s) => s.triageSnooze)
  const triageTrash = usePlotStore((s) => s.triageTrash)
  const promoteToPermament = usePlotStore((s) => s.promoteToPermament)
  const undoPromote = usePlotStore((s) => s.undoPromote)
  const moveBackToInbox = usePlotStore((s) => s.moveBackToInbox)

  const [activeTab, setActiveTab] = useState<ViewContextKey>("all")

  const effectiveTab = context ?? activeTab

  const backlinksMap = useBacklinksIndex()

  const projects = usePlotStore((s) => s.projects)

  const { flatNotes, groups, viewState, updateViewState } = useNotesView(effectiveTab, { backlinksMap })

  function handleSort(col: SortField) {
    if (viewState.sortField === col) {
      updateViewState({ sortDirection: viewState.sortDirection === "asc" ? "desc" : "asc" })
    } else {
      updateViewState({ sortField: col, sortDirection: col === "title" ? "asc" : "desc" })
    }
  }

  function addFilter(field: FilterRule["field"], value: string, operator: FilterRule["operator"] = "eq") {
    const newRule: FilterRule = { field, operator, value }
    const exists = viewState.filters.some(
      (f) => f.field === field && f.operator === operator && f.value === value
    )
    if (!exists) {
      updateViewState({ filters: [...viewState.filters, newRule] })
    }
  }

  function removeFilter(idx: number) {
    updateViewState({ filters: viewState.filters.filter((_, i) => i !== idx) })
  }

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

  return (
    <main className="flex h-full flex-1 flex-col overflow-hidden bg-background">
      {/* ── Page title ─────────────────────────────────── */}
      <header className="flex shrink-0 items-center justify-between px-5 pt-5 pb-1">
        <h1 className="text-base font-semibold text-foreground">{title ?? "Notes"}</h1>
        {!hideCreateButton && (
          <button
            className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-[12px] font-medium text-accent-foreground transition-colors hover:bg-accent/80"
            onClick={() => createNote(createNoteOverrides ?? {})}
          >
            <Plus className="h-3 w-3" />
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
                className={`relative px-3 py-2 text-[13px] font-medium transition-colors ${
                  effectiveTab === tab.id
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                {effectiveTab === tab.id && (
                  <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-accent" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Right toolbar */}
        <div className="flex items-center gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                <Filter className="h-3 w-3" />
                Filter
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground" disabled>
                Status
              </DropdownMenuItem>
              {(["inbox", "capture", "reference", "permanent"] as NoteStatus[]).map((s) => (
                <DropdownMenuItem key={s} onClick={() => addFilter("status", s)}>
                  <StatusBadge status={s} />
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground" disabled>
                Priority
              </DropdownMenuItem>
              {(["urgent", "high", "medium", "low", "none"] as NotePriority[]).map((p) => (
                <DropdownMenuItem key={p} onClick={() => addFilter("priority", p)}>
                  <PriorityBadge priority={p} />
                  <span className="ml-2 text-[12px] capitalize">{p === "none" ? "No priority" : p}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => addFilter("links", "0")}>
                <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[12px]">Unlinked notes</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addFilter("reads", "0")}>
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[12px]">Unread notes</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                <SlidersHorizontal className="h-3 w-3" />
                Display
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-4 space-y-4" align="end">
              {/* Grouping row */}
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-muted-foreground">Grouping</span>
                <select
                  value={viewState.groupBy}
                  onChange={(e) => updateViewState({ groupBy: e.target.value as GroupBy })}
                  className="rounded-md border border-border bg-secondary px-2 py-1 text-[12px] text-foreground outline-none cursor-pointer"
                >
                  {GROUP_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Ordering row */}
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-muted-foreground">Ordering</span>
                <div className="flex items-center gap-1">
                  <select
                    value={viewState.sortField}
                    onChange={(e) => updateViewState({ sortField: e.target.value as SortField })}
                    className="rounded-md border border-border bg-secondary px-2 py-1 text-[12px] text-foreground outline-none cursor-pointer"
                  >
                    {COLUMN_DEFS.map((col) => {
                      const labels: Record<string, string> = {
                        updatedAt: "Updated",
                        createdAt: "Created",
                        priority: "Priority",
                        title: "Title",
                        status: "Status",
                        links: "Links",
                        reads: "Reads",
                        project: "Project",
                      }
                      return (
                        <option key={col.sortField} value={col.sortField}>
                          {labels[col.sortField] ?? col.label}
                        </option>
                      )
                    })}
                  </select>
                  <button
                    onClick={() => updateViewState({ sortDirection: viewState.sortDirection === "asc" ? "desc" : "asc" })}
                    className="flex items-center justify-center rounded-md border border-border bg-secondary p-1 text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground"
                  >
                    {viewState.sortDirection === "asc"
                      ? <ArrowUp className="h-3 w-3" />
                      : <ArrowDown className="h-3 w-3" />
                    }
                  </button>
                </div>
              </div>

              {/* Show empty groups toggle */}
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-muted-foreground">Show empty groups</span>
                <button
                  onClick={() => updateViewState({ showEmptyGroups: !viewState.showEmptyGroups })}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    viewState.showEmptyGroups ? "bg-accent" : "bg-secondary border border-border"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                      viewState.showEmptyGroups ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Display properties section */}
              <div className="space-y-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Display properties</span>
                <div className="flex flex-wrap gap-1.5">
                  {COLUMN_DEFS.filter((c) => c.id !== "title").map((col) => {
                    const active = visibleCols.includes(col.id)
                    return (
                      <button
                        key={col.id}
                        onClick={() => toggleColumn(col.id)}
                        className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                          active
                            ? "bg-accent text-accent-foreground"
                            : "border border-border bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {col.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* ── Filter chips ───────────────────────────────── */}
      {viewState.filters.length > 0 && (
        <div className="flex shrink-0 items-center gap-1.5 border-b border-border px-5 py-1.5">
          {viewState.filters.map((f, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] text-foreground"
            >
              <span className="text-muted-foreground">{formatFilterLabel(f)}</span>
              <button
                onClick={() => removeFilter(i)}
                className="ml-0.5 rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
          <button
            onClick={() => updateViewState({ filters: [] })}
            className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── Unlinked helper ─────────────────────────────── */}
      {effectiveTab === "unlinked" && flatNotes.length > 0 && (
        <div className="flex shrink-0 items-center gap-2 border-b border-border px-5 py-2">
          <Link2 className="h-3 w-3 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">
            These notes have no links. Add <span className="font-mono text-foreground/70">[[wiki-links]]</span> to connect them to your knowledge graph.
          </span>
        </div>
      )}

      {/* ── Table ──────────────────────────────────────── */}
      {virtualItems.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-center">
          <div>
            <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-[13px] text-muted-foreground">No notes found</p>
            <p className="mt-1 text-[12px] text-muted-foreground/60">
              {viewState.filters.length > 0 ? "Try adjusting your filters." : "Create your first note to get started."}
            </p>
          </div>
        </div>
      ) : (
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
          {/* Column headers */}
          <div className="sticky top-0 z-10 flex items-center border-b border-border bg-background px-5 py-2">
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
                    <div className="flex items-center gap-2 px-5 py-2 bg-secondary/30 border-b border-border">
                      <span className="text-[12px] font-semibold text-foreground">{item.label}</span>
                      <span className="text-[11px] text-muted-foreground">{item.count}</span>
                    </div>
                  ) : (
                    <NoteRow
                      note={item.note}
                      categories={categories}
                      projects={projects}
                      links={backlinksMap.get(item.note.id) ?? 0}
                      isActive={activePreviewId === item.note.id}
                      visibleColumns={visibleCols}
                      onOpen={() => onRowClick ? onRowClick(item.note.id) : openNote(item.note.id)}
                      onDoubleClick={() => openNote(item.note.id)}
                      onStatus={(s) => updateNote(item.note.id, { status: s })}
                      onPriority={(p) => updateNote(item.note.id, { priority: p })}
                      onSetProject={(projId) => updateNote(item.note.id, { projectId: projId })}
                      onRemoveProject={() => updateNote(item.note.id, { projectId: null })}
                      onKeep={() => triageKeep(item.note.id)}
                      onSnooze={(opt) => triageSnooze(item.note.id, getSnoozeTime(opt))}
                      onTrash={() => triageTrash(item.note.id)}
                      onPromote={() => promoteToPermament(item.note.id)}
                      onDemote={() => undoPromote(item.note.id)}
                      onMoveBack={() => moveBackToInbox(item.note.id)}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </main>
  )
}

/* ── Row ───────────────────────────────────────────────── */

interface NoteRowProps {
  note: Note
  categories: { id: string; name: string; color: string }[]
  projects: Project[]
  links: number
  isActive?: boolean
  visibleColumns: string[]
  onOpen: () => void
  onDoubleClick?: () => void
  onStatus: (s: NoteStatus) => void
  onPriority: (p: NotePriority) => void
  onSetProject: (projectId: string) => void
  onRemoveProject: () => void
  onKeep: () => void
  onSnooze: (opt: "3h" | "tomorrow" | "next-week") => void
  onTrash: () => void
  onPromote: () => void
  onDemote: () => void
  onMoveBack: () => void
}

function NoteRowInner({
  note,
  categories,
  projects,
  links,
  isActive,
  visibleColumns,
  onOpen,
  onDoubleClick,
  onStatus,
  onPriority,
  onSetProject,
  onRemoveProject,
  onKeep,
  onSnooze,
  onTrash,
  onPromote,
  onDemote,
  onMoveBack,
}: NoteRowProps) {
  const visibleCols = visibleColumns
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={`group flex items-center border-b border-border px-5 py-2 transition-colors cursor-pointer ${
            isActive
              ? "bg-accent/8 border-l-2 border-l-accent"
              : "hover:bg-secondary/30"
          }`}
          onClick={onOpen}
          onDoubleClick={onDoubleClick}
        >
      {/* Name */}
      <div className="flex flex-1 items-center gap-2.5 min-w-0 pr-3">
        <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
        <span className="truncate text-[13px] text-foreground">
          {note.title || "Untitled"}
        </span>
        {(() => {
          const cat = categories.find((c) => c.id === note.category)
          if (!cat) return null
          return (
            <span
              className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: `${cat.color}18`, color: cat.color }}
            >
              {cat.name}
            </span>
          )
        })()}
        {links === 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="shrink-0 flex items-center gap-0.5 text-[10px] text-muted-foreground/50">
                <Link2 className="h-2.5 w-2.5" />
              </span>
            </TooltipTrigger>
            <TooltipContent className="text-[11px]">Add at least 1 link to reduce orphan notes.</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Status */}
      {visibleCols.includes("status") && (
        <div className="w-[100px] shrink-0 flex justify-end" onClick={(e) => e.stopPropagation()}>
          <StatusDropdown value={note.status} onChange={onStatus} variant="inline" />
        </div>
      )}

      {/* Project */}
      {visibleCols.includes("project") && (
        <div className="w-[80px] shrink-0 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          {note.projectId ? (() => {
            const proj = projects.find((p: Project) => p.id === note.projectId)
            if (!proj) return <span className="text-[12px] text-muted-foreground/30">—</span>
            const cfg = PROJECT_STATUS_CONFIG[proj.status]
            return (
              <span
                className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-none"
                style={{ backgroundColor: cfg.bg, color: cfg.color }}
              >
                {cfg.label}
              </span>
            )
          })() : (
            <ProjectDropdown value={null} projects={projects} onChange={onSetProject} variant="table" />
          )}
        </div>
      )}

      {/* Links */}
      {visibleCols.includes("links") && (
        <div className="w-[56px] shrink-0 text-center">
          <span className={`text-[12px] tabular-nums ${links === 0 ? "text-muted-foreground/30" : "text-muted-foreground"}`}>
            {links}
          </span>
        </div>
      )}

      {/* Reads */}
      {visibleCols.includes("reads") && (
        <div className="w-[56px] shrink-0 text-center">
          <span className={`text-[12px] tabular-nums ${note.reads === 0 ? "text-muted-foreground/30" : "text-muted-foreground"}`}>
            {note.reads}
          </span>
        </div>
      )}

      {/* Priority */}
      {visibleCols.includes("priority") && (
        <div className="w-[72px] shrink-0 flex justify-center" onClick={(e) => e.stopPropagation()}>
          <PriorityDropdown value={note.priority} onChange={onPriority} variant="inline" />
        </div>
      )}

      {/* Updated - relative time like Linear */}
      {visibleCols.includes("updatedAt") && (
        <div className="w-[80px] shrink-0 text-right">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-[12px] tabular-nums text-muted-foreground cursor-default">
                {shortRelative(note.updatedAt)}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[11px]">
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
              <span className="text-[12px] tabular-nums text-muted-foreground cursor-default">
                {absDate(note.createdAt)}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[11px]">
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
            <ContextMenuItem onClick={onKeep} className="text-[12px]">
              <Check className="h-3.5 w-3.5 mr-2 text-accent" />
              Keep
              <span className="ml-auto text-[10px] text-muted-foreground">K</span>
            </ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger className="text-[12px]">
                <AlarmClock className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                Snooze
                <span className="ml-auto text-[10px] text-muted-foreground">S</span>
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-44">
                <ContextMenuItem onClick={() => onSnooze("3h")} className="text-[12px]">
                  3 hours
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onSnooze("tomorrow")} className="text-[12px]">
                  Tomorrow 10:00 AM
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onSnooze("next-week")} className="text-[12px]">
                  Next week 10:00 AM
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuItem onClick={onTrash} className="text-[12px] text-destructive focus:text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Trash
              <span className="ml-auto text-[10px]">T</span>
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}

        {/* Capture actions */}
        {note.status === "capture" && (
          <>
            <ContextMenuItem onClick={onPromote} className="text-[12px]">
              <ArrowUpRight className="h-3.5 w-3.5 mr-2 text-[#45d483]" />
              Promote to Permanent
              <span className="ml-auto text-[10px] text-muted-foreground">P</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={onMoveBack} className="text-[12px]">
              <Inbox className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              Back to Inbox
              <span className="ml-auto text-[10px] text-muted-foreground">B</span>
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}

        {/* Permanent actions */}
        {note.status === "permanent" && (
          <>
            <ContextMenuItem onClick={onDemote} className="text-[12px]">
              <ArrowDownLeft className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              Demote to Capture
              <span className="ml-auto text-[10px] text-muted-foreground">D</span>
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}

        {/* Common actions */}
        <ContextMenuItem onClick={onOpen} className="text-[12px]">
          <FileText className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
          Open
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
  prev.note.projectId === next.note.projectId &&
  prev.note.reads === next.note.reads &&
  prev.note.title === next.note.title &&
  prev.note.category === next.note.category &&
  prev.links === next.links &&
  prev.isActive === next.isActive &&
  prev.visibleColumns === next.visibleColumns
)
