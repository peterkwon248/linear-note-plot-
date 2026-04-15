"use client"

/**
 * WikiThemeProvider — Phase 2-1A.
 *
 * Sets `--wiki-theme-light` + `--wiki-theme-dark` CSS custom properties as
 * inline styles, plus the `.wiki-theme-scope` class. Globals.css picks the
 * active variant via a `.dark .wiki-theme-scope` selector → children can
 * just reference `var(--wiki-theme-active)` for automatic light/dark cascade.
 *
 * Section-level themeColor (e.g. WikiTemplateSection.themeColor) can be applied
 * by nesting another WikiThemeProvider inside this one — the inner inline style
 * overrides the outer for that subtree. CSS cascade does the rest.
 *
 * If `themeColor` is undefined, the scope class is still applied but vars stay
 * at their `transparent` fallback (effectively a no-op).
 */

import { type ReactNode, type CSSProperties } from "react"
import type { WikiThemeColor } from "@/lib/types"
import { cn } from "@/lib/utils"

export interface WikiThemeProviderProps {
  themeColor?: WikiThemeColor
  children: ReactNode
  className?: string
  /** Render as `<section>` (default `<div>`). Use when semantically a section. */
  as?: "div" | "section" | "article"
}

export function WikiThemeProvider({
  themeColor,
  children,
  className,
  as: Tag = "div",
}: WikiThemeProviderProps) {
  const style: CSSProperties = themeColor
    ? ({
        "--wiki-theme-light": themeColor.light,
        "--wiki-theme-dark": themeColor.dark,
      } as CSSProperties)
    : {}

  return (
    <Tag className={cn("wiki-theme-scope", className)} style={style}>
      {children}
    </Tag>
  )
}
