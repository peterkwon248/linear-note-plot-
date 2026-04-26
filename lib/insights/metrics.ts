/**
 * Knowledge metrics computation — pure, deterministic.
 *
 * Caller wraps in useMemo. No internal caching. No DOM. No store reads.
 *
 * Complexity: O(N + E + N*avgDegree²) where avgDegree is small in practice.
 * 1k notes ≈ ~tens of ms on modern hardware. Worker offload deferred.
 */

import type { Note, WikiArticle } from "@/lib/types"
import { computeCoOccurrences, detectClusters } from "@/lib/co-occurrence"
import type {
  KnowledgeMetrics,
  WARScore,
  ReachScore,
  HubScore,
  PromotionCandidate,
} from "./types"

/* ── Tunables ─────────────────────────────────────────── */

const WAR_BACKLINK_WEIGHT = 2
const WAR_LINKOUT_WEIGHT = 1
const WAR_TAG_WEIGHT = 0.5
const WAR_AGE_DAY_DIVISOR = 30
const WAR_ORPHAN_PENALTY = -2

const TOP_LIST_SIZE = 10

const CLUSTER_MIN_SIZE = 3
const CLUSTER_MIN_DENSITY = 0.5

/* Promotion thresholds — tuned to be permissive (small KBs still see signals). */
const PROMOTION_MIN_BACKLINKS = 3
const PROMOTION_MIN_CONTENT_LENGTH = 200
const PROMOTION_TOP_N = 5

/* ── Inputs ───────────────────────────────────────────── */

export interface ComputeKnowledgeMetricsInput {
  notes: Note[]
  wikiArticles: WikiArticle[]
  /** noteId → incoming backlink count. */
  backlinksMap: Map<string, number> | Record<string, number>
  /** Optional override for "now" — used for deterministic tests. */
  now?: number
}

/* ── Internal helpers ─────────────────────────────────── */

function lookupBacklinks(
  map: Map<string, number> | Record<string, number>,
  id: string,
): number {
  if (map instanceof Map) return map.get(id) ?? 0
  return map[id] ?? 0
}

function ageDays(createdAt: string, now: number): number {
  const t = Date.parse(createdAt)
  if (Number.isNaN(t)) return 0
  return Math.max(0, (now - t) / 86_400_000)
}

/* ── computeKnowledgeMetrics ──────────────────────────── */

export function computeKnowledgeMetrics(
  input: ComputeKnowledgeMetricsInput,
): KnowledgeMetrics {
  const now = input.now ?? Date.now()
  const liveNotes = input.notes.filter((n) => !n.trashed)
  const liveWiki = input.wikiArticles.filter((w) => !(w as { trashed?: boolean }).trashed)

  const totalNotes = liveNotes.length
  const totalWiki = liveWiki.length
  const totalEdges = liveNotes.reduce((sum, n) => sum + (n.linksOut?.length ?? 0), 0)

  /* ── Ratios ───────────────────────────────── */

  const linkDensity =
    totalNotes > 0 ? Math.round((totalEdges / totalNotes) * 10) / 10 : 0

  const orphanCount = liveNotes.filter((n) => {
    const out = n.linksOut?.length ?? 0
    const inc = lookupBacklinks(input.backlinksMap, n.id)
    return out === 0 && inc === 0
  }).length
  const orphanRate = totalNotes > 0 ? orphanCount / totalNotes : 0

  const taggedCount = liveNotes.filter((n) => (n.tags?.length ?? 0) > 0).length
  const tagCoverage = totalNotes > 0 ? taggedCount / totalNotes : 0

  /* ── Knowledge WAR ─────────────────────────
     score = backlinks*2 + linksOut + tags*0.5
           + ageDays/30 + (orphan ? -2 : 0)
     Top 10 across notes (wiki articles excluded — they are reach hubs not WAR producers).
  */
  const warScores: WARScore[] = liveNotes.map((n) => {
    const back = lookupBacklinks(input.backlinksMap, n.id)
    const out = n.linksOut?.length ?? 0
    const tagBonus = (n.tags?.length ?? 0) * WAR_TAG_WEIGHT
    const ageBonus = ageDays(n.createdAt, now) / WAR_AGE_DAY_DIVISOR
    const orphanPenalty = back === 0 && out === 0 ? WAR_ORPHAN_PENALTY : 0
    const score =
      back * WAR_BACKLINK_WEIGHT +
      out * WAR_LINKOUT_WEIGHT +
      tagBonus +
      ageBonus +
      orphanPenalty
    return { id: n.id, title: n.title || "Untitled", isWiki: false, score: Math.round(score * 10) / 10 }
  })
  warScores.sort((a, b) => b.score - a.score)
  const topByWAR = warScores.slice(0, TOP_LIST_SIZE)

  /* ── Concept Reach (2-hop neighborhood) ────
     Build adjacency: note.id → Set of titleKeys it links to.
     Build titleKey → noteId so links resolve.
     Reach(n) = | { m | m reachable in <=2 hops via outgoing+incoming } | - 1
  */
  const titleToId = new Map<string, string>()
  for (const n of liveNotes) {
    titleToId.set(n.title.toLowerCase(), n.id)
    for (const a of n.aliases ?? []) titleToId.set(a.toLowerCase(), n.id)
  }
  const adj = new Map<string, Set<string>>()
  for (const n of liveNotes) adj.set(n.id, new Set())
  for (const n of liveNotes) {
    for (const link of n.linksOut ?? []) {
      const targetId = titleToId.get(link.toLowerCase())
      if (!targetId || targetId === n.id) continue
      adj.get(n.id)!.add(targetId)
      adj.get(targetId)!.add(n.id) // undirected for reach
    }
  }

  const reachScores: ReachScore[] = liveNotes.map((n) => {
    const direct = adj.get(n.id) ?? new Set<string>()
    const twoHop = new Set<string>(direct)
    for (const m of direct) {
      const mAdj = adj.get(m)
      if (!mAdj) continue
      for (const k of mAdj) if (k !== n.id) twoHop.add(k)
    }
    return {
      id: n.id,
      title: n.title || "Untitled",
      isWiki: false,
      reach: twoHop.size,
    }
  })
  reachScores.sort((a, b) => b.reach - a.reach)
  const topByConceptReach = reachScores.slice(0, TOP_LIST_SIZE)

  /* ── Top Hubs (raw backlink count) ─────── */
  const hubScores: HubScore[] = liveNotes.map((n) => ({
    id: n.id,
    title: n.title || "Untitled",
    isWiki: false,
    backlinks: lookupBacklinks(input.backlinksMap, n.id),
  }))
  hubScores.sort((a, b) => b.backlinks - a.backlinks)
  const topHubs = hubScores.slice(0, TOP_LIST_SIZE)

  /* ── Cluster Cohesion (avg density) ────── */
  let clusterCohesion = 0
  try {
    const co = computeCoOccurrences(liveNotes, 500)
    const clusters = detectClusters(
      co,
      titleToId,
      CLUSTER_MIN_SIZE,
      CLUSTER_MIN_DENSITY,
    )
    if (clusters.length > 0) {
      const sum = clusters.reduce((acc, c) => acc + c.density, 0)
      clusterCohesion = sum / clusters.length
    }
  } catch {
    clusterCohesion = 0
  }

  /* ── Promotion Candidates ────────────────
     Notes that have collected enough mass + incoming gravity to become wiki articles.
     Filters: noteType !== "wiki" already, has a real title, content is substantial,
     and at least PROMOTION_MIN_BACKLINKS notes are pointing in. Sorted by backlinks desc.
  */
  const promotionCandidates: PromotionCandidate[] = liveNotes
    .filter((n) => n.noteType !== "wiki")
    .filter((n) => (n.title?.trim().length ?? 0) > 0)
    .filter((n) => (n.content?.length ?? 0) >= PROMOTION_MIN_CONTENT_LENGTH)
    .map((n) => ({
      noteId: n.id,
      title: n.title || "Untitled",
      backlinks: lookupBacklinks(input.backlinksMap, n.id),
      contentLength: n.content?.length ?? 0,
    }))
    .filter((c) => c.backlinks >= PROMOTION_MIN_BACKLINKS)
    .sort((a, b) =>
      b.backlinks - a.backlinks || b.contentLength - a.contentLength,
    )
    .slice(0, PROMOTION_TOP_N)

  return {
    totalNotes,
    totalWiki,
    totalEdges,
    linkDensity,
    orphanRate,
    tagCoverage,
    clusterCohesion,
    topByWAR,
    topByConceptReach,
    topHubs,
    promotionCandidates,
  }
}
