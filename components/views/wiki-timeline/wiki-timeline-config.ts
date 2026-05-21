/**
 * WikiTimelineView — bars-first (2026-05-20, design v0.4)
 *
 * v0.4 changes (2026-05-21 — visual depth + affordance):
 *   A1. Weekend column stripe (Sat/Sun subtle dim)
 *   A2. Month boundary lines (stronger opacity vs day ticks)
 *   A3. Row separators already present — opacity tuned
 *   B1. Hover state: hoveredId React state, stroke ring + row bg highlight
 *   B2. Tooltip: richer content — title / status / created + planned relative
 *   B3. Status end shape: stub = rounded bar end, article = solid arrowhead tip
 *   D1. Past vs Future opacity via SVG linearGradient (smooth, single rect)
 *   D2. Planned horizon → dashed tail trailing right; updatedAt → no tail
 *
 * v0.3 (2026-05-21):
 *   - Horizontal scroll + big px-per-day per zoom
 *   - Tick collision avoidance
 *   - "Now" label detached from axis tick row
 *   - MIN_BAR_WIDTH zoom-proportional
 *   - Left label column: sticky left:0
 *   - Axis header: sticky top:0
 *
 * v0.2 (2026-05-20):
 *   - bars-first: all articles = single horizontal bar
 *   - createdAt → horizon (plannedDate ?? updatedAt ?? createdAt)
 *   - title inside bar when wide / outside dot when narrow
 *   - TODAY line subtle + Future stripe dim
 *
 * wiki-timeline-config.ts — pure module-level types + constants + config
 * (no React, no closures). Single source of truth for the timeline modules.
 */

import { Plus } from "@phosphor-icons/react/dist/ssr/Plus"
import { PencilSimple } from "@phosphor-icons/react/dist/ssr/PencilSimple"
import { Eye } from "@phosphor-icons/react/dist/ssr/Eye"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { ArrowCounterClockwise } from "@phosphor-icons/react/dist/ssr/ArrowCounterClockwise"
import { LinkSimple } from "@phosphor-icons/react/dist/ssr/LinkSimple"
import { LinkBreak } from "@phosphor-icons/react/dist/ssr/LinkBreak"
import { StackPlus } from "@phosphor-icons/react/dist/ssr/StackPlus"
import { StackMinus } from "@phosphor-icons/react/dist/ssr/StackMinus"
import { ArrowsLeftRight } from "@phosphor-icons/react/dist/ssr/ArrowsLeftRight"
import { Paperclip } from "@phosphor-icons/react/dist/ssr/Paperclip"
import { DotOutline } from "@phosphor-icons/react/dist/ssr/DotOutline"
import { WIKI_STATUS_HEX } from "@/lib/colors"
import type { WikiArticle, EntityEventType } from "@/lib/types"
import type { Icon } from "@phosphor-icons/react"

/* ── Types ───────────────────────────────────────────────── */

export type ZoomLevel = "week" | "month" | "quarter" | "year"

/* ── Zoom config ─────────────────────────────────────────── */

export interface ZoomConfig {
  label: string
  /** Pixels per calendar day — drives horizontal canvas width (no viewport-fit). */
  pxPerDay: number
  /** Total days the canvas covers (for windowStart/End calculation). */
  totalDays: number
  /** Minimum bar width (px) — proportional to pxPerDay to avoid info distortion. */
  minBarWidth: number
  /** If bar width >= this, render title inside; else outside dot. */
  titleThreshold: number
  formatTick: (d: Date) => string
}

export const ZOOM_CONFIGS: Record<ZoomLevel, ZoomConfig> = {
  week: {
    label: "Week",
    pxPerDay: 80,
    totalDays: 14,
    minBarWidth: 24,
    titleThreshold: 60,
    formatTick: (d) =>
      d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
  },
  month: {
    label: "Month",
    pxPerDay: 32,
    totalDays: 60,
    minBarWidth: 18,
    titleThreshold: 60,
    formatTick: (d) =>
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  },
  quarter: {
    label: "Quarter",
    pxPerDay: 10,
    totalDays: 120,
    minBarWidth: 12,
    titleThreshold: 50,
    formatTick: (d) =>
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  },
  year: {
    label: "Year",
    pxPerDay: 3,
    totalDays: 400,
    minBarWidth: 8,
    titleThreshold: 40,
    formatTick: (d) =>
      d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
  },
}

export const ZOOM_ORDER: ZoomLevel[] = ["week", "month", "quarter", "year"]

/* ── Tick step (collision avoidance) ────────────────────── */

export const TICK_STEP_DAYS: Record<ZoomLevel, number> = {
  week: 1,
  month: 7,
  quarter: 14,
  year: 30,
}

/* ── Constants ───────────────────────────────────────────── */

export const LANE_HEIGHT = 52
export const BAR_HEIGHT = 28
export const BAR_RADIUS = 8
/** Article arrowhead: how far the tip extends past the bar's right edge (px). */
export const ARROW_DEPTH = 9
export const AXIS_HEIGHT = 32
export const LABEL_COL_WIDTH = 200
export const TODAY_LINE_COLOR = "var(--border-strong)"

/**
 * Per-event-type visual config — icon chip (filled ring + Phosphor icon).
 * Markers sit ABOVE the bar centerline.
 * Unknown types fall back to EVENT_MARKER_FALLBACK.
 */

export interface MarkerConfig {
  /** Phosphor icon component (SSR variant) */
  icon: Icon
  /** Type color (used for ring fill) */
  color: string
  /** Human-readable label for tooltip */
  label: string
}

export const EVENT_MARKER_CONFIG: Partial<Record<EntityEventType, MarkerConfig>> = {
  // Lifecycle
  created:    { icon: Plus,                  color: WIKI_STATUS_HEX.article,   label: "Created" },
  updated:    { icon: PencilSimple,          color: "#3b82f6",                  label: "Updated" },
  opened:     { icon: Eye,                   color: "var(--muted-foreground)",  label: "Opened" },
  trashed:    { icon: Trash,                 color: "#ef4444",                  label: "Trashed" },
  untrashed:  { icon: ArrowCounterClockwise, color: "#ef4444",                  label: "Restored" },
  // Wiki granular
  block_added:     { icon: StackPlus,        color: "#10b981", label: "Block added" },
  block_removed:   { icon: StackMinus,       color: "#10b981", label: "Block removed" },
  block_reordered: { icon: ArrowsLeftRight,  color: "#10b981", label: "Block reordered" },
  // Linking
  link_added:   { icon: LinkSimple, color: "#8b5cf6", label: "Link added" },
  link_removed: { icon: LinkBreak,  color: "#8b5cf6", label: "Link removed" },
  // Relations
  relation_added:   { icon: ArrowsLeftRight, color: "#f59e0b", label: "Relation added" },
  relation_removed: { icon: LinkBreak,       color: "#f59e0b", label: "Relation removed" },
  // Attachments
  attachment_added:   { icon: Paperclip, color: "#06b6d4", label: "Attachment added" },
  attachment_removed: { icon: Paperclip, color: "#06b6d4", label: "Attachment removed" },
}

export const EVENT_MARKER_FALLBACK: MarkerConfig = {
  icon: DotOutline,
  color: "var(--muted-foreground)",
  label: "Event",
}

/** Ring radius (visible circle). Icon centered inside. */
export const EVENT_MARKER_RING_R = 7

/** Icon size (Phosphor `size` prop). Roughly ring_r * 1.4 for nice fit. */
export const EVENT_MARKER_ICON_SIZE = 9

/** Y offset above the bar centerline (negative = above) */
export const EVENT_MARKER_Y_OFFSET = -12

/** Per-event horizontal offset when stacking same-day events */
export const EVENT_MARKER_STACK_GAP = 14

/** Max markers per day before showing +N overflow */
export const EVENT_MARKER_MAX_PER_DAY = 4

/* ── Placed article (one row per article, single bar) ───── */

export interface LanedArticle {
  article: WikiArticle
  x: number
  width: number
}

/* ── Shared React state shapes (kept here so sub-components type props
 *    without React/closure dependencies) ─────────────────────────── */

/** Article hover tooltip anchor state. */
export interface TimelineTooltipState {
  id: string
  laneIndex: number
  x: number
}

/** Event marker hover tooltip state. */
export interface TimelineEventTooltipState {
  laneIndex: number
  x: number
  dateLabel: string
  labels: string[]
  count: number
}

/** Live drag state for adjusting an article's planned-date bar end. */
export interface TimelineDragState {
  id: string
  pointerId: number
  startClientX: number
  originalEndX: number
  currentEndX: number
}
