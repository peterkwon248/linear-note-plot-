"use client"

/**
 * timeline-event-markers.tsx — the per-bar start chip + activity event markers
 * for one lane's bar. Extracted from WikiTimelineView's `renderEventMarkers`.
 *
 * Start chip: a bar-intrinsic origin node at the bar's left edge (`barX`)
 * representing creation — so `created` events are excluded from the markers.
 * Activity events: own marker each; same-day events stack horizontally with
 * EVENT_MARKER_STACK_GAP; > EVENT_MARKER_MAX_PER_DAY shows a "+N" overflow.
 */

import type { Dispatch, SetStateAction } from "react"
import type { EntityEvent } from "@/lib/types"
import { diffDays } from "./wiki-timeline-utils"
import {
  LANE_HEIGHT,
  EVENT_MARKER_CONFIG,
  EVENT_MARKER_FALLBACK,
  EVENT_MARKER_RING_R,
  EVENT_MARKER_ICON_SIZE,
  EVENT_MARKER_Y_OFFSET,
  EVENT_MARKER_STACK_GAP,
  EVENT_MARKER_MAX_PER_DAY,
  type MarkerConfig,
  type TimelineEntity,
  type ZoomConfig,
  type TimelineEventTooltipState,
} from "./wiki-timeline-config"

export interface TimelineEventMarkersProps {
  article: TimelineEntity
  laneIndex: number
  /** The bar's left-edge X — the start chip anchors here. */
  barX: number
  eventsByArticleId: Map<string, EntityEvent[]>
  cfg: ZoomConfig
  winStart: Date
  setEventTooltip: Dispatch<SetStateAction<TimelineEventTooltipState | null>>
}

export function TimelineEventMarkers({
  article,
  laneIndex,
  barX,
  eventsByArticleId,
  cfg,
  winStart,
  setEventTooltip,
}: TimelineEventMarkersProps) {
  const cy = laneIndex * LANE_HEIGHT + LANE_HEIGHT / 2
  const markerY = cy + EVENT_MARKER_Y_OFFSET

  // `created` is drawn as the bar-intrinsic start chip below, not as a marker.
  const events = (eventsByArticleId.get(article.id) ?? []).filter(
    (e) => e.type !== "created",
  )

  const startCfg = EVENT_MARKER_CONFIG.created ?? EVENT_MARKER_FALLBACK
  const StartIcon = startCfg.icon

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
      {/* Start chip — bar-intrinsic origin (created), straddling the bar's left edge */}
      <g transform={`translate(${barX}, ${markerY})`} style={{ pointerEvents: "all" }}>
        <circle
          r={10}
          fill="transparent"
          onMouseEnter={(e) => {
            e.stopPropagation()
            const dateLabel = new Date(article.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
            setEventTooltip({
              laneIndex,
              x: barX,
              dateLabel,
              labels: [startCfg.label],
              count: 1,
            })
          }}
          onMouseLeave={() => setEventTooltip(null)}
        />
        <circle
          r={EVENT_MARKER_RING_R}
          fill={startCfg.color}
          stroke="white"
          strokeWidth={1.25}
        />
        <StartIcon
          x={-EVENT_MARKER_ICON_SIZE / 2}
          y={-EVENT_MARKER_ICON_SIZE / 2}
          width={EVENT_MARKER_ICON_SIZE}
          height={EVENT_MARKER_ICON_SIZE}
          strokeWidth={2.5}
          color="white"
        />
      </g>
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
                  {/* Visible chip — filled ring + white border + centered Phosphor icon */}
                  <circle
                    r={EVENT_MARKER_RING_R}
                    fill={mc.color}
                    stroke="white"
                    strokeWidth={1.25}
                  />
                  <IconComp
                    x={-EVENT_MARKER_ICON_SIZE / 2}
                    y={-EVENT_MARKER_ICON_SIZE / 2}
                    width={EVENT_MARKER_ICON_SIZE}
                    height={EVENT_MARKER_ICON_SIZE}
                    strokeWidth={2.5}
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
