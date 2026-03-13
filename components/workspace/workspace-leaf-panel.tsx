"use client"

import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import type { WorkspaceLeaf } from "@/lib/workspace/types"
import { WorkspaceLeafHeader } from "./workspace-leaf-header"
import { WorkspaceViewDispatch } from "./workspace-view-dispatch"
import { WorkspaceDropZone } from "./workspace-drop-zone"

interface WorkspaceLeafPanelProps {
  leaf: WorkspaceLeaf
}

export function WorkspaceLeafPanel({ leaf }: WorkspaceLeafPanelProps) {
  const activeLeafId = usePlotStore((s) => s.activeLeafId)
  const setActiveLeaf = usePlotStore((s) => s.setActiveLeaf)
  const isActive = activeLeafId === leaf.id

  return (
    <div
      className={cn(
        "flex flex-1 flex-col overflow-hidden",
        isActive && "ring-1 ring-primary/20"
      )}
      onClick={() => setActiveLeaf(leaf.id)}
    >
      <WorkspaceLeafHeader leafId={leaf.id} content={leaf.content} />
      <WorkspaceDropZone leafId={leaf.id}>
        <WorkspaceViewDispatch leaf={leaf} />
      </WorkspaceDropZone>
    </div>
  )
}
