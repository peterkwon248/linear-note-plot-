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
import { ZoomIn, ZoomOut, RotateCcw, Minimize2, Maximize2 } from "lucide-react"
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

/* ── Types ─────────────────────────────────────────────── */

export interface OntologyFilters {
  tagIds: string[]
  labelId: string | null
  status: "inbox" | "capture" | "permanent" | "all"
  relationTypes: RelationType[] | "all"
  showWikilinks: boolean
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

const MIN_SCALE = 0.3
const MAX_SCALE = 3.0
const ZOOM_STEP = 0.15
const LABEL_TRUNCATE = 18

/* ── Helpers ───────────────────────────────────────────── */

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "\u2026" : str
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
  inbox: "#f59e0b",
  capture: "#3b82f6",
  permanent: "#22c55e",
}
const DEFAULT_NODE_COLOR = "hsl(var(--muted-foreground))"

function getNodeBaseColor(node: OntologyNode, labels: Label[]): string {
  if (node.labelId) {
    const label = labels.find((l) => l.id === node.labelId)
    if (label?.color) return label.color
  }
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
        <p className="text-[15px] text-muted-foreground">No notes to display.</p>
        <p className="mt-1 text-[13px] text-muted-foreground/60 max-w-sm">
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
  const showLabels = transform.scale >= 0.5
  const showEdgeLabels = transform.scale > 0.7

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

  const culledNodes = viewBounds
    ? graph.nodes.filter((n) => {
        const pos = getPos(n.id)
        return pos.x >= viewBounds.left && pos.x <= viewBounds.right &&
               pos.y >= viewBounds.top && pos.y <= viewBounds.bottom
      })
    : graph.nodes

  const culledNodeIds = new Set(culledNodes.map((n) => n.id))

  const culledEdges = visibleEdges.filter(
    (e) => culledNodeIds.has(e.source) || culledNodeIds.has(e.target)
  )

  /* ── Cursor ────────────────────────────────────────── */
  const cursor = dragNodeIdRef.current ? "grabbing" : panning ? "grabbing" : "grab"

  /* ── Render ─────────────────────────────────────────── */
  return (
    <div
      className="relative w-full h-full"
      style={{
        backgroundImage: "radial-gradient(circle, hsl(var(--border) / 0.3) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    >
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

            if (isWikilink) {
              return (
                <g key={`e-${i}`}>
                  <path
                    d={path}
                    fill="none"
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="8 4"
                    strokeWidth={1.2}
                    opacity={dimmed ? 0.3 : isHighlighted ? 0.8 : 0.4}
                    className={isHighlighted ? "wikilink-edge-animated" : undefined}
                    filter={isHighlighted ? "url(#edge-glow)" : undefined}
                    style={{ transition: "opacity 0.2s" }}
                  />
                </g>
              )
            }

            const edgeColor = RELATION_TYPE_CONFIG[edge.kind as RelationType]?.color ?? "#6b7280"
            // Gradient stroke: lookup by source→target color pair
            const srcNode = nodeMap.get(edge.source)
            const srcColor = srcNode ? getNodeBaseColor(srcNode, labels) : edgeColor
            const tgtColor = getNodeBaseColor(targetNode, labels)
            const gradId = gradientLookup.get(`${srcColor}||${tgtColor}`)
            const strokeRef = gradId ? `url(#${gradId})` : edgeColor

            return (
              <g key={`e-${i}`}>
                {/* Shadow / halo — only on highlighted edges */}
                {isHighlighted && (
                  <path
                    d={path}
                    fill="none"
                    stroke={edgeColor}
                    strokeWidth={5}
                    opacity={0.15}
                    strokeLinecap="round"
                    style={{ pointerEvents: "none" }}
                  />
                )}
                {/* Main edge with gradient stroke */}
                <path
                  d={path}
                  fill="none"
                  stroke={strokeRef}
                  strokeWidth={isHighlighted ? 2 : 1.5}
                  opacity={dimmed ? 0.3 : isHighlighted ? 1 : 0.7}
                  markerEnd={`url(#arrow-${edge.kind})`}
                  filter={isHighlighted ? "url(#edge-glow)" : undefined}
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
                    opacity={dimmed ? 0.25 : 0.5}
                    style={{ pointerEvents: "none" }}
                    fontFamily="var(--font-sans)"
                  >
                    {RELATION_TYPE_CONFIG[edge.kind as RelationType]?.label}
                  </text>
                )}
              </g>
            )
          })}

          {/* ── Nodes ──────────────────────────────── */}
          {culledNodes.map((node) => {
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
                {/* Selection ring with pulse */}
                {isSelected && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={r + 5}
                    fill="none"
                    stroke={fill}
                    strokeWidth={2}
                    opacity={0.6}
                    key={`sel-${node.id}`}
                  >
                    <animate
                      attributeName="r"
                      values={`${r + 5};${r + 5.8};${r + 5}`}
                      dur="200ms"
                      begin="0s"
                      fill="freeze"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.4;0.6;0.4"
                      dur="200ms"
                      begin="0s"
                      fill="freeze"
                    />
                  </circle>
                )}

                {/* Multi-selection ring */}
                {isMultiSelected && !isSelected && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={r + 4}
                    fill="none"
                    stroke={fill}
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    opacity={0.7}
                  />
                )}

                {/* Node circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={r}
                  fill={fill}
                  stroke={isMultiSelected ? fill : "hsl(var(--border))"}
                  strokeWidth={isMultiSelected ? 2.5 : 1.5}
                  opacity={dimmed ? 0.65 : 1}
                  style={{ transition: "fill 0.15s, opacity 0.15s" }}
                />

                {/* Label — LOD: hide at low zoom */}
                {showLabels && (
                  <text
                    x={pos.x}
                    y={pos.y + r + 15}
                    textAnchor="middle"
                    fill={isHighlighted ? "var(--foreground)" : "var(--muted-foreground)"}
                    fontSize={11}
                    fontFamily="var(--font-sans)"
                    fontWeight={isSelected ? 600 : 400}
                    opacity={dimmed ? 0.55 : isHighlighted ? 1 : 0.75}
                    style={{
                      transition: "fill 0.15s, opacity 0.15s",
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

      {/* ── Controls overlay ────────────────────────── */}
      <div className="absolute bottom-3 right-3 flex items-center gap-px rounded-md border border-border/60 bg-card/95 backdrop-blur-sm shadow-sm">
        <button
          tabIndex={-1}
          onClick={() => adjustSpread("cluster")}
          className="rounded-l-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Cluster nodes"
        >
          <Minimize2 className="h-3.5 w-3.5" />
        </button>
        <button
          tabIndex={-1}
          onClick={() => adjustSpread("spread")}
          className="p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Spread nodes"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
        <div className="h-3.5 w-px bg-border/60" />
        <button
          tabIndex={-1}
          onClick={() => zoomBy(ZOOM_STEP)}
          className="p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Zoom in"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <button
          tabIndex={-1}
          onClick={() => zoomBy(-ZOOM_STEP)}
          className="p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Zoom out"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <div className="h-3.5 w-px bg-border/60" />
        <button
          tabIndex={-1}
          onClick={resetView}
          className="rounded-r-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Reset view"
        >
          <RotateCcw className="h-3.5 w-3.5" />
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
            style={{ left: tooltip.screenX + 12, top: tooltip.screenY - 6 }}
          >
            <div className="bg-popover/95 backdrop-blur-sm border border-border/60 rounded-md shadow-lg p-2.5 max-w-[220px]">
              <p className="text-[12px] font-medium text-foreground line-clamp-2">{note.title}</p>
              {note.preview && (
                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{note.preview}</p>
              )}
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground capitalize">
                  {note.status}
                </span>
                {nodeData && (
                  <span className="text-[9px] text-muted-foreground/60">
                    {nodeData.connectionCount} links
                  </span>
                )}
              </div>
              {noteTags.length > 0 && (
                <div className="flex gap-1 mt-1 flex-wrap">
                  {noteTags.slice(0, 4).map((t: any) => (
                    <span key={t.id} className="flex items-center gap-0.5 text-[8px] px-1 py-0.5 rounded bg-secondary/70">
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

  const rowHeight = 16
  const totalRows = legendRelationTypes.length + (hasWikilinkEdges ? 1 : 0)
  const legendH = totalRows * rowHeight + 12
  const legendW = 110
  const pad = 12

  const tx = pad
  const ty = svgSize.height > 0 ? svgSize.height - legendH - pad : pad

  if (svgSize.height === 0) return null

  return (
    <g transform={`translate(${tx},${ty})`} style={{ pointerEvents: "none" }}>
      <rect x={0} y={0} width={legendW} height={legendH} rx={4} ry={4} fill="hsl(var(--card) / 0.9)" stroke="hsl(var(--border) / 0.5)" strokeWidth={1} />
      {legendRelationTypes.map(([type, config], i) => (
        <g key={type} transform={`translate(8, ${8 + i * rowHeight})`}>
          <line x1={0} y1={5} x2={16} y2={5} stroke={config.color} strokeWidth={1.5} />
          <polygon points="13 2.5, 16 5, 13 7.5" fill={config.color} />
          <text x={22} y={8} fill="hsl(var(--muted-foreground))" fontSize={9} fontFamily="var(--font-sans)">
            {config.label}
          </text>
        </g>
      ))}
      {hasWikilinkEdges && (
        <g transform={`translate(8, ${8 + legendRelationTypes.length * rowHeight})`}>
          <line x1={0} y1={5} x2={16} y2={5} stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="3 2" />
          <text x={22} y={8} fill="hsl(var(--muted-foreground) / 0.7)" fontSize={9} fontFamily="var(--font-sans)">
            Wiki-link
          </text>
        </g>
      )}
    </g>
  )
}
