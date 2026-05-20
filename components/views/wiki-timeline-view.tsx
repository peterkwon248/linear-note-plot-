"use client"

/**
 * WikiTimelineView — Stage 1 (Layout v2)
 *
 * Full-height Gantt-style layout:
 *  - Left label column (article titles, fixed width)
 *  - Right scrollable time canvas (ticks, grid lines, now line)
 *  - One row per article — no collision-stacking
 *  - Grid extends to full viewport height even with few articles
 *
 * Design principle: "Gentle by default" — muted colors, thin strokes.
 * Colors: lib/colors.ts tokens only. No arbitrary hex values.
 */

import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { CaretLeft } from "@phosphor-icons/react/dist/ssr/CaretLeft"
import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight"
import { IconWikiStub, IconWikiArticle } from "@/components/plot-icons"
import { isWikiStub } from "@/lib/wiki-utils"
import { cn } from "@/lib/utils"
import { WIKI_STATUS_HEX } from "@/lib/colors"
import type { WikiArticle } from "@/lib/types"
import type { ViewState } from "@/lib/view-engine/types"

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
type RenderMode = "dot" | "bar"

/* ── Zoom config ─────────────────────────────────────────── */

interface ZoomConfig {
  label: string
  pxPerDay: number
  tickDays: number
  formatTick: (d: Date) => string
}

const ZOOM_CONFIGS: Record<ZoomLevel, ZoomConfig> = {
  week: {
    label: "Week",
    pxPerDay: 60,
    tickDays: 1,
    formatTick: (d) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
  },
  month: {
    label: "Month",
    pxPerDay: 14,
    tickDays: 7,
    formatTick: (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  },
  quarter: {
    label: "Quarter",
    pxPerDay: 4,
    tickDays: 14,
    formatTick: (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  },
  year: {
    label: "Year",
    pxPerDay: 1.2,
    tickDays: 30,
    formatTick: (d) => d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
  },
}

const ZOOM_ORDER: ZoomLevel[] = ["week", "month", "quarter", "year"]

/* ── Constants ───────────────────────────────────────────── */

const VIEWPORT_DAYS_BY_ZOOM: Record<ZoomLevel, number> = {
  week: 7,
  month: 30,
  quarter: 90,
  year: 365,
}

/** Lane height per article row (px) */
const LANE_HEIGHT = 40
/** Dot diameter (px) */
const DOT_SIZE = 18
/** Bar height (px) in bar render mode */
const BAR_HEIGHT = 10
/** Axis header height (px) */
const AXIS_HEIGHT = 32
/** Left label column width (px) */
const LABEL_COL_WIDTH = 180
/** Now-line color */
const NOW_LINE_COLOR = "var(--muted-foreground)"

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

function safeDate(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d
}

function windowStart(anchor: Date, zoom: ZoomLevel): Date {
  const half = Math.floor(VIEWPORT_DAYS_BY_ZOOM[zoom] / 2)
  return startOfDay(addDays(anchor, -half))
}

function buildTicks(start: Date, end: Date, tickDays: number): Date[] {
  const ticks: Date[] = []
  let cur = startOfDay(start)
  while (cur <= end) {
    ticks.push(new Date(cur))
    cur = addDays(cur, tickDays)
  }
  return ticks
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

/* ── Placed article (simplified — one row per article) ───── */

interface LanedArticle {
  article: WikiArticle
  /** X position of createdAt (px from canvas left) */
  x: number
  /** Bar width in bar mode (px) */
  width: number
}

function laneArticles(
  articles: WikiArticle[],
  winStart: Date,
  pxPerDay: number,
  renderMode: RenderMode,
): LanedArticle[] {
  return articles
    .map((a) => {
      const created = safeDate(a.createdAt)
      if (!created) return null
      const x = diffDays(created, winStart) * pxPerDay
      let width = DOT_SIZE
      if (renderMode === "bar") {
        const updated = safeDate(a.updatedAt) ?? created
        const barDays = Math.max(diffDays(updated, created), 0)
        width = Math.max(barDays * pxPerDay, DOT_SIZE)
      }
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
  const [renderMode, setRenderMode] = useState<RenderMode>("dot")
  const [anchor, setAnchor] = useState<Date>(() => startOfDay(now))
  const [tooltip, setTooltip] = useState<{ id: string; laneIndex: number; x: number } | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  /** Ref to the shared vertical-scroll body (labels + canvas scroll together) */
  const bodyRef = useRef<HTMLDivElement>(null)
  /** Ref to the horizontal-scroll axis header above the canvas */
  const axisScrollRef = useRef<HTMLDivElement>(null)
  /** Ref to the horizontal-scroll canvas body */
  const canvasScrollRef = useRef<HTMLDivElement>(null)
  /** Measured visible height of the scroll body — drives full-height SVG/grid */
  const [viewportH, setViewportH] = useState(0)

  const cfg = ZOOM_CONFIGS[zoom]
  const viewDays = VIEWPORT_DAYS_BY_ZOOM[zoom]
  const winStart = useMemo(() => windowStart(anchor, zoom), [anchor, zoom])
  const winEnd = useMemo(() => addDays(winStart, viewDays), [winStart, viewDays])

  const canvasWidth = viewDays * cfg.pxPerDay

  const validArticles = useMemo(
    () => articles.filter((a) => safeDate(a.createdAt) !== null),
    [articles],
  )

  const lanes = useMemo(
    () => laneArticles(validArticles, winStart, cfg.pxPerDay, renderMode),
    [validArticles, winStart, cfg.pxPerDay, renderMode],
  )

  const ticks = useMemo(
    () => buildTicks(winStart, winEnd, cfg.tickDays),
    [winStart, winEnd, cfg.tickDays],
  )

  const nowX = diffDays(now, winStart) * cfg.pxPerDay

  /* ── Sync horizontal scroll between axis header and canvas ── */
  useEffect(() => {
    const axisEl = axisScrollRef.current
    const canvasEl = canvasScrollRef.current
    if (!axisEl || !canvasEl) return

    const syncFromAxis = () => { canvasEl.scrollLeft = axisEl.scrollLeft }
    const syncFromCanvas = () => { axisEl.scrollLeft = canvasEl.scrollLeft }

    axisEl.addEventListener("scroll", syncFromAxis)
    canvasEl.addEventListener("scroll", syncFromCanvas)
    return () => {
      axisEl.removeEventListener("scroll", syncFromAxis)
      canvasEl.removeEventListener("scroll", syncFromCanvas)
    }
  }, [])

  /* ── Measure body height so the SVG/grid fills the viewport ── */
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const measure = () => setViewportH(el.clientHeight)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /* ── Navigation ── */

  const navigate = useCallback(
    (dir: -1 | 1) => {
      const stepDays = Math.round(viewDays * 0.6)
      setAnchor((prev) => addDays(prev, dir * stepDays))
    },
    [viewDays],
  )

  const goToToday = useCallback(() => {
    setAnchor(startOfDay(now))
  }, [now])

  /* ── Keyboard navigation ── */
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); navigate(-1) }
      if (e.key === "ArrowRight") { e.preventDefault(); navigate(1) }
    }
    el.addEventListener("keydown", handleKey)
    return () => el.removeEventListener("keydown", handleKey)
  }, [navigate])

  /* ── Render helpers ── */

  function renderLaneDot(item: LanedArticle, laneIndex: number) {
    const { article, x } = item
    const stub = isWikiStub(article)
    const isActive = article.id === activeArticleId
    const isSelected = selectedIds.has(article.id)
    const color = stub ? WIKI_STATUS_HEX.stub : WIKI_STATUS_HEX.article
    /** Vertical center of the lane */
    const cy = laneIndex * LANE_HEIGHT + LANE_HEIGHT / 2

    return (
      <g
        key={article.id}
        transform={`translate(${x - DOT_SIZE / 2}, ${cy - DOT_SIZE / 2})`}
        style={{ cursor: "pointer" }}
        onClick={(e) => {
          e.stopPropagation()
          onOpenArticle(article.id)
          onSelect(article.id, { multi: e.metaKey || e.ctrlKey, shift: e.shiftKey, index: laneIndex })
        }}
        onMouseEnter={() => setTooltip({ id: article.id, laneIndex, x })}
        onMouseLeave={() => setTooltip(null)}
        role="button"
        aria-label={article.title}
      >
        {(isSelected || isActive) && (
          <circle
            cx={DOT_SIZE / 2}
            cy={DOT_SIZE / 2}
            r={DOT_SIZE / 2 + 2}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            opacity={0.5}
          />
        )}
        <circle
          cx={DOT_SIZE / 2}
          cy={DOT_SIZE / 2}
          r={DOT_SIZE / 2 - 1}
          fill={stub ? "var(--background)" : color}
          stroke={color}
          strokeWidth={1.5}
          opacity={0.92}
        />
        {stub ? (
          <circle
            cx={DOT_SIZE / 2}
            cy={DOT_SIZE / 2}
            r={3}
            fill="none"
            stroke={color}
            strokeWidth={1}
            opacity={0.7}
          />
        ) : (
          <circle
            cx={DOT_SIZE / 2}
            cy={DOT_SIZE / 2}
            r={3}
            fill="white"
            opacity={0.6}
          />
        )}
      </g>
    )
  }

  function renderLaneBar(item: LanedArticle, laneIndex: number) {
    const { article, x, width } = item
    const stub = isWikiStub(article)
    const isActive = article.id === activeArticleId
    const isSelected = selectedIds.has(article.id)
    const color = stub ? WIKI_STATUS_HEX.stub : WIKI_STATUS_HEX.article
    const cy = laneIndex * LANE_HEIGHT + LANE_HEIGHT / 2
    const barY = cy - BAR_HEIGHT / 2

    return (
      <g
        key={article.id}
        style={{ cursor: "pointer" }}
        onClick={(e) => {
          e.stopPropagation()
          onOpenArticle(article.id)
          onSelect(article.id, { multi: e.metaKey || e.ctrlKey, shift: e.shiftKey, index: laneIndex })
        }}
        onMouseEnter={() => setTooltip({ id: article.id, laneIndex, x })}
        onMouseLeave={() => setTooltip(null)}
        role="button"
        aria-label={article.title}
      >
        <rect
          x={x}
          y={barY - (isSelected || isActive ? 1 : 0)}
          width={width}
          height={BAR_HEIGHT + (isSelected || isActive ? 2 : 0)}
          rx={BAR_HEIGHT / 2}
          fill={color}
          opacity={stub ? 0.35 : 0.75}
        />
        <circle
          cx={x + DOT_SIZE / 2}
          cy={cy}
          r={DOT_SIZE / 2 - 2}
          fill={color}
          opacity={0.92}
        />
      </g>
    )
  }

  /* ── Empty state ── */

  if (articles.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
        <svg width={40} height={40} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" opacity={0.4}>
          <line x1="4" y1="20" x2="36" y2="20" />
          <circle cx="12" cy="20" r="3" />
          <circle cx="20" cy="20" r="3" />
          <circle cx="28" cy="20" r="3" />
        </svg>
        <p className="text-note">No articles to display on the timeline.</p>
      </div>
    )
  }

  /* ── Main render ── */

  const tooltipArticle = tooltip ? articles.find((a) => a.id === tooltip.id) : null

  /**
   * Canvas SVG height:
   * At minimum fills the scrollable body viewport; grows to fit all lanes.
   * We use a CSS min-height trick via style rather than needing JS measurement —
   * the SVG is inside a flex-1 overflow-y-auto, so "100%" of that div's height
   * equals the available content height. We set svgHeight to lanes * LANE_HEIGHT
   * and rely on the parent div's min-h-full to stretch it to the viewport.
   */
  const laneCount = lanes.length
  const svgLanesHeight = laneCount * LANE_HEIGHT
  /** SVG/grid height: fills the viewport when few lanes, grows past it when many. */
  const svgHeight = Math.max(svgLanesHeight, viewportH)

  return (
    <div
      ref={containerRef}
      className="flex flex-1 flex-col overflow-hidden outline-none"
      tabIndex={0}
      aria-label="Wiki timeline"
    >
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

        {/* Render mode toggle */}
        <div className="flex items-center gap-0.5 rounded-md border border-border-subtle p-0.5 text-2xs">
          <button
            onClick={() => setRenderMode("dot")}
            className={cn(
              "rounded px-2 py-0.5 transition-colors",
              renderMode === "dot"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Dots
          </button>
          <button
            onClick={() => setRenderMode("bar")}
            className={cn(
              "rounded px-2 py-0.5 transition-colors",
              renderMode === "bar"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Bars
          </button>
        </div>

        {/* Zoom selector */}
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

      {/* ── Axis header row (sticky, no vertical scroll) ── */}
      {/*
        Two columns:
          [LABEL_COL_WIDTH px] label corner  |  [flex-1, overflow-x hidden] axis ticks
        The axis ticks column scrolls horizontally in sync with the canvas below.
      */}
      <div className="flex shrink-0 border-b border-border-subtle" style={{ height: AXIS_HEIGHT }}>
        {/* Label corner — empty cell aligned with label column */}
        <div
          className="shrink-0 border-r border-border-subtle bg-background"
          style={{ width: LABEL_COL_WIDTH }}
        />
        {/* Axis ticks — horizontally scrollable, synced with canvas */}
        <div
          ref={axisScrollRef}
          className="flex-1 overflow-x-auto overflow-y-hidden"
          style={{ scrollbarWidth: "none" }}
        >
          <svg
            width={Math.max(canvasWidth, 400)}
            height={AXIS_HEIGHT}
            className="block select-none"
            style={{ minWidth: "100%" }}
          >
            {ticks.map((tick, i) => {
              const tx = diffDays(tick, winStart) * cfg.pxPerDay
              if (tx < 0 || tx > canvasWidth + 60) return null
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
                  <text
                    x={0}
                    y={AXIS_HEIGHT - 10}
                    textAnchor="middle"
                    fill="var(--muted-foreground)"
                    className="select-none text-2xs"
                  >
                    {cfg.formatTick(tick)}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      {/* ── Body: label column + canvas (shared vertical scroll) ── */}
      <div
        ref={bodyRef}
        className="relative flex flex-1 overflow-y-auto overflow-x-hidden"
      >
        {/* Left label column — full height, sticky on x-axis (no x scroll) */}
        <div
          className="shrink-0 border-r border-border-subtle bg-background"
          style={{ width: LABEL_COL_WIDTH, minHeight: svgHeight }}
        >
          {lanes.map(({ article }, laneIndex) => {
            const stub = isWikiStub(article)
            const isActive = article.id === activeArticleId
            const isSelected = selectedIds.has(article.id)
            const color = stub ? WIKI_STATUS_HEX.stub : WIKI_STATUS_HEX.article

            return (
              <div
                key={article.id}
                style={{ height: LANE_HEIGHT }}
                className={cn(
                  "group flex cursor-pointer items-center gap-1.5 px-3 transition-colors",
                  isSelected || isActive
                    ? "bg-secondary/60"
                    : "hover:bg-secondary/30",
                )}
                onClick={(e) => {
                  onOpenArticle(article.id)
                  onSelect(article.id, { multi: e.metaKey || e.ctrlKey, shift: e.shiftKey, index: laneIndex })
                }}
              >
                <span className="shrink-0" style={{ color }}>
                  {stub ? <IconWikiStub size={13} /> : <IconWikiArticle size={13} />}
                </span>
                <span
                  className={cn(
                    "truncate text-note",
                    isSelected || isActive ? "font-medium text-foreground" : "text-muted-foreground",
                  )}
                  style={{ maxWidth: LABEL_COL_WIDTH - 40 }}
                >
                  {article.title || "Untitled"}
                </span>
              </div>
            )
          })}
        </div>

        {/* Right canvas — horizontally scrollable, vertically scrolls with body */}
        <div
          ref={canvasScrollRef}
          className="relative flex-1 overflow-x-auto"
          onClick={() => setTooltip(null)}
        >
          {/*
            SVG fills at minimum the body viewport height (via min-h-full on wrapper).
            The actual drawn height is max(svgLanesHeight, container client height).
            We achieve this by letting the SVG be tall enough to cover all lanes,
            and using CSS to stretch the scroll container to fill remaining height.
          */}
          <div style={{ height: svgHeight, position: "relative" }}>
            <svg
              width={Math.max(canvasWidth, 400)}
              height={svgHeight}
              className="block select-none"
              style={{
                minWidth: "100%",
                display: "block",
              }}
            >
              {/* ── Vertical grid lines (tick positions) ── */}
              {ticks.map((tick, i) => {
                const tx = diffDays(tick, winStart) * cfg.pxPerDay
                if (tx < 0 || tx > canvasWidth + 60) return null
                return (
                  <line
                    key={`grid-${i}`}
                    x1={tx}
                    y1={0}
                    x2={tx}
                    y2={svgHeight}
                    stroke="var(--border)"
                    strokeWidth={0.5}
                    opacity={0.3}
                  />
                )
              })}

              {/* ── Horizontal lane separator lines ── */}
              {lanes.map((_, laneIndex) => (
                <line
                  key={`lane-sep-${laneIndex}`}
                  x1={0}
                  y1={(laneIndex + 1) * LANE_HEIGHT}
                  x2="100%"
                  y2={(laneIndex + 1) * LANE_HEIGHT}
                  stroke="var(--border)"
                  strokeWidth={0.5}
                  opacity={0.25}
                />
              ))}

              {/* ── Article dots / bars ── */}
              {lanes.map((item, laneIndex) =>
                renderMode === "dot"
                  ? renderLaneDot(item, laneIndex)
                  : renderLaneBar(item, laneIndex),
              )}

              {/* ── "Now" vertical line — full height ── */}
              {nowX >= 0 && nowX <= canvasWidth && (
                <g transform={`translate(${nowX}, 0)`}>
                  <line
                    x1={0}
                    y1={0}
                    x2={0}
                    y2={svgHeight}
                    stroke={NOW_LINE_COLOR}
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    opacity={0.45}
                  />
                  <text
                    x={4}
                    y={14}
                    fill={NOW_LINE_COLOR}
                    opacity={0.6}
                    className="select-none text-2xs"
                  >
                    now
                  </text>
                </g>
              )}
            </svg>

            {/* ── Tooltip ── */}
            {tooltipArticle && tooltip && (
              <div
                className="pointer-events-none absolute z-20 rounded-md border border-border-subtle bg-popover px-2.5 py-1.5 shadow-md"
                style={{
                  left: Math.min(
                    tooltip.x + 12,
                    (canvasScrollRef.current?.clientWidth ?? 400) - 180,
                  ),
                  top: tooltip.laneIndex * LANE_HEIGHT + LANE_HEIGHT / 2 - 20,
                }}
              >
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
                      <IconWikiStub size={13} />
                    ) : (
                      <IconWikiArticle size={13} />
                    )}
                  </span>
                  <span className="max-w-[160px] truncate text-note font-medium text-foreground">
                    {tooltipArticle.title}
                  </span>
                </div>
                <div className="mt-0.5 text-2xs text-muted-foreground">
                  {safeDate(tooltipArticle.createdAt)?.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }) ?? "—"}
                </div>
              </div>
            )}
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
