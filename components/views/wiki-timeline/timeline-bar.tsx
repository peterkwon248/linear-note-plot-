"use client"

/**
 * timeline-bar.tsx — a single article bar (one lane row). Extracted from
 * WikiTimelineView's `renderLaneBar` render function; all closed-over values
 * and setters are now explicit props.
 */

import type { Dispatch, SetStateAction } from "react"
import { isWikiStub } from "@/lib/wiki-utils"
import { WIKI_STATUS_HEX } from "@/lib/colors"
import {
  LANE_HEIGHT,
  BAR_HEIGHT,
  BAR_RADIUS,
  type ZoomConfig,
  type LanedArticle,
  type TimelineTooltipState,
  type TimelineDragState,
} from "./wiki-timeline-config"

export interface TimelineBarProps {
  item: LanedArticle
  laneIndex: number
  activeArticleId: string | null
  selectedIds: Set<string>
  hoveredId: string | null
  dragState: TimelineDragState | null
  cfg: ZoomConfig
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
  laneIndex,
  activeArticleId,
  selectedIds,
  hoveredId,
  dragState,
  cfg,
  nowX,
  canvasWidth,
  setHoveredId,
  setTooltip,
  setDragState,
  onOpenArticle,
  onSelect,
}: TimelineBarProps) {
  const { article, x, width } = item
  const stub = isWikiStub(article)
  const isActive = article.id === activeArticleId
  const isSelected = selectedIds.has(article.id)
  const isHovered = article.id === hoveredId
  const isDragging = dragState?.id === article.id
  const color = stub ? WIKI_STATUS_HEX.stub : WIKI_STATUS_HEX.article
  const cy = laneIndex * LANE_HEIGHT + LANE_HEIGHT / 2
  const barY = cy - BAR_HEIGHT / 2

  /** Live end/width during drag; else use static computed values */
  const liveEndX = isDragging ? dragState!.currentEndX : x + width
  const liveWidth = liveEndX - x

  const titleInside = liveWidth >= cfg.titleThreshold
  const titleLabel = article.title || "Untitled"

  /** D1: gradient id for past→future opacity split */
  const gradId = `grad-${article.id}`

  /** D1: nowX relative to bar start, clamped 0..1 (use liveWidth) */
  const gradStop = (() => {
    if (nowX <= x) return 0           // entire bar is future
    if (nowX >= liveEndX) return 1    // entire bar is past
    return (nowX - x) / liveWidth     // partial split
  })()

  /** Outside-title x — sits just right of the bar's end. */
  const outsideTitleX = liveEndX + 6

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
      {/* D1: Past→Future gradient definition + vertical highlight */}
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset={`${gradStop * 100}%`} stopColor={color} stopOpacity={0.78} />
          <stop offset={`${gradStop * 100}%`} stopColor={color} stopOpacity={1.0} />
        </linearGradient>
        {/* Vertical highlight gradient — top white-ish, fade to transparent at 50% */}
        <linearGradient id={`${gradId}-vh`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity={0.14} />
          <stop offset="50%" stopColor="white" stopOpacity={0} />
        </linearGradient>
      </defs>

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
          stroke={color}
          strokeWidth={1.5}
          opacity={0.55}
        />
      )}

      {/* Main bar — D1 gradient fill + drop shadow */}
      <rect
        x={x}
        y={barY}
        width={liveWidth}
        height={BAR_HEIGHT}
        rx={BAR_RADIUS}
        fill={`url(#${gradId})`}
        filter="url(#bar-shadow)"
      />

      {/* Vertical highlight overlay — 3D depth (top catches "light") */}
      <rect
        x={x}
        y={barY}
        width={liveWidth}
        height={BAR_HEIGHT}
        rx={BAR_RADIUS}
        fill={`url(#${gradId}-vh)`}
        pointerEvents="none"
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

      {/* Inside title — clipped to bar width */}
      {titleInside && (
        <>
          <clipPath id={`clip-bar-${article.id}`}>
            <rect x={x + 6} y={barY} width={liveWidth - 12} height={BAR_HEIGHT} />
          </clipPath>
          <text
            x={x + 8}
            y={cy + 4}
            fill="white"
            opacity={0.95}
            clipPath={`url(#clip-bar-${article.id})`}
            className="select-none pointer-events-none text-2xs"
            style={{ fontWeight: 500 }}
          >
            {titleLabel}
          </text>
        </>
      )}

      {/* Outside title — sits right of the bar when it's too narrow for an inside title */}
      {!titleInside && (
        <text
          x={outsideTitleX}
          y={cy + 4}
          fill="var(--muted-foreground)"
          opacity={0.85}
          className="select-none pointer-events-none text-2xs"
          style={{ fontWeight: 500 }}
        >
          {titleLabel}
        </text>
      )}

      {/* Grab handle: hit zone over the bar's right edge */}
      <rect
        x={liveEndX - 6}
        y={barY - 2}
        width={12}
        height={BAR_HEIGHT + 4}
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

      {/* Visible affordance: subtle vertical hint on hover or drag */}
      {(isHovered || isDragging) && (
        <line
          x1={liveEndX}
          y1={barY + 3}
          x2={liveEndX}
          y2={barY + BAR_HEIGHT - 3}
          stroke={color}
          strokeWidth={2}
          opacity={isDragging ? 0.9 : 0.55}
          style={{ pointerEvents: "none" }}
        />
      )}
    </g>
  )
}
