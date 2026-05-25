"use client"

import { useCallback, useEffect } from "react"
import { usePlotStore } from "@/lib/store"
import { useSettingsStore } from "@/lib/settings-store"
import { NotesTable } from "@/components/notes-table"
import { NotesBoard } from "@/components/notes-board"
import { NotesTimelineShell } from "@/components/notes-timeline-shell"
import { NotesGridShell } from "@/components/notes-grid-shell"
// 2026-05-24: GalleryViewShell import removed — gallery mode deprecated
import { WorkspaceEditorArea } from "@/components/workspace/workspace-editor-area"
import { usePane } from "@/components/workspace/pane-context"
import { useActiveRoute, useActiveFolderId, useActiveTagId, useActiveLabelId, useActiveViewId } from "@/lib/table-route"
import type { ViewContextKey } from "@/lib/view-engine/types"
import type { Note } from "@/lib/types"
import { useT } from "@/lib/i18n"

/* ── Route → View Config map ─────────────────────────── */

interface ViewConfig {
  context?: ViewContextKey
  title?: string
  /** i18n dictionary key — resolved at render time via useT().
   *  When present, the consumer should prefer this over `title`. */
  titleKey?: string
  hideCreateButton?: boolean
  createNoteOverrides?: Partial<Note>
}

const TABLE_VIEW_MAP: Record<string, ViewConfig> = {
  "/notes": { titleKey: "routes.title.notes" },
  "/stone": { context: "stone", titleKey: "status.stone" },
  "/brick": { context: "brick", titleKey: "status.brick" },
  "/keystone": { context: "keystone", titleKey: "status.block" },
  "/pinned": { context: "pinned", titleKey: "sidebar.section.pinned", hideCreateButton: true },
  "/trash": { context: "trash", titleKey: "routes.title.trash", hideCreateButton: true },
}

/* ── NotesTableView (always mounted in layout) ───────── */

export function NotesTableView() {
  const t = useT()
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
  const openNote = usePlotStore((s) => s.openNote)
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
    if (activeViewId) return { ...baseConfig, context: "savedView" as ViewContextKey, title: activeView?.name ?? t("routes.title.view_fallback") }
    return baseConfig
  })()

  // Resolve titleKey → translated string. Falls back to `config.title` (used
  // by savedView branch where the user-authored name should be shown as-is).
  const resolvedTitle = config.titleKey ? t(config.titleKey) : config.title

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

  const isTrashView = tableRoute === "/trash"

  // ── Workspace editor area: show when editing ──
  if (isEditing) {
    return (
      <div className="flex flex-1 overflow-hidden animate-in fade-in duration-200">
        <WorkspaceEditorArea />
      </div>
    )
  }

  // Timeline shell — bars-first lifespan view (Notes uses createdAt → updatedAt
  // as the lifespan; no plannedDate / drag, no event markers in tier 1).
  if (viewMode === "timeline" && !isTrashView) {
    return (
      <div className="flex flex-1 overflow-hidden">
        <NotesTimelineShell
          context={contextKey}
          title={resolvedTitle}
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

  // 2026-05-24: gallery mode deprecated — persisted "gallery" auto-migrates
  // to "grid" via normalizeViewState. Grid mode now renders Books-parity
  // cards (NotesGridShell + NotesGridView). Earlier inline note said
  // "NotesTable handles grid rendering" — that was false: it silently
  // fell through to list. User signal 2026-05-24 ("북스의 그리드처럼")
  // closes that gap.
  if (viewMode === "grid" && !isTrashView) {
    return (
      <div className="flex flex-1 overflow-hidden">
        <NotesGridShell
          context={contextKey}
          title={resolvedTitle}
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

  // Table / Board view + optional detail panel
  const ViewComponent = viewMode === "board" ? NotesBoard : NotesTable
  const modeAttr = viewMode === "board" ? "board" : "table"

  return (
    <div className="u-mode flex flex-1 overflow-hidden" data-mode={modeAttr}>
      <ViewComponent
        context={config.context}
        title={resolvedTitle}
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
