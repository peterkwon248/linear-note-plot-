"use client"

import { useState } from "react"
import { ExternalLink, Pencil, Eye, Globe, FileText, Columns2 } from "lucide-react"
import { usePlotStore } from "@/lib/store"
import { setActiveRoute } from "@/lib/table-route"
import { NoteEditorAdapter } from "@/components/editor/NoteEditorAdapter"
import { FixedToolbar } from "@/components/editor/FixedToolbar"
import type { Editor } from "@tiptap/react"

export function SidePanelPeek() {
  const sidePanelPeekNoteId = usePlotStore((s) => s.sidePanelPeekNoteId)
  const closeSidePeek = usePlotStore((s) => s.closeSidePeek)
  const openNote = usePlotStore((s) => s.openNote)
  const notes = usePlotStore((s) => s.notes)
  const [editing, setEditing] = useState(false)
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null)

  if (!sidePanelPeekNoteId) return null
  const note = notes.find((n) => n.id === sidePanelPeekNoteId)
  if (!note) return null

  const handleOpenInTab = () => {
    setActiveRoute("/notes")
    openNote(sidePanelPeekNoteId)
    closeSidePeek()
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Mini action bar with note title + actions */}
      <div className="flex items-center justify-between border-b border-border/50 px-3 py-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <FileText className="h-3 w-3 shrink-0 text-muted-foreground/60" strokeWidth={1.5} />
          <span className="text-xs text-muted-foreground truncate">{note.title || "Untitled"}</span>
        </div>
        <div className="flex items-center gap-0.5">
          {/* Open side by side (Phase 2 placeholder) */}
          <button
            onClick={() => {
              const { openInSecondary, closeSidePeek: close } = usePlotStore.getState()
              if (sidePanelPeekNoteId) {
                openInSecondary(sidePanelPeekNoteId)
                close()
              }
            }}
            className="rounded-[6px] p-1 text-muted-foreground/50 transition-colors duration-100 hover:bg-hover-bg hover:text-foreground"
            title="Open side by side"
          >
            <Columns2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
          {/* Open in full view */}
          <button
            onClick={handleOpenInTab}
            className="rounded-[6px] p-1 text-muted-foreground/50 transition-colors duration-100 hover:bg-hover-bg hover:text-foreground"
            title="Open in full view"
          >
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
          {/* Edit toggle */}
          <button
            onClick={() => setEditing((prev) => !prev)}
            className={`rounded-[6px] p-1 transition-colors duration-100 hover:bg-hover-bg ${
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
        </div>
      </div>

      {/* Editor Toolbar (edit mode only) */}
      {editing && editorInstance && (
        <FixedToolbar editor={editorInstance} position="top" noteId={sidePanelPeekNoteId} />
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
    </div>
  )
}
