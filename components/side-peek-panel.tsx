"use client"

import { X, ExternalLink, Pencil, Globe } from "lucide-react"
import { usePlotStore } from "@/lib/store"
import { NoteEditorAdapter } from "@/components/editor/NoteEditorAdapter"

export function SidePeekPanel() {
  const sidePeekNoteId = usePlotStore((s) => s.sidePeekNoteId)
  const setSidePeekNoteId = usePlotStore((s) => s.setSidePeekNoteId)
  const openNoteInTab = usePlotStore((s) => s.openNoteInTab)
  const notes = usePlotStore((s) => s.notes)

  if (!sidePeekNoteId) return null

  const note = notes.find((n) => n.id === sidePeekNoteId)
  if (!note) return null

  const handleOpenInTab = () => {
    openNoteInTab(sidePeekNoteId)
    setSidePeekNoteId(null)
  }

  const handleEdit = () => {
    openNoteInTab(sidePeekNoteId)
    setSidePeekNoteId(null)
  }

  const handleClose = () => {
    setSidePeekNoteId(null)
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
            onClick={handleEdit}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Edit"
            title="Edit"
          >
            <Pencil className="h-4 w-4" strokeWidth={1.5} />
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

      {/* Content (read-only) */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <NoteEditorAdapter
          key={note.id}
          note={note}
          editable={false}
        />
      </div>
    </aside>
  )
}
