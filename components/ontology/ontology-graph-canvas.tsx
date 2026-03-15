"use client"

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  type MouseEvent as ReactMouseEvent,
  type WheelEvent as ReactWheelEvent,
} from "react"
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react"

import type { OntologyGraph, OntologyNode, OntologyEdge, OntologyEdgeKind } from "@/lib/graph"
import { RELATION_TYPE_CONFIG } from "@/lib/relation-helpers"
import type { RelationType } from "@/lib/types"

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
  selectedNodeId: string | null
  onSelectNode: (id: string | null) => void
  onOpenNote: (noteId: string) => void
}

interface Transform {
  x: number
  y: number
  scale: number
}

/* ── Constants ─────────────────────────────────────────── */

const MIN_SCALE = 0.3
const MAX_SCALE = 3.0
const ZOOM_STEP = 0.15
const LABEL_TRUNCATE = 14

/* ── Helpers ───────────────────────────────────────────── */

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "\u2026" : str
}

function nodeRadius(connectionCount: number): number {
  return Math.min(6 + connectionCount * 1.5, 16)
}

function computeFitTransform(
  nodes: OntologyNode[],
  svgWidth: number,
  svgHeight: number,
  padding = 80,
): Transform {
  if (nodes.length === 0) return { x: svgWidth / 2, y: svgHeight / 2, scale: 1 }

  const xs = nodes.map((n) => n.x)
  const ys = nodes.map((n) => n.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

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
  if (edge.kind === "wikilink") {
    return filters.showWikilinks
  }
  // Typed relation edge
  if (filters.relationTypes === "all") return true
  return (filters.relationTypes as RelationType[]).includes(edge.kind as RelationType)
}

/* ── Component ─────────────────────────────────────────── */

export function OntologyGraphCanvas({
  graph,
  filters,
  selectedNodeId,
  onSelectNode,
  onOpenNote,
}: OntologyGraphCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  /* ── State ─────────────────────────────────────────── */
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 })
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null)
  const transformRef = useRef(transform)
  useEffect(() => { transformRef.current = transform }, [transform])

  /* ── Derived: visible edges ────────────────────────── */
  const visibleEdges = graph.edges.filter((e) => isEdgeVisible(e, filters))

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

  /* ── Auto-fit on mount / graph change ─────────────── */
  useEffect(() => {
    if (graph.nodes.length === 0) return
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    setTransform(computeFitTransform(graph.nodes, rect.width, rect.height))
  }, [graph.nodes])

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
    if (!svg || graph.nodes.length === 0) return
    const rect = svg.getBoundingClientRect()
    setTransform(computeFitTransform(graph.nodes, rect.width, rect.height))
  }, [graph.nodes])

  /* ── Pan ───────────────────────────────────────────── */
  const handleMouseDown = useCallback(
    (e: ReactMouseEvent<SVGSVGElement>) => {
      if ((e.target as Element).closest("[data-graph-node]")) return
      e.preventDefault()
      dragStart.current = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y }
      setDragging(true)
    },
    [transform.x, transform.y],
  )

  const handleMouseMove = useCallback(
    (e: ReactMouseEvent<SVGSVGElement>) => {
      if (!dragging || !dragStart.current) return
      const dx = e.clientX - dragStart.current.x
      const dy = e.clientY - dragStart.current.y
      setTransform((prev) => ({
        ...prev,
        x: dragStart.current!.tx + dx,
        y: dragStart.current!.ty + dy,
      }))
    },
    [dragging],
  )

  const handleMouseUp = useCallback(() => {
    setDragging(false)
    dragStart.current = null
  }, [])

  /* ── Click on background: deselect ─────────────────── */
  const handleSvgClick = useCallback(
    (e: ReactMouseEvent<SVGSVGElement>) => {
      if ((e.target as Element).closest("[data-graph-node]")) return
      onSelectNode(null)
    },
    [onSelectNode],
  )

  /* ── Node click/dblclick ────────────────────────────── */
  const handleNodeClick = useCallback(
    (e: ReactMouseEvent, nodeId: string) => {
      e.stopPropagation()
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

  /* ── Empty state ────────────────────────────────────── */
  if (graph.nodes.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center py-20 px-8">
        <p className="text-[15px] text-muted-foreground">No notes to display.</p>
        <p className="mt-1 text-[13px] text-muted-foreground/60 max-w-sm">
          Create relations between notes or use wiki-links to build your ontology.
        </p>
      </div>
    )
  }

  /* ── Legend items ───────────────────────────────────── */
  const hasRelationEdges = visibleEdges.some((e) => e.kind !== "wikilink")
  const hasWikilinkEdges = visibleEdges.some((e) => e.kind === "wikilink")
  const showLegend = visibleEdges.length > 0

  const legendRelationTypes = Object.entries(RELATION_TYPE_CONFIG).filter(([type]) =>
    visibleEdges.some((e) => e.kind === type),
  ) as [RelationType, typeof RELATION_TYPE_CONFIG[RelationType]][]

  /* ── Render ─────────────────────────────────────────── */
  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{
          minHeight: 400,
          cursor: dragging ? "grabbing" : "grab",
          userSelect: "none",
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleSvgClick}
      >
        {/* ── Arrow marker defs ──────────────────────── */}
        <defs>
          {Object.entries(RELATION_TYPE_CONFIG).map(([type, config]) => (
            <marker
              key={type}
              id={`arrow-${type}`}
              viewBox="0 0 10 7"
              refX="10"
              refY="3.5"
              markerWidth="8"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill={config.color} />
            </marker>
          ))}
        </defs>

        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>
          {/* ── Edges ──────────────────────────────── */}
          {visibleEdges.map((edge, i) => {
            const sourceNode = graph.nodes.find((n) => n.id === edge.source)
            const targetNode = graph.nodes.find((n) => n.id === edge.target)
            if (!sourceNode || !targetNode) return null

            const isConnectedToHover =
              hoveredId !== null &&
              (edge.source === hoveredId || edge.target === hoveredId)
            const isConnectedToSelected =
              selectedNodeId !== null &&
              (edge.source === selectedNodeId || edge.target === selectedNodeId)

            const isWikilink = edge.kind === "wikilink"

            // Compute shortened line to account for node radius (arrow doesn't overlap circle)
            const dx = targetNode.x - sourceNode.x
            const dy = targetNode.y - sourceNode.y
            const dist = Math.sqrt(dx * dx + dy * dy) || 1
            const targetR = nodeRadius(targetNode.connectionCount) + 4
            const x2 = targetNode.x - (dx / dist) * targetR
            const y2 = targetNode.y - (dy / dist) * targetR

            const dimmed = (hoveredId !== null || selectedNodeId !== null) && !isConnectedToHover && !isConnectedToSelected

            if (isWikilink) {
              return (
                <line
                  key={`e-${i}`}
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke="#6b7280"
                  strokeDasharray="6 3"
                  strokeWidth={1}
                  opacity={dimmed ? 0.15 : isConnectedToHover || isConnectedToSelected ? 0.8 : 0.4}
                  style={{ transition: "opacity 0.15s" }}
                />
              )
            }

            return (
              <line
                key={`e-${i}`}
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={x2}
                y2={y2}
                stroke={RELATION_TYPE_CONFIG[edge.kind as RelationType]?.color ?? "#6b7280"}
                strokeWidth={1.5}
                opacity={dimmed ? 0.15 : isConnectedToHover || isConnectedToSelected ? 1 : 0.7}
                markerEnd={`url(#arrow-${edge.kind})`}
                style={{ transition: "opacity 0.15s" }}
              />
            )
          })}

          {/* ── Nodes ──────────────────────────────── */}
          {graph.nodes.map((node) => {
            const isSelected = selectedNodeId === node.id
            const isHovered = hoveredId === node.id
            const isConnected = connectedToHovered(node.id)
            const isHighlighted = isHovered || isConnected || isSelected

            const dimmed =
              (hoveredId !== null && !isHighlighted) ||
              (selectedNodeId !== null && !isSelected && !connectedToHovered(node.id) && selectedNodeId !== node.id)

            const r = nodeRadius(node.connectionCount)

            let fill: string
            if (isSelected) {
              fill = "hsl(var(--accent))"
            } else if (isHovered || isConnected) {
              fill = "hsl(var(--accent) / 0.7)"
            } else {
              fill = "hsl(var(--muted-foreground))"
            }

            return (
              <g
                key={node.id}
                data-graph-node
                data-node-id={node.id}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHoveredId(node.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={(e) => handleNodeClick(e, node.id)}
                onDoubleClick={(e) => handleNodeDblClick(e, node.id)}
              >
                {/* Selection ring */}
                {isSelected && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={r + 5}
                    fill="none"
                    stroke="hsl(var(--accent))"
                    strokeWidth={1.5}
                    opacity={0.4}
                  />
                )}

                {/* Node circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={r}
                  fill={fill}
                  stroke="white"
                  strokeWidth={1.5}
                  opacity={dimmed ? 0.25 : 1}
                  style={{ transition: "fill 0.15s, opacity 0.15s" }}
                />

                {/* Label */}
                <text
                  x={node.x}
                  y={node.y + r + 13}
                  textAnchor="middle"
                  fill={isHighlighted ? "var(--foreground)" : "var(--muted-foreground)"}
                  fontSize={10}
                  fontFamily="var(--font-sans)"
                  fontWeight={isSelected ? 600 : 400}
                  opacity={dimmed ? 0.3 : isHighlighted ? 1 : 0.75}
                  style={{
                    transition: "fill 0.15s, opacity 0.15s",
                    pointerEvents: "none",
                  }}
                >
                  {isHovered ? node.label : truncate(node.label, LABEL_TRUNCATE)}
                </text>
              </g>
            )
          })}
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
      <div className="absolute bottom-3 right-3 flex items-center gap-0.5 rounded-md border border-border bg-card shadow-sm">
        <button
          onClick={() => zoomBy(ZOOM_STEP)}
          className="rounded-l-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={() => zoomBy(-ZOOM_STEP)}
          className="p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <div className="h-4 w-px bg-border" />
        <button
          onClick={resetView}
          className="rounded-r-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Reset view"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

/* ── Legend sub-component ───────────────────────────────── */

interface LegendOverlayProps {
  svgRef: React.RefObject<SVGSVGElement | null>
  legendRelationTypes: [RelationType, typeof RELATION_TYPE_CONFIG[RelationType]][]
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
    // Initial size
    const rect = svg.getBoundingClientRect()
    setSvgSize({ width: rect.width, height: rect.height })
    return () => observer.disconnect()
  }, [svgRef])

  const rowHeight = 18
  const totalRows = legendRelationTypes.length + (hasWikilinkEdges ? 1 : 0)
  const legendH = totalRows * rowHeight + 16
  const legendW = 130
  const pad = 16

  const tx = pad
  const ty = svgSize.height > 0 ? svgSize.height - legendH - pad : pad

  if (svgSize.height === 0) return null

  return (
    <g transform={`translate(${tx},${ty})`} style={{ pointerEvents: "none" }}>
      {/* Background */}
      <rect
        x={0}
        y={0}
        width={legendW}
        height={legendH}
        rx={6}
        ry={6}
        fill="rgba(0,0,0,0.55)"
      />
      {/* Relation type rows */}
      {legendRelationTypes.map(([type, config], i) => (
        <g key={type} transform={`translate(10, ${10 + i * rowHeight})`}>
          <line x1={0} y1={6} x2={20} y2={6} stroke={config.color} strokeWidth={1.5} />
          <polygon
            points="16 3.5, 20 6, 16 8.5"
            fill={config.color}
          />
          <text
            x={26}
            y={10}
            fill="rgba(255,255,255,0.75)"
            fontSize={10}
            fontFamily="var(--font-sans)"
          >
            {config.label}
          </text>
        </g>
      ))}
      {/* Wikilink row */}
      {hasWikilinkEdges && (
        <g transform={`translate(10, ${10 + legendRelationTypes.length * rowHeight})`}>
          <line
            x1={0}
            y1={6}
            x2={20}
            y2={6}
            stroke="#6b7280"
            strokeWidth={1}
            strokeDasharray="4 2"
          />
          <text
            x={26}
            y={10}
            fill="rgba(255,255,255,0.6)"
            fontSize={10}
            fontFamily="var(--font-sans)"
          >
            Wiki-link
          </text>
        </g>
      )}
    </g>
  )
}
