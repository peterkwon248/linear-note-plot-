"use client"

/**
 * timeline-grid.tsx — static SVG background layers rendered inside the canvas
 * <svg>: bar-shadow filter <defs>, weekend stripes, today tint, grid lines,
 * month boundaries, lane separators, future stripe, and the NOW line + dot.
 * Extracted from WikiTimelineView's main render.
 */

import { diffDays, startOfDay } from "./wiki-timeline-utils"
import {
  LANE_HEIGHT,
  TODAY_LINE_COLOR,
  type ZoomConfig,
  type LanedArticle,
} from "./wiki-timeline-config"

export interface TimelineGridProps {
  allDays: Date[]
  ticks: Date[]
  monthBoundaries: Date[]
  lanes: LanedArticle[]
  cfg: ZoomConfig
  winStart: Date
  canvasWidth: number
  svgHeight: number
  nowX: number
  now: Date
}

export function TimelineGrid({
  allDays,
  ticks,
  monthBoundaries,
  lanes,
  cfg,
  winStart,
  canvasWidth,
  svgHeight,
  nowX,
  now,
}: TimelineGridProps) {
  return (
    <>
      {/* ── Global defs: bar drop-shadow filter ── */}
      <defs>
        <filter id="bar-shadow" x="-5%" y="-50%" width="110%" height="200%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="1" floodColor="#000" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* ── A1: Weekend column stripes (Sat=6, Sun=0) ── */}
      {allDays.map((day, i) => {
        const dow = day.getDay()
        if (dow !== 0 && dow !== 6) return null
        const dx = diffDays(day, winStart) * cfg.pxPerDay
        if (dx + cfg.pxPerDay < 0 || dx > canvasWidth) return null
        return (
          <rect
            key={`weekend-${i}`}
            x={dx}
            y={0}
            width={cfg.pxPerDay}
            height={svgHeight}
            fill="var(--muted)"
            opacity={0.04}
          />
        )
      })}

      {/* ── Today column tint — soft accent on the current day's column ── */}
      {(() => {
        const today = startOfDay(now)
        const todayX = diffDays(today, winStart) * cfg.pxPerDay
        if (todayX + cfg.pxPerDay < 0 || todayX > canvasWidth) return null
        return (
          <rect
            x={todayX}
            y={0}
            width={cfg.pxPerDay}
            height={svgHeight}
            fill="var(--fg, var(--foreground))"
            opacity={0.04}
            pointerEvents="none"
          />
        )
      })()}

      {/* ── Vertical grid lines (tick positions, day ticks) ── */}
      {ticks.map((tick, i) => {
        const tx = diffDays(tick, winStart) * cfg.pxPerDay
        if (tx < -4 || tx > canvasWidth + 4) return null
        return (
          <line
            key={`grid-${i}`}
            x1={tx}
            y1={0}
            x2={tx}
            y2={svgHeight}
            stroke="var(--border)"
            strokeWidth={0.5}
            opacity={0.25}
          />
        )
      })}

      {/* ── A2: Month boundary lines (stronger than day ticks) ── */}
      {monthBoundaries.map((mb, i) => {
        const mx = diffDays(mb, winStart) * cfg.pxPerDay
        if (mx < -4 || mx > canvasWidth + 4) return null
        return (
          <line
            key={`month-${i}`}
            x1={mx}
            y1={0}
            x2={mx}
            y2={svgHeight}
            stroke="var(--border)"
            strokeWidth={1}
            opacity={0.5}
          />
        )
      })}

      {/* ── A3: Horizontal lane separator lines ── */}
      {lanes.map((_, laneIndex) => (
        <line
          key={`lane-sep-${laneIndex}`}
          x1={0}
          y1={(laneIndex + 1) * LANE_HEIGHT}
          x2={Math.max(canvasWidth, 400)}
          y2={(laneIndex + 1) * LANE_HEIGHT}
          stroke="var(--border)"
          strokeWidth={0.5}
          opacity={0.15}
        />
      ))}

      {/* Future zone dim stripe (now → right edge) */}
      {nowX < canvasWidth && (
        <rect
          x={Math.max(nowX, 0)}
          y={0}
          width={canvasWidth - Math.max(nowX, 0)}
          height={svgHeight}
          fill="var(--muted)"
          opacity={0.06}
        />
      )}

      {/* NOW vertical line + top anchor dot */}
      {nowX >= 0 && nowX <= canvasWidth && (
        <g>
          <line
            x1={nowX}
            y1={0}
            x2={nowX}
            y2={svgHeight}
            stroke={TODAY_LINE_COLOR}
            strokeWidth={1.2}
            opacity={0.85}
          />
          {/* Top anchor dot — visual confidence at top of Now line */}
          <circle
            cx={nowX}
            cy={4}
            r={3.5}
            fill="var(--fg, var(--foreground))"
            opacity={0.9}
          />
        </g>
      )}
    </>
  )
}
