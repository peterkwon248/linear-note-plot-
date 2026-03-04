"use client"

import { useEffect } from "react"
import { LinearSidebar } from "@/components/linear-sidebar"
import { NoteList } from "@/components/note-list"
import { NoteEditor } from "@/components/note-editor"
import { NoteInspector } from "@/components/note-inspector"
import { SettingsView } from "@/components/settings-view"
import { SearchDialog } from "@/components/search-dialog"
import { TooltipProvider } from "@/components/ui/tooltip"
import { usePlotStore } from "@/lib/store"

export default function Page() {
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const setSelectedNoteId = usePlotStore((s) => s.setSelectedNoteId)
  const activeView = usePlotStore((s) => s.activeView)
  const hasSelectedNote = selectedNoteId !== null
  const isSettings = activeView.type === "settings"

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

        {/* Conditional layout: settings OR list-only OR editor+inspector */}
        <div className="flex flex-1 overflow-hidden">
          {isSettings ? (
            <SettingsView />
          ) : !hasSelectedNote ? (
            <NoteList />
          ) : (
            <div className="flex flex-1 overflow-hidden animate-in fade-in duration-200">
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
