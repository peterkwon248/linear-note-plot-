"use client"

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  useReducer,
  useMemo,
  type MouseEvent as ReactMouseEvent,
  type WheelEvent as ReactWheelEvent,
} from "react"
import { MagnifyingGlassPlus } from "@phosphor-icons/react/dist/ssr/MagnifyingGlassPlus"
import { MagnifyingGlassMinus } from "@phosphor-icons/react/dist/ssr/MagnifyingGlassMinus"
import { ArrowCounterClockwise } from "@phosphor-icons/react/dist/ssr/ArrowCounterClockwise"
import { ArrowsIn } from "@phosphor-icons/react/dist/ssr/ArrowsIn"
import { ArrowsOut } from "@phosphor-icons/react/dist/ssr/ArrowsOut"
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type Simulation,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3-force"

import type { OntologyGraph, OntologyNode, OntologyEdge, OntologyEdgeKind } from "@/lib/graph"
import { computeForceConfig } from "@/lib/graph"
import { RELATION_TYPE_CONFIG } from "@/lib/relation-helpers"
import type { RelationType, Label } from "@/lib/types"
import { GRAPH_NODE_HEX, GRAPH_CLUSTER_PALETTE, WIKI_STATUS_HEX } from "@/lib/colors"

/* ── Types ─────────────────────────────────────────────── */

export interface OntologyFilters {
  tagIds: string[]
  labelId: string | null
  status: "inbox" | "capture" | "permanent" | "all"
  relationTypes: RelationType[] | "all"
  showWikilinks: boolean
  showTagNodes: boolean
}

interface OntologyGraphCanvasProps {
  graph: OntologyGraph
  filters: OntologyFilters
  labels: Label[]
  notes?: Array<{ id: string; title: string; preview: string; status: string; tags: string[] }>
  tags?: Array<{ id: string; name: string; color: string }>
  searchMatchIds: Set<string> | null
  selectedNodeId: string | null
  onSelectNode: (id: string | null) => void
  onOpenNote: (noteId: string) => void
  onPositionsUpdate?: (positions: Map<string, { x: number; y: number }>) => void
}

interface Transform {
  x: number
  y: number
  scale: number
}

/* ── Simulation node type ──────────────────────────────── */

interface SimNode extends SimulationNodeDatum {
  id: string
  connectionCount: number
}

/* ── Constants ─────────────────────────────────────────── */

const MIN_SCALE = 0.05
const MAX_SCALE = 3.0
const ZOOM_STEP = 0.15
const LABEL_TRUNCATE = 18
const MAX_VISIBLE_NODES = 200

/* ── Node type derivation (safe fallback when nodeType not yet on OntologyNode) ── */

type GraphNodeType = "note" | "wiki" | "tag"

function getNodeType(node: OntologyNode): GraphNodeType {
  // Check for tag nodes (id starts with "tag:")
  if (node.id.startsWith("tag:")) return "tag"

  // Wiki nodes
  if (node.isWiki || (node as any).nodeType === "wiki-article" || (node as any).nodeType === "wiki-stub" || (node as any).nodeType === "wiki") return "wiki"

  return "note"
}

/* ── SVG shape helpers ─────────────────────────────────── */

/** Hexagon points array for reuse (center→vertex lines need raw coords) */
function hexagonPoints(cx: number, cy: number, s: number): [number, number][] {
  const pts: [number, number][] = []
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2
    pts.push([cx + s * 0.87 * Math.cos(angle + Math.PI / 6), cy + s * Math.sin(angle + Math.PI / 6)])
  }
  // Canonical cube wireframe vertices: top, top-right, bottom-right, bottom, bottom-left, top-left
  return [
    [cx, cy - s],                      // 0: top
    [cx + s * 0.87, cy - s * 0.5],     // 1: top-right
    [cx + s * 0.87, cy + s * 0.5],     // 2: bottom-right
    [cx, cy + s],                      // 3: bottom
    [cx - s * 0.87, cy + s * 0.5],     // 4: bottom-left
    [cx - s * 0.87, cy - s * 0.5],     // 5: top-left
  ]
}

function hexagonPathFromPoints(pts: [number, number][]): string {
  return `M ${pts.map(p => `${p[0]},${p[1]}`).join(" L ")} Z`
}

function hexagonPath(cx: number, cy: number, r: number): string {
  return hexagonPathFromPoints(hexagonPoints(cx, cy, r))
}

/** Diamond points for a single diamond centered at (cx, cy) with half-size d.
 *  Flattened shape: wider (0.9) than tall (0.55) for a compressed look. */
function diamondPointsStr(cx: number, cy: number, d: number): string {
  return `${cx},${cy - d * 0.55} ${cx + d * 0.9},${cy} ${cx},${cy + d * 0.55} ${cx - d * 0.9},${cy}`
}

/* ── Edge style by kind (3-tier thickness) ─────────────── */

function getEdgeStyle(kind: OntologyEdgeKind): { strokeWidth: number; strokeColor: string; opacity: number } {
  switch (kind) {
    case "wikilink": return { strokeWidth: 1.2, strokeColor: "rgba(255,255,255,0.08)", opacity: 1.0 }
    case "tag": return { strokeWidth: 0.8, strokeColor: "rgba(255,255,255,0.06)", opacity: 0.35 }
    default: return { strokeWidth: 2.0, strokeColor: "rgba(255,255,255,0.12)", opacity: 1.0 } // relation types
  }
}

const ACCENT_COLOR = GRAPH_CLUSTER_PALETTE[0]

const CLUSTER_COLORS = [...GRAPH_CLUSTER_PALETTE]

/* ── Helpers ───────────────────────────────────────────── */

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "\u2026" : str
}

/** Generate a smooth closed curve through convex hull points using Catmull-Rom → cubic bezier */
function smoothHullPath(points: { x: number; y: number }[], tension: number = 0.3): string {
  if (points.length < 3) return ""
  const n = points.length
  let d = `M ${points[0].x} ${points[0].y}`

  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n]
    const p1 = points[i]
    const p2 = points[(i + 1) % n]
    const p3 = points[(i + 2) % n]

    const cp1x = p1.x + (p2.x - p0.x) * tension
    const cp1y = p1.y + (p2.y - p0.y) * tension
    const cp2x = p2.x - (p3.x - p1.x) * tension
    const cp2y = p2.y - (p3.y - p1.y) * tension

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }

  d += " Z"
  return d
}

function nodeRadius(connectionCount: number): number {
  return Math.min(10 + connectionCount * 2, 22)
}

function computeFitTransform(
  positions: Map<string, { x: number; y: number }>,
  svgWidth: number,
  svgHeight: number,
  padding = 80,
): Transform {
  if (positions.size === 0) return { x: svgWidth / 2, y: svgHeight / 2, scale: 1 }

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (const { x, y } of positions.values()) {
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }

  const graphW = maxX - minX || 1
  const graphH = maxY - minY || 1
  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2

  const scaleX = (svgWidth - padding * 2) / graphW
  const scaleY = (svgHeight - padding * 2) / graphH
  const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.min(scaleX, scaleY)))

  return {
    x: svgWidth / 2 - centerX * scale,
    y: svgHeight / 2 - centerY * scale,
    scale,
  }
}

function isEdgeVisible(edge: OntologyEdge, filters: OntologyFilters): boolean {
  if (edge.kind === "wikilink") return filters.showWikilinks
  if (edge.kind === "tag") return filters.showTagNodes
  if (filters.relationTypes === "all") return true
  return (filters.relationTypes as RelationType[]).includes(edge.kind as RelationType)
}

/* ── Bezier edge path computation ─────────────────────── */

function computeEdgePath(
  sx: number, sy: number, tx: number, ty: number,
  edgeIndex: number, totalEdges: number, targetR: number,
): { path: string; labelX: number; labelY: number } {
  const dx = tx - sx, dy = ty - sy
  const dist = Math.sqrt(dx * dx + dy * dy) || 1

  // Shorten target end for arrowhead clearance
  const stx = tx - (dx / dist) * targetR
  const sty = ty - (dy / dist) * targetR

  // Perpendicular normal
  const nx = -dy / dist, ny = dx / dist

  let offset: number
  if (totalEdges <= 1) {
    offset = dist * 0.12 // elegant curve for visual appeal
  } else {
    const spreadFactor = 20
    const offsetIndex = edgeIndex - (totalEdges - 1) / 2
    offset = offsetIndex * spreadFactor
  }

  const cx = (sx + stx) / 2 + nx * offset
  const cy = (sy + sty) / 2 + ny * offset

  // Bezier midpoint at t=0.5: B(0.5) = 0.25*P0 + 0.5*C + 0.25*P1
  const labelX = 0.25 * sx + 0.5 * cx + 0.25 * stx
  const labelY = 0.25 * sy + 0.5 * cy + 0.25 * sty

  return {
    path: `M ${sx} ${sy} Q ${cx} ${cy} ${stx} ${sty}`,
    labelX,
    labelY,
  }
}

/* ── Node base color (for gradient palette) ──────────── */

const STATUS_COLORS: Record<string, string> = {
  inbox:     GRAPH_NODE_HEX.inbox,
  capture:   GRAPH_NODE_HEX.capture,
  permanent: GRAPH_NODE_HEX.permanent,
}
const DEFAULT_NODE_COLOR = "hsl(var(--muted-foreground))"

function getNodeBaseColor(node: OntologyNode, labels: Label[]): string {
  if (node.labelId) {
    const label = labels.find((l) => l.id === node.labelId)
    if (label?.color) return label.color
  }
  // Wiki nodes use violet color
  if (node.isWiki || (node as any).nodeType === "wiki-article" || (node as any).nodeType === "wiki-stub" || (node as any).nodeType === "wiki") return WIKI_STATUS_HEX.article    // #8b5cf6 violet
  return STATUS_COLORS[node.status] ?? DEFAULT_NODE_COLOR
}

/* ── Node fill color by status/label ──────────────────── */

function getNodeFill(
  node: OntologyNode,
  labels: Label[],
  isSelected: boolean,
  isHovered: boolean,
  isConnected: boolean,
): string {
  // Always use the node's own color — never replace with accent
  const base = getNodeBaseColor(node, labels)
  if (isSelected || isHovered || isConnected) return base
  return base
}

/* ── Component ─────────────────────────────────────────── */

export function OntologyGraphCanvas({
  graph,
  filters,
  labels,
  notes,
  tags,
  searchMatchIds,
  selectedNodeId,
  onSelectNode,
  onOpenNote,
  onPositionsUpdate,
}: OntologyGraphCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [, forceRender] = useReducer((c: number) => c + 1, 0)

  /* ── State ─────────────────────────────────────────── */
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 })
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [panning, setPanning] = useState(false)
  const [isPanMode, setIsPanMode] = useState(false) // Space hold = pan mode
  const panStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null)

  /* ── Tooltip state (Feature 3) ──────────────────── */
  const [tooltip, setTooltip] = useState<{
    nodeId: string
    screenX: number
    screenY: number
  } | null>(null)
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* ── Live positions (source of truth during simulation) ── */
  const positionsRef = useRef<Map<string, { x: number; y: number }>>(new Map())

  /* ── Multi-select state ───────────────────────────── */
  const [multiSelectedIds, setMultiSelectedIds] = useState<Set<string>>(new Set())
  const multiSelectedIdsRef = useRef<Set<string>>(multiSelectedIds)
  useEffect(() => { multiSelectedIdsRef.current = multiSelectedIds }, [multiSelectedIds])
  const [selectionRect, setSelectionRect] = useState<{
    startX: number; startY: number; endX: number; endY: number
  } | null>(null)
  const marqueeStartRef = useRef<{ graphX: number; graphY: number } | null>(null)

  /* ── Simulation refs ───────────────────────────────── */
  const simRef = useRef<Simulation<SimNode, SimulationLinkDatum<SimNode>> | null>(null)
  const simActiveRef = useRef(false)
  const rafRef = useRef<number>(0)
  const dragNodeIdRef = useRef<string | null>(null)
  const didClickDrag = useRef(false)
  const didMarquee = useRef(false)
  const dragStartPositions = useRef<Map<string, { x: number; y: number }>>(new Map())

  /* ── Initialize positions from graph prop ───────────── */
  const graphIdRef = useRef<string>("")
  const graphFingerprint = useMemo(
    () => graph.nodes.map((n) => n.id).sort().join(","),
    [graph.nodes],
  )

  useEffect(() => {
    if (graphFingerprint === graphIdRef.current) return
    graphIdRef.current = graphFingerprint

    // Init positions from graph
    const newPos = new Map<string, { x: number; y: number }>()
    for (const node of graph.nodes) {
      newPos.set(node.id, { x: node.x, y: node.y })
    }
    positionsRef.current = newPos

    // Create main-thread simulation (starts settled)
    if (simRef.current) simRef.current.stop()

    const simNodes: SimNode[] = graph.nodes.map((n) => ({
      id: n.id,
      connectionCount: n.connectionCount,
      x: n.x,
      y: n.y,
    }))

    const nodeIdxMap = new Map(simNodes.map((sn, i) => [sn.id, i]))

    const simLinks: SimulationLinkDatum<SimNode>[] = graph.edges
      .map((e) => {
        const si = nodeIdxMap.get(e.source)
        const ti = nodeIdxMap.get(e.target)
        if (si === undefined || ti === undefined) return null
        return { source: si, target: ti }
      })
      .filter(Boolean) as SimulationLinkDatum<SimNode>[]

    const config = computeForceConfig(simNodes.length)

    const sim = forceSimulation<SimNode>(simNodes)
      .force(
        "link",
        forceLink<SimNode, SimulationLinkDatum<SimNode>>(simLinks).distance(config.linkDistance),
      )
      .force("charge", forceManyBody().strength(config.chargeStrength))
      .force("center", forceCenter(0, 0))
      .force("collide", forceCollide(config.collisionRadius))
      .alpha(0.01) // start nearly settled
      .alphaMin(0.001)
      .alphaDecay(0.02)
      .stop()

    simRef.current = sim
    simActiveRef.current = false

    // Auto-fit
    const svg = svgRef.current
    if (svg && newPos.size > 0) {
      const rect = svg.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        setTransform(computeFitTransform(newPos, rect.width, rect.height))
      }
    }

    forceRender()
  }, [graphFingerprint, graph.nodes, graph.edges])

  /* ── Auto-fit on resize (first time only) ──────────── */
  const didFitRef = useRef(false)
  useEffect(() => {
    didFitRef.current = false
  }, [graphFingerprint])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg || positionsRef.current.size === 0) return

    const observer = new ResizeObserver(() => {
      if (!didFitRef.current) {
        const rect = svg.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) {
          setTransform(computeFitTransform(positionsRef.current, rect.width, rect.height))
          didFitRef.current = true
        }
      }
    })
    observer.observe(svg)
    return () => observer.disconnect()
  }, [graphFingerprint])

  /* ── rAF simulation loop ───────────────────────────── */
  const startSimLoop = useCallback(() => {
    if (simActiveRef.current) return
    simActiveRef.current = true

    const tick = () => {
      const sim = simRef.current
      if (!sim || sim.alpha() <= sim.alphaMin()) {
        simActiveRef.current = false
        // Report final positions to parent
        if (onPositionsUpdate) {
          onPositionsUpdate(new Map(positionsRef.current))
        }
        return
      }

      sim.tick()

      // Update positions ref
      for (const simNode of sim.nodes()) {
        positionsRef.current.set(simNode.id, { x: simNode.x ?? 0, y: simNode.y ?? 0 })
      }

      forceRender()
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [onPositionsUpdate])

  // Cleanup rAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Space key = pan mode (n8n style) + Arrow keys = pan viewport
  const PAN_STEP = 60
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault()
        setIsPanMode(true)
        return
      }
      // Arrow keys: pan viewport (skip if input/textarea focused)
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA") return
      const arrowDeltas: Record<string, [number, number]> = {
        ArrowUp: [0, PAN_STEP],
        ArrowDown: [0, -PAN_STEP],
        ArrowLeft: [PAN_STEP, 0],
        ArrowRight: [-PAN_STEP, 0],
      }
      const delta = arrowDeltas[e.code]
      if (delta) {
        e.preventDefault()
        setTransform((prev) => ({ ...prev, x: prev.x + delta[0], y: prev.y + delta[1] }))
        return
      }
      // Escape: clear all selection
      if (e.code === "Escape") {
        setMultiSelectedIds(new Set())
        multiSelectedIdsRef.current = new Set()
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault()
        setIsPanMode(false)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
    }
  }, [])

  /* ── Derived: visible edges ────────────────────────── */
  const visibleEdges = useMemo(
    () => graph.edges.filter((e) => isEdgeVisible(e, filters)),
    [graph.edges, filters],
  )

  /* ── Node lookup map — O(1) instead of O(n) find ──── */
  const nodeMap = useMemo(() => {
    const m = new Map<string, OntologyNode>()
    for (const n of graph.nodes) m.set(n.id, n)
    return m
  }, [graph.nodes])

  /* ── Gradient palette: status-pair combos (max ~16) ── */
  const gradientPalette = useMemo(() => {
    const allColors = new Set<string>()
    for (const n of graph.nodes) {
      allColors.add(getNodeBaseColor(n, labels))
    }
    const colorArr = Array.from(allColors)
    const palette: { id: string; from: string; to: string }[] = []
    for (const from of colorArr) {
      for (const to of colorArr) {
        if (from === to) continue
        const id = `eg-${palette.length}`
        palette.push({ id, from, to })
      }
    }
    return palette
  }, [graph.nodes, labels])

  /* ── Gradient lookup: color-pair → gradient id ─────── */
  const gradientLookup = useMemo(() => {
    const m = new Map<string, string>()
    for (const g of gradientPalette) {
      m.set(`${g.from}||${g.to}`, g.id)
    }
    return m
  }, [gradientPalette])

  /* ── Parallel edge map for fan-out (Feature 1) ────── */
  const edgePairMap = useMemo(() => {
    const map = new Map<string, OntologyEdge[]>()
    for (const edge of visibleEdges) {
      const key = [edge.source, edge.target].sort().join("||")
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(edge)
    }
    return map
  }, [visibleEdges])

  /* ── Edge-based cluster hulls (connected components) ── */
  const clusterHulls = useMemo(() => {
    // Build adjacency from visible edges
    const adj = new Map<string, Set<string>>()
    for (const edge of visibleEdges) {
      if (!adj.has(edge.source)) adj.set(edge.source, new Set())
      if (!adj.has(edge.target)) adj.set(edge.target, new Set())
      adj.get(edge.source)!.add(edge.target)
      adj.get(edge.target)!.add(edge.source)
    }

    // Find connected components via BFS
    const visited = new Set<string>()
    const components: string[][] = []

    for (const nodeId of adj.keys()) {
      if (visited.has(nodeId)) continue
      const component: string[] = []
      const queue = [nodeId]
      visited.add(nodeId)
      while (queue.length > 0) {
        const current = queue.shift()!
        component.push(current)
        for (const neighbor of adj.get(current) ?? []) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor)
            queue.push(neighbor)
          }
        }
      }
      components.push(component)
    }

    const hulls: { id: string; color: string; path: string }[] = []

    for (let ci = 0; ci < components.length; ci++) {
      const component = components[ci]
      if (component.length < 3) continue // Need at least 3 nodes for a hull

      // Gather positions
      const points: { x: number; y: number }[] = []
      for (const nid of component) {
        const pos = positionsRef.current.get(nid)
        if (pos) points.push(pos)
      }
      if (points.length < 3) continue

      // Determine color — if all nodes share a common label, use that label's color
      let commonLabelId: string | null = null
      let allSameLabel = true
      for (const nid of component) {
        const node = nodeMap.get(nid)
        if (!node) continue
        if (commonLabelId === null) {
          commonLabelId = node.labelId
        } else if (node.labelId !== commonLabelId) {
          allSameLabel = false
          break
        }
      }

      let color: string
      if (allSameLabel && commonLabelId) {
        const label = labels.find((l) => l.id === commonLabelId)
        color = label?.color ?? CLUSTER_COLORS[ci % CLUSTER_COLORS.length]
      } else {
        color = CLUSTER_COLORS[ci % CLUSTER_COLORS.length]
      }

      // Compute convex hull (Graham scan)
      const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y)
      const cross = (o: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) =>
        (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)

      const lower: { x: number; y: number }[] = []
      for (const p of sorted) {
        while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop()
        lower.push(p)
      }
      const upper: { x: number; y: number }[] = []
      for (let i = sorted.length - 1; i >= 0; i--) {
        const p = sorted[i]
        while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop()
        upper.push(p)
      }
      upper.pop()
      lower.pop()
      const hull = lower.concat(upper)
      if (hull.length < 3) continue

      // Expand hull outward by padding
      const pad = 30
      const cx = hull.reduce((s, p) => s + p.x, 0) / hull.length
      const cy = hull.reduce((s, p) => s + p.y, 0) / hull.length
      const expanded = hull.map((p) => {
        const dx = p.x - cx, dy = p.y - cy
        const d = Math.sqrt(dx * dx + dy * dy) || 1
        return { x: p.x + (dx / d) * pad, y: p.y + (dy / d) * pad }
      })

      // Build smooth closed curve
      const path = smoothHullPath(expanded)

      hulls.push({ id: `cluster-${ci}`, color, path })
    }

    return hulls
  }, [visibleEdges, graph.nodes, labels, nodeMap, positionsRef.current])

  /* ── Node adjacency for hover highlight ────────────── */
  const connectedToHovered = useCallback(
    (nodeId: string): boolean => {
      if (!hoveredId) return false
      return visibleEdges.some(
        (e) =>
          (e.source === hoveredId && e.target === nodeId) ||
          (e.target === hoveredId && e.source === nodeId),
      )
    },
    [hoveredId, visibleEdges],
  )

  /* ── Zoom helpers ──────────────────────────────────── */
  const zoomBy = useCallback((delta: number, cx?: number, cy?: number) => {
    setTransform((prev) => {
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale + delta))
      if (newScale === prev.scale) return prev
      const svg = svgRef.current
      const rect = svg?.getBoundingClientRect()
      const pivotX = cx ?? (rect ? rect.width / 2 : 0)
      const pivotY = cy ?? (rect ? rect.height / 2 : 0)
      const ratio = newScale / prev.scale
      return {
        x: pivotX - (pivotX - prev.x) * ratio,
        y: pivotY - (pivotY - prev.y) * ratio,
        scale: newScale,
      }
    })
  }, [])

  const handleWheel = useCallback(
    (e: ReactWheelEvent<SVGSVGElement>) => {
      e.preventDefault()
      const svg = svgRef.current
      if (!svg) return
      const rect = svg.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top
      const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP
      zoomBy(delta, cx, cy)
    },
    [zoomBy],
  )

  const resetView = useCallback(() => {
    const svg = svgRef.current
    if (!svg || positionsRef.current.size === 0) return
    const rect = svg.getBoundingClientRect()
    setTransform(computeFitTransform(positionsRef.current, rect.width, rect.height))
  }, [])

  /* ── Cluster / Spread: scale positions toward/away from centroid ── */
  const adjustSpread = useCallback((direction: "cluster" | "spread") => {
    const positions = positionsRef.current
    if (positions.size === 0) return

    const factor = direction === "cluster" ? 0.7 : 1.4

    // Compute centroid
    let cx = 0, cy = 0
    for (const { x, y } of positions.values()) { cx += x; cy += y }
    cx /= positions.size
    cy /= positions.size

    // Scale all positions toward/away from centroid
    for (const [id, pos] of positions) {
      positions.set(id, {
        x: cx + (pos.x - cx) * factor,
        y: cy + (pos.y - cy) * factor,
      })
    }

    // Sync simulation nodes
    const sim = simRef.current
    if (sim) {
      for (const simNode of sim.nodes()) {
        const p = positions.get(simNode.id)
        if (p) { simNode.x = p.x; simNode.y = p.y }
      }
    }

    if (onPositionsUpdate) onPositionsUpdate(new Map(positions))
    forceRender()
  }, [onPositionsUpdate])

  /* ── Helper: screen coords → graph coords ─────────── */
  const screenToGraph = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current
      if (!svg) return { x: 0, y: 0 }
      const rect = svg.getBoundingClientRect()
      return {
        x: (clientX - rect.left - transform.x) / transform.scale,
        y: (clientY - rect.top - transform.y) / transform.scale,
      }
    },
    [transform.x, transform.y, transform.scale],
  )

  /* ── Mouse handlers (pan + node drag + marquee) ───── */
  const handleNodeMouseDown = useCallback(
    (e: ReactMouseEvent, nodeId: string) => {
      e.preventDefault()
      e.stopPropagation()
      dragNodeIdRef.current = nodeId
      didClickDrag.current = false
      setHoveredId(null)
      setTooltip(null)
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current)

      // If this node is in multi-selection, prepare group drag
      // If not (and no Ctrl/Cmd), start fresh single drag
      // Compute new set synchronously so we can update the ref immediately
      const prev = multiSelectedIdsRef.current
      let nextSet: Set<string>
      if (e.ctrlKey || e.metaKey) {
        nextSet = new Set(prev)
        nextSet.add(nodeId)
      } else if (prev.has(nodeId) && prev.size > 1) {
        nextSet = prev // keep multi-selection for group drag
      } else {
        nextSet = new Set([nodeId])
      }
      multiSelectedIdsRef.current = nextSet // sync ref immediately for handleMouseMove
      setMultiSelectedIds(nextSet)

      // Snapshot positions for group drag offset
      dragStartPositions.current = new Map(positionsRef.current)

      const sim = simRef.current
      if (sim) {
        const simNode = sim.nodes().find((n) => n.id === nodeId)
        if (simNode) {
          simNode.fx = simNode.x
          simNode.fy = simNode.y
        }
      }
    },
    [],
  )

  const handleMouseDown = useCallback(
    (e: ReactMouseEvent<SVGSVGElement>) => {
      if (dragNodeIdRef.current) return

      e.preventDefault()

      // Shift+drag = marquee selection
      if (e.shiftKey) {
        didMarquee.current = false
        const gp = screenToGraph(e.clientX, e.clientY)
        marqueeStartRef.current = { graphX: gp.x, graphY: gp.y }
        setSelectionRect({ startX: gp.x, startY: gp.y, endX: gp.x, endY: gp.y })
        return
      }

      // Default: pan (click & drag empty space)
      panStart.current = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y }
      setPanning(true)
    },
    [transform.x, transform.y, screenToGraph, isPanMode],
  )

  const handleMouseMove = useCallback(
    (e: ReactMouseEvent<SVGSVGElement>) => {
      // --- Marquee selection ---
      if (marqueeStartRef.current && selectionRect) {
        const gp = screenToGraph(e.clientX, e.clientY)
        setSelectionRect((prev) => prev ? { ...prev, endX: gp.x, endY: gp.y } : null)
        return
      }

      // --- Node dragging (single or multi) ---
      if (dragNodeIdRef.current) {
        const gp = screenToGraph(e.clientX, e.clientY)
        const dragId = dragNodeIdRef.current
        const selectedIds = multiSelectedIdsRef.current
        const startPos = dragStartPositions.current.get(dragId)
        if (!startPos) {
          positionsRef.current.set(dragId, { x: gp.x, y: gp.y })
        } else {
          const dx = gp.x - startPos.x
          const dy = gp.y - startPos.y

          // Move all selected nodes by the same delta (read from ref for latest value)
          for (const id of selectedIds) {
            const orig = dragStartPositions.current.get(id)
            if (orig) {
              positionsRef.current.set(id, { x: orig.x + dx, y: orig.y + dy })
            }
          }
          // Also ensure the drag node itself moves (in case not in set)
          positionsRef.current.set(dragId, { x: startPos.x + dx, y: startPos.y + dy })
        }

        // Sync simulation
        const sim = simRef.current
        if (sim) {
          for (const simNode of sim.nodes()) {
            const p = positionsRef.current.get(simNode.id)
            if (p && (simNode.id === dragId || selectedIds.has(simNode.id))) {
              simNode.x = p.x
              simNode.y = p.y
              simNode.fx = p.x
              simNode.fy = p.y
            }
          }
        }

        didClickDrag.current = true
        forceRender()
        return
      }

      // --- Panning ---
      if (!panning || !panStart.current) return
      const dx = e.clientX - panStart.current.x
      const dy = e.clientY - panStart.current.y
      const startTx = panStart.current.tx
      const startTy = panStart.current.ty
      setTransform((prev) => ({
        ...prev,
        x: startTx + dx,
        y: startTy + dy,
      }))
    },
    [panning, transform.x, transform.y, transform.scale, screenToGraph, selectionRect],
  )

  const handleMouseUp = useCallback(() => {
    // --- End marquee selection ---
    if (marqueeStartRef.current && selectionRect) {
      const minX = Math.min(selectionRect.startX, selectionRect.endX)
      const maxX = Math.max(selectionRect.startX, selectionRect.endX)
      const minY = Math.min(selectionRect.startY, selectionRect.endY)
      const maxY = Math.max(selectionRect.startY, selectionRect.endY)

      // Find all nodes inside the rectangle
      const selected = new Set<string>()
      for (const [id, pos] of positionsRef.current) {
        if (pos.x >= minX && pos.x <= maxX && pos.y >= minY && pos.y <= maxY) {
          selected.add(id)
        }
      }
      setMultiSelectedIds(selected)
      multiSelectedIdsRef.current = selected
      marqueeStartRef.current = null
      setSelectionRect(null)
      didMarquee.current = true // prevent click handler from clearing selection
      return
    }

    // --- End node drag ---
    if (dragNodeIdRef.current) {
      // Release simulation fx/fy for all dragged nodes
      const sim = simRef.current
      if (sim) {
        const selectedIds = multiSelectedIdsRef.current
        for (const simNode of sim.nodes()) {
          if (simNode.id === dragNodeIdRef.current || selectedIds.has(simNode.id)) {
            simNode.fx = null
            simNode.fy = null
          }
        }
      }
      // Persist positions
      if (onPositionsUpdate) onPositionsUpdate(new Map(positionsRef.current))
      dragNodeIdRef.current = null
      dragStartPositions.current.clear()
      return
    }

    // --- End pan ---
    setPanning(false)
    panStart.current = null
  }, [selectionRect, onPositionsUpdate])

  /* ── Click on background: deselect ─────────────────── */
  const handleSvgClick = useCallback(
    (e: ReactMouseEvent<SVGSVGElement>) => {
      if ((e.target as Element).closest("[data-graph-node]")) return
      // Don't clear selection if we just finished a marquee or drag
      if (didMarquee.current) { didMarquee.current = false; return }
      if (didClickDrag.current) return
      onSelectNode(null)
      const empty = new Set<string>()
      setMultiSelectedIds(empty)
      multiSelectedIdsRef.current = empty
    },
    [onSelectNode],
  )

  /* ── Node click/dblclick ────────────────────────────── */
  const handleNodeClick = useCallback(
    (e: ReactMouseEvent, nodeId: string) => {
      if (didClickDrag.current) return // was a drag, not a click
      e.stopPropagation()

      if (e.ctrlKey || e.metaKey) {
        // Ctrl/Cmd+click: toggle node in multi-selection
        setMultiSelectedIds((prev) => {
          const next = new Set(prev)
          if (next.has(nodeId)) next.delete(nodeId)
          else next.add(nodeId)
          return next
        })
        return
      }

      // Regular click: single select (clear multi)
      setMultiSelectedIds(new Set())
      onSelectNode(nodeId === selectedNodeId ? null : nodeId)
    },
    [onSelectNode, selectedNodeId],
  )

  const handleNodeDblClick = useCallback(
    (e: ReactMouseEvent, noteId: string) => {
      e.stopPropagation()
      onOpenNote(noteId)
    },
    [onOpenNote],
  )

  /* ── Get node position (from sim or initial graph) ──── */
  const getPos = useCallback(
    (nodeId: string): { x: number; y: number } => {
      return positionsRef.current.get(nodeId) ?? { x: 0, y: 0 }
    },
    [],
  )

  /* ── Node cap: if total exceeds MAX_VISIBLE_NODES, keep top-N by connectionCount ── */
  const cappedNodes = useMemo(() => {
    if (graph.nodes.length <= MAX_VISIBLE_NODES) return graph.nodes
    return [...graph.nodes]
      .sort((a, b) => b.connectionCount - a.connectionCount)
      .slice(0, MAX_VISIBLE_NODES)
  }, [graph.nodes])
  const cappedNodeIds = useMemo(
    () => new Set(cappedNodes.map((n) => n.id)),
    [cappedNodes],
  )
  const isCapped = graph.nodes.length > MAX_VISIBLE_NODES

  /* ── Empty state ────────────────────────────────────── */
  if (graph.nodes.length === 0) {
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center text-center py-20 px-8"
        style={{
          backgroundImage: "radial-gradient(circle, hsl(var(--border) / 0.3) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      >
        <p className="text-ui text-muted-foreground">No notes to display.</p>
        <p className="mt-1 text-note text-muted-foreground/60 max-w-sm">
          Create relations between notes or use wiki-links to build your ontology.
        </p>
      </div>
    )
  }

  /* ── Legend items ───────────────────────────────────── */
  const hasWikilinkEdges = visibleEdges.some((e) => e.kind === "wikilink")
  const showLegend = visibleEdges.length > 0

  const legendRelationTypes = Object.entries(RELATION_TYPE_CONFIG).filter(([type]) =>
    visibleEdges.some((e) => e.kind === type),
  ) as [RelationType, (typeof RELATION_TYPE_CONFIG)[RelationType]][]

  /* ── LOD zoom (Feature 4) ──────────────────────────── */
  const showLabels = transform.scale >= 0.3
  const showEdgeLabels = transform.scale > 0.7
  const showNodesAtAll = transform.scale >= 0.15

  /* ── Viewport culling (Feature 4) ─────────────────── */
  const viewBounds = (() => {
    const svg = svgRef.current
    if (!svg) return null
    const rect = svg.getBoundingClientRect()
    if (rect.width === 0) return null
    const pad = 60
    return {
      left: -transform.x / transform.scale - pad,
      top: -transform.y / transform.scale - pad,
      right: (rect.width - transform.x) / transform.scale + pad,
      bottom: (rect.height - transform.y) / transform.scale + pad,
    }
  })()

  const culledNodes = (viewBounds
    ? cappedNodes.filter((n) => {
        const pos = getPos(n.id)
        return pos.x >= viewBounds.left && pos.x <= viewBounds.right &&
               pos.y >= viewBounds.top && pos.y <= viewBounds.bottom
      })
    : cappedNodes
  ).filter((n) => filters.showTagNodes || !n.id.startsWith("tag:"))

  const culledNodeIds = new Set(culledNodes.map((n) => n.id))

  const culledEdges = visibleEdges.filter(
    (e) =>
      cappedNodeIds.has(e.source) &&
      cappedNodeIds.has(e.target) &&
      (culledNodeIds.has(e.source) || culledNodeIds.has(e.target))
  )

  /* ── Cursor ────────────────────────────────────────── */
  const cursor = dragNodeIdRef.current ? "grabbing" : panning ? "grabbing" : "grab"

  /* ── Render ─────────────────────────────────────────── */
  return (
    <div
      className="relative w-full h-full flex flex-col"
      style={{
        backgroundImage: "radial-gradient(circle, hsl(var(--border) / 0.3) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    >
      {/* ── Node cap warning banner ─────────────────── */}
      {isCapped && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-2xs text-amber-400/90 pointer-events-none select-none">
          Showing top {MAX_VISIBLE_NODES} of {graph.nodes.length} nodes. Use filters to narrow down.
        </div>
      )}
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{
          minHeight: 400,
          cursor,
          userSelect: "none",
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleSvgClick}
      >
        {/* ── SVG defs: markers, filters, gradients ── */}
        <defs>
          {/* Edge glow filter */}
          <filter id="edge-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Arrow markers — slightly larger for visibility */}
          {Object.entries(RELATION_TYPE_CONFIG).map(([type, config]) => (
            <marker
              key={type}
              id={`arrow-${type}`}
              viewBox="0 0 10 7"
              refX="10"
              refY="3.5"
              markerWidth="10"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill={config.color}
                style={{ transition: "opacity 0.2s" }}
              />
            </marker>
          ))}

          {/* Status-pair gradient palette (max ~16 combos, not per-edge) */}
          {gradientPalette.map(({ id, from, to }) => (
            <linearGradient key={id} id={id} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={from} />
              <stop offset="100%" stopColor={to} />
            </linearGradient>
          ))}

          {/* Wikilink animated dash style */}
          <style>{`
            @keyframes dash-flow {
              to { stroke-dashoffset: -18; }
            }
            .wikilink-edge-animated {
              animation: dash-flow 3s linear infinite;
            }
          `}</style>
        </defs>

        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>
          {/* ── Cluster hull backgrounds ──────────── */}
          {clusterHulls.map((hull) => (
            <path
              key={hull.id}
              d={hull.path}
              fill={hull.color}
              fillOpacity={0.04}
              stroke={hull.color}
              strokeOpacity={0.12}
              strokeWidth={1}
              style={{ pointerEvents: "none" }}
            />
          ))}

          {/* ── Edges (bezier curves) ─────────────── */}
          {culledEdges.map((edge, i) => {
            const sp = getPos(edge.source)
            const tp = getPos(edge.target)
            const targetNode = nodeMap.get(edge.target)
            if (!targetNode) return null

            const isConnectedToHover =
              hoveredId !== null &&
              (edge.source === hoveredId || edge.target === hoveredId)
            const isConnectedToSelected =
              selectedNodeId !== null &&
              (edge.source === selectedNodeId || edge.target === selectedNodeId)
            const isHighlighted = isConnectedToHover || isConnectedToSelected

            const isWikilink = edge.kind === "wikilink"
            const targetR = nodeRadius(targetNode.connectionCount) + 4

            // Parallel edge fan-out
            const pairKey = [edge.source, edge.target].sort().join("||")
            const pairEdges = edgePairMap.get(pairKey) ?? [edge]
            const edgeIdx = pairEdges.indexOf(edge)
            const totalInPair = pairEdges.length

            const { path, labelX, labelY } = computeEdgePath(
              sp.x, sp.y, tp.x, tp.y, edgeIdx, totalInPair, isWikilink ? 0 : targetR,
            )

            // n8n style: no dimming on hover/select — only search dimming
            const dimmed = searchMatchIds !== null && !searchMatchIds.has(edge.source) && !searchMatchIds.has(edge.target)

            // 3-tier edge styling per spec
            const edgeStyle = getEdgeStyle(edge.kind)

            // Highlighted edges use accent color
            const isHighlightedEdge = isHighlighted
            const edgeStroke = isHighlightedEdge
              ? `${ACCENT_COLOR}70`
              : edgeStyle.strokeColor
            const edgeWidth = isHighlightedEdge ? 2.5 : edgeStyle.strokeWidth
            const edgeOpacity = dimmed ? 0.08 : isHighlightedEdge ? 1 : edgeStyle.opacity

            if (isWikilink) {
              return (
                <g key={`e-${i}`}>
                  <path
                    d={path}
                    fill="none"
                    stroke={edgeStroke}
                    strokeDasharray="8 4"
                    strokeWidth={edgeWidth}
                    opacity={edgeOpacity}
                    style={{ transition: "opacity 0.2s" }}
                  />
                </g>
              )
            }

            if (edge.kind === "tag") {
              return (
                <g key={`e-${i}`}>
                  <path
                    d={path}
                    fill="none"
                    stroke={edgeStroke}
                    strokeWidth={edgeWidth}
                    opacity={edgeOpacity}
                    style={{ transition: "opacity 0.2s" }}
                  />
                </g>
              )
            }

            // Relation edges — thickest, gradient stroke preserved for non-highlighted
            const edgeColor = RELATION_TYPE_CONFIG[edge.kind as RelationType]?.color ?? "#6b7280"
            const srcNode = nodeMap.get(edge.source)
            const srcColor = srcNode ? getNodeBaseColor(srcNode, labels) : edgeColor
            const tgtColor = getNodeBaseColor(targetNode, labels)
            const gradId = gradientLookup.get(`${srcColor}||${tgtColor}`)
            const strokeRef = isHighlightedEdge
              ? `${ACCENT_COLOR}70`
              : gradId ? `url(#${gradId})` : edgeStyle.strokeColor

            return (
              <g key={`e-${i}`}>
                <path
                  d={path}
                  fill="none"
                  stroke={strokeRef}
                  strokeWidth={edgeWidth}
                  opacity={edgeOpacity}
                  markerEnd={isHighlightedEdge ? undefined : `url(#arrow-${edge.kind})`}
                  style={{ transition: "opacity 0.2s" }}
                />
                {showEdgeLabels && (
                  <text
                    x={labelX}
                    y={labelY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={9}
                    fill="var(--muted-foreground)"
                    opacity={dimmed ? 0.3 : 0.7}
                    style={{ pointerEvents: "none" }}
                    fontFamily="-apple-system, system-ui, sans-serif"
                  >
                    {RELATION_TYPE_CONFIG[edge.kind as RelationType]?.label}
                  </text>
                )}
              </g>
            )
          })}

          {/* ── Nodes (hidden at zoom < 0.15; cluster hulls still show) ── */}
          {showNodesAtAll && culledNodes.map((node) => {
            const pos = getPos(node.id)
            const isSelected = selectedNodeId === node.id
            const isMultiSelected = multiSelectedIds.has(node.id)
            const isHovered = hoveredId === node.id
            const isConnected = connectedToHovered(node.id)
            const isHighlighted = isHovered || isConnected || isSelected || isMultiSelected

            // n8n style: no dimming on hover/select — only search dimming
            const dimmed = searchMatchIds !== null && !searchMatchIds.has(node.id)

            const r = nodeRadius(node.connectionCount)
            const fill = getNodeFill(node, labels, isSelected, isHovered, isConnected)
            const isDragging = dragNodeIdRef.current === node.id
            const nodeType = getNodeType(node)

            // Shape-specific radius adjustments
            const shapeR = nodeType === "wiki" ? r * 1.15
              : nodeType === "tag" ? r * 0.55
              : r

            return (
              <g
                key={node.id}
                data-graph-node
                data-node-id={node.id}
                style={{ cursor: isDragging ? "grabbing" : "pointer" }}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onMouseEnter={() => {
                  if (!dragNodeIdRef.current) {
                    setHoveredId(node.id)
                    // Start tooltip timer
                    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current)
                    tooltipTimerRef.current = setTimeout(() => {
                      const svg = svgRef.current
                      if (!svg) return
                      const rect = svg.getBoundingClientRect()
                      const p = getPos(node.id)
                      setTooltip({
                        nodeId: node.id,
                        screenX: p.x * transform.scale + transform.x + rect.left,
                        screenY: p.y * transform.scale + transform.y + rect.top,
                      })
                    }, 300)
                  }
                }}
                onMouseLeave={() => {
                  if (!dragNodeIdRef.current) {
                    setHoveredId(null)
                    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current)
                    tooltipTimerRef.current = null
                    setTooltip(null)
                  }
                }}
                onClick={(e) => handleNodeClick(e, node.id)}
                onDoubleClick={(e) => handleNodeDblClick(e, node.id)}
              >
                {/* Selection ring — accent color */}
                {isSelected && (
                  <circle
                    cx={pos.x} cy={pos.y} r={r + 6}
                    fill="none" stroke={ACCENT_COLOR} strokeWidth={1.5} opacity={0.4}
                  />
                )}

                {/* Multi-selection ring */}
                {isMultiSelected && !isSelected && (
                  <circle
                    cx={pos.x} cy={pos.y} r={r + 5}
                    fill="none" stroke={fill} strokeWidth={1.5} strokeDasharray="4 3" opacity={0.5}
                  />
                )}

                {/* ── Node shape — type-dependent per spec ── */}
                {nodeType === "note" && (() => {
                  const op = dimmed ? 0.15 : 0.85
                  return (
                    <circle
                      cx={pos.x} cy={pos.y} r={r}
                      fill={`${fill}15`}
                      stroke={fill}
                      strokeWidth={1.3}
                      opacity={op}
                      style={{ transition: "opacity 0.15s" }}
                    />
                  )
                })()}

                {nodeType === "wiki" && (() => {
                  const s = shapeR * 0.85
                  const pts = hexagonPoints(pos.x, pos.y, s)
                  const op = dimmed ? 0.15 : 0.85
                  return (
                    <>
                      <polygon
                        points={pts.map(p => `${p[0]},${p[1]}`).join(" ")}
                        fill={`${fill}12`}
                        stroke={fill}
                        strokeWidth={1.5}
                        strokeLinejoin="round"
                        opacity={op}
                        style={{ transition: "opacity 0.15s" }}
                      />
                      {/* Internal cube wireframe lines: center → vertices 0, 2, 4 */}
                      <line x1={pos.x} y1={pos.y} x2={pts[0][0]} y2={pts[0][1]}
                        stroke={fill} strokeWidth={1.05} opacity={op * 0.6} />
                      <line x1={pos.x} y1={pos.y} x2={pts[2][0]} y2={pts[2][1]}
                        stroke={fill} strokeWidth={1.05} opacity={op * 0.6} />
                      <line x1={pos.x} y1={pos.y} x2={pts[4][0]} y2={pts[4][1]}
                        stroke={fill} strokeWidth={1.05} opacity={op * 0.6} />
                    </>
                  )
                })()}

                {nodeType === "tag" && (() => {
                  const color = (node as any).tagColor || fill
                  const pw = r * 0.7   // pill half-width
                  const ph = r * 0.35  // pill half-height
                  const op = dimmed ? 0.15 : 0.75
                  return (
                    <rect
                      x={pos.x - pw} y={pos.y - ph}
                      width={pw * 2} height={ph * 2}
                      rx={ph} ry={ph}
                      fill={`${color}18`}
                      stroke={color}
                      strokeWidth={1.3}
                      opacity={op}
                    />
                  )
                })()}

                {/* Label — LOD: hide at low zoom */}
                {showLabels && (
                  <text
                    x={pos.x}
                    y={pos.y + shapeR + 14}
                    textAnchor="middle"
                    fill="var(--foreground)"
                    fontSize={nodeType === "tag" ? 10 : 11}
                    fontFamily="-apple-system, system-ui, sans-serif"
                    fontWeight={isSelected ? 600 : 500}
                    fontStyle={nodeType === "tag" ? "italic" : "normal"}
                    opacity={isHighlighted ? 1 : dimmed ? 0.3 : nodeType === "tag" ? 0.7 : 0.85}
                    style={{
                      transition: "opacity 0.15s",
                      pointerEvents: "none",
                    }}
                  >
                    {isHovered ? node.label : truncate(node.label, LABEL_TRUNCATE)}
                  </text>
                )}
              </g>
            )
          })}

          {/* ── Marquee selection rectangle ───────── */}
          {selectionRect && (
            <rect
              x={Math.min(selectionRect.startX, selectionRect.endX)}
              y={Math.min(selectionRect.startY, selectionRect.endY)}
              width={Math.abs(selectionRect.endX - selectionRect.startX)}
              height={Math.abs(selectionRect.endY - selectionRect.startY)}
              fill="rgba(59, 130, 246, 0.08)"
              stroke="rgba(59, 130, 246, 0.5)"
              strokeWidth={1 / transform.scale}
              strokeDasharray={`${4 / transform.scale} ${3 / transform.scale}`}
              style={{ pointerEvents: "none" }}
            />
          )}
        </g>

        {/* ── Legend (fixed position, bottom-left) ────── */}
        {showLegend && (
          <LegendOverlay
            svgRef={svgRef}
            legendRelationTypes={legendRelationTypes}
            hasWikilinkEdges={hasWikilinkEdges}
          />
        )}
      </svg>

      {/* ── Minimap ──────────────────────────────────── */}
      <MiniMap
        positions={positionsRef}
        transform={transform}
        svgRef={svgRef}
        nodes={graph.nodes}
        edges={graph.edges}
        labels={labels}
        selectedNodeId={selectedNodeId}
        onNavigate={(t) => setTransform(t)}
      />

      {/* ── Controls overlay ────────────────────────── */}
      <div className="absolute bottom-3 right-3 flex items-center gap-0.5 rounded-md border border-border bg-card shadow-sm">
        <button
          tabIndex={-1}
          onClick={() => adjustSpread("cluster")}
          className="rounded-l-md p-1.5 text-muted-foreground hover:bg-hover-bg hover:text-foreground transition-colors"
          title="Cluster nodes"
        >
          <ArrowsIn size={16} weight="regular" />
        </button>
        <button
          tabIndex={-1}
          onClick={() => adjustSpread("spread")}
          className="p-1.5 text-muted-foreground hover:bg-hover-bg hover:text-foreground transition-colors"
          title="Spread nodes"
        >
          <ArrowsOut size={16} weight="regular" />
        </button>
        <div className="h-4 w-px bg-border" />
        <button
          tabIndex={-1}
          onClick={() => zoomBy(ZOOM_STEP)}
          className="p-1.5 text-muted-foreground hover:bg-hover-bg hover:text-foreground transition-colors"
          title="Zoom in"
        >
          <MagnifyingGlassPlus size={16} weight="regular" />
        </button>
        <button
          tabIndex={-1}
          onClick={() => zoomBy(-ZOOM_STEP)}
          className="p-1.5 text-muted-foreground hover:bg-hover-bg hover:text-foreground transition-colors"
          title="Zoom out"
        >
          <MagnifyingGlassMinus size={16} weight="regular" />
        </button>
        <div className="h-4 w-px bg-border" />
        <button
          tabIndex={-1}
          onClick={resetView}
          className="rounded-r-md p-1.5 text-muted-foreground hover:bg-hover-bg hover:text-foreground transition-colors"
          title="Reset view"
        >
          <ArrowCounterClockwise size={16} weight="regular" />
        </button>
      </div>

      {/* ── Tooltip (Feature 3) ──────────────────────── */}
      {tooltip && notes && (() => {
        const note = notes.find((n) => n.id === tooltip.nodeId)
        if (!note) return null
        const nodeData = graph.nodes.find((n) => n.id === tooltip.nodeId)
        const noteTags = tags ? note.tags.map((tid) => tags.find((t) => t.id === tid)).filter(Boolean) : []

        return (
          <div
            className="fixed z-50 pointer-events-none"
            style={{ left: tooltip.screenX + 16, top: tooltip.screenY - 8 }}
          >
            <div className="bg-surface-overlay/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3 max-w-[240px]">
              <p className="text-note font-medium text-foreground line-clamp-2">{note.title}</p>
              {note.preview && (
                <p className="text-2xs text-muted-foreground mt-1 line-clamp-2">{note.preview}</p>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-2xs px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground capitalize">
                  {note.status}
                </span>
                {nodeData && (
                  <span className="text-2xs text-muted-foreground/60">
                    {nodeData.connectionCount} links
                  </span>
                )}
              </div>
              {noteTags.length > 0 && (
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {noteTags.slice(0, 4).map((t: any) => (
                    <span key={t.id} className="flex items-center gap-0.5 text-2xs px-1 py-0.5 rounded bg-secondary/70">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                      {t.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}

/* ── MiniMap sub-component ──────────────────────────────── */

const MINIMAP_W = 200
const MINIMAP_H = 130
const MINIMAP_PAD = 20

interface MiniMapProps {
  positions: React.RefObject<Map<string, { x: number; y: number }>>
  transform: Transform
  svgRef: React.RefObject<SVGSVGElement | null>
  nodes: OntologyNode[]
  edges: OntologyEdge[]
  labels: Label[]
  selectedNodeId: string | null
  onNavigate: (t: Transform) => void
}

function MiniMap({ positions, transform, svgRef, nodes, edges, labels, selectedNodeId, onNavigate }: MiniMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDraggingRef = useRef(false)

  // Compute graph bounds
  const getBounds = useCallback(() => {
    const pos = positions.current
    if (!pos || pos.size === 0) return null
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const p of pos.values()) {
      if (p.x < minX) minX = p.x
      if (p.y < minY) minY = p.y
      if (p.x > maxX) maxX = p.x
      if (p.y > maxY) maxY = p.y
    }
    const pad = MINIMAP_PAD
    return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad }
  }, [positions])

  // Compute dynamic minimap bounds — viewport-linked (B-style)
  // Shows ~2.5x the viewport so the viewport rect fills ~40% of minimap
  const getViewBounds = useCallback(() => {
    const svg = svgRef.current
    if (!svg) return null
    const rect = svg.getBoundingClientRect()

    // Current viewport in graph coords
    const vpLeft = -transform.x / transform.scale
    const vpTop = -transform.y / transform.scale
    const vpW = rect.width / transform.scale
    const vpH = rect.height / transform.scale
    const vpCx = vpLeft + vpW / 2
    const vpCy = vpTop + vpH / 2

    // Graph bounds (for clamping)
    const graphBounds = getBounds()

    // Minimap shows 2.5x viewport, but at least covers the full graph when zoomed out
    const expand = 2.5
    let showW = vpW * expand
    let showH = vpH * expand

    // If graph bounds are available and smaller than expanded viewport, use graph bounds
    if (graphBounds) {
      const gW = graphBounds.maxX - graphBounds.minX
      const gH = graphBounds.maxY - graphBounds.minY
      showW = Math.max(showW, gW)
      showH = Math.max(showH, gH)
    }

    // Maintain minimap aspect ratio
    const aspect = MINIMAP_W / MINIMAP_H
    if (showW / showH > aspect) {
      showH = showW / aspect
    } else {
      showW = showH * aspect
    }

    return {
      minX: vpCx - showW / 2,
      minY: vpCy - showH / 2,
      maxX: vpCx + showW / 2,
      maxY: vpCy + showH / 2,
    }
  }, [svgRef, transform, getBounds])

  // Draw minimap
  useEffect(() => {
    const canvas = canvasRef.current
    const svg = svgRef.current
    if (!canvas || !svg) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = MINIMAP_W * dpr
    canvas.height = MINIMAP_H * dpr
    ctx.scale(dpr, dpr)

    // Clear
    ctx.clearRect(0, 0, MINIMAP_W, MINIMAP_H)
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
    ctx.fillRect(0, 0, MINIMAP_W, MINIMAP_H)

    const viewBounds = getViewBounds()
    if (!viewBounds) return

    const vbW = viewBounds.maxX - viewBounds.minX || 1
    const vbH = viewBounds.maxY - viewBounds.minY || 1
    const s = Math.min(MINIMAP_W / vbW, MINIMAP_H / vbH)
    const offX = (MINIMAP_W - vbW * s) / 2
    const offY = (MINIMAP_H - vbH * s) / 2

    const toMini = (gx: number, gy: number) => ({
      mx: (gx - viewBounds.minX) * s + offX,
      my: (gy - viewBounds.minY) * s + offY,
    })

    // Draw edges (thin translucent lines for cluster structure)
    const pos = positions.current
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
    ctx.lineWidth = 0.5
    for (const edge of edges) {
      const sp = pos?.get(edge.source)
      const tp = pos?.get(edge.target)
      if (!sp || !tp) continue
      const s1 = toMini(sp.x, sp.y)
      const t1 = toMini(tp.x, tp.y)
      // Skip edges fully outside minimap
      if (s1.mx < -10 && t1.mx < -10) continue
      if (s1.mx > MINIMAP_W + 10 && t1.mx > MINIMAP_W + 10) continue
      if (s1.my < -10 && t1.my < -10) continue
      if (s1.my > MINIMAP_H + 10 && t1.my > MINIMAP_H + 10) continue
      ctx.beginPath()
      ctx.moveTo(s1.mx, s1.my)
      ctx.lineTo(t1.mx, t1.my)
      ctx.stroke()
    }

    // Draw nodes with shape-aware rendering per spec
    for (const node of nodes) {
      const p = pos?.get(node.id)
      if (!p) continue
      const { mx, my } = toMini(p.x, p.y)
      if (mx < -5 || mx > MINIMAP_W + 5 || my < -5 || my > MINIMAP_H + 5) continue
      const isSelected = node.id === selectedNodeId
      const nodeType = getNodeType(node)
      const sz = isSelected ? 3 : 2

      if (isSelected) {
        ctx.fillStyle = "rgba(94, 106, 210, 1)"
        ctx.strokeStyle = "rgba(94, 106, 210, 1)"
      } else {
        const color = getNodeBaseColor(node, labels)
        ctx.fillStyle = color
        ctx.strokeStyle = color
        ctx.globalAlpha = 0.75
      }

      ctx.beginPath()
      if (nodeType === "note") {
        // Circle with light fill
        ctx.arc(mx, my, sz, 0, Math.PI * 2)
        ctx.globalAlpha = ctx.globalAlpha * 0.15
        ctx.fill()
        ctx.globalAlpha = isSelected ? 1 : 0.75
        ctx.lineWidth = 1
        ctx.stroke()
      } else if (nodeType === "tag") {
        // Double diamond — just draw front diamond for minimap
        ctx.moveTo(mx, my - sz)
        ctx.lineTo(mx + sz * 0.7, my)
        ctx.lineTo(mx, my + sz)
        ctx.lineTo(mx - sz * 0.7, my)
        ctx.closePath()
        ctx.globalAlpha = ctx.globalAlpha * 0.5
        ctx.fill()
        ctx.globalAlpha = isSelected ? 1 : 0.75
        ctx.stroke()
      } else {
        // Hexagon for wiki nodes
        for (let hi = 0; hi < 6; hi++) {
          const angle = (Math.PI / 3) * hi - Math.PI / 2
          const hx = mx + sz * Math.cos(angle)
          const hy = my + sz * Math.sin(angle)
          if (hi === 0) ctx.moveTo(hx, hy)
          else ctx.lineTo(hx, hy)
        }
        ctx.closePath()
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    // Draw viewport rectangle
    const rect = svg.getBoundingClientRect()
    const vpLeft = -transform.x / transform.scale
    const vpTop = -transform.y / transform.scale
    const vpW = rect.width / transform.scale
    const vpH = rect.height / transform.scale

    const tl = toMini(vpLeft, vpTop)
    const br = toMini(vpLeft + vpW, vpTop + vpH)
    const vpMW = br.mx - tl.mx
    const vpMH = br.my - tl.my

    // Dim area outside viewport
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)"
    ctx.fillRect(0, 0, MINIMAP_W, Math.max(0, tl.my))
    ctx.fillRect(0, Math.min(MINIMAP_H, tl.my + vpMH), MINIMAP_W, MINIMAP_H)
    ctx.fillRect(0, Math.max(0, tl.my), Math.max(0, tl.mx), Math.min(vpMH, MINIMAP_H))
    ctx.fillRect(Math.min(MINIMAP_W, tl.mx + vpMW), Math.max(0, tl.my), MINIMAP_W, Math.min(vpMH, MINIMAP_H))

    // Viewport border
    ctx.strokeStyle = "rgba(94, 106, 210, 0.85)"
    ctx.lineWidth = 1.5
    ctx.strokeRect(tl.mx, tl.my, vpMW, vpMH)
  })

  // Navigate on click/drag
  const navigateToPoint = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    const svg = svgRef.current
    if (!canvas || !svg) return

    const canvasRect = canvas.getBoundingClientRect()
    const mx = clientX - canvasRect.left
    const my = clientY - canvasRect.top

    const viewBounds = getViewBounds()
    if (!viewBounds) return

    const vbW = viewBounds.maxX - viewBounds.minX || 1
    const vbH = viewBounds.maxY - viewBounds.minY || 1
    const s = Math.min(MINIMAP_W / vbW, MINIMAP_H / vbH)
    const offX = (MINIMAP_W - vbW * s) / 2
    const offY = (MINIMAP_H - vbH * s) / 2

    // Convert minimap coords back to graph coords
    const gx = (mx - offX) / s + viewBounds.minX
    const gy = (my - offY) / s + viewBounds.minY

    // Center the main viewport on this graph point
    const svgRect = svg.getBoundingClientRect()
    const newX = -gx * transform.scale + svgRect.width / 2
    const newY = -gy * transform.scale + svgRect.height / 2

    onNavigate({ ...transform, x: newX, y: newY })
  }, [getViewBounds, svgRef, transform, onNavigate])

  const handleMouseDown = useCallback((e: ReactMouseEvent) => {
    e.stopPropagation()
    isDraggingRef.current = true
    navigateToPoint(e.clientX, e.clientY)
  }, [navigateToPoint])

  const handleMouseMove = useCallback((e: ReactMouseEvent) => {
    if (!isDraggingRef.current) return
    e.stopPropagation()
    navigateToPoint(e.clientX, e.clientY)
  }, [navigateToPoint])

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false
  }, [])

  // Zoom via scroll wheel on minimap
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation()
    e.preventDefault()

    const canvas = canvasRef.current
    const svg = svgRef.current
    if (!canvas || !svg) return

    // Compute zoom center in graph coordinates (center of current viewport)
    const svgRect = svg.getBoundingClientRect()
    const vpCenterGx = (-transform.x + svgRect.width / 2) / transform.scale
    const vpCenterGy = (-transform.y + svgRect.height / 2) / transform.scale

    // Apply zoom
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, transform.scale + delta))
    if (newScale === transform.scale) return

    // Keep viewport centered on same graph point
    const newX = -vpCenterGx * newScale + svgRect.width / 2
    const newY = -vpCenterGy * newScale + svgRect.height / 2

    onNavigate({ x: newX, y: newY, scale: newScale })
  }, [svgRef, transform, onNavigate])

  return (
    <div
      className="absolute top-3 right-3 rounded-md border border-border overflow-hidden shadow-sm"
      style={{ width: MINIMAP_W, height: MINIMAP_H }}
    >
      <canvas
        ref={canvasRef}
        width={MINIMAP_W}
        height={MINIMAP_H}
        style={{ width: MINIMAP_W, height: MINIMAP_H, cursor: "crosshair" }}
        onMouseDown={handleMouseDown as any}
        onMouseMove={handleMouseMove as any}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel as any}
      />
    </div>
  )
}

/* ── Legend sub-component ───────────────────────────────── */

interface LegendOverlayProps {
  svgRef: React.RefObject<SVGSVGElement | null>
  legendRelationTypes: [RelationType, (typeof RELATION_TYPE_CONFIG)[RelationType]][]
  hasWikilinkEdges: boolean
}

function LegendOverlay({ svgRef, legendRelationTypes, hasWikilinkEdges }: LegendOverlayProps) {
  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setSvgSize({ width: entry.contentRect.width, height: entry.contentRect.height })
      }
    })
    observer.observe(svg)
    const rect = svg.getBoundingClientRect()
    setSvgSize({ width: rect.width, height: rect.height })
    return () => observer.disconnect()
  }, [svgRef])

  const rowHeight = 18
  // Node type legend entries (always shown) + edge entries
  const nodeTypeRows = 4 // Inbox, Capture, Permanent, Wiki (separator uses row 3 space)
  const edgeRows = legendRelationTypes.length + (hasWikilinkEdges ? 1 : 0)
  const totalRows = nodeTypeRows + (edgeRows > 0 ? 1 : 0) + edgeRows // +1 for separator
  const legendH = totalRows * rowHeight + 16
  const legendW = 140
  const pad = 16

  const tx = pad
  const ty = svgSize.height > 0 ? svgSize.height - legendH - pad : pad

  if (svgSize.height === 0) return null

  // Compute edge section start offset (after node types + separator)
  const edgeSectionStart = nodeTypeRows + (edgeRows > 0 ? 1 : 0)

  return (
    <g transform={`translate(${tx},${ty})`} style={{ pointerEvents: "none" }}>
      <rect x={0} y={0} width={legendW} height={legendH} rx={6} ry={6} fill="rgba(0,0,0,0.55)" />

      {/* ── Notes (circle, by status) ── */}
      <g transform={`translate(10, ${10 + 0 * rowHeight})`}>
        <circle cx={6} cy={6} r={4} fill={GRAPH_NODE_HEX.inbox + "30"} stroke={GRAPH_NODE_HEX.inbox} strokeWidth={1.3} />
        <text x={26} y={10} fill={GRAPH_NODE_HEX.inbox} fontSize={10} fontFamily="-apple-system, system-ui, sans-serif">Inbox</text>
      </g>
      <g transform={`translate(10, ${10 + 1 * rowHeight})`}>
        <circle cx={6} cy={6} r={4} fill={GRAPH_NODE_HEX.capture + "30"} stroke={GRAPH_NODE_HEX.capture} strokeWidth={1.3} />
        <text x={26} y={10} fill={GRAPH_NODE_HEX.capture} fontSize={10} fontFamily="-apple-system, system-ui, sans-serif">Capture</text>
      </g>
      <g transform={`translate(10, ${10 + 2 * rowHeight})`}>
        <circle cx={6} cy={6} r={4} fill={GRAPH_NODE_HEX.permanent + "30"} stroke={GRAPH_NODE_HEX.permanent} strokeWidth={1.3} />
        <text x={26} y={10} fill={GRAPH_NODE_HEX.permanent} fontSize={10} fontFamily="-apple-system, system-ui, sans-serif">Permanent</text>
      </g>

      {/* Separator */}
      <line x1={8} y1={10 + 3 * rowHeight - 2} x2={legendW - 8} y2={10 + 3 * rowHeight - 2} stroke="rgba(255,255,255,0.12)" strokeWidth={0.5} />

      {/* ── Wiki (hexagon) ── */}
      <g transform={`translate(10, ${10 + 3 * rowHeight})`}>
        {(() => {
          const pts = hexagonPoints(6, 6, 4)
          return <polygon points={pts.map(p => `${p[0]},${p[1]}`).join(" ")} fill={WIKI_STATUS_HEX.article + "30"} stroke={WIKI_STATUS_HEX.article} strokeWidth={1.3} strokeLinejoin="round" />
        })()}
        <text x={26} y={10} fill={WIKI_STATUS_HEX.article} fontSize={10} fontFamily="-apple-system, system-ui, sans-serif">Wiki</text>
      </g>

      {/* Separator line before edges */}
      {edgeRows > 0 && (
        <line x1={8} y1={10 + nodeTypeRows * rowHeight - 2} x2={legendW - 8} y2={10 + nodeTypeRows * rowHeight - 2} stroke="rgba(255,255,255,0.15)" strokeWidth={0.5} />
      )}

      {/* Edge type legends */}
      {legendRelationTypes.map(([type, config], i) => (
        <g key={type} transform={`translate(10, ${10 + (edgeSectionStart + i) * rowHeight})`}>
          <line x1={0} y1={6} x2={20} y2={6} stroke={config.color} strokeWidth={1.5} />
          <polygon points="16 3.5, 20 6, 16 8.5" fill={config.color} />
          <text x={26} y={10} fill="rgba(255,255,255,0.75)" fontSize={10} fontFamily="var(--font-sans)">
            {config.label}
          </text>
        </g>
      ))}
      {hasWikilinkEdges && (
        <g transform={`translate(10, ${10 + (edgeSectionStart + legendRelationTypes.length) * rowHeight})`}>
          <line x1={0} y1={6} x2={20} y2={6} stroke="#6b7280" strokeWidth={1.5} strokeDasharray="4 2" />
          <text x={26} y={10} fill="rgba(255,255,255,0.6)" fontSize={10} fontFamily="var(--font-sans)">
            Wiki-link
          </text>
        </g>
      )}
    </g>
  )
}
