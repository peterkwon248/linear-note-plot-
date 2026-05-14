"use client"

import { useState, useMemo } from "react"
import { formatDistanceToNow, parseISO } from "date-fns"
import { usePlotStore } from "@/lib/store"
import { getEventsForEntity } from "@/lib/datalog/helpers"
import { EVENT_CONFIG } from "@/lib/datalog/event-config"
import type { EntityEvent, EntityRef } from "@/lib/types"

const INITIAL_LIMIT = 10

/**
 * ActivityTimeline — entity-agnostic event timeline.
 *
 * PRD activity-unification (PR 5, 2026-05-14): NoteEvent → EntityEvent. Accept
 * either `entity: EntityRef` (preferred) or `noteId: string` (backward
 * compat — wraps as `{ kind: "note", id }`).
 */
export function ActivityTimeline({
  entity,
  noteId,
}: {
  entity?: EntityRef
  /** @deprecated Use `entity={{ kind: "note", id }}`. */
  noteId?: string
}) {
  const events = usePlotStore((s) => s.entityEvents)
  const [showAll, setShowAll] = useState(false)

  const target: EntityRef | null = entity
    ?? (noteId ? { kind: "note", id: noteId } : null)

  const filtered = useMemo(
    () => (target ? getEventsForEntity(events, target) : []),
    [events, target?.kind, target?.id]  // eslint-disable-line react-hooks/exhaustive-deps
  )

  const visible = showAll ? filtered : filtered.slice(0, INITIAL_LIMIT)
  const hasMore = filtered.length > INITIAL_LIMIT

  if (!target) {
    return (
      <p className="text-2xs text-muted-foreground/70">No entity selected</p>
    )
  }

  if (filtered.length === 0) {
    return (
      <p className="text-2xs text-muted-foreground/70">No activity yet</p>
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
          className="mt-1 text-2xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Show all {filtered.length} events
        </button>
      )}
    </div>
  )
}

function TimelineRow({ event }: { event: EntityEvent }) {
  const config = EVENT_CONFIG[event.type]
  if (!config) return null

  const timeAgo = formatDistanceToNow(parseISO(event.at), { addSuffix: true })

  return (
    <div className="flex items-center gap-2 py-1">
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: config.color }}
      />
      <span className="text-2xs text-muted-foreground">
        {config.verb}
      </span>
      <span className="ml-auto text-2xs text-muted-foreground/70 shrink-0">
        {timeAgo}
      </span>
    </div>
  )
}
