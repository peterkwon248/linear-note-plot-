"use client"

import { useRef } from "react"
import { X, Pin, Columns2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import type { EditorPanel, EditorState } from "@/lib/store/types"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface EditorTabBarProps {
  panel: EditorPanel
  isActivePanel: boolean
  onActivatePanel: () => void
}

export function EditorTabBar({ panel, isActivePanel, onActivatePanel }: EditorTabBarProps) {
  const notes = usePlotStore((s) => s.notes)
  const closeTab = usePlotStore((s) => s.closeTab)
  const setActiveTab = usePlotStore((s) => s.setActiveTab)
  const toggleSplit = usePlotStore((s) => s.toggleSplit)
  const splitMode = usePlotStore((s) => (s.editorState as EditorState).splitMode)
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div
      className="flex h-9 items-center border-b border-border bg-card"
      onClick={onActivatePanel}
    >
      <div
        ref={scrollRef}
        className="flex flex-1 items-center overflow-x-auto scrollbar-hide"
      >
        {panel.tabs.map((tab) => {
          const note = notes.find((n) => n.id === tab.noteId)
          const isActive = tab.id === panel.activeTabId
          const title = note?.title || "Untitled"

          return (
            <button
              key={tab.id}
              className={cn(
                "group relative flex h-9 shrink-0 items-center gap-1.5 border-r border-border px-3 text-[13px] transition-colors",
                tab.isPinned ? "w-9 justify-center px-0" : "max-w-[160px]",
                isActive
                  ? "bg-background text-foreground"
                  : "bg-card text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
              onClick={(e) => {
                e.stopPropagation()
                setActiveTab(tab.id, panel.id)
                onActivatePanel()
              }}
              onMouseDown={(e) => {
                // Middle-click to close
                if (e.button === 1 && !tab.isPinned) {
                  e.preventDefault()
                  closeTab(tab.id, panel.id)
                }
              }}
            >
              {/* Active indicator line */}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />
              )}

              {tab.isPinned ? (
                <Pin className="h-3 w-3 shrink-0" />
              ) : (
                <>
                  <span className="truncate">{title}</span>
                  <span
                    className="ml-auto shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:bg-secondary group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      closeTab(tab.id, panel.id)
                    }}
                  >
                    <X className="h-3 w-3" />
                  </span>
                </>
              )}
            </button>
          )
        })}
      </div>

      {/* Split view toggle */}
      {panel.id === "panel-left" && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className={cn(
                "mx-1 flex h-7 w-7 shrink-0 items-center justify-center rounded transition-colors",
                splitMode
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
              onClick={(e) => {
                e.stopPropagation()
                toggleSplit()
              }}
            >
              <Columns2 className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="text-[12px]">
            {splitMode ? "Close split view" : "Split editor"} <kbd className="ml-1 rounded bg-secondary px-1 py-0.5 text-[10px]">Ctrl+\</kbd>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
