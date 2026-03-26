"use client"

import { cn } from "@/lib/utils"

interface ToggleSwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label?: string
  size?: "sm" | "default"
}

export function ToggleSwitch({
  checked,
  onCheckedChange,
  label,
  size = "default",
}: ToggleSwitchProps) {
  const isSmall = size === "sm"

  const track = cn(
    "relative rounded-full shrink-0 transition-colors duration-150",
    isSmall ? "w-6 h-3.5" : "w-8 h-[18px]",
    checked ? "bg-accent" : "bg-muted-foreground/40"
  )

  const knob = cn(
    "absolute top-0.5 rounded-full shadow-sm transition-all duration-150",
    checked ? "bg-white" : "bg-muted-foreground/70",
    isSmall ? "w-2.5 h-2.5" : "w-3.5 h-3.5",
    checked
      ? isSmall
        ? "left-[11px]"
        : "left-[15px]"
      : "left-0.5"
  )

  const toggle = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={track}
    >
      <div className={knob} />
    </button>
  )

  if (!label) return toggle

  return (
    <div className="flex items-center gap-2">
      <span className="text-note flex-1">{label}</span>
      {toggle}
    </div>
  )
}
