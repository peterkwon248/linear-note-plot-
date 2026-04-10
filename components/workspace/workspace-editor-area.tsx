"use client"

import { usePlotStore } from "@/lib/store"
import { useSecondarySpace } from "@/lib/table-route"
import { NoteEditor } from "@/components/note-editor"
import { SecondaryPanelContent } from "@/components/workspace/secondary-panel-content"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"

/**
 * WorkspaceEditorArea — Editor area for the main content slot.
 * Renders [Editor] or [Editor] | [Secondary] for split view.
 *
 * IMPORTANT: This component does NOT render side panels.
 * The side panel is rendered by layout.tsx at the top level so it's a
 * sibling of the entire content area regardless of split state.
 */
export function WorkspaceEditorArea() {
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const secondaryNoteId = usePlotStore((s) => s.secondaryNoteId)
  const activePane = usePlotStore((s) => s.activePane)
  const notes = usePlotStore((s) => s.notes)
  const setActivePane = usePlotStore((s) => s.setActivePane)
  const secondarySpace = useSecondarySpace()

  const primaryNote = notes.find((n) => n.id === selectedNoteId)

  if (!primaryNote) return null

  const hasSecondary = !!secondaryNoteId || !!secondarySpace

  // Active-pane visual indicator: subtle top 2px accent border (only in split mode).
  // Always reserve the border space (transparent when inactive) to avoid layout shift.
  const primaryActiveClass = hasSecondary
    ? `border-t-2 transition-colors duration-150 ${activePane === 'primary' ? 'border-t-accent' : 'border-t-transparent'}`
    : ''
  const secondaryActiveClass = `border-t-2 transition-colors duration-150 ${activePane === 'secondary' ? 'border-t-accent' : 'border-t-transparent'}`

  return (
    <ResizablePanelGroup direction="horizontal" className="flex-1">
      {/* 1. Primary editor */}
      <ResizablePanel
        id="primary-editor"
        order={1}
        defaultSize={hasSecondary ? 50 : 100}
        minSize={20}
      >
        <div
          className={`flex h-full flex-col overflow-hidden ${primaryActiveClass}`}
          onMouseDownCapture={() => { if (activePane !== 'primary') setActivePane('primary') }}
          onFocusCapture={() => { if (activePane !== 'primary') setActivePane('primary') }}
        >
          <NoteEditor noteId={primaryNote.id} pane="primary" />
        </div>
      </ResizablePanel>

      {/* 2. Secondary content (split view) */}
      {hasSecondary && (
        <>
          <ResizableHandle className="w-px bg-border/50 hover:bg-primary/20 active:bg-primary/30 transition-colors" />
          <ResizablePanel id="secondary-content" order={2} defaultSize={50} minSize={20}>
            <div
              className={`flex h-full flex-col overflow-hidden ${secondaryActiveClass}`}
              onMouseDownCapture={() => { if (activePane !== 'secondary') setActivePane('secondary') }}
              onFocusCapture={() => { if (activePane !== 'secondary') setActivePane('secondary') }}
            >
              <SecondaryPanelContent />
            </div>
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  )
}
