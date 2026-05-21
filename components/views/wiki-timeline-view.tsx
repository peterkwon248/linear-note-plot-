"use client"

/**
 * WikiTimelineView — bars-first timeline orchestrator.
 *
 * This file owns all React state, memos, effects and callbacks; the visual
 * pieces live in `./wiki-timeline/*`. See `wiki-timeline-config.ts` for the
 * full design changelog (v0.2 → v0.4).
 */

import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { isWikiStub, safeDate } from "@/lib/wiki-utils"
import { usePlotStore } from "@/lib/store"
import type { WikiArticle, EntityEvent } from "@/lib/types"
import type { ViewState } from "@/lib/view-engine/types"
import { getEventsForEntity } from "@/lib/datalog/helpers"
import {
  AXIS_HEIGHT,
  LANE_HEIGHT,
  LABEL_COL_WIDTH,
  ZOOM_CONFIGS,
  type ZoomLevel,
  type TimelineTooltipState,
  type TimelineEventTooltipState,
  type TimelineDragState,
} from "./wiki-timeline/wiki-timeline-config"
import {
  startOfDay,
  addDays,
  diffDays,
  windowStart,
  buildTicks,
  buildDayRange,
  buildMonthBoundaries,
  laneArticles,
} from "./wiki-timeline/wiki-timeline-utils"
import { TimelineControls } from "./wiki-timeline/timeline-controls"
import { TimelineAxis } from "./wiki-timeline/timeline-axis"
import { TimelineGrid } from "./wiki-timeline/timeline-grid"
import { TimelineBar } from "./wiki-timeline/timeline-bar"
import { TimelineEventMarkers } from "./wiki-timeline/timeline-event-markers"
import { TimelineLabelColumn } from "./wiki-timeline/timeline-label-column"
import { TimelineTooltip, TimelineEventTooltip } from "./wiki-timeline/timeline-tooltip"

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
  const [tooltip, setTooltip] = useState<TimelineTooltipState | null>(null)
  /** B1: hovered article id — drives stroke ring + row highlight */
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [showEvents, setShowEvents] = useState(true)
  const [eventTooltip, setEventTooltip] = useState<TimelineEventTooltipState | null>(null)
  const entityEvents = usePlotStore((s) => s.entityEvents)

  const [dragState, setDragState] = useState<TimelineDragState | null>(null)

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
      <TimelineControls
        zoom={zoom}
        anchor={anchor}
        showEvents={showEvents}
        onNavigate={navigate}
        onGoToToday={goToToday}
        onSetZoom={setZoom}
        onToggleEvents={() => setShowEvents((v) => !v)}
      />

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
          <TimelineAxis
            ticks={ticks}
            cfg={cfg}
            winStart={winStart}
            canvasWidth={canvasWidth}
            nowX={nowX}
          />

          {/* ── Body row: label column + canvas ── */}
          <div
            className="flex"
            style={{ position: "relative", minHeight: svgHeight }}
          >
            {/* Left label column — sticky left:0 */}
            <TimelineLabelColumn
              lanes={lanes}
              activeArticleId={activeArticleId}
              selectedIds={selectedIds}
              hoveredId={hoveredId}
              svgHeight={svgHeight}
              setHoveredId={setHoveredId}
              setTooltip={setTooltip}
              onOpenArticle={onOpenArticle}
              onSelect={onSelect}
            />

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
                {/* ── Static background layers (defs, stripes, grid, NOW line) ── */}
                <TimelineGrid
                  allDays={allDays}
                  ticks={ticks}
                  monthBoundaries={monthBoundaries}
                  lanes={lanes}
                  cfg={cfg}
                  winStart={winStart}
                  canvasWidth={canvasWidth}
                  svgHeight={svgHeight}
                  nowX={nowX}
                  now={now}
                />

                {/* Article bars */}
                {lanes.map((item, laneIndex) => (
                  <TimelineBar
                    key={item.article.id}
                    item={item}
                    laneIndex={laneIndex}
                    activeArticleId={activeArticleId}
                    selectedIds={selectedIds}
                    hoveredId={hoveredId}
                    dragState={dragState}
                    cfg={cfg}
                    nowX={nowX}
                    canvasWidth={canvasWidth}
                    setHoveredId={setHoveredId}
                    setTooltip={setTooltip}
                    setDragState={setDragState}
                    onOpenArticle={onOpenArticle}
                    onSelect={onSelect}
                  />
                ))}

                {/* Event markers (above bars) */}
                {lanes.map((item, laneIndex) => (
                  <TimelineEventMarkers
                    key={`events-${item.article.id}`}
                    article={item.article}
                    laneIndex={laneIndex}
                    eventsByArticleId={eventsByArticleId}
                    cfg={cfg}
                    winStart={winStart}
                    setEventTooltip={setEventTooltip}
                  />
                ))}
              </svg>

              {/* ── B2: Tooltip ── */}
              <TimelineTooltip
                tooltip={tooltip}
                tooltipArticle={tooltipArticle}
                dragState={dragState}
                cfg={cfg}
                winStart={winStart}
                now={now}
                canvasScrollRef={canvasScrollRef}
              />

              {/* Event marker tooltip */}
              <TimelineEventTooltip
                eventTooltip={eventTooltip}
                canvasScrollRef={canvasScrollRef}
              />
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
