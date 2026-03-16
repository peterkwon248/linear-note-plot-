"use client"

import { usePlotStore } from "@/lib/store"
import { WorkspaceRenderer } from "./workspace-renderer"

/**
 * Workspace tree scoped to the editor area only.
 * Workspace tree manages editor tabs, splitting, and drag-drop
 * within the right column.
 */
export function WorkspaceEditorArea() {
  const workspaceRoot = usePlotStore((s) => s.workspaceRoot)

  return (
    <div className="flex flex-1 overflow-hidden min-w-0">
      <WorkspaceRenderer node={workspaceRoot} />
    </div>
  )
}
