"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { LinearSidebar } from "@/components/linear-sidebar"
import { SearchDialog } from "@/components/search-dialog"
import { ShortcutOverlay } from "@/components/shortcut-overlay"
import { TooltipProvider } from "@/components/ui/tooltip"
import { usePlotStore } from "@/lib/store"
import { useGlobalShortcuts } from "@/hooks/use-global-shortcuts"
import { Toaster } from "sonner"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const setSelectedNoteId = usePlotStore((s) => s.setSelectedNoteId)
  const { resolvedTheme } = useTheme()
  const pathname = usePathname()
  const prevPathname = useRef(pathname)

  // Clear selected note when navigating to a different route
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      setSelectedNoteId(null)
      prevPathname.current = pathname
    }
  }, [pathname, setSelectedNoteId])

  // Single consolidated global shortcut handler
  useGlobalShortcuts()

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <LinearSidebar />
        <div className="flex flex-1 overflow-hidden">{children}</div>
        <SearchDialog />
        <ShortcutOverlay />
        <Toaster position="bottom-right" theme={resolvedTheme === "dark" ? "dark" : "light"} />
      </div>
    </TooltipProvider>
  )
}
