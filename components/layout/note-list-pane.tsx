"use client"

import { usePlotStore } from "@/lib/store"
import { useSettingsStore } from "@/lib/settings-store"
import { NotesTable } from "@/components/notes-table"
import { NotesBoard } from "@/components/notes-board"
import { CalendarView } from "@/components/calendar-view"
import type { ViewContextKey } from "@/lib/view-engine/types"
import type { Note } from "@/lib/types"

interface NoteListPaneProps {
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
  onNoteClick?: (noteId: string) => void
  activePreviewId?: string | null
}

export function NoteListPane({
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
  onNoteClick,
  activePreviewId,
}: NoteListPaneProps) {
  const openNote = usePlotStore((s) => s.openNote)
  const viewMode = useSettingsStore((s) => s.viewMode)

  const handleRowClick = (noteId: string) => {
    if (onNoteClick) {
      onNoteClick(noteId)
    } else {
      openNote(noteId)
    }
  }

  if (viewMode === "calendar") {
    return (
      <CalendarView
        context={context}
        title={title}
        showTabs={showTabs}
        hideCreateButton={hideCreateButton}
        createNoteOverrides={createNoteOverrides}
        folderId={folderId}
        tagId={tagId}
        labelId={labelId}
        onRowClick={handleRowClick}
        activePreviewId={activePreviewId}
        initialTab={initialTab}
      />
    )
  }

  const ViewComponent = viewMode === "board" ? NotesBoard : NotesTable

  return (
    <ViewComponent
      context={context}
      title={title}
      showTabs={showTabs}
      hideCreateButton={hideCreateButton}
      createNoteOverrides={createNoteOverrides}
      folderId={folderId}
      tagId={tagId}
      labelId={labelId}
      onRowClick={handleRowClick}
      activePreviewId={activePreviewId}
      initialTab={initialTab}
      onTabChange={onTabChange}
    />
  )
}
