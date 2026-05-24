"use client"

/**
 * WikiTimelineView — bars-first timeline orchestrator.
 *
 * This file owns all React state, memos, effects and callbacks; the visual
 * pieces live in `./wiki-timeline/*`. See `wiki-timeline-config.ts` for the
 * full design changelog (v0.2 → v0.4).
 */

import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { isWikiStub, safeDate, getHorizon } from "@/lib/wiki-utils"
import { usePlotStore } from "@/lib/store"
import type { WikiArticle, EntityEvent } from "@/lib/types"
import type { ViewState } from "@/lib/view-engine/types"
import type { WikiGroup } from "@/lib/view-engine/wiki-list-pipeline"
import { WIKI_STATUS_HEX } from "@/lib/colors"
import { IconWikiStub, IconWikiArticle } from "@/components/plot-icons"
import { getEventsForEntity } from "@/lib/datalog/helpers"
import {
  AXIS_HEIGHT,
  LANE_HEIGHT,
  LABEL_COL_WIDTH,
  ZOOM_CONFIGS,
  type TimelineMode,
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
  computeAllFit,
  relativeDateLabel,
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
  /** B4 (audit v2): viewState.groupBy-aware grouping output from the wiki
   *  pipeline. When provided with multiple non-empty groups, the timeline
   *  sorts articles by group order and renders a sticky group-header row
   *  between each group in the label column. Omit / single-group input → no
   *  grouping UI (single contiguous lane block). */
  wikiGroups?: WikiGroup[] | null
  selectedIds: Set<string>
  activeArticleId: string | null
  onOpenArticle: (id: string) => void
  onSelect: (id: string, opts: { multi?: boolean; shift?: boolean; index?: number }) => void
  onUpdateViewState: (patch: Partial<ViewState>) => void
}

/* ── WikiTimelineView ────────────────────────────────────── */

export function WikiTimelineView({
  articles,
  viewState,
  wikiGroups,
  selectedIds,
  activeArticleId,
  onOpenArticle,
  onSelect,
  onUpdateViewState,
}: WikiTimelineViewProps) {
  // PR-Q4: store-backed group collapse (viewState.collapsedGroups from PR-Q2).
  // Clicking a group header in the label column toggles the group's key in
  // this set; collapsed groups drop out of visibleLanes entirely (cascading
  // reflow). "Expand all" button in TimelineControls restores everything.
  const collapsedGroupsArr = viewState.collapsedGroups ?? []
  const collapsedGroupsSet = useMemo(() => new Set(collapsedGroupsArr), [collapsedGroupsArr])
  const toggleGroupCollapse = useCallback(
    (groupKey: string) => {
      const next = new Set(collapsedGroupsArr)
      if (next.has(groupKey)) next.delete(groupKey)
      else next.add(groupKey)
      onUpdateViewState({ collapsedGroups: Array.from(next) })
    },
    [collapsedGroupsArr, onUpdateViewState],
  )
  const expandAllGroups = useCallback(() => {
    if (collapsedGroupsArr.length === 0) return
    onUpdateViewState({ collapsedGroups: [] })
  }, [collapsedGroupsArr.length, onUpdateViewState])
  const now = useMemo(() => new Date(), [])

  const [zoom, setZoom] = useState<TimelineMode>("all")
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
  const [viewportW, setViewportW] = useState(0)

  /** B4: when grouping is active, sort articles by group order + tag each
   *  article with its groupKey/groupLabel so label-column can render sticky
   *  headers between groups. Falls back to a single implicit group when no
   *  grouping is active (or grouping produces a single bucket). */
  const groupingActive = useMemo(() => {
    if (!wikiGroups || wikiGroups.length === 0) return false
    if (wikiGroups.length === 1 && wikiGroups[0].key === "_all") return false
    return true
  }, [wikiGroups])

  const articleGroupMeta = useMemo(() => {
    const meta = new Map<string, { key: string; label: string; order: number }>()
    if (!groupingActive || !wikiGroups) return meta
    wikiGroups.forEach((g, order) => {
      for (const a of g.articles) {
        meta.set(a.id, { key: g.key, label: g.label, order })
      }
    })
    return meta
  }, [groupingActive, wikiGroups])

  const validArticles = useMemo(() => {
    const filtered = articles.filter((a) => safeDate(a.createdAt) !== null)
    if (!groupingActive) return filtered
    // Stable sort: group order primary, original article order secondary.
    return [...filtered].sort((a, b) => {
      const ma = articleGroupMeta.get(a.id)?.order ?? Number.MAX_SAFE_INTEGER
      const mb = articleGroupMeta.get(b.id)?.order ?? Number.MAX_SAFE_INTEGER
      return ma - mb
    })
  }, [articles, groupingActive, articleGroupMeta])

  /** "All" mode: data-fitted config + winStart. Computed always (cheap); used when zoom === "all". */
  const allFit = useMemo(
    () => computeAllFit(validArticles, Math.max((viewportW || 1000) - LABEL_COL_WIDTH, 1), now, getHorizon),
    [validArticles, viewportW, now],
  )

  const cfg = zoom === "all" ? allFit.cfg : ZOOM_CONFIGS[zoom]
  const winStart = useMemo(
    () => (zoom === "all" ? allFit.winStart : windowStart(anchor, zoom)),
    [zoom, allFit, anchor],
  )
  const winEnd = useMemo(() => addDays(winStart, cfg.totalDays), [winStart, cfg.totalDays])

  const canvasWidth = cfg.pxPerDay * cfg.totalDays

  const allLanes = useMemo(
    () => laneArticles(validArticles, winStart, cfg.pxPerDay, cfg.minBarWidth, getHorizon),
    [validArticles, winStart, cfg.pxPerDay, cfg.minBarWidth],
  )

  // PR-Q4: visible lanes = allLanes minus articles whose group is collapsed.
  // When no group is collapsed (common case), this is a no-op pointer alias.
  const lanes = useMemo(() => {
    if (collapsedGroupsSet.size === 0 || !groupingActive) return allLanes
    return allLanes.filter(({ article }) => {
      const meta = articleGroupMeta.get(article.id)
      const key = meta?.key ?? "_ungrouped"
      return !collapsedGroupsSet.has(key)
    })
  }, [allLanes, collapsedGroupsSet, groupingActive, articleGroupMeta])

  /** B4: precompute group boundaries from the (already group-sorted) lanes
   *  so both the label column (header band) and the canvas grid (divider
   *  line) use the same source of truth. Each entry marks the lane index
   *  where a new group starts + its label + how many lanes it contains. */
  const groupBoundaries = useMemo(() => {
    if (!groupingActive || articleGroupMeta.size === 0) return null
    // PR-Q4: `key` added so TimelineLabelColumn can emit it on header click.
    const out: { laneIndex: number; label: string; count: number; key: string }[] = []
    let lastKey: string | null = null
    let runStart = 0
    lanes.forEach(({ article }, laneIndex) => {
      const meta = articleGroupMeta.get(article.id)
      const key = meta?.key ?? "_ungrouped"
      if (key !== lastKey) {
        if (out.length > 0) out[out.length - 1].count = laneIndex - runStart
        out.push({ laneIndex, label: meta?.label ?? "Other", count: 0, key })
        lastKey = key
        runStart = laneIndex
      }
    })
    if (out.length > 0) out[out.length - 1].count = lanes.length - runStart
    return out.length > 0 ? out : null
  }, [groupingActive, articleGroupMeta, lanes])

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
    const measure = () => {
      setViewportH(el.clientHeight)
      setViewportW(el.clientWidth)
    }
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
      // currentEndX is the bar's right edge = (horizonDayIdx + 1) * pxPerDay
      // (the bar covers whole day cells), so the horizon day itself is days - 1.
      const days = Math.round(dragState!.currentEndX / cfg.pxPerDay)
      const date = startOfDay(addDays(winStart, days - 1))
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
      if (zoom === "all") return // "all" fits the whole span — nothing to navigate
      const stepDays = Math.round(cfg.totalDays * 0.4)
      setAnchor((prev) => addDays(prev, dir * stepDays))
    },
    [zoom, cfg.totalDays],
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
        collapsedGroupCount={collapsedGroupsArr.length}
        onExpandAllGroups={expandAllGroups}
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
            {/* Left label column — sticky left:0. Wiki adapter inline: stub →
                IconWikiStub + stub orange, article → IconWikiArticle + emerald. */}
            <TimelineLabelColumn
              lanes={lanes}
              getStatusColor={(article) =>
                isWikiStub(article as WikiArticle) ? WIKI_STATUS_HEX.stub : WIKI_STATUS_HEX.article
              }
              renderStatusIcon={(article, size) =>
                isWikiStub(article as WikiArticle)
                  ? <IconWikiStub size={size ?? 13} />
                  : <IconWikiArticle size={size ?? 13} />
              }
              activeArticleId={activeArticleId}
              selectedIds={selectedIds}
              hoveredId={hoveredId}
              svgHeight={svgHeight}
              visibleColumns={viewState.visibleColumns}
              groupBoundaries={groupBoundaries}
              onToggleGroup={toggleGroupCollapse}
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
                  groupBoundaries={groupBoundaries}
                />

                {/* Article bars — wiki adapter resolves stub/article color. */}
                {lanes.map((item, laneIndex) => (
                  <TimelineBar
                    key={item.article.id}
                    item={item}
                    statusColor={isWikiStub(item.article) ? WIKI_STATUS_HEX.stub : WIKI_STATUS_HEX.article}
                    canEditHorizon
                    laneIndex={laneIndex}
                    activeArticleId={activeArticleId}
                    selectedIds={selectedIds}
                    hoveredId={hoveredId}
                    dragState={dragState}
                    nowX={nowX}
                    canvasWidth={canvasWidth}
                    setHoveredId={setHoveredId}
                    setTooltip={setTooltip}
                    setDragState={setDragState}
                    onOpenArticle={onOpenArticle}
                    onSelect={onSelect}
                  />
                ))}

                {/* Start chip (always shown) + activity markers (hidden when the Events toggle is off) */}
                {lanes.map((item, laneIndex) => (
                  <TimelineEventMarkers
                    key={`events-${item.article.id}`}
                    article={item.article}
                    laneIndex={laneIndex}
                    barX={item.x}
                    eventsByArticleId={eventsByArticleId}
                    cfg={cfg}
                    winStart={winStart}
                    setEventTooltip={setEventTooltip}
                  />
                ))}
              </svg>

              {/* ── B2: Tooltip — wiki adapter inline (stub/article icon +
                  planning preview during drag, planned/updated date otherwise). */}
              <TimelineTooltip
                tooltip={tooltip}
                tooltipArticle={tooltipArticle}
                getStatusColor={(article) =>
                  isWikiStub(article as WikiArticle) ? WIKI_STATUS_HEX.stub : WIKI_STATUS_HEX.article
                }
                renderStatusIcon={(article, size) =>
                  isWikiStub(article as WikiArticle)
                    ? <IconWikiStub size={size ?? 12} />
                    : <IconWikiArticle size={size ?? 12} />
                }
                getStatusLabel={(article) =>
                  isWikiStub(article as WikiArticle) ? "Stub" : "Article"
                }
                renderHorizonLine={(article, drag) => {
                  const a = article as WikiArticle
                  const fmt = (d: Date) =>
                    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  // During drag — show live planning date
                  if (drag && a.id === drag.id) {
                    const days = Math.round(drag.currentEndX / cfg.pxPerDay)
                    const liveDragDate = startOfDay(addDays(winStart, days - 1))
                    const rel = relativeDateLabel(liveDragDate, now)
                    return (
                      <span className="text-muted-foreground">
                        <span style={{ color: WIKI_STATUS_HEX.stub, fontWeight: 500 }}>Planning</span>{" "}
                        {fmt(liveDragDate)}
                        <span className="opacity-60"> ({rel})</span>
                      </span>
                    )
                  }
                  const planned = safeDate(a.plannedDate)
                  const updated = safeDate(a.updatedAt)
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
                }}
                dragState={dragState}
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
