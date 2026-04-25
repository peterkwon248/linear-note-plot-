"use client"

import { useSidePanelEntity } from "./use-side-panel-entity"
import { ActivityTimeline } from "@/components/activity/activity-timeline"
import { CommentsByEntity } from "@/components/comments/comments-by-entity"
import { ClockCounterClockwise } from "@phosphor-icons/react/dist/ssr/ClockCounterClockwise"

export function SidePanelActivity() {
  const entity = useSidePanelEntity()

  if (entity.type === "wiki") {
    return (
      <div className="flex-1 overflow-y-auto">
        {/* Comments — block + entity-level, unified */}
        <CommentsByEntity entity={{ kind: "wiki", articleId: entity.wikiArticleId }} />

        <div className="mx-4 border-b border-border" />

        {/* History — wiki events not yet wired up */}
        <div className="px-4 py-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-muted-foreground"><ClockCounterClockwise size={16} weight="regular" /></span>
            <span className="text-2xs font-medium text-muted-foreground">History</span>
          </div>
          <p className="text-note text-muted-foreground/50">
            Wiki article history is not yet available.
          </p>
        </div>
      </div>
    )
  }

  // Note or null
  const noteId = entity.type === "note" ? entity.noteId : null

  if (!noteId) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <p className="text-note text-muted-foreground">Select a note to see activity</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Comments — replaces legacy Thread + Reflection panels */}
      <CommentsByEntity entity={{ kind: "note", noteId }} />

      <div className="mx-4 border-b border-border" />

      {/* History */}
      <div className="px-4 py-3">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-muted-foreground"><ClockCounterClockwise size={16} weight="regular" /></span>
          <span className="text-2xs font-medium text-muted-foreground">History</span>
        </div>
        <ActivityTimeline noteId={noteId} />
      </div>
    </div>
  )
}
