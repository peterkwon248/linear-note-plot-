"use client"

import { useState, useEffect, useCallback } from "react"
import { usePlotStore } from "@/lib/store"
import { NotesTable } from "@/components/notes-table"
import { NoteEditor } from "@/components/note-editor"
import { NoteInspector } from "@/components/note-inspector"
import { NoteDetailPanel } from "@/components/note-detail-panel"

export default function NotesPage() {
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const openNote = usePlotStore((s) => s.openNote)
  const isEditing = selectedNoteId !== null

  const [previewId, setPreviewId] = useState<string | null>(null)

  // ESC closes preview panel (editor Esc is handled by use-global-shortcuts)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const target = e.target as HTMLElement
        if (target.closest("[role='dialog']") || target.closest("[data-radix-popper-content-wrapper]")) return
        if (!isEditing && previewId) {
          setPreviewId(null)
        }
      }
    },
    [isEditing, previewId]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  // Full editor mode
  if (isEditing) {
    return (
      <div className="flex flex-1 overflow-hidden animate-in fade-in duration-200">
        <NoteEditor />
        <NoteInspector />
      </div>
    )
  }

  // Table + optional detail panel
  return (
    <div className="flex flex-1 overflow-hidden">
      <NotesTable
        onRowClick={(noteId) => setPreviewId(noteId)}
        activePreviewId={previewId}
      />
      {previewId && (
        <NoteDetailPanel
          noteId={previewId}
          onClose={() => setPreviewId(null)}
          onOpenNote={(id) => setPreviewId(id)}
          onEditNote={() => {
            openNote(previewId)
            setPreviewId(null)
          }}
        />
      )}
    </div>
  )
}
