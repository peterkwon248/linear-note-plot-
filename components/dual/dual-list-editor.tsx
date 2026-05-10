"use client"

/**
 * DualListEditor — list+editor split-of-main layout (split-mode-prd Phase 1).
 *
 * Renders ResizablePanelGroup with list on the left and editor on the right.
 * Uses `autoSaveId` for ratio persistence (NOT controlled defaultSize) per
 * CRITIC MEDIUM-5 — react-resizable-panels manages its own persistence.
 *
 * Distinct from `NoteSplitOverlay` (`lib/note-split-mode.ts`) — that's a
 * full-screen overlay split feature, this is the main viewport split. See
 * PRD HIGH-1 for naming rationale.
 *
 * Caller wires entity-specific list / editor / emptyState. This component
 * stays entity-agnostic.
 */

import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"
import type { ReactNode } from "react"

interface DualListEditorProps {
  list: ReactNode
  editor: ReactNode | null
  emptyState?: ReactNode
  /**
   * Unique id for autoSaveId persistence — different per entity if needed
   * (e.g. "dual-notes", "dual-wiki"). Default applies to single-entity setups.
   */
  storageId?: string
}

export function DualListEditor({
  list,
  editor,
  emptyState,
  storageId = "dual-list-editor",
}: DualListEditorProps) {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="flex-1"
      autoSaveId={storageId}
    >
      <ResizablePanel
        defaultSize={40}
        minSize={25}
        maxSize={65}
        className="overflow-hidden"
      >
        {list}
      </ResizablePanel>
      <ResizableHandle className="bg-border-subtle/30 hover:bg-accent/40 transition-colors w-px" />
      <ResizablePanel defaultSize={60} className="overflow-hidden">
        {editor ?? emptyState ?? <DefaultEmptyState />}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

function DefaultEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground/70">
      <p className="text-sm font-medium">Nothing selected</p>
      <p className="text-2xs">Select an item from the list or press ↑↓ to navigate.</p>
      <p className="text-2xs opacity-50">⌘⇧E to toggle dual mode</p>
    </div>
  )
}
