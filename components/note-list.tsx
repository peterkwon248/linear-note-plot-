"use client"

import { useRef, useMemo, memo } from "react"
import {
  Plus,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  Pin,
  FileText,
  Calendar,
  Copy,
  Trash2,
} from "lucide-react"
import { isToday, isThisWeek, formatDistanceToNow } from "date-fns"
import { useVirtualizer } from "@tanstack/react-virtual"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { usePlotStore, filterNotesByRoute, getFilterTitle } from "@/lib/store"
import { useSettingsStore } from "@/lib/settings-store"
import type { Note, NoteFilter } from "@/lib/types"
import { StatusDropdown, PriorityDropdown } from "@/components/note-fields"

/* -- helpers -------------------------------------------------- */

type DateGroup = "Today" | "This Week" | "Older"

function getDateGroup(dateStr: string): DateGroup {
  const d = new Date(dateStr)
  if (isToday(d)) return "Today"
  if (isThisWeek(d, { weekStartsOn: 1 })) return "This Week"
  return "Older"
}

function groupNotesByDate(notes: Note[]): { label: DateGroup; notes: Note[] }[] {
  const groups: Record<DateGroup, Note[]> = {
    Today: [],
    "This Week": [],
    Older: [],
  }

  for (const note of notes) {
    groups[getDateGroup(note.updatedAt)].push(note)
  }

  const order: DateGroup[] = ["Today", "This Week", "Older"]
  return order
    .filter((label) => groups[label].length > 0)
    .map((label) => ({ label, notes: groups[label] }))
}

type FlatItem =
  | { type: "header"; label: DateGroup; count: number }
  | { type: "note"; note: Note }

/* -- NoteRow -------------------------------------------------- */

const NoteRow = memo(function NoteRow({ note }: { note: Note }) {
  const openNote = usePlotStore((s) => s.openNote)
  const tags = usePlotStore((s) => s.tags)
  const updateNote = usePlotStore((s) => s.updateNote)
  const togglePin = usePlotStore((s) => s.togglePin)
  const duplicateNote = usePlotStore((s) => s.duplicateNote)
  const deleteNote = usePlotStore((s) => s.deleteNote)
  const confirmDelete = useSettingsStore((s) => s.confirmDelete)

  const preview = note.preview
  const noteTags = tags.filter((t) => note.tags.includes(t.id)).slice(0, 2)

  return (
    <div
      className="note-row group flex items-center gap-3 border-b border-border px-3 transition-colors hover:bg-secondary/50 cursor-pointer"
      onClick={() => openNote(note.id)}
    >
      {/* Priority indicator */}
      <PriorityDropdown
        value={note.priority}
        onChange={(p) => updateNote(note.id, { priority: p })}
        variant="inline"
      />

      {/* Pin icon */}
      {note.pinned && (
        <Pin className="h-3.5 w-3.5 shrink-0 text-[#f2994a] fill-[#f2994a]" />
      )}

      {/* Content area */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[15px] font-medium text-foreground">
          {note.title || "Untitled"}
        </span>
        {preview && (
          <span className="truncate text-[14px] text-muted-foreground">
            {preview}
          </span>
        )}
      </div>

      {/* Status badge */}
      <StatusDropdown
        value={note.status}
        onChange={(s) => updateNote(note.id, { status: s })}
        variant="inline"
      />

      {/* Tag badges */}
      {noteTags.length > 0 && (
        <div className="flex shrink-0 items-center gap-1">
          {noteTags.map((tag) => (
            <span
              key={tag.id}
              className="shrink-0 rounded-full px-2 py-0.5 text-[12px] font-medium"
              style={{
                backgroundColor: `${tag.color}18`,
                color: tag.color,
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Date */}
      <span className="shrink-0 text-[12px] text-muted-foreground">
        {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
      </span>

      {/* More menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:bg-secondary group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              togglePin(note.id)
            }}
          >
            <Pin className="h-4 w-4" />
            {note.pinned ? "Unpin" : "Pin"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              duplicateNote(note.id)
            }}
          >
            <Copy className="h-4 w-4" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation()
              if (confirmDelete) {
                const ok = window.confirm("Are you sure you want to delete this note?")
                if (!ok) return
              }
              deleteNote(note.id)
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
})

/* -- NoteList ------------------------------------------------- */

export function NoteList({ filter }: { filter: NoteFilter }) {
  const notes = usePlotStore((s) => s.notes)
  const searchQuery = usePlotStore((s) => s.searchQuery)
  const createNote = usePlotStore((s) => s.createNote)
  const folders = usePlotStore((s) => s.folders)
  const categories = usePlotStore((s) => s.categories)
  const tags = usePlotStore((s) => s.tags)
  const filteredNotes = useMemo(() => filterNotesByRoute(notes, filter, searchQuery), [notes, filter, searchQuery])
  const viewTitle = useMemo(() => getFilterTitle(filter, { folders, categories, tags }), [filter, folders, categories, tags])
  const groups = useMemo(() => groupNotesByDate(filteredNotes), [filteredNotes])

  const flatItems = useMemo(() => {
    const items: FlatItem[] = []
    for (const group of groups) {
      items.push({ type: "header", label: group.label, count: group.notes.length })
      for (const note of group.notes) {
        items.push({ type: "note", note })
      }
    }
    return items
  }, [groups])

  const scrollRef = useRef<HTMLDivElement>(null)
  const rowVirtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => flatItems[index].type === "header" ? 37 : 72,
    overscan: 5,
  })

  return (
    <main className="flex h-full flex-1 flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-3 py-3">
        <div className="flex items-center gap-2">
          <h1 className="text-[15px] font-semibold text-foreground">
            {viewTitle}
          </h1>
          <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[12px] tabular-nums text-muted-foreground">
            {filteredNotes.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[14px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <Filter className="h-3.5 w-3.5" />
            Filter
          </button>
          <button className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[14px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <ArrowUpDown className="h-3.5 w-3.5" />
            Sort
          </button>
          <button
            className="flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-[14px] font-medium text-accent-foreground transition-colors hover:bg-accent/80"
            onClick={() => createNote({
              status: filter.type === "inbox" ? "inbox" as const : undefined,
              folderId: filter.type === "folder" ? filter.folderId : undefined,
              category: filter.type === "category" ? filter.categoryId : undefined,
              pinned: filter.type === "pinned" ? true : undefined,
            })}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New</span>
          </button>
        </div>
      </header>

      {/* Note List */}
      {filteredNotes.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-center">
          <div>
            <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-[15px] text-muted-foreground">No notes yet</p>
            <p className="text-[14px] text-muted-foreground mt-1">
              Create your first note to get started.
            </p>
          </div>
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const item = flatItems[virtualRow.index]
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
                    <div className="flex items-center gap-2 bg-background/95 backdrop-blur-sm px-3 py-2 border-b border-border">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
                        {item.label}
                      </span>
                      <span className="text-[12px] text-muted-foreground/60">
                        {item.count}
                      </span>
                    </div>
                  ) : (
                    <NoteRow note={item.note} />
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
