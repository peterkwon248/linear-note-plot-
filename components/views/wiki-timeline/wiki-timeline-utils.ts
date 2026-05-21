/**
 * wiki-timeline-utils.ts — pure module-level date/layout helpers for the
 * bars-first WikiTimelineView. No React, no closures.
 */

import { safeDate, getHorizon } from "@/lib/wiki-utils"
import type { WikiArticle } from "@/lib/types"
import {
  ZOOM_CONFIGS,
  TICK_STEP_DAYS,
  type ZoomLevel,
  type LanedArticle,
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

export function buildTicks(start: Date, end: Date, zoom: ZoomLevel): Date[] {
  const ticks: Date[] = []
  const stepDays = TICK_STEP_DAYS[zoom]

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
      cur = addDays(cur, stepDays)
    }
  } else {
    let cur = startOfDay(start)
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

export function periodLabel(anchor: Date, zoom: ZoomLevel): string {
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

/* ── Placed article (one row per article, single bar) ───── */

export function laneArticles(
  articles: WikiArticle[],
  winStart: Date,
  zoom: ZoomLevel,
): LanedArticle[] {
  const { pxPerDay, minBarWidth } = ZOOM_CONFIGS[zoom]
  return articles
    .map((a) => {
      const created = safeDate(a.createdAt)
      const horizon = getHorizon(a)
      if (!created || !horizon) return null
      const x = diffDays(created, winStart) * pxPerDay
      const spanDays = Math.max(diffDays(horizon, created), 0)
      const width = Math.max(spanDays * pxPerDay, minBarWidth)
      return { article: a, x, width }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
}
