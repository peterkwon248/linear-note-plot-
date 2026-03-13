"use client"

import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import { EditorTabBar } from "./editor-tab-bar"
import { NoteEditor } from "@/components/note-editor"
import { getNoteDragData, getTabDragData, hasDragData } from "@/lib/drag-helpers"
import type { EditorPanel } from "@/lib/store/types"

interface EditorPanelContainerProps {
  panel: EditorPanel
  isActivePanel: boolean
  onActivatePanel: () => void
}

export function EditorPanelContainer({ panel, isActivePanel, onActivatePanel }: EditorPanelContainerProps) {
  const closeTab = usePlotStore((s) => s.closeTab)
  const openNoteInTab = usePlotStore((s) => s.openNoteInTab)
  const moveTabToPanel = usePlotStore((s) => s.moveTabToPanel)
  const [isDragOver, setIsDragOver] = useState(false)

  const activeTab = panel.tabs.find((t) => t.id === panel.activeTabId)

  const handleClose = () => {
    if (activeTab) {
      closeTab(activeTab.id, panel.id)
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (hasDragData(e)) {
      e.preventDefault()
      e.dataTransfer.dropEffect = "move"
      setIsDragOver(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if leaving the container itself
    const related = e.relatedTarget as HTMLElement | null
    if (!related || !e.currentTarget.contains(related)) {
      setIsDragOver(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    // Handle note drop
    const noteId = getNoteDragData(e)
    if (noteId) {
      openNoteInTab(noteId, panel.id)
      return
    }

    // Handle tab drop (from another panel)
    const tabData = getTabDragData(e)
    if (tabData && tabData.panelId !== panel.id) {
      moveTabToPanel(tabData.tabId, tabData.panelId, panel.id)
    }
  }, [panel.id, openNoteInTab, moveTabToPanel])

  return (
    <div
      className={cn(
        "flex flex-1 flex-col overflow-hidden relative",
        isDragOver && "ring-2 ring-inset ring-primary/50 bg-primary/5"
      )}
      onClick={onActivatePanel}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Only show tab bar when there are tabs */}
      {panel.tabs.length > 0 && (
        <EditorTabBar
          panel={panel}
          isActivePanel={isActivePanel}
          onActivatePanel={onActivatePanel}
        />
      )}

      {/* Editor */}
      {activeTab ? (
        <NoteEditor
          noteId={activeTab.noteId}
          onClose={handleClose}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center text-muted-foreground/40">
          <p className="text-sm">
            {isDragOver ? "Drop note here" : "No open notes"}
          </p>
        </div>
      )}
    </div>
  )
}
