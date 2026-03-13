"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import { EditorSplitView } from "@/components/editor/editor-split-view"
import { NoteInspector } from "@/components/note-inspector"
import { CompactNoteList } from "./compact-note-list"
import type { ViewContextKey } from "@/lib/view-engine/types"
import type { Note } from "@/lib/types"

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
}: ListEditorLayoutProps) {
  const listPaneWidth = usePlotStore((s) => s.listPaneWidth)
  const setListPaneWidth = usePlotStore((s) => s.setListPaneWidth)
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const openNote = usePlotStore((s) => s.openNote)
  const detailsOpen = usePlotStore((s) => s.detailsOpen)
  const containerRef = useRef<HTMLDivElement>(null)
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
      const newWidth = e.clientX - rect.left
      setListPaneWidth(newWidth)
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
  }, [isDragging, setListPaneWidth])

  const isEditing = selectedNoteId !== null

  return (
    <div
      ref={containerRef}
      className="flex flex-1 overflow-hidden"
      style={{ cursor: isDragging ? "col-resize" : undefined }}
    >
      {/* Note List Pane */}
      <div
        className="flex flex-col overflow-hidden shrink-0 border-r border-border"
        style={{ width: listPaneWidth }}
      >
        <CompactNoteList
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
          onNoteClick={(noteId) => openNote(noteId)}
          activeNoteId={selectedNoteId}
        />
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
        {isEditing ? (
          <>
            <EditorSplitView />
            {detailsOpen && <NoteInspector />}
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground/50">
            <p className="text-sm">Select a note to start editing</p>
          </div>
        )}
      </div>
    </div>
  )
}
