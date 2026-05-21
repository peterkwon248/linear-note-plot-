"use client"

/**
 * timeline-axis.tsx — the sticky axis header (corner cell + tick SVG +
 * "Now" label). Extracted from WikiTimelineView's main render.
 */

import { diffDays } from "./wiki-timeline-utils"
import {
  AXIS_HEIGHT,
  LABEL_COL_WIDTH,
  type ZoomConfig,
} from "./wiki-timeline-config"

export interface TimelineAxisProps {
  ticks: Date[]
  cfg: ZoomConfig
  winStart: Date
  canvasWidth: number
  nowX: number
}

export function TimelineAxis({
  ticks,
  cfg,
  winStart,
  canvasWidth,
  nowX,
}: TimelineAxisProps) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        height: AXIS_HEIGHT,
        background: "var(--bg, var(--background))",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        width: LABEL_COL_WIDTH + Math.max(canvasWidth, 400),
      }}
    >
      {/* Corner cell */}
      <div
        style={{
          width: LABEL_COL_WIDTH,
          height: AXIS_HEIGHT,
          position: "sticky",
          left: 0,
          zIndex: 30,
          background: "var(--bg, var(--background))",
          borderRight: "1px solid var(--border)",
          flexShrink: 0,
        }}
      />
      {/* Tick SVG */}
      <svg
        width={Math.max(canvasWidth, 400)}
        height={AXIS_HEIGHT}
        className="block select-none"
        style={{ flexShrink: 0 }}
      >
        {ticks.map((tick, i) => {
          const tx = diffDays(tick, winStart) * cfg.pxPerDay
          if (tx < -4 || tx > canvasWidth + 4) return null
          return (
            <g key={i} transform={`translate(${tx}, 0)`}>
              <line
                x1={0}
                y1={AXIS_HEIGHT - 6}
                x2={0}
                y2={AXIS_HEIGHT}
                stroke="var(--border)"
                strokeWidth={1}
              />
              {(() => {
                const isMonthStart = tick.getDate() === 1
                return (
                  <text
                    x={0}
                    y={AXIS_HEIGHT - 10}
                    textAnchor="middle"
                    fill={isMonthStart ? "var(--fg, var(--foreground))" : "var(--muted-foreground)"}
                    className="select-none text-2xs"
                    style={{ fontWeight: isMonthStart ? 600 : 400, opacity: isMonthStart ? 1 : 0.85 }}
                  >
                    {cfg.formatTick(tick)}
                  </text>
                )
              })()}
            </g>
          )
        })}
        {nowX >= 0 && nowX <= canvasWidth && (
          <text
            x={nowX + 6}
            y={AXIS_HEIGHT - 10}
            textAnchor="start"
            fill="var(--fg, var(--foreground))"
            className="select-none text-2xs"
            style={{ fontWeight: 700, letterSpacing: "0.02em" }}
          >
            Now
          </text>
        )}
      </svg>
    </div>
  )
}
