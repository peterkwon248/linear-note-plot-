"use client"

import { useState } from "react"
import { X, ExternalLink, Pencil, Eye, Globe } from "lucide-react"
import { usePlotStore } from "@/lib/store"
import { setActiveRoute } from "@/lib/table-route"
import { NoteEditorAdapter } from "@/components/editor/NoteEditorAdapter"

export function SidePeekPanel() {
  const sidePeekNoteId = usePlotStore((s) => s.sidePeekNoteId)
  const setSidePeekNoteId = usePlotStore((s) => s.setSidePeekNoteId)
  const openNote = usePlotStore((s) => s.openNote)
  const notes = usePlotStore((s) => s.notes)
  const [editing, setEditing] = useState(false)

  if (!sidePeekNoteId) return null

  const note = notes.find((n) => n.id === sidePeekNoteId)
  if (!note) return null

  const handleOpenInTab = () => {
    setActiveRoute("/notes")
    openNote(sidePeekNoteId)
    setSidePeekNoteId(null)
  }

  const handleToggleEdit = () => {
    setEditing((prev) => !prev)
  }

  const handleClose = () => {
    setSidePeekNoteId(null)
    setEditing(false)
  }

  return (
    <aside className="flex h-full w-[420px] shrink-0 flex-col overflow-hidden border-l border-border bg-card animate-in slide-in-from-right-4 fade-in duration-200">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          {note.isWiki && (
            <Globe className="h-4 w-4 shrink-0 text-chart-5" strokeWidth={1.5} />
          )}
          <span className="text-sm font-medium text-foreground truncate">
            {note.title || "Untitled"}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleOpenInTab}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Open in Tab"
            title="Open in Tab"
          >
            <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button
            onClick={handleToggleEdit}
            className={`rounded-md p-1.5 transition-colors hover:bg-secondary hover:text-foreground ${
              editing ? "text-accent" : "text-muted-foreground"
            }`}
            aria-label={editing ? "View" : "Edit"}
            title={editing ? "Switch to View" : "Switch to Edit"}
          >
            {editing ? (
              <Eye className="h-4 w-4" strokeWidth={1.5} />
            ) : (
              <Pencil className="h-4 w-4" strokeWidth={1.5} />
            )}
          </button>
          <button
            onClick={handleClose}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Close"
            title="Close"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <NoteEditorAdapter
          key={`${note.id}-${editing}`}
          note={note}
          editable={editing}
        />
      </div>
    </aside>
  )
}
