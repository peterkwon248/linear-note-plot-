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

import {
  Plus,
  Pencil as PencilSimple,
  Eye,
  Trash2 as Trash,
  RotateCcw as ArrowCounterClockwise,
  Link as LinkSimple,
  Unlink as LinkBreak,
  Layers as StackPlus,
  Layers as StackMinus,
  ArrowLeftRight as ArrowsLeftRight,
  Paperclip,
  Merge as ArrowsMerge,
  Split as ArrowsSplit,
  Scissors,
  FoldVertical as ArrowsInLineVertical,
  Circle as DotOutline,
} from "lucide-react"
import { NOTE_STATUS_HEX } from "@/lib/colors"
import type { WikiArticle, EntityEventType } from "@/lib/types"
import type { LucideIcon as Icon } from "lucide-react"

/* ── Types ───────────────────────────────────────────────── */

export type ZoomLevel = "week" | "month" | "quarter" | "year"
/** All timeline modes — the 4 fixed zooms + the data-fitted "all" overview. */
export type TimelineMode = ZoomLevel | "all"

/* ── Zoom config ─────────────────────────────────────────── */

export interface ZoomConfig {
  label: string
  /** Pixels per calendar day — drives horizontal canvas width (no viewport-fit). */
  pxPerDay: number
  /** Total days the canvas covers (for windowStart/End calculation). */
  totalDays: number
  /** Minimum bar width (px) — proportional to pxPerDay to avoid info distortion. */
  minBarWidth: number
  formatTick: (d: Date) => string
}

export const ZOOM_CONFIGS: Record<ZoomLevel, ZoomConfig> = {
  week: {
    label: "Week",
    pxPerDay: 80,
    totalDays: 14,
    minBarWidth: 24,
    formatTick: (d) =>
      d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
  },
  month: {
    label: "Month",
    pxPerDay: 32,
    totalDays: 60,
    minBarWidth: 18,
    formatTick: (d) =>
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  },
  quarter: {
    label: "Quarter",
    pxPerDay: 10,
    totalDays: 120,
    minBarWidth: 12,
    formatTick: (d) =>
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  },
  year: {
    label: "Year",
    pxPerDay: 3,
    totalDays: 400,
    minBarWidth: 8,
    formatTick: (d) =>
      d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
  },
}

/** Mode buttons in the controls bar, in order. */
export const TIMELINE_MODES: { mode: TimelineMode; label: string }[] = [
  { mode: "week", label: "Week" },
  { mode: "month", label: "Month" },
  { mode: "quarter", label: "Quarter" },
  { mode: "year", label: "Year" },
  { mode: "all", label: "All" },
]

/* ── Tick step (collision avoidance) ────────────────────── */

export const TICK_STEP_DAYS: Record<ZoomLevel, number> = {
  week: 1,
  month: 7,
  quarter: 14,
  year: 30,
}

/* ── Constants ───────────────────────────────────────────── */

export const LANE_HEIGHT = 52
/** Bar thickness — a thin line; event chips are larger and visually dominate. */
export const BAR_HEIGHT = 5
export const BAR_RADIUS = 8
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
  created:    { icon: Plus,                  color: NOTE_STATUS_HEX.done,      label: "Created" },
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
  // Composition (wiki article structure)
  merged:    { icon: ArrowsMerge, color: "#ec4899", label: "Merged" },
  unmerged:  { icon: ArrowsSplit, color: "#ec4899", label: "Unmerged" },
  split:     { icon: Scissors,    color: "#ec4899", label: "Split" },
  // Section
  section_collapsed: { icon: ArrowsInLineVertical, color: "var(--muted-foreground)", label: "Section collapsed" },
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

/** Y offset from the bar centerline (0 = centered on the bar; negative = above) */
export const EVENT_MARKER_Y_OFFSET = 0

/** Per-event horizontal offset when stacking same-day events (> chip diameter so white borders don't merge) */
export const EVENT_MARKER_STACK_GAP = 18

/** Max markers per day before showing +N overflow */
export const EVENT_MARKER_MAX_PER_DAY = 4

/* ── Generic entity timeline contracts (2026-05-24) ─────────
 *
 * The wiki timeline originally hard-wired WikiArticle everywhere. Notes
 * and Books now share the same bars-first layout, so the sub-components
 * accept a generic `TimelineEntity` (id/title/createdAt/updatedAt) plus
 * an `EntityTimelineAdapter` that maps entity-specific concepts (status
 * silhouette, lifespan horizon, event lookup ref) into a uniform API.
 *
 * Wiki keeps its rich behavior via WikiAdapter (default for WikiTimelineView).
 * Notes/Books adapters opt out of drag (no plannedDate) and pick their own
 * status icon set (Stone/Brick/Block + Smart/Hybrid/Manual). */

import type { ReactNode } from "react"
import type { EntityRef } from "@/lib/types"

export interface TimelineEntity {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface EntityTimelineAdapter<T extends TimelineEntity> {
  /** Lifespan end date: bar spans [createdAt, horizon]. For wiki this is
   *  `getHorizon(article)` (plannedDate ?? updatedAt ?? createdAt). For
   *  notes/books, just `new Date(updatedAt)`. Return null to drop the
   *  entity from the timeline (no valid horizon). */
  getHorizon: (entity: T) => Date | null
  /** Stable status key (e.g. "stub"/"article", "backlog"/"todo"/"in_progress"/"done",
   *  "smart"/"hybrid"/"manual"). Used as the React key for status-tinted
   *  styling. */
  getStatusKey: (entity: T) => string
  /** Status text color (CSS color string) for the bar + label-column icon. */
  getStatusColor: (entity: T) => string
  /** Status silhouette icon, sized for the label column (13px default). */
  renderStatusIcon: (entity: T, size?: number) => ReactNode
  /** Human label for the status in tooltips ("Stub", "Block", "Smart book"). */
  getStatusLabel: (entity: T) => string
  /** Entity reference for `getEventsForEntity(entityEvents, …)` lookup.
   *  Wiki = { kind: "wiki", id }, Notes = { kind: "note", id }, etc. */
  getEntityRef: (entity: T) => EntityRef
  /** Optional: drag-to-set lifespan end (only wiki supports plannedDate
   *  today). Omit to render bars as read-only. */
  setHorizonDate?: (id: string, isoDate: string) => void
}

/* ── Placed entity (one row per entity, single bar) ─────────
 * Generic over T extends TimelineEntity. WikiTimelineView aliases this
 * as LanedArticle<WikiArticle> for source compatibility. */

export interface LanedItem<T extends TimelineEntity> {
  article: T
  x: number
  width: number
}

/** PR-Q4 v2 — ghost lane representing a collapsed group. Lane has no
 *  article (and zero width); label column renders it as a clickable
 *  "expand" row, bar/marker layers skip it via the `isCollapsedHeader`
 *  type guard. Same shape footprint as LanedItem so it can sit in the
 *  same lanes array without sub-component prop churn. */
export interface LanedCollapsedHeader {
  isCollapsedHeader: true
  groupKey: string
  label: string
  count: number
  /** x/width kept at 0 — bar layer skips before reading them. Lets
   *  TimelineGrid treat the lane as a regular row for height accounting. */
  x: 0
  width: 0
}

/** Union of article lanes + collapsed-group placeholders. Sub-components
 *  use `"isCollapsedHeader" in lane` (TypeScript narrowing) to branch. */
export type DisplayLane<T extends TimelineEntity> = LanedItem<T> | LanedCollapsedHeader

/** @deprecated Use `LanedItem<WikiArticle>` directly. Kept as a back-compat
 *  alias because sub-components and external callers still type-import it. */
export type LanedArticle = LanedItem<WikiArticle>

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
