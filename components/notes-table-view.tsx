"use client"

import { useCallback, useEffect } from "react"
import { usePlotStore } from "@/lib/store"
import { useSettingsStore } from "@/lib/settings-store"
import { NotesTable } from "@/components/notes-table"
import { NotesBoard } from "@/components/notes-board"
import { GalleryViewShell } from "@/components/views/gallery-view-shell"
import { WorkspaceEditorArea } from "@/components/workspace/workspace-editor-area"
import { usePane } from "@/components/workspace/pane-context"
import { useActiveRoute, useActiveFolderId, useActiveTagId, useActiveLabelId, useActiveViewId } from "@/lib/table-route"
import type { ViewContextKey } from "@/lib/view-engine/types"
import type { Note } from "@/lib/types"
// ── Phase 2 (split-mode-prd): dual mode wiring ─────────────────────────────
import { useEffectiveViewMode } from "@/hooks/use-effective-view-mode"
import { DualListEditor } from "@/components/dual/dual-list-editor"
import { NoteEditor } from "@/components/note-editor"

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

  // ── Phase 2 (split-mode-prd): viewport-aware effective mode + dual selection ──
  // useEffectiveViewMode auto-falls back to "list" below 1200px (LOCKED #4) and
  // toasts on transition. Returns the persisted mode pre-mount (SSR-safe).
  const effectiveMode = useEffectiveViewMode(contextKey)
  const dualSelection = usePlotStore((s) => s.dualSelection)
  const setDualSelection = usePlotStore((s) => s.setDualSelection)
  const notes = usePlotStore((s) => s.notes)

  // Mid-session entity deletion cleanup (LOCKED #10): when the selected note
  // is trashed or removed while the dual editor pane is showing it, clear the
  // selection so DefaultEmptyState shows instead of a stale editor.
  useEffect(() => {
    if (!dualSelection || dualSelection.kind !== "note") return
    const exists = notes.some((n) => n.id === dualSelection.refId && !n.trashed)
    if (!exists) setDualSelection(null)
  }, [notes, dualSelection, setDualSelection])

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

  // ── Phase 2 (split-mode-prd) — Dual mode branch ──
  // Renders NotesTable in the left pane (with row click → setDualSelection)
  // and NoteEditor in the right pane. Trash view skips dual (kept simple
  // for MVP — trash already has its own sub-filter UX). Dual mode takes
  // precedence over the WorkspaceEditorArea branch: even if a note is
  // currently selected (selectedNoteId != null), dual layout shows the
  // list+editor split — which is the whole point of dual mode.
  if (effectiveMode === "dual" && !isTrashView) {
    return (
      <div className="u-mode flex flex-1 overflow-hidden" data-mode="dual">
        <DualListEditor
          storageId="dual-notes"
          list={
            <NotesTable
              context={config.context}
              title={config.title}
              hideCreateButton={config.hideCreateButton}
              createNoteOverrides={config.createNoteOverrides}
              folderId={activeFolderId ?? undefined}
              tagId={activeTagId ?? undefined}
              labelId={activeLabelId ?? undefined}
              dualMode
              onRowClick={(noteId) => setDualSelection({ kind: "note", refId: noteId })}
              activePreviewId={
                dualSelection?.kind === "note" ? dualSelection.refId : null
              }
            />
          }
          editor={
            dualSelection?.kind === "note" ? (
              <div className="flex h-full flex-col overflow-hidden">
                <NoteEditor noteId={dualSelection.refId} />
              </div>
            ) : null
          }
        />
      </div>
    )
  }

  // ── Workspace editor area: show when editing in any non-dual layout mode ──
  // (Dual mode handles its own editor pane via DualListEditor above.)
  if (isEditing) {
    return (
      <div className="flex flex-1 overflow-hidden animate-in fade-in duration-200">
        <WorkspaceEditorArea />
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
      />
    </div>
  )
}
