"use client"

import { useState, useRef } from "react"
import { X, ExternalLink, Pencil, Eye, Globe, FileText } from "lucide-react"
import { usePlotStore } from "@/lib/store"
import { setActiveRoute } from "@/lib/table-route"
import { NoteEditorAdapter } from "@/components/editor/NoteEditorAdapter"
import { FixedToolbar } from "@/components/editor/FixedToolbar"
import type { Editor } from "@tiptap/react"

export function SidePeekPanel() {
  const sidePeekNoteId = usePlotStore((s) => s.sidePeekNoteId)
  const setSidePeekNoteId = usePlotStore((s) => s.setSidePeekNoteId)
  const openNote = usePlotStore((s) => s.openNote)
  const notes = usePlotStore((s) => s.notes)
  const [editing, setEditing] = useState(false)
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null)

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
    <aside className="flex h-full w-[440px] shrink-0 flex-col overflow-hidden border-l border-border/50 bg-background animate-in slide-in-from-right-4 fade-in duration-200">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border/50 px-4 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-3.5 w-3.5 shrink-0 text-accent/60" strokeWidth={1.5} />
          <span className="text-[13px] font-medium text-foreground truncate">
            {note.title || "Untitled"}
          </span>
          {note.isWiki && (
            <Globe className="h-3 w-3 shrink-0 text-chart-5/60" strokeWidth={1.5} />
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleOpenInTab}
            className="rounded-[6px] p-1.5 text-muted-foreground/50 transition-colors duration-100 hover:bg-white/[0.04] hover:text-foreground"
            title="Open in full view"
          >
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
          <button
            onClick={handleToggleEdit}
            className={`rounded-[6px] p-1.5 transition-colors duration-100 hover:bg-white/[0.04] ${
              editing ? "text-accent" : "text-muted-foreground/50 hover:text-foreground"
            }`}
            title={editing ? "Switch to View" : "Switch to Edit"}
          >
            {editing ? (
              <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
            ) : (
              <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
            )}
          </button>
          <button
            onClick={handleClose}
            className="rounded-[6px] p-1.5 text-muted-foreground/50 transition-colors duration-100 hover:bg-white/[0.04] hover:text-foreground"
            title="Close"
          >
            <X className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {/* Editor Toolbar (edit mode only) */}
      {editing && editorInstance && (
        <FixedToolbar editor={editorInstance} position="top" noteId={sidePeekNoteId} />
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <NoteEditorAdapter
          key={`${note.id}-${editing}`}
          note={note}
          editable={editing}
          onEditorReady={(ed) => setEditorInstance(ed as Editor)}
        />
      </div>
    </aside>
  )
}
