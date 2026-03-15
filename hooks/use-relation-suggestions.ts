"use client"

import { useEffect, useRef } from "react"
import { usePlotStore } from "@/lib/store"
import type { RelationType, Note } from "@/lib/types"

function inferRelationType(
  noteA: Note | undefined,
  noteB: Note | undefined,
): { type: RelationType; reason: string; sourceId?: string; targetId?: string } {
  if (!noteA || !noteB) return { type: "related-to", reason: "Co-occurrence" }

  // Check if one note links to the other (directional)
  const aLinksB = noteA.linksOut?.includes(noteB.title.toLowerCase()) ?? false
  const bLinksA = noteB.linksOut?.includes(noteA.title.toLowerCase()) ?? false

  // Same tags → extends (builds on similar concepts)
  const sharedTags = noteA.tags.filter((t) => noteB.tags.includes(t))
  if (sharedTags.length >= 2) {
    return { type: "extends", reason: `${sharedTags.length} shared tags` }
  }

  // One-directional link → depends-on (keep directionality: source references target)
  if (aLinksB && !bLinksA) {
    return { type: "depends-on", reason: "A references B", sourceId: noteA.id, targetId: noteB.id }
  }
  if (bLinksA && !aLinksB) {
    return { type: "depends-on", reason: "B references A", sourceId: noteB.id, targetId: noteA.id }
  }

  // Same folder → related-to (default but with better reason)
  if (noteA.folderId && noteA.folderId === noteB.folderId) {
    return { type: "related-to", reason: "Same folder" }
  }

  // Default
  return { type: "related-to", reason: "Co-occurrence" }
}

/**
 * Watches co-occurrences and auto-generates RelationSuggestions
 * for concept pairs that co-occur in 2+ notes.
 * Mount once in app layout (after useCoOccurrences).
 */
export function useRelationSuggestions() {
  const coOccurrences = usePlotStore((s) => s.coOccurrences)
  const notes = usePlotStore((s) => s.notes)
  const relations = usePlotStore((s) => s.relations)
  const relationSuggestions = usePlotStore((s) => s.relationSuggestions)
  const addRelationSuggestion = usePlotStore((s) => s.addRelationSuggestion)
  const prevCoOccRef = useRef(coOccurrences)

  useEffect(() => {
    // Only run when coOccurrences actually change (reference check)
    if (prevCoOccRef.current === coOccurrences) return
    prevCoOccRef.current = coOccurrences

    if (coOccurrences.length === 0) return

    // Threshold: only pairs co-occurring in 2+ notes
    const candidates = coOccurrences.filter((c) => c.count >= 2)
    if (candidates.length === 0) return

    // Build set of existing relation pairs + already-suggested pairs
    const existingPairs = new Set<string>()
    for (const r of relations ?? []) {
      existingPairs.add(canonicalPair(r.sourceNoteId, r.targetNoteId))
    }
    for (const s of relationSuggestions ?? []) {
      existingPairs.add(canonicalPair(s.sourceNoteId, s.targetNoteId))
    }

    // Build title→noteId lookup (lowercased, active notes only)
    const titleToNote = new Map<string, string>()
    for (const note of notes) {
      if (note.archived || note.trashed) continue
      if (note.title.trim()) {
        titleToNote.set(note.title.toLowerCase(), note.id)
      }
    }

    // Generate suggestions for top candidates (max 10 per cycle)
    let added = 0
    for (const co of candidates) {
      if (added >= 10) break

      const noteAId = titleToNote.get(co.conceptA)
      const noteBId = titleToNote.get(co.conceptB)
      if (!noteAId || !noteBId) continue

      const pair = canonicalPair(noteAId, noteBId)
      if (existingPairs.has(pair)) continue

      const noteA = notes.find((n) => n.id === noteAId)
      const noteB = notes.find((n) => n.id === noteBId)
      const { type, reason, sourceId, targetId } = inferRelationType(noteA, noteB)

      addRelationSuggestion({
        sourceNoteId: sourceId ?? noteAId,
        targetNoteId: targetId ?? noteBId,
        suggestedType: type,
        coOccurrenceCount: co.count,
        reason: `${reason} (${co.count} co-occurrences)`,
      })
      existingPairs.add(pair)
      added++
    }
  }, [coOccurrences, notes, relations, relationSuggestions, addRelationSuggestion])
}

function canonicalPair(a: string, b: string): string {
  return [a, b].sort().join("||")
}
