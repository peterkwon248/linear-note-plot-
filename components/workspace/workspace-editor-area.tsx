"use client"

import { usePlotStore } from "@/lib/store"
import { useSecondarySpace } from "@/lib/table-route"
import { NoteEditor } from "@/components/note-editor"
import { SecondaryPanelContent } from "@/components/workspace/secondary-panel-content"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"

export function WorkspaceEditorArea() {
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const secondaryNoteId = usePlotStore((s) => s.secondaryNoteId)
  const activePane = usePlotStore((s) => s.activePane)
  const notes = usePlotStore((s) => s.notes)
  const setActivePane = usePlotStore((s) => s.setActivePane)
  const secondarySpace = useSecondarySpace()

  const primaryNote = notes.find((n) => n.id === selectedNoteId)

  if (!primaryNote) return null

  // Secondary panel is active when there's a note OR a space route set
  const hasSecondary = !!secondaryNoteId || !!secondarySpace

  return (
    <ResizablePanelGroup id="workspace-editor" direction="horizontal" className="flex-1">
      <ResizablePanel defaultSize={hasSecondary ? 50 : 100} minSize={30}>
        <div
          className={`flex h-full flex-col overflow-hidden ${activePane === 'primary' ? '' : 'opacity-80'}`}
          onClick={() => setActivePane('primary')}
        >
          <NoteEditor noteId={primaryNote.id} pane="primary" />
        </div>
      </ResizablePanel>
      {hasSecondary && (
        <>
          <ResizableHandle className="w-px bg-border/50 hover:bg-primary/20 active:bg-primary/30 transition-colors" />
          <ResizablePanel defaultSize={50} minSize={30}>
            <div
              className={`flex h-full flex-col overflow-hidden ${activePane === 'secondary' ? '' : 'opacity-80'}`}
              onClick={() => setActivePane('secondary')}
            >
              <SecondaryPanelContent />
            </div>
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  )
}
