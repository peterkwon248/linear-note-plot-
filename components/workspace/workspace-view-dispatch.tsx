"use client"

import { usePlotStore } from "@/lib/store"
import type { WorkspaceLeaf } from "@/lib/workspace/types"
import { WorkspaceEditorLeaf } from "./workspace-editor-leaf"
import { CompactNoteList } from "@/components/layout/compact-note-list"
import { TagsView } from "@/components/views/tags-view"
import { LabelsView } from "@/components/views/labels-view"
import { ActivityView } from "@/components/views/activity-view"
import { NoteInspector } from "@/components/note-inspector"

interface WorkspaceViewDispatchProps {
  leaf: WorkspaceLeaf
}

export function WorkspaceViewDispatch({ leaf }: WorkspaceViewDispatchProps) {
  const openNote = usePlotStore((s) => s.openNoteInLeaf)
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)

  switch (leaf.content.type) {
    case "editor":
      return <WorkspaceEditorLeaf leaf={leaf} />

    case "note-list":
      return (
        <CompactNoteList
          context={leaf.content.context}
          folderId={leaf.content.folderId}
          tagId={leaf.content.tagId}
          labelId={leaf.content.labelId}
          onNoteClick={(noteId) => openNote(noteId)}
          activeNoteId={selectedNoteId}
        />
      )

    case "tags":
      return <TagsView />

    case "labels":
      return <LabelsView />

    case "activity":
      return <ActivityView />

    case "inspector":
      return <NoteInspector />

    case "calendar":
      // TODO: integrate CalendarView here
      return (
        <div className="flex flex-1 items-center justify-center text-muted-foreground/50">
          <p className="text-sm">Calendar View</p>
        </div>
      )

    case "insights":
      // TODO: integrate InsightsView here
      return (
        <div className="flex flex-1 items-center justify-center text-muted-foreground/50">
          <p className="text-sm">Insights View</p>
        </div>
      )

    case "empty":
      return (
        <div className="flex flex-1 items-center justify-center text-muted-foreground/30">
          <p className="text-sm">Drop a view here or right-click to choose</p>
        </div>
      )

    default:
      return null
  }
}
