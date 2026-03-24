"use client"

import { useRef, useMemo, memo } from "react"
import { isToday, isThisWeek, formatDistanceToNow } from "date-fns"
import { useVirtualizer } from "@tanstack/react-virtual"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { FunnelSimple } from "@phosphor-icons/react/dist/ssr/FunnelSimple"
import { ArrowsDownUp } from "@phosphor-icons/react/dist/ssr/ArrowsDownUp"
import { DotsThree } from "@phosphor-icons/react/dist/ssr/DotsThree"
import { PushPin } from "@phosphor-icons/react/dist/ssr/PushPin"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { CalendarBlank } from "@phosphor-icons/react/dist/ssr/CalendarBlank"
import { Copy as PhCopy } from "@phosphor-icons/react/dist/ssr/Copy"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { usePlotStore, filterNotesByRoute, getFilterTitle } from "@/lib/store"
import { useSettingsStore } from "@/lib/settings-store"
import type { Note, NoteFilter } from "@/lib/types"
import { StatusDropdown, PriorityDropdown } from "@/components/note-fields"
import { setNoteDragData } from "@/lib/drag-helpers"

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
      draggable
      onDragStart={(e) => setNoteDragData(e, note.id)}
      className="note-row group flex items-center gap-3 px-3 transition-colors hover:bg-secondary/50 cursor-pointer"
      onClick={() => openNote(note.id)}
    >
      {/* Priority indicator */}
      <PriorityDropdown
        value={note.priority}
        onChange={(p) => updateNote(note.id, { priority: p })}
        variant="inline"
      />

      {/* PushPin icon */}
      {note.pinned && (
        <PushPin className="shrink-0 text-chart-3 fill-chart-3" size={14} weight="regular" />
      )}

      {/* Content area */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-ui font-medium text-foreground">
          {note.title || "Untitled"}
        </span>
        {preview && (
          <span className="truncate text-sm text-muted-foreground">
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
              className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
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
      <span className="shrink-0 text-xs text-muted-foreground">
        {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
      </span>

      {/* More menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:bg-secondary group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <DotsThree className="text-muted-foreground" size={16} weight="bold" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              togglePin(note.id)
            }}
          >
            <PushPin size={16} weight="regular" />
            {note.pinned ? "Unpin" : "PushPin"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              duplicateNote(note.id)
            }}
          >
            <PhCopy size={16} weight="regular" />
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
            <Trash size={16} weight="regular" />
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
  const tags = usePlotStore((s) => s.tags)
  const filteredNotes = useMemo(() => filterNotesByRoute(notes, filter, searchQuery), [notes, filter, searchQuery])
  const viewTitle = useMemo(() => getFilterTitle(filter, { folders, tags }), [filter, folders, tags])
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
          <h1 className="text-ui font-semibold text-foreground">
            {viewTitle}
          </h1>
          <span className="rounded-full bg-secondary px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground">
            {filteredNotes.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <FunnelSimple size={14} weight="regular" />
            FunnelSimple
          </button>
          <button className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <ArrowsDownUp size={14} weight="regular" />
            Sort
          </button>
          <button
            className="flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/80"
            onClick={() => createNote({
              status: filter.type === "inbox" ? "inbox" as const : undefined,
              folderId: filter.type === "folder" ? filter.folderId : undefined,
              pinned: filter.type === "pinned" ? true : undefined,
            })}
          >
            <PhPlus size={14} weight="regular" />
            <span>New</span>
          </button>
        </div>
      </header>

      {/* Note List */}
      {filteredNotes.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-center">
          <div>
            <FileText className="mx-auto text-muted-foreground mb-2" size={32} weight="regular" />
            <p className="text-ui text-muted-foreground">No notes yet</p>
            <p className="text-sm text-muted-foreground mt-1">
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
                      <CalendarBlank className="text-muted-foreground" size={14} weight="regular" />
                      <span className="text-xs font-medium text-muted-foreground">
                        {item.label}
                      </span>
                      <span className="text-xs text-muted-foreground/60">
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
