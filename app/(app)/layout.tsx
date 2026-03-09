"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { PanelLeft } from "lucide-react"
import { LinearSidebar } from "@/components/linear-sidebar"
import { SearchDialog } from "@/components/search-dialog"
import { ShortcutOverlay } from "@/components/shortcut-overlay"
import { TooltipProvider } from "@/components/ui/tooltip"
import { usePlotStore } from "@/lib/store"
import { useGlobalShortcuts } from "@/hooks/use-global-shortcuts"
import { Toaster } from "sonner"
import { ErrorBoundary } from "@/components/error-boundary"
import { NotesTableView } from "@/components/notes-table-view"
import { useActiveRoute, syncFromPathname, TABLE_VIEW_ROUTES, VIEW_ROUTES } from "@/lib/table-route"
import { InboxView } from "@/components/views/inbox-view"
import { ReviewView } from "@/components/views/review-view"
import { AlertsView } from "@/components/views/alerts-view"
import { ProjectsView } from "@/components/views/projects-view"
import { TagsView } from "@/components/views/tags-view"
import { ViewsView } from "@/components/views/views-view"
import { MapsView } from "@/components/views/maps-view"
import { MergeDialogGlobal } from "@/components/merge-dialog-global"
import { LinkDialogGlobal } from "@/components/link-dialog-global"

const MIN_WIDTH = 200
const MAX_WIDTH = 320
const COLLAPSE_THRESHOLD = 80

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const setSelectedNoteId = usePlotStore((s) => s.setSelectedNoteId)
  const sidebarWidth = usePlotStore((s) => s.sidebarWidth)
  const sidebarCollapsed = usePlotStore((s) => s.sidebarCollapsed)
  const sidebarPeek = usePlotStore((s) => s.sidebarPeek)
  const sidebarLastWidth = usePlotStore((s) => s.sidebarLastWidth)
  const setSidebarWidth = usePlotStore((s) => s.setSidebarWidth)
  const setSidebarCollapsed = usePlotStore((s) => s.setSidebarCollapsed)
  const setSidebarPeek = usePlotStore((s) => s.setSidebarPeek)
  const restoreSidebar = usePlotStore((s) => s.restoreSidebar)
  const { resolvedTheme } = useTheme()
  const pathname = usePathname()
  const prevPathname = useRef(pathname)
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Sync active-route store from pathname (handles direct URL, back/forward)
  useEffect(() => {
    syncFromPathname(pathname)
  }, [pathname])

  const activeRoute = useActiveRoute()
  const isTableView = activeRoute !== null && TABLE_VIEW_ROUTES.includes(activeRoute)
  const isViewRoute = activeRoute !== null && VIEW_ROUTES.includes(activeRoute)
  const isFallback = !isTableView && !isViewRoute

  // Mount-once: track which view routes have been visited
  // Once mounted, a view stays mounted (keep-alive) for instant re-visits
  const [mountedViews, setMountedViews] = useState<Set<string>>(() => new Set())
  useEffect(() => {
    if (activeRoute && VIEW_ROUTES.includes(activeRoute)) {
      setMountedViews((prev) => {
        if (prev.has(activeRoute)) return prev
        const next = new Set(prev)
        next.add(activeRoute)
        return next
      })
    }
  }, [activeRoute])

  // Clear selected note when navigating to a different route
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      setSelectedNoteId(null)
      prevPathname.current = pathname
    }
  }, [pathname, setSelectedNoteId])

  // Single consolidated global shortcut handler
  useGlobalShortcuts()

  // ── Resize handle drag ──────────────────────────────────
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      const startX = e.clientX
      const startWidth = sidebarWidth
      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"

      const onPointerMove = (ev: PointerEvent) => {
        const delta = ev.clientX - startX
        const newWidth = startWidth + delta

        if (newWidth < COLLAPSE_THRESHOLD) {
          setSidebarCollapsed(true)
        } else {
          const clamped = Math.min(Math.max(newWidth, MIN_WIDTH), MAX_WIDTH)
          setSidebarWidth(clamped)
          if (sidebarCollapsed) setSidebarCollapsed(false)
        }
      }

      const onPointerUp = () => {
        document.body.style.cursor = ""
        document.body.style.userSelect = ""
        document.removeEventListener("pointermove", onPointerMove)
        document.removeEventListener("pointerup", onPointerUp)
      }

      document.addEventListener("pointermove", onPointerMove)
      document.addEventListener("pointerup", onPointerUp)
    },
    [sidebarWidth, sidebarCollapsed, setSidebarWidth, setSidebarCollapsed]
  )

  return (
    <TooltipProvider>
      <div className="relative flex h-screen overflow-hidden bg-background">
        {/* ── Collapsed toggle button ── */}
        {sidebarCollapsed && (
          <div
            className="absolute left-0 top-0 z-50 flex h-full w-[40px] flex-col"
            onMouseEnter={() => setSidebarPeek(true)}
          >
            <button
              onClick={restoreSidebar}
              className="m-1.5 mt-2.5 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Expand sidebar"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── Peek overlay sidebar ── */}
        {sidebarCollapsed && sidebarPeek && (
          <div
            ref={sidebarRef}
            className="absolute left-0 top-0 z-40 h-full animate-in slide-in-from-left-2 duration-150"
            style={{ width: sidebarLastWidth }}
            onMouseLeave={() => setSidebarPeek(false)}
          >
            <div className="h-full shadow-xl border-r border-border">
              <LinearSidebar />
            </div>
          </div>
        )}

        {/* ── Normal sidebar ── */}
        {!sidebarCollapsed && (
          <div
            className="relative shrink-0 h-full"
            style={{ width: sidebarWidth }}
          >
            <LinearSidebar />
            {/* Resize handle */}
            <div
              onPointerDown={handlePointerDown}
              className="absolute right-0 top-0 z-10 h-full w-[4px] cursor-col-resize transition-colors hover:bg-primary/20 active:bg-primary/30"
              role="separator"
              aria-orientation="vertical"
            />
          </div>
        )}

        {/* ── Main content ── */}
        <div
          className="flex flex-1 overflow-hidden"
          style={sidebarCollapsed ? { marginLeft: 40 } : undefined}
        >
          {/* Table views (notes/pinned/trash): always mounted */}
          <div className={isTableView ? "flex flex-1 overflow-hidden" : "hidden"}>
            <NotesTableView />
          </div>

          {/* View routes: mount-once, keep-alive */}
          {(mountedViews.has("/inbox") || activeRoute === "/inbox") && (
            <div className={activeRoute === "/inbox" ? "flex flex-1 overflow-hidden" : "hidden"}>
              <InboxView />
            </div>
          )}
          {(mountedViews.has("/review") || activeRoute === "/review") && (
            <div className={activeRoute === "/review" ? "flex flex-1 overflow-hidden" : "hidden"}>
              <ReviewView />
            </div>
          )}
          {(mountedViews.has("/alerts") || activeRoute === "/alerts") && (
            <div className={activeRoute === "/alerts" ? "flex flex-1 overflow-hidden" : "hidden"}>
              <AlertsView />
            </div>
          )}
          {(mountedViews.has("/projects") || activeRoute === "/projects") && (
            <div className={activeRoute === "/projects" ? "flex flex-1 overflow-hidden" : "hidden"}>
              <ProjectsView />
            </div>
          )}
          {(mountedViews.has("/tags") || activeRoute === "/tags") && (
            <div className={activeRoute === "/tags" ? "flex flex-1 overflow-hidden" : "hidden"}>
              <TagsView />
            </div>
          )}
          {(mountedViews.has("/views") || activeRoute === "/views") && (
            <div className={activeRoute === "/views" ? "flex flex-1 overflow-hidden" : "hidden"}>
              <ViewsView />
            </div>
          )}
          {(mountedViews.has("/maps") || activeRoute === "/maps") && (
            <div className={activeRoute === "/maps" ? "flex flex-1 overflow-hidden" : "hidden"}>
              <MapsView />
            </div>
          )}

          {/* Fallback: param routes (/projects/[id], /maps/[id], etc.) */}
          <div className={isFallback ? "flex flex-1 overflow-hidden" : "hidden"}>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>
        </div>

        <SearchDialog />
        <ShortcutOverlay />
        <MergeDialogGlobal />
        <LinkDialogGlobal />
        <Toaster position="bottom-right" theme={resolvedTheme === "dark" ? "dark" : "light"} />
      </div>
    </TooltipProvider>
  )
}
