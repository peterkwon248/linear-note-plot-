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

/* ── Time series ─────────────────────────────────────── */

/**
 * One bucket of cumulative + delta knowledge counts at a point in time.
 * `ts` is the bucket START (ISO date string for stable sorting / formatting).
 *
 * Edge counts are SNAPSHOTS of "current" linksOut filtered by createdAt of
 * source — we cannot reconstruct historical link state without an event log,
 * so this is a best-effort approximation. New notes/wiki are exact (createdAt
 * is reliable).
 */
export interface TimeSeriesPoint {
  /** ISO date string (YYYY-MM-DD), bucket start. */
  ts: string
  /** Cumulative live notes existing at end of bucket. */
  totalNotes: number
  /** Cumulative live wiki articles existing at end of bucket. */
  totalWiki: number
  /** New notes created within the bucket. */
  newNotes: number
  /** New wiki articles created within the bucket. */
  newWiki: number
  /** Cumulative internal edges (linksOut count) approximated by source createdAt. */
  totalEdges: number
  /** Cumulative wiki articles (isWikiStub === false) at end of bucket. */
  totalArticles: number
  /** Cumulative wiki stubs (isWikiStub === true) at end of bucket. */
  totalStubs: number
  /** New articles (non-stub) created within the bucket. */
  newArticles: number
  /** New stubs created within the bucket. */
  newStubs: number
  /** Cumulative wiki-to-wiki link edges (linksOut on WikiArticle) approximated by source createdAt. */
  totalWikiEdges: number
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
