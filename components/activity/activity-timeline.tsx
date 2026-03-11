"use client"

import { useState, useMemo } from "react"
import { formatDistanceToNow, parseISO } from "date-fns"
import { usePlotStore } from "@/lib/store"
import { getEventsForNote } from "@/lib/datalog/helpers"
import { EVENT_CONFIG } from "@/lib/datalog/event-config"
import type { NoteEvent } from "@/lib/types"

const INITIAL_LIMIT = 10

export function ActivityTimeline({ noteId }: { noteId: string }) {
  const events = usePlotStore((s) => s.noteEvents)
  const [showAll, setShowAll] = useState(false)

  const noteEvents = useMemo(
    () => getEventsForNote(events, noteId),
    [events, noteId]
  )

  const visible = showAll ? noteEvents : noteEvents.slice(0, INITIAL_LIMIT)
  const hasMore = noteEvents.length > INITIAL_LIMIT

  if (noteEvents.length === 0) {
    return (
      <p className="text-[12px] text-muted-foreground/50">No activity yet</p>
    )
  }

  return (
    <div className="space-y-0">
      {visible.map((event) => (
        <TimelineRow key={event.id} event={event} />
      ))}
      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          Show all {noteEvents.length} events
        </button>
      )}
    </div>
  )
}

function TimelineRow({ event }: { event: NoteEvent }) {
  const config = EVENT_CONFIG[event.type]
  if (!config) return null

  const timeAgo = formatDistanceToNow(parseISO(event.at), { addSuffix: true })

  return (
    <div className="flex items-center gap-2 py-1">
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: config.color }}
      />
      <span className="text-[12px] text-muted-foreground">
        {config.verb}
      </span>
      <span className="ml-auto text-[11px] text-muted-foreground/50 shrink-0">
        {timeAgo}
      </span>
    </div>
  )
}
