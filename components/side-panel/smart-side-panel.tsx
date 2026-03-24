"use client"

import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import { SidePanelContext } from "./side-panel-context"
import { SidePanelPeek } from "./side-panel-peek"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { SidebarSimple } from "@phosphor-icons/react/dist/ssr/SidebarSimple"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"

export function SmartSidePanel() {
  const sidePanelOpen = usePlotStore((s) => s.sidePanelOpen)
  const sidePanelMode = usePlotStore((s) => s.sidePanelMode)
  const sidePanelPeekNoteId = usePlotStore((s) => s.sidePanelPeekNoteId)
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const setSidePanelOpen = usePlotStore((s) => s.setSidePanelOpen)
  const closeSidePeek = usePlotStore((s) => s.closeSidePeek)

  // Don't render content when closed (but the ResizablePanel wrapper handles collapse)
  if (!sidePanelOpen) return null

  // Context mode needs a selected note
  const showContext = sidePanelMode === 'context' && !!selectedNoteId
  // Peek mode needs a peek note
  const showPeek = sidePanelMode === 'peek' && !!sidePanelPeekNoteId

  // Nothing to show
  if (!showContext && !showPeek) return null

  // Header tabs - only show Peek tab when there's a peek note
  const hasPeekNote = !!sidePanelPeekNoteId

  return (
    <aside className="flex h-full flex-col overflow-hidden bg-card">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-1">
          {/* Context tab - only when editing a note */}
          {!!selectedNoteId && (
            <button
              onClick={() => usePlotStore.getState().closeSidePeek()} // returns to context if selectedNoteId exists
              className={cn(
                "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                sidePanelMode === 'context'
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <SidebarSimple className="inline mr-1" size={14} weight="regular" />
              Details
            </button>
          )}
          {/* Peek tab - only when peek note exists */}
          {hasPeekNote && (
            <button
              onClick={() => usePlotStore.setState({ sidePanelMode: 'peek' })}
              className={cn(
                "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                sidePanelMode === 'peek'
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <FileText className="inline mr-1" size={14} weight="regular" />
              Peek
            </button>
          )}
        </div>
        <button
          onClick={() => {
            if (sidePanelMode === 'peek') {
              closeSidePeek()
            } else {
              setSidePanelOpen(false)
            }
          }}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Close panel"
        >
          <PhX size={14} weight="regular" />
        </button>
      </header>

      {/* Content */}
      {showContext && <SidePanelContext />}
      {showPeek && <SidePanelPeek />}
    </aside>
  )
}
