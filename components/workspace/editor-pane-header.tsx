"use client"

import { usePlotStore } from "@/lib/store"
import type { WorkspaceTab } from "@/lib/workspace/types"
import { cn } from "@/lib/utils"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { SidebarSimple } from "@phosphor-icons/react/dist/ssr/SidebarSimple"

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
  const sidePanelOpen = usePlotStore((s) => s.sidePanelOpen)
  const setSidePanelOpen = usePlotStore((s) => s.setSidePanelOpen)

  // Secondary pane: simple title bar
  if (pane === 'secondary') {
    return (
      <div className="flex h-9 items-center justify-between border-b border-border-subtle bg-card/50 px-3">
        <span className="text-2xs text-muted-foreground truncate">{noteTitle || "Untitled"}</span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); setSidePanelOpen(!sidePanelOpen) }}
            className={cn(
              "rounded-md p-1 transition-colors hover:bg-hover-bg",
              sidePanelOpen ? "text-accent" : "text-muted-foreground/50 hover:text-foreground"
            )}
            title={sidePanelOpen ? "Close side panel" : "Open side panel"}
          >
            <SidebarSimple size={12} weight="regular" />
          </button>
          {showClose && (
            <button
              onClick={(e) => { e.stopPropagation(); closeSecondary() }}
              className="rounded-md p-1 text-muted-foreground/50 hover:text-foreground hover:bg-hover-bg transition-colors"
            >
              <PhX size={12} weight="regular" />
            </button>
          )}
        </div>
      </div>
    )
  }

  // Primary pane: tab bar
  if (!tabs || tabs.length === 0) return null

  return (
    <div className="flex h-9 items-center gap-0 overflow-x-auto border-b border-border-subtle bg-card/50 px-1">
      {tabs.map((tab) => {
        const note = notes.find((n) => n.id === tab.noteId)
        const isActive = tab.id === activeTabId
        return (
          <div
            key={tab.id}
            className={cn(
              "group flex items-center gap-1 shrink-0 px-3 py-1.5 text-2xs cursor-pointer border-r border-border-subtle transition-colors",
              isActive
                ? "text-foreground bg-background"
                : "text-muted-foreground hover:text-foreground hover:bg-hover-bg"
            )}
            onClick={(e) => { e.stopPropagation(); setActiveEditorTab(tab.id) }}
          >
            <span className="truncate max-w-[120px]">{note?.title || "Untitled"}</span>
            {!tab.isPinned && (
              <button
                onClick={(e) => { e.stopPropagation(); closeEditorTab(tab.id) }}
                className="rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-hover-bg transition-opacity"
              >
                <PhX size={10} weight="regular" />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
