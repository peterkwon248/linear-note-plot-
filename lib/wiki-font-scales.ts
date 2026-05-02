import type { WikiFontScales } from "./types"
import type { CSSProperties } from "react"

/**
 * 6 logical font groups exposed to the user via Reader Settings.
 * Order matters — used to render the popover rows top-to-bottom.
 */
export const FONT_SCALE_GROUPS = [
  { key: "title",   label: "Article title",     hint: "h1" },
  { key: "heading", label: "Section headings",  hint: "h2 / h3 / h4" },
  { key: "body",    label: "Body text",         hint: "Paragraphs, tables, embeds" },
  { key: "infobox", label: "Infobox",           hint: "Header, fields, values" },
  { key: "meta",    label: "TOC / Footnotes",   hint: "Sidebar contents, footnotes, references" },
  { key: "misc",    label: "Navbox / Banner",   hint: "Navigation boxes, banners" },
] as const satisfies ReadonlyArray<{ key: keyof WikiFontScales; label: string; hint: string }>

export type FontScaleKey = (typeof FONT_SCALE_GROUPS)[number]["key"]

export const SCALE_MIN = 0.7
export const SCALE_MAX = 1.6
export const SCALE_STEP = 0.1

/** CSS variable names — match `--scale-{key}` convention. */
export const SCALE_VAR: Record<FontScaleKey, string> = {
  title:   "--scale-title",
  heading: "--scale-heading",
  body:    "--scale-body",
  infobox: "--scale-infobox",
  meta:    "--scale-meta",
  misc:    "--scale-misc",
}

/** Resolve a scales object into inline CSS variables. Missing keys default to 1. */
export function fontScalesToStyle(scales: WikiFontScales | undefined): CSSProperties {
  const style: Record<string, string> = {}
  for (const { key } of FONT_SCALE_GROUPS) {
    const v = scales?.[key] ?? 1
    style[SCALE_VAR[key]] = String(v)
  }
  return style as CSSProperties
}

/** Clamp a candidate scale value to [SCALE_MIN, SCALE_MAX] rounded to 1 decimal. */
export function clampScale(v: number): number {
  const clamped = Math.min(SCALE_MAX, Math.max(SCALE_MIN, v))
  return Math.round(clamped * 10) / 10
}

/**
 * Build a CSS `calc(...)` expression for a base em value scaled by a group.
 * Usage: `style={{ fontSize: emScale(1.75, "title") }}` for an h1.
 *
 * The component must be rendered inside a container that has the matching
 * CSS variable defined (see `fontScalesToStyle`).
 */
export function emScale(baseEm: number, group: FontScaleKey): string {
  return `calc(${baseEm}em * var(${SCALE_VAR[group]}, 1))`
}
