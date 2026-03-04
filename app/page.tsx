"use client"

import { useEffect } from "react"
import { LinearSidebar } from "@/components/linear-sidebar"
import { NoteList } from "@/components/note-list"
import { NoteEditor } from "@/components/note-editor"
import { NoteInspector } from "@/components/note-inspector"
import { SearchDialog } from "@/components/search-dialog"
import { TooltipProvider } from "@/components/ui/tooltip"
import { usePlotStore } from "@/lib/store"

export default function Page() {
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const setSelectedNoteId = usePlotStore((s) => s.setSelectedNoteId)
  const hasSelectedNote = selectedNoteId !== null

  // ESC key to clear selection and hide inspector
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const target = e.target as HTMLElement
        // Don't intercept ESC for dialogs/popovers
        if (target.closest("[role='dialog']") || target.closest("[data-radix-popper-content-wrapper]")) {
          return
        }
        setSelectedNoteId(null)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [setSelectedNoteId])

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <LinearSidebar />

        {/* Conditional layout: list-only vs editor+inspector */}
        <div className="flex flex-1 overflow-hidden">
          {/* Note List - takes full width when no note selected, shrinks when one is */}
          <div
            className={`shrink-0 overflow-hidden border-r border-border transition-all duration-300 ease-in-out ${
              hasSelectedNote ? "w-[280px]" : "flex-1"
            }`}
          >
            <NoteList />
          </div>

          {/* Editor + Inspector - only visible when a note is selected */}
          {hasSelectedNote && (
            <div className="flex flex-1 overflow-hidden animate-in fade-in slide-in-from-right-2 duration-300">
              <NoteEditor />
              <NoteInspector />
            </div>
          )}
        </div>

        <SearchDialog />
      </div>
    </TooltipProvider>
  )
}
