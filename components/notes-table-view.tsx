"use client"

import { useCallback, useEffect } from "react"
import { usePlotStore } from "@/lib/store"
import { useSettingsStore } from "@/lib/settings-store"
import { NotesTable } from "@/components/notes-table"
import { NotesBoard } from "@/components/notes-board"
import { GalleryViewShell } from "@/components/views/gallery-view-shell"
import { StudioViewShell } from "@/components/views/studio-view-shell"
import { EditorialViewShell } from "@/components/views/editorial-view-shell"
import { ViewSwitcher, type ViewSwitcherMode } from "@/components/views/view-switcher"
import { WorkspaceEditorArea } from "@/components/workspace/workspace-editor-area"
import { usePane } from "@/components/workspace/pane-context"
import { useActiveRoute, useActiveFolderId, useActiveTagId, useActiveLabelId, useActiveViewId } from "@/lib/table-route"
import type { ViewContextKey, ViewMode } from "@/lib/view-engine/types"
import type { Note } from "@/lib/types"

/* ── Route → View Config map ─────────────────────────── */

interface ViewConfig {
  context?: ViewContextKey
  title?: string
  hideCreateButton?: boolean
  createNoteOverrides?: Partial<Note>
}

const TABLE_VIEW_MAP: Record<string, ViewConfig> = {
  "/notes": {},
  "/stone": { context: "stone", title: "Stone" },
  "/brick": { context: "brick", title: "Brick" },
  "/keystone": { context: "keystone", title: "Block" },
  "/pinned": { context: "pinned", title: "Pinned", hideCreateButton: true },
  "/trash": { context: "trash", title: "Trash", hideCreateButton: true },
}

/* ── NotesTableView (always mounted in layout) ───────── */

export function NotesTableView() {
  const tableRoute = useActiveRoute()
  const activeFolderId = useActiveFolderId()
  const activeTagId = useActiveTagId()
  const activeLabelId = useActiveLabelId()
  const activeViewId = useActiveViewId()
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const savedViews = usePlotStore((s) => s.savedViews)
  const setViewState = usePlotStore((s) => s.setViewState)
  const settingsViewMode = useSettingsStore((s) => s.viewMode)
  const setPreviewNoteId = usePlotStore((s) => s.setPreviewNoteId)
  const previewNoteId = usePlotStore((s) => s.previewNoteId)
  const pane = usePane()
  // In secondary pane, never show WorkspaceEditorArea (it's already the parent)
  const isEditing = pane === 'primary' && selectedNoteId !== null

  const baseConfig = TABLE_VIEW_MAP[tableRoute ?? ""] ?? {}
  const activeView = activeViewId ? savedViews.find((v) => v.id === activeViewId) : null
  const config: ViewConfig = (() => {
    if (tableRoute !== "/notes") return baseConfig
    if (activeFolderId) return { ...baseConfig, context: "folder" as ViewContextKey }
    if (activeTagId) return { ...baseConfig, context: "tag" as ViewContextKey }
    if (activeLabelId) return { ...baseConfig, context: "label" as ViewContextKey }
    if (activeViewId) return { ...baseConfig, context: "savedView" as ViewContextKey, title: activeView?.name ?? "View" }
    return baseConfig
  })()

  // Read viewMode: check per-context viewState first, fallback to settings
  const contextKey = (config.context ?? "all") as ViewContextKey
  const contextViewMode = usePlotStore(
    useCallback((s) => s.viewStateByContext[contextKey]?.viewMode, [contextKey])
  )
  const viewMode = contextViewMode ?? settingsViewMode

  // ESC closes preview panel
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const target = e.target as HTMLElement
        if (target.closest("[role='dialog']") || target.closest("[data-radix-popper-content-wrapper]")) return
        if (!isEditing) {
          usePlotStore.getState().setPreviewNoteId(null)
        }
      }
    },
    [isEditing],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  // Clear preview when switching views
  useEffect(() => {
    usePlotStore.getState().setPreviewNoteId(null)
  }, [tableRoute])

  // Sync saved view's viewState into the view engine when activeViewId changes
  useEffect(() => {
    if (activeView) {
      setViewState("savedView" as ViewContextKey, activeView.viewState as Parameters<typeof setViewState>[1])
    }
  }, [activeViewId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Workspace editor area: show when editing in any layout mode ──
  if (isEditing) {
    return (
      <div className="flex flex-1 overflow-hidden animate-in fade-in duration-200">
        <WorkspaceEditorArea />
      </div>
    )
  }

  // ── v3 Phase 5.1 / 5.2 / 5.3: Gallery + Studio + Editorial mode toggle ──
  // ViewSwitcher exposes Table (list) ↔ Gallery ↔ Studio ↔ Editorial; Board
  // lives behind the Display popover. Hidden on /trash where these have no
  // useful semantics (a deleted-note "magazine" makes no sense).
  const isTrashView = tableRoute === "/trash"
  const switcherValue: ViewSwitcherMode =
    viewMode === "gallery"   ? "gallery"
    : viewMode === "studio"    ? "studio"
    : viewMode === "editorial" ? "editorial"
    : "list"
  const handleSwitcherChange = (mode: ViewSwitcherMode) => {
    setViewState(contextKey, { viewMode: mode as ViewMode })
  }
  const headerExtras = !isTrashView ? (
    <ViewSwitcher value={switcherValue} onChange={handleSwitcherChange} />
  ) : undefined

  // Editorial shell (own ViewHeader chrome, warm canvas body)
  if (viewMode === "editorial" && !isTrashView) {
    return (
      <div className="flex flex-1 overflow-hidden">
        <EditorialViewShell
          context={contextKey}
          title={config.title}
          hideCreateButton={config.hideCreateButton}
          folderId={activeFolderId ?? undefined}
          tagId={activeTagId ?? undefined}
          labelId={activeLabelId ?? undefined}
          headerExtras={headerExtras}
          onNoteClick={(noteId) => setPreviewNoteId(noteId)}
          activePreviewId={previewNoteId}
        />
      </div>
    )
  }

  // Studio shell (own ViewHeader chrome, dark-forced body)
  if (viewMode === "studio" && !isTrashView) {
    return (
      <div className="flex flex-1 overflow-hidden">
        <StudioViewShell
          context={contextKey}
          title={config.title}
          hideCreateButton={config.hideCreateButton}
          folderId={activeFolderId ?? undefined}
          tagId={activeTagId ?? undefined}
          labelId={activeLabelId ?? undefined}
          headerExtras={headerExtras}
          onNoteClick={(noteId) => setPreviewNoteId(noteId)}
          activePreviewId={previewNoteId}
        />
      </div>
    )
  }

  // Gallery shell (own ViewHeader chrome, parallel to NotesTable/Board)
  if (viewMode === "gallery" && !isTrashView) {
    return (
      <div className="flex flex-1 overflow-hidden">
        <GalleryViewShell
          context={contextKey}
          title={config.title}
          hideCreateButton={config.hideCreateButton}
          folderId={activeFolderId ?? undefined}
          tagId={activeTagId ?? undefined}
          labelId={activeLabelId ?? undefined}
          headerExtras={headerExtras}
          onNoteClick={(noteId) => setPreviewNoteId(noteId)}
          activePreviewId={previewNoteId}
        />
      </div>
    )
  }

  // Table / Board view + optional detail panel
  const ViewComponent = viewMode === "board" ? NotesBoard : NotesTable
  const modeAttr = viewMode === "board" ? "board" : "table"

  return (
    <div className="u-mode flex flex-1 overflow-hidden" data-mode={modeAttr}>
      <ViewComponent
        context={config.context}
        title={config.title}
        hideCreateButton={config.hideCreateButton}
        createNoteOverrides={config.createNoteOverrides}
        folderId={activeFolderId ?? undefined}
        tagId={activeTagId ?? undefined}
        labelId={activeLabelId ?? undefined}
        onRowClick={(noteId) => setPreviewNoteId(noteId)}
        activePreviewId={previewNoteId}
        headerExtras={headerExtras}
      />
    </div>
  )
}
