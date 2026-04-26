/**
 * Knowledge metrics — sabermetrics-style stats for the note/wiki graph.
 *
 * Pure, time-independent metrics (1st cut). All time-series, deltas, or
 * "trending" calculations are deferred to a later iteration.
 */

export interface KnowledgeMetricRef {
  /** Note OR Wiki article ID (caller resolves which). */
  id: string
  title: string
  /** True when the entry is a wiki article (not a note). */
  isWiki: boolean
}

export interface WARScore extends KnowledgeMetricRef {
  /** Knowledge WAR composite score. */
  score: number
}

export interface ReachScore extends KnowledgeMetricRef {
  /** 2-hop neighborhood size (excluding self). */
  reach: number
}

export interface HubScore extends KnowledgeMetricRef {
  /** Incoming backlink count. */
  backlinks: number
}

/**
 * A note that looks ready to be promoted to a wiki article.
 * Heuristic: substantial content + multiple incoming references.
 */
export interface PromotionCandidate {
  noteId: string
  title: string
  /** Incoming backlink count. */
  backlinks: number
  /** Plain-text content length (used as a proxy for "developed enough"). */
  contentLength: number
}

export interface KnowledgeMetrics {
  /* ── Counts ───────────────────────────────── */
  totalNotes: number
  totalWiki: number
  totalEdges: number

  /* ── Ratios ───────────────────────────────── */
  /** edges / notes — average outgoing links per note (1 decimal). */
  linkDensity: number
  /** orphan notes / total — 0..1 (caller multiplies by 100 to display). */
  orphanRate: number
  /** tagged notes / total — 0..1. */
  tagCoverage: number
  /** Average density of detected clusters — 0..1. */
  clusterCohesion: number

  /* ── Top lists (10 each) ─────────────────── */
  topByWAR: WARScore[]
  topByConceptReach: ReachScore[]
  topHubs: HubScore[]

  /* ── Action candidates ───────────────────── */
  /** Notes that look ready to graduate into a wiki article. Top 5. */
  promotionCandidates: PromotionCandidate[]
}
