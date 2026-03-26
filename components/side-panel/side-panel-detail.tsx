"use client"

import { useActiveSpace } from "@/lib/table-route"
import { SidePanelContext } from "./side-panel-context"

/**
 * Entity-aware detail panel that renders appropriate detail content
 * based on the active space. For now, Notes/Inbox/Wiki/Calendar all show
 * the existing NoteDetailPanel (SidePanelContext). Graph shows a placeholder.
 * Future: each space will have its own detail component.
 */
export function SidePanelDetail() {
  const activeSpace = useActiveSpace()

  switch (activeSpace) {
    case "ontology":
      return <GraphDetailPlaceholder />
    default:
      return <SidePanelContext />
  }
}

function GraphDetailPlaceholder() {
  return (
    <div className="flex flex-1 items-center justify-center p-4 text-muted-foreground text-note">
      Select a node to see details
    </div>
  )
}
