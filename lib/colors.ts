/**
 * Global color constants for Plot.
 *
 * Single source of truth — every data-driven color in the app
 * should import from here. CSS custom properties are used where
 * possible for theme-awareness; raw hex values are provided for
 * canvas / SVG contexts that cannot resolve CSS vars.
 */

/* ── Space Symbol Colors ─────────────────────────
 * Single source of truth for "what color represents each major feature".
 * Used in bookmarks, mentions, search results, graph, activity-bar hints.
 * Never use raw hex inline for these — always import from here.
 */

export const SPACE_COLORS = {
  home:     "#5e6ad2",   // Indigo  — workspace overview
  notes:    "#06b6d4",   // Cyan    — information / clarity
  wiki:     "#8b5cf6",   // Violet  — knowledge / encyclopedia
  ontology: "#0f766e",   // Teal-700 — graph / connection (deep, calm)
  calendar: "#ec4899",   // Pink    — time / events
  library:  "#b45309",   // Amber-700 — storage / archive (bronze, easier on eyes)
} as const

export type Space = keyof typeof SPACE_COLORS

/** Tailwind-compatible class lookups. Use for className with arbitrary value. */
export const SPACE_COLOR_CLASSES = {
  home:     { text: "text-[#5e6ad2]", bg: "bg-[#5e6ad2]" },
  notes:    { text: "text-[#06b6d4]", bg: "bg-[#06b6d4]" },
  wiki:     { text: "text-[#8b5cf6]", bg: "bg-[#8b5cf6]" },
  ontology: { text: "text-[#0f766e]", bg: "bg-[#0f766e]" },
  calendar: { text: "text-[#ec4899]", bg: "bg-[#ec4899]" },
  library:  { text: "text-[#b45309]", bg: "bg-[#b45309]" },
} as const

/* ── Status Colors (system semantics) ─────────────
 * Used for warning/error/success/info banners and notifications.
 * Tuned to be readable in both light and dark modes without
 * being too neon/eye-straining.
 */

export const STATUS_COLORS = {
  warning: "#b45309",   // amber-700  — bronze, soft
  error:   "#dc2626",   // red-600
  success: "#16a34a",   // green-600
  info:    "#2563eb",   // blue-600
} as const

/* ── Entity Type Colors ──────────────────────────
 * For non-space entity types that appear globally (bookmarks, references,
 * tags, etc.). Distinct from SPACE_COLORS to keep hierarchy clear.
 */

export const ENTITY_COLORS = {
  tag:       "#6b7280",   // Gray   — neutral metadata
  label:     "#64748b",   // Slate  — neutral type (individual labels override)
  folder:    "#f97316",   // Orange — file folder
  bookmark:  "#fbbf24",   // Amber  — pin
  reference: "#3b82f6",   // Blue   — citation / link
  note:      SPACE_COLORS.notes,
  wiki:      SPACE_COLORS.wiki,
} as const

/* ── Knowledge Index Entity Colors ───────────────
 * SINGLE SOURCE OF TRUTH for the 6 cross-cutting entities that
 * appear in Home StatsRow, Library Overview, sidebar nav, mention
 * pickers, and search results. Every entity has ONE canonical:
 *   - text class (Tailwind, theme-aware light/dark)
 *   - bg class (for icon chips / badges)
 *   - hex (for canvas / SVG / inline style color={...})
 *
 * NEVER hardcode entity colors inline. NEVER define a parallel
 * map in a feature module. Import from here.
 *
 * Cross-references:
 *   - notes  ↔ SPACE_COLORS.notes  (cyan, same hex / lighter Tailwind tier)
 *   - wiki   ↔ SPACE_COLORS.wiki   (violet, same hex / lighter Tailwind tier)
 *   - tags / refs / files / stickers — knowledge-index only
 */
export const KNOWLEDGE_INDEX_COLORS = {
  notes: {
    text: "text-cyan-600 dark:text-cyan-400",
    bg:   "bg-cyan-500/10",
    hex:  "#06b6d4",            // matches SPACE_COLORS.notes
  },
  wiki: {
    text: "text-violet-600 dark:text-violet-400",
    bg:   "bg-violet-500/10",
    hex:  "#8b5cf6",            // matches SPACE_COLORS.wiki
  },
  tags: {
    text: "text-amber-600 dark:text-amber-400",
    bg:   "bg-amber-500/10",
    hex:  "#f59e0b",
  },
  references: {
    text: "text-accent",
    bg:   "bg-accent/10",
    hex:  "#4f46e5",            // mirrors --accent (light)
  },
  files: {
    text: "text-teal-600 dark:text-teal-400",
    bg:   "bg-teal-500/10",
    hex:  "#14b8a6",
  },
  stickers: {
    text: "text-fuchsia-600 dark:text-fuchsia-400",
    bg:   "bg-fuchsia-500/10",
    hex:  "#d946ef",
  },
} as const

export type KnowledgeIndexEntity = keyof typeof KNOWLEDGE_INDEX_COLORS

/* ── Note Status ─────────────────────────────── */

/** CSS-var references (for Tailwind / inline style with var()) */
export const NOTE_STATUS_COLORS = {
  inbox:     { css: "var(--chart-2)", tw: "chart-2" },
  capture:   { css: "var(--chart-3)", tw: "chart-3" },
  permanent: { css: "var(--chart-5)", tw: "chart-5" },
} as const

/** Resolved hex values for canvas / SVG (dark theme canonical) */
export const NOTE_STATUS_HEX = {
  inbox:     "#22d3ee",   // cyan
  capture:   "#f97316",   // orange
  permanent: "#22c55e",   // green
} as const

/* ── Wiki Status ─────────────────────────────── */

export const WIKI_STATUS_COLORS = {
  stub:    { css: "var(--chart-3)", tw: "chart-3" },
  article: { css: "var(--wiki-complete)", tw: "wiki-complete" },
} as const

/** Wiki status hex — article (= "complete") uses emerald to distinguish
 *  from the wiki **entity** color (violet, `SPACE_COLORS.wiki`). Earlier
 *  the article hex was `#7c3aed` violet and indistinguishable from the
 *  entity color. Mirrors the Notes-permanent green semantic: stub=in-
 *  progress (orange), article=complete (emerald), wiki entity=violet. */
export const WIKI_STATUS_HEX = {
  stub:    "#f97316",   // orange — in-progress (same hue as Notes capture)
  article: "#10b981",   // emerald — complete (same hue as Notes permanent)
} as const

/* ── Priority ────────────────────────────────── */

export const PRIORITY_COLORS = {
  none:   { css: "var(--muted-foreground)", tw: "muted-foreground" },
  urgent: { css: "var(--chart-4)",          tw: "chart-4" },
  high:   { css: "var(--chart-3)",          tw: "chart-3" },
  medium: { css: "var(--priority-medium)",  tw: "priority-medium" },
  low:    { css: "var(--accent)",           tw: "accent" },
} as const

export const PRIORITY_HEX = {
  none:   "#6b7280",
  urgent: "#ef4444",   // red
  high:   "#f97316",   // orange
  medium: "#f59e0b",   // amber  ← distinct from high
  low:    "#6366f1",   // indigo
} as const

/* ── Triage ──────────────────────────────────── */

export const TRIAGE_HEX = {
  untriaged: "#3b82f6",  // blue
  kept:      "#22c55e",  // green
  snoozed:   "#f59e0b",  // amber
  trashed:   "#ef4444",  // red
} as const

/* ── Relations ───────────────────────────────── */

export const RELATION_HEX = {
  "related-to":  "#6b7280",  // gray-500
  "inspired-by": "#8b5cf6",  // violet-500
  "contradicts": "#ef4444",  // red-500
  "extends":     "#3b82f6",  // blue-500
  "depends-on":  "#f59e0b",  // amber-500
} as const

/* ── Graph (ontology) ────────────────────────── */

export const GRAPH_NODE_HEX = {
  inbox:     NOTE_STATUS_HEX.inbox,
  capture:   NOTE_STATUS_HEX.capture,
  permanent: NOTE_STATUS_HEX.permanent,
  // Wiki **entity** color (violet) — NOT WIKI_STATUS_HEX.article (emerald,
  // which is a publication-state color). Graph nodes represent the wiki
  // entity itself regardless of stub/article state, so they inherit the
  // entity color used by the sidebar/activity-bar/Home StatsRow.
  wiki:      SPACE_COLORS.wiki,
  tag:       "#6b7280",
  default:   "#6b7280",
} as const

export const GRAPH_CLUSTER_PALETTE = [
  "#5e6ad2", "#22c55e", "#f59e0b", "#ec4899",
  "#8b5cf6", "#06b6d4", "#f97316", "#14b8a6",
] as const

/* ── Preset Palette (labels / folders / tags) ──
 * Linear-style: 18 colors covering full hue spectrum at consistent saturation/lightness.
 * Names match Tailwind 500 tier for hover labels and keyboard-first selection.
 */

export const PRESET_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#10b981", // emerald
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#0ea5e9", // sky
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#d946ef", // fuchsia
  "#ec4899", // pink
  "#f43f5e", // rose
  "#64748b", // slate (neutral)
] as const

export const PRESET_COLOR_NAMES: Record<string, string> = {
  "#ef4444": "Red",
  "#f97316": "Orange",
  "#f59e0b": "Amber",
  "#eab308": "Yellow",
  "#84cc16": "Lime",
  "#22c55e": "Green",
  "#10b981": "Emerald",
  "#14b8a6": "Teal",
  "#06b6d4": "Cyan",
  "#0ea5e9": "Sky",
  "#3b82f6": "Blue",
  "#6366f1": "Indigo",
  "#8b5cf6": "Violet",
  "#a855f7": "Purple",
  "#d946ef": "Fuchsia",
  "#ec4899": "Pink",
  "#f43f5e": "Rose",
  "#64748b": "Slate",
}

/* ── Link Density (board view) ──────────────── */

export const LINK_DENSITY_HEX = {
  none: "#6b7280",
  few:  "#3b82f6",
  well: "#22c55e",
  hub:  "#a855f7",
} as const

/* ── Calendar Status Dots ───────────────────── */

export const STATUS_DOT_FALLBACK = "#6b7280"

/* ── Event Log ───────────────────────────────── */

export const EVENT_HEX = {
  created:             "#45d483",
  updated:             "#5e6ad2",
  opened:              "#6b7280",
  promoted:            "#10b981",
  trashed:             "#ef4444",
  untrashed:           "#ef4444",
  triage_keep:         "#45d483",
  triage_snooze:       "#f59e0b",
  triage_trash:        "#ef4444",
  link_added:          "#5e6ad2",
  link_removed:        "#5e6ad2",
  thread_started:      "#06b6d4",
  thread_step_added:   "#06b6d4",
  thread_ended:        "#06b6d4",
  thread_deleted:      "#ef4444",
  label_changed:       "#a855f7",
  srs_reviewed:        "#06b6d4",
  autopilot_applied:   "#8b5cf6",
  relation_added:      "#3b82f6",
  relation_removed:    "#3b82f6",
  relation_type_changed: "#3b82f6",
  alias_changed:       "#3b82f6",
  wiki_converted:      "#8b5cf6",
  attachment_added:    "#22c55e",
  attachment_removed:  "#ef4444",
  reflection_added:    "#f59e0b",
  split:               "#a855f7",
} as const
