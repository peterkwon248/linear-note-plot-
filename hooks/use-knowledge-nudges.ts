"use client"

import { useMemo } from "react"
import { toast } from "sonner"
import { usePlotStore } from "@/lib/store"
import { setActiveRoute } from "@/lib/table-route"
import { detectUnlinkedMentions } from "@/lib/unlinked-mentions"
import { useKnowledgeMetrics } from "./use-knowledge-metrics"
import type { Note } from "@/lib/types"

/**
 * Knowledge nudges — actionable maintenance suggestions for the graph.
 *
 * Categories:
 *   - "orphan"     — note with no incoming/outgoing links
 *   - "promote"    — note dense + linked enough to graduate to a wiki article
 *   - "unlinked"   — recent note mentions another note without a [[wiki-link]]
 *   - "linked"     — note received a fresh backlink in the last 7 days
 *
 * Two surfaces consume this:
 *   1. Home (legacy / removed PR8) — used to show 1-3 daily-rotated nudges
 *   2. Ontology > Insights (current) — shows the top N nudges as a maintenance list
 *
 * The hook returns the *full* candidate pool (capped per-kind) so each surface
 * can pick its own slice. No UI here — pure data + onClick wiring.
 */

export type NudgeKind = "orphan" | "promote" | "unlinked" | "linked"

export interface NudgeCard {
  id: string
  kind: NudgeKind
  /** Primary line — what the user should know. */
  message: string
  /** Secondary line — context (target title, source note, etc). */
  detail: string
  /** Action label (Connect, Promote, Link, View). */
  cta: string
  onClick: () => void
}

/** Per-kind cap so a single category can't dominate the list. */
const CAP_PER_KIND = 3

export function useKnowledgeNudges(): NudgeCard[] {
  const notes = usePlotStore((s) => s.notes)
  const openNote = usePlotStore((s) => s.openNote)
  const metrics = useKnowledgeMetrics()

  return useMemo<NudgeCard[]>(() => {
    const nonTrashed = notes.filter((n) => !n.trashed)
    const out: NudgeCard[] = []

    /* ── 1. ORPHAN ──
       Notes with linksOut.length === 0 AND no incoming links.
       Recent first — fresh memory = easier to action. */
    const incomingSet = new Set<string>()
    for (const n of nonTrashed) {
      for (const link of n.linksOut) {
        const target = nonTrashed.find(
          (t) => t.title.toLowerCase() === link.toLowerCase(),
        )
        if (target) incomingSet.add(target.id)
      }
    }
    const orphans = nonTrashed
      .filter((n) => n.linksOut.length === 0 && !incomingSet.has(n.id) && n.title.trim())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, CAP_PER_KIND)
    for (const pick of orphans) {
      out.push({
        id: `orphan:${pick.id}`,
        kind: "orphan",
        message: pick.title || "Untitled",
        detail: "Not connected to anything yet",
        cta: "Connect",
        onClick: () => {
          setActiveRoute("/notes")
          openNote(pick.id)
          // Auto-open Connections tab on the side panel.
          const store = usePlotStore.getState()
          store.setSidePanelOpen(true)
          usePlotStore.setState({ sidePanelMode: "connections" })
        },
      })
    }

    /* ── 2. PROMOTE ──
       Notes that look ready to graduate into a wiki article.
       Computed in metrics.ts (backlinks >= 3, content length >= 200, !wiki). */
    for (const candidate of metrics.promotionCandidates.slice(0, CAP_PER_KIND)) {
      out.push({
        id: `promote:${candidate.noteId}`,
        kind: "promote",
        message: candidate.title,
        detail: `Referenced by ${candidate.backlinks} note${candidate.backlinks === 1 ? "" : "s"} — promote to wiki?`,
        cta: "Promote",
        onClick: () => {
          // Route to /notes and open the note. Promotion confirmation
          // is handled at the call-site (caller wraps with an AlertDialog).
          setActiveRoute("/notes")
          openNote(candidate.noteId)
        },
      })
    }

    /* ── 3. UNLINKED MENTION ──
       Scan the most-recently updated notes; surface the first hit per source. */
    const recent10 = [...nonTrashed]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 10)
    type Hit = { sourceId: string; sourceTitle: string; targetId: string; targetTitle: string }
    const hits: Hit[] = []
    for (const note of recent10) {
      const mentions = detectUnlinkedMentions(note.id, nonTrashed)
      for (const m of mentions) {
        hits.push({
          sourceId: note.id,
          sourceTitle: note.title || "Untitled",
          targetId: m.noteId,
          targetTitle: m.title,
        })
      }
    }
    for (const hit of hits.slice(0, CAP_PER_KIND)) {
      out.push({
        id: `unlinked:${hit.sourceId}:${hit.targetId}`,
        kind: "unlinked",
        message: `"${hit.targetTitle}" mentioned in ${hit.sourceTitle}`,
        detail: "Add a wiki-link",
        cta: "Link",
        onClick: () => {
          // Append [[Target]] to source content; updateNote re-extracts linksOut.
          const store = usePlotStore.getState()
          const source = (store.notes as Note[]).find((n: Note) => n.id === hit.sourceId)
          if (source) {
            const newContent = (source.content || "") + `\n[[${hit.targetTitle}]]`
            store.updateNote(source.id, { content: newContent })
            toast.success(`Linked to "${hit.targetTitle}"`)
          }
          setActiveRoute("/notes")
          openNote(hit.sourceId)
        },
      })
    }

    /* ── 4. RECENT LINKED ──
       A note gained a fresh backlink within the last 7 days. */
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    type LinkedCandidate = {
      targetId: string
      targetTitle: string
      sourceId: string
      sourceTitle: string
      ts: number
    }
    const linkedCandidates: LinkedCandidate[] = []
    for (const source of nonTrashed) {
      const sourceTs = new Date(source.updatedAt).getTime()
      if (sourceTs < sevenDaysAgo) continue
      for (const link of source.linksOut) {
        const target = nonTrashed.find(
          (t) => t.id !== source.id && t.title.toLowerCase() === link.toLowerCase(),
        )
        if (!target) continue
        linkedCandidates.push({
          targetId: target.id,
          targetTitle: target.title || "Untitled",
          sourceId: source.id,
          sourceTitle: source.title || "Untitled",
          ts: sourceTs,
        })
      }
    }
    linkedCandidates.sort((a, b) => b.ts - a.ts)
    for (const pick of linkedCandidates.slice(0, CAP_PER_KIND)) {
      out.push({
        id: `linked:${pick.targetId}:${pick.sourceId}`,
        kind: "linked",
        message: `${pick.targetTitle} just got a new backlink`,
        detail: `from ${pick.sourceTitle}`,
        cta: "View",
        onClick: () => {
          setActiveRoute("/notes")
          openNote(pick.targetId)
        },
      })
    }

    return out
  }, [notes, openNote, metrics.promotionCandidates])
}
