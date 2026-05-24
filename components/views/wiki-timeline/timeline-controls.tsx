"use client"

/**
 * timeline-controls.tsx — the controls bar (prev/next, period label,
 * Events toggle, mode segmented control). Extracted from WikiTimelineView.
 */

import { ChevronLeft as CaretLeft, ChevronRight as CaretRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { periodLabel } from "./wiki-timeline-utils"
import { TIMELINE_MODES, type TimelineMode } from "./wiki-timeline-config"

export interface TimelineControlsProps {
  zoom: TimelineMode
  anchor: Date
  showEvents: boolean
  onNavigate: (dir: -1 | 1) => void
  onGoToToday: () => void
  onSetZoom: (z: TimelineMode) => void
  onToggleEvents: () => void
  /** PR-Q4: number of currently collapsed groups. When > 0 a small
   *  "Expand all" affordance appears in the controls bar — without it a
   *  user could collapse every group and lose the discoverability of how
   *  to bring them back. */
  collapsedGroupCount?: number
  onExpandAllGroups?: () => void
}

export function TimelineControls({
  zoom,
  anchor,
  showEvents,
  onNavigate,
  onGoToToday,
  onSetZoom,
  onToggleEvents,
  collapsedGroupCount = 0,
  onExpandAllGroups,
}: TimelineControlsProps) {
  // "All" fits the whole span — there is no period to navigate.
  const navDisabled = zoom === "all"

  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-border-subtle px-4 py-2">
      <button
        onClick={() => onNavigate(-1)}
        disabled={navDisabled}
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors",
          navDisabled ? "opacity-30" : "hover:bg-secondary hover:text-foreground",
        )}
        aria-label="Previous period"
      >
        <CaretLeft size={12} strokeWidth={2.5} />
      </button>

      <button
        onClick={onGoToToday}
        disabled={navDisabled}
        className={cn(
          "min-w-[140px] text-center text-sm font-medium text-foreground transition-colors",
          navDisabled ? "opacity-50" : "hover:text-foreground/80",
        )}
        title={navDisabled ? undefined : "Click to return to today"}
      >
        {periodLabel(anchor, zoom)}
      </button>

      <button
        onClick={() => onNavigate(1)}
        disabled={navDisabled}
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors",
          navDisabled ? "opacity-30" : "hover:bg-secondary hover:text-foreground",
        )}
        aria-label="Next period"
      >
        <CaretRight size={12} strokeWidth={2.5} />
      </button>

      <div className="flex-1" />

      {/* PR-Q4: only render when at least one group is collapsed. */}
      {collapsedGroupCount > 0 && onExpandAllGroups && (
        <button
          onClick={onExpandAllGroups}
          className="rounded px-2 py-0.5 text-2xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          title={`Expand ${collapsedGroupCount} collapsed group${collapsedGroupCount === 1 ? "" : "s"}`}
        >
          Expand all
        </button>
      )}

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
        {TIMELINE_MODES.map(({ mode, label }) => (
          <button
            key={mode}
            onClick={() => onSetZoom(mode)}
            className={cn(
              "rounded px-2 py-0.5 transition-colors",
              zoom === mode
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
