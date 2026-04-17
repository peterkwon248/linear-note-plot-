/**
 * Column Palette — Phase 3.1-A
 *
 * 8-color pastel palette for per-column themeColor visuals.
 * Colors are defined as CSS variables in app/globals.css.
 * This module is the JS-side registry — UI picker, random assignment, etc.
 *
 * Separate from `WikiThemeColor` (Infobox header color palette).
 */

export interface ColumnPaletteEntry {
  id: string
  name: string
  /** CSS var name for column background tint. */
  bgVar: string
  /** CSS var name for accent color (used by column-name label, rule highlight). */
  accentVar: string
}

export const COLUMN_PALETTE: ColumnPaletteEntry[] = [
  // Row 1
  { id: "slate", name: "Slate", bgVar: "--mag-col-slate-bg", accentVar: "--mag-col-slate-accent" },
  { id: "sage", name: "Sage", bgVar: "--mag-col-sage-bg", accentVar: "--mag-col-sage-accent" },
  { id: "blush", name: "Blush", bgVar: "--mag-col-blush-bg", accentVar: "--mag-col-blush-accent" },
  { id: "sand", name: "Sand", bgVar: "--mag-col-sand-bg", accentVar: "--mag-col-sand-accent" },
  // Row 2
  { id: "sky", name: "Sky", bgVar: "--mag-col-sky-bg", accentVar: "--mag-col-sky-accent" },
  { id: "lavender", name: "Lavender", bgVar: "--mag-col-lavender-bg", accentVar: "--mag-col-lavender-accent" },
  { id: "peach", name: "Peach", bgVar: "--mag-col-peach-bg", accentVar: "--mag-col-peach-accent" },
  { id: "ash", name: "Ash", bgVar: "--mag-col-ash-bg", accentVar: "--mag-col-ash-accent" },
  // Row 3
  { id: "mint", name: "Mint", bgVar: "--mag-col-mint-bg", accentVar: "--mag-col-mint-accent" },
  { id: "coral", name: "Coral", bgVar: "--mag-col-coral-bg", accentVar: "--mag-col-coral-accent" },
  { id: "ocean", name: "Ocean", bgVar: "--mag-col-ocean-bg", accentVar: "--mag-col-ocean-accent" },
  { id: "wine", name: "Wine", bgVar: "--mag-col-wine-bg", accentVar: "--mag-col-wine-accent" },
  // Row 4
  { id: "lime", name: "Lime", bgVar: "--mag-col-lime-bg", accentVar: "--mag-col-lime-accent" },
  { id: "iris", name: "Iris", bgVar: "--mag-col-iris-bg", accentVar: "--mag-col-iris-accent" },
  { id: "cream", name: "Cream", bgVar: "--mag-col-cream-bg", accentVar: "--mag-col-cream-accent" },
  { id: "charcoal", name: "Charcoal", bgVar: "--mag-col-charcoal-bg", accentVar: "--mag-col-charcoal-accent" },
]

export function getPaletteEntry(id: string | undefined): ColumnPaletteEntry | null {
  if (!id) return null
  return COLUMN_PALETTE.find((p) => p.id === id) ?? null
}

/**
 * Pick a random palette entry. Used for "Auto" column coloring mode.
 * Deterministic if `seed` provided (e.g. columnPath.join(".") for stable hues).
 */
export function pickRandomPaletteId(seed?: string): string {
  if (!seed) return COLUMN_PALETTE[Math.floor(Math.random() * COLUMN_PALETTE.length)].id
  // Simple hash
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i)
    hash |= 0
  }
  const idx = Math.abs(hash) % COLUMN_PALETTE.length
  return COLUMN_PALETTE[idx].id
}

/**
 * Return inline style object exposing the active palette's vars
 * as `--mag-col-active-bg` / `--mag-col-active-accent`, consumed by
 * `.wiki-column-cell--themed` / `.wiki-column-name` selectors.
 */
export function paletteStyleVars(
  paletteId: string | undefined,
  alpha?: number,
  gradientTo?: string,
): Record<string, string> | undefined {
  const entry = getPaletteEntry(paletteId)
  if (!entry) return undefined
  const vars: Record<string, string> = {
    "--mag-col-active-bg": `var(${entry.bgVar})`,
    "--mag-col-active-accent": `var(${entry.accentVar})`,
  }
  if (alpha !== undefined && alpha < 1) {
    vars["--mag-col-active-alpha"] = String(alpha)
  }
  if (gradientTo) {
    const toEntry = getPaletteEntry(gradientTo)
    if (toEntry) {
      vars["--mag-col-gradient-to"] = `var(${toEntry.bgVar})`
    }
  }
  return vars
}

/**
 * Asymmetric ratio presets (Phase 3.1-A) — intentional magazine ratios,
 * NOT arbitrary. Editorial DNA: golden ratio, 5:3, 2:1 etc.
 *
 * Each preset has a human-readable label + ratio array.
 * The count (columns.length) is inferred from ratio array length.
 */
export interface AsymmetricPreset {
  id: string
  /** Short human-readable name shown in menu (Korean). */
  title: string
  /** Ratio label (mono) shown on right, e.g. "φ:1". */
  label: string
  /** How many cards (= ratios.length) — used for grouping in menu. */
  cardCount: 2 | 3
  ratios: number[]
  minWidths?: number[]
  /** Optional long description (not shown in menu anymore — kept for docs/future). */
  description?: string
}

export const ASYMMETRIC_PRESETS: AsymmetricPreset[] = [
  {
    id: "golden-2",
    title: "황금비",
    label: "φ : 1",
    cardCount: 2,
    ratios: [1.618, 1],
    minWidths: [320, 180],
    description: "본문 강조",
  },
  {
    id: "5-3",
    title: "뉴스",
    label: "5 : 3",
    cardCount: 2,
    ratios: [5, 3],
    minWidths: [320, 200],
    description: "뉴스 레이아웃",
  },
  {
    id: "2-1",
    title: "사이드",
    label: "2 : 1",
    cardCount: 2,
    ratios: [2, 1],
    minWidths: [300, 180],
    description: "본문 + 사이드 (위키피디아식)",
  },
  {
    id: "5-2-2",
    title: "듀얼 메타",
    label: "5 : 2 : 2",
    cardCount: 3,
    ratios: [5, 2, 2],
    minWidths: [320, 160, 160],
    description: "본문 + 메타 듀얼",
  },
  {
    id: "2-3-2",
    title: "센터 강조",
    label: "2 : 3 : 2",
    cardCount: 3,
    ratios: [2, 3, 2],
    minWidths: [160, 280, 160],
    description: "양옆 메타 + 본문 중앙",
  },
]

export function getAsymmetricPreset(id: string): AsymmetricPreset | null {
  return ASYMMETRIC_PRESETS.find((p) => p.id === id) ?? null
}
