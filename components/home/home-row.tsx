"use client"

import type { ReactNode } from "react"

/**
 * Single Home list row.
 *
 * Variants:
 *   - "default" (h-7, 28px): compact for sidebar / small lists
 *   - "large"   (h-14, 56px): main content list with sub line
 *
 * Layout (large):
 *   [icon] [title + sub (stacked)] [meta (right)]
 *
 * Layout (default):
 *   [icon] [title (truncate, flex-1)] [meta (right)]
 *
 * Linear discipline: hover bg-hover-bg only, no shadow, no scale, 100ms.
 */
export function HomeRow({
  icon,
  title,
  sub,
  meta,
  onClick,
  variant = "default",
}: {
  icon?: ReactNode
  title: ReactNode
  /** Sub line shown below title (variant="large" only). */
  sub?: ReactNode
  /** Right-aligned tabular meta — relative time, count, etc. */
  meta?: ReactNode
  onClick?: () => void
  variant?: "default" | "large"
}) {
  const interactive = typeof onClick === "function"

  if (variant === "large") {
    const className =
      "group flex w-full items-center gap-3 border-b border-border/40 px-2 py-3 text-left transition-colors duration-100 " +
      (interactive ? "cursor-pointer hover:bg-hover-bg" : "")
    const content = (
      <>
        {icon && (
          <span className="flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground/70">
            {icon}
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-note text-foreground group-hover:text-foreground">
            {title}
          </span>
          {sub && (
            <span className="truncate text-2xs text-muted-foreground/60">
              {sub}
            </span>
          )}
        </span>
        {meta && (
          <span className="shrink-0 text-2xs tabular-nums text-muted-foreground/60">
            {meta}
          </span>
        )}
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

  // default variant (compact)
  const className =
    "flex h-7 w-full items-center gap-2 rounded-md px-2 text-left transition-colors duration-100 " +
    (interactive ? "cursor-pointer hover:bg-hover-bg" : "")

  const content = (
    <>
      {icon && (
        <span className="flex h-4 w-4 shrink-0 items-center justify-center text-muted-foreground/70">
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate text-2xs text-foreground">
        {title}
      </span>
      {meta && (
        <span className="shrink-0 text-2xs tabular-nums text-muted-foreground/60">
          {meta}
        </span>
      )}
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
