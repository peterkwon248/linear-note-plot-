"use client"

import { useEffect } from "react"
import { LinearSidebar } from "@/components/linear-sidebar"
import { SearchDialog } from "@/components/search-dialog"
import { TooltipProvider } from "@/components/ui/tooltip"
import { usePlotStore } from "@/lib/store"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const setSelectedNoteId = usePlotStore((s) => s.setSelectedNoteId)

  // ESC key to clear selection
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const target = e.target as HTMLElement
        if (
          target.closest("[role='dialog']") ||
          target.closest("[data-radix-popper-content-wrapper]")
        ) {
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
        <div className="flex flex-1 overflow-hidden">{children}</div>
        <SearchDialog />
      </div>
    </TooltipProvider>
  )
}
