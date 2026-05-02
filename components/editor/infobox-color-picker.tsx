"use client"

import { cn } from "@/lib/utils"
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"
import { useTheme } from "next-themes"
import { boostAlphaForLight } from "@/lib/tinted-bg"

export interface InfoboxColorPreset {
  label: string
  value: string | null
  swatch: string
}

export const INFOBOX_HEADER_PRESETS: InfoboxColorPreset[] = [
  { label: "Default", value: null,                       swatch: "rgba(148,163,184,0.25)" },
  { label: "Blue",    value: "rgba(59,130,246,0.35)",    swatch: "rgba(59,130,246,0.35)" },
  { label: "Red",     value: "rgba(239,68,68,0.35)",     swatch: "rgba(239,68,68,0.35)" },
  { label: "Green",   value: "rgba(34,197,94,0.35)",     swatch: "rgba(34,197,94,0.35)" },
  { label: "Yellow",  value: "rgba(234,179,8,0.35)",     swatch: "rgba(234,179,8,0.35)" },
  { label: "Orange",  value: "rgba(249,115,22,0.35)",    swatch: "rgba(249,115,22,0.35)" },
  { label: "Purple",  value: "rgba(168,85,247,0.35)",    swatch: "rgba(168,85,247,0.35)" },
  { label: "Pink",    value: "rgba(236,72,153,0.35)",    swatch: "rgba(236,72,153,0.35)" },
]

export function hexToRgba(hex: string, alpha = 0.35): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return hex
  const n = parseInt(m[1], 16)
  const r = (n >> 16) & 0xff
  const g = (n >> 8) & 0xff
  const b = n & 0xff
  return `rgba(${r},${g},${b},${alpha})`
}

/**
 * Polished infobox color picker — visually consistent with ColorPickerGrid
 * (4×2 grid, rounded-full swatches, hover scale, active ring-offset).
 *
 * Colors are alpha-tinted (rgba 0.35) so dark text remains readable on the
 * header background. Default option = null (uses the bg-secondary/30 fallback).
 */
export function InfoboxColorPicker({
  value,
  onChange,
}: {
  value: string | null
  onChange: (v: string | null) => void
}) {
  const { resolvedTheme } = useTheme()
  const isLight = resolvedTheme === "light"
  // In light mode, swatches preview the boosted (near-opaque) fill the user
  // will actually see — so picking a color isn't a guessing game.
  const previewColor = (s: string) => (isLight ? boostAlphaForLight(s) : s)
  return (
    <div
      className="space-y-2.5 rounded-md border border-border-subtle bg-popover p-2.5 shadow-md"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="grid grid-cols-4 gap-1.5">
        {INFOBOX_HEADER_PRESETS.map((p) => {
          const isActive = (value ?? null) === p.value
          const isDefault = p.value === null
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => onChange(p.value)}
              title={p.label}
              className={cn(
                "h-7 w-7 rounded-full flex items-center justify-center transition-all",
                "ring-1 ring-black/5 dark:ring-white/10 hover:scale-110 hover:ring-2 hover:ring-foreground/20",
                isActive && "ring-2 ring-offset-2 ring-offset-popover ring-foreground"
              )}
              style={{ backgroundColor: isDefault ? p.swatch : previewColor(p.swatch) }}
            >
              {isActive && <PhCheck size={12} weight="bold" className="text-foreground" />}
              {!isActive && isDefault && (
                <span className="block h-px w-3.5 bg-muted-foreground/50 rotate-45" />
              )}
            </button>
          )
        })}
      </div>
      <div className="flex items-center gap-2 pt-2 border-t border-border-subtle">
        <label
          className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full ring-1 ring-black/5 dark:ring-white/10 bg-gradient-to-br from-red-400 via-yellow-300 to-blue-400 hover:scale-110 transition-transform"
          title="Custom color"
        >
          <input
            type="color"
            value={value && /^#/.test(value) ? value : "#3b82f6"}
            onChange={(e) => onChange(hexToRgba(e.target.value))}
            className="pointer-events-none h-0 w-0 opacity-0"
          />
        </label>
        <span className="text-2xs text-muted-foreground">Custom color</span>
      </div>
    </div>
  )
}
