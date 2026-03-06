import type { Note, KnowledgeMap } from "@/lib/types"
import { countBacklinks } from "@/lib/backlinks"

/* ── Inbox Rank ────────────────────────────────────────── */

/**
 * Compute inboxRank for an inbox note.
 * Higher = more urgent to triage.
 *
 * +10 if triageStatus="untriaged"
 * +2  if title length <= 12
 * +3  if body length <= 120 chars
 * +4  if links >= 1
 * +2  if tags >= 1
 * +5  if created within last 24h
 * +3  if snoozeCount >= 2
 */
export function computeInboxRank(note: Note, allNotes: Note[]): number {
  let score = 0
  if (note.triageStatus === "untriaged") score += 10
  if (note.title.length <= 12) score += 2
  if (note.content.length <= 120) score += 3
  const links = countBacklinks(note.id, allNotes)
  if (links >= 1) score += 4
  if (note.tags.length >= 1) score += 2
  const age = Date.now() - new Date(note.createdAt).getTime()
  if (age < 24 * 60 * 60 * 1000) score += 5
  if ((note.snoozeCount ?? 0) >= 2) score += 3
  return score
}

/* ── Capture Ready Score ───────────────────────────────── */

/**
 * Compute readyScore for capture notes.
 * Higher = more ready to promote to permanent.
 *
 * +2 if summary exists (>= 1 line)
 * +1 if tags >= 1
 * +2 if links >= 1
 * +2 if backlinks >= 1
 * +1 if outline headings >= 1
 * +1 if priority is "high"
 */
export function computeReadyScore(note: Note, allNotes: Note[]): number {
  let score = 0
  if (note.summary && note.summary.trim().length > 0) score += 2
  if (note.tags.length >= 1) score += 1
  const links = countBacklinks(note.id, allNotes)
  if (links >= 1) score += 2
  // Count notes this note references (forward links)
  const forwardLinks = allNotes.filter((other) => {
    if (other.id === note.id) return false
    const title = other.title.toLowerCase()
    if (!title.trim()) return false
    const content = note.content.toLowerCase()
    return content.includes(`[[${title}]]`) || (title.length > 3 && content.includes(title))
  }).length
  if (forwardLinks >= 1) score += 2
  // Outline headings
  const headingCount = (note.content.match(/^#{1,6}\s+.+/gm) || []).length
  if (headingCount >= 1) score += 1
  if (note.priority === "high") score += 1
  return score
}

/** Whether a capture note is ready for promotion */
export function isReadyToPromote(note: Note, allNotes: Note[]): boolean {
  if (note.status !== "capture") return false
  const score = computeReadyScore(note, allNotes)
  if (score >= 5) return true
  // Alternative: links >= 2 AND summary exists
  const links = countBacklinks(note.id, allNotes)
  return links >= 2 && !!note.summary && note.summary.trim().length > 0
}

/* ── Stale Capture Detection ──────────────────────────── */

const DAY_MS = 24 * 60 * 60 * 1000

/** Check if a capture note needs review (7+ days untouched) */
export function needsReview(note: Note): boolean {
  if (note.status !== "capture") return false
  const touched = new Date(note.lastTouchedAt ?? note.updatedAt).getTime()
  return Date.now() - touched > 7 * DAY_MS
}

/** Check if a capture note is stale enough to suggest moving back to inbox (14+ days) */
export function isStaleSuggest(note: Note): boolean {
  if (note.status !== "capture") return false
  const touched = new Date(note.lastTouchedAt ?? note.updatedAt).getTime()
  return Date.now() - touched > 14 * DAY_MS
}

/* ── Inbox query ──────────────────────────────────────── */

/**
 * Get inbox notes sorted by inboxRank desc, then createdAt desc.
 * Only shows untriaged or snoozed-that-are-due.
 */
export function getInboxNotes(allNotes: Note[]): Note[] {
  const nowMs = Date.now()
  return allNotes
    .filter((n) => {
      if (n.status !== "inbox") return false
      if (n.triageStatus === "trashed") return false
      if (n.triageStatus === "untriaged") return true
      if (n.triageStatus === "snoozed" && n.reviewAt && new Date(n.reviewAt).getTime() <= nowMs) return true
      return false
    })
    .map((n) => ({ ...n, inboxRank: computeInboxRank(n, allNotes) }))
    .sort((a, b) => {
      if (b.inboxRank !== a.inboxRank) return b.inboxRank - a.inboxRank
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
}

/* ── Capture query ────────────────────────────────────── */

export function getCaptureNotes(allNotes: Note[]): Note[] {
  return allNotes
    .filter((n) => n.status === "capture" && n.triageStatus !== "trashed")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

/* ── Permanent query ──────────────────────────────────── */

export function getPermanentNotes(allNotes: Note[]): Note[] {
  return allNotes
    .filter((n) => n.status === "permanent" && n.triageStatus !== "trashed")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

/* ── Unlinked cleanup query ───────────────────────────── */

/**
 * Get unlinked notes for cleanup, with the specified priority order:
 * 1. status=permanent with links=0
 * 2. status=capture with links=0
 * 3. status=inbox untriaged
 */
export function getUnlinkedNotes(allNotes: Note[]): Note[] {
  const permanentUnlinked = allNotes.filter(
    (n) => n.status === "permanent" && countBacklinks(n.id, allNotes) === 0 && n.triageStatus !== "trashed"
  )
  const captureUnlinked = allNotes.filter(
    (n) => n.status === "capture" && countBacklinks(n.id, allNotes) === 0 && n.triageStatus !== "trashed"
  )
  const inboxUntriaged = allNotes.filter(
    (n) => n.status === "inbox" && n.triageStatus === "untriaged"
  )
  return [...permanentUnlinked, ...captureUnlinked, ...inboxUntriaged]
}

/* ── Daily Review Queue ──────────────────────────────── */

export type ReviewReason = "inbox-untriaged" | "snoozed-due" | "stale-capture" | "unlinked-permanent"

export interface ReviewItem {
  note: Note
  reason: ReviewReason
}

/**
 * Aggregates notes requiring attention, prioritized:
 * 1. Inbox untriaged
 * 2. Snoozed notes that are due
 * 3. Stale capture (7+ days untouched)
 * 4. Unlinked permanent notes
 */
export function getReviewQueue(allNotes: Note[]): ReviewItem[] {
  const nowMs = Date.now()
  const items: ReviewItem[] = []

  // 1. Inbox untriaged
  allNotes
    .filter((n) => n.status === "inbox" && n.triageStatus === "untriaged")
    .forEach((note) => items.push({ note, reason: "inbox-untriaged" }))

  // 2. Snoozed due
  allNotes
    .filter(
      (n) =>
        n.status === "inbox" &&
        n.triageStatus === "snoozed" &&
        n.reviewAt &&
        new Date(n.reviewAt).getTime() <= nowMs
    )
    .forEach((note) => items.push({ note, reason: "snoozed-due" }))

  // 3. Stale capture (7+ days)
  allNotes
    .filter((n) => n.status === "capture" && n.triageStatus !== "trashed" && needsReview(n))
    .forEach((note) => items.push({ note, reason: "stale-capture" }))

  // 4. Unlinked permanent
  allNotes
    .filter(
      (n) =>
        n.status === "permanent" &&
        n.triageStatus !== "trashed" &&
        countBacklinks(n.id, allNotes) === 0
    )
    .forEach((note) => items.push({ note, reason: "unlinked-permanent" }))

  return items
}

/* ── Link Suggestion (editor) ───────────────────────── */

/**
 * Suggest notes whose titles match text being typed.
 * Returns top 5 matches, excluding the current note.
 */
export function suggestLinks(
  text: string,
  allNotes: Note[],
  currentNoteId: string
): Note[] {
  if (!text.trim() || text.trim().length < 2) return []

  const query = text.trim().toLowerCase()

  return allNotes
    .filter((n) => {
      if (n.id === currentNoteId) return false
      if (!n.title.trim()) return false
      return n.title.toLowerCase().includes(query)
    })
    .sort((a, b) => {
      // Exact start match first
      const aStarts = a.title.toLowerCase().startsWith(query) ? 0 : 1
      const bStarts = b.title.toLowerCase().startsWith(query) ? 0 : 1
      if (aStarts !== bStarts) return aStarts - bStarts
      return a.title.length - b.title.length
    })
    .slice(0, 5)
}

/* ── Snooze time helpers ──────────────────────────────── */

export function getSnoozeTime(option: "3h" | "tomorrow" | "next-week"): string {
  const d = new Date()
  switch (option) {
    case "3h":
      d.setHours(d.getHours() + 3)
      return d.toISOString()
    case "tomorrow":
      d.setDate(d.getDate() + 1)
      d.setHours(10, 0, 0, 0)
      return d.toISOString()
    case "next-week":
      d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7))
      d.setHours(10, 0, 0, 0)
      return d.toISOString()
  }
}

/* ── Knowledge Map queries ───────────────────────────── */

/**
 * Get map statistics for a Knowledge Map.
 */
export function getMapStats(map: KnowledgeMap, allNotes: Note[]) {
  const mapNotes = allNotes.filter((n) => map.noteIds.includes(n.id))
  const totalLinks = mapNotes.reduce((sum, n) => sum + countBacklinks(n.id, allNotes), 0)
  const internalLinks = mapNotes.reduce((sum, n) => {
    const noteBacklinks = allNotes.filter((other) => {
      if (!map.noteIds.includes(other.id)) return false
      if (other.id === n.id) return false
      const title = n.title.toLowerCase()
      if (!title.trim()) return false
      const content = other.content.toLowerCase()
      return content.includes(`[[${title}]]`)
    })
    return sum + noteBacklinks.length
  }, 0)
  const unlinkedCount = mapNotes.filter((n) => countBacklinks(n.id, allNotes) === 0).length
  const avgReads = mapNotes.length > 0 ? Math.round(mapNotes.reduce((s, n) => s + n.reads, 0) / mapNotes.length) : 0

  return {
    noteCount: mapNotes.length,
    totalLinks,
    internalLinks,
    unlinkedCount,
    avgReads,
    stages: {
      inbox: mapNotes.filter((n) => n.status === "inbox").length,
      capture: mapNotes.filter((n) => n.status === "capture").length,
      permanent: mapNotes.filter((n) => n.status === "permanent").length,
    },
  }
}

/**
 * Get notes in a map that need attention:
 * - Unlinked within the map
 * - Stale (not touched in 7+ days)
 */
export function getMapReviewItems(map: KnowledgeMap, allNotes: Note[]): ReviewItem[] {
  const items: ReviewItem[] = []
  const mapNotes = allNotes.filter((n) => map.noteIds.includes(n.id))

  for (const note of mapNotes) {
    if (needsReview(note)) {
      items.push({ note, reason: "stale-capture" })
    }
    if (note.status === "permanent" && countBacklinks(note.id, allNotes) === 0) {
      items.push({ note, reason: "unlinked-permanent" })
    }
  }

  return items
}
