"use client"

import { useState, useMemo } from "react"
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
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { usePlotStore, filterNotesByRoute } from "@/lib/store"
import { buildBacklinksMap } from "@/lib/backlinks"
import { StatusDropdown, PriorityDropdown, StatusBadge, PriorityBadge } from "@/components/note-fields"
import { format, formatDistanceToNowStrict } from "date-fns"
import type { Note, NoteStatus, NotePriority } from "@/lib/types"

/* ── Relative date helpers ─────────────────────────────── */

function shortRelativeTime(dateStr: string): string {
  const dist = formatDistanceToNowStrict(new Date(dateStr), { addSuffix: false })
  // "2 hours" -> "2h", "3 days" -> "3d", "1 week" -> "1w", "5 minutes" -> "5m"
  return dist
    .replace(/ seconds?/, "s")
    .replace(/ minutes?/, "m")
    .replace(/ hours?/, "h")
    .replace(/ days?/, "d")
    .replace(/ weeks?/, "w")
    .replace(/ months?/, "mo")
    .replace(/ years?/, "y")
}

/* ── Sort types ────────────────────────────────────────── */

type SortColumn = "title" | "status" | "links" | "reads" | "priority" | "created" | "updated"
type SortDirection = "asc" | "desc"

const STATUS_ORDER: Record<NoteStatus, number> = { capture: 0, reference: 1, permanent: 2, project: 3 }
const PRIORITY_ORDER: Record<NotePriority, number> = { none: 0, low: 1, medium: 2, high: 3, urgent: 4 }

/* ── Context tab types ─────────────────────────────────── */

type ContextTab = "all" | "capture" | "reference" | "permanent" | "unlinked" | string

interface SavedView {
  id: string
  label: string
  tab: ContextTab
}

const DEFAULT_TABS: { id: ContextTab; label: string }[] = [
  { id: "all", label: "All Notes" },
  { id: "capture", label: "Capture" },
  { id: "reference", label: "Reference" },
  { id: "permanent", label: "Permanent" },
  { id: "unlinked", label: "Unlinked" },
]

/* ── Filter types ──────────────────────────────────────── */

type FilterType = "status" | "priority" | "links" | "reads"

interface ActiveFilter {
  type: FilterType
  value: string
}

/* ── Table Header Cell ─────────────────────────────────── */

function HeaderCell({
  label,
  column,
  sortCol,
  sortDir,
  onSort,
  align = "left",
  className = "",
}: {
  label: string
  column: SortColumn
  sortCol: SortColumn
  sortDir: SortDirection
  onSort: (col: SortColumn) => void
  align?: "left" | "right" | "center"
  className?: string
}) {
  const active = sortCol === column
  const textAlign = align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start"

  return (
    <button
      className={`flex items-center gap-1 ${textAlign} text-[11px] font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground ${className}`}
      onClick={() => onSort(column)}
    >
      {label}
      {active ? (
        sortDir === "asc" ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-40" />
      )}
    </button>
  )
}

/* ── NotesTable ────────────────────────────────────────── */

export function NotesTable() {
  const notes = usePlotStore((s) => s.notes)
  const updateNote = usePlotStore((s) => s.updateNote)
  const openNote = usePlotStore((s) => s.openNote)
  const createNote = usePlotStore((s) => s.createNote)

  const [sortCol, setSortCol] = useState<SortColumn>("updated")
  const [sortDir, setSortDir] = useState<SortDirection>("desc")
  const [filters, setFilters] = useState<ActiveFilter[]>([])
  const [activeTab, setActiveTab] = useState<ContextTab>("all")
  const [savedViews, setSavedViews] = useState<SavedView[]>([])
  const [isCreatingView, setIsCreatingView] = useState(false)
  const [newViewName, setNewViewName] = useState("")

  const backlinksMap = useMemo(() => buildBacklinksMap(notes), [notes])

  function handleSort(col: SortColumn) {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortCol(col)
      setSortDir(col === "title" ? "asc" : "desc")
    }
  }

  function addFilter(type: FilterType, value: string) {
    setFilters((prev) => {
      const exists = prev.find((f) => f.type === type && f.value === value)
      if (exists) return prev
      return [...prev, { type, value }]
    })
  }

  function removeFilter(idx: number) {
    setFilters((prev) => prev.filter((_, i) => i !== idx))
  }

  function handleCreateView() {
    if (!newViewName.trim()) return
    const view: SavedView = {
      id: `view-${Date.now()}`,
      label: newViewName.trim(),
      tab: `custom-${Date.now()}`,
    }
    setSavedViews((prev) => [...prev, view])
    setNewViewName("")
    setIsCreatingView(false)
  }

  // Filter then sort
  const filteredNotes = useMemo(() => {
    let result = filterNotesByRoute(notes, { type: "all" })

    // Apply active tab filter
    switch (activeTab) {
      case "capture":
        result = result.filter((n) => n.status === "capture")
        break
      case "reference":
        result = result.filter((n) => n.status === "reference")
        break
      case "permanent":
        result = result.filter((n) => n.status === "permanent")
        break
      case "unlinked":
        result = result.filter((n) => (backlinksMap.get(n.id) ?? 0) === 0)
        break
      case "all":
      default:
        break
    }

    for (const f of filters) {
      switch (f.type) {
        case "status":
          if (f.value === "all") break
          result = result.filter((n) => n.status === f.value)
          break
        case "priority":
          if (f.value === "all") break
          result = result.filter((n) => n.priority === f.value)
          break
        case "links":
          if (f.value === "unlinked") {
            result = result.filter((n) => (backlinksMap.get(n.id) ?? 0) === 0)
          }
          break
        case "reads":
          if (f.value === "unread") {
            result = result.filter((n) => n.reads === 0)
          }
          break
      }
    }

    const dir = sortDir === "asc" ? 1 : -1
    result.sort((a, b) => {
      switch (sortCol) {
        case "title":
          return dir * a.title.localeCompare(b.title)
        case "status":
          return dir * (STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
        case "links":
          return dir * ((backlinksMap.get(a.id) ?? 0) - (backlinksMap.get(b.id) ?? 0))
        case "reads":
          return dir * (a.reads - b.reads)
        case "priority":
          return dir * (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
        case "created":
          return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        case "updated":
        default:
          return dir * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())
      }
    })

    return result
  }, [notes, filters, sortCol, sortDir, backlinksMap, activeTab])

  return (
    <main className="flex h-full flex-1 flex-col overflow-hidden bg-background">
      {/* ── Header bar ──────────────────────────────────── */}
      <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <h1 className="text-[14px] font-semibold text-foreground">Notes</h1>
          <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[11px] tabular-nums text-muted-foreground">
            {filteredNotes.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Filter button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                <Filter className="h-3 w-3" />
                Filter
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {/* Status filters */}
              <DropdownMenuItem className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground" disabled>
                Status
              </DropdownMenuItem>
              {(["capture", "reference", "permanent", "project"] as NoteStatus[]).map((s) => (
                <DropdownMenuItem key={s} onClick={() => addFilter("status", s)}>
                  <StatusBadge status={s} />
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              {/* Priority filters */}
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
              {/* Special filters */}
              <DropdownMenuItem className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground" disabled>
                Knowledge graph
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addFilter("links", "unlinked")}>
                <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[12px]">Unlinked notes</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addFilter("reads", "unread")}>
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[12px]">Unread notes</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Display button */}
          <button className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <SlidersHorizontal className="h-3 w-3" />
            Display
          </button>

          {/* New note */}
          <button
            className="flex items-center gap-1 rounded-md bg-accent px-2.5 py-1 text-[12px] font-medium text-accent-foreground transition-colors hover:bg-accent/80"
            onClick={() => createNote()}
          >
            <Plus className="h-3 w-3" />
            New note
          </button>
        </div>
      </header>

      {/* ── Context Tabs ───────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-border px-4 py-1.5">
        {DEFAULT_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}

        {savedViews.map((view) => (
          <button
            key={view.id}
            onClick={() => setActiveTab(view.tab)}
            className={`group/tab relative rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
              activeTab === view.tab
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            }`}
          >
            {view.label}
            <span
              onClick={(e) => {
                e.stopPropagation()
                setSavedViews((prev) => prev.filter((v) => v.id !== view.id))
                if (activeTab === view.tab) setActiveTab("all")
              }}
              className="ml-1 hidden rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground group-hover/tab:inline-flex"
            >
              <X className="h-2.5 w-2.5" />
            </span>
          </button>
        ))}

        {isCreatingView ? (
          <form
            className="flex items-center"
            onSubmit={(e) => {
              e.preventDefault()
              handleCreateView()
            }}
          >
            <input
              autoFocus
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              onBlur={() => {
                if (!newViewName.trim()) setIsCreatingView(false)
              }}
              placeholder="View name..."
              className="w-24 rounded-md border border-border bg-secondary px-2 py-0.5 text-[12px] text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-accent"
            />
          </form>
        ) : (
          <button
            onClick={() => setIsCreatingView(true)}
            className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
          >
            <Plus className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* ── Active Filters ──────────────────────────────── */}
      {filters.length > 0 && (
        <div className="flex items-center gap-1.5 border-b border-border px-4 py-1.5">
          <SlidersHorizontal className="h-3 w-3 text-muted-foreground" />
          {filters.map((f, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-[11px] text-foreground"
            >
              <span className="text-muted-foreground capitalize">{f.type}:</span>
              <span className="capitalize">{f.value}</span>
              <button
                onClick={() => removeFilter(i)}
                className="ml-0.5 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
          <button
            onClick={() => setFilters([])}
            className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── Table ───────────────────────────────────────── */}
      {filteredNotes.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-center">
          <div>
            <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-[13px] text-muted-foreground">No notes found</p>
            <p className="text-[12px] text-muted-foreground mt-1">
              {filters.length > 0
                ? "Try adjusting your filters."
                : "Create your first note to get started."}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* Table header */}
          <div className="sticky top-0 z-10 grid grid-cols-[1fr_110px_60px_60px_90px_90px_90px] items-center gap-0 border-b border-border bg-background/95 backdrop-blur-sm px-4 py-2">
            <HeaderCell label="Name" column="title" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
            <HeaderCell label="Status" column="status" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
            <HeaderCell label="Links" column="links" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} align="center" />
            <HeaderCell label="Reads" column="reads" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} align="center" />
            <HeaderCell label="Priority" column="priority" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
            <HeaderCell label="Created" column="created" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} align="right" />
            <HeaderCell label="Updated" column="updated" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} align="right" />
          </div>

          {/* Table rows */}
          {filteredNotes.map((note) => (
            <TableRow
              key={note.id}
              note={note}
              links={backlinksMap.get(note.id) ?? 0}
              onOpen={() => openNote(note.id)}
              onStatusChange={(s) => updateNote(note.id, { status: s })}
              onPriorityChange={(p) => updateNote(note.id, { priority: p })}
            />
          ))}
        </div>
      )}
    </main>
  )
}

/* ── Table Row ─────────────────────────────────────────── */

function TableRow({
  note,
  links,
  onOpen,
  onStatusChange,
  onPriorityChange,
}: {
  note: Note
  links: number
  onOpen: () => void
  onStatusChange: (s: NoteStatus) => void
  onPriorityChange: (p: NotePriority) => void
}) {
  return (
    <div
      className="group grid grid-cols-[1fr_110px_60px_60px_90px_90px_90px] items-center gap-0 border-b border-border px-4 py-2 transition-colors hover:bg-secondary/40 cursor-pointer"
      onClick={onOpen}
    >
      {/* Title */}
      <div className="flex items-center gap-2 min-w-0 pr-3">
        <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate text-[13px] font-medium text-foreground">
          {note.title || "Untitled"}
        </span>
      </div>

      {/* Status */}
      <div onClick={(e) => e.stopPropagation()}>
        <StatusDropdown value={note.status} onChange={onStatusChange} variant="inline" />
      </div>

      {/* Links */}
      <div className="flex items-center justify-center">
        <span className={`text-[12px] tabular-nums ${links === 0 ? "text-muted-foreground/40" : "text-foreground"}`}>
          {links}
        </span>
      </div>

      {/* Reads */}
      <div className="flex items-center justify-center">
        <span className={`text-[12px] tabular-nums ${note.reads === 0 ? "text-muted-foreground/40" : "text-foreground"}`}>
          {note.reads}
        </span>
      </div>

      {/* Priority */}
      <div onClick={(e) => e.stopPropagation()}>
        <PriorityDropdown value={note.priority} onChange={onPriorityChange} variant="inline" />
      </div>

      {/* Created */}
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-right text-[12px] tabular-nums text-muted-foreground cursor-default">
            {shortRelativeTime(note.createdAt)}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">
          {format(new Date(note.createdAt), "MMM d, yyyy")}
        </TooltipContent>
      </Tooltip>

      {/* Updated */}
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-right text-[12px] tabular-nums text-muted-foreground cursor-default">
            {shortRelativeTime(note.updatedAt)}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">
          {format(new Date(note.updatedAt), "MMM d, yyyy")}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
