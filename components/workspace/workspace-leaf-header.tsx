"use client"

import { useCallback } from "react"
import { X, GripVertical, FileText, List, Tag, Bookmark, Activity, Eye, Calendar, BarChart3, LayoutGrid } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import type { PanelContent } from "@/lib/workspace/types"
import { countLeaves } from "@/lib/workspace/tree-utils"
import { setLeafDragData } from "@/lib/drag-helpers"

interface WorkspaceLeafHeaderProps {
  leafId: string
  content: PanelContent
}

const CONTENT_META: Record<PanelContent["type"], { icon: typeof FileText; label: string }> = {
  "editor": { icon: FileText, label: "Editor" },
  "note-list": { icon: List, label: "Notes" },
  "tags": { icon: Tag, label: "Tags" },
  "labels": { icon: Bookmark, label: "Labels" },
  "activity": { icon: Activity, label: "Activity" },
  "inspector": { icon: Eye, label: "Inspector" },
  "calendar": { icon: Calendar, label: "Calendar" },
  "insights": { icon: BarChart3, label: "Insights" },
  "empty": { icon: LayoutGrid, label: "Empty" },
}

export function WorkspaceLeafHeader({ leafId, content }: WorkspaceLeafHeaderProps) {
  const closeLeaf = usePlotStore((s) => s.closeLeaf)
  const workspaceRoot = usePlotStore((s) => s.workspaceRoot)

  const handleDragStart = useCallback((e: React.DragEvent) => {
    setLeafDragData(e, leafId)
  }, [leafId])

  // Don't show header for editor (it has its own tab bar)
  if (content.type === "editor") return null

  const canClose = countLeaves(workspaceRoot) > 1
  const meta = CONTENT_META[content.type]
  const Icon = meta.icon

  return (
    <div
      className="flex h-9 shrink-0 items-center gap-1.5 border-b border-border bg-card px-2"
      draggable
      onDragStart={handleDragStart}
    >
      <GripVertical className="h-3 w-3 shrink-0 text-muted-foreground/50 cursor-grab" />
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="flex-1 truncate text-[12px] font-medium text-muted-foreground">
        {meta.label}
      </span>
      {canClose && (
        <button
          onClick={() => closeLeaf(leafId)}
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded",
            "text-muted-foreground/60 transition-colors hover:bg-secondary hover:text-foreground"
          )}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}
