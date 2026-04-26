"use client"

import type { ReactNode } from "react"

/**
 * Home > Section wrapper.
 *
 * Sabermetrics-discipline (mirrors `components/ontology/ontology-insights-panel.tsx`):
 *   - Uppercase 11px tracking-wider muted label
 *   - Optional small tabular-nums count beside label
 *   - Optional "View all →" trailing link
 *   - "Felt not seen" divider via border-b border-border/40, no last:border-b-0
 *
 * The unit-cell of every Home block. Reused by Inbox / Today / Recent / Pinned / Nudge.
 */
export function HomeSection({
  label,
  count,
  trailing,
  empty,
  variant = "default",
  children,
}: {
  label: string
  count?: number
  /** Optional element rendered on the right side of the header (e.g. "View all →"). */
  trailing?: ReactNode
  /** When provided AND children is empty array, renders this in muted text instead. */
  empty?: ReactNode
  /**
   * Visual style:
   * - "default": divider-only ("felt not seen") section. Used by lightweight rows.
   * - "card": subtle card container — border + background + padding. Used by content blocks.
   */
  variant?: "default" | "card"
  children: ReactNode
}) {
  // Detect if children is an empty array — show empty state if provided
  const childArray = Array.isArray(children) ? children : [children]
  const hasContent =
    childArray.filter((c) => c !== null && c !== undefined && c !== false).length > 0

  if (variant === "card") {
    return (
      <section className="mb-3 rounded-lg border border-border/40 bg-card/30 p-3">
        <header className="mb-1.5 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </h3>
            {typeof count === "number" && count > 0 && (
              <span className="text-2xs tabular-nums text-muted-foreground/70">
                {count}
              </span>
            )}
          </div>
          {trailing && <div className="shrink-0">{trailing}</div>}
        </header>
        <div className="flex flex-col">
          {hasContent ? children : empty ? (
            <p className="px-2 py-1.5 text-2xs text-muted-foreground/60">{empty}</p>
          ) : null}
        </div>
      </section>
    )
  }

  return (
    <section className="mb-6 border-b border-border/40 pb-4 last:mb-0 last:border-b-0">
      <header className="mb-1.5 flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <h3 className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </h3>
          {typeof count === "number" && count > 0 && (
            <span className="text-2xs tabular-nums text-muted-foreground/70">
              {count}
            </span>
          )}
        </div>
        {trailing && <div className="shrink-0">{trailing}</div>}
      </header>
      <div className="flex flex-col">
        {hasContent ? children : empty ? (
          <p className="px-2 py-1.5 text-2xs text-muted-foreground/60">{empty}</p>
        ) : null}
      </div>
    </section>
  )
}

/**
 * "View all →" trailing link variant. Appears only on hover for Linear discipline.
 */
export function ViewAllLink({
  onClick,
  children = "View all",
}: {
  onClick: () => void
  children?: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-2xs text-muted-foreground/60 transition-colors hover:text-foreground"
    >
      {children} <span aria-hidden>→</span>
    </button>
  )
}
