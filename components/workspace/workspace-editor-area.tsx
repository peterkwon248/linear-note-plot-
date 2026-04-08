"use client"

import { usePlotStore } from "@/lib/store"
import { useSecondarySpace } from "@/lib/table-route"
import { NoteEditor } from "@/components/note-editor"
import { SecondaryPanelContent } from "@/components/workspace/secondary-panel-content"
import { SmartSidePanel } from "@/components/side-panel/smart-side-panel"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"

export function WorkspaceEditorArea() {
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const secondaryNoteId = usePlotStore((s) => s.secondaryNoteId)
  const activePane = usePlotStore((s) => s.activePane)
  const notes = usePlotStore((s) => s.notes)
  const setActivePane = usePlotStore((s) => s.setActivePane)
  const secondarySpace = useSecondarySpace()
  const sidePanelOpen = usePlotStore((s) => s.sidePanelOpen)
  const sidePanelMode = usePlotStore((s) => s.sidePanelMode)
  const sidePanelPeekNoteId = usePlotStore((s) => s.sidePanelPeekNoteId)
  const secondarySidePanelOpen = usePlotStore((s) => s.secondarySidePanelOpen)

  const primaryNote = notes.find((n) => n.id === selectedNoteId)

  if (!primaryNote) return null

  const hasSecondary = !!secondaryNoteId || !!secondarySpace
  const primarySidePanelVisible = sidePanelOpen && (sidePanelMode === 'detail' || sidePanelMode === 'connections' || sidePanelMode === 'activity' || sidePanelMode === 'bookmarks' || (sidePanelMode === 'peek' && !!sidePanelPeekNoteId))

  return (
    <ResizablePanelGroup id="workspace-editor" direction="horizontal" className="flex-1">
      {/* 1. Primary editor — 70:30 ratio with side panel */}
      <ResizablePanel defaultSize={hasSecondary ? (primarySidePanelVisible ? 35 : 50) : (primarySidePanelVisible ? 70 : 100)} minSize={20}>
        <div
          className={`flex h-full flex-col overflow-hidden ${activePane === 'primary' ? '' : 'opacity-80'}`}
          onClick={() => setActivePane('primary')}
        >
          <NoteEditor noteId={primaryNote.id} pane="primary" />
        </div>
      </ResizablePanel>

      {/* 2. Primary side panel */}
      {primarySidePanelVisible && (
        <>
          <ResizableHandle className="w-px bg-border/50 hover:bg-primary/20 active:bg-primary/30 transition-colors" />
          <ResizablePanel defaultSize={hasSecondary ? 15 : 30} minSize={10} maxSize={40}>
            <SmartSidePanel pane="primary" />
          </ResizablePanel>
        </>
      )}

      {/* 3. Secondary content */}
      {hasSecondary && (
        <>
          <ResizableHandle className="w-px bg-border/50 hover:bg-primary/20 active:bg-primary/30 transition-colors" />
          <ResizablePanel defaultSize={secondarySidePanelOpen ? 35 : 50} minSize={20}>
            <div
              className={`flex h-full flex-col overflow-hidden ${activePane === 'secondary' ? '' : 'opacity-80'}`}
              onClick={() => setActivePane('secondary')}
            >
              <SecondaryPanelContent />
            </div>
          </ResizablePanel>
        </>
      )}

      {/* 4. Secondary side panel */}
      {hasSecondary && secondarySidePanelOpen && (
        <>
          <ResizableHandle className="w-px bg-border/50 hover:bg-primary/20 active:bg-primary/30 transition-colors" />
          <ResizablePanel defaultSize={15} minSize={10} maxSize={40}>
            <SmartSidePanel pane="secondary" />
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  )
}
