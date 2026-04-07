"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { LinearSidebar } from "@/components/linear-sidebar"
import { ActivityBar } from "@/components/activity-bar"

import { SearchDialog } from "@/components/search-dialog"
import { ShortcutOverlay } from "@/components/shortcut-overlay"
import { TooltipProvider } from "@/components/ui/tooltip"
import { usePlotStore } from "@/lib/store"
import { useGlobalShortcuts } from "@/hooks/use-global-shortcuts"
import { useAutopilotNudges } from "@/hooks/use-autopilot-nudges"
import { useCoOccurrences } from "@/hooks/use-co-occurrences"
import { useRelationSuggestions } from "@/hooks/use-relation-suggestions"
import { useClusterSuggestions } from "@/hooks/use-cluster-suggestions"
import { Toaster } from "sonner"
import { ErrorBoundary } from "@/components/error-boundary"
import { NotesTableView } from "@/components/notes-table-view"
import { useActiveRoute, syncFromPathname, TABLE_VIEW_ROUTES, VIEW_ROUTES } from "@/lib/table-route"
import { LabelsView } from "@/components/views/labels-view"
import { OntologyView } from "@/components/views/ontology-view"
import { TemplatesView } from "@/components/views/templates-view"
import { InsightsView } from "@/components/insights-view"
import { WikiView } from "@/components/views/wiki-view"
import { CalendarView } from "@/components/calendar-view"
import { SearchView } from "@/components/views/search-view"
import { GraphInsightsView } from "@/components/views/graph-insights-view"
import { HomeView } from "@/components/views/home-view"
import { TodoView } from "@/components/views/todo-view"
import { LibraryView } from "@/components/views/library-view"
import { MergeDialogGlobal } from "@/components/merge-dialog-global"
import { LinkDialogGlobal } from "@/components/link-dialog-global"
import { WikiAssemblyDialog } from "@/components/wiki-assembly-dialog"
import { SmartSidePanel } from "@/components/side-panel/smart-side-panel"
import { WikilinkContextMenu } from "@/components/editor/wikilink-context-menu"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"

const MIN_WIDTH = 200
const MAX_WIDTH = 320
const COLLAPSE_THRESHOLD = 80

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const setSelectedNoteId = usePlotStore((s) => s.setSelectedNoteId)
  const sidebarWidth = usePlotStore((s) => s.sidebarWidth)
  const sidebarCollapsed = usePlotStore((s) => s.sidebarCollapsed)
  const setSidebarWidth = usePlotStore((s) => s.setSidebarWidth)
  const setSidebarCollapsed = usePlotStore((s) => s.setSidebarCollapsed)
  const sidePanelOpen = usePlotStore((s) => s.sidePanelOpen)
  const sidePanelMode = usePlotStore((s) => s.sidePanelMode)
  const sidePanelPeekNoteId = usePlotStore((s) => s.sidePanelPeekNoteId)
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const pendingWikiAssemblyIds = usePlotStore((s) => s.pendingWikiAssemblyIds)
  const setPendingWikiAssembly = usePlotStore((s) => s.setPendingWikiAssembly)
  const { resolvedTheme } = useTheme()
  const pathname = usePathname()
  const prevPathname = useRef(pathname)

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
        const next = new Set(prev)
        let changed = false
        if (!next.has(activeRoute)) {
          next.add(activeRoute)
          changed = true
        }
        // For sub-routes like /library/references, also mark the parent /library as mounted
        if (activeRoute.startsWith("/library") && !next.has("/library")) {
          next.add("/library")
          changed = true
        }
        return changed ? next : prev
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
  // Autopilot nudges: inbox triage + SRS review reminders
  useAutopilotNudges()
  // Co-occurrence engine: recompute on notes change (2s debounce)
  useCoOccurrences()
  // Relation suggestions: auto-generate from co-occurrences
  useRelationSuggestions()
  // Cluster detection: auto-detect wiki article candidates
  useClusterSuggestions()

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
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        {/* ── Body: Activity Bar + Sidebar + Content ── */}
        <div className="flex flex-1 overflow-hidden">
          {/* ── Activity Bar (always visible) ── */}
          <ActivityBar />

          {/* ── Sidebar (collapsible) ── */}
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

          {/* ── Main content + Side Panel ── */}
          <ResizablePanelGroup direction="horizontal" className="flex-1">
            <ResizablePanel defaultSize={75} minSize={50}>
              <div className="flex h-full overflow-hidden">
                {/* Table views (notes/pinned/trash): always mounted */}
                <div className={isTableView ? "flex flex-1 overflow-hidden" : "hidden"}>
                  <NotesTableView />
                </div>

                {/* View routes: mount-once, keep-alive */}
                {(mountedViews.has("/home") || activeRoute === "/home") && (
                  <div className={activeRoute === "/home" ? "flex flex-1 overflow-hidden" : "hidden"}>
                    <HomeView />
                  </div>
                )}

                {(mountedViews.has("/labels") || activeRoute === "/labels") && (
                  <div className={activeRoute === "/labels" ? "flex flex-1 overflow-hidden" : "hidden"}>
                    <LabelsView />
                  </div>
                )}

                {(mountedViews.has("/templates") || activeRoute === "/templates") && (
                  <div className={activeRoute === "/templates" ? "flex flex-1 overflow-hidden" : "hidden"}>
                    <TemplatesView />
                  </div>
                )}

                {(mountedViews.has("/ontology") || activeRoute === "/ontology") && (
                  <div className={activeRoute === "/ontology" ? "flex flex-1 overflow-hidden" : "hidden"}>
                    <OntologyView />
                  </div>
                )}

                {(mountedViews.has("/insights") || activeRoute === "/insights") && (
                  <div className={activeRoute === "/insights" ? "flex flex-1 overflow-hidden" : "hidden"}>
                    <InsightsView />
                  </div>
                )}

                {(mountedViews.has("/wiki") || activeRoute === "/wiki") && (
                  <div className={activeRoute === "/wiki" ? "flex flex-1 overflow-hidden" : "hidden"}>
                    <WikiView />
                  </div>
                )}

                {(mountedViews.has("/search") || activeRoute === "/search") && (
                  <div className={activeRoute === "/search" ? "flex flex-1 overflow-hidden" : "hidden"}>
                    <SearchView />
                  </div>
                )}

                {(mountedViews.has("/calendar") || activeRoute === "/calendar") && (
                  <div className={activeRoute === "/calendar" ? "flex flex-1 overflow-hidden" : "hidden"}>
                    <CalendarView title="Calendar" />
                  </div>
                )}

                {(mountedViews.has("/graph-insights") || activeRoute === "/graph-insights") && (
                  <div className={activeRoute === "/graph-insights" ? "flex flex-1 overflow-hidden" : "hidden"}>
                    <GraphInsightsView />
                  </div>
                )}

                {(mountedViews.has("/todos") || activeRoute === "/todos") && (
                  <div className={activeRoute === "/todos" ? "flex flex-1 overflow-hidden" : "hidden"}>
                    <TodoView />
                  </div>
                )}

                {(mountedViews.has("/library") || activeRoute?.startsWith("/library")) && (
                  <div className={activeRoute?.startsWith("/library") ? "flex flex-1 overflow-hidden" : "hidden"}>
                    <LibraryView />
                  </div>
                )}

                {/* Fallback: param routes (/projects/[id], /maps/[id], etc.) */}
                <div className={isFallback ? "flex flex-1 overflow-hidden" : "hidden"}>
                  <ErrorBoundary>
                    {children}
                  </ErrorBoundary>
                </div>
              </div>
            </ResizablePanel>
            {sidePanelOpen && (sidePanelMode === 'detail' || sidePanelMode === 'connections' || sidePanelMode === 'activity' || sidePanelMode === 'bookmarks' || (sidePanelMode === 'peek' && !!sidePanelPeekNoteId)) && (
              <>
                <ResizableHandle className="w-px bg-border/50 hover:bg-primary/20 active:bg-primary/30 transition-colors" />
                <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
                  <SmartSidePanel />
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>

        <SearchDialog />
        <ShortcutOverlay />
        <WikilinkContextMenu />
        <MergeDialogGlobal />
        <LinkDialogGlobal />
        {/* Global Wiki Assembly Dialog (triggered by cluster nudge) */}
        {pendingWikiAssemblyIds && pendingWikiAssemblyIds.length > 0 && (
          <WikiAssemblyDialog
            open={true}
            onOpenChange={(open) => {
              if (!open) setPendingWikiAssembly(null)
            }}
            noteIds={pendingWikiAssemblyIds}
            onComplete={() => {
              setPendingWikiAssembly(null)
            }}
          />
        )}
        <Toaster position="bottom-right" theme={resolvedTheme === "dark" ? "dark" : "light"} />
      </div>
    </TooltipProvider>
  )
}
