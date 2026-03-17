"use client"

import { usePlotStore } from "@/lib/store"
import type { WorkspaceLeaf, PanelContent } from "@/lib/workspace/types"
import { WorkspaceEditorLeaf } from "./workspace-editor-leaf"
import { NotesTable } from "@/components/notes-table"
import { TagsView } from "@/components/views/tags-view"
import { LabelsView } from "@/components/views/labels-view"
import { NoteInspector } from "@/components/note-inspector"
import { OntologyView } from "@/components/views/ontology-view"
import { TemplatesView } from "@/components/views/templates-view"
import { CalendarView } from "@/components/calendar-view"
import { InsightsView } from "@/components/insights-view"
import {
  FileText, List, Tag, Bookmark,
  Eye, Calendar, BarChart3, Network, LayoutTemplate,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface WorkspaceViewDispatchProps {
  leaf: WorkspaceLeaf
}

/** Content type options for the empty panel picker */
const EMPTY_PICKER_OPTIONS: { icon: typeof FileText; label: string; content: PanelContent }[] = [
  { icon: FileText, label: "Editor", content: { type: "editor", noteId: null } },
  { icon: List, label: "All Notes", content: { type: "note-list", context: "all" } },
  { icon: Tag, label: "Tags", content: { type: "tags" } },
  { icon: Bookmark, label: "Labels", content: { type: "labels" } },
  { icon: Calendar, label: "Calendar", content: { type: "calendar" } },
  { icon: BarChart3, label: "Insights", content: { type: "insights" } },
  { icon: Network, label: "Ontology", content: { type: "ontology" } },
  { icon: LayoutTemplate, label: "Templates", content: { type: "templates" } },
  { icon: Eye, label: "Inspector", content: { type: "inspector", noteId: "", followActive: true } },
]

function EmptyPanelPicker({ leafId }: { leafId: string }) {
  const setLeafContent = usePlotStore((s) => s.setLeafContent)

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="grid grid-cols-3 gap-2 max-w-[280px]">
        {EMPTY_PICKER_OPTIONS.map((opt) => {
          const OptIcon = opt.icon
          return (
            <button
              key={opt.label}
              onClick={() => setLeafContent(leafId, opt.content)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-lg px-3 py-3",
                "border border-border/50 bg-card/50",
                "text-muted-foreground hover:text-foreground hover:bg-secondary/60 hover:border-border",
                "transition-all duration-150"
              )}
            >
              <OptIcon className="h-5 w-5" />
              <span className="text-[11px] font-medium leading-tight text-center">{opt.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function WorkspaceViewDispatch({ leaf }: WorkspaceViewDispatchProps) {
  const openNote = usePlotStore((s) => s.openNoteInLeaf)
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)

  switch (leaf.content.type) {
    case "editor":
      return <WorkspaceEditorLeaf leaf={leaf} />

    case "note-list":
      return (
        <NotesTable
          context={leaf.content.context}
          folderId={leaf.content.folderId}
          tagId={leaf.content.tagId}
          labelId={leaf.content.labelId}
          onRowClick={(noteId) => openNote(noteId)}
          activePreviewId={selectedNoteId}
        />
      )

    case "tags":
      return <TagsView />

    case "labels":
      return <LabelsView />

    case "inspector":
      return <NoteInspector />

    case "calendar":
      return <CalendarView context="all" />

    case "insights":
      return <InsightsView />

    case "ontology":
      return <OntologyView />

    case "templates":
      return <TemplatesView />

    case "empty":
      return <EmptyPanelPicker leafId={leaf.id} />

    default:
      return null
  }
}
