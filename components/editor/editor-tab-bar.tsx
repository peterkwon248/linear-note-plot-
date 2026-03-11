"use client"

import { useRef } from "react"
import { X, Pin } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import type { EditorPanel } from "@/lib/store/types"

interface EditorTabBarProps {
  panel: EditorPanel
  isActivePanel: boolean
  onActivatePanel: () => void
}

export function EditorTabBar({ panel, isActivePanel, onActivatePanel }: EditorTabBarProps) {
  const notes = usePlotStore((s) => s.notes)
  const closeTab = usePlotStore((s) => s.closeTab)
  const setActiveTab = usePlotStore((s) => s.setActiveTab)
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
    </div>
  )
}
