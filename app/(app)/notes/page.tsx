"use client"

import { usePlotStore } from "@/lib/store"
import { NotesTable } from "@/components/notes-table"
import { NoteEditor } from "@/components/note-editor"
import { NoteInspector } from "@/components/note-inspector"

export default function NotesPage() {
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const hasSelectedNote = selectedNoteId !== null

  if (hasSelectedNote) {
    return (
      <div className="flex flex-1 overflow-hidden animate-in fade-in duration-200">
        <NoteEditor />
        <NoteInspector />
      </div>
    )
  }

  return <NotesTable />
}
