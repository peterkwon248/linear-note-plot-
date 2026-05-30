"use client"

/**
 * BooksTimelineView — bars-first timeline for the Books entity.
 *
 * Mirrors NotesTimelineView's shape using the same sub-components, but with
 * a Book adapter:
 *   - status (kind) icon set = Zap (smart) / Sparkles (hybrid) / Pencil (manual)
 *   - status color           = SPACE_COLORS.books tints per kind
 *   - horizon                = updatedAt (books have no plannedDate)
 *   - canEditHorizon         = false (no drag — books don't expose lifespan editing)
 *   - events                 = omitted (book events markers ship in a follow-up)
 */

import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { safeDate } from "@/lib/wiki-utils"
import type { Book } from "@/lib/types"
import type { ViewState } from "@/lib/view-engine/types"
import type { BookGroup } from "@/lib/view-engine/use-books-view"
import { getBookKind } from "@/lib/view-engine/use-books-view"
import {
  AXIS_HEIGHT,
  LANE_HEIGHT,
  LABEL_COL_WIDTH,
  ZOOM_CONFIGS,
  type TimelineMode,
  type TimelineEntity,
  type TimelineTooltipState,
} from "./wiki-timeline/wiki-timeline-config"
import {
  startOfDay,
  addDays,
  windowStart,
  buildTicks,
  buildDayRange,
  buildMonthBoundaries,
  laneArticles,
  computeAllFit,
} from "./wiki-timeline/wiki-timeline-utils"
import { TimelineControls } from "./wiki-timeline/timeline-controls"
import { TimelineAxis } from "./wiki-timeline/timeline-axis"
import { TimelineGrid } from "./wiki-timeline/timeline-grid"
import { TimelineBar } from "./wiki-timeline/timeline-bar"
import { TimelineEventMarkers } from "./wiki-timeline/timeline-event-markers"
import { TimelineLabelColumn } from "./wiki-timeline/timeline-label-column"
import { TimelineTooltip } from "./wiki-timeline/timeline-tooltip"
import { Zap, Sparkles, Pencil } from "lucide-react"
import type { EntityEvent } from "@/lib/types"

/** Empty events map — see notes-timeline-view.tsx; bar-origin start chip
 *  rendering only. */
const EMPTY_EVENTS_MAP = new Map<string, EntityEvent[]>()

/* ── Adapter helpers (Book → TimelineEntity-friendly) ────────── */

function bookHorizon(b: Book): Date | null {
  return safeDate(b.updatedAt)
}

/** Book kind → achromatic luminance tiers (classification axis ≠ entity).
 *  smart  = zinc-600 (#52525b, darkest — most prominent)
 *  hybrid = zinc-400 (#a1a1aa, mid)
 *  manual = zinc-300 (#d4d4d8, lightest)
 *  Avoids collisions with home-space indigo (#5E6AD2 / #7C8AE7) and
 *  in_progress amber (#f59e0b). Matches BookKindChip achromatic palette. */
function bookKindColor(kind: ReturnType<typeof getBookKind>): string {
  if (kind === "smart") return "#52525b"   // zinc-600
  if (kind === "hybrid") return "#a1a1aa"  // zinc-400
  return "#d4d4d8"                          // zinc-300
}

function BookKindIcon({ kind, size = 13 }: { kind: ReturnType<typeof getBookKind>; size?: number }) {
  if (kind === "smart") return <Zap size={size} strokeWidth={2} />
  if (kind === "hybrid") return <Sparkles size={size} strokeWidth={2} />
  return <Pencil size={size} strokeWidth={2} />
}

function bookKindLabel(kind: ReturnType<typeof getBookKind>): string {
  if (kind === "smart") return "Smart"
  if (kind === "hybrid") return "Hybrid"
  return "Manual"
}

/** Book.title can be empty for "Untitled book"; this matches the label-column
 *  fallback in book-table.tsx. Implements TimelineEntity since Book itself
 *  already carries id/title/createdAt/updatedAt. */
type BookEntity = Book & { title: string }

function asTimelineEntity(b: Book): BookEntity {
  return { ...b, title: b.title || "Untitled book" }
}

/* ── Props ──────────────────────────────────────────────────── */

export interface BooksTimelineViewProps {
  books: Book[]
  viewState: ViewState
  bookGroups?: BookGroup[] | null
  selectedIds: Set<string>
  activeBookId: string | null
  onOpenBook: (id: string) => void
  onSelect: (id: string, opts: { multi?: boolean; shift?: boolean; index?: number }) => void
  /** PR-Q4 parity (wiki/notes): caller writes collapse state back. */
  onUpdateViewState?: (patch: Partial<ViewState>) => void
}

/* ── Component ──────────────────────────────────────────────── */

export function BooksTimelineView({
  books,
  viewState,
  bookGroups,
  selectedIds,
  activeBookId,
  onOpenBook,
  onSelect,
  onUpdateViewState,
}: BooksTimelineViewProps) {
  // PR-Q4 (wiki parity): store-backed group collapse + "Expand all" affordance.
  const collapsedGroupsArr = viewState.collapsedGroups ?? []
  const collapsedGroupsSet = useMemo(() => new Set(collapsedGroupsArr), [collapsedGroupsArr])
  const toggleGroupCollapse = useCallback(
    (groupKey: string) => {
      if (!onUpdateViewState) return
      const next = new Set(collapsedGroupsArr)
      if (next.has(groupKey)) next.delete(groupKey)
      else next.add(groupKey)
      onUpdateViewState({ collapsedGroups: Array.from(next) })
    },
    [collapsedGroupsArr, onUpdateViewState],
  )
  const expandAllGroups = useCallback(() => {
    if (!onUpdateViewState || collapsedGroupsArr.length === 0) return
    onUpdateViewState({ collapsedGroups: [] })
  }, [collapsedGroupsArr.length, onUpdateViewState])
  const now = useMemo(() => new Date(), [])

  const [zoom, setZoom] = useState<TimelineMode>("all")
  const [anchor, setAnchor] = useState<Date>(() => startOfDay(now))
  const [tooltip, setTooltip] = useState<TimelineTooltipState | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const canvasSvgRef = useRef<SVGSVGElement>(null)
  const canvasScrollRef = useRef<HTMLDivElement>(null)
  const [viewportH, setViewportH] = useState(0)
  const [viewportW, setViewportW] = useState(0)

  /* ── Group order sort + meta ── */

  const groupingActive = useMemo(() => {
    if (!bookGroups || bookGroups.length === 0) return false
    if (bookGroups.length === 1 && bookGroups[0].key === "_all") return false
    return true
  }, [bookGroups])

  const bookGroupMeta = useMemo(() => {
    const meta = new Map<string, { key: string; label: string; order: number }>()
    if (!groupingActive || !bookGroups) return meta
    bookGroups.forEach((g, order) => {
      for (const b of g.books) meta.set(b.id, { key: g.key, label: g.label, order })
    })
    return meta
  }, [groupingActive, bookGroups])

  const validBooks = useMemo(() => {
    const filtered = books
      .filter((b) => safeDate(b.createdAt) !== null)
      .map(asTimelineEntity)
    if (!groupingActive) return filtered
    return [...filtered].sort((a, b) => {
      const ma = bookGroupMeta.get(a.id)?.order ?? Number.MAX_SAFE_INTEGER
      const mb = bookGroupMeta.get(b.id)?.order ?? Number.MAX_SAFE_INTEGER
      return ma - mb
    })
  }, [books, groupingActive, bookGroupMeta])

  /* ── Viewport size observer ── */

  useEffect(() => {
    const el = canvasScrollRef.current
    if (!el) return
    const update = () => {
      setViewportH(el.clientHeight)
      setViewportW(el.clientWidth)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /* ── Zoom + window math ── */

  const allFit = useMemo(
    () => computeAllFit(validBooks, Math.max((viewportW || 1000) - LABEL_COL_WIDTH, 1), now, bookHorizon),
    [validBooks, viewportW, now],
  )

  const cfg = zoom === "all" ? allFit.cfg : ZOOM_CONFIGS[zoom]
  const winStart = useMemo(
    () => (zoom === "all" ? allFit.winStart : windowStart(anchor, zoom)),
    [zoom, allFit, anchor],
  )
  const winEnd = useMemo(() => addDays(winStart, cfg.totalDays), [winStart, cfg.totalDays])

  const canvasWidth = cfg.pxPerDay * cfg.totalDays

  const allLanes = useMemo(
    () => laneArticles(validBooks, winStart, cfg.pxPerDay, cfg.minBarWidth, bookHorizon),
    [validBooks, winStart, cfg.pxPerDay, cfg.minBarWidth],
  )

  // PR-Q4 v2 (wiki parity): expanded-group lanes + ghost-lane placeholders.
  const lanes = useMemo(() => {
    if (!groupingActive || !bookGroups || collapsedGroupsSet.size === 0) return allLanes
    type GhostLane = { isCollapsedHeader: true; groupKey: string; label: string; count: number; x: 0; width: 0 }
    type Lane = (typeof allLanes)[number] | GhostLane
    const lanesByGroup = new Map<string, typeof allLanes>()
    for (const lane of allLanes) {
      const meta = bookGroupMeta.get(lane.article.id)
      const key = meta?.key ?? "_ungrouped"
      if (!lanesByGroup.has(key)) lanesByGroup.set(key, [])
      lanesByGroup.get(key)!.push(lane)
    }
    const out: Lane[] = []
    for (const g of bookGroups) {
      if (g.books.length === 0) continue
      if (collapsedGroupsSet.has(g.key)) {
        out.push({
          isCollapsedHeader: true,
          groupKey: g.key,
          label: g.label,
          count: g.books.length,
          x: 0,
          width: 0,
        })
      } else {
        const inGroup = lanesByGroup.get(g.key) ?? []
        out.push(...inGroup)
      }
    }
    return out
  }, [allLanes, collapsedGroupsSet, groupingActive, bookGroupMeta, bookGroups])

  const groupBoundaries = useMemo(() => {
    if (!groupingActive || bookGroupMeta.size === 0) return null
    const out: { laneIndex: number; label: string; count: number; key: string }[] = []
    let lastKey: string | null = null
    let runStart = 0
    lanes.forEach((item, laneIndex) => {
      if ("isCollapsedHeader" in item) {
        if (out.length > 0) out[out.length - 1].count = laneIndex - runStart
        lastKey = null
        runStart = laneIndex + 1
        return
      }
      const meta = bookGroupMeta.get(item.article.id)
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
  }, [groupingActive, bookGroupMeta, lanes])

  const ticks = useMemo(
    () => buildTicks(winStart, winEnd, zoom),
    [winStart, winEnd, zoom],
  )
  const allDays = useMemo(() => buildDayRange(winStart, winEnd), [winStart, winEnd])
  const monthBoundaries = useMemo(
    () => buildMonthBoundaries(winStart, winEnd),
    [winStart, winEnd],
  )
  const nowX = (now.getTime() - winStart.getTime()) / (1000 * 60 * 60 * 24) * cfg.pxPerDay

  const tooltipBook = tooltip
    ? validBooks.find((b) => b.id === tooltip.id) ?? null
    : null

  const svgHeight = Math.max(viewportH - AXIS_HEIGHT, lanes.length * LANE_HEIGHT)

  /* ── Navigation handlers ── */

  const handleNavigate = useCallback(
    (dir: -1 | 1) => {
      if (zoom === "all") return
      setAnchor((a) => addDays(a, dir * ZOOM_CONFIGS[zoom].totalDays))
    },
    [zoom],
  )
  const handleToday = useCallback(() => setAnchor(startOfDay(now)), [now])

  /* ── Render ──────────────────────────────────────────────── */

  return (
    <div className="flex h-full w-full flex-col">
      <TimelineControls
        zoom={zoom}
        anchor={anchor}
        showEvents={false}
        onNavigate={handleNavigate}
        onGoToToday={handleToday}
        onSetZoom={setZoom}
        onToggleEvents={() => {}}
        collapsedGroupCount={collapsedGroupsArr.length}
        onExpandAllGroups={expandAllGroups}
      />

      <div className="flex flex-1 min-h-0">
        <div
          ref={canvasScrollRef}
          className="relative flex flex-1 overflow-auto"
        >
          <div
            className="flex"
            style={{ position: "relative", minHeight: svgHeight }}
          >
            <TimelineLabelColumn
              lanes={lanes}
              getStatusColor={(b) => bookKindColor(getBookKind(b as Book))}
              renderStatusIcon={(b, size) => <BookKindIcon kind={getBookKind(b as Book)} size={size} />}
              activeArticleId={activeBookId}
              selectedIds={selectedIds}
              hoveredId={hoveredId}
              svgHeight={svgHeight}
              visibleColumns={viewState.visibleColumns}
              groupBoundaries={groupBoundaries}
              onToggleGroup={toggleGroupCollapse}
              setHoveredId={setHoveredId}
              setTooltip={setTooltip}
              onOpenArticle={onOpenBook}
              onSelect={onSelect}
            />

            <div
              style={{ flex: 1, position: "relative", minHeight: svgHeight }}
              onClick={() => setTooltip(null)}
            >
              <svg
                ref={canvasSvgRef}
                width={canvasWidth}
                height={svgHeight}
                style={{ display: "block" }}
              >
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

                {lanes.map((item, laneIndex) => {
                  if ("isCollapsedHeader" in item) return null
                  return (
                    <TimelineBar
                      key={item.article.id}
                      item={item}
                      statusColor={bookKindColor(getBookKind(item.article as Book))}
                      canEditHorizon={false}
                      laneIndex={laneIndex}
                      activeArticleId={activeBookId}
                      selectedIds={selectedIds}
                      hoveredId={hoveredId}
                      dragState={null}
                      nowX={nowX}
                      canvasWidth={canvasWidth}
                      setHoveredId={setHoveredId}
                      setTooltip={setTooltip}
                      setDragState={() => {}}
                      onOpenArticle={onOpenBook}
                      onSelect={onSelect}
                    />
                  )
                })}

                {/* Bar-origin start chips (no activity markers — empty events map) */}
                {lanes.map((item, laneIndex) => {
                  if ("isCollapsedHeader" in item) return null
                  return (
                    <TimelineEventMarkers
                      key={`events-${item.article.id}`}
                      article={item.article}
                      laneIndex={laneIndex}
                      barX={item.x}
                      eventsByArticleId={EMPTY_EVENTS_MAP}
                      cfg={cfg}
                      winStart={winStart}
                      setEventTooltip={() => {}}
                    />
                  )
                })}
              </svg>

              <TimelineAxis
                ticks={ticks}
                cfg={cfg}
                winStart={winStart}
                canvasWidth={canvasWidth}
                nowX={nowX}
              />

              <TimelineTooltip
                tooltip={tooltip}
                tooltipArticle={tooltipBook as TimelineEntity | null}
                getStatusColor={(b) => bookKindColor(getBookKind(b as Book))}
                renderStatusIcon={(b, size) => <BookKindIcon kind={getBookKind(b as Book)} size={size ?? 12} />}
                getStatusLabel={(b) => bookKindLabel(getBookKind(b as Book))}
                renderHorizonLine={(b) => {
                  const updated = safeDate((b as Book).updatedAt)
                  if (!updated) return null
                  return (
                    <span className="text-muted-foreground">
                      Updated {updated.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  )
                }}
                dragState={null}
                canvasScrollRef={canvasScrollRef}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center border-t border-border-subtle px-4 py-1.5">
        <span className="text-2xs text-muted-foreground">
          {lanes.length} book{lanes.length === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  )
}
