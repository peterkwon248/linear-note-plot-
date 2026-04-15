"use client"

/**
 * ColumnPresetToggle — Phase 3 redesign.
 *
 * Dropdown selector for column count (1–6) + equalize button.
 * Only visible in edit mode (`editable` prop).
 *
 * Replaces the old 1/2/3 chip toggle with a compact dropdown so
 * it scales to 6 columns without cluttering the header.
 */

import { useState } from "react"
import { usePlotStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Equals } from "@phosphor-icons/react/dist/ssr/Equals"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"

export interface ColumnPresetToggleProps {
  articleId: string
  /** Only show in edit mode. */
  editable?: boolean
  /** Optional smaller variant for sidepanels / secondary panes. */
  compact?: boolean
}

const COLUMN_OPTIONS = [1, 2, 3, 4, 5, 6]

export function ColumnPresetToggle({ articleId, editable = false, compact = false }: ColumnPresetToggleProps) {
  const article = usePlotStore((s) => s.wikiArticles.find((a) => a.id === articleId))
  const applyColumnPreset = usePlotStore((s) => s.applyColumnPreset)
  const updateColumnRatios = usePlotStore((s) => s.updateColumnRatios)
  const [open, setOpen] = useState(false)

  if (!editable || !article) return null
  const currentCount = article.layout?.columns.length ?? 1

  const handleSelect = (count: number) => {
    applyColumnPreset(articleId, count)
    setOpen(false)
  }

  const handleEqualize = () => {
    if (!article.layout || currentCount <= 1) return
    const equalRatio = 100 / currentCount
    updateColumnRatios(articleId, [], Array(currentCount).fill(equalRatio))
  }

  return (
    <div className="relative inline-flex items-center gap-0.5">
      {/* Column count dropdown */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex items-center gap-1 rounded-md border border-border-subtle bg-secondary/40 font-medium text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground",
          compact ? "h-7 px-2 text-2xs" : "h-8 px-2.5 text-2xs",
        )}
      >
        {currentCount}col
        <CaretDown size={10} weight="bold" className={cn("transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 min-w-[140px] rounded-lg border border-border-subtle bg-surface-overlay py-1 shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
            {COLUMN_OPTIONS.map((count) => {
              const isActive = currentCount === count
              return (
                <button
                  key={count}
                  type="button"
                  onClick={() => handleSelect(count)}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-1.5 text-left text-note transition-colors hover:bg-hover-bg",
                    isActive && "text-accent",
                  )}
                >
                  <span>{count} column{count > 1 ? "s" : ""}</span>
                  {isActive && <PhCheck size={12} weight="bold" className="text-accent" />}
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* Equalize button — only when 2+ columns */}
      {currentCount >= 2 && (
        <button
          type="button"
          onClick={handleEqualize}
          title="Equalize column widths"
          className={cn(
            "flex items-center justify-center rounded-md border border-border-subtle bg-secondary/40 text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground",
            compact ? "h-7 w-7" : "h-8 w-8",
          )}
        >
          <Equals size={compact ? 12 : 14} weight="bold" />
        </button>
      )}
    </div>
  )
}
