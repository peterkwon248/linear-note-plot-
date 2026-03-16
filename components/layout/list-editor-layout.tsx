"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import { NoteInspector } from "@/components/note-inspector"
import { NoteEditor } from "@/components/note-editor"
import { WorkspaceEditorArea } from "@/components/workspace/workspace-editor-area"
import { NotesTable } from "@/components/notes-table"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import type { ViewContextKey } from "@/lib/view-engine/types"
import type { Note } from "@/lib/types"

const MIN_LIST_WIDTH = 280
const MAX_LIST_WIDTH = 800
const DEFAULT_LIST_WIDTH = 360

interface ListEditorLayoutProps {
  context?: ViewContextKey
  title?: string
  showTabs?: boolean
  hideCreateButton?: boolean
  createNoteOverrides?: Partial<Note>
  folderId?: string
  tagId?: string
  labelId?: string
  initialTab?: ViewContextKey
  onTabChange?: (tab: ViewContextKey) => void
  /** Replace the default list with custom content (e.g., TagsView) */
  listContent?: React.ReactNode
}

export function ListEditorLayout({
  context,
  title,
  showTabs,
  hideCreateButton,
  createNoteOverrides,
  folderId,
  tagId,
  labelId,
  initialTab,
  onTabChange,
  listContent,
}: ListEditorLayoutProps) {
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const openNote = usePlotStore((s) => s.openNote)
  const createNote = usePlotStore((s) => s.createNote)
  const detailsOpen = usePlotStore((s) => s.detailsOpen)
  const containerRef = useRef<HTMLDivElement>(null)
  const [listWidth, setListWidth] = useState(DEFAULT_LIST_WIDTH)
  const [isDragging, setIsDragging] = useState(false)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const newWidth = Math.max(MIN_LIST_WIDTH, Math.min(MAX_LIST_WIDTH, e.clientX - rect.left))
      setListWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging])

  const isEditing = selectedNoteId !== null

  return (
    <div
      ref={containerRef}
      className="flex flex-1 overflow-hidden"
      style={{ cursor: isDragging ? "col-resize" : undefined }}
    >
      {/* List Pane — resizable, uses NotesTable (responsive) */}
      <div
        className="flex flex-col overflow-hidden shrink-0 border-r border-border"
        style={{ width: listWidth }}
      >
        {listContent ?? (
          <NotesTable
            context={context}
            title={title}
            showTabs={showTabs}
            hideCreateButton={hideCreateButton}
            createNoteOverrides={createNoteOverrides}
            folderId={folderId}
            tagId={tagId}
            labelId={labelId}
            initialTab={initialTab}
            onTabChange={onTabChange}
            onRowClick={(noteId) => openNote(noteId)}
            activePreviewId={selectedNoteId}
          />
        )}
      </div>

      {/* Resize Divider */}
      <div
        className="group relative flex w-0 cursor-col-resize items-center justify-center"
        onMouseDown={handleMouseDown}
      >
        <div
          className={cn(
            "absolute inset-y-0 -left-px w-[3px] transition-colors z-10",
            isDragging ? "bg-primary" : "bg-transparent group-hover:bg-primary/50"
          )}
        />
      </div>

      {/* Editor Area */}
      <div className="flex flex-1 overflow-hidden min-w-0">
        {listContent ? (
          /* Custom list (Tags/Labels): render NoteEditor directly, skip workspace tree */
          selectedNoteId ? (
            <NoteEditor noteId={selectedNoteId} />
          ) : (
            <ContextMenu>
              <ContextMenuTrigger asChild>
                <div className="flex flex-1 items-center justify-center text-muted-foreground/30">
                  <p className="text-sm">Select a note to start editing</p>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-48">
                <ContextMenuItem onSelect={() => {
                  const id = createNote({})
                  openNote(id)
                }}>
                  <FileText className="mr-2 h-4 w-4" />
                  New Note
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          )
        ) : (
          /* Default (Notes): use full workspace tree */
          <WorkspaceEditorArea />
        )}
        {isEditing && detailsOpen && <NoteInspector />}
      </div>
    </div>
  )
}
