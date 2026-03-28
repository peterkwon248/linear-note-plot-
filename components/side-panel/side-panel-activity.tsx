"use client"

import { usePlotStore } from "@/lib/store"
import { ThreadPanel } from "@/components/editor/thread-panel"
import { ReflectionPanel } from "@/components/editor/reflection-panel"
import { ClockCounterClockwise } from "@phosphor-icons/react/dist/ssr/ClockCounterClockwise"

export function SidePanelActivity() {
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const previewNoteId = usePlotStore((s) => s.previewNoteId)
  const noteId = selectedNoteId || previewNoteId
  const nestedReplies = usePlotStore((s) => s.viewStateByContext["all"]?.toggles?.nestedReplies === true)

  if (!noteId) return (
    <div className="flex flex-1 items-center justify-center p-8 text-center">
      <p className="text-sm text-muted-foreground">Select a note to see activity</p>
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

      {/* History placeholder */}
      <div className="px-4 py-3">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-muted-foreground"><ClockCounterClockwise size={16} weight="regular" /></span>
          <span className="text-xs font-medium text-muted-foreground">History</span>
        </div>
        <span className="text-sm text-muted-foreground">Coming soon</span>
      </div>
    </div>
  )
}
