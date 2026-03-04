import type { Note } from "./types"
import { extractWikiLinks } from "./backlinks"

export interface GraphNode {
  id: string
  label: string
  x: number
  y: number
  isCenter: boolean
  depth: number
}

export interface GraphEdge {
  from: string
  to: string
}

/**
 * Build adjacency list from wiki-links only (not title mentions).
 * Returns Map<noteId, Set<noteId>> (bidirectional).
 */
export function buildAdjacencyList(notes: Note[]): Map<string, Set<string>> {
  const titleToId = new Map<string, string>()
  for (const note of notes) {
    if (note.title.trim()) {
      titleToId.set(note.title.toLowerCase(), note.id)
    }
  }

  const adj = new Map<string, Set<string>>()
  for (const note of notes) {
    if (!adj.has(note.id)) adj.set(note.id, new Set())
    const links = extractWikiLinks(note.content)
    for (const linkTitle of links) {
      const targetId = titleToId.get(linkTitle.toLowerCase())
      if (targetId && targetId !== note.id) {
        adj.get(note.id)!.add(targetId)
        if (!adj.has(targetId)) adj.set(targetId, new Set())
        adj.get(targetId)!.add(note.id)
      }
    }
  }

  return adj
}

/**
 * BFS from a center note up to `depth` hops.
 * Returns Set of noteIds within range.
 */
export function bfsNeighbors(
  centerId: string,
  adj: Map<string, Set<string>>,
  depth: number
): Set<string> {
  const visited = new Set<string>([centerId])
  let frontier = [centerId]

  for (let d = 0; d < depth; d++) {
    const nextFrontier: string[] = []
    for (const nodeId of frontier) {
      const neighbors = adj.get(nodeId)
      if (!neighbors) continue
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor)
          nextFrontier.push(neighbor)
        }
      }
    }
    frontier = nextFrontier
    if (frontier.length === 0) break
  }

  return visited
}

/**
 * Build a focus graph: only nodes within `depth` hops of center,
 * with radial layout.
 */
export function buildFocusGraph(
  centerId: string,
  notes: Note[],
  depth: number
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const adj = buildAdjacencyList(notes)
  const reachable = bfsNeighbors(centerId, adj, depth)

  const noteMap = new Map(notes.map((n) => [n.id, n]))
  const centerNote = noteMap.get(centerId)
  if (!centerNote) return { nodes: [], edges: [] }

  // BFS again to get depth info
  const depthMap = new Map<string, number>([[centerId, 0]])
  {
    let frontier = [centerId]
    for (let d = 0; d < depth; d++) {
      const next: string[] = []
      for (const nid of frontier) {
        const neighbors = adj.get(nid)
        if (!neighbors) continue
        for (const neighbor of neighbors) {
          if (!depthMap.has(neighbor) && reachable.has(neighbor)) {
            depthMap.set(neighbor, d + 1)
            next.push(neighbor)
          }
        }
      }
      frontier = next
    }
  }

  const cx = 200
  const cy = 150
  const ringRadius = 65

  const nodes: GraphNode[] = []
  const nodeIds = Array.from(reachable)

  // Group by depth
  const byDepth = new Map<number, string[]>()
  for (const nid of nodeIds) {
    const d = depthMap.get(nid) ?? 0
    if (!byDepth.has(d)) byDepth.set(d, [])
    byDepth.get(d)!.push(nid)
  }

  for (const [d, ids] of byDepth) {
    if (d === 0) {
      const n = noteMap.get(ids[0])
      nodes.push({
        id: ids[0],
        label: n?.title || "Untitled",
        x: cx,
        y: cy,
        isCenter: true,
        depth: 0,
      })
    } else {
      ids.forEach((nid, i) => {
        const angle = (2 * Math.PI * i) / ids.length - Math.PI / 2
        const r = ringRadius * d
        const n = noteMap.get(nid)
        nodes.push({
          id: nid,
          label: n?.title || "Untitled",
          x: cx + r * Math.cos(angle),
          y: cy + r * Math.sin(angle),
          isCenter: false,
          depth: d,
        })
      })
    }
  }

  // Edges: only between reachable nodes
  const edges: GraphEdge[] = []
  const edgeSet = new Set<string>()
  for (const nid of reachable) {
    const neighbors = adj.get(nid)
    if (!neighbors) continue
    for (const neighbor of neighbors) {
      if (!reachable.has(neighbor)) continue
      const key = [nid, neighbor].sort().join("-")
      if (!edgeSet.has(key)) {
        edgeSet.add(key)
        edges.push({ from: nid, to: neighbor })
      }
    }
  }

  return { nodes, edges }
}

/**
 * Build a graph for a Knowledge Map — only notes in the map,
 * with force-directed-like grid layout.
 */
export function buildMapGraph(
  mapNoteIds: string[],
  notes: Note[],
  focusNoteId?: string | null
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  if (mapNoteIds.length === 0) return { nodes: [], edges: [] }

  const mapNoteSet = new Set(mapNoteIds)
  const mapNotes = notes.filter((n) => mapNoteSet.has(n.id))
  const adj = buildAdjacencyList(notes)

  const cx = 300
  const cy = 200

  // If there's a focus note, use radial layout around it
  if (focusNoteId && mapNoteSet.has(focusNoteId)) {
    const depthMap = new Map<string, number>([[focusNoteId, 0]])
    let frontier = [focusNoteId]
    for (let d = 0; d < 3; d++) {
      const next: string[] = []
      for (const nid of frontier) {
        const neighbors = adj.get(nid)
        if (!neighbors) continue
        for (const neighbor of neighbors) {
          if (!depthMap.has(neighbor) && mapNoteSet.has(neighbor)) {
            depthMap.set(neighbor, d + 1)
            next.push(neighbor)
          }
        }
      }
      frontier = next
    }

    // Assign depth Infinity to unconnected map notes
    for (const nid of mapNoteIds) {
      if (!depthMap.has(nid)) depthMap.set(nid, 99)
    }

    const ringRadius = 80
    const nodes: GraphNode[] = []
    const byDepth = new Map<number, string[]>()
    for (const [nid, d] of depthMap) {
      if (!mapNoteSet.has(nid)) continue
      if (!byDepth.has(d)) byDepth.set(d, [])
      byDepth.get(d)!.push(nid)
    }

    const noteMap = new Map(notes.map((n) => [n.id, n]))
    for (const [d, ids] of byDepth) {
      if (d === 0) {
        const n = noteMap.get(ids[0])
        nodes.push({ id: ids[0], label: n?.title || "Untitled", x: cx, y: cy, isCenter: true, depth: 0 })
      } else if (d === 99) {
        // Disconnected notes: place in a row below
        ids.forEach((nid, i) => {
          const n = noteMap.get(nid)
          const cols = Math.min(ids.length, 6)
          const xOff = (i % cols - (cols - 1) / 2) * 70
          const yOff = cy + ringRadius * 3 + Math.floor(i / cols) * 50
          nodes.push({ id: nid, label: n?.title || "Untitled", x: cx + xOff, y: yOff, isCenter: false, depth: d })
        })
      } else {
        ids.forEach((nid, i) => {
          const angle = (2 * Math.PI * i) / ids.length - Math.PI / 2
          const r = ringRadius * d
          const n = noteMap.get(nid)
          nodes.push({ id: nid, label: n?.title || "Untitled", x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), isCenter: false, depth: d })
        })
      }
    }

    const edges: GraphEdge[] = []
    const edgeSet = new Set<string>()
    for (const nid of mapNoteIds) {
      const neighbors = adj.get(nid)
      if (!neighbors) continue
      for (const neighbor of neighbors) {
        if (!mapNoteSet.has(neighbor)) continue
        const key = [nid, neighbor].sort().join("-")
        if (!edgeSet.has(key)) {
          edgeSet.add(key)
          edges.push({ from: nid, to: neighbor })
        }
      }
    }

    return { nodes, edges }
  }

  // No focus: use grid layout
  const noteMap = new Map(notes.map((n) => [n.id, n]))
  const cols = Math.max(Math.ceil(Math.sqrt(mapNotes.length)), 2)
  const spacing = 100
  const startX = cx - ((cols - 1) * spacing) / 2
  const startY = cy - ((Math.ceil(mapNotes.length / cols) - 1) * spacing) / 2

  const nodes: GraphNode[] = mapNotes.map((note, i) => ({
    id: note.id,
    label: note.title || "Untitled",
    x: startX + (i % cols) * spacing,
    y: startY + Math.floor(i / cols) * spacing,
    isCenter: false,
    depth: 0,
  }))

  const edges: GraphEdge[] = []
  const edgeSet = new Set<string>()
  for (const nid of mapNoteIds) {
    const neighbors = adj.get(nid)
    if (!neighbors) continue
    for (const neighbor of neighbors) {
      if (!mapNoteSet.has(neighbor)) continue
      const key = [nid, neighbor].sort().join("-")
      if (!edgeSet.has(key)) {
        edgeSet.add(key)
        edges.push({ from: nid, to: neighbor })
      }
    }
  }

  return { nodes, edges }
}
