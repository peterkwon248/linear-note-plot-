"use client"

/**
 * timeline-event-markers.tsx — event markers above one lane's bar. Extracted
 * from WikiTimelineView's `renderEventMarkers` render function.
 *
 * Each event = own marker. Same-day events stack horizontally with
 * EVENT_MARKER_STACK_GAP. If a day has > EVENT_MARKER_MAX_PER_DAY events,
 * show the first MAX and a "+N" overflow text after them.
 */

import type { Dispatch, SetStateAction } from "react"
import type { WikiArticle, EntityEvent } from "@/lib/types"
import { diffDays } from "./wiki-timeline-utils"
import {
  LANE_HEIGHT,
  BAR_HEIGHT,
  EVENT_MARKER_CONFIG,
  EVENT_MARKER_FALLBACK,
  EVENT_MARKER_RING_R,
  EVENT_MARKER_ICON_SIZE,
  EVENT_MARKER_Y_OFFSET,
  EVENT_MARKER_STACK_GAP,
  EVENT_MARKER_MAX_PER_DAY,
  type MarkerConfig,
  type ZoomConfig,
  type TimelineEventTooltipState,
} from "./wiki-timeline-config"

export interface TimelineEventMarkersProps {
  article: WikiArticle
  laneIndex: number
  eventsByArticleId: Map<string, EntityEvent[]>
  cfg: ZoomConfig
  winStart: Date
  setEventTooltip: Dispatch<SetStateAction<TimelineEventTooltipState | null>>
}

export function TimelineEventMarkers({
  article,
  laneIndex,
  eventsByArticleId,
  cfg,
  winStart,
  setEventTooltip,
}: TimelineEventMarkersProps) {
  const events = eventsByArticleId.get(article.id)
  if (!events || events.length === 0) return null

  const cy = laneIndex * LANE_HEIGHT + LANE_HEIGHT / 2
  const markerY = cy - BAR_HEIGHT / 2 + EVENT_MARKER_Y_OFFSET

  // Bucket events by yyyy-mm-dd (oldest first within each day so left-to-right stack)
  const byDay = new Map<string, EntityEvent[]>()
  for (const ev of events) {
    const d = new Date(ev.at)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    if (!byDay.has(key)) byDay.set(key, [])
    byDay.get(key)!.push(ev)
  }
  // sort each day's events by time ascending
  for (const arr of byDay.values()) {
    arr.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
  }

  const dayBuckets = Array.from(byDay.entries()).map(([key, evs]) => {
    const first = new Date(evs[0].at)
    const dayStart = new Date(first.getFullYear(), first.getMonth(), first.getDate())
    const dayCenterX = diffDays(dayStart, winStart) * cfg.pxPerDay + cfg.pxPerDay / 2
    return { key, dayCenterX, events: evs }
  })

  return (
    <g style={{ pointerEvents: "none" }}>
      {dayBuckets.map(({ key, dayCenterX, events: evs }) => {
        const visible = evs.slice(0, EVENT_MARKER_MAX_PER_DAY)
        const overflow = evs.length - visible.length
        // Center the row of markers horizontally around dayCenterX
        const totalW = (visible.length - 1) * EVENT_MARKER_STACK_GAP + (overflow > 0 ? EVENT_MARKER_STACK_GAP + 12 : 0)
        const startX = dayCenterX - totalW / 2

        return (
          <g key={key}>
            {visible.map((ev, i) => {
              const mc: MarkerConfig = EVENT_MARKER_CONFIG[ev.type] ?? EVENT_MARKER_FALLBACK
              const IconComp = mc.icon
              const mx = startX + i * EVENT_MARKER_STACK_GAP
              return (
                <g
                  key={ev.id}
                  transform={`translate(${mx}, ${markerY})`}
                  style={{ pointerEvents: "all" }}
                >
                  {/* Hit area — larger than visible ring for easier hover */}
                  <circle
                    r={10}
                    fill="transparent"
                    onMouseEnter={(e) => {
                      e.stopPropagation()
                      const dateLabel = new Date(ev.at).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })
                      const timeLabel = new Date(ev.at).toLocaleTimeString("en-US", {
                        hour: "numeric", minute: "2-digit",
                      })
                      const label = (EVENT_MARKER_CONFIG[ev.type] ?? EVENT_MARKER_FALLBACK).label
                      setEventTooltip({
                        laneIndex,
                        x: mx,
                        dateLabel: `${dateLabel} · ${timeLabel}`,
                        labels: [label],
                        count: 1,
                      })
                    }}
                    onMouseLeave={() => setEventTooltip(null)}
                  />
                  {/* Visible chip — filled ring + centered Phosphor icon */}
                  <circle
                    r={EVENT_MARKER_RING_R}
                    fill={mc.color}
                    opacity={0.95}
                  />
                  <IconComp
                    x={-EVENT_MARKER_ICON_SIZE / 2}
                    y={-EVENT_MARKER_ICON_SIZE / 2}
                    width={EVENT_MARKER_ICON_SIZE}
                    height={EVENT_MARKER_ICON_SIZE}
                    weight="bold"
                    color="white"
                  />
                </g>
              )
            })}
            {overflow > 0 && (
              <text
                x={startX + visible.length * EVENT_MARKER_STACK_GAP}
                y={markerY + 3}
                fill="var(--muted-foreground)"
                fontSize={9}
                fontWeight={600}
                style={{ pointerEvents: "none" }}
              >
                +{overflow}
              </text>
            )}
          </g>
        )
      })}
    </g>
  )
}
