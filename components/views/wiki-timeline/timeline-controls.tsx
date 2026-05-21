"use client"

/**
 * timeline-controls.tsx — the controls bar (prev/next, period label,
 * Events toggle, zoom segmented control). Extracted from WikiTimelineView.
 */

import { CaretLeft } from "@phosphor-icons/react/dist/ssr/CaretLeft"
import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight"
import { cn } from "@/lib/utils"
import { periodLabel } from "./wiki-timeline-utils"
import { ZOOM_ORDER, ZOOM_CONFIGS, type ZoomLevel } from "./wiki-timeline-config"

export interface TimelineControlsProps {
  zoom: ZoomLevel
  anchor: Date
  showEvents: boolean
  onNavigate: (dir: -1 | 1) => void
  onGoToToday: () => void
  onSetZoom: (z: ZoomLevel) => void
  onToggleEvents: () => void
}

export function TimelineControls({
  zoom,
  anchor,
  showEvents,
  onNavigate,
  onGoToToday,
  onSetZoom,
  onToggleEvents,
}: TimelineControlsProps) {
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-border-subtle px-4 py-2">
      <button
        onClick={() => onNavigate(-1)}
        className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        aria-label="Previous period"
      >
        <CaretLeft size={12} weight="bold" />
      </button>

      <button
        onClick={onGoToToday}
        className="min-w-[140px] text-center text-sm font-medium text-foreground hover:text-foreground/80 transition-colors"
        title="Click to return to today"
      >
        {periodLabel(anchor, zoom)}
      </button>

      <button
        onClick={() => onNavigate(1)}
        className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        aria-label="Next period"
      >
        <CaretRight size={12} weight="bold" />
      </button>

      <div className="flex-1" />

      <button
        onClick={onToggleEvents}
        className={cn(
          "rounded px-2 py-0.5 text-2xs transition-colors",
          showEvents
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
        title={showEvents ? "Hide event markers" : "Show event markers"}
      >
        Events
      </button>

      <div className="h-4 w-px bg-border-subtle" />

      <div className="flex items-center gap-0.5 rounded-md border border-border-subtle p-0.5 text-2xs">
        {ZOOM_ORDER.map((z) => (
          <button
            key={z}
            onClick={() => onSetZoom(z)}
            className={cn(
              "rounded px-2 py-0.5 transition-colors",
              zoom === z
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {ZOOM_CONFIGS[z].label}
          </button>
        ))}
      </div>
    </div>
  )
}
