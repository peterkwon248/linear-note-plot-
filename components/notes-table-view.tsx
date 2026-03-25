"use client"

import { useCallback, useEffect } from "react"
import { usePlotStore } from "@/lib/store"
import { useSettingsStore } from "@/lib/settings-store"
import { NotesTable } from "@/components/notes-table"
import { NotesBoard } from "@/components/notes-board"
import { WorkspaceEditorArea } from "@/components/workspace/workspace-editor-area"
import { useActiveRoute, useActiveFolderId, useActiveTagId, useActiveLabelId, useActiveViewId } from "@/lib/table-route"
import type { ViewContextKey } from "@/lib/view-engine/types"
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
  "/inbox": { context: "inbox", title: "Inbox" },
  "/capture": { context: "capture", title: "Capture" },
  "/permanent": { context: "permanent", title: "Permanent" },
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
  const isEditing = selectedNoteId !== null

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

  // Table / Board view + optional detail panel
  const ViewComponent = viewMode === "board" ? NotesBoard : NotesTable

  return (
    <div className="flex flex-1 overflow-hidden">
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
      />
    </div>
  )
}
