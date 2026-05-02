/**
 * Ontology Graph — Single source of truth for tunable constants.
 *
 * All magic numbers from the graph view live here. References cited
 * inline so future tuning is auditable.
 *
 * Sources:
 *  - Obsidian Graph defaults (DeepWiki: sakuramodki/obsidian)
 *  - d3-force official defaults (https://d3js.org/d3-force)
 *  - vasturiano/force-graph (https://github.com/vasturiano/force-graph)
 *  - Plot Redesign PRD (docs/REDESIGN_ONTOLOGY_GRAPH.md)
 */

import { SPACE_COLORS } from "@/lib/colors"

/* ── Tier classification by node count ─────────────────── */

export type SizeTier = "small" | "medium" | "large" | "xlarge"

export function classifyTier(nodeCount: number): SizeTier {
  if (nodeCount < 20) return "small"
  if (nodeCount < 80) return "medium"
  if (nodeCount < 200) return "large"
  return "xlarge"
}

/* ── Force simulation parameters ───────────────────────── */
// Research recommendation: small graphs need stronger repulsion + larger
// linkDistance so nodes spread out enough to be individually identifiable.
// Large graphs use distanceMax to cap perf cost of all-pairs charge.

export interface ForceTier {
  chargeStrength: number        // forceManyBody.strength (negative = repulsion)
  linkDistance: number          // forceLink.distance
  linkStrength: number          // forceLink.strength (0 = floppy, 1 = rigid)
  collisionPadding: number      // extra px around node radius
  centerStrength: number        // forceCenter.strength
  distanceMax: number | undefined  // forceManyBody.distanceMax (perf cap)
}

export const FORCE_CONFIG: Record<SizeTier, ForceTier> = {
  small: {
    chargeStrength: -150,
    linkDistance: 120,
    linkStrength: 0.5,
    collisionPadding: 4,
    centerStrength: 0.5,
    distanceMax: undefined,
  },
  medium: {
    chargeStrength: -250,
    linkDistance: 80,
    linkStrength: 0.4,
    collisionPadding: 4,
    centerStrength: 0.4,
    distanceMax: undefined,
  },
  large: {
    chargeStrength: -400,
    linkDistance: 60,
    linkStrength: 0.3,
    collisionPadding: 3,
    centerStrength: 0.3,
    distanceMax: 600,
  },
  xlarge: {
    chargeStrength: -500,
    linkDistance: 50,
    linkStrength: 0.25,
    collisionPadding: 3,
    centerStrength: 0.3,
    distanceMax: 500,
  },
}

/* ── Simulation damping ────────────────────────────────── */
// d3 defaults: alphaDecay 0.0228 (~300 ticks), velocityDecay 0.4
// We accelerate slightly (0.03 → ~200 ticks) for snappier convergence.

export const SIM_CONFIG = {
  alphaDecay: 0.03,
  velocityDecay: 0.4,
  alphaMin: 0.001,
  alphaInitial: 0.01,            // main thread sim starts mostly settled
  warmupTicks: 150,              // worker pre-converges this many ticks
  cooldownTime: 8000,            // ms (post-warmup interactive sim duration)
} as const

/* ── Node sizing (Obsidian sqrt(degree) pattern) ───────── */
// Information ∝ degree, perceived area ∝ r² → sqrt(degree) feels natural.
// Hub nodes are visually distinct from leaves without dwarfing them.

export const NODE_SIZE = {
  // Bumped from 4 → 6 (PRD 5.3 calibration). 0-degree leaves still need
  // to be clearly identifiable on a screen, especially for small graphs
  // where most nodes are leaves.
  base: 6,                       // 0-degree minimum
  multiplier: 2.5,               // sqrt(linkCount) coefficient
  min: 6,
  max: 22,                       // hub cap (bumped 20 → 22 to keep range)
  shape: {
    note: 1.0,                   // circle (baseline)
    wiki: 1.15,                  // hexagon slightly larger
    tag: 0.55,                   // pill smaller (metadata)
  },
} as const

export function nodeRadius(linkCount: number): number {
  const r = NODE_SIZE.base + NODE_SIZE.multiplier * Math.sqrt(linkCount)
  return Math.max(NODE_SIZE.min, Math.min(NODE_SIZE.max, r))
}

/* ── Initial fit-to-view policy ────────────────────────── */
// Tier-based padding + scale clamp so small graphs render at near-1.0×
// (nodes shown at their real pixel size) while large graphs zoom out
// enough to show the whole topology.

export interface FitTier {
  padding: number
  minScale: number
  maxScale: number
}

export const FIT_CONFIG: Record<SizeTier, FitTier> & { transitionMs: number } = {
  small:  { padding: 60,  minScale: 1.0,  maxScale: 1.8 },
  medium: { padding: 50,  minScale: 0.7,  maxScale: 1.4 },
  large:  { padding: 40,  minScale: 0.5,  maxScale: 1.0 },
  xlarge: { padding: 30,  minScale: 0.35, maxScale: 0.8 },
  transitionMs: 400,
}

/* ── LOD (Level of Detail) ─────────────────────────────── */
// Smooth fade pattern (Obsidian textFadeMultiplier). Binary toggle
// produces a jarring pop when zooming; smooth fade reads as polished.

export const LOD = {
  nodeMinZoom: 0.15,             // below this, hide nodes (cluster hulls remain)
  labelFadeStart: 0.35,          // labels invisible
  labelFadeEnd: 0.65,            // labels fully visible
  edgeLabelMinZoom: 0.7,         // relation labels (kept binary — high zoom only)
  edgeFadeStart: 0.10,           // edges invisible
  edgeFadeEnd: 0.20,             // edges fully visible
} as const

/** Linear interpolation: returns 0 below start, 1 above end, smooth between. */
export function fadeOpacity(scale: number, start: number, end: number): number {
  if (scale <= start) return 0
  if (scale >= end) return 1
  return (scale - start) / (end - start)
}

/* ── Viewport (zoom/pan/cull) ──────────────────────────── */

export const VIEWPORT = {
  zoomMin: 0.05,
  zoomMax: 3.0,
  zoomStep: 0.15,
  panStep: 60,                   // arrow-key pan distance (screen px)
  cullPadding: 60,               // off-screen render buffer (graph coord)
} as const

/* ── Theme-aware node visual props ─────────────────────── */
// Light mode needs higher fill opacity (33% vs 8% in dark) to stand out
// on a white page. Stroke width also bumped slightly for clarity.

export type NodeShapeKind = "note" | "wiki" | "tag"

export const NODE_THEME = {
  dark: {
    fillOpacity: { note: 0.08, wiki: 0.07, tag: 0.10 },
    strokeWidth: { note: 1.3, wiki: 1.5, tag: 1.3 },
    labelOpacity: { default: 0.85, tag: 0.7, dimmed: 0.3 },
  },
  light: {
    // wiki bumped 0.33 → 0.55 — even deeper violet hex (#7c3aed) needs higher
    // fill opacity to reach equivalent visual weight as note nodes on white.
    // Combined with stronger color, hexagons now clearly anchor visually.
    fillOpacity: { note: 0.33, wiki: 0.55, tag: 0.33 },
    strokeWidth: { note: 1.8, wiki: 2.4, tag: 1.8 },
    labelOpacity: { default: 0.95, tag: 0.8, dimmed: 0.4 },
  },
} as const

export function getNodeRenderProps(kind: NodeShapeKind, isDark: boolean) {
  const theme = isDark ? NODE_THEME.dark : NODE_THEME.light
  return {
    fillOpacity: theme.fillOpacity[kind],
    strokeWidth: theme.strokeWidth[kind],
    labelOpacityDefault: theme.labelOpacity.default,
    labelOpacityTag: theme.labelOpacity.tag,
    labelOpacityDimmed: theme.labelOpacity.dimmed,
  }
}

/* ── Edge styling ──────────────────────────────────────── */

export const EDGE_STYLE = {
  relation: { strokeWidth: 2.0, opacity: 1.0 },
  wikilink: { strokeWidth: 1.2, opacity: 1.0 },
  tag:      { strokeWidth: 0.8, opacityDark: 0.40, opacityLight: 0.55 },
  baseColorDark: "255,255,255",
  baseColorLight: "30,41,59",    // slate-800
  // Dark mode bumped — previously dark < light which made edges nearly
  // invisible on the dark canvas. White ink at 12% on near-black needed
  // ~30% to read at the same perceived weight as slate at 30% on white.
  alphaRelation: { dark: 0.38, light: 0.30 },
  alphaWikilink: { dark: 0.30, light: 0.22 },
  alphaTag:      { dark: 0.22, light: 0.16 },
  // Edge offsets for parallel edges (multiple edges between same node pair)
  bezierSingleOffsetRatio: 0.12,
  parallelEdgeSpread: 20,
  // Highlight (hover/select)
  highlightStrokeWidth: 2.5,
  highlightAlphaHex: "70",       // appended to hex color (alpha = 0x70 ≈ 44%)
} as const

/* ── Cluster hull (group-by or BFS) ────────────────────── */
// Theme-aware visibility: light mode needs ~3× higher opacity since hull
// fill/stroke must contrast against a white page. Dark numbers preserved
// from the original (subtle ghost tint that doesn't fight node visibility).

export const HULL = {
  minNodes: 3,
  padding: 30,
  smoothingTension: 0.3,
  fillOpacity:   { dark: 0.04, light: 0.10 },
  strokeOpacity: { dark: 0.12, light: 0.32 },
  strokeWidth:   { dark: 1.0,  light: 1.5  },
} as const

/** Theme-aware hull visual props — single helper for canvas to consume. */
export function getHullRenderProps(isDark: boolean) {
  return {
    fillOpacity:   isDark ? HULL.fillOpacity.dark   : HULL.fillOpacity.light,
    strokeOpacity: isDark ? HULL.strokeOpacity.dark : HULL.strokeOpacity.light,
    strokeWidth:   isDark ? HULL.strokeWidth.dark   : HULL.strokeWidth.light,
  }
}

/* ── Data filters ──────────────────────────────────────── */

export const TAG_NODE_MIN_USAGE = 5     // tag must be used by ≥ 5 notes
export const MAX_VISIBLE_NODES = 200    // cap by connectionCount top-N

/* ── Cluster layout (worker only) ──────────────────────── */

export const CLUSTER_LAYOUT = {
  minLabelsForClustering: 2,
  baseRadius: 150,
  perNodeMultiplier: 3,          // clusterRadius = max(base, nodes * 3)
  forceStrength: 0.15,
} as const

/* ── Minimap ───────────────────────────────────────────── */

export const MINIMAP = {
  width: 200,
  height: 130,
  padding: 20,
  viewportExpand: 2.5,           // show 2.5× the current viewport in minimap
  selectedColor: SPACE_COLORS.home,    // #5e6ad2 — replaces inline hardcoded
  selectedAlpha: 0.85,
  bgFillDark: "rgba(0, 0, 0, 0.5)",
  bgFillLight: "rgba(255, 255, 255, 0.5)",
  edgeStrokeDark: "rgba(255, 255, 255, 0.1)",
  edgeStrokeLight: "rgba(30, 41, 59, 0.2)",
  outsideDimDark: "rgba(0, 0, 0, 0.3)",
  outsideDimLight: "rgba(255, 255, 255, 0.4)",
  nodeAlphaDefault: 0.75,
  nodeAlphaSelected: 1.0,
  nodeFillAlphaMul: 0.15,        // node fill alpha relative to stroke
  borderWidth: 1.5,
  nodeRadius: 2,                 // size of dots in minimap
  nodeRadiusSelected: 3,
} as const

/* ── Tooltip & label config ────────────────────────────── */

export const LABEL_CONFIG = {
  truncate: 18,                  // max characters before "…"
  fontSizeNote: 11,
  fontSizeTag: 10,
  fontSizeEdge: 9,
  yOffsetFromShape: 14,          // px below node bottom
} as const

export const TOOLTIP_CONFIG = {
  showDelay: 300,                // ms hover before tooltip
  maxTags: 4,                    // max tags shown in tooltip
} as const

/* ── Selection rings ───────────────────────────────────── */

export const SELECTION = {
  singleRingExtra: 6,            // singleSelected ring radius = nodeR + 6
  multiRingExtra: 5,             // multiSelected ring radius = nodeR + 5
  ringStrokeWidth: 1.5,
} as const
