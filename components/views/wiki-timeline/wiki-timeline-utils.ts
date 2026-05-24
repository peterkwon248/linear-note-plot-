/**
 * wiki-timeline-utils.ts — pure module-level date/layout helpers for the
 * bars-first WikiTimelineView. No React, no closures.
 */

import { safeDate } from "@/lib/wiki-utils"
import {
  ZOOM_CONFIGS,
  TICK_STEP_DAYS,
  type ZoomLevel,
  type TimelineMode,
  type ZoomConfig,
  type LanedItem,
  type TimelineEntity,
} from "./wiki-timeline-config"

/* ── Utilities ───────────────────────────────────────────── */

export function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export function diffDays(a: Date, b: Date): number {
  return (a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24)
}

export function windowStart(anchor: Date, zoom: ZoomLevel): Date {
  const half = Math.floor(ZOOM_CONFIGS[zoom].totalDays / 2)
  return startOfDay(addDays(anchor, -half))
}

/** Adaptive tick spacing for "all" mode — aims for ~10 ticks across the span. */
function adaptiveTickStep(spanDays: number): number {
  const target = spanDays / 10
  for (const s of [1, 2, 3, 7, 14, 30, 60, 90, 180, 365]) {
    if (s >= target) return s
  }
  return 365
}

export function buildTicks(start: Date, end: Date, zoom: TimelineMode): Date[] {
  const ticks: Date[] = []

  if (zoom === "year") {
    let cur = new Date(start.getFullYear(), start.getMonth(), 1)
    while (cur <= end) {
      ticks.push(new Date(cur))
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
    }
  } else if (zoom === "month") {
    let cur = startOfDay(start)
    const dayOfWeek = cur.getDay()
    const daysToMonday = dayOfWeek === 1 ? 0 : ((8 - dayOfWeek) % 7)
    cur = addDays(cur, daysToMonday)
    while (cur <= end) {
      ticks.push(new Date(cur))
      cur = addDays(cur, 7)
    }
  } else {
    let cur = startOfDay(start)
    const stepDays =
      zoom === "all" ? adaptiveTickStep(diffDays(end, start)) : TICK_STEP_DAYS[zoom]
    while (cur <= end) {
      ticks.push(new Date(cur))
      cur = addDays(cur, stepDays)
    }
  }
  return ticks
}

/** Build one date-per-day for weekend stripe calculation (A1). */
export function buildDayRange(start: Date, end: Date): Date[] {
  const days: Date[] = []
  let cur = startOfDay(start)
  while (cur <= end) {
    days.push(new Date(cur))
    cur = addDays(cur, 1)
  }
  return days
}

/** Build 1st-of-each-month within range for A2 boundary lines. */
export function buildMonthBoundaries(start: Date, end: Date): Date[] {
  const months: Date[] = []
  let cur = new Date(start.getFullYear(), start.getMonth(), 1)
  // skip if exactly == start (would overlap first tick)
  if (cur < start) cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
  while (cur <= end) {
    months.push(new Date(cur))
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
  }
  return months
}

/* ── Header period label ─────────────────────────────────── */

export function periodLabel(anchor: Date, zoom: TimelineMode): string {
  switch (zoom) {
    case "week":
      return anchor.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    case "month":
      return anchor.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    case "quarter": {
      const q = Math.floor(anchor.getMonth() / 3) + 1
      return `Q${q} ${anchor.getFullYear()}`
    }
    case "year":
      return String(anchor.getFullYear())
    case "all":
      return "All"
  }
}

/* ── Relative date label (for tooltip) ──────────────────── */

export function relativeDateLabel(date: Date, now: Date): string {
  const diff = Math.round(diffDays(date, now))
  if (diff === 0) return "today"
  if (diff === 1) return "tomorrow"
  if (diff === -1) return "yesterday"
  if (diff > 0) return `in ${diff} day${diff !== 1 ? "s" : ""}`
  return `${Math.abs(diff)} day${Math.abs(diff) !== 1 ? "s" : ""} ago`
}

/* ── Placed entity (one row per entity, single bar) ───── */

/** Lay out timeline bars. Generic over the entity type — the caller supplies
 *  `getHorizon(entity) → Date | null` so wiki (plannedDate ?? updatedAt ??
 *  createdAt), notes (updatedAt), and books (updatedAt) all funnel through
 *  the same layout math without baking entity types into the helper. */
export function laneArticles<T extends TimelineEntity>(
  entities: T[],
  winStart: Date,
  pxPerDay: number,
  minBarWidth: number,
  getHorizon: (entity: T) => Date | null,
): LanedItem<T>[] {
  return entities
    .map((a) => {
      const created = safeDate(a.createdAt)
      const horizon = getHorizon(a)
      if (!created || !horizon) return null
      // Day-quantized: the bar spans whole day cells [createdDay … horizonDay]
      // so it shares the day grid with event markers (placed at day-cell centers).
      // Exact timestamps would drift the bar off the marker grid.
      const startDayIdx = Math.round(diffDays(startOfDay(created), winStart))
      const endDayIdx = Math.round(diffDays(startOfDay(horizon), winStart))
      const x = startDayIdx * pxPerDay
      const dayCells = Math.max(endDayIdx - startDayIdx + 1, 1)
      const width = Math.max(dayCells * pxPerDay, minBarWidth)
      return { article: a, x, width }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
}

/* ── "All" mode — fit the whole content span to the viewport ──────── */

/** Min px/day in "all" mode — readability floor; below this the canvas scrolls. */
const ALL_FLOOR_PX_PER_DAY = 6
/** Days of padding on each side of the content span in "all" mode. */
const ALL_MARGIN_DAYS = 2

/**
 * "All" mode config — spans the earliest createdAt to the latest horizon
 * (clamped to >= now), scaled so the whole span fits `viewportCanvasWidth`.
 * If the span is too long to fit above the readability floor, px/day caps at
 * the floor and the canvas scrolls instead of squishing.
 *
 * Generic over entity type. `getHorizon` is the same adapter callback as in
 * `laneArticles` — passes through wiki's plannedDate logic or notes/books'
 * updatedAt-as-horizon convention without baking entity types into the
 * layout module.
 */
export function computeAllFit<T extends TimelineEntity>(
  entities: T[],
  viewportCanvasWidth: number,
  now: Date,
  getHorizon: (entity: T) => Date | null,
): { winStart: Date; cfg: ZoomConfig } {
  let earliest = now
  let latest = now
  for (const a of entities) {
    const c = safeDate(a.createdAt)
    const h = getHorizon(a)
    if (c && c < earliest) earliest = c
    if (h && h > latest) latest = h
  }
  const startDay = startOfDay(earliest)
  const contentDays = Math.max(Math.round(diffDays(startOfDay(latest), startDay)) + 1, 1)
  const totalDays = contentDays + ALL_MARGIN_DAYS * 2
  const winStart = addDays(startDay, -ALL_MARGIN_DAYS)
  const pxPerDay = Math.max(ALL_FLOOR_PX_PER_DAY, viewportCanvasWidth / totalDays)
  const yearScale = totalDays > 400
  return {
    winStart,
    cfg: {
      label: "All",
      pxPerDay,
      totalDays,
      minBarWidth: 8,
      formatTick: (d) =>
        yearScale
          ? d.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
          : d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    },
  }
}
