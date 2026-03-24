"use client"

import { cn } from "@/lib/utils"
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"

export const PRESET_COLORS = [
  "#e5484d",
  "#f2994a",
  "#f2c94c",
  "#45d483",
  "#06b6d4",
  "#5e6ad2",
  "#9b59b6",
  "#e91e8c",
  "#8b5cf6",
  "#0ea5e9",
]

export function ColorPickerGrid({
  value,
  onChange,
}: {
  value: string
  onChange: (color: string) => void
}) {
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {PRESET_COLORS.map((color) => (
        <button
          key={color}
          className={cn(
            "h-5 w-5 rounded-full flex items-center justify-center transition-transform hover:scale-110",
            value === color && "ring-2 ring-white/30"
          )}
          style={{ backgroundColor: color }}
          onClick={(e) => {
            e.stopPropagation()
            onChange(color)
          }}
          type="button"
        >
          {value === color && <PhCheck className="text-white" size={12} weight="bold" />}
        </button>
      ))}
    </div>
  )
}
