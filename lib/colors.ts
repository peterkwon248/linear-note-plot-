/**
 * Global color constants for Plot.
 *
 * Single source of truth — every data-driven color in the app
 * should import from here. CSS custom properties are used where
 * possible for theme-awareness; raw hex values are provided for
 * canvas / SVG contexts that cannot resolve CSS vars.
 */

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
  stub:     { css: "var(--chart-3)", tw: "chart-3" },
  draft:    { css: "var(--accent)",  tw: "accent" },
  complete: { css: "var(--wiki-complete)", tw: "wiki-complete" },
} as const

/** Wiki hex — complete uses violet to distinguish from permanent green */
export const WIKI_STATUS_HEX = {
  stub:     "#f97316",   // orange
  draft:    "#6366f1",   // indigo (accent)
  complete: "#8b5cf6",   // violet  ← NOT green
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
  wiki:      WIKI_STATUS_HEX.complete,   // violet for wiki nodes
  tag:       "#6b7280",
  default:   "#6b7280",
} as const

export const GRAPH_CLUSTER_PALETTE = [
  "#5e6ad2", "#22c55e", "#f59e0b", "#ec4899",
  "#8b5cf6", "#06b6d4", "#f97316", "#14b8a6",
] as const

/* ── Preset Palette (labels / folders / tags) ── */

export const PRESET_COLORS = [
  "#e5484d", "#f2994a", "#f2c94c", "#45d483", "#06b6d4",
  "#5e6ad2", "#9b59b6", "#e91e8c", "#8b5cf6", "#0ea5e9",
] as const

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
} as const
