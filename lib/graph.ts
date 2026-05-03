import type { Note, NoteStatus, Relation, RelationType, Sticker } from "./types"
import { buildStickerMemberIndex, getStickerIdsFor } from "./stickers"
import { FORCE_CONFIG, SIM_CONFIG, classifyTier, TAG_NODE_MIN_USAGE } from "./graph/ontology-graph-config"

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
  nodeType: "note" | "wiki" | "tag"
  tagColor?: string  // only for tag nodes
  // Group-by membership fields. Used to compute graph hulls based on
  // user-defined groupings (Display popover → Group by).
  // - tags: noteId or wikiId tags (for "Group by Tag" — unified)
  // - folderIds: noteId or wikiId folder ids (for "Group by Folder" — unified, v107 N:M)
  // - categoryIds: wiki article categoryIds (for "Group by Category" — wiki only)
  // - stickerIds: cross-entity sticker membership (for "Group by Sticker" — unified)
  tags?: string[]
  folderIds?: string[]
  categoryIds?: string[]
  stickerIds?: string[]
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
  // Phase 2 additions — config-driven tuning. Optional for back-compat
  // until worker/client also adopt them.
  linkStrength?: number
  centerStrength?: number
  distanceMax?: number
  collisionPadding?: number
}

export interface OntologyGraphData {
  nodeData: Omit<OntologyNode, "x" | "y">[]
  edges: OntologyEdge[]
  forceConfig: ForceConfig
}

/**
 * Compute force simulation parameters based on node count.
 *
 * All values come from `lib/graph/ontology-graph-config.ts` — see that file
 * for source citations (Obsidian / d3-force / vasturiano defaults).
 */
export function computeForceConfig(nodeCount: number): ForceConfig {
  const tier = classifyTier(nodeCount)
  const f = FORCE_CONFIG[tier]
  // collisionRadius derived from average expected node size + collisionPadding.
  // Worker still uses a single number, so we approximate with NODE_SIZE.max + pad.
  const approxNodeR = 10 + f.collisionPadding * 2 // Phase-2 calibration target
  return {
    chargeStrength: f.chargeStrength,
    linkDistance: f.linkDistance,
    collisionRadius: approxNodeR,
    ticks: SIM_CONFIG.warmupTicks,
    linkStrength: f.linkStrength,
    centerStrength: f.centerStrength,
    distanceMax: f.distanceMax,
    collisionPadding: f.collisionPadding,
  }
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
  wikiArticles?: Array<{
    id: string
    title: string
    aliases: string[]
    parentArticleId?: string | null
    noteIds?: string[]
    // Group-by source fields (mirror WikiArticle). Optional so existing
    // call sites that pass minimal data still compile. `stickerIds` is
    // derived from `stickers` (옵션 D2 reverse lookup), not passed here.
    tags?: string[]
    categoryIds?: string[]
    folderIds?: string[]
  }>,
  stickers?: Sticker[],
): OntologyGraphData {
  // Reverse-lookup index for sticker membership (옵션 D2). Built once
  // here and queried per-node below. Empty when `stickers` is omitted.
  const stickerIndex = stickers && stickers.length > 0
    ? buildStickerMemberIndex(stickers)
    : new Map<string, Sticker[]>()
  if (notes.length === 0) return { nodeData: [], edges: [], forceConfig: computeForceConfig(0) }

  // Build wiki title lookup from WikiArticle Assembly Model
  const wikiTitleSet = new Set<string>()
  // Also track by noteId (from note-ref blocks in WikiArticles)
  const wikiNoteIdSet = new Set<string>()
  if (wikiArticles) {
    for (const wa of wikiArticles) {
      const lower = wa.title.toLowerCase()
      wikiTitleSet.add(lower)
      for (const alias of wa.aliases) {
        wikiTitleSet.add(alias.toLowerCase())
      }
      // Index by referenced noteIds (note-ref blocks)
      if (wa.noteIds) {
        for (const noteId of wa.noteIds) {
          wikiNoteIdSet.add(noteId)
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
    const isWiki = n.noteType === "wiki" || wikiTitleSet.has(n.title.toLowerCase()) || wikiNoteIdSet.has(n.id)
    const nodeType: OntologyNode["nodeType"] = isWiki ? "wiki" : "note"

    return {
      id: n.id,
      label: n.title || "Untitled",
      connectionCount: connectionCount.get(n.id) ?? 0,
      status: n.status,
      labelId: n.labelId,
      isWiki,
      nodeType,
      tags: n.tags,
      folderIds: n.folderIds,
      stickerIds: getStickerIdsFor(stickerIndex, "note", n.id),
    }
  })

  // 5. Tag nodes — only tags used in TAG_NODE_MIN_USAGE+ notes
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
      if (usageCount < TAG_NODE_MIN_USAGE) continue

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
        tagColor: tag.color,
      })

      // Add tag edges
      for (const noteId of noteIds) {
        edges.push({ source: tagNodeId, target: noteId, kind: "tag" })
      }
    }
  }

  // 6. Wiki Article nodes (separate entity — Assembly Model)
  //    - parent → child article edges (hierarchy)
  //    - article → note edges (note-ref blocks)
  if (wikiArticles && wikiArticles.length > 0) {
    const wikiIdSet = new Set(wikiArticles.map((w) => w.id))
    const wikiConnCount = new Map<string, number>()

    // Add wiki nodes (placeholder count — recomputed below)
    for (const wa of wikiArticles) {
      nodeData.push({
        id: `wiki:${wa.id}`,
        label: wa.title || "Untitled",
        connectionCount: 0,
        status: "permanent",
        labelId: null,
        isWiki: true,
        nodeType: "wiki",
        tags: wa.tags,
        folderIds: wa.folderIds ?? [],
        categoryIds: wa.categoryIds,
        stickerIds: getStickerIdsFor(stickerIndex, "wiki", wa.id),
      })
    }

    // Parent-child edges (wiki hierarchy)
    for (const wa of wikiArticles) {
      if (wa.parentArticleId && wikiIdSet.has(wa.parentArticleId)) {
        const src = `wiki:${wa.parentArticleId}`
        const tgt = `wiki:${wa.id}`
        edges.push({ source: src, target: tgt, kind: "wikilink" })
        wikiConnCount.set(src, (wikiConnCount.get(src) ?? 0) + 1)
        wikiConnCount.set(tgt, (wikiConnCount.get(tgt) ?? 0) + 1)
      }
    }

    // Article → Note edges (note-ref blocks linking to actual notes)
    for (const wa of wikiArticles) {
      if (!wa.noteIds) continue
      const seenNotes = new Set<string>()
      for (const nId of wa.noteIds) {
        if (seenNotes.has(nId) || !noteIdSet.has(nId)) continue
        seenNotes.add(nId)
        const src = `wiki:${wa.id}`
        edges.push({ source: src, target: nId, kind: "wikilink" })
        wikiConnCount.set(src, (wikiConnCount.get(src) ?? 0) + 1)
      }
    }

    // Update connectionCount on wiki nodes
    for (const node of nodeData) {
      if (node.nodeType === "wiki" && node.id.startsWith("wiki:")) {
        node.connectionCount = wikiConnCount.get(node.id) ?? 0
      }
    }
  }

  const totalNodeCount = nodeData.length
  return { nodeData, edges, forceConfig: computeForceConfig(totalNodeCount) }
}
