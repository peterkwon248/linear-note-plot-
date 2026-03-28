"use client"

import { useState, useEffect } from "react"
import { usePlotStore } from "@/lib/store"
import { setActiveRoute } from "@/lib/table-route"
import { NoteEditorAdapter } from "@/components/editor/NoteEditorAdapter"
import { FixedToolbar } from "@/components/editor/FixedToolbar"
import type { Editor } from "@tiptap/react"
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr/ArrowSquareOut"
import { PencilSimple } from "@phosphor-icons/react/dist/ssr/PencilSimple"
import { Eye as PhEye } from "@phosphor-icons/react/dist/ssr/Eye"
import { Globe } from "@phosphor-icons/react/dist/ssr/Globe"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { Columns } from "@phosphor-icons/react/dist/ssr/Columns"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"

export function SidePanelPeek() {
  const sidePanelPeekNoteId = usePlotStore((s) => s.sidePanelPeekNoteId)
  const closeSidePeek = usePlotStore((s) => s.closeSidePeek)
  const openNote = usePlotStore((s) => s.openNote)
  const notes = usePlotStore((s) => s.notes)
  const [editing, setEditing] = useState(false)
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null)

  const wikiArticles = usePlotStore((s) => s.wikiArticles)

  // Esc key to close peek
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && sidePanelPeekNoteId) {
        closeSidePeek()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [sidePanelPeekNoteId, closeSidePeek])

  if (!sidePanelPeekNoteId) return null

  // Try direct note lookup first, then fallback via wiki article title match
  let note = notes.find((n) => n.id === sidePanelPeekNoteId)
  if (!note) {
    const article = wikiArticles.find((a) => a.id === sidePanelPeekNoteId)
    if (article) {
      note = notes.find((n) => n.title.toLowerCase() === article.title.toLowerCase())
    }
  }
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
          <FileText className="shrink-0 text-muted-foreground" size={14} weight="regular" />
          <span className="text-sm text-foreground truncate">{note.title || "Untitled"}</span>
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
            className="rounded-[6px] p-1 text-muted-foreground transition-colors duration-100 hover:bg-hover-bg hover:text-foreground"
            title="Open side by side"
          >
            <Columns size={14} weight="regular" />
          </button>
          {/* Open in full view */}
          <button
            onClick={handleOpenInTab}
            className="rounded-[6px] p-1 text-muted-foreground transition-colors duration-100 hover:bg-hover-bg hover:text-foreground"
            title="Open in full view"
          >
            <ArrowSquareOut size={14} weight="regular" />
          </button>
          {/* Edit toggle */}
          <button
            onClick={() => setEditing((prev) => !prev)}
            className={`rounded-[6px] p-1 transition-colors duration-100 hover:bg-hover-bg ${
              editing ? "text-accent" : "text-muted-foreground hover:text-foreground"
            }`}
            title={editing ? "Switch to View" : "Switch to Edit"}
          >
            {editing ? (
              <PhEye size={14} weight="regular" />
            ) : (
              <PencilSimple size={14} weight="regular" />
            )}
          </button>
          {/* Close peek */}
          <button
            onClick={closeSidePeek}
            className="rounded-[6px] p-1 text-muted-foreground transition-colors duration-100 hover:bg-hover-bg hover:text-foreground"
            title="Close peek (Esc)"
          >
            <PhX size={14} weight="regular" />
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
