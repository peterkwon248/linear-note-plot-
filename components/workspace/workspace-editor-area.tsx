"use client"

import { usePlotStore } from "@/lib/store"
import { NoteEditor } from "@/components/note-editor"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { EditorPaneHeader } from "@/components/workspace/editor-pane-header"

export function WorkspaceEditorArea() {
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const secondaryNoteId = usePlotStore((s) => s.secondaryNoteId)
  const activePane = usePlotStore((s) => s.activePane)
  const notes = usePlotStore((s) => s.notes)
  const setActivePane = usePlotStore((s) => s.setActivePane)

  const primaryNote = notes.find((n) => n.id === selectedNoteId)
  const secondaryNote = secondaryNoteId ? notes.find((n) => n.id === secondaryNoteId) : null

  if (!primaryNote) return null

  const isDual = !!secondaryNote

  return (
    <ResizablePanelGroup direction="horizontal" className="flex-1">
      <ResizablePanel defaultSize={isDual ? 50 : 100} minSize={30}>
        <div
          className={`flex h-full flex-col overflow-hidden ${activePane === 'primary' ? '' : 'opacity-80'}`}
          onClick={() => setActivePane('primary')}
        >
          <NoteEditor noteId={primaryNote.id} />
        </div>
      </ResizablePanel>
      {isDual && secondaryNote && (
        <>
          <ResizableHandle className="w-px bg-border/50 hover:bg-primary/20 active:bg-primary/30 transition-colors" />
          <ResizablePanel defaultSize={50} minSize={30}>
            <div
              className={`flex h-full flex-col overflow-hidden ${activePane === 'secondary' ? '' : 'opacity-80'}`}
              onClick={() => setActivePane('secondary')}
            >
              <EditorPaneHeader
                noteTitle={secondaryNote.title}
                pane="secondary"
                showClose
              />
              <NoteEditor noteId={secondaryNote.id} />
            </div>
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  )
}
