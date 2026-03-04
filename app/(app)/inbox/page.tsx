"use client"

import { useState, useMemo } from "react"
import { usePlotStore, filterNotesByRoute } from "@/lib/store"
import { NoteEditor } from "@/components/note-editor"
import { NoteInspector } from "@/components/note-inspector"
import { StatusDropdown, PriorityDropdown } from "@/components/note-fields"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Plus,
  Inbox,
  Filter,
  SlidersHorizontal,
  FileText,
} from "lucide-react"
import { format, formatDistanceToNowStrict } from "date-fns"

/* ── Tabs ──────────────────────────────────────────────── */

type InboxTab = "recent" | "unread" | "capture" | "all"

const TABS: { id: InboxTab; label: string }[] = [
  { id: "recent", label: "Recent" },
  { id: "unread", label: "Unread" },
  { id: "capture", label: "Capture" },
  { id: "all", label: "All" },
]

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

/* ── InboxPage ─────────────────────────────────────────── */

export default function InboxPage() {
  const notes = usePlotStore((s) => s.notes)
  const updateNote = usePlotStore((s) => s.updateNote)
  const openNote = usePlotStore((s) => s.openNote)
  const createNote = usePlotStore((s) => s.createNote)
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)

  const [activeTab, setActiveTab] = useState<InboxTab>("recent")

  const inboxNotes = useMemo(
    () => filterNotesByRoute(notes, { type: "inbox" }),
    [notes]
  )

  const filtered = useMemo(() => {
    switch (activeTab) {
      case "unread":
        return inboxNotes.filter((n) => n.reads === 0)
      case "capture":
        return inboxNotes.filter((n) => n.status === "capture")
      case "all":
        return inboxNotes
      case "recent":
      default:
        // Last 7 days
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
        return inboxNotes.filter((n) => new Date(n.createdAt).getTime() > weekAgo)
    }
  }, [inboxNotes, activeTab])

  if (selectedNoteId) {
    return (
      <div className="flex flex-1 overflow-hidden animate-in fade-in duration-200">
        <NoteEditor />
        <NoteInspector />
      </div>
    )
  }

  return (
    <main className="flex h-full flex-1 flex-col overflow-hidden bg-background">
      {/* Title */}
      <header className="flex shrink-0 items-center justify-between px-5 pt-5 pb-1">
        <h1 className="text-base font-semibold text-foreground">Inbox</h1>
      </header>

      {/* Tabs + toolbar */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-5 pt-1 pb-0">
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
        </div>
        <div className="flex items-center gap-1.5">
          <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <Filter className="h-3 w-3" />
            Filter
          </button>
          <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <SlidersHorizontal className="h-3 w-3" />
            Display
          </button>
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <Inbox className="mb-4 h-12 w-12 text-muted-foreground/20" />
          <p className="text-[13px] text-muted-foreground">No notes in inbox</p>
          <p className="mt-1 text-[12px] text-muted-foreground/60">
            Quick captures and unprocessed notes will appear here.
          </p>
          <button
            onClick={() => createNote({ isInbox: true })}
            className="mt-4 rounded-md bg-accent px-3 py-1.5 text-[12px] font-medium text-accent-foreground transition-colors hover:bg-accent/80"
          >
            Create new note
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {filtered.map((note) => (
            <div
              key={note.id}
              className="group flex items-center border-b border-border px-5 py-2 transition-colors hover:bg-secondary/30 cursor-pointer"
              onClick={() => openNote(note.id)}
            >
              {/* Priority icon */}
              <div className="w-8 shrink-0 flex justify-center" onClick={(e) => e.stopPropagation()}>
                <PriorityDropdown
                  value={note.priority}
                  onChange={(p) => updateNote(note.id, { priority: p })}
                  variant="inline"
                />
              </div>

              {/* Status circle */}
              <div className="w-7 shrink-0 flex justify-center" onClick={(e) => e.stopPropagation()}>
                <StatusDropdown
                  value={note.status}
                  onChange={(s) => updateNote(note.id, { status: s })}
                  variant="inline"
                />
              </div>

              {/* Title */}
              <div className="flex flex-1 items-center gap-2 min-w-0 pr-3">
                <span className="truncate text-[13px] text-foreground">
                  {note.title || "Untitled"}
                </span>
              </div>

              {/* Date */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="shrink-0 text-[12px] tabular-nums text-muted-foreground cursor-default">
                    {format(new Date(note.createdAt), "MMM d")}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-[11px]">
                  {format(new Date(note.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </TooltipContent>
              </Tooltip>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
