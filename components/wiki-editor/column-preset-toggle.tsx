"use client"

/**
 * ColumnPresetToggle — Phase 2-2-A.
 *
 * Header chip toggle: 1 / 2 / 3 columns. Replaces the old WikiLayoutToggle slot.
 * Clicking a chip calls `applyColumnPreset(articleId, count)` which rebuilds
 * `article.layout` to the requested column count and resets `columnAssignments`
 * (all blocks land in column [0]; sidebars start empty — drag UI in Phase 2-2-B).
 *
 * No-op if user clicks the currently active preset (preserves any drag-adjusted ratios).
 */

import { usePlotStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export interface ColumnPresetToggleProps {
  articleId: string
  /** Optional smaller variant for sidepanels / secondary panes. */
  compact?: boolean
}

const PRESETS: { count: number; label: string }[] = [
  { count: 1, label: "1col" },
  { count: 2, label: "2col" },
  { count: 3, label: "3col" },
]

export function ColumnPresetToggle({ articleId, compact = false }: ColumnPresetToggleProps) {
  const article = usePlotStore((s) => s.wikiArticles.find((a) => a.id === articleId))
  const applyColumnPreset = usePlotStore((s) => s.applyColumnPreset)

  if (!article) return null
  const currentCount = article.layout?.columns.length ?? 1

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md border border-border-subtle bg-secondary/40 p-0.5",
        compact ? "h-7" : "h-8",
      )}
      role="group"
      aria-label="Column layout preset"
    >
      {PRESETS.map(({ count, label }) => {
        const isActive = currentCount === count
        return (
          <button
            key={count}
            type="button"
            onClick={() => applyColumnPreset(articleId, count)}
            title={`${count} column${count > 1 ? "s" : ""}`}
            aria-pressed={isActive}
            className={cn(
              "flex items-center justify-center rounded-sm font-medium transition-colors",
              compact ? "h-6 min-w-[36px] px-1.5 text-2xs" : "h-7 min-w-[40px] px-2 text-2xs",
              isActive
                ? "bg-accent/15 text-accent"
                : "text-muted-foreground hover:bg-hover-bg hover:text-foreground",
            )}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
