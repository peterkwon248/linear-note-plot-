"use client"

import { usePlotStore } from "@/lib/store"
import { useSidePanelEntity } from "./use-side-panel-entity"
import { ThreadPanel } from "@/components/editor/thread-panel"
import { ReflectionPanel } from "@/components/editor/reflection-panel"
import { ActivityTimeline } from "@/components/activity/activity-timeline"
import { ClockCounterClockwise } from "@phosphor-icons/react/dist/ssr/ClockCounterClockwise"

export function SidePanelActivity() {
  const entity = useSidePanelEntity()
  const nestedReplies = usePlotStore((s) => s.viewStateByContext["all"]?.toggles?.nestedReplies === true)

  if (entity.type === "wiki") {
    return <WikiActivityPanel />
  }

  // Note or null — existing behavior
  const noteId = entity.type === "note" ? entity.noteId : null

  if (!noteId) return (
    <div className="flex flex-1 items-center justify-center p-8 text-center">
      <p className="text-note text-muted-foreground">Select a note to see activity</p>
    </div>
  )

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Thread */}
      <ThreadPanel noteId={noteId} nestedReplies={nestedReplies} />

      <div className="mx-4 border-b border-border" />

      {/* Reflections */}
      <ReflectionPanel noteId={noteId} />

      <div className="mx-4 border-b border-border" />

      {/* History */}
      <div className="px-4 py-3">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-muted-foreground"><ClockCounterClockwise size={16} weight="regular" /></span>
          <span className="text-2xs font-medium text-muted-foreground">History</span>
        </div>
        {noteId && <ActivityTimeline noteId={noteId} />}
      </div>
    </div>
  )
}

function WikiActivityPanel() {
  return (
    <div className="flex-1 overflow-y-auto">
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
