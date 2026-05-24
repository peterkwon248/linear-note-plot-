"use client"

/**
 * timeline-tooltip.tsx — the two hover tooltip overlays:
 *   - TimelineTooltip       (B2: article hover — title / status / created / planned)
 *   - TimelineEventTooltip  (event marker hover)
 * Extracted from WikiTimelineView's main render.
 */

import type { ReactNode, RefObject } from "react"
import { safeDate } from "@/lib/wiki-utils"
import {
  LANE_HEIGHT,
  BAR_HEIGHT,
  type TimelineEntity,
  type TimelineTooltipState,
  type TimelineEventTooltipState,
  type TimelineDragState,
} from "./wiki-timeline-config"

/* ── B2: Entity hover tooltip ─────────────────────────────── */

export interface TimelineTooltipProps {
  tooltip: TimelineTooltipState | null
  tooltipArticle: TimelineEntity | null | undefined
  /** Entity-status color (line 1 icon + line 2 badge). */
  getStatusColor: (entity: TimelineEntity) => string
  /** Entity-status silhouette icon (12px in tooltip). */
  renderStatusIcon: (entity: TimelineEntity, size?: number) => ReactNode
  /** Status label for line 2 ("Stub", "Article", "Stone", "Smart book", ...). */
  getStatusLabel: (entity: TimelineEntity) => string
  /** Line 4 render — wiki uses this for planned/updated/live-drag horizon;
   *  notes/books supply a simple "Updated X" line. Receives the entity and
   *  the live drag state so wiki can render the planning preview during
   *  drag-to-extend interactions. Return null for "no line 4". */
  renderHorizonLine?: (entity: TimelineEntity, dragState: TimelineDragState | null) => ReactNode
  dragState: TimelineDragState | null
  canvasScrollRef: RefObject<HTMLDivElement | null>
}

export function TimelineTooltip({
  tooltip,
  tooltipArticle,
  getStatusColor,
  renderStatusIcon,
  getStatusLabel,
  renderHorizonLine,
  dragState,
  canvasScrollRef,
}: TimelineTooltipProps) {
  if (!tooltipArticle || !tooltip) return null

  const statusColor = getStatusColor(tooltipArticle)

  return (
    <div
      className="pointer-events-none absolute z-20 rounded-md border border-border-subtle bg-popover px-2.5 py-1.5 shadow-md"
      style={{
        left: Math.min(
          tooltip.x + 12,
          (canvasScrollRef.current?.clientWidth ?? 400) - 220,
        ),
        top: tooltip.laneIndex * LANE_HEIGHT + LANE_HEIGHT / 2 - 28,
      }}
    >
      {/* Line 1: Title + icon */}
      <div className="flex items-center gap-1.5">
        <span className="shrink-0" style={{ color: statusColor }}>
          {renderStatusIcon(tooltipArticle, 12)}
        </span>
        <span className="max-w-[180px] truncate text-note font-medium text-foreground">
          {tooltipArticle.title || "Untitled"}
        </span>
      </div>
      {/* Line 2: Status badge */}
      <div className="mt-0.5 flex items-center gap-1">
        <span className="text-2xs font-medium" style={{ color: statusColor }}>
          {getStatusLabel(tooltipArticle)}
        </span>
      </div>
      {/* Line 3: Created date */}
      <div className="mt-0.5 text-2xs text-muted-foreground tabular-nums">
        {(() => {
          const created = safeDate(tooltipArticle.createdAt)
          const fmt = (d: Date) =>
            d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          return created ? `Created ${fmt(created)}` : null
        })()}
      </div>
      {/* Line 4: Adapter-rendered horizon info (planned / updated / live drag). */}
      {renderHorizonLine && (
        <div className="mt-0.5 text-2xs tabular-nums">
          {renderHorizonLine(tooltipArticle, dragState)}
        </div>
      )}
    </div>
  )
}

/* ── Event marker hover tooltip ───────────────────────────── */

export interface TimelineEventTooltipProps {
  eventTooltip: TimelineEventTooltipState | null
  canvasScrollRef: RefObject<HTMLDivElement | null>
}

export function TimelineEventTooltip({
  eventTooltip,
  canvasScrollRef,
}: TimelineEventTooltipProps) {
  if (!eventTooltip) return null

  return (
    <div
      className="pointer-events-none absolute z-30 rounded-md border border-border-subtle bg-popover px-2 py-1 shadow-md"
      style={{
        left: Math.min(eventTooltip.x + 8, (canvasScrollRef.current?.clientWidth ?? 400) - 160),
        top: eventTooltip.laneIndex * LANE_HEIGHT + LANE_HEIGHT / 2 - BAR_HEIGHT / 2 - 32,
      }}
    >
      <div className="text-2xs font-medium text-foreground tabular-nums">
        {eventTooltip.dateLabel}
      </div>
      <div className="mt-0.5 flex flex-col gap-0.5">
        {eventTooltip.labels.map((l, i) => (
          <span key={i} className="text-2xs text-muted-foreground">
            • {l}
          </span>
        ))}
      </div>
    </div>
  )
}
