import type { Note, NoteStatus, Relation, RelationType } from "./types"

/* ── Ontology graph ──────────────────────────────── */

export type OntologyEdgeKind = RelationType | "wikilink"

export interface OntologyEdge {
  source: string
  target: string
  kind: OntologyEdgeKind
}

export interface OntologyNode {
  id: string
  label: string
  x: number
  y: number
  connectionCount: number
  status: NoteStatus
  labelId: string | null
  isWiki: boolean
}

export interface OntologyGraph {
  nodes: OntologyNode[]
  edges: OntologyEdge[]
}

/* ── Ontology graph data (no layout) ─────────────── */

export interface ForceConfig {
  chargeStrength: number
  linkDistance: number
  collisionRadius: number
  ticks: number
}

export interface OntologyGraphData {
  nodeData: Omit<OntologyNode, "x" | "y">[]
  edges: OntologyEdge[]
  forceConfig: ForceConfig
}

/**
 * Compute force simulation parameters based on node count.
 */
export function computeForceConfig(nodeCount: number): ForceConfig {
  const chargeStrength = nodeCount > 100 ? -80 : nodeCount > 30 ? -120 : nodeCount > 15 ? -180 : -250
  const linkDistance = nodeCount > 100 ? 40 : nodeCount > 30 ? 50 : nodeCount > 15 ? 60 : 80
  const collisionRadius = nodeCount > 30 ? 20 : nodeCount > 15 ? 25 : 30
  const ticks = Math.max(120, Math.min(300, nodeCount * 4))
  return { chargeStrength, linkDistance, collisionRadius, ticks }
}

/**
 * Build ontology graph data without computing layout positions.
 * Returns node data (without x/y), edges, and force config.
 * Positions are computed separately via Web Worker or main thread.
 */
export function buildOntologyGraphData(
  notes: Note[],
  relations: Relation[],
): OntologyGraphData {
  if (notes.length === 0) return { nodeData: [], edges: [], forceConfig: computeForceConfig(0) }

  const noteIdSet = new Set(notes.map((n) => n.id))
  const edgePairSet = new Set<string>()
  const edges: OntologyEdge[] = []

  // 1. Relation edges
  for (const rel of relations) {
    if (!noteIdSet.has(rel.sourceNoteId) || !noteIdSet.has(rel.targetNoteId)) continue
    const key = [rel.sourceNoteId, rel.targetNoteId].sort().join("-")
    edgePairSet.add(key)
    edges.push({ source: rel.sourceNoteId, target: rel.targetNoteId, kind: rel.type })
  }

  // 2. Wiki-link edges
  const titleToId = new Map<string, string>()
  for (const note of notes) {
    if (note.title.trim()) titleToId.set(note.title.toLowerCase(), note.id)
    if (note.aliases) {
      for (const alias of note.aliases) {
        const aliasLower = alias.toLowerCase()
        if (!titleToId.has(aliasLower)) titleToId.set(aliasLower, note.id)
      }
    }
  }

  for (const note of notes) {
    for (const linkTitle of note.linksOut) {
      const targetId = titleToId.get(linkTitle)
      if (!targetId || targetId === note.id || !noteIdSet.has(targetId)) continue
      const key = [note.id, targetId].sort().join("-")
      if (edgePairSet.has(key)) continue
      edgePairSet.add(key)
      edges.push({ source: note.id, target: targetId, kind: "wikilink" })
    }
  }

  // 3. Connection counts
  const connectionCount = new Map<string, number>()
  for (const edge of edges) {
    connectionCount.set(edge.source, (connectionCount.get(edge.source) ?? 0) + 1)
    connectionCount.set(edge.target, (connectionCount.get(edge.target) ?? 0) + 1)
  }

  // 4. Build node data (no x/y)
  const nodeData: Omit<OntologyNode, "x" | "y">[] = notes.map((n) => ({
    id: n.id,
    label: n.title || "Untitled",
    connectionCount: connectionCount.get(n.id) ?? 0,
    status: n.status,
    labelId: n.labelId,
    isWiki: !!n.isWiki,
  }))

  return { nodeData, edges, forceConfig: computeForceConfig(notes.length) }
}
