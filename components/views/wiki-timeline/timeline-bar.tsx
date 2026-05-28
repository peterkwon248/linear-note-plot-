"use client"

/**
 * timeline-bar.tsx — a single article bar (one lane row). Extracted from
 * WikiTimelineView's `renderLaneBar` render function; all closed-over values
 * and setters are now explicit props.
 */

import type { Dispatch, SetStateAction } from "react"
import {
  LANE_HEIGHT,
  BAR_HEIGHT,
  BAR_RADIUS,
  type LanedItem,
  type TimelineEntity,
  type TimelineTooltipState,
  type TimelineDragState,
} from "./wiki-timeline-config"

export interface TimelineBarProps {
  // PR-Q4 v2: accept ghost lanes too so wiki-timeline-view can inject
  // collapsed-group placeholders. We narrow at the top of the component.
  item: LanedItem<TimelineEntity> | { isCollapsedHeader: true; groupKey: string; label: string; count: number; x: 0; width: 0 }
  /** Bar fill color from the entity adapter (e.g. WIKI_STATUS_HEX.stub for
   *  wiki stubs, NOTE_STATUS_HEX.backlog for notes, etc.). Caller resolves
   *  the status → color mapping so this component stays entity-agnostic. */
  statusColor: string
  /** When true, render the drag handle that lets the user extend the bar's
   *  end date (wiki plannedDate). Notes/Books opt out — their lifespan
   *  ends at updatedAt and isn't user-editable from the timeline. */
  canEditHorizon?: boolean
  laneIndex: number
  activeArticleId: string | null
  selectedIds: Set<string>
  hoveredId: string | null
  dragState: TimelineDragState | null
  nowX: number
  canvasWidth: number
  setHoveredId: Dispatch<SetStateAction<string | null>>
  setTooltip: Dispatch<SetStateAction<TimelineTooltipState | null>>
  setDragState: Dispatch<SetStateAction<TimelineDragState | null>>
  onOpenArticle: (id: string) => void
  onSelect: (id: string, opts: { multi?: boolean; shift?: boolean; index?: number }) => void
}

export function TimelineBar({
  item,
  statusColor,
  canEditHorizon = false,
  laneIndex,
  activeArticleId,
  selectedIds,
  hoveredId,
  dragState,
  nowX,
  canvasWidth,
  setHoveredId,
  setTooltip,
  setDragState,
  onOpenArticle,
  onSelect,
}: TimelineBarProps) {
  // PR-Q4 v2: ghost lanes (collapsed-group headers) carry no article.
  // Skip — label column renders the row, this layer just yields its slot.
  if ("isCollapsedHeader" in item) return null
  const { article, x, width } = item
  const isActive = article.id === activeArticleId
  const isSelected = selectedIds.has(article.id)
  const isHovered = article.id === hoveredId
  const isDragging = dragState?.id === article.id
  /** Line color = the status icon's color (resolved by the entity adapter). */
  const color = statusColor
  const cy = laneIndex * LANE_HEIGHT + LANE_HEIGHT / 2
  const barY = cy - BAR_HEIGHT / 2

  /** Live end/width during drag; else use static computed values */
  const liveEndX = isDragging ? dragState!.currentEndX : x + width
  const liveWidth = liveEndX - x

  return (
    <g
      style={{ cursor: "pointer" }}
      onClick={(e) => {
        if (isDragging) return
        e.stopPropagation()
        onOpenArticle(article.id)
        onSelect(article.id, { multi: e.metaKey || e.ctrlKey, shift: e.shiftKey, index: laneIndex })
      }}
      onMouseEnter={() => {
        setHoveredId(article.id)
        setTooltip({ id: article.id, laneIndex, x })
      }}
      onMouseLeave={() => {
        if (dragState?.id === article.id) return  // keep tooltip during drag
        setHoveredId(null)
        setTooltip(null)
      }}
      role="button"
      aria-label={article.title}
    >
      {/* B1: Row hover bg highlight (full width behind bar row) */}
      {(isHovered || isDragging) && (
        <rect
          x={0}
          y={laneIndex * LANE_HEIGHT}
          width={Math.max(canvasWidth, 400)}
          height={LANE_HEIGHT}
          fill="var(--muted)"
          opacity={0.12}
        />
      )}

      {/* Selection / active outline */}
      {(isSelected || isActive) && (
        <rect
          x={x - 2}
          y={barY - 2}
          width={liveWidth + 4}
          height={BAR_HEIGHT + 4}
          rx={BAR_RADIUS + 2}
          fill="none"
          stroke="var(--foreground)"
          strokeWidth={1.5}
          opacity={0.55}
        />
      )}

      {/* Main bar — single solid status color (2026-05-24: dropped the D1
          past/future opacity gradient — only wiki bars showed the future-
          half tint because notes/books horizon = updatedAt is always past,
          so the gradient produced inconsistent bar tone across entities.
          Single fill matches notes/books appearance and reads cleaner. */}
      <rect
        x={x}
        y={barY}
        width={liveWidth}
        height={BAR_HEIGHT}
        rx={BAR_RADIUS}
        fill={color}
      />

      {/* B1: Hover ring */}
      {isHovered && !isSelected && !isActive && (
        <rect
          x={x - 1}
          y={barY - 1}
          width={liveWidth + 2}
          height={BAR_HEIGHT + 2}
          rx={BAR_RADIUS + 1}
          fill="none"
          stroke="var(--ring, var(--foreground))"
          strokeWidth={1}
          opacity={0.5}
        />
      )}

      {/* Grab handle: hit zone over the bar's right edge (taller than the line
          for grabbability). Only rendered when the adapter exposes an
          editable horizon (wiki plannedDate). */}
      {canEditHorizon && (
        <rect
          x={liveEndX - 6}
          y={cy - 9}
          width={12}
          height={18}
          fill="transparent"
          style={{ cursor: "ew-resize", pointerEvents: "all" }}
          onPointerDown={(e) => {
            e.stopPropagation()
            e.preventDefault()
            setDragState({
              id: article.id,
              pointerId: e.pointerId,
              startClientX: e.clientX,
              originalEndX: x + width,
              currentEndX: x + width,
            })
          }}
        />
      )}

      {/* Visible affordance: subtle vertical hint on hover or drag */}
      {(isHovered || isDragging) && (
        <line
          x1={liveEndX}
          y1={cy - 6}
          x2={liveEndX}
          y2={cy + 6}
          stroke="var(--foreground)"
          strokeWidth={2}
          opacity={isDragging ? 0.9 : 0.55}
          style={{ pointerEvents: "none" }}
        />
      )}
    </g>
  )
}
