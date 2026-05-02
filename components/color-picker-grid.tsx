"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"
import { PRESET_COLORS, PRESET_COLOR_NAMES } from "@/lib/colors"

const HEX_RE = /^#[0-9a-fA-F]{6}$/

export function ColorPickerGrid({
  value,
  onChange,
  showCustom = true,
  size = "md",
}: {
  value: string
  onChange: (color: string) => void
  showCustom?: boolean
  size?: "sm" | "md"
}) {
  const [hex, setHex] = useState(value)
  const dotSize = size === "sm" ? "h-5 w-5" : "h-6 w-6"
  const checkSize = size === "sm" ? 11 : 12

  // Update internal hex if value changed externally
  if (HEX_RE.test(value) && value.toLowerCase() !== hex.toLowerCase()) {
    setHex(value)
  }

  const handleHexChange = (raw: string) => {
    setHex(raw)
    if (HEX_RE.test(raw)) onChange(raw)
  }

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-6 gap-1.5">
        {PRESET_COLORS.map((color) => {
          const active = value.toLowerCase() === color.toLowerCase()
          return (
            <button
              key={color}
              title={PRESET_COLOR_NAMES[color] ?? color}
              className={cn(
                dotSize,
                "rounded-full flex items-center justify-center transition-all",
                "ring-1 ring-black/5 dark:ring-white/10 hover:scale-110 hover:ring-2 hover:ring-foreground/20",
                active && "ring-2 ring-offset-2 ring-offset-surface-overlay ring-foreground"
              )}
              style={{ backgroundColor: color }}
              onClick={(e) => {
                e.stopPropagation()
                onChange(color)
              }}
              type="button"
            >
              {active && <PhCheck className="text-white drop-shadow" size={checkSize} weight="bold" />}
            </button>
          )
        })}
      </div>

      {showCustom && (
        <div className="flex items-center gap-2 pt-1 border-t border-border-subtle">
          <span
            className="h-5 w-5 shrink-0 rounded-full ring-1 ring-black/5 dark:ring-white/10"
            style={{ backgroundColor: HEX_RE.test(hex) ? hex : "transparent" }}
            title="Custom color"
          />
          <input
            type="text"
            value={hex}
            onChange={(e) => handleHexChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder="#hex"
            spellCheck={false}
            maxLength={7}
            className={cn(
              "flex-1 h-7 rounded-md border bg-card px-2 text-2xs font-mono tabular-nums text-foreground outline-none transition-colors",
              HEX_RE.test(hex)
                ? "border-border focus:border-accent"
                : hex.length === 0 || hex === "#"
                  ? "border-border focus:border-accent"
                  : "border-destructive/50 focus:border-destructive"
            )}
          />
        </div>
      )}
    </div>
  )
}
