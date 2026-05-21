"use client"

/**
 * WikiTimelineView — bars-first (2026-05-20, design v0.4)
 *
 * v0.4 changes (2026-05-21 — visual depth + affordance):
 *   A1. Weekend column stripe (Sat/Sun subtle dim)
 *   A2. Month boundary lines (stronger opacity vs day ticks)
 *   A3. Row separators already present — opacity tuned
 *   B1. Hover state: hoveredId React state, stroke ring + row bg highlight
 *   B2. Tooltip: richer content — title / status / created + planned relative
 *   B3. Status dot: stub = hollow circle, article = filled solid
 *   D1. Past vs Future opacity via SVG linearGradient (smooth, single rect)
 *   D2. Planned horizon → dashed right-end stroke overlay; updatedAt → solid
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
 */

import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { CaretLeft } from "@phosphor-icons/react/dist/ssr/CaretLeft"
import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight"
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
import { IconWikiStub, IconWikiArticle } from "@/components/plot-icons"
import { isWikiStub, safeDate, getHorizon, getHorizonSource } from "@/lib/wiki-utils"
import { cn } from "@/lib/utils"
import { WIKI_STATUS_HEX } from "@/lib/colors"
import { usePlotStore } from "@/lib/store"
import type { WikiArticle, EntityEvent, EntityEventType } from "@/lib/types"
import type { Icon } from "@phosphor-icons/react"
import type { ViewState } from "@/lib/view-engine/types"
import { getEventsForEntity } from "@/lib/datalog/helpers"

/* ── Types ───────────────────────────────────────────────── */

export interface WikiTimelineViewProps {
  articles: WikiArticle[]
  viewState: ViewState
  selectedIds: Set<string>
  activeArticleId: string | null
  onOpenArticle: (id: string) => void
  onSelect: (id: string, opts: { multi?: boolean; shift?: boolean; index?: number }) => void
  onUpdateViewState: (patch: Partial<ViewState>) => void
}

type ZoomLevel = "week" | "month" | "quarter" | "year"

/* ── Zoom config ─────────────────────────────────────────── */

interface ZoomConfig {
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

const ZOOM_CONFIGS: Record<ZoomLevel, ZoomConfig> = {
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

const ZOOM_ORDER: ZoomLevel[] = ["week", "month", "quarter", "year"]

/* ── Tick step (collision avoidance) ────────────────────── */

const TICK_STEP_DAYS: Record<ZoomLevel, number> = {
  week: 1,
  month: 7,
  quarter: 14,
  year: 30,
}

/* ── Constants ───────────────────────────────────────────── */

const LANE_HEIGHT = 52
const BAR_HEIGHT = 28
const BAR_RADIUS = 8
const END_DOT_SIZE = 18
const END_DOT_OFFSET = 9
const AXIS_HEIGHT = 32
const LABEL_COL_WIDTH = 200
const TODAY_LINE_COLOR = "var(--border-strong)"

/**
 * Per-event-type visual config — icon chip (filled ring + Phosphor icon).
 * Markers sit ABOVE the bar centerline.
 * Unknown types fall back to EVENT_MARKER_FALLBACK.
 */

interface MarkerConfig {
  /** Phosphor icon component (SSR variant) */
  icon: Icon
  /** Type color (used for ring fill) */
  color: string
  /** Human-readable label for tooltip */
  label: string
}

const EVENT_MARKER_CONFIG: Partial<Record<EntityEventType, MarkerConfig>> = {
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

const EVENT_MARKER_FALLBACK: MarkerConfig = {
  icon: DotOutline,
  color: "var(--muted-foreground)",
  label: "Event",
}

/** Ring radius (visible circle). Icon centered inside. */
const EVENT_MARKER_RING_R = 7

/** Icon size (Phosphor `size` prop). Roughly ring_r * 1.4 for nice fit. */
const EVENT_MARKER_ICON_SIZE = 9

/** Y offset above the bar centerline (negative = above) */
const EVENT_MARKER_Y_OFFSET = -12

/** Per-event horizontal offset when stacking same-day events */
const EVENT_MARKER_STACK_GAP = 14

/** Max markers per day before showing +N overflow */
const EVENT_MARKER_MAX_PER_DAY = 4

/* ── Utilities ───────────────────────────────────────────── */

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function diffDays(a: Date, b: Date): number {
  return (a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24)
}

function windowStart(anchor: Date, zoom: ZoomLevel): Date {
  const half = Math.floor(ZOOM_CONFIGS[zoom].totalDays / 2)
  return startOfDay(addDays(anchor, -half))
}

function buildTicks(start: Date, end: Date, zoom: ZoomLevel): Date[] {
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
function buildDayRange(start: Date, end: Date): Date[] {
  const days: Date[] = []
  let cur = startOfDay(start)
  while (cur <= end) {
    days.push(new Date(cur))
    cur = addDays(cur, 1)
  }
  return days
}

/** Build 1st-of-each-month within range for A2 boundary lines. */
function buildMonthBoundaries(start: Date, end: Date): Date[] {
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

function periodLabel(anchor: Date, zoom: ZoomLevel): string {
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

function relativeDateLabel(date: Date, now: Date): string {
  const diff = Math.round(diffDays(date, now))
  if (diff === 0) return "today"
  if (diff === 1) return "tomorrow"
  if (diff === -1) return "yesterday"
  if (diff > 0) return `in ${diff} day${diff !== 1 ? "s" : ""}`
  return `${Math.abs(diff)} day${Math.abs(diff) !== 1 ? "s" : ""} ago`
}

/* ── Placed article (one row per article, single bar) ───── */

interface LanedArticle {
  article: WikiArticle
  x: number
  width: number
}

function laneArticles(
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

/* ── WikiTimelineView ────────────────────────────────────── */

export function WikiTimelineView({
  articles,
  selectedIds,
  activeArticleId,
  onOpenArticle,
  onSelect,
}: WikiTimelineViewProps) {
  const now = useMemo(() => new Date(), [])

  const [zoom, setZoom] = useState<ZoomLevel>("month")
  const [anchor, setAnchor] = useState<Date>(() => startOfDay(now))
  const [tooltip, setTooltip] = useState<{ id: string; laneIndex: number; x: number } | null>(null)
  /** B1: hovered article id — drives stroke ring + row highlight */
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [showEvents, setShowEvents] = useState(true)
  const [eventTooltip, setEventTooltip] = useState<{
    laneIndex: number
    x: number
    dateLabel: string
    labels: string[]
    count: number
  } | null>(null)
  const entityEvents = usePlotStore((s) => s.entityEvents)

  const [dragState, setDragState] = useState<{
    id: string
    pointerId: number
    startClientX: number
    originalEndX: number
    currentEndX: number
  } | null>(null)

  const canvasSvgRef = useRef<SVGSVGElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const canvasScrollRef = useRef<HTMLDivElement>(null)
  const [viewportH, setViewportH] = useState(0)

  const cfg = ZOOM_CONFIGS[zoom]
  const winStart = useMemo(() => windowStart(anchor, zoom), [anchor, zoom])
  const winEnd = useMemo(() => addDays(winStart, cfg.totalDays), [winStart, cfg.totalDays])

  const canvasWidth = cfg.pxPerDay * cfg.totalDays

  const validArticles = useMemo(
    () => articles.filter((a) => safeDate(a.createdAt) !== null),
    [articles],
  )

  const lanes = useMemo(
    () => laneArticles(validArticles, winStart, zoom),
    [validArticles, winStart, zoom],
  )

  /** Events for each laned article, filtered to current window. Stable per render. */
  const eventsByArticleId = useMemo(() => {
    if (!showEvents) return new Map<string, EntityEvent[]>()
    const winStartMs = winStart.getTime()
    const winEndMs = winEnd.getTime()
    const m = new Map<string, EntityEvent[]>()
    for (const { article } of lanes) {
      const all = getEventsForEntity(entityEvents, { kind: "wiki", id: article.id })
      const within = all.filter((e) => {
        const t = new Date(e.at).getTime()
        return t >= winStartMs && t <= winEndMs
      })
      if (within.length > 0) m.set(article.id, within)
    }
    return m
  }, [lanes, entityEvents, winStart, winEnd, showEvents])

  const ticks = useMemo(
    () => buildTicks(winStart, winEnd, zoom),
    [winStart, winEnd, zoom],
  )

  /** A1: All days in window for weekend stripe */
  const allDays = useMemo(
    () => buildDayRange(winStart, winEnd),
    [winStart, winEnd],
  )

  /** A2: Month boundary dates */
  const monthBoundaries = useMemo(
    () => buildMonthBoundaries(winStart, winEnd),
    [winStart, winEnd],
  )

  const nowX = diffDays(now, winStart) * cfg.pxPerDay

  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const measure = () => setViewportH(el.clientHeight)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /* ── Drag: pointer listeners (window-level for smooth tracking) ── */

  useEffect(() => {
    if (!dragState) return
    function onMove(e: PointerEvent) {
      if (e.pointerId !== dragState!.pointerId) return
      const svg = canvasSvgRef.current
      if (!svg) return
      const rect = svg.getBoundingClientRect()
      const rawEndX = e.clientX - rect.left
      const lane = lanes.find((l) => l.article.id === dragState!.id)
      if (!lane) return
      const minEndX = lane.x + cfg.minBarWidth
      const snapped = Math.round(rawEndX / cfg.pxPerDay) * cfg.pxPerDay
      const clampedEndX = Math.max(snapped, minEndX)
      setDragState((prev) => prev ? { ...prev, currentEndX: clampedEndX } : null)
    }
    function onUp(e: PointerEvent) {
      if (e.pointerId !== dragState!.pointerId) return
      const days = Math.round(dragState!.currentEndX / cfg.pxPerDay)
      const date = startOfDay(addDays(winStart, days))
      const iso = date.toISOString()
      usePlotStore.getState().setWikiArticlePlannedDate(dragState!.id, iso)
      setDragState(null)
    }
    function onCancel(e: PointerEvent) {
      if (e.pointerId !== dragState!.pointerId) return
      setDragState(null)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDragState(null)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onCancel)
    window.addEventListener("keydown", onKey)
    const prevCursor = document.body.style.cursor
    document.body.style.cursor = "ew-resize"
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onCancel)
      window.removeEventListener("keydown", onKey)
      document.body.style.cursor = prevCursor
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragState?.id, dragState?.pointerId, lanes, cfg.pxPerDay, cfg.minBarWidth, winStart])

  /* ── Navigation ── */

  const navigate = useCallback(
    (dir: -1 | 1) => {
      const stepDays = Math.round(cfg.totalDays * 0.4)
      setAnchor((prev) => addDays(prev, dir * stepDays))
    },
    [cfg.totalDays],
  )

  const goToToday = useCallback(() => {
    setAnchor(startOfDay(now))
  }, [now])

  /* ── Render: event markers above bar ── */

  /**
   * Render event markers for one lane. Each event = own marker. Same-day events
   * stack horizontally with EVENT_MARKER_STACK_GAP. If a day has > EVENT_MARKER_MAX_PER_DAY
   * events, show the first MAX and a "+N" overflow text after them.
   */
  function renderEventMarkers(article: WikiArticle, laneIndex: number) {
    const events = eventsByArticleId.get(article.id)
    if (!events || events.length === 0) return null

    const cy = laneIndex * LANE_HEIGHT + LANE_HEIGHT / 2
    const markerY = cy - BAR_HEIGHT / 2 + EVENT_MARKER_Y_OFFSET

    // Bucket events by yyyy-mm-dd (oldest first within each day so left-to-right stack)
    const byDay = new Map<string, EntityEvent[]>()
    for (const ev of events) {
      const d = new Date(ev.at)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      if (!byDay.has(key)) byDay.set(key, [])
      byDay.get(key)!.push(ev)
    }
    // sort each day's events by time ascending
    for (const arr of byDay.values()) {
      arr.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
    }

    const dayBuckets = Array.from(byDay.entries()).map(([key, evs]) => {
      const first = new Date(evs[0].at)
      const dayStart = new Date(first.getFullYear(), first.getMonth(), first.getDate())
      const dayCenterX = diffDays(dayStart, winStart) * cfg.pxPerDay + cfg.pxPerDay / 2
      return { key, dayCenterX, events: evs }
    })

    return (
      <g key={`events-${article.id}`} style={{ pointerEvents: "none" }}>
        {dayBuckets.map(({ key, dayCenterX, events: evs }) => {
          const visible = evs.slice(0, EVENT_MARKER_MAX_PER_DAY)
          const overflow = evs.length - visible.length
          // Center the row of markers horizontally around dayCenterX
          const totalW = (visible.length - 1) * EVENT_MARKER_STACK_GAP + (overflow > 0 ? EVENT_MARKER_STACK_GAP + 12 : 0)
          const startX = dayCenterX - totalW / 2

          return (
            <g key={key}>
              {visible.map((ev, i) => {
                const mc: MarkerConfig = EVENT_MARKER_CONFIG[ev.type] ?? EVENT_MARKER_FALLBACK
                const IconComp = mc.icon
                const mx = startX + i * EVENT_MARKER_STACK_GAP
                return (
                  <g
                    key={ev.id}
                    transform={`translate(${mx}, ${markerY})`}
                    style={{ pointerEvents: "all" }}
                  >
                    {/* Hit area — larger than visible ring for easier hover */}
                    <circle
                      r={10}
                      fill="transparent"
                      onMouseEnter={(e) => {
                        e.stopPropagation()
                        const dateLabel = new Date(ev.at).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })
                        const timeLabel = new Date(ev.at).toLocaleTimeString("en-US", {
                          hour: "numeric", minute: "2-digit",
                        })
                        const label = (EVENT_MARKER_CONFIG[ev.type] ?? EVENT_MARKER_FALLBACK).label
                        setEventTooltip({
                          laneIndex,
                          x: mx,
                          dateLabel: `${dateLabel} · ${timeLabel}`,
                          labels: [label],
                          count: 1,
                        })
                      }}
                      onMouseLeave={() => setEventTooltip(null)}
                    />
                    {/* Visible chip — filled ring + centered Phosphor icon */}
                    <circle
                      r={EVENT_MARKER_RING_R}
                      fill={mc.color}
                      opacity={0.95}
                    />
                    <IconComp
                      x={-EVENT_MARKER_ICON_SIZE / 2}
                      y={-EVENT_MARKER_ICON_SIZE / 2}
                      width={EVENT_MARKER_ICON_SIZE}
                      height={EVENT_MARKER_ICON_SIZE}
                      weight="bold"
                      color="white"
                    />
                  </g>
                )
              })}
              {overflow > 0 && (
                <text
                  x={startX + visible.length * EVENT_MARKER_STACK_GAP}
                  y={markerY + 3}
                  fill="var(--muted-foreground)"
                  fontSize={9}
                  fontWeight={600}
                  style={{ pointerEvents: "none" }}
                >
                  +{overflow}
                </text>
              )}
            </g>
          )
        })}
      </g>
    )
  }

  /* ── Render: single bar per lane ── */

  function renderLaneBar(item: LanedArticle, laneIndex: number) {
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

    const dotCx = liveEndX + END_DOT_OFFSET
    const titleInside = liveWidth >= cfg.titleThreshold
    const outsideTitleX = dotCx + END_DOT_SIZE / 2 + 4
    const titleLabel = article.title || "Untitled"

    /** D1: gradient id for past→future opacity split */
    const gradId = `grad-${article.id}`

    /** D1: nowX relative to bar start, clamped 0..1 (use liveWidth) */
    const gradStop = (() => {
      if (nowX <= x) return 0           // entire bar is future
      if (nowX >= liveEndX) return 1    // entire bar is past
      return (nowX - x) / liveWidth     // partial split
    })()

    /** D2: planned horizon → dashed right cap; also forced true while dragging */
    const horizonSource = getHorizonSource(article)
    const isPlanned = isDragging || horizonSource === "planned"

    return (
      <g
        key={article.id}
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

        {/* D2: Planned horizon — dashed right-edge cap overlay */}
        {isPlanned && (
          <line
            x1={liveEndX}
            y1={barY + 2}
            x2={liveEndX}
            y2={barY + BAR_HEIGHT - 2}
            stroke={color}
            strokeWidth={2}
            strokeDasharray="2 2"
            opacity={0.9}
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

        {/* B3: Status dot — hollow for stub, filled for article */}
        <circle
          cx={dotCx}
          cy={cy}
          r={END_DOT_SIZE / 2}
          fill={stub ? "var(--background)" : color}
          stroke={color}
          strokeWidth={stub ? 2 : 0}
          opacity={0.95}
        />

        {/* Outside title — right of dot when bar is narrow */}
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

        {/* Grab handle: 12px wide hit zone on right edge */}
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

  /* ── Empty state ── */

  if (articles.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
        <svg width={40} height={40} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" opacity={0.4}>
          <line x1="4" y1="20" x2="36" y2="20" />
          <rect x="6" y="16" width="10" height="8" rx="2" />
          <rect x="20" y="16" width="14" height="8" rx="2" />
        </svg>
        <p className="text-note">No articles to display on the timeline.</p>
      </div>
    )
  }

  /* ── Main render ── */

  const tooltipArticle = tooltip ? articles.find((a) => a.id === tooltip.id) : null

  const laneCount = lanes.length
  const svgLanesHeight = laneCount * LANE_HEIGHT
  const svgHeight = Math.max(svgLanesHeight, viewportH - AXIS_HEIGHT)

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* ── Controls bar ── */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border-subtle px-4 py-2">
        <button
          onClick={() => navigate(-1)}
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          aria-label="Previous period"
        >
          <CaretLeft size={12} weight="bold" />
        </button>

        <button
          onClick={goToToday}
          className="min-w-[140px] text-center text-sm font-medium text-foreground hover:text-foreground/80 transition-colors"
          title="Click to return to today"
        >
          {periodLabel(anchor, zoom)}
        </button>

        <button
          onClick={() => navigate(1)}
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          aria-label="Next period"
        >
          <CaretRight size={12} weight="bold" />
        </button>

        <div className="flex-1" />

        <button
          onClick={() => setShowEvents((v) => !v)}
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
              onClick={() => setZoom(z)}
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

      {/* ── Scrollable body ── */}
      <div
        ref={bodyRef}
        className="relative flex-1 overflow-auto"
        style={{ outline: "none" }}
        tabIndex={0}
        aria-label="Wiki timeline"
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") { e.preventDefault(); navigate(-1) }
          if (e.key === "ArrowRight") { e.preventDefault(); navigate(1) }
        }}
      >
        <div
          style={{
            width: LABEL_COL_WIDTH + Math.max(canvasWidth, 400),
            minHeight: AXIS_HEIGHT + svgHeight,
            position: "relative",
          }}
        >
          {/* ── Axis header (sticky top) ── */}
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

          {/* ── Body row: label column + canvas ── */}
          <div
            className="flex"
            style={{ position: "relative", minHeight: svgHeight }}
          >
            {/* Left label column — sticky left:0 */}
            <div
              style={{
                width: LABEL_COL_WIDTH,
                position: "sticky",
                left: 0,
                zIndex: 10,
                background: "var(--bg, var(--background))",
                borderRight: "1px solid var(--border)",
                flexShrink: 0,
                minHeight: svgHeight,
              }}
            >
              {lanes.map(({ article }, laneIndex) => {
                const stub = isWikiStub(article)
                const isActive = article.id === activeArticleId
                const isSelected = selectedIds.has(article.id)
                const isHovered = article.id === hoveredId
                const color = stub ? WIKI_STATUS_HEX.stub : WIKI_STATUS_HEX.article
                const created = safeDate(article.createdAt)
                const createdLabel = created
                  ? created.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  : "—"

                return (
                  <div
                    key={article.id}
                    style={{ height: LANE_HEIGHT }}
                    className={cn(
                      "group flex cursor-pointer items-start gap-2 px-3 py-1.5 transition-colors",
                      isSelected || isActive
                        ? "bg-secondary/60"
                        : isHovered
                          ? "bg-secondary/40"
                          : "hover:bg-secondary/30",
                    )}
                    onMouseEnter={() => {
                      setHoveredId(article.id)
                      setTooltip({ id: article.id, laneIndex, x: LABEL_COL_WIDTH })
                    }}
                    onMouseLeave={() => {
                      setHoveredId(null)
                      setTooltip(null)
                    }}
                    onClick={(e) => {
                      onOpenArticle(article.id)
                      onSelect(article.id, { multi: e.metaKey || e.ctrlKey, shift: e.shiftKey, index: laneIndex })
                    }}
                  >
                    <span className="shrink-0 mt-0.5" style={{ color }}>
                      {stub ? <IconWikiStub size={13} /> : <IconWikiArticle size={13} />}
                    </span>
                    <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                      <span
                        className={cn(
                          "truncate text-note",
                          isSelected || isActive ? "font-medium text-foreground" : "text-foreground/85",
                        )}
                        style={{ maxWidth: LABEL_COL_WIDTH - 48 }}
                        title={article.title || "Untitled"}
                      >
                        {article.title || "Untitled"}
                      </span>
                      <span className="text-2xs text-muted-foreground tabular-nums">
                        {createdLabel}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Canvas */}
            <div
              ref={canvasScrollRef}
              style={{ flex: 1, position: "relative", minHeight: svgHeight }}
              onClick={() => setTooltip(null)}
            >
              <svg
                ref={canvasSvgRef}
                width={Math.max(canvasWidth, 400)}
                height={svgHeight}
                className="block select-none"
                style={{ display: "block" }}
              >
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

                {/* Article bars */}
                {lanes.map((item, laneIndex) => renderLaneBar(item, laneIndex))}

                {/* Event markers (above bars) */}
                {lanes.map((item, laneIndex) => renderEventMarkers(item.article, laneIndex))}

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
              </svg>

              {/* ── B2: Tooltip ── */}
              {tooltipArticle && tooltip && (
                <div
                  className="pointer-events-none absolute z-20 rounded-md border border-border-subtle bg-popover px-2.5 py-1.5 shadow-md"
                  style={{
                    left: Math.min(
                      tooltip.x + 12,
                      (canvasScrollRef.current?.clientWidth ?? 400) - 220,
                    ),
                    top: tooltip.laneIndex * LANE_HEIGHT + LANE_HEIGHT / 2 - 28,
                  }}
                >
                  {/* Line 1: Title + icon */}
                  <div className="flex items-center gap-1.5">
                    <span
                      className="shrink-0"
                      style={{
                        color: isWikiStub(tooltipArticle)
                          ? WIKI_STATUS_HEX.stub
                          : WIKI_STATUS_HEX.article,
                      }}
                    >
                      {isWikiStub(tooltipArticle) ? (
                        <IconWikiStub size={12} />
                      ) : (
                        <IconWikiArticle size={12} />
                      )}
                    </span>
                    <span className="max-w-[180px] truncate text-note font-medium text-foreground">
                      {tooltipArticle.title || "Untitled"}
                    </span>
                  </div>
                  {/* Line 2: Status badge */}
                  <div className="mt-0.5 flex items-center gap-1">
                    <span
                      className="text-2xs font-medium"
                      style={{
                        color: isWikiStub(tooltipArticle)
                          ? WIKI_STATUS_HEX.stub
                          : WIKI_STATUS_HEX.article,
                      }}
                    >
                      {isWikiStub(tooltipArticle) ? "Stub" : "Article"}
                    </span>
                  </div>
                  {/* Line 3: Created date */}
                  <div className="mt-0.5 text-2xs text-muted-foreground tabular-nums">
                    {(() => {
                      const created = safeDate(tooltipArticle.createdAt)
                      const fmt = (d: Date) =>
                        d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      return created ? `Created ${fmt(created)}` : null
                    })()}
                  </div>
                  {/* Line 4: Live drag date OR planned/updated date */}
                  <div className="mt-0.5 text-2xs tabular-nums">
                    {(() => {
                      const fmt = (d: Date) =>
                        d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

                      // During drag — show live planning date
                      if (dragState && tooltipArticle.id === dragState.id) {
                        const days = Math.round(dragState.currentEndX / cfg.pxPerDay)
                        const liveDragDate = startOfDay(addDays(winStart, days))
                        const rel = relativeDateLabel(liveDragDate, now)
                        return (
                          <span className="text-muted-foreground">
                            <span style={{ color: WIKI_STATUS_HEX.stub, fontWeight: 500 }}>Planning</span>{" "}
                            {fmt(liveDragDate)}
                            <span className="opacity-60"> ({rel})</span>
                          </span>
                        )
                      }

                      const planned = safeDate(tooltipArticle.plannedDate)
                      const updated = safeDate(tooltipArticle.updatedAt)
                      if (planned) {
                        const rel = relativeDateLabel(planned, now)
                        return (
                          <span className="text-muted-foreground">
                            <span style={{ color: WIKI_STATUS_HEX.stub }}>Planned</span>
                            {" "}
                            {fmt(planned)}
                            <span className="opacity-60"> ({rel})</span>
                          </span>
                        )
                      }
                      if (updated) {
                        return (
                          <span className="text-muted-foreground">
                            Updated {fmt(updated)}
                          </span>
                        )
                      }
                      return null
                    })()}
                  </div>
                </div>
              )}

              {/* Event marker tooltip */}
              {eventTooltip && (
                <div
                  className="pointer-events-none absolute z-30 rounded-md border border-border-subtle bg-popover px-2 py-1 shadow-md"
                  style={{
                    left: Math.min(eventTooltip.x + 8, (canvasScrollRef.current?.clientWidth ?? 400) - 160),
                    top: eventTooltip.laneIndex * LANE_HEIGHT + LANE_HEIGHT / 2 - BAR_HEIGHT / 2 - 32,
                  }}
                >
                  <div className="text-2xs font-medium text-foreground tabular-nums">
                    {eventTooltip.dateLabel}
                  </div>
                  <div className="mt-0.5 flex flex-col gap-0.5">
                    {eventTooltip.labels.map((l, i) => (
                      <span key={i} className="text-2xs text-muted-foreground">
                        • {l}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer: article count ── */}
      <div className="flex shrink-0 items-center border-t border-border-subtle px-4 py-1.5">
        <span className="text-2xs text-muted-foreground">
          {validArticles.length} article{validArticles.length !== 1 ? "s" : ""} on timeline
          {validArticles.length < articles.length && (
            <span className="ml-1 opacity-60">
              ({articles.length - validArticles.length} without date hidden)
            </span>
          )}
        </span>
      </div>
    </div>
  )
}
