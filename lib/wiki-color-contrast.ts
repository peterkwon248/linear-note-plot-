/**
 * Luminance-based contrast helpers.
 *
 * Used by navbox / banner / infobox to pick white-vs-black foreground based on
 * the chosen background color. Banner-block presets (rgba, alpha=0.35) are
 * intentionally translucent so the text-on-card contrast is dominated by the
 * RGB channel — the alpha barely matters for legibility on dark mode.
 *
 * For PR2 we keep this simple: if the perceived luminance of the *opaque* RGB
 * is below ~0.55, treat the surface as "dark" → use light foreground.
 */

interface RGBA {
  r: number
  g: number
  b: number
  a: number
}

/** Parse `rgba(r,g,b,a)` / `rgb(r,g,b)` / `#rrggbb` / `#rgb`. Returns null on failure. */
export function parseColor(input: string | null | undefined): RGBA | null {
  if (!input) return null
  const s = input.trim()

  // rgba(r,g,b,a) | rgb(r,g,b)
  const rgbaMatch = s.match(
    /^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*([0-9.]+))?\s*\)$/i,
  )
  if (rgbaMatch) {
    const r = clamp255(parseFloat(rgbaMatch[1]))
    const g = clamp255(parseFloat(rgbaMatch[2]))
    const b = clamp255(parseFloat(rgbaMatch[3]))
    const a = rgbaMatch[4] != null ? clamp01(parseFloat(rgbaMatch[4])) : 1
    return { r, g, b, a }
  }

  // #rgb
  const m3 = s.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i)
  if (m3) {
    const r = parseInt(m3[1] + m3[1], 16)
    const g = parseInt(m3[2] + m3[2], 16)
    const b = parseInt(m3[3] + m3[3], 16)
    return { r, g, b, a: 1 }
  }

  // #rrggbb
  const m6 = s.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
  if (m6) {
    const r = parseInt(m6[1], 16)
    const g = parseInt(m6[2], 16)
    const b = parseInt(m6[3], 16)
    return { r, g, b, a: 1 }
  }

  return null
}

function clamp255(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)))
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

/** Perceived luminance, 0..1 (Rec. 709 weighting). */
export function perceivedLuminance(rgba: RGBA): number {
  // sRGB linearization is overkill for our threshold heuristic.
  const r = rgba.r / 255
  const g = rgba.g / 255
  const b = rgba.b / 255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Returns true if the given background is dark enough that we should switch to
 * light foreground text. When `bg` is null/undefined the navbox falls back to
 * theme-default (`text-foreground`) and this helper has no opinion.
 */
export function shouldUseLightText(bg: string | null | undefined): boolean {
  const parsed = parseColor(bg)
  if (!parsed) return false
  // Intentionally biased toward dark surfaces: alpha < 0.5 on a dark theme
  // background is still effectively dark.
  const eff = parsed.a >= 0.5
    ? perceivedLuminance(parsed)
    : perceivedLuminance(parsed) * parsed.a + 0.06 * (1 - parsed.a) // assume dark canvas
  return eff < 0.55
}

/**
 * Tailwind-friendly color class for a given bg. When bg is null returns
 * an empty string so callers can compose with default `text-foreground`.
 */
export function navboxForegroundClass(bg: string | null | undefined): string {
  const parsed = parseColor(bg)
  if (!parsed) return ""
  return shouldUseLightText(bg) ? "text-white" : "text-neutral-900"
}

/** Subtle accent/border tint that pairs with a strong bg color. */
export function navboxBorderTint(bg: string | null | undefined): string | undefined {
  if (!bg) return undefined
  return "rgba(0,0,0,0.18)"
}
