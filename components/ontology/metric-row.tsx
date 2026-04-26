"use client"

import type { ReactNode } from "react"

/**
 * Single label↔value row. The unit-cell of the Insights panel.
 *
 * Linear discipline:
 *   - 28px row height (h-7)
 *   - text-2xs (11px) muted label, text-2xs tabular-nums on value
 *   - Hover: bg-hover-bg only (no shadow, no border, no scale)
 */
export function MetricRow({
  label,
  value,
  hint,
  rank,
  onClick,
}: {
  label: ReactNode
  value: ReactNode
  /** Tiny subdued caption rendered after the label (e.g. "12 wiki"). */
  hint?: ReactNode
  /** When set, displayed in a fixed-width prefix (for ranked lists). */
  rank?: number
  onClick?: () => void
}) {
  const interactive = typeof onClick === "function"
  const className =
    "flex h-7 w-full items-center gap-2 rounded-md px-2 text-left transition-colors duration-100 " +
    (interactive ? "cursor-pointer hover:bg-hover-bg" : "")

  const content = (
    <>
      {typeof rank === "number" && (
        <span className="w-5 shrink-0 text-2xs tabular-nums text-muted-foreground">
          {rank}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate text-2xs text-foreground">{label}</span>
      {hint && (
        <span className="shrink-0 text-2xs text-muted-foreground">{hint}</span>
      )}
      <span className="shrink-0 text-2xs tabular-nums text-foreground">{value}</span>
    </>
  )

  if (interactive) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    )
  }
  return <div className={className}>{content}</div>
}
