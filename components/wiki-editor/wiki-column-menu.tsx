"use client"

/**
 * WikiColumnMenu — Phase 3.1-A (배경색 시스템 제거됨, 2026-04-19 Pivot).
 *
 * Per-column `⋯` menu. Opens a popover with article-level layout toggles:
 * - Divider (column rule)
 * - Spacing (sm/md/lg)
 * - Full-width panes (above/below)
 * - Typography (sans/serif/editorial)
 * - Section numbering (per-col / global)
 *
 * Palette/gradient/theme picker 는 2026-04-19 Pivot 에서 제거. 다크모드 중심
 * Linear 스타일로 회귀.
 */

import { useState, useRef, useEffect, type MouseEvent } from "react"
import { createPortal } from "react-dom"
import { usePlotStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { DotsThree } from "@phosphor-icons/react/dist/ssr/DotsThree"
import {
  WIKI_LAYOUT_PRESETS,
  applyPresetSlots,
  matchPreset,
  type WikiLayoutPresetId,
} from "@/lib/wiki-layout-presets"
import type { WikiArticle } from "@/lib/types"

export interface WikiColumnMenuProps {
  articleId: string
  path: number[]
  /** Whether the article's layout currently has a rule / gap. */
  articleHasRule?: boolean
  articleGap?: "sm" | "md" | "lg"
  articleNumberingMode?: "independent" | "continuous"
  articleTypography?: "sans" | "serif-body" | "editorial"
  /** 재편-C: article-level layout preset + slots (for preset picker inside menu). */
  articleLayoutPreset?: WikiArticle["layoutPreset"]
  articleSlots?: WikiArticle["slots"]
}

export function WikiColumnMenu({
  articleId,
  articleHasRule,
  articleGap,
  articleNumberingMode,
  articleTypography,
  articleLayoutPreset,
  articleSlots,
}: WikiColumnMenuProps) {
  const [open, setOpen] = useState(false)

  const setColumnRule = usePlotStore((s) => s.setColumnRule)
  const setColumnGap = usePlotStore((s) => s.setColumnGap)
  const addFullWidthPane = usePlotStore((s) => s.addFullWidthPane)
  const updateWikiArticle = usePlotStore((s) => s.updateWikiArticle)

  const activePreset: WikiLayoutPresetId =
    articleLayoutPreset ?? matchPreset(articleSlots) ?? "custom"

  const handlePresetSelect = (presetId: Exclude<WikiLayoutPresetId, "custom">) => {
    updateWikiArticle(articleId, {
      layoutPreset: presetId,
      slots: applyPresetSlots(articleSlots, presetId),
    })
  }

  const handleAddPane = (position: "above" | "below") => {
    addFullWidthPane(articleId, position)
    setOpen(false)
  }

  const handleToggleRule = () => setColumnRule(articleId, !articleHasRule)
  const handleGapChange = (gap: "sm" | "md" | "lg") => setColumnGap(articleId, gap)

  const stopProp = (e: MouseEvent) => e.stopPropagation()

  // Phase 3.1-B fix: portal popup to body so column overflow doesn't clip it.
  // Click-outside via document mousedown listener (no fullscreen backdrop that would block scroll).
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const [popupPos, setPopupPos] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    if (!open) return
    const rect = triggerRef.current?.getBoundingClientRect()
    if (rect) {
      setPopupPos({ top: rect.bottom + 4, left: rect.right - 240 })
    }
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
          {/* 재편-C (2026-04-19): Layout preset selector */}
          <div className="px-3 py-2">
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Preset
            </label>
            <div className="flex gap-0.5">
              {WIKI_LAYOUT_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePresetSelect(p.id)}
                  title={p.description}
                  className={cn(
                    "flex-1 rounded px-1.5 py-1 text-[10px] font-medium transition-colors",
                    activePreset === p.id
                      ? "bg-accent text-accent-foreground"
                      : "bg-secondary/40 text-muted-foreground hover:bg-hover-bg hover:text-foreground",
                  )}
                >
                  {p.label}
                </button>
              ))}
              <button
                type="button"
                disabled
                title="Set when slots diverge from Default / Namu"
                className={cn(
                  "flex-1 rounded px-1.5 py-1 text-[10px] font-medium",
                  activePreset === "custom"
                    ? "bg-accent/60 text-accent-foreground"
                    : "bg-secondary/20 text-muted-foreground/40",
                )}
              >
                Custom
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
