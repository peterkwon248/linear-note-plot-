"use client"

/**
 * timeline-tooltip.tsx — the two hover tooltip overlays:
 *   - TimelineTooltip       (B2: article hover — title / status / created / planned)
 *   - TimelineEventTooltip  (event marker hover)
 * Extracted from WikiTimelineView's main render.
 */

import type { RefObject } from "react"
import type { WikiArticle } from "@/lib/types"
import { isWikiStub, safeDate } from "@/lib/wiki-utils"
import { WIKI_STATUS_HEX } from "@/lib/colors"
import { IconWikiStub, IconWikiArticle } from "@/components/plot-icons"
import { relativeDateLabel, startOfDay, addDays } from "./wiki-timeline-utils"
import {
  LANE_HEIGHT,
  BAR_HEIGHT,
  type ZoomConfig,
  type TimelineTooltipState,
  type TimelineEventTooltipState,
  type TimelineDragState,
} from "./wiki-timeline-config"

/* ── B2: Article hover tooltip ────────────────────────────── */

export interface TimelineTooltipProps {
  tooltip: TimelineTooltipState | null
  tooltipArticle: WikiArticle | null | undefined
  dragState: TimelineDragState | null
  cfg: ZoomConfig
  winStart: Date
  now: Date
  canvasScrollRef: RefObject<HTMLDivElement | null>
}

export function TimelineTooltip({
  tooltip,
  tooltipArticle,
  dragState,
  cfg,
  winStart,
  now,
  canvasScrollRef,
}: TimelineTooltipProps) {
  if (!tooltipArticle || !tooltip) return null

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
        <span
          className="shrink-0"
          style={{
            color: isWikiStub(tooltipArticle)
              ? WIKI_STATUS_HEX.stub
              : WIKI_STATUS_HEX.article,
          }}
        >
          {isWikiStub(tooltipArticle) ? (
            <IconWikiStub size={12} />
          ) : (
            <IconWikiArticle size={12} />
          )}
        </span>
        <span className="max-w-[180px] truncate text-note font-medium text-foreground">
          {tooltipArticle.title || "Untitled"}
        </span>
      </div>
      {/* Line 2: Status badge */}
      <div className="mt-0.5 flex items-center gap-1">
        <span
          className="text-2xs font-medium"
          style={{
            color: isWikiStub(tooltipArticle)
              ? WIKI_STATUS_HEX.stub
              : WIKI_STATUS_HEX.article,
          }}
        >
          {isWikiStub(tooltipArticle) ? "Stub" : "Article"}
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
      {/* Line 4: Live drag date OR planned/updated date */}
      <div className="mt-0.5 text-2xs tabular-nums">
        {(() => {
          const fmt = (d: Date) =>
            d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

          // During drag — show live planning date
          if (dragState && tooltipArticle.id === dragState.id) {
            // bar right edge covers whole day cells → horizon day = days - 1
            const days = Math.round(dragState.currentEndX / cfg.pxPerDay)
            const liveDragDate = startOfDay(addDays(winStart, days - 1))
            const rel = relativeDateLabel(liveDragDate, now)
            return (
              <span className="text-muted-foreground">
                <span style={{ color: WIKI_STATUS_HEX.stub, fontWeight: 500 }}>Planning</span>{" "}
                {fmt(liveDragDate)}
                <span className="opacity-60"> ({rel})</span>
              </span>
            )
          }

          const planned = safeDate(tooltipArticle.plannedDate)
          const updated = safeDate(tooltipArticle.updatedAt)
          if (planned) {
            const rel = relativeDateLabel(planned, now)
            return (
              <span className="text-muted-foreground">
                <span style={{ color: WIKI_STATUS_HEX.stub }}>Planned</span>
                {" "}
                {fmt(planned)}
                <span className="opacity-60"> ({rel})</span>
              </span>
            )
          }
          if (updated) {
            return (
              <span className="text-muted-foreground">
                Updated {fmt(updated)}
              </span>
            )
          }
          return null
        })()}
      </div>
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
