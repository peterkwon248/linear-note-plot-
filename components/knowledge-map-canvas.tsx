"use client"

import {
  useMemo,
  useState,
  useCallback,
  useRef,
  useEffect,
  type MouseEvent as ReactMouseEvent,
  type WheelEvent as ReactWheelEvent,
} from "react"
import { ZoomIn, ZoomOut, RotateCcw, X } from "lucide-react"
import { toast } from "sonner"

import { buildForceGraph, buildAdjacencyList, findShortestPath } from "@/lib/graph"
import type { GraphNode, GraphEdge } from "@/lib/graph"
import type { Note, KnowledgeMap, NoteStatus } from "@/lib/types"

/* ── Types ────────────────────────────────────────────── */

export interface MapGraphFilter {
  status: NoteStatus | "all"
  linkedOnly: boolean
}

interface KnowledgeMapCanvasProps {
  map: KnowledgeMap
  notes: Note[]
  onOpenNote: (id: string) => void
  focusNoteId?: string | null
  filter?: MapGraphFilter
}

interface Transform {
  x: number
  y: number
  scale: number
}

/* ── Helpers ──────────────────────────────────────────── */

const MIN_SCALE = 0.3
const MAX_SCALE = 3.0
const ZOOM_STEP = 0.15
const LABEL_TRUNCATE = 16

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "\u2026" : str
}

function computeFitTransform(
  nodes: GraphNode[],
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

/* ── Component ────────────────────────────────────────── */

export function KnowledgeMapCanvas({
  map,
  notes,
  onOpenNote,
  focusNoteId,
  filter,
}: KnowledgeMapCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  /* ── Local state ───────────────────────────────────── */
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 })
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [pathEndpoints, setPathEndpoints] = useState<[string, string] | null>(null)
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number; label: string } | null>(null)

  /* ── Build adjacency list for path finding ─────────── */
  const adj = useMemo(() => buildAdjacencyList(notes), [notes])

  /* ── Filter visible note IDs ───────────────────────── */
  const visibleNoteIds = useMemo(() => {
    const mapNoteSet = new Set(map.noteIds)
    let filtered = notes.filter((n) => mapNoteSet.has(n.id))

    // Status filter
    if (filter && filter.status !== "all") {
      filtered = filtered.filter((n) => n.status === filter.status)
    }

    const ids = filtered.map((n) => n.id)

    // Linked-only filter: only keep notes with at least one edge in the visible set
    if (filter?.linkedOnly) {
      const idSet = new Set(ids)
      return ids.filter((id) => {
        const neighbors = adj.get(id)
        if (!neighbors) return false
        for (const neighbor of neighbors) {
          if (idSet.has(neighbor)) return true
        }
        return false
      })
    }

    return ids
  }, [map.noteIds, notes, filter, adj])

  /* ── Force graph ───────────────────────────────────── */
  const { nodes, edges } = useMemo(
    () => buildForceGraph(visibleNoteIds, notes, focusNoteId),
    [visibleNoteIds, notes, focusNoteId],
  )

  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes])
  const visibleNodeIdSet = useMemo(() => new Set(nodes.map((n) => n.id)), [nodes])

  /* ── Path computation ──────────────────────────────── */
  const pathNodeIds = useMemo(() => {
    if (!pathEndpoints) return new Set<string>()
    const path = findShortestPath(pathEndpoints[0], pathEndpoints[1], adj, visibleNodeIdSet)
    return new Set(path)
  }, [pathEndpoints, adj, visibleNodeIdSet])

  const pathEdgeKeys = useMemo(() => {
    if (!pathEndpoints || pathNodeIds.size === 0) return new Set<string>()
    const pathArr = findShortestPath(pathEndpoints[0], pathEndpoints[1], adj, visibleNodeIdSet)
    const keys = new Set<string>()
    for (let i = 0; i < pathArr.length - 1; i++) {
      keys.add([pathArr[i], pathArr[i + 1]].sort().join("-"))
    }
    return keys
  }, [pathEndpoints, adj, visibleNodeIdSet, pathNodeIds])

  const pathLength = pathNodeIds.size > 0 ? pathNodeIds.size - 1 : 0

  /* ── Auto-fit on initial render / data change ──────── */
  useEffect(() => {
    if (nodes.length === 0) return
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const fit = computeFitTransform(nodes, rect.width, rect.height)
    setTransform(fit)
  }, [nodes])

  /* ── Keyboard handler (Escape clears path) ─────────── */
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setPathEndpoints(null)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  /* ── Zoom helpers ──────────────────────────────────── */
  const zoomBy = useCallback(
    (delta: number, cx?: number, cy?: number) => {
      setTransform((prev) => {
        const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale + delta))
        if (newScale === prev.scale) return prev
        // Zoom toward center of SVG (or cursor position)
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
    },
    [],
  )

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
    if (!svg || nodes.length === 0) return
    const rect = svg.getBoundingClientRect()
    setTransform(computeFitTransform(nodes, rect.width, rect.height))
  }, [nodes])

  /* ── Pan (background drag) ─────────────────────────── */
  const handleMouseDown = useCallback(
    (e: ReactMouseEvent<SVGSVGElement>) => {
      // Only start pan if clicking on the SVG background (not a node)
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

  /* ── Node click handler ────────────────────────────── */
  const handleNodeClick = useCallback(
    (e: ReactMouseEvent, nodeId: string) => {
      e.stopPropagation()

      if (e.shiftKey) {
        // Path endpoint selection
        setPathEndpoints((prev) => {
          if (!prev) {
            // First endpoint
            return [nodeId, nodeId] as [string, string]
          }
          if (prev[0] === nodeId) {
            // Clicked same node — clear
            return null
          }
          // Second endpoint — compute path
          const path = findShortestPath(prev[0], nodeId, adj, visibleNodeIdSet)
          if (path.length === 0) {
            toast.error("No path found", {
              description: "These notes are not connected in the current view.",
              duration: 3000,
            })
            return null
          }
          return [prev[0], nodeId] as [string, string]
        })
      } else {
        // Regular click — open note and clear path
        setPathEndpoints(null)
        onOpenNote(nodeId)
      }
    },
    [adj, visibleNodeIdSet, onOpenNote],
  )

  /* ── Tooltip handlers ──────────────────────────────── */
  const handleNodeHover = useCallback(
    (e: ReactMouseEvent, node: GraphNode) => {
      setHoveredId(node.id)
      const svg = svgRef.current
      if (!svg) return
      const rect = svg.getBoundingClientRect()
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        label: node.label,
      })
    },
    [],
  )

  const handleNodeLeave = useCallback(() => {
    setHoveredId(null)
    setTooltipPos(null)
  }, [])

  const clearPath = useCallback(() => setPathEndpoints(null), [])

  /* ── Empty state ───────────────────────────────────── */
  if (nodes.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center py-20">
        <p className="text-[15px] text-muted-foreground">No notes in this map yet.</p>
        <p className="mt-1 text-[14px] text-muted-foreground/60">
          Add notes from the command palette or note detail panel.
        </p>
      </div>
    )
  }

  /* ── Render ────────────────────────────────────────── */
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
      >
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
          {/* ── Default edges ─────────────────────────── */}
          {edges.map((edge) => {
            const from = nodeMap.get(edge.from)
            const to = nodeMap.get(edge.to)
            if (!from || !to) return null

            const edgeKey = [edge.from, edge.to].sort().join("-")
            const isPathEdge = pathEdgeKeys.has(edgeKey)
            // Skip path edges here; they render on top
            if (isPathEdge) return null

            const isHoverHighlighted = hoveredId === edge.from || hoveredId === edge.to

            return (
              <line
                key={edgeKey}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={isHoverHighlighted ? "var(--accent)" : "var(--border)"}
                strokeWidth={isHoverHighlighted ? 2 : 1}
                opacity={isHoverHighlighted ? 1 : 0.4}
                style={{ transition: "stroke 0.15s, opacity 0.15s" }}
              />
            )
          })}

          {/* ── Path edges (on top) ───────────────────── */}
          {pathEndpoints &&
            pathNodeIds.size > 0 &&
            edges.map((edge) => {
              const edgeKey = [edge.from, edge.to].sort().join("-")
              if (!pathEdgeKeys.has(edgeKey)) return null

              const from = nodeMap.get(edge.from)
              const to = nodeMap.get(edge.to)
              if (!from || !to) return null

              return (
                <line
                  key={`path-${edgeKey}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="var(--accent)"
                  strokeWidth={3}
                  strokeDasharray="6 3"
                  opacity={1}
                />
              )
            })}

          {/* ── Nodes ─────────────────────────────────── */}
          {nodes.map((node) => {
            const isHovered = hoveredId === node.id
            const isConnectedToHovered = edges.some(
              (e) =>
                (e.from === hoveredId && e.to === node.id) ||
                (e.to === hoveredId && e.from === node.id),
            )
            const hoverHighlight = isHovered || isConnectedToHovered
            const isFocused = focusNoteId === node.id
            const isOnPath = pathNodeIds.has(node.id)
            const isPathEndpoint =
              pathEndpoints !== null &&
              (pathEndpoints[0] === node.id || pathEndpoints[1] === node.id)

            // Determine if this node has edges in the visible set
            const hasEdges = edges.some((e) => e.from === node.id || e.to === node.id)
            const radius = isFocused ? 12 : hasEdges ? 8 : 6

            const opacity =
              node.depth === 99 ? 0.4 : node.depth > 2 ? 0.6 : node.depth > 1 ? 0.8 : 1

            let fillColor = "var(--muted-foreground)"
            if (isOnPath || isPathEndpoint) fillColor = "var(--accent)"
            else if (isFocused || hoverHighlight) fillColor = "var(--accent)"

            const fillOpacity = hoverHighlight || isOnPath || isFocused ? 1 : opacity

            return (
              <g
                key={node.id}
                data-graph-node
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) => handleNodeHover(e, node)}
                onMouseMove={(e) => {
                  const svg = svgRef.current
                  if (!svg) return
                  const rect = svg.getBoundingClientRect()
                  setTooltipPos({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                    label: node.label,
                  })
                }}
                onMouseLeave={handleNodeLeave}
                onClick={(e) => handleNodeClick(e, node.id)}
              >
                {/* Path endpoint ring */}
                {isPathEndpoint && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={radius + 6}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    opacity={0.5}
                  />
                )}

                {/* Focus ring */}
                {isFocused && !isPathEndpoint && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={radius + 4}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth={1}
                    opacity={0.3}
                  />
                )}

                {/* Node circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={radius}
                  fill={fillColor}
                  opacity={fillOpacity}
                  style={{ transition: "fill 0.15s, opacity 0.15s" }}
                />

                {/* Label */}
                <text
                  x={node.x}
                  y={node.y + radius + 14}
                  textAnchor="middle"
                  fill={
                    hoverHighlight || isFocused || isOnPath
                      ? "var(--foreground)"
                      : "var(--muted-foreground)"
                  }
                  fontSize={isFocused ? 11 : 10}
                  fontFamily="var(--font-sans)"
                  fontWeight={isFocused || isOnPath ? 600 : 400}
                  opacity={hoverHighlight || isFocused || isOnPath ? 1 : opacity * 0.8}
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
      </svg>

      {/* ── Tooltip ───────────────────────────────────── */}
      {tooltipPos && hoveredId && (
        <div
          className="pointer-events-none absolute z-50 rounded-md border border-border bg-popover px-2.5 py-1.5 text-[12px] text-popover-foreground shadow-md"
          style={{
            left: tooltipPos.x + 12,
            top: tooltipPos.y - 28,
            maxWidth: 240,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {tooltipPos.label}
        </div>
      )}

      {/* ── Controls overlay ──────────────────────────── */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1">
        {/* Path info */}
        {pathEndpoints && pathNodeIds.size > 0 && (
          <div className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-[12px] text-muted-foreground shadow-sm mr-1">
            <span>
              Path: {pathLength} {pathLength === 1 ? "hop" : "hops"}
            </span>
            <button
              onClick={clearPath}
              className="ml-0.5 rounded p-0.5 hover:bg-muted transition-colors"
              title="Clear path"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Selecting first endpoint indicator */}
        {pathEndpoints && pathEndpoints[0] === pathEndpoints[1] && (
          <div className="flex items-center gap-1.5 rounded-md border border-accent/30 bg-card px-2.5 py-1.5 text-[12px] text-accent shadow-sm mr-1">
            <span>Shift+click another node</span>
            <button
              onClick={clearPath}
              className="ml-0.5 rounded p-0.5 hover:bg-muted transition-colors"
              title="Cancel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Zoom & reset buttons */}
        <div className="flex items-center gap-0.5 rounded-md border border-border bg-card shadow-sm">
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
    </div>
  )
}
