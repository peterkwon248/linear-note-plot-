"use client"

import type { Note, CoOccurrence } from "./types"

/**
 * Compute concept co-occurrences across all notes.
 * For each note with 2+ wiki-links, generate all pairs
 * and track how many notes each pair co-occurs in.
 */
export function computeCoOccurrences(
  notes: Note[],
  maxItems: number = 500,
): CoOccurrence[] {
  const pairMap = new Map<string, { count: number; noteIds: string[] }>()

  for (const note of notes) {
    if (note.trashed) continue

    const links = note.linksOut
    if (links.length < 2) continue

    // Dedupe links within this note
    const unique = Array.from(new Set(links))

    // Generate all pairs with canonical key (sorted)
    for (let i = 0; i < unique.length; i++) {
      for (let j = i + 1; j < unique.length; j++) {
        const [a, b] = [unique[i], unique[j]].sort()
        const key = `${a}||${b}`

        const existing = pairMap.get(key)
        if (existing) {
          if (!existing.noteIds.includes(note.id)) {
            existing.count++
            existing.noteIds.push(note.id)
          }
        } else {
          pairMap.set(key, { count: 1, noteIds: [note.id] })
        }
      }
    }
  }

  // Convert to CoOccurrence array
  const result: CoOccurrence[] = []
  for (const [key, val] of pairMap) {
    const sep = key.indexOf("||")
    result.push({
      conceptA: key.slice(0, sep),
      conceptB: key.slice(sep + 2),
      count: val.count,
      noteIds: val.noteIds,
    })
  }

  // Sort by count descending
  result.sort((a, b) => b.count - a.count)
  return result.slice(0, maxItems)
}

/* ── Cluster Detection ────────────────────────────── */

export interface ClusterCandidate {
  concepts: string[]
  noteIds: string[]
  density: number
  totalWeight: number
}

/**
 * Detect dense subgraphs from co-occurrence data.
 * Uses greedy triangle-based clique expansion.
 */
export function detectClusters(
  coOccurrences: CoOccurrence[],
  titleToNoteId: Map<string, string>,
  minSize: number = 3,
  minDensity: number = 0.5,
): ClusterCandidate[] {
  // Build adjacency map: concept -> Set<concept>
  const adj = new Map<string, Map<string, number>>()

  const addEdge = (a: string, b: string, weight: number) => {
    if (!adj.has(a)) adj.set(a, new Map())
    if (!adj.has(b)) adj.set(b, new Map())
    adj.get(a)!.set(b, weight)
    adj.get(b)!.set(a, weight)
  }

  for (const co of coOccurrences) {
    addEdge(co.conceptA, co.conceptB, co.count)
  }

  // Find clusters via greedy expansion from high-degree nodes
  const concepts = Array.from(adj.keys())
  const used = new Set<string>() // track concepts already in a cluster
  const clusters: ClusterCandidate[] = []

  // Sort by degree descending (most connected first)
  concepts.sort((a, b) => (adj.get(b)?.size ?? 0) - (adj.get(a)?.size ?? 0))

  for (const seed of concepts) {
    if (used.has(seed)) continue
    const neighbors = adj.get(seed)
    if (!neighbors || neighbors.size < minSize - 1) continue

    // Start with seed, try to grow a dense cluster
    const cluster = new Set<string>([seed])

    // Candidates: neighbors sorted by connection weight
    const candidates = Array.from(neighbors.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([c]) => c)

    for (const candidate of candidates) {
      if (used.has(candidate)) continue

      // Check: candidate must be connected to at least half of current cluster members
      const candidateAdj = adj.get(candidate)
      if (!candidateAdj) continue

      let connections = 0
      for (const member of cluster) {
        if (candidateAdj.has(member)) connections++
      }

      if (connections >= cluster.size * minDensity) {
        cluster.add(candidate)
      }
    }

    if (cluster.size >= minSize) {
      // Calculate actual density
      const members = Array.from(cluster)
      let edges = 0
      let totalWeight = 0
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          const w = adj.get(members[i])?.get(members[j])
          if (w) {
            edges++
            totalWeight += w
          }
        }
      }
      const maxEdges = (members.length * (members.length - 1)) / 2
      const density = maxEdges > 0 ? edges / maxEdges : 0

      if (density >= minDensity) {
        // Collect noteIds from all co-occurrences involving cluster members
        const noteIdSet = new Set<string>()
        for (const co of coOccurrences) {
          if (cluster.has(co.conceptA) && cluster.has(co.conceptB)) {
            for (const nid of co.noteIds) noteIdSet.add(nid)
          }
        }
        // Also map concept titles to note IDs
        for (const concept of members) {
          const noteId = titleToNoteId.get(concept)
          if (noteId) noteIdSet.add(noteId)
        }

        clusters.push({
          concepts: members,
          noteIds: Array.from(noteIdSet),
          density,
          totalWeight,
        })
        for (const m of members) used.add(m)
      }
    }
  }

  // Sort by totalWeight descending
  clusters.sort((a, b) => b.totalWeight - a.totalWeight)

  return clusters
}
