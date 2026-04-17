"use client"

/**
 * Shared ⋯ menu primitives for wiki blocks.
 *
 * Gives every wiki block's block-actions menu the same visual rhythm:
 *   - Section header with leading icon + bold label
 *   - Preset grid for quick-toggle settings (Width / Font size / Spacing …)
 *   - Action rows that match note-context-menu style (icon + label + hover bg)
 *   - Consistent width, padding, divider rhythm
 *
 * Usage pattern (inside a PopoverContent):
 *
 *   <MenuSection icon={<ArrowsHorizontal />} label="Width">
 *     <PresetGrid options={WIDTH_OPTIONS} active={current} onSelect={...} />
 *   </MenuSection>
 *   <MenuDivider />
 *   <MenuAction icon={<Trash />} label="Delete block" onClick={...} destructive />
 */

import React from "react"
import { cn } from "@/lib/utils"

/* ── Popover content wrapper ────────────────────────────── */

export interface MenuSurfaceProps {
  children: React.ReactNode
  /** Tailwind width class — e.g. "w-56". Defaults to w-56. */
  widthClass?: string
  className?: string
}

/**
 * Styled wrapper for a PopoverContent's inner children.
 * Lets each block keep its own Popover but share the visual shell.
 */
export function MenuSurface({ children, className }: MenuSurfaceProps) {
  return <div className={cn("py-1", className)}>{children}</div>
}

/* ── Section (header + body) ────────────────────────────── */

export interface MenuSectionProps {
  icon?: React.ReactNode
  label: string
  children: React.ReactNode
}

export function MenuSection({ icon, label, children }: MenuSectionProps) {
  return (
    <div className="px-2.5 py-1.5">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70 mb-1.5">
        {icon ? <span className="shrink-0 text-muted-foreground/60">{icon}</span> : null}
        <span>{label}</span>
      </div>
      {children}
    </div>
  )
}

/* ── Preset grid (row of toggle buttons) ────────────────── */

export interface PresetOption<V extends string | number> {
  label: string
  value: V
}

export interface PresetGridProps<V extends string | number> {
  options: readonly PresetOption<V>[]
  /** Current active value — must match one of options.value. */
  active: V | null | undefined
  onSelect: (value: V) => void
}

export function PresetGrid<V extends string | number>({ options, active, onSelect }: PresetGridProps<V>) {
  return (
    <div className="flex items-center gap-1">
      {options.map((opt) => {
        const isActive = active === opt.value
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onSelect(opt.value)}
            className={cn(
              "flex-1 rounded-md px-1.5 py-1.5 text-2xs font-medium transition-colors",
              isActive
                ? "bg-accent/20 text-accent"
                : "text-foreground/60 hover:bg-active-bg hover:text-foreground/80",
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

/* ── Action row (icon + label + optional shortcut/submenu chevron) ── */

export interface MenuActionProps {
  icon?: React.ReactNode
  label: string
  onClick?: (e: React.MouseEvent) => void
  /** Destructive styling (red) — used for Delete. */
  destructive?: boolean
  /** Accent styling (teal) — used for Unmerge / undo-like ops. */
  accent?: boolean
  /** Right-aligned hint (shortcut key, submenu indicator, etc.). */
  trailing?: React.ReactNode
  disabled?: boolean
}

export function MenuAction({ icon, label, onClick, destructive, accent, trailing, disabled }: MenuActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-2xs transition-colors",
        disabled && "cursor-not-allowed opacity-40",
        destructive
          ? "text-destructive hover:bg-destructive/10"
          : accent
            ? "text-chart-3 hover:bg-active-bg"
            : "text-foreground/80 hover:bg-active-bg",
      )}
    >
      {icon ? <span className="shrink-0">{icon}</span> : null}
      <span className="flex-1 text-left truncate">{label}</span>
      {trailing ? <span className="shrink-0 text-muted-foreground/50">{trailing}</span> : null}
    </button>
  )
}

/* ── Divider ────────────────────────────────────────────── */

export function MenuDivider() {
  return <div className="my-1 h-px bg-border-subtle" />
}

/* ── Shared size presets (re-export for reuse) ──────────── */

export const WIDTH_OPTIONS = [
  { label: "S", value: "narrow" as const },
  { label: "M", value: "default" as const },
  { label: "L", value: "wide" as const },
  { label: "XL", value: "full" as const },
] as const

export const FONT_SIZE_OPTIONS = [
  { label: "S", value: 0.85 },
  { label: "M", value: 1 },
  { label: "L", value: 1.15 },
  { label: "XL", value: 1.3 },
] as const

export const DENSITY_OPTIONS = [
  { label: "Tight", value: "compact" as const },
  { label: "Normal", value: "normal" as const },
  { label: "Loose", value: "loose" as const },
] as const
