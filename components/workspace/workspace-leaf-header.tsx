"use client"

import { useCallback, useState } from "react"
import {
  X, GripVertical, FileText, List, Tag, Bookmark,
  Eye, Calendar, BarChart3, LayoutGrid, Inbox, FolderOpen,
  SplitSquareHorizontal, ArrowDownFromLine, Network, LayoutTemplate,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import type { PanelContent } from "@/lib/workspace/types"
import { countLeaves } from "@/lib/workspace/tree-utils"
import { setLeafDragData } from "@/lib/drag-helpers"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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

interface WorkspaceLeafHeaderProps {
  leafId: string
  content: PanelContent
}

const CONTENT_META: Record<PanelContent["type"], { icon: typeof FileText; label: string }> = {
  "editor": { icon: FileText, label: "Editor" },
  "note-list": { icon: List, label: "Notes" },
  "tags": { icon: Tag, label: "Tags" },
  "labels": { icon: Bookmark, label: "Labels" },
  "inspector": { icon: Eye, label: "Inspector" },
  "calendar": { icon: Calendar, label: "Calendar" },
  "insights": { icon: BarChart3, label: "Insights" },
  "ontology": { icon: Network, label: "Ontology" },
  "templates": { icon: LayoutTemplate, label: "Templates" },
  "empty": { icon: LayoutGrid, label: "Empty" },
}

/** All content types available in the quick-switch popover */
const ALL_CONTENT_OPTIONS: { type: PanelContent["type"]; icon: typeof FileText; label: string; content: PanelContent }[] = [
  { type: "editor", icon: FileText, label: "Editor", content: { type: "editor", noteId: null } },
  { type: "note-list", icon: List, label: "All Notes", content: { type: "note-list", context: "all" } },
  { type: "tags", icon: Tag, label: "Tags", content: { type: "tags" } },
  { type: "labels", icon: Bookmark, label: "Labels", content: { type: "labels" } },
  { type: "calendar", icon: Calendar, label: "Calendar", content: { type: "calendar" } },
  { type: "insights", icon: BarChart3, label: "Insights", content: { type: "insights" } },
  { type: "ontology", icon: Network, label: "Ontology", content: { type: "ontology" } },
  { type: "templates", icon: LayoutTemplate, label: "Templates", content: { type: "templates" } },
  { type: "inspector", icon: Eye, label: "Inspector", content: { type: "inspector", noteId: "", followActive: true } },
]

/** Quick-switch views (non-note-list) for context menu */
const SWITCHABLE_VIEWS: { type: PanelContent["type"]; icon: typeof FileText; label: string }[] = [
  { type: "tags", icon: Tag, label: "Tags" },
  { type: "labels", icon: Bookmark, label: "Labels" },
  { type: "calendar", icon: Calendar, label: "Calendar" },
  { type: "insights", icon: BarChart3, label: "Insights" },
  { type: "ontology", icon: Network, label: "Ontology" },
  { type: "templates", icon: LayoutTemplate, label: "Templates" },
]

export function WorkspaceLeafHeader({ leafId, content }: WorkspaceLeafHeaderProps) {
  const closeLeaf = usePlotStore((s) => s.closeLeaf)
  const setLeafContent = usePlotStore((s) => s.setLeafContent)
  const splitLeaf = usePlotStore((s) => s.splitLeaf)
  const workspaceRoot = usePlotStore((s) => s.workspaceRoot)
  const folders = usePlotStore((s) => s.folders)
  const [pickerOpen, setPickerOpen] = useState(false)

  const handleDragStart = useCallback((e: React.DragEvent) => {
    setLeafDragData(e, leafId)
  }, [leafId])

  const handleSwitchView = useCallback((newContent: PanelContent) => {
    setLeafContent(leafId, newContent)
  }, [leafId, setLeafContent])

  // Don't show header for editor (it has its own tab bar)
  if (content.type === "editor") return null

  const canClose = countLeaves(workspaceRoot) > 1
  const meta = CONTENT_META[content.type]
  const Icon = meta.icon

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className="flex h-10 shrink-0 items-center gap-1.5 border-b border-border bg-card px-2.5"
          draggable
          onDragStart={handleDragStart}
        >
          <GripVertical className="h-3 w-3 shrink-0 text-muted-foreground/50 cursor-grab" />

          {/* Click to open content picker popover */}
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <button
                className="flex items-center gap-1.5 min-w-0 rounded px-1 -mx-1 hover:bg-secondary/60 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  setPickerOpen(true)
                }}
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate text-[15px] font-medium text-muted-foreground text-left">
                  {meta.label}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-44 p-1"
              sideOffset={4}
              onClick={(e) => e.stopPropagation()}
            >
              {ALL_CONTENT_OPTIONS.map((opt) => {
                const OptIcon = opt.icon
                const isCurrent = content.type === opt.type
                return (
                  <button
                    key={opt.type}
                    disabled={isCurrent}
                    onClick={() => {
                      handleSwitchView(opt.content)
                      setPickerOpen(false)
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                      isCurrent
                        ? "bg-secondary/80 text-foreground"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                    )}
                  >
                    <OptIcon className="h-3.5 w-3.5 shrink-0" />
                    <span className="font-medium">{opt.label}</span>
                    {isCurrent && <span className="ml-auto text-[10px] text-muted-foreground/60">Current</span>}
                  </button>
                )
              })}
            </PopoverContent>
          </Popover>

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
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {/* Switch to editor */}
        <ContextMenuItem
          onSelect={() => handleSwitchView({ type: "editor", noteId: null })}
        >
          <FileText className="mr-2 h-4 w-4" />
          Editor
        </ContextMenuItem>
        <ContextMenuSeparator />
        {/* Switch to view */}
        {SWITCHABLE_VIEWS.map((view) => {
          const ViewIcon = view.icon
          const isCurrent = content.type === view.type
          return (
            <ContextMenuItem
              key={view.type}
              disabled={isCurrent}
              onSelect={() => handleSwitchView({ type: view.type } as PanelContent)}
            >
              <ViewIcon className="mr-2 h-4 w-4" />
              {view.label}
              {isCurrent && <span className="ml-auto text-[10px] text-muted-foreground">Current</span>}
            </ContextMenuItem>
          )
        })}
        <ContextMenuSeparator />
        {/* Note Lists sub-menu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <List className="mr-2 h-4 w-4" />
            Note List
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-44">
            <ContextMenuItem
              onSelect={() => handleSwitchView({ type: "note-list", context: "all" })}
            >
              <List className="mr-2 h-4 w-4" />
              All Notes
            </ContextMenuItem>
            <ContextMenuItem
              onSelect={() => handleSwitchView({ type: "note-list", context: "inbox" })}
            >
              <Inbox className="mr-2 h-4 w-4" />
              Inbox
            </ContextMenuItem>
            {folders.length > 0 && <ContextMenuSeparator />}
            {folders.map((folder) => (
              <ContextMenuItem
                key={folder.id}
                onSelect={() => handleSwitchView({ type: "note-list", context: "folder", folderId: folder.id })}
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                <span className="truncate">{folder.name}</span>
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
        {/* Split options */}
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => splitLeaf(leafId, "horizontal", { type: "editor", noteId: null }, "after")}>
          <SplitSquareHorizontal className="mr-2 h-4 w-4" />
          Split Right
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => splitLeaf(leafId, "vertical", { type: "editor", noteId: null }, "after")}>
          <ArrowDownFromLine className="mr-2 h-4 w-4" />
          Split Down
        </ContextMenuItem>
        {/* Close */}
        {canClose && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onSelect={() => closeLeaf(leafId)}>
              <X className="mr-2 h-4 w-4" />
              Close Panel
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}
