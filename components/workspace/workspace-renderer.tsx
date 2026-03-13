"use client"

import type { WorkspaceNode } from "@/lib/workspace/types"
import { isLeaf } from "@/lib/workspace/types"
import { WorkspaceSplitContainer } from "./workspace-split-container"
import { WorkspaceLeafPanel } from "./workspace-leaf-panel"

interface WorkspaceRendererProps {
  node: WorkspaceNode
}

export function WorkspaceRenderer({ node }: WorkspaceRendererProps) {
  if (isLeaf(node)) {
    return <WorkspaceLeafPanel leaf={node} />
  }

  return <WorkspaceSplitContainer branch={node} />
}
