"use client"

/**
 * timeline-label-column.tsx — the left sticky label column (one row per lane:
 * status icon + title + created date). Extracted from WikiTimelineView's main
 * render.
 */

import type { Dispatch, SetStateAction } from "react"
import { isWikiStub, safeDate } from "@/lib/wiki-utils"
import { cn } from "@/lib/utils"
import { WIKI_STATUS_HEX } from "@/lib/colors"
import { IconWikiStub, IconWikiArticle } from "@/components/plot-icons"
import {
  LANE_HEIGHT,
  LABEL_COL_WIDTH,
  type LanedArticle,
  type TimelineTooltipState,
} from "./wiki-timeline-config"

export interface TimelineLabelColumnProps {
  lanes: LanedArticle[]
  activeArticleId: string | null
  selectedIds: Set<string>
  hoveredId: string | null
  svgHeight: number
  setHoveredId: Dispatch<SetStateAction<string | null>>
  setTooltip: Dispatch<SetStateAction<TimelineTooltipState | null>>
  onOpenArticle: (id: string) => void
  onSelect: (id: string, opts: { multi?: boolean; shift?: boolean; index?: number }) => void
}

export function TimelineLabelColumn({
  lanes,
  activeArticleId,
  selectedIds,
  hoveredId,
  svgHeight,
  setHoveredId,
  setTooltip,
  onOpenArticle,
  onSelect,
}: TimelineLabelColumnProps) {
  return (
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
  )
}
