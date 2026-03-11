"use client"

import { usePlotStore } from "@/lib/store"
import { EditorTabBar } from "./editor-tab-bar"
import { NoteEditor } from "@/components/note-editor"
import type { EditorPanel } from "@/lib/store/types"

interface EditorPanelContainerProps {
  panel: EditorPanel
  isActivePanel: boolean
  onActivatePanel: () => void
}

export function EditorPanelContainer({ panel, isActivePanel, onActivatePanel }: EditorPanelContainerProps) {
  const closeTab = usePlotStore((s) => s.closeTab)
  const activeTab = panel.tabs.find((t) => t.id === panel.activeTabId)

  const handleClose = () => {
    if (activeTab) {
      closeTab(activeTab.id, panel.id)
    }
  }

  return (
    <div
      className="flex flex-1 flex-col overflow-hidden"
      onClick={onActivatePanel}
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
          <p className="text-sm">No open notes</p>
        </div>
      )}
    </div>
  )
}
