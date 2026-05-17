"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
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
import { StickersView } from "@/components/views/stickers-view"
import { OntologyView } from "@/components/views/ontology-view"
import { TemplatesView } from "@/components/views/templates-view"
import { WikiTemplatesView } from "@/components/views/wiki-templates-view"
import { InsightsView } from "@/components/insights-view"
import { WikiView } from "@/components/views/wiki-view"
import { CalendarView } from "@/components/calendar-view"
import { SearchView } from "@/components/views/search-view"
import { GraphInsightsView } from "@/components/views/graph-insights-view"
import { HomeView } from "@/components/views/home-view"
import { InboxView } from "@/components/views/inbox-view"
import { TodoView } from "@/components/views/todo-view"
import { LibraryView } from "@/components/views/library-view"
import { BooksView } from "@/components/views/books-view"
import { MergeDialogGlobal } from "@/components/merge-dialog-global"
import { LinkDialogGlobal } from "@/components/link-dialog-global"
import { WikiAssemblyDialog } from "@/components/wiki-assembly-dialog"
import { SmartSidePanel } from "@/components/side-panel/smart-side-panel"
import { WikilinkContextMenu } from "@/components/editor/wikilink-context-menu"
import { NoteHoverPreview } from "@/components/editor/note-hover-preview"
import { FootnoteEditModal } from "@/components/editor/footnote-edit-modal"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { SecondaryPanelContent } from "@/components/workspace/secondary-panel-content"
import { PaneProvider } from "@/components/workspace/pane-context"
import { useSecondarySpace } from "@/lib/table-route"
import { useSplitTargetNoteId, setSplitTargetNoteId } from "@/lib/note-split-mode"
import { NoteSplitPage } from "@/components/views/note-split-page"

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
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const pendingWikiAssemblyIds = usePlotStore((s) => s.pendingWikiAssemblyIds)
  const secondarySpace = useSecondarySpace()
  const secondaryNoteId = usePlotStore((s) => s.secondaryNoteId)
  const setPendingWikiAssembly = usePlotStore((s) => s.setPendingWikiAssembly)
  const { resolvedTheme } = useTheme()
  const pathname = usePathname()
  const prevPathname = useRef(pathname)

  // Sync active-route store from pathname (handles direct URL, back/forward)
  useEffect(() => {
    syncFromPathname(pathname)
  }, [pathname])

  const activeRoute = useActiveRoute()
  // Dynamic param routes (/folder/[id], /label/[id], /tag/[id]) used to
  // redirect to /notes; the new folder detail page renders its own UI
  // under `children`. When pathname is on a dynamic route, force
  // isFallback so the NotesTableView/etc. don't sit on top of it.
  const isOnDynamicRoute =
    pathname?.startsWith("/folder/") ||
    pathname?.startsWith("/label/") ||
    pathname?.startsWith("/tag/") ||
    false
  const isTableView = !isOnDynamicRoute && activeRoute !== null && TABLE_VIEW_ROUTES.includes(activeRoute)
  // Sub-routes (e.g. /books/{id}, /library/references) share the parent's
  // always-mounted view container; treat them as view-routes too so the
  // fallback children div doesn't double-mount and steal half the width.
  const isViewRoute = !isOnDynamicRoute && activeRoute !== null && (
    VIEW_ROUTES.includes(activeRoute) ||
    activeRoute.startsWith("/books/") ||
    activeRoute.startsWith("/library/")
  )
  const isFallback = !isTableView && !isViewRoute

  // Split state — covers both editor split and view-mode split
  const hasSplit = !!secondaryNoteId || !!secondarySpace
  // Editor split: WorkspaceEditorArea handles the split internally
  // View split: layout.tsx renders SecondaryPanelContent as a sibling panel
  // WorkspaceEditorArea is mounted ONLY inside NotesTableView. For book
  // reading (BooksView → BookDetailPage → NoteEditor inline), layout must
  // render the secondary panel itself. Same for any other view that opens
  // an entity inline without delegating to WorkspaceEditorArea.
  const isEditingInTableView = isTableView && !!selectedNoteId
  // View-mode split: layout.tsx renders Panel 2 unless the editor-split
  // path inside NotesTableView is already handling it.
  const hasViewSplit = !isEditingInTableView && hasSplit
  const activePane = usePlotStore((s) => s.activePane)
  const primarySidePanelVisible = sidePanelOpen && (sidePanelMode === 'detail' || sidePanelMode === 'connections' || sidePanelMode === 'activity' || sidePanelMode === 'bookmarks')
  // Show side panel when it's open
  const showSidePanel = primarySidePanelVisible

  // Mount-once: track which view routes have been visited
  // Once mounted, a view stays mounted (keep-alive) for instant re-visits
  const [mountedViews, setMountedViews] = useState<Set<string>>(() => new Set())
  useEffect(() => {
    if (!activeRoute) return
    // VIEW_ROUTES entries OR dynamic sub-routes that share an always-mounted view.
    const isViewRoute = VIEW_ROUTES.includes(activeRoute)
    const isBookSubRoute = activeRoute.startsWith("/books/")
    if (!isViewRoute && !isBookSubRoute) return
    setMountedViews((prev) => {
      const next = new Set(prev)
      let changed = false
      if (isViewRoute && !next.has(activeRoute)) {
        next.add(activeRoute)
        changed = true
      }
      // For sub-routes like /library/references, also mark the parent /library as mounted
      if (activeRoute.startsWith("/library") && !next.has("/library")) {
        next.add("/library")
        changed = true
      }
      // Same pattern for /books/{id} — keep BooksView keep-alive across detail visits.
      if (isBookSubRoute && !next.has("/books")) {
        next.add("/books")
        changed = true
      }
      return changed ? next : prev
    })
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

          {/* ── Main content layout ──
              [Content] [View-Split Secondary?] [SidePanel?]
              - Editor split is handled INSIDE WorkspaceEditorArea (rendered via children)
              - View split (no editor) renders SecondaryPanelContent here
              - Side panel always rendered here when open  */}
          <ResizablePanelGroup id="main-layout" direction="horizontal" className="flex-1">
            {/* 1. Primary content */}
            <ResizablePanel
              id="main-content"
              order={1}
              defaultSize={
                hasViewSplit
                  ? (showSidePanel ? 35 : 50)
                  : (showSidePanel ? 70 : 100)
              }
              minSize={20}
            >
              <PaneProvider pane="primary">
              <div
                className="relative flex h-full overflow-hidden"
                onPointerDownCapture={() => usePlotStore.getState().setActivePane('primary')}
              >
                {/* Global Note Split overlay — covers entire primary panel when active */}
                <NoteSplitOverlay />

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

                {(mountedViews.has("/inbox") || activeRoute === "/inbox") && (
                  <div className={activeRoute === "/inbox" ? "flex flex-1 overflow-hidden" : "hidden"}>
                    <InboxView />
                  </div>
                )}

                {/* 2026-05-17 — Labels route /labels → /library/labels.
                    legacy /labels도 back-compat 유지 (둘 다 LabelsView mount). */}
                {(mountedViews.has("/labels") || mountedViews.has("/library/labels") || activeRoute === "/labels" || activeRoute === "/library/labels") && (
                  <div className={(activeRoute === "/labels" || activeRoute === "/library/labels") ? "flex flex-1 overflow-hidden" : "hidden"}>
                    <LabelsView />
                  </div>
                )}

                {(mountedViews.has("/stickers") || activeRoute === "/stickers") && (
                  <div className={activeRoute === "/stickers" ? "flex flex-1 overflow-hidden" : "hidden"}>
                    <StickersView />
                  </div>
                )}

                {(mountedViews.has("/templates") || activeRoute === "/templates") && (
                  <div className={activeRoute === "/templates" ? "flex flex-1 overflow-hidden" : "hidden"}>
                    <TemplatesView />
                  </div>
                )}

                {(mountedViews.has("/wiki/templates") || activeRoute === "/wiki/templates") && (
                  <div className={activeRoute === "/wiki/templates" ? "flex flex-1 overflow-hidden" : "hidden"}>
                    <WikiTemplatesView />
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

                {(mountedViews.has("/books") || activeRoute?.startsWith("/books")) && (
                  <div className={activeRoute?.startsWith("/books") ? "flex flex-1 overflow-hidden" : "hidden"}>
                    <BooksView />
                  </div>
                )}

                {/* Fallback: param routes */}
                <div className={isFallback ? "flex flex-1 overflow-hidden" : "hidden"}>
                  <ErrorBoundary>
                    {children}
                  </ErrorBoundary>
                </div>
              </div>
              </PaneProvider>
            </ResizablePanel>

            {/* 2. View-mode split secondary content (only when NOT editing a note) */}
            {hasViewSplit && (
              <>
                <ResizableHandle className="w-px bg-border/50 hover:bg-primary/20 active:bg-primary/30 transition-colors" />
                <ResizablePanel id="main-view-secondary" order={2} defaultSize={showSidePanel ? 35 : 50} minSize={20}>
                  <PaneProvider pane="secondary">
                  <div
                    className="flex h-full flex-col overflow-hidden"
                    onPointerDownCapture={() => usePlotStore.getState().setActivePane('secondary')}
                  >
                    <SecondaryPanelContent />
                  </div>
                  </PaneProvider>
                </ResizablePanel>
              </>
            )}

            {/* 3. Side panel — single source of truth for ALL cases */}
            {showSidePanel && (
              <>
                <ResizableHandle className="w-px bg-border/50 hover:bg-primary/20 active:bg-primary/30 transition-colors" />
                <ResizablePanel
                  id="main-sidepanel"
                  order={3}
                  defaultSize={hasSplit ? 24 : 30}
                  minSize={hasSplit ? 10 : 15}
                  maxSize={hasSplit ? 40 : 50}
                >
                  {/* Single SmartSidePanel — content follows activePane via PaneProvider
                      and useSidePanelEntity hook. Works identically in single and split modes. */}
                  <PaneProvider pane={activePane}>
                    <SmartSidePanel />
                  </PaneProvider>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>

        <SearchDialog />
        <ShortcutOverlay />
        <WikilinkContextMenu />
        <NoteHoverPreview />
        <FootnoteEditModal />
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

/**
 * Renders NoteSplitPage as an absolute overlay covering the entire primary
 * panel area when split mode is active. This makes Split work from ANY view
 * (notes list, inbox, even when no note is open).
 */
function NoteSplitOverlay() {
  const splitTargetNoteId = useSplitTargetNoteId()
  if (!splitTargetNoteId) return null
  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-background">
      <NoteSplitPage
        noteId={splitTargetNoteId}
        onClose={() => setSplitTargetNoteId(null)}
      />
    </div>
  )
}
