/**
 * Time-series knowledge metrics — pure, deterministic.
 *
 * Buckets notes + wiki articles by createdAt and produces cumulative
 * counts per bucket. Edge counts are best-effort (we use the current
 * linksOut snapshot filtered by source.createdAt; we don't track when
 * individual links were added/removed).
 *
 * Caller wraps in useMemo. No DOM, no store reads.
 */

import type { Note, WikiArticle } from "@/lib/types"
import type { TimeSeriesPoint } from "./types"
import { isWikiStub } from "@/lib/wiki-utils"

export type BucketSize = "day" | "week" | "month"

export interface ComputeTimeSeriesInput {
  notes: Note[]
  wikiArticles: WikiArticle[]
  /** Bucket granularity. Default: "month". */
  bucketSize?: BucketSize
  /** Earliest bucket to include (ISO date). Default: oldest createdAt in data. */
  since?: string
  /** Latest bucket to include (ISO date / timestamp). Default: now. */
  until?: string | number
  /** Hard cap on number of buckets. Default: 24. */
  maxBuckets?: number
}

/* ── Bucket helpers ──────────────────────────────────── */

function bucketStart(ts: number, size: BucketSize): Date {
  const d = new Date(ts)
  if (size === "day") {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
  }
  if (size === "week") {
    // ISO-ish: Monday as week start. JS Sunday=0, Monday=1.
    const day = d.getDay()
    const diff = (day + 6) % 7 // 0 if Mon, 6 if Sun
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff)
  }
  // month
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function nextBucket(date: Date, size: BucketSize): Date {
  const d = new Date(date)
  if (size === "day") d.setDate(d.getDate() + 1)
  else if (size === "week") d.setDate(d.getDate() + 7)
  else d.setMonth(d.getMonth() + 1)
  return d
}

function bucketKey(date: Date): string {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

/* ── Main ────────────────────────────────────────────── */

export function computeWikiTimeSeries(
  input: ComputeTimeSeriesInput,
): TimeSeriesPoint[] {
  const bucketSize = input.bucketSize ?? "month"
  const maxBuckets = input.maxBuckets ?? 24
  const liveNotes = input.notes.filter((n) => !n.trashed)
  const liveWiki = input.wikiArticles.filter(
    (w) => !(w as { trashed?: boolean }).trashed,
  )

  // Collect all createdAt timestamps to find the natural since/until.
  const allTimestamps: number[] = []
  for (const n of liveNotes) {
    const t = Date.parse(n.createdAt)
    if (!Number.isNaN(t)) allTimestamps.push(t)
  }
  for (const w of liveWiki) {
    const t = Date.parse(w.createdAt)
    if (!Number.isNaN(t)) allTimestamps.push(t)
  }
  if (allTimestamps.length === 0) return []

  const naturalSince = Math.min(...allTimestamps)
  const naturalUntil =
    typeof input.until === "number"
      ? input.until
      : input.until
        ? Date.parse(input.until)
        : Date.now()

  const sinceTs = input.since
    ? Math.max(naturalSince, Date.parse(input.since))
    : naturalSince

  // Generate bucket boundaries from sinceTs → naturalUntil.
  const startDate = bucketStart(sinceTs, bucketSize)
  const endDate = bucketStart(naturalUntil, bucketSize)
  const buckets: Date[] = []
  let cur = startDate
  while (cur.getTime() <= endDate.getTime()) {
    buckets.push(cur)
    cur = nextBucket(cur, bucketSize)
    if (buckets.length > maxBuckets) break
  }
  if (buckets.length === 0) buckets.push(startDate)

  // Trim to most-recent maxBuckets if we capped.
  const finalBuckets =
    buckets.length > maxBuckets ? buckets.slice(buckets.length - maxBuckets) : buckets

  // Pre-sort entities by createdAt for cumulative scanning.
  const sortedNotes = liveNotes
    .map((n) => ({ note: n, t: Date.parse(n.createdAt) }))
    .filter((x) => !Number.isNaN(x.t))
    .sort((a, b) => a.t - b.t)
  const sortedWiki = liveWiki
    .map((w) => ({ wiki: w, t: Date.parse(w.createdAt) }))
    .filter((x) => !Number.isNaN(x.t))
    .sort((a, b) => a.t - b.t)

  // Walk buckets, accumulate.
  const points: TimeSeriesPoint[] = []
  let noteIdx = 0
  let wikiIdx = 0
  let cumNotes = 0
  let cumWiki = 0
  let cumEdges = 0
  let cumArticles = 0
  let cumStubs = 0
  let cumWikiEdges = 0

  for (let i = 0; i < finalBuckets.length; i++) {
    const bucketEnd = nextBucket(finalBuckets[i], bucketSize).getTime()
    let newNotes = 0
    let newWiki = 0
    let newArticles = 0
    let newStubs = 0

    while (noteIdx < sortedNotes.length && sortedNotes[noteIdx].t < bucketEnd) {
      const n = sortedNotes[noteIdx].note
      cumNotes++
      cumEdges += n.linksOut?.length ?? 0
      newNotes++
      noteIdx++
    }
    while (wikiIdx < sortedWiki.length && sortedWiki[wikiIdx].t < bucketEnd) {
      const w = sortedWiki[wikiIdx].wiki
      cumWiki++
      newWiki++
      // Article/stub split — current store state at compute time
      if (isWikiStub(w)) {
        cumStubs++
        newStubs++
      } else {
        cumArticles++
        newArticles++
        // Count wiki-to-wiki links (linksOut on WikiArticle)
        cumWikiEdges += w.linksOut?.length ?? 0
      }
      wikiIdx++
    }

    points.push({
      ts: bucketKey(finalBuckets[i]),
      totalNotes: cumNotes,
      totalWiki: cumWiki,
      newNotes,
      newWiki,
      totalEdges: cumEdges,
      totalArticles: cumArticles,
      totalStubs: cumStubs,
      newArticles,
      newStubs,
      totalWikiEdges: cumWikiEdges,
    })
  }

  return points
}
