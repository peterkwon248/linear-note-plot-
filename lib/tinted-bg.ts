"use client"

import { useTheme } from "next-themes"
import { useMemo } from "react"

/**
 * Theme-aware tinted background resolver.
 *
 * User-stored colors are typically `rgba(r,g,b,0.35~0.65)` — designed to look
 * good on dark backgrounds. On a white background the same alpha looks faded
 * and washes out the colored section (infobox header, banner, etc.).
 *
 * In light mode we boost the alpha toward opaque so the tint reads as a
 * deliberate color choice rather than a barely-there wash. In dark mode the
 * stored value is returned as-is.
 *
 * Hex values (`#rrggbb`) are passed through unchanged in both modes.
 */
export function useTintedBg(rawColor: string | null | undefined): string | undefined {
  const { resolvedTheme } = useTheme()
  if (!rawColor) return undefined
  if (resolvedTheme !== "light") return rawColor

  // Boost alpha for visibility on white. 0.35 → 0.85, 0.65 → 0.95, etc.
  return boostAlphaForLight(rawColor)
}

/**
 * Pure helper — boosts alpha of an rgba(...) string for light-mode visibility.
 * Pushes the floor to 0.95 so even soft tints render as deliberate fills on a
 * white background. Non-rgba inputs (hex, named colors) are returned unchanged.
 *
 * Exposed for non-hook contexts (eg. tiptap NodeView style attrs that need a
 * synchronous one-shot resolution at render time, or color-swatch previews
 * that should mirror the final rendered color).
 */
export function boostAlphaForLight(rawColor: string): string {
  const m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/.exec(rawColor)
  if (!m) return rawColor
  const [, r, g, b] = m
  // Floor alpha at 0.95 — any tint becomes a near-solid fill in light mode so
  // colored sections (infobox, banner, group headers) read clearly on white.
  return `rgba(${r},${g},${b},0.95)`
}

/**
 * Pick a readable text color for a tinted background. In light mode the
 * background is near-opaque so contrast against the raw color matters; in
 * dark mode the alpha-tinted bg blends with the dark page so white reads
 * well universally.
 *
 * Uses simple ITU-R BT.601 luma (no gamma correction) — fine for picking
 * between two end-points. Threshold tuned so yellow/lime/cyan get dark text
 * while reds/blues/purples keep white text.
 */
export function useTintedText(rawColor: string | null | undefined): string {
  const { resolvedTheme } = useTheme()
  return useMemo(() => {
    if (resolvedTheme !== "light" || !rawColor) return "rgba(255,255,255,0.85)"
    const m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/.exec(rawColor)
    if (!m) return "rgba(255,255,255,0.85)"
    const r = parseFloat(m[1])
    const g = parseFloat(m[2])
    const b = parseFloat(m[3])
    const luma = 0.299 * r + 0.587 * g + 0.114 * b
    return luma > 150 ? "rgb(30,30,30)" : "rgba(255,255,255,0.92)"
  }, [resolvedTheme, rawColor])
}
