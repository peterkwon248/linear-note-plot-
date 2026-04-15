"use client"

/**
 * ColumnMetaPositionMenu — Phase 2-2-B-1.
 *
 * Header popover: lets the user set where TOC / Infobox appears across current columns.
 * Options per meta entity:
 *   - Hide (infobox) / Show+Hide (TOC)
 *   - Column selector (1·2·3·...·N based on current article.layout.columns.length)
 *
 * Uses `setTocStyle` / `setInfoboxColumnPath` store actions. Read-only users
 * can still open the popover (informational) — changes go through the store
 * which is already restricted to editable contexts in the consumer header UI.
 */

import { usePlotStore } from "@/lib/store"
import type { ColumnPath } from "@/lib/types"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { List } from "@phosphor-icons/react/dist/ssr/List"

export interface ColumnMetaPositionMenuProps {
  articleId: string
  compact?: boolean
}

export function ColumnMetaPositionMenu({ articleId, compact = false }: ColumnMetaPositionMenuProps) {
  const article = usePlotStore((s) => s.wikiArticles.find((a) => a.id === articleId))
  const setTocStyle = usePlotStore((s) => s.setTocStyle)
  const setInfoboxColumnPath = usePlotStore((s) => s.setInfoboxColumnPath)

  if (!article) return null
  const colCount = article.layout?.columns.length ?? 1
  const tocStyle = article.tocStyle
  const currentTocCol = tocStyle?.position?.[0] ?? 0
  const tocVisible = tocStyle?.show !== false
  const currentInfoboxCol = article.infoboxColumnPath?.[0] ?? 0

  const handleTocCol = (col: number) => {
    setTocStyle(articleId, {
      show: true,
      position: [col] as ColumnPath,
      collapsed: tocStyle?.collapsed ?? false,
    })
  }
  const handleTocHide = () => {
    setTocStyle(articleId, { show: false, position: [0] as ColumnPath, collapsed: false })
  }
  const handleInfoboxCol = (col: number) => {
    setInfoboxColumnPath(articleId, [col] as ColumnPath)
  }
  const handleTocCollapseToggle = () => {
    setTocStyle(articleId, {
      show: tocVisible,
      position: (tocStyle?.position ?? [0]) as ColumnPath,
      collapsed: !(tocStyle?.collapsed ?? false),
    })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Layout & meta positions"
          className={cn(
            "inline-flex items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground",
            compact ? "h-7 w-7" : "h-8 w-8",
          )}
        >
          <List size={compact ? 14 : 16} weight="regular" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3">
        <div className="space-y-4">
          {/* TOC */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
                Table of Contents
              </h4>
              <button
                type="button"
                onClick={tocVisible ? handleTocHide : () => handleTocCol(Math.max(0, colCount - 1))}
                className={cn(
                  "rounded-sm px-1.5 py-0.5 text-2xs transition-colors",
                  tocVisible
                    ? "text-muted-foreground hover:bg-hover-bg hover:text-foreground"
                    : "bg-accent/15 text-accent",
                )}
              >
                {tocVisible ? "Hide" : "Hidden"}
              </button>
            </div>
            {tocVisible && (
              <>
                <ColumnChipRow
                  colCount={colCount}
                  activeCol={currentTocCol}
                  onPick={handleTocCol}
                />
                <label className="flex cursor-pointer items-center gap-2 text-2xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={tocStyle?.collapsed ?? false}
                    onChange={handleTocCollapseToggle}
                    className="h-3 w-3 accent-accent"
                  />
                  Collapsed by default
                </label>
              </>
            )}
          </section>

          {/* Infobox */}
          <section className="space-y-2">
            <h4 className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
              Infobox Column
            </h4>
            <ColumnChipRow
              colCount={colCount}
              activeCol={currentInfoboxCol}
              onPick={handleInfoboxCol}
            />
          </section>

          <p className="text-2xs text-muted-foreground/60">
            Current layout: {colCount} col{colCount > 1 ? "s" : ""}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}

/* ── Column chip row (1·2·3·...·N) ───────────────────────────── */

function ColumnChipRow({
  colCount,
  activeCol,
  onPick,
}: {
  colCount: number
  activeCol: number
  onPick: (col: number) => void
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-md border border-border-subtle bg-secondary/40 p-0.5">
      {Array.from({ length: colCount }, (_, i) => {
        const isActive = i === activeCol
        return (
          <button
            key={i}
            type="button"
            onClick={() => onPick(i)}
            title={`Column ${i + 1}`}
            aria-pressed={isActive}
            className={cn(
              "flex h-6 min-w-[32px] items-center justify-center rounded-sm px-1.5 text-2xs font-medium transition-colors",
              isActive
                ? "bg-accent/15 text-accent"
                : "text-muted-foreground hover:bg-hover-bg hover:text-foreground",
            )}
          >
            {i + 1}
          </button>
        )
      })}
    </div>
  )
}
