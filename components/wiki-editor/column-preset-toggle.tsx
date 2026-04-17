"use client"

/**
 * ColumnPresetToggle — Phase 3.1-A polish.
 *
 * Layout card count + asymmetric preset selector. The user-facing term is
 * "card" (instead of "column") to avoid confusion with the note editor's
 * `columnsBlock` TipTap node. Internal types remain `Column*` for now.
 *
 * Asymmetric presets are grouped by card count (2 / 3) and show a mini
 * visual bar preview so ratios are scannable without reading numbers.
 */

import { useMemo, useState } from "react"
import { usePlotStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Equals } from "@phosphor-icons/react/dist/ssr/Equals"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"
import { ASYMMETRIC_PRESETS, type AsymmetricPreset } from "@/lib/column-palette"

export interface ColumnPresetToggleProps {
  articleId: string
  /** Only show in edit mode. */
  editable?: boolean
  /** Optional smaller variant for sidepanels / secondary panes. */
  compact?: boolean
}

const CARD_OPTIONS = [1, 2, 3, 4, 5, 6]

/** Small visual preview of a ratio array — first card = accent, rest = muted. */
function MiniCardBar({ ratios }: { ratios: number[] }) {
  return (
    <div className="flex items-center gap-0.5 w-12 shrink-0">
      {ratios.map((r, i) => (
        <div
          key={i}
          style={{ flex: r }}
          className={cn(
            "h-2 rounded-[2px]",
            i === 0 ? "bg-accent/70" : "bg-muted-foreground/30",
          )}
        />
      ))}
    </div>
  )
}

export function ColumnPresetToggle({ articleId, editable = false, compact = false }: ColumnPresetToggleProps) {
  const article = usePlotStore((s) => s.wikiArticles.find((a) => a.id === articleId))
  const applyColumnPreset = usePlotStore((s) => s.applyColumnPreset)
  const applyAsymmetricPreset = usePlotStore((s) => s.applyAsymmetricPreset)
  const updateColumnRatios = usePlotStore((s) => s.updateColumnRatios)
  const [open, setOpen] = useState(false)

  // Group asymmetric presets by card count for visual grouping in menu.
  const presetsByCount = useMemo(() => {
    const groups: Record<number, AsymmetricPreset[]> = {}
    for (const p of ASYMMETRIC_PRESETS) {
      if (!groups[p.cardCount]) groups[p.cardCount] = []
      groups[p.cardCount].push(p)
    }
    return groups
  }, [])

  if (!editable || !article) return null
  const currentCount = article.layout?.columns.length ?? 1

  const handleSelect = (count: number) => {
    applyColumnPreset(articleId, count)
    setOpen(false)
  }

  const handleAsymmetric = (presetId: string) => {
    const preset = ASYMMETRIC_PRESETS.find((p) => p.id === presetId)
    if (preset) {
      applyAsymmetricPreset(articleId, preset.ratios, preset.minWidths)
    }
    setOpen(false)
  }

  const handleEqualize = () => {
    if (!article.layout || currentCount <= 1) return
    const equalRatio = 100 / currentCount
    updateColumnRatios(articleId, [], Array(currentCount).fill(equalRatio))
  }

  return (
    <div className="relative inline-flex items-center gap-0.5">
      {/* Card count dropdown trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex items-center gap-1 rounded-md border border-border-subtle bg-secondary/40 font-medium text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground",
          compact ? "h-7 px-2 text-2xs" : "h-8 px-2.5 text-2xs",
        )}
        title="Card layout"
      >
        {currentCount} {currentCount === 1 ? "card" : "cards"}
        <CaretDown size={10} weight="bold" className={cn("transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 min-w-[260px] rounded-lg border border-border-subtle bg-surface-overlay py-1 shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
            {/* Equal card counts */}
            <div className="px-3 pb-1 pt-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Equal</span>
            </div>
            {CARD_OPTIONS.map((count) => {
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
                  <span>{count} {count === 1 ? "card" : "cards"}</span>
                  {isActive && <PhCheck size={12} weight="bold" className="text-accent" />}
                </button>
              )
            })}

            <div className="my-1 h-px bg-border-subtle" />

            {/* Asymmetric presets, grouped by card count */}
            <div className="px-3 pb-1 pt-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Asymmetric</span>
            </div>
            {[2, 3].map((count) => {
              const presets = presetsByCount[count]
              if (!presets || presets.length === 0) return null
              return (
                <div key={count}>
                  <div className="px-3 pb-0.5 pt-1">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground/45">
                      {count} cards
                    </span>
                  </div>
                  {presets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleAsymmetric(preset.id)}
                      className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left transition-colors hover:bg-hover-bg"
                    >
                      <MiniCardBar ratios={preset.ratios} />
                      <span className="flex-1 truncate text-note text-foreground/80">{preset.title}</span>
                      <span className="shrink-0 font-mono text-2xs text-muted-foreground/50">{preset.label}</span>
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Equalize button — only when 2+ cards */}
      {currentCount >= 2 && (
        <button
          type="button"
          onClick={handleEqualize}
          title="Equalize card widths"
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
