"use client"

import { useState, useMemo } from "react"
import { formatDistanceToNow, parseISO } from "date-fns"
import { usePlotStore } from "@/lib/store"
import { EVENT_CONFIG, EVENT_TYPE_GROUPS } from "@/lib/datalog/event-config"
import { filterEventsByTypes, groupEventsByDate } from "@/lib/datalog/helpers"
import type { NoteEventType } from "@/lib/types"

const INITIAL_LIMIT = 200

export function ActivityFeed() {
  const notes = usePlotStore((s) => s.notes)
  const events = usePlotStore((s) => s.noteEvents)
  const openNote = usePlotStore((s) => s.openNote)

  const [activeGroups, setActiveGroups] = useState<Set<string>>(
    () => new Set(EVENT_TYPE_GROUPS.map((g) => g.label))
  )
  const [limit, setLimit] = useState(INITIAL_LIMIT)

  // Compute active event types from selected groups
  const activeTypes = useMemo(() => {
    const types: NoteEventType[] = []
    for (const group of EVENT_TYPE_GROUPS) {
      if (activeGroups.has(group.label)) {
        types.push(...group.types)
      }
    }
    return types
  }, [activeGroups])

  // Filter and group events
  const filtered = useMemo(
    () => filterEventsByTypes(events, activeTypes),
    [events, activeTypes]
  )

  const limited = useMemo(() => filtered.slice(0, limit), [filtered, limit])

  const grouped = useMemo(() => groupEventsByDate(limited), [limited])

  // Note title lookup
  const noteMap = useMemo(
    () => new Map(notes.map((n) => [n.id, n.title])),
    [notes]
  )

  const toggleGroup = (label: string) => {
    setActiveGroups((prev) => {
      const next = new Set(prev)
      if (next.has(label)) {
        next.delete(label)
      } else {
        next.add(label)
      }
      return next
    })
  }

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {EVENT_TYPE_GROUPS.map((group) => {
          const isActive = activeGroups.has(group.label)
          return (
            <button
              key={group.label}
              onClick={() => toggleGroup(group.label)}
              className={`rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors ${
                isActive
                  ? "border-primary/30 bg-primary/15 text-primary"
                  : "border-border bg-secondary/50 text-muted-foreground hover:bg-secondary"
              }`}
            >
              {group.label}
            </button>
          )
        })}
      </div>

      {/* Event list */}
      {grouped.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-muted-foreground">
          No events match the selected filters
        </p>
      ) : (
        <div className="space-y-4">
          {grouped.map((group) => (
            <div key={group.date}>
              <h4 className="mb-1.5 text-[12px] font-medium text-muted-foreground">
                {group.label}
              </h4>
              <div className="space-y-0">
                {group.events.map((event) => {
                  const config = EVENT_CONFIG[event.type]
                  if (!config) return null
                  const title = noteMap.get(event.noteId) || "Untitled"
                  const timeAgo = formatDistanceToNow(parseISO(event.at), {
                    addSuffix: true,
                  })

                  return (
                    <div
                      key={event.id}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-secondary/30"
                      style={{ minHeight: 32 }}
                    >
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: config.color }}
                      />
                      <span className="text-[12px] text-muted-foreground">
                        {config.verb}
                      </span>
                      <button
                        onClick={() => openNote(event.noteId)}
                        className="truncate text-[13px] text-foreground hover:underline"
                      >
                        {`"${title}"`}
                      </button>
                      <span className="ml-auto shrink-0 text-[11px] text-muted-foreground/50">
                        {timeAgo}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Load more */}
          {filtered.length > limit && (
            <button
              onClick={() => setLimit((l) => l + INITIAL_LIMIT)}
              className="w-full rounded-md border border-border py-2 text-[12px] text-muted-foreground transition-colors hover:bg-secondary/50"
            >
              Load more ({filtered.length - limit} remaining)
            </button>
          )}
        </div>
      )}
    </div>
  )
}
