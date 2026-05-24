"use client"

/**
 * timeline-label-column.tsx — the left sticky label column (one row per lane:
 * status icon + title + created date). Extracted from WikiTimelineView's main
 * render.
 */

import type { ReactNode, Dispatch, SetStateAction } from "react"
import { safeDate } from "@/lib/wiki-utils"
import { cn } from "@/lib/utils"
import {
  LANE_HEIGHT,
  LABEL_COL_WIDTH,
  type LanedItem,
  type TimelineEntity,
  type TimelineTooltipState,
} from "./wiki-timeline-config"

export interface TimelineLabelColumnProps {
  lanes: LanedItem<TimelineEntity>[]
  /** Caller-resolved status color (one per laned entity, keyed by entity id).
   *  Wiki: stub orange / article emerald. Notes: stone slate / brick amber /
   *  keystone emerald. Books: smart indigo / hybrid amber / manual muted. */
  getStatusColor: (entity: TimelineEntity) => string
  /** Caller-rendered status silhouette (e.g. IconWikiStub for wiki stubs,
   *  IconStone for note stones). Sized for the label column (13px default
   *  inside this component). */
  renderStatusIcon: (entity: TimelineEntity, size?: number) => ReactNode
  activeArticleId: string | null
  selectedIds: Set<string>
  hoveredId: string | null
  svgHeight: number
  /** B6: subset of `visibleColumns` from viewState that the label column
   *  honors. Currently affects the date row only:
   *    - includes("updatedAt") → show updated date
   *    - else (or includes("createdAt")) → show created date (default)
   *  Other property keys are ignored for now (label column is space-bound;
   *  more properties belong in tooltip / sidepanel). */
  visibleColumns?: string[]
  /** B4: pre-computed group boundaries from WikiTimelineView (one entry per
   *  group, marking the lane index where that group starts). Centralized in
   *  the orchestrator so the label column and the canvas grid use the same
   *  source of truth. Omit when no grouping is active. */
  groupBoundaries?: { laneIndex: number; label: string; count: number }[] | null
  setHoveredId: Dispatch<SetStateAction<string | null>>
  setTooltip: Dispatch<SetStateAction<TimelineTooltipState | null>>
  onOpenArticle: (id: string) => void
  onSelect: (id: string, opts: { multi?: boolean; shift?: boolean; index?: number }) => void
}

export function TimelineLabelColumn({
  lanes,
  getStatusColor,
  renderStatusIcon,
  activeArticleId,
  selectedIds,
  hoveredId,
  svgHeight,
  visibleColumns,
  groupBoundaries,
  setHoveredId,
  setTooltip,
  onOpenArticle,
  onSelect,
}: TimelineLabelColumnProps) {
  // Date column: updatedAt wins if explicitly toggled on, else createdAt.
  const showUpdated = visibleColumns?.includes("updatedAt") ?? false
  return (
    <div
      style={{
        width: LABEL_COL_WIDTH,
        position: "sticky",
        left: 0,
        zIndex: 10,
        background: "var(--bg, var(--background))",
        borderRight: "1px solid var(--border)",
        flexShrink: 0,
        minHeight: svgHeight,
      }}
    >
      {lanes.map(({ article }, laneIndex) => {
        const isActive = article.id === activeArticleId
        const isSelected = selectedIds.has(article.id)
        const isHovered = article.id === hoveredId
        const color = getStatusColor(article)
        // B4: render a slim group-header overlay on the first lane of each
        // group. Absolute-positioned so it doesn't shift cy positions for
        // bars/markers in the canvas (which uses laneIndex * LANE_HEIGHT).
        const groupStart = groupBoundaries?.find((b) => b.laneIndex === laneIndex) ?? null
        const sourceDate = showUpdated
          ? safeDate(article.updatedAt) ?? safeDate(article.createdAt)
          : safeDate(article.createdAt)
        const dateLabel = sourceDate
          ? sourceDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : "—"

        return (
          <div
            key={article.id}
            style={{ height: LANE_HEIGHT, position: "relative" }}
            className={cn(
              "group flex cursor-pointer items-start gap-2 px-3 py-1.5 transition-colors",
              isSelected || isActive
                ? "bg-secondary/60"
                : isHovered
                  ? "bg-secondary/40"
                  : "hover:bg-secondary/30",
            )}
            onMouseEnter={() => {
              setHoveredId(article.id)
              setTooltip({ id: article.id, laneIndex, x: LABEL_COL_WIDTH })
            }}
            onMouseLeave={() => {
              setHoveredId(null)
              setTooltip(null)
            }}
            onClick={(e) => {
              onOpenArticle(article.id)
              onSelect(article.id, { multi: e.metaKey || e.ctrlKey, shift: e.shiftKey, index: laneIndex })
            }}
          >
            {groupStart && (
              <div
                aria-hidden
                className="pointer-events-none absolute -top-2 left-0 right-0 flex items-center gap-1.5 px-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80"
                style={{ height: 16 }}
              >
                <span className="text-foreground/70">{groupStart.label}</span>
                <span className="tabular-nums">{groupStart.count}</span>
                <span className="ml-1 h-px flex-1 bg-border-subtle/60" />
              </div>
            )}
            <span className="shrink-0 mt-0.5" style={{ color }}>
              {renderStatusIcon(article, 13)}
            </span>
            <div className="min-w-0 flex-1 flex flex-col gap-0.5">
              <span
                className={cn(
                  "truncate text-note",
                  isSelected || isActive ? "font-medium text-foreground" : "text-foreground/85",
                )}
                style={{ maxWidth: LABEL_COL_WIDTH - 48 }}
                title={article.title || "Untitled"}
              >
                {article.title || "Untitled"}
              </span>
              <span className="text-2xs text-muted-foreground tabular-nums">
                {dateLabel}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
