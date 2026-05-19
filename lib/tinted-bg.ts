"use client"

import { useTheme } from "next-themes"
import { useMemo } from "react"
import { shouldUseLightText } from "@/lib/wiki-color-contrast"

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
 * Delegates to `shouldUseLightText` (lib/wiki-color-contrast) which parses
 * hex (#rrggbb / #rgb) AND rgba/rgb uniformly via perceived luminance
 * (Rec. 709 weighting). Yellow/lime/amber/cyan → dark text, reds/blues/
 * purples → light text. Previously a local regex only matched rgba(...) so
 * hex inputs (PRESET_COLORS themeColor picker) fell through to default
 * white text on bright backgrounds in light mode — unreadable.
 */
export function useTintedText(rawColor: string | null | undefined): string {
  const { resolvedTheme } = useTheme()
  return useMemo(() => {
    if (resolvedTheme !== "light" || !rawColor) return "rgba(255,255,255,0.85)"
    return shouldUseLightText(rawColor) ? "rgba(255,255,255,0.92)" : "rgb(30,30,30)"
  }, [resolvedTheme, rawColor])
}
