"use client"

/**
 * WikiColumnMenu — Phase 3.1-A
 *
 * Per-column `⋯` menu. Opens a popover with:
 * - Inline name editor (clears by emptying the input)
 * - Palette picker (8 pastel colors + "None" + "Auto shuffle all")
 *
 * Also exposes article-level toggles (rule, gap) through a nested section so
 * each column header has quick access to the whole layout's magazine settings.
 */

import { useState, useRef, useEffect, type MouseEvent } from "react"
import { createPortal } from "react-dom"
import { usePlotStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { DotsThree } from "@phosphor-icons/react/dist/ssr/DotsThree"
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"
import { Palette } from "@phosphor-icons/react/dist/ssr/Palette"
import { Shuffle } from "@phosphor-icons/react/dist/ssr/Shuffle"
import { Eraser } from "@phosphor-icons/react/dist/ssr/Eraser"
import { COLUMN_PALETTE, type ColumnPaletteEntry } from "@/lib/column-palette"

export interface WikiColumnMenuProps {
  articleId: string
  path: number[]
  currentPaletteId?: string
  currentPaletteAlpha?: number
  currentGradientTo?: string
  /** Whether the article's layout currently has a rule / gap. */
  articleHasRule?: boolean
  articleGap?: "sm" | "md" | "lg"
  articleNumberingMode?: "independent" | "continuous"
  articleTypography?: "sans" | "serif-body" | "editorial"
}

export function WikiColumnMenu({
  articleId,
  path,
  currentPaletteId,
  currentPaletteAlpha,
  currentGradientTo,
  articleHasRule,
  articleGap,
  articleNumberingMode,
  articleTypography,
}: WikiColumnMenuProps) {
  const [open, setOpen] = useState(false)

  const setColumnPaletteId = usePlotStore((s) => s.setColumnPaletteId)
  const setColumnPaletteAlpha = usePlotStore((s) => s.setColumnPaletteAlpha)
  const setColumnGradientTo = usePlotStore((s) => s.setColumnGradientTo)
  const setColumnRule = usePlotStore((s) => s.setColumnRule)
  const setColumnGap = usePlotStore((s) => s.setColumnGap)
  const applyAutoColumnColors = usePlotStore((s) => s.applyAutoColumnColors)
  const clearAllColumnColors = usePlotStore((s) => s.clearAllColumnColors)
  const addFullWidthPane = usePlotStore((s) => s.addFullWidthPane)

  const handleAddPane = (position: "above" | "below") => {
    addFullWidthPane(articleId, position)
    setOpen(false)
  }

  const handleToggleRule = () => setColumnRule(articleId, !articleHasRule)
  const handleGapChange = (gap: "sm" | "md" | "lg") => setColumnGap(articleId, gap)
  const handlePaletteSelect = (paletteId: string | null) => setColumnPaletteId(articleId, path, paletteId)
  const handleAlphaChange = (alpha: number) => setColumnPaletteAlpha(articleId, path, alpha)
  const handleGradientToSelect = (paletteId: string | null) => setColumnGradientTo(articleId, path, paletteId)
  const handleAutoColors = () => {
    applyAutoColumnColors(articleId)
    setOpen(false)
  }
  const handleClearColors = () => {
    clearAllColumnColors(articleId)
    setOpen(false)
  }

  const stopProp = (e: MouseEvent) => e.stopPropagation()

  // Phase 3.1-B fix: portal popup to body so column overflow doesn't clip it.
  // Click-outside via document mousedown listener (no fullscreen backdrop that would block scroll).
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const [popupPos, setPopupPos] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    if (!open) return
    // Compute position based on trigger button bounding rect
    const rect = triggerRef.current?.getBoundingClientRect()
    if (rect) {
      setPopupPos({ top: rect.bottom + 4, left: rect.right - 240 }) // align right edge, 240px wide
    }
    // Click-outside listener (allows scrolling page while popup open)
    const handler = (e: MouseEvent | globalThis.MouseEvent) => {
      const target = e.target as Node
      if (popupRef.current?.contains(target) || triggerRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener("mousedown", handler as EventListener)
    return () => document.removeEventListener("mousedown", handler as EventListener)
  }, [open])

  return (
    <div className="relative" onClick={stopProp}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        title="Column options"
        aria-label="Column menu"
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-md border border-border-subtle bg-surface-overlay text-muted-foreground shadow-sm transition-colors hover:bg-hover-bg hover:text-foreground",
          open && "bg-hover-bg text-foreground",
        )}
      >
        <DotsThree size={14} weight="bold" />
      </button>

      {open && popupPos && typeof document !== "undefined" && createPortal(
        <div
          ref={popupRef}
          className="fixed z-[60] w-[240px] rounded-lg border border-border-subtle bg-surface-overlay py-2 shadow-[0_8px_24px_rgba(0,0,0,0.22)]"
          style={{ top: popupPos.top, left: popupPos.left }}
          onClick={stopProp}
        >
            {/* Palette section */}
            <div className="px-3 py-2">
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Column Color
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {/* None option */}
                <button
                  type="button"
                  onClick={() => handlePaletteSelect(null)}
                  title="No color"
                  className={cn(
                    "relative h-7 w-full rounded-md border transition-all",
                    !currentPaletteId
                      ? "border-accent bg-secondary/40"
                      : "border-border-subtle bg-secondary/20 hover:border-border",
                  )}
                >
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground">
                    ∅
                  </span>
                </button>
                {COLUMN_PALETTE.map((p: ColumnPaletteEntry) => {
                  const isActive = currentPaletteId === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handlePaletteSelect(p.id)}
                      title={p.name}
                      style={{ backgroundColor: `var(${p.bgVar})` }}
                      className={cn(
                        "relative h-7 w-full rounded-md border transition-all",
                        isActive ? "border-foreground ring-2 ring-accent/40" : "border-border-subtle hover:border-border",
                      )}
                    >
                      {isActive && (
                        <PhCheck
                          size={12}
                          weight="bold"
                          className="absolute inset-0 m-auto"
                          style={{ color: `var(${p.accentVar})` }}
                        />
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Alpha slider — visible when a color is selected */}
              {currentPaletteId && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-12 shrink-0">Opacity</span>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={Math.round((currentPaletteAlpha ?? 1) * 100)}
                    onChange={(e) => handleAlphaChange(Number(e.target.value) / 100)}
                    className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-border-subtle accent-accent"
                  />
                  <span className="w-7 text-right text-[10px] tabular-nums text-muted-foreground">
                    {Math.round((currentPaletteAlpha ?? 1) * 100)}%
                  </span>
                </div>
              )}

              {/* Gradient — second color picker */}
              {currentPaletteId && (
                <div className="mt-2">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Gradient to</span>
                    {currentGradientTo && (
                      <button
                        type="button"
                        onClick={() => handleGradientToSelect(null)}
                        className="text-[10px] text-muted-foreground hover:text-foreground"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {COLUMN_PALETTE.filter((p) => p.id !== currentPaletteId).slice(0, 8).map((p) => {
                      const isActive = currentGradientTo === p.id
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleGradientToSelect(p.id)}
                          title={p.name}
                          style={{ background: `linear-gradient(135deg, var(${COLUMN_PALETTE.find(x => x.id === currentPaletteId)?.bgVar}), var(${p.bgVar}))` }}
                          className={cn(
                            "relative h-5 w-full rounded border transition-all",
                            isActive ? "border-foreground ring-1 ring-accent/40" : "border-border-subtle hover:border-border",
                          )}
                        >
                          {isActive && <PhCheck size={10} weight="bold" className="absolute inset-0 m-auto text-foreground" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="mt-2 flex gap-1">
                <button
                  type="button"
                  onClick={handleAutoColors}
                  className="flex flex-1 items-center justify-center gap-1 rounded-md border border-border-subtle px-2 py-1 text-2xs text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
                >
                  <Shuffle size={11} weight="bold" />
                  Auto shuffle
                </button>
                <button
                  type="button"
                  onClick={handleClearColors}
                  className="flex flex-1 items-center justify-center gap-1 rounded-md border border-border-subtle px-2 py-1 text-2xs text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
                >
                  <Eraser size={11} weight="bold" />
                  Clear all
                </button>
              </div>
            </div>

            <div className="my-1 h-px bg-border-subtle" />

            {/* Article-level layout toggles */}
            <div className="px-3 py-2">
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Layout
              </label>

              {/* Rule toggle — divider line between columns */}
              <button
                type="button"
                onClick={handleToggleRule}
                className="flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-note transition-colors hover:bg-hover-bg"
              >
                <span className="text-muted-foreground">Divider</span>
                <span
                  className={cn(
                    "flex h-4 w-8 items-center rounded-full transition-colors",
                    articleHasRule ? "bg-accent justify-end" : "bg-border-subtle justify-start",
                  )}
                >
                  <span className="m-0.5 h-3 w-3 rounded-full bg-white shadow-sm" />
                </span>
              </button>

              {/* Gap selector */}
              <div className="mt-1.5 flex items-center justify-between px-2 py-1">
                <span className="text-note text-muted-foreground">Spacing</span>
                <div className="flex gap-0.5">
                  {(["sm", "md", "lg"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => handleGapChange(g)}
                      className={cn(
                        "h-5 w-7 rounded text-[10px] font-medium uppercase transition-colors",
                        (articleGap ?? "md") === g
                          ? "bg-accent text-accent-foreground"
                          : "bg-secondary/40 text-muted-foreground hover:bg-hover-bg hover:text-foreground",
                      )}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phase 3.1-B: Full-width panes (above/below the column group) */}
              <div className="mt-1.5 flex items-center justify-between px-2 py-1">
                <span className="text-note text-muted-foreground">Full-width</span>
                <div className="flex gap-0.5">
                  <button
                    type="button"
                    onClick={() => handleAddPane("above")}
                    className="rounded px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors bg-secondary/40 hover:bg-hover-bg hover:text-foreground"
                  >
                    + Above
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddPane("below")}
                    className="rounded px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors bg-secondary/40 hover:bg-hover-bg hover:text-foreground"
                  >
                    + Below
                  </button>
                </div>
              </div>

              {/* Phase 3.1-C: Typography mode */}
              <div className="mt-1.5 flex items-center justify-between px-2 py-1">
                <span className="text-note text-muted-foreground">Typography</span>
                <div className="flex gap-0.5">
                  {([
                    { id: "sans", label: "Sans" },
                    { id: "serif-body", label: "Serif" },
                    { id: "editorial", label: "Mag" },
                  ] as const).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        const store = require("@/lib/store").usePlotStore
                        store.getState().updateWikiArticle(articleId, { typography: t.id })
                      }}
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                        (articleTypography ?? "sans") === t.id
                          ? "bg-accent text-accent-foreground"
                          : "bg-secondary/40 text-muted-foreground hover:bg-hover-bg hover:text-foreground",
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phase 3.1-B: Section numbering mode */}
              <div className="mt-1.5 flex items-center justify-between px-2 py-1">
                <span className="text-note text-muted-foreground">Numbering</span>
                <div className="flex gap-0.5">
                  {(["independent", "continuous"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        const store = require("@/lib/store").usePlotStore
                        store.getState().updateWikiArticle(articleId, { numberingMode: m })
                      }}
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                        (articleNumberingMode ?? "independent") === m
                          ? "bg-accent text-accent-foreground"
                          : "bg-secondary/40 text-muted-foreground hover:bg-hover-bg hover:text-foreground",
                      )}
                    >
                      {m === "independent" ? "Per col" : "Global"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>,
        document.body,
      )}
    </div>
  )
}
