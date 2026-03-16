"use client"

import { useRef } from "react"
import {
  X, Pin, Plus, GripVertical, SplitSquareHorizontal, ArrowDownFromLine,
  Tag, Calendar, BarChart3, Bookmark, List, Inbox, FolderOpen, FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import { NoteEditor } from "@/components/note-editor"
import type { WorkspaceLeaf, WorkspaceTab, PanelContent } from "@/lib/workspace/types"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { setTabDragData, setLeafDragData } from "@/lib/drag-helpers"
import { countLeaves } from "@/lib/workspace/tree-utils"

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
  const workspaceRoot = usePlotStore((s) => s.workspaceRoot)
  const splitTabToNewLeaf = usePlotStore((s) => s.splitTabToNewLeaf)
  const splitLeaf = usePlotStore((s) => s.splitLeaf)
  const setLeafContent = usePlotStore((s) => s.setLeafContent)
  const folders = usePlotStore((s) => s.folders)
  const scrollRef = useRef<HTMLDivElement>(null)

  const isMultiLeaf = countLeaves(workspaceRoot) > 1

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
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div className={cn(
              "flex h-9 items-center border-b border-border bg-card",
              isActiveLeaf && "bg-card"
            )}>
              {isMultiLeaf && (
                <div
                  draggable
                  onDragStart={(e) => setLeafDragData(e, leaf.id)}
                  className="flex h-9 w-7 shrink-0 cursor-grab items-center justify-center text-muted-foreground/40 hover:text-muted-foreground"
                >
                  <GripVertical className="h-3 w-3" />
                </div>
              )}
              <div
                ref={scrollRef}
                className="flex flex-1 items-center overflow-x-auto scrollbar-hide"
              >
                {leaf.tabs.map((tab) => {
                  const note = notes.find((n) => n.id === tab.noteId)
                  const isActive = tab.id === leaf.activeTabId
                  const title = note?.title || "Untitled"

                  return (
                    <ContextMenu key={tab.id}>
                      <ContextMenuTrigger asChild>
                        <button
                          draggable
                          onDragStart={(e) => setTabDragData(e, tab.id, leaf.id)}
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
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem onSelect={() => splitTabToNewLeaf(tab.id, leaf.id, leaf.id, "horizontal", "after")}>
                          <SplitSquareHorizontal className="mr-2 h-4 w-4" />
                          Split Right
                        </ContextMenuItem>
                        <ContextMenuItem onSelect={() => splitTabToNewLeaf(tab.id, leaf.id, leaf.id, "vertical", "after")}>
                          <ArrowDownFromLine className="mr-2 h-4 w-4" />
                          Split Down
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem onSelect={() => splitLeaf(leaf.id, "horizontal", { type: "tags" }, "after")}>
                          <Tag className="mr-2 h-4 w-4" />
                          Tags Panel
                        </ContextMenuItem>
                        <ContextMenuItem onSelect={() => splitLeaf(leaf.id, "horizontal", { type: "calendar" }, "after")}>
                          <Calendar className="mr-2 h-4 w-4" />
                          Calendar Panel
                        </ContextMenuItem>
                        <ContextMenuItem onSelect={() => splitLeaf(leaf.id, "horizontal", { type: "insights" }, "after")}>
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Insights Panel
                        </ContextMenuItem>
                        {!tab.isPinned && (
                          <>
                            <ContextMenuSeparator />
                            <ContextMenuItem onSelect={() => closeTabInLeaf(tab.id, leaf.id)}>
                              <X className="mr-2 h-4 w-4" />
                              Close Tab
                            </ContextMenuItem>
                          </>
                        )}
                      </ContextMenuContent>
                    </ContextMenu>
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
          </ContextMenuTrigger>
          {/* Tab bar background context menu — switch this leaf to a different view */}
          <ContextMenuContent className="w-48">
            <ContextMenuItem onSelect={() => { const id = createNote({}); openNoteInLeaf(id, leaf.id); setActiveLeaf(leaf.id) }}>
              <FileText className="mr-2 h-4 w-4" />
              New Note
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onSelect={() => setLeafContent(leaf.id, { type: "tags" })}>
              <Tag className="mr-2 h-4 w-4" />
              Tags
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => setLeafContent(leaf.id, { type: "labels" })}>
              <Bookmark className="mr-2 h-4 w-4" />
              Labels
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => setLeafContent(leaf.id, { type: "calendar" })}>
              <Calendar className="mr-2 h-4 w-4" />
              Calendar
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => setLeafContent(leaf.id, { type: "insights" })}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Insights
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <List className="mr-2 h-4 w-4" />
                Note List
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-44">
                <ContextMenuItem
                  onSelect={() => setLeafContent(leaf.id, { type: "note-list", context: "all" })}
                >
                  <List className="mr-2 h-4 w-4" />
                  All Notes
                </ContextMenuItem>
                <ContextMenuItem
                  onSelect={() => setLeafContent(leaf.id, { type: "note-list", context: "inbox" })}
                >
                  <Inbox className="mr-2 h-4 w-4" />
                  Inbox
                </ContextMenuItem>
                {folders.length > 0 && <ContextMenuSeparator />}
                {folders.map((folder) => (
                  <ContextMenuItem
                    key={folder.id}
                    onSelect={() => setLeafContent(leaf.id, { type: "note-list", context: "folder", folderId: folder.id })}
                  >
                    <FolderOpen className="mr-2 h-4 w-4" />
                    <span className="truncate">{folder.name}</span>
                  </ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator />
            <ContextMenuItem onSelect={() => splitLeaf(leaf.id, "horizontal", { type: "editor", noteId: null }, "after")}>
              <SplitSquareHorizontal className="mr-2 h-4 w-4" />
              Split Right
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => splitLeaf(leaf.id, "vertical", { type: "editor", noteId: null }, "after")}>
              <ArrowDownFromLine className="mr-2 h-4 w-4" />
              Split Down
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      )}

      {/* Editor content */}
      <div className="flex flex-1 overflow-hidden min-w-0">
        {activeNote ? (
          <NoteEditor noteId={activeNote.id} />
        ) : (
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <div className="flex flex-1 items-center justify-center text-muted-foreground/50">
                <p className="text-sm">Select a note to start editing</p>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-48">
              <ContextMenuItem onSelect={() => { const id = createNote({}); openNoteInLeaf(id, leaf.id); setActiveLeaf(leaf.id) }}>
                <FileText className="mr-2 h-4 w-4" />
                New Note
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onSelect={() => setLeafContent(leaf.id, { type: "tags" })}>
                <Tag className="mr-2 h-4 w-4" />
                Tags
              </ContextMenuItem>
              <ContextMenuItem onSelect={() => setLeafContent(leaf.id, { type: "labels" })}>
                <Bookmark className="mr-2 h-4 w-4" />
                Labels
              </ContextMenuItem>
              <ContextMenuItem onSelect={() => setLeafContent(leaf.id, { type: "calendar" })}>
                <Calendar className="mr-2 h-4 w-4" />
                Calendar
              </ContextMenuItem>
              <ContextMenuItem onSelect={() => setLeafContent(leaf.id, { type: "insights" })}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Insights
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuSub>
                <ContextMenuSubTrigger>
                  <List className="mr-2 h-4 w-4" />
                  Note List
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-44">
                  <ContextMenuItem
                    onSelect={() => setLeafContent(leaf.id, { type: "note-list", context: "all" })}
                  >
                    <List className="mr-2 h-4 w-4" />
                    All Notes
                  </ContextMenuItem>
                  <ContextMenuItem
                    onSelect={() => setLeafContent(leaf.id, { type: "note-list", context: "inbox" })}
                  >
                    <Inbox className="mr-2 h-4 w-4" />
                    Inbox
                  </ContextMenuItem>
                  {folders.length > 0 && <ContextMenuSeparator />}
                  {folders.map((folder) => (
                    <ContextMenuItem
                      key={folder.id}
                      onSelect={() => setLeafContent(leaf.id, { type: "note-list", context: "folder", folderId: folder.id })}
                    >
                      <FolderOpen className="mr-2 h-4 w-4" />
                      <span className="truncate">{folder.name}</span>
                    </ContextMenuItem>
                  ))}
                </ContextMenuSubContent>
              </ContextMenuSub>
              <ContextMenuSeparator />
              <ContextMenuItem onSelect={() => splitLeaf(leaf.id, "horizontal", { type: "editor", noteId: null }, "after")}>
                <SplitSquareHorizontal className="mr-2 h-4 w-4" />
                Split Right
              </ContextMenuItem>
              <ContextMenuItem onSelect={() => splitLeaf(leaf.id, "vertical", { type: "editor", noteId: null }, "after")}>
                <ArrowDownFromLine className="mr-2 h-4 w-4" />
                Split Down
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        )}
      </div>
    </div>
  )
}
