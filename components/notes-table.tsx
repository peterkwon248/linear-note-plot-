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

/* ── Helpers ───────────────────────────────────────────── */

function shortRelative(dateStr: string): string {
  const dist = formatDistanceToNowStrict(new Date(dateStr), { addSuffix: false })
  return dist
    .replace(/ seconds?/, "s")
    .replace(/ minutes?/, "m")
    .replace(/ hours?/, "h")
    .replace(/ days?/, "d")
    .replace(/ weeks?/, "w")
    .replace(/ months?/, "mo")
    .replace(/ years?/, "y")
}

function absDate(dateStr: string): string {
  return format(new Date(dateStr), "MMM d")
}

/* ── Sort ──────────────────────────────────────────────── */

type SortColumn = "title" | "status" | "links" | "reads" | "priority" | "created" | "updated"
type SortDirection = "asc" | "desc"

const STATUS_ORDER: Record<NoteStatus, number> = { capture: 0, reference: 1, permanent: 2, project: 3 }
const PRIORITY_ORDER: Record<NotePriority, number> = { none: 0, low: 1, medium: 2, high: 3, urgent: 4 }

/* ── Context tabs ──────────────────────────────────────── */

type ContextTab = "all" | "capture" | "reference" | "permanent" | "unlinked"

const TABS: { id: ContextTab; label: string }[] = [
  { id: "all", label: "All Notes" },
  { id: "capture", label: "Capture" },
  { id: "reference", label: "Reference" },
  { id: "permanent", label: "Permanent" },
  { id: "unlinked", label: "Unlinked" },
]

/* ── Filter ────────────────────────────────────────────── */

type FilterType = "status" | "priority" | "links" | "reads"

interface ActiveFilter {
  type: FilterType
  value: string
}

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
  col: SortColumn
  sortCol: SortColumn
  sortDir: SortDirection
  onSort: (c: SortColumn) => void
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

export function NotesTable() {
  const notes = usePlotStore((s) => s.notes)
  const updateNote = usePlotStore((s) => s.updateNote)
  const openNote = usePlotStore((s) => s.openNote)
  const createNote = usePlotStore((s) => s.createNote)

  const [sortCol, setSortCol] = useState<SortColumn>("updated")
  const [sortDir, setSortDir] = useState<SortDirection>("desc")
  const [filters, setFilters] = useState<ActiveFilter[]>([])
  const [activeTab, setActiveTab] = useState<ContextTab>("all")

  const backlinksMap = useMemo(() => buildBacklinksMap(notes), [notes])

  function handleSort(col: SortColumn) {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortCol(col); setSortDir(col === "title" ? "asc" : "desc") }
  }

  function addFilter(type: FilterType, value: string) {
    setFilters((prev) => {
      if (prev.find((f) => f.type === type && f.value === value)) return prev
      return [...prev, { type, value }]
    })
  }

  function removeFilter(idx: number) {
    setFilters((prev) => prev.filter((_, i) => i !== idx))
  }

  const filteredNotes = useMemo(() => {
    let result = filterNotesByRoute(notes, { type: "all" })

    // Tab filter
    switch (activeTab) {
      case "capture":    result = result.filter((n) => n.status === "capture"); break
      case "reference":  result = result.filter((n) => n.status === "reference"); break
      case "permanent":  result = result.filter((n) => n.status === "permanent"); break
      case "unlinked":   result = result.filter((n) => (backlinksMap.get(n.id) ?? 0) === 0); break
    }

    // Chip filters
    for (const f of filters) {
      switch (f.type) {
        case "status":   result = result.filter((n) => n.status === f.value); break
        case "priority": result = result.filter((n) => n.priority === f.value); break
        case "links":    if (f.value === "unlinked") result = result.filter((n) => (backlinksMap.get(n.id) ?? 0) === 0); break
        case "reads":    if (f.value === "unread") result = result.filter((n) => n.reads === 0); break
      }
    }

    // Sort
    const dir = sortDir === "asc" ? 1 : -1
    result.sort((a, b) => {
      switch (sortCol) {
        case "title":    return dir * a.title.localeCompare(b.title)
        case "status":   return dir * (STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
        case "links":    return dir * ((backlinksMap.get(a.id) ?? 0) - (backlinksMap.get(b.id) ?? 0))
        case "reads":    return dir * (a.reads - b.reads)
        case "priority": return dir * (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
        case "created":  return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        case "updated":
        default:         return dir * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())
      }
    })
    return result
  }, [notes, filters, sortCol, sortDir, backlinksMap, activeTab])

  return (
    <main className="flex h-full flex-1 flex-col overflow-hidden bg-background">
      {/* ── Page title ─────────────────────────────────── */}
      <header className="flex shrink-0 items-center justify-between px-5 pt-5 pb-1">
        <h1 className="text-base font-semibold text-foreground">Notes</h1>
        <button
          className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-[12px] font-medium text-accent-foreground transition-colors hover:bg-accent/80"
          onClick={() => createNote()}
        >
          <Plus className="h-3 w-3" />
          New note
        </button>
      </header>

      {/* ── Context tabs + toolbar ─────────────────────── */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-5 pt-1 pb-0">
        {/* Tabs */}
        <div className="flex items-center gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-3 py-2 text-[13px] font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-accent" />
              )}
            </button>
          ))}
          <button className="px-2 py-2 text-muted-foreground transition-colors hover:text-foreground">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

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
              {(["capture", "reference", "permanent", "project"] as NoteStatus[]).map((s) => (
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
          <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <SlidersHorizontal className="h-3 w-3" />
            Display
          </button>
        </div>
      </div>

      {/* ── Filter chips ───────────────────────────────── */}
      {filters.length > 0 && (
        <div className="flex shrink-0 items-center gap-1.5 border-b border-border px-5 py-1.5">
          {filters.map((f, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] text-foreground"
            >
              <span className="text-muted-foreground capitalize">{f.type}:</span>
              <span className="capitalize">{f.value}</span>
              <button
                onClick={() => removeFilter(i)}
                className="ml-0.5 rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground"
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

      {/* ── Table ──────────────────────────────────────── */}
      {filteredNotes.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-center">
          <div>
            <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-[13px] text-muted-foreground">No notes found</p>
            <p className="mt-1 text-[12px] text-muted-foreground/60">
              {filters.length > 0 ? "Try adjusting your filters." : "Create your first note to get started."}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* Column headers */}
          <div className="sticky top-0 z-10 flex items-center border-b border-border bg-background px-5 py-2">
            <div className="flex-1 min-w-0">
              <TH label="Name" col="title" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
            </div>
            <div className="w-[100px] shrink-0 text-right">
              <TH label="Status" col="status" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="justify-end" />
            </div>
            <div className="w-[56px] shrink-0 text-center">
              <TH label="Links" col="links" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="justify-center" />
            </div>
            <div className="w-[56px] shrink-0 text-center">
              <TH label="Reads" col="reads" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="justify-center" />
            </div>
            <div className="w-[72px] shrink-0 text-center">
              <TH label="Priority" col="priority" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="justify-center" />
            </div>
            <div className="w-[80px] shrink-0 text-right">
              <TH label="Created" col="created" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="justify-end" />
            </div>
            <div className="w-[80px] shrink-0 text-right">
              <TH label="Updated" col="updated" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="justify-end" />
            </div>
          </div>

          {/* Rows */}
          {filteredNotes.map((note) => (
            <NoteRow
              key={note.id}
              note={note}
              links={backlinksMap.get(note.id) ?? 0}
              onOpen={() => openNote(note.id)}
              onStatus={(s) => updateNote(note.id, { status: s })}
              onPriority={(p) => updateNote(note.id, { priority: p })}
            />
          ))}
        </div>
      )}
    </main>
  )
}

/* ── Row ───────────────────────────────────────────────── */

function NoteRow({
  note,
  links,
  onOpen,
  onStatus,
  onPriority,
}: {
  note: Note
  links: number
  onOpen: () => void
  onStatus: (s: NoteStatus) => void
  onPriority: (p: NotePriority) => void
}) {
  return (
    <div
      className="group flex items-center border-b border-border px-5 py-2 transition-colors hover:bg-secondary/30 cursor-pointer"
      onClick={onOpen}
    >
      {/* Name */}
      <div className="flex flex-1 items-center gap-2.5 min-w-0 pr-3">
        <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
        <span className="truncate text-[13px] text-foreground">
          {note.title || "Untitled"}
        </span>
      </div>

      {/* Status */}
      <div className="w-[100px] shrink-0 flex justify-end" onClick={(e) => e.stopPropagation()}>
        <StatusDropdown value={note.status} onChange={onStatus} variant="inline" />
      </div>

      {/* Links */}
      <div className="w-[56px] shrink-0 text-center">
        <span className={`text-[12px] tabular-nums ${links === 0 ? "text-muted-foreground/30" : "text-muted-foreground"}`}>
          {links}
        </span>
      </div>

      {/* Reads */}
      <div className="w-[56px] shrink-0 text-center">
        <span className={`text-[12px] tabular-nums ${note.reads === 0 ? "text-muted-foreground/30" : "text-muted-foreground"}`}>
          {note.reads}
        </span>
      </div>

      {/* Priority */}
      <div className="w-[72px] shrink-0 flex justify-center" onClick={(e) => e.stopPropagation()}>
        <PriorityDropdown value={note.priority} onChange={onPriority} variant="inline" />
      </div>

      {/* Created - absolute date like Linear */}
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

      {/* Updated - relative time like Linear */}
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
    </div>
  )
}
