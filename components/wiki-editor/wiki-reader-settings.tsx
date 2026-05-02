"use client"

import { cn } from "@/lib/utils"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { Minus } from "@phosphor-icons/react/dist/ssr/Minus"
import { ArrowCounterClockwise } from "@phosphor-icons/react/dist/ssr/ArrowCounterClockwise"
import {
  FONT_SCALE_GROUPS,
  SCALE_MAX,
  SCALE_MIN,
  SCALE_STEP,
  clampScale,
  type FontScaleKey,
} from "@/lib/wiki-font-scales"
import type { WikiFontScales } from "@/lib/types"

const GLOBAL_SIZES = [
  { label: "S", value: 0.85 },
  { label: "M", value: 1 },
  { label: "L", value: 1.15 },
  { label: "XL", value: 1.3 },
] as const

interface WikiReaderSettingsProps {
  fontSize: number | undefined         // global multiplier
  fontScales: WikiFontScales | undefined
  contentAlign: "left" | "center" | undefined
  onFontSizeChange: (v: number | undefined) => void
  onFontScalesChange: (v: WikiFontScales | undefined) => void
  onContentAlignChange: (v: "left" | "center" | undefined) => void
  onResetLayout: () => void
}

export function WikiReaderSettings({
  fontSize,
  fontScales,
  contentAlign,
  onFontSizeChange,
  onFontScalesChange,
  onContentAlignChange,
  onResetLayout,
}: WikiReaderSettingsProps) {
  const adjustScale = (key: FontScaleKey, delta: number) => {
    const current = fontScales?.[key] ?? 1
    const next = clampScale(current + delta)
    const newScales = { ...(fontScales ?? {}), [key]: next === 1 ? undefined : next }
    // Strip undefined entries so an all-default object becomes undefined.
    const cleaned: WikiFontScales = {}
    let hasAny = false
    for (const k of Object.keys(newScales) as FontScaleKey[]) {
      const v = newScales[k]
      if (v !== undefined) {
        cleaned[k] = v
        hasAny = true
      }
    }
    onFontScalesChange(hasAny ? cleaned : undefined)
  }

  const resetAll = () => {
    onFontSizeChange(undefined)
    onFontScalesChange(undefined)
    onContentAlignChange(undefined)
    onResetLayout()
  }

  return (
    <div className="w-[300px] p-3 space-y-3">
      {/* Global text scale */}
      <div>
        <div className="mb-1.5 px-1 text-2xs font-medium uppercase tracking-wider text-muted-foreground">
          Text scale
        </div>
        <div className="flex items-center gap-1">
          {GLOBAL_SIZES.map((opt) => {
            const active = (fontSize ?? 1) === opt.value
            return (
              <button
                key={opt.label}
                onClick={() => onFontSizeChange(opt.value === 1 ? undefined : opt.value)}
                className={cn(
                  "flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                  active
                    ? "bg-accent/20 text-accent"
                    : "text-foreground/70 hover:bg-hover-bg hover:text-foreground",
                )}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Per-group fine-tune */}
      <div>
        <div className="mb-1.5 px-1 text-2xs font-medium uppercase tracking-wider text-muted-foreground">
          Refine
        </div>
        <div className="space-y-1">
          {FONT_SCALE_GROUPS.map(({ key, label }) => {
            const value = fontScales?.[key] ?? 1
            const atMin = value <= SCALE_MIN + 0.001
            const atMax = value >= SCALE_MAX - 0.001
            return (
              <div key={key} className="flex items-center justify-between gap-2 py-0.5">
                <span className="flex-1 text-sm text-foreground/85">{label}</span>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => adjustScale(key, -SCALE_STEP)}
                    disabled={atMin}
                    className="flex h-6 w-6 items-center justify-center rounded text-foreground/70 hover:bg-hover-bg hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus size={12} weight="bold" />
                  </button>
                  <span className="min-w-[36px] text-center text-2xs tabular-nums text-foreground/80">
                    {value.toFixed(1)}×
                  </span>
                  <button
                    onClick={() => adjustScale(key, SCALE_STEP)}
                    disabled={atMax}
                    className="flex h-6 w-6 items-center justify-center rounded text-foreground/70 hover:bg-hover-bg hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <PhPlus size={12} weight="bold" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Layout alignment */}
      <div className="border-t border-border-subtle pt-2.5">
        <div className="mb-1.5 px-1 text-2xs font-medium uppercase tracking-wider text-muted-foreground">
          Layout
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onContentAlignChange(undefined)}
            className={cn(
              "flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              !contentAlign || contentAlign === "left"
                ? "bg-accent/20 text-accent"
                : "text-foreground/70 hover:bg-hover-bg hover:text-foreground",
            )}
          >
            Left
          </button>
          <button
            onClick={() => onContentAlignChange("center")}
            className={cn(
              "flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              contentAlign === "center"
                ? "bg-accent/20 text-accent"
                : "text-foreground/70 hover:bg-hover-bg hover:text-foreground",
            )}
          >
            Center
          </button>
        </div>
      </div>

      {/* Reset all */}
      <div className="border-t border-border-subtle pt-2">
        <button
          onClick={resetAll}
          className="flex w-full items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md text-foreground/75 hover:bg-hover-bg hover:text-foreground transition-colors"
        >
          <ArrowCounterClockwise size={14} weight="regular" />
          Reset all to default
        </button>
      </div>
    </div>
  )
}
