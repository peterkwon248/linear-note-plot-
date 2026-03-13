"use client"

import { useRef } from "react"
import { X, Pin, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import { NoteEditor } from "@/components/note-editor"
import type { WorkspaceLeaf, WorkspaceTab } from "@/lib/workspace/types"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface WorkspaceEditorLeafProps {
  leaf: WorkspaceLeaf
}

export function WorkspaceEditorLeaf({ leaf }: WorkspaceEditorLeafProps) {
  const notes = usePlotStore((s) => s.notes)
  const createNote = usePlotStore((s) => s.createNote)
  const setActiveTabInLeaf = usePlotStore((s) => s.setActiveTabInLeaf)
  const closeTabInLeaf = usePlotStore((s) => s.closeTabInLeaf)
  const openNoteInLeaf = usePlotStore((s) => s.openNoteInLeaf)
  const setActiveLeaf = usePlotStore((s) => s.setActiveLeaf)
  const activeLeafId = usePlotStore((s) => s.activeLeafId)
  const scrollRef = useRef<HTMLDivElement>(null)

  const isActiveLeaf = activeLeafId === leaf.id
  const activeTab = leaf.tabs.find((t) => t.id === leaf.activeTabId)
  const activeNote = activeTab ? notes.find((n) => n.id === activeTab.noteId) : null

  const handleTabClick = (tabId: string) => {
    setActiveLeaf(leaf.id)
    setActiveTabInLeaf(tabId, leaf.id)
  }

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation()
    closeTabInLeaf(tabId, leaf.id)
  }

  const handleAddTab = (e: React.MouseEvent) => {
    e.stopPropagation()
    const noteId = createNote({})
    openNoteInLeaf(noteId, leaf.id)
    setActiveLeaf(leaf.id)
  }

  const hasTabs = leaf.tabs.length > 0

  return (
    <div
      className="flex flex-1 flex-col overflow-hidden"
      onClick={() => setActiveLeaf(leaf.id)}
    >
      {/* Tab bar */}
      {hasTabs && (
        <div className={cn(
          "flex h-9 items-center border-b border-border bg-card",
          isActiveLeaf && "bg-card"
        )}>
          <div
            ref={scrollRef}
            className="flex flex-1 items-center overflow-x-auto scrollbar-hide"
          >
            {leaf.tabs.map((tab) => {
              const note = notes.find((n) => n.id === tab.noteId)
              const isActive = tab.id === leaf.activeTabId
              const title = note?.title || "Untitled"

              return (
                <button
                  key={tab.id}
                  className={cn(
                    "group relative flex h-9 shrink-0 items-center gap-1.5 border-r border-border/60 px-3 text-[13px] transition-colors",
                    tab.isPinned ? "w-9 justify-center px-0" : "max-w-[180px]",
                    isActive
                      ? "bg-background text-foreground"
                      : "bg-card text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                  )}
                  onClick={() => handleTabClick(tab.id)}
                  onMouseDown={(e) => {
                    if (e.button === 1 && !tab.isPinned) {
                      e.preventDefault()
                      closeTabInLeaf(tab.id, leaf.id)
                    }
                  }}
                >
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />
                  )}
                  {tab.isPinned ? (
                    <Pin className="h-3 w-3 shrink-0" />
                  ) : (
                    <>
                      <span className="truncate text-[12px]">{title}</span>
                      <span
                        className="ml-auto shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:bg-secondary group-hover:opacity-100"
                        onClick={(e) => handleCloseTab(e, tab.id)}
                      >
                        <X className="h-3 w-3" />
                      </span>
                    </>
                  )}
                </button>
              )
            })}

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="flex h-9 w-8 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-secondary/40 hover:text-foreground"
                  onClick={handleAddTab}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="text-[12px]">New note</TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}

      {/* Editor content */}
      <div className="flex flex-1 overflow-hidden min-w-0">
        {activeNote ? (
          <NoteEditor noteId={activeNote.id} />
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground/50">
            <p className="text-sm">Select a note to start editing</p>
          </div>
        )}
      </div>
    </div>
  )
}
