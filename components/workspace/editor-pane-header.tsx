"use client"

import { X } from "lucide-react"
import { usePlotStore } from "@/lib/store"
import type { WorkspaceTab } from "@/lib/workspace/types"
import { cn } from "@/lib/utils"

interface EditorPaneHeaderProps {
  tabs?: WorkspaceTab[]
  activeTabId?: string | null
  noteTitle?: string
  pane: 'primary' | 'secondary'
  showClose?: boolean
}

export function EditorPaneHeader({ tabs, activeTabId, noteTitle, pane, showClose }: EditorPaneHeaderProps) {
  const notes = usePlotStore((s) => s.notes)
  const setActiveEditorTab = usePlotStore((s) => s.setActiveEditorTab)
  const closeEditorTab = usePlotStore((s) => s.closeEditorTab)
  const closeSecondary = usePlotStore((s) => s.closeSecondary)

  // Secondary pane: simple title bar
  if (pane === 'secondary') {
    return (
      <div className="flex h-9 items-center justify-between border-b border-border/50 bg-card/50 px-3">
        <span className="text-xs text-muted-foreground truncate">{noteTitle || "Untitled"}</span>
        {showClose && (
          <button
            onClick={(e) => { e.stopPropagation(); closeSecondary() }}
            className="rounded-md p-1 text-muted-foreground/50 hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <X className="h-3 w-3" strokeWidth={1.5} />
          </button>
        )}
      </div>
    )
  }

  // Primary pane: tab bar
  if (!tabs || tabs.length === 0) return null

  return (
    <div className="flex h-9 items-center gap-0 overflow-x-auto border-b border-border/50 bg-card/50 px-1">
      {tabs.map((tab) => {
        const note = notes.find((n) => n.id === tab.noteId)
        const isActive = tab.id === activeTabId
        return (
          <div
            key={tab.id}
            className={cn(
              "group flex items-center gap-1 shrink-0 px-3 py-1.5 text-xs cursor-pointer border-r border-border/30 transition-colors",
              isActive
                ? "text-foreground bg-background"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
            )}
            onClick={(e) => { e.stopPropagation(); setActiveEditorTab(tab.id) }}
          >
            <span className="truncate max-w-[120px]">{note?.title || "Untitled"}</span>
            {!tab.isPinned && (
              <button
                onClick={(e) => { e.stopPropagation(); closeEditorTab(tab.id) }}
                className="rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-secondary/50 transition-opacity"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
