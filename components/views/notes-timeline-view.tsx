"use client"

/**
 * NotesTimelineView — bars-first timeline for the Notes entity.
 *
 * Uses the same sub-components (timeline-bar / timeline-grid /
 * timeline-label-column / timeline-tooltip / timeline-controls /
 * timeline-axis) as WikiTimelineView, but supplies a Note adapter:
 *   - status icon set = IconStone / IconBrick / IconBlock
 *   - status color   = NOTE_STATUS_HEX[status]
 *   - horizon        = updatedAt (notes have no plannedDate)
 *   - canEditHorizon = false (no drag — notes don't expose lifespan editing)
 *   - events         = omitted (notes events markers ship in a follow-up)
 *
 * Simplifications vs WikiTimelineView (intentional, audit "noteline" tier 1):
 *   - No event markers (no TimelineEventMarkers render)
 *   - No drag handle (canEditHorizon=false on every bar)
 *   - Tooltip horizon line = "Updated X" only (no Planning preview)
 */

import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { safeDate } from "@/lib/wiki-utils"
import type { Note, NoteStatus } from "@/lib/types"
import type { ViewState, NoteGroup } from "@/lib/view-engine/types"
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
import { IconStone, IconBrick, IconBlock } from "@/components/plot-icons"
import { NOTE_STATUS_HEX } from "@/lib/colors"
import type { EntityEvent } from "@/lib/types"

/** Empty events map — Notes timeline doesn't render activity markers in
 *  tier 1, but TimelineEventMarkers also draws the bar-origin "start chip"
 *  which we want regardless. Passing an empty map gives us just the chip. */
const EMPTY_EVENTS_MAP = new Map<string, EntityEvent[]>()

/* ── Adapter helpers (Note → TimelineEntity-friendly) ────────── */

/** Note → horizon = its updatedAt (no plannedDate concept). Returns null if
 *  the date string is unparseable so laneArticles drops the row cleanly. */
function noteHorizon(n: Note): Date | null {
  return safeDate(n.updatedAt)
}

function noteStatusColor(status: NoteStatus | undefined): string {
  if (status === "brick") return NOTE_STATUS_HEX.brick
  if (status === "keystone") return NOTE_STATUS_HEX.keystone
  return NOTE_STATUS_HEX.stone
}

function NoteStatusIcon({ status, size = 13 }: { status: NoteStatus | undefined; size?: number }) {
  if (status === "keystone") return <IconBlock size={size} />
  if (status === "brick") return <IconBrick size={size} />
  return <IconStone size={size} />
}

function noteStatusLabel(status: NoteStatus | undefined): string {
  if (status === "keystone") return "Block"
  if (status === "brick") return "Brick"
  return "Stone"
}

/* ── Props ──────────────────────────────────────────────────── */

export interface NotesTimelineViewProps {
  notes: Note[]
  viewState: ViewState
  /** Pre-grouped notes from the use-notes-view pipeline (B4 timeline lane
   *  grouping). When provided with >1 non-empty group, the timeline sorts
   *  notes by group order and renders header bands between groups. */
  noteGroups?: NoteGroup[] | null
  selectedIds: Set<string>
  activeNoteId: string | null
  onOpenNote: (id: string) => void
  onSelect: (id: string, opts: { multi?: boolean; shift?: boolean; index?: number }) => void
  /** PR-Q4 parity (wiki): caller writes collapse state back to viewState. */
  onUpdateViewState?: (patch: Partial<ViewState>) => void
}

/* ── Component ──────────────────────────────────────────────── */

export function NotesTimelineView({
  notes,
  viewState,
  noteGroups,
  selectedIds,
  activeNoteId,
  onOpenNote,
  onSelect,
  onUpdateViewState,
}: NotesTimelineViewProps) {
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
    if (!noteGroups || noteGroups.length === 0) return false
    if (noteGroups.length === 1 && noteGroups[0].key === "_all") return false
    return true
  }, [noteGroups])

  const noteGroupMeta = useMemo(() => {
    const meta = new Map<string, { key: string; label: string; order: number }>()
    if (!groupingActive || !noteGroups) return meta
    noteGroups.forEach((g, order) => {
      for (const n of g.notes) meta.set(n.id, { key: g.key, label: g.label, order })
    })
    return meta
  }, [groupingActive, noteGroups])

  const validNotes = useMemo(() => {
    const filtered = notes.filter((n) => safeDate(n.createdAt) !== null)
    if (!groupingActive) return filtered
    return [...filtered].sort((a, b) => {
      const ma = noteGroupMeta.get(a.id)?.order ?? Number.MAX_SAFE_INTEGER
      const mb = noteGroupMeta.get(b.id)?.order ?? Number.MAX_SAFE_INTEGER
      return ma - mb
    })
  }, [notes, groupingActive, noteGroupMeta])

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
    () => computeAllFit(validNotes, Math.max((viewportW || 1000) - LABEL_COL_WIDTH, 1), now, noteHorizon),
    [validNotes, viewportW, now],
  )

  const cfg = zoom === "all" ? allFit.cfg : ZOOM_CONFIGS[zoom]
  const winStart = useMemo(
    () => (zoom === "all" ? allFit.winStart : windowStart(anchor, zoom)),
    [zoom, allFit, anchor],
  )
  const winEnd = useMemo(() => addDays(winStart, cfg.totalDays), [winStart, cfg.totalDays])

  const canvasWidth = cfg.pxPerDay * cfg.totalDays

  const allLanes = useMemo(
    () => laneArticles(validNotes, winStart, cfg.pxPerDay, cfg.minBarWidth, noteHorizon),
    [validNotes, winStart, cfg.pxPerDay, cfg.minBarWidth],
  )

  // PR-Q4 v2 (wiki parity): expanded-group lanes + ghost-lane placeholders.
  const lanes = useMemo(() => {
    if (!groupingActive || !noteGroups || collapsedGroupsSet.size === 0) return allLanes
    type GhostLane = { isCollapsedHeader: true; groupKey: string; label: string; count: number; x: 0; width: 0 }
    type Lane = (typeof allLanes)[number] | GhostLane
    const lanesByGroup = new Map<string, typeof allLanes>()
    for (const lane of allLanes) {
      const meta = noteGroupMeta.get(lane.article.id)
      const key = meta?.key ?? "_ungrouped"
      if (!lanesByGroup.has(key)) lanesByGroup.set(key, [])
      lanesByGroup.get(key)!.push(lane)
    }
    const out: Lane[] = []
    for (const g of noteGroups) {
      if (g.notes.length === 0) continue
      if (collapsedGroupsSet.has(g.key)) {
        out.push({
          isCollapsedHeader: true,
          groupKey: g.key,
          label: g.label,
          count: g.notes.length,
          x: 0,
          width: 0,
        })
      } else {
        const inGroup = lanesByGroup.get(g.key) ?? []
        out.push(...inGroup)
      }
    }
    return out
  }, [allLanes, collapsedGroupsSet, groupingActive, noteGroupMeta, noteGroups])

  /** B4: group boundary lane indices. PR-Q4 v2: skip ghost lanes (label
   *  column owns their UI). */
  const groupBoundaries = useMemo(() => {
    if (!groupingActive || noteGroupMeta.size === 0) return null
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
      const meta = noteGroupMeta.get(item.article.id)
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
  }, [groupingActive, noteGroupMeta, lanes])

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

  const tooltipNote: Note | null | undefined = tooltip
    ? notes.find((n) => n.id === tooltip.id)
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
              getStatusColor={(n) => noteStatusColor((n as Note).status)}
              renderStatusIcon={(n, size) => <NoteStatusIcon status={(n as Note).status} size={size} />}
              activeArticleId={activeNoteId}
              selectedIds={selectedIds}
              hoveredId={hoveredId}
              svgHeight={svgHeight}
              visibleColumns={viewState.visibleColumns}
              groupBoundaries={groupBoundaries}
              onToggleGroup={toggleGroupCollapse}
              setHoveredId={setHoveredId}
              setTooltip={setTooltip}
              onOpenArticle={onOpenNote}
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
                  // PR-Q4 v2: ghost lanes (collapsed-group headers) are
                  // rendered by the label column; bar layer skips them.
                  if ("isCollapsedHeader" in item) return null
                  return (
                    <TimelineBar
                      key={item.article.id}
                      item={item}
                      statusColor={noteStatusColor((item.article as Note).status)}
                      canEditHorizon={false}
                      laneIndex={laneIndex}
                      activeArticleId={activeNoteId}
                      selectedIds={selectedIds}
                      hoveredId={hoveredId}
                      dragState={null}
                      nowX={nowX}
                      canvasWidth={canvasWidth}
                      setHoveredId={setHoveredId}
                      setTooltip={setTooltip}
                      setDragState={() => {}}
                      onOpenArticle={onOpenNote}
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
                tooltipArticle={tooltipNote as TimelineEntity | null | undefined}
                getStatusColor={(n) => noteStatusColor((n as Note).status)}
                renderStatusIcon={(n, size) => <NoteStatusIcon status={(n as Note).status} size={size ?? 12} />}
                getStatusLabel={(n) => noteStatusLabel((n as Note).status)}
                renderHorizonLine={(n) => {
                  const updated = safeDate((n as Note).updatedAt)
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
          {lanes.length} note{lanes.length === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  )
}
