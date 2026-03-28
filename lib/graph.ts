import type { Note, NoteStatus, Relation, RelationType } from "./types"

/* ── Ontology graph ──────────────────────────────── */

export type OntologyEdgeKind = RelationType | "wikilink" | "tag"

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
  nodeType: "note" | "wiki-article" | "tag"
  wikiStatus: "article" | null
  tagColor?: string  // only for tag nodes
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
  tags?: Array<{ id: string; name: string; color: string }>,
  wikiArticles?: Array<{ title: string; aliases: string[]; wikiStatus: "article"; noteIds?: string[] }>,
): OntologyGraphData {
  if (notes.length === 0) return { nodeData: [], edges: [], forceConfig: computeForceConfig(0) }

  // Build wiki title lookup from WikiArticle Assembly Model
  const wikiTitleSet = new Set<string>()
  const wikiStatusByTitle = new Map<string, "article">()
  // Also track by noteId (from note-ref blocks in WikiArticles)
  const wikiStatusByNoteId = new Map<string, "article">()
  if (wikiArticles) {
    for (const wa of wikiArticles) {
      const lower = wa.title.toLowerCase()
      wikiTitleSet.add(lower)
      wikiStatusByTitle.set(lower, wa.wikiStatus)
      for (const alias of wa.aliases) {
        const aliasLower = alias.toLowerCase()
        wikiTitleSet.add(aliasLower)
        wikiStatusByTitle.set(aliasLower, wa.wikiStatus)
      }
      // Index by referenced noteIds (note-ref blocks)
      if (wa.noteIds) {
        for (const noteId of wa.noteIds) {
          wikiStatusByNoteId.set(noteId, wa.wikiStatus)
        }
      }
    }
  }

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

  // 3. Connection counts (note-to-note edges only at this stage)
  const connectionCount = new Map<string, number>()
  for (const edge of edges) {
    connectionCount.set(edge.source, (connectionCount.get(edge.source) ?? 0) + 1)
    connectionCount.set(edge.target, (connectionCount.get(edge.target) ?? 0) + 1)
  }

  // 4. Build note node data (no x/y)
  const nodeData: Omit<OntologyNode, "x" | "y">[] = notes.map((n) => {
    let nodeType: OntologyNode["nodeType"]
    // Check WikiArticle Assembly Model first (new system)
    // Priority 1: note is directly referenced by a WikiArticle block (note-ref by noteId)
    const wikiStatusById = wikiStatusByNoteId.get(n.id)
    if (wikiStatusById) {
      nodeType = "wiki-article"
    }
    // Priority 2: note title/alias matches a WikiArticle title
    else {
      const noteTitleLower = n.title.toLowerCase()
      const wikiArticleStatus = wikiStatusByTitle.get(noteTitleLower)
      if (wikiArticleStatus) {
        nodeType = "wiki-article"
      }
      // Fallback to legacy Note.isWiki flag
      else if (n.isWiki && n.wikiStatus === "article") nodeType = "wiki-article"
      else nodeType = "note"
    }

    return {
      id: n.id,
      label: n.title || "Untitled",
      connectionCount: connectionCount.get(n.id) ?? 0,
      status: n.status,
      labelId: n.labelId,
      isWiki: !!n.isWiki || wikiTitleSet.has(n.title.toLowerCase()) || wikiStatusByNoteId.has(n.id),
      nodeType,
      wikiStatus: n.wikiStatus ?? null,
    }
  })

  // 5. Tag nodes — only tags used in 5+ notes
  if (tags && tags.length > 0) {
    const tagUsageCount = new Map<string, number>()
    const notesByTag = new Map<string, string[]>()

    for (const note of notes) {
      for (const tagId of note.tags) {
        tagUsageCount.set(tagId, (tagUsageCount.get(tagId) ?? 0) + 1)
        const arr = notesByTag.get(tagId) ?? []
        arr.push(note.id)
        notesByTag.set(tagId, arr)
      }
    }

    for (const tag of tags) {
      const usageCount = tagUsageCount.get(tag.id) ?? 0
      if (usageCount < 5) continue

      const tagNodeId = `tag:${tag.id}`
      const noteIds = notesByTag.get(tag.id) ?? []

      // Add tag node
      nodeData.push({
        id: tagNodeId,
        label: tag.name,
        connectionCount: noteIds.length,
        status: "permanent", // tag nodes use a default status
        labelId: null,
        isWiki: false,
        nodeType: "tag",
        wikiStatus: null,
        tagColor: tag.color,
      })

      // Add tag edges
      for (const noteId of noteIds) {
        edges.push({ source: tagNodeId, target: noteId, kind: "tag" })
      }
    }
  }

  const totalNodeCount = nodeData.length
  return { nodeData, edges, forceConfig: computeForceConfig(totalNodeCount) }
}
