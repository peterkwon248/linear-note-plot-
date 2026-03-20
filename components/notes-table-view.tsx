"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { usePlotStore } from "@/lib/store"
import { useSettingsStore } from "@/lib/settings-store"
import { NotesTable } from "@/components/notes-table"
import { NotesBoard } from "@/components/notes-board"
import { NoteInspector } from "@/components/note-inspector"
import { NoteDetailPanel } from "@/components/note-detail-panel"
import { WorkspaceEditorArea } from "@/components/workspace/workspace-editor-area"
import { InsightsView } from "@/components/insights-view"
import { CalendarView } from "@/components/calendar-view"
import { useActiveRoute, useActiveFolderId, useActiveTagId, useActiveLabelId } from "@/lib/table-route"
import { findLeafByContentType } from "@/lib/workspace/tree-utils"
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
  "/pinned": { context: "pinned", title: "Pinned", hideCreateButton: true },
  "/trash": { context: "trash", title: "Trash", hideCreateButton: true },
}

/* ── NotesTableView (always mounted in layout) ───────── */

export function NotesTableView() {
  const tableRoute = useActiveRoute()
  const activeFolderId = useActiveFolderId()
  const activeTagId = useActiveTagId()
  const activeLabelId = useActiveLabelId()
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const openNote = usePlotStore((s) => s.openNote)
  const workspaceMode = usePlotStore((s) => s.workspaceMode)
  const workspaceRoot = usePlotStore((s) => s.workspaceRoot)
  const applyPreset = usePlotStore((s) => s.applyPreset)
  const viewMode = useSettingsStore((s) => s.viewMode)
  const isEditing = selectedNoteId !== null

  const [previewId, setPreviewId] = useState<string | null>(null)
  const hasMigrated = useRef(false)

  const baseConfig = TABLE_VIEW_MAP[tableRoute ?? ""] ?? {}
  const config: ViewConfig = (() => {
    if (tableRoute !== "/notes") return baseConfig
    if (activeFolderId) return { ...baseConfig, context: "folder" as ViewContextKey }
    if (activeTagId) return { ...baseConfig, context: "tag" as ViewContextKey }
    if (activeLabelId) return { ...baseConfig, context: "label" as ViewContextKey }
    return baseConfig
  })()

  // ESC closes preview panel
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const target = e.target as HTMLElement
        if (target.closest("[role='dialog']") || target.closest("[data-radix-popper-content-wrapper]")) return
        if (!isEditing && previewId) {
          setPreviewId(null)
        }
      }
    },
    [isEditing, previewId],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  // Clear preview when switching views
  useEffect(() => {
    setPreviewId(null)
  }, [tableRoute])

  // Auto-migrate: if in default/research mode but workspace has no note-list leaf, apply preset once
  // hasMigrated is set unconditionally on first run so closing the list pane won't re-trigger
  useEffect(() => {
    if (hasMigrated.current) return
    hasMigrated.current = true
    if ((workspaceMode === "default" || workspaceMode === "research") &&
        !findLeafByContentType(workspaceRoot, "note-list")) {
      applyPreset(workspaceMode === "research" ? "research" : "list-editor")
    }
  }, [workspaceMode, workspaceRoot, applyPreset])

  // ── Insights (layout-mode agnostic) ──
  if (viewMode === "insights") {
    return (
      <div className="flex flex-1 overflow-hidden">
        <InsightsView />
      </div>
    )
  }

  // ── Workspace editor area: show when editing in any layout mode ──
  if (isEditing) {
    return (
      <div className="flex flex-1 overflow-hidden animate-in fade-in duration-200">
        <WorkspaceEditorArea />
        <NoteInspector />
      </div>
    )
  }

  // Calendar view
  if (viewMode === "calendar") {
    return (
      <div className="flex flex-1 overflow-hidden">
        <CalendarView
          context={config.context}
          title={config.title}
          hideCreateButton={config.hideCreateButton}
          createNoteOverrides={config.createNoteOverrides}
          folderId={activeFolderId ?? undefined}
          tagId={activeTagId ?? undefined}
          labelId={activeLabelId ?? undefined}
          onRowClick={(noteId) => setPreviewId(noteId)}
          activePreviewId={previewId}
        />
        {previewId && (
          <NoteDetailPanel
            noteId={previewId}
            onClose={() => setPreviewId(null)}
            onOpenNote={(id) => setPreviewId(id)}
            onEditNote={() => {
              openNote(previewId)
              setPreviewId(null)
            }}
          />
        )}
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
        onRowClick={(noteId) => setPreviewId(noteId)}
        activePreviewId={previewId}
      />
      {previewId && (
        <NoteDetailPanel
          noteId={previewId}
          onClose={() => setPreviewId(null)}
          onOpenNote={(id) => setPreviewId(id)}
          onEditNote={() => {
            openNote(previewId)
            setPreviewId(null)
          }}
        />
      )}
    </div>
  )
}
