"use client"

import {
  Plus,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  Pin,
  FileText,
  Calendar,
  Archive,
  Copy,
  Trash2,
} from "lucide-react"
import { isToday, isThisWeek, formatDistanceToNow } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { usePlotStore, getFilteredNotes, getViewTitle } from "@/lib/store"
import type { Note } from "@/lib/types"

/* ── helpers ─────────────────────────────────────────────── */

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s?/g, "")
    .replace(/\*{1,3}(.*?)\*{1,3}/g, "$1")
    .replace(/_{1,3}(.*?)_{1,3}/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[>\-~]/g, "")
    .replace(/\n+/g, " ")
    .trim()
}

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

/* ── NoteRow ─────────────────────────────────────────────── */

function NoteRow({ note }: { note: Note }) {
  const { setSelectedNoteId, tags, togglePin, toggleArchive, duplicateNote, deleteNote } =
    usePlotStore()

  const preview = stripMarkdown(note.content).slice(0, 80)
  const noteTags = tags.filter((t) => note.tags.includes(t.id)).slice(0, 2)

  return (
    <div
      className="group flex items-center gap-3 border-b border-border px-3 py-2.5 transition-colors hover:bg-secondary/50 cursor-pointer"
      onClick={() => setSelectedNoteId(note.id)}
    >
      {/* Pin icon */}
      {note.pinned && (
        <Pin className="h-3 w-3 shrink-0 text-[#f2994a] fill-[#f2994a]" />
      )}

      {/* Content area */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[13px] font-medium text-foreground">
          {note.title || "Untitled"}
        </span>
        {preview && (
          <span className="truncate text-[12px] text-muted-foreground">
            {preview}
          </span>
        )}
      </div>

      {/* Tag badges */}
      {noteTags.length > 0 && (
        <div className="flex shrink-0 items-center gap-1">
          {noteTags.map((tag) => (
            <span
              key={tag.id}
              className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium"
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
      <span className="shrink-0 text-[11px] text-muted-foreground">
        {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
      </span>

      {/* More menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:bg-secondary group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              togglePin(note.id)
            }}
          >
            <Pin className="h-3.5 w-3.5" />
            {note.pinned ? "Unpin" : "Pin"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              toggleArchive(note.id)
            }}
          >
            <Archive className="h-3.5 w-3.5" />
            {note.archived ? "Unarchive" : "Archive"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              duplicateNote(note.id)
            }}
          >
            <Copy className="h-3.5 w-3.5" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation()
              deleteNote(note.id)
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

/* ── NoteList ────────────────────────────────────────────── */

export function NoteList() {
  const state = usePlotStore()
  const filteredNotes = getFilteredNotes(state)
  const viewTitle = getViewTitle(state.activeView, state)
  const groups = groupNotesByDate(filteredNotes)

  return (
    <main className="flex h-full flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-3 py-3">
        <div className="flex items-center gap-2">
          <h1 className="text-[14px] font-semibold text-foreground">{viewTitle}</h1>
          <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[11px] tabular-nums text-muted-foreground">
            {filteredNotes.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <Filter className="h-3 w-3" />
            Filter
          </button>
          <button className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <ArrowUpDown className="h-3 w-3" />
            Sort
          </button>
          <button
            className="flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-[12px] font-medium text-accent-foreground transition-colors hover:bg-accent/80"
            onClick={() => state.createNote()}
          >
            <Plus className="h-3 w-3" />
            <span>New</span>
          </button>
        </div>
      </header>

      {/* Note List */}
      {filteredNotes.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-center">
          <div>
            <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-[13px] text-muted-foreground">No notes yet</p>
            <p className="text-[12px] text-muted-foreground mt-1">
              Create your first note to get started.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="sticky top-0 z-10 flex items-center gap-2 bg-background/95 backdrop-blur-sm px-3 py-2 border-b border-border">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </span>
                <span className="text-[11px] text-muted-foreground/60">
                  {group.notes.length}
                </span>
              </div>
              {group.notes.map((note) => (
                <NoteRow key={note.id} note={note} />
              ))}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
