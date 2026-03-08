"use client"

import { useMemo, useState } from "react"
import type { Note } from "@/lib/types"
import { usePlotStore } from "@/lib/store"
import { buildFocusGraph } from "@/lib/graph"
import type { GraphNode as FocusGraphNode, GraphEdge as FocusGraphEdge } from "@/lib/graph"

/* ── Helpers ───────────────────────────────────────────── */

/** Get notes that reference this note (backlinks) — uses precomputed linksOut */
function getBacklinkNotes(noteId: string, notes: Note[]): Note[] {
  const note = notes.find((n) => n.id === noteId)
  if (!note || !note.title.trim()) return []
  const title = note.title.toLowerCase()
  return notes.filter((other) => {
    if (other.id === noteId) return false
    return other.linksOut.includes(title)
  })
}

/** Get notes that this note references (forward links) — uses precomputed linksOut */
function getForwardLinks(noteId: string, notes: Note[]): Note[] {
  const note = notes.find((n) => n.id === noteId)
  if (!note) return []
  const titleToNote = new Map<string, Note>()
  for (const n of notes) {
    if (n.id !== noteId && n.title.trim()) {
      titleToNote.set(n.title.toLowerCase(), n)
    }
  }
  const result: Note[] = []
  for (const linkTitle of note.linksOut) {
    const target = titleToNote.get(linkTitle)
    if (target) result.push(target)
  }
  return result
}

interface LocalGraphNode {
  id: string
  label: string
  x: number
  y: number
  isCenter: boolean
}

interface LocalGraphEdge {
  from: string
  to: string
}

/* ── Layout ────────────────────────────────────────────── */

function buildGraph(
  noteId: string,
  notes: Note[]
): { nodes: LocalGraphNode[]; edges: LocalGraphEdge[] } {
  const note = notes.find((n) => n.id === noteId)
  if (!note) return { nodes: [], edges: [] }

  const backlinks = getBacklinkNotes(noteId, notes)
  const forwards = getForwardLinks(noteId, notes)

  // Deduplicate connected notes
  const connectedMap = new Map<string, Note>()
  for (const n of backlinks) connectedMap.set(n.id, n)
  for (const n of forwards) connectedMap.set(n.id, n)
  const connected = Array.from(connectedMap.values()).slice(0, 8)

  const cx = 140
  const cy = 100
  const radius = 72

  const nodes: LocalGraphNode[] = [
    { id: note.id, label: note.title || "Untitled", x: cx, y: cy, isCenter: true },
  ]

  const edges: LocalGraphEdge[] = []

  connected.forEach((cn, i) => {
    const angle = (2 * Math.PI * i) / connected.length - Math.PI / 2
    const x = cx + radius * Math.cos(angle)
    const y = cy + radius * Math.sin(angle)
    nodes.push({ id: cn.id, label: cn.title || "Untitled", x, y, isCenter: false })
    edges.push({ from: note.id, to: cn.id })
  })

  return { nodes, edges }
}

/* ── Truncate label ────────────────────────────────────── */

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max) + "..." : str
}

/* ── Depth-based node appearance ───────────────────────── */

function getFocusNodeRadius(depth: number, isCenter: boolean): number {
  if (isCenter) return 10
  if (depth === 1) return 6
  if (depth === 2) return 5
  return 4
}

function getFocusNodeOpacity(depth: number, isCenter: boolean): number {
  if (isCenter) return 1
  if (depth === 1) return 0.9
  if (depth === 2) return 0.7
  return 0.5
}

/* ── Focus SVG ─────────────────────────────────────────── */

function FocusSVG({
  nodes,
  edges,
  hoveredId,
  setHoveredId,
  onOpenNote,
}: {
  nodes: FocusGraphNode[]
  edges: FocusGraphEdge[]
  hoveredId: string | null
  setHoveredId: (id: string | null) => void
  onOpenNote: (id: string) => void
}) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  return (
    <svg viewBox="0 0 400 300" className="w-full" style={{ maxHeight: 300 }}>
      {/* Edges */}
      {edges.map((edge) => {
        const from = nodeMap.get(edge.from)
        const to = nodeMap.get(edge.to)
        if (!from || !to) return null
        const isHighlighted = hoveredId === edge.from || hoveredId === edge.to
        return (
          <line
            key={`${edge.from}-${edge.to}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={isHighlighted ? "var(--accent)" : "var(--border)"}
            strokeWidth={isHighlighted ? 1.5 : 1}
            opacity={isHighlighted ? 1 : 0.5}
            style={{ transition: "stroke 0.15s, opacity 0.15s, stroke-width 0.15s" }}
          />
        )
      })}

      {/* Nodes */}
      {nodes.map((node) => {
        const isHovered = hoveredId === node.id
        const isConnectedToHovered = edges.some(
          (e) =>
            (e.from === hoveredId && e.to === node.id) ||
            (e.to === hoveredId && e.from === node.id)
        )
        const highlight = isHovered || isConnectedToHovered
        const baseOpacity = getFocusNodeOpacity(node.depth, node.isCenter)
        const r = getFocusNodeRadius(node.depth, node.isCenter)

        return (
          <g
            key={node.id}
            style={{ cursor: node.isCenter ? "default" : "pointer" }}
            onMouseEnter={() => setHoveredId(node.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => {
              if (!node.isCenter) onOpenNote(node.id)
            }}
          >
            <circle
              cx={node.x}
              cy={node.y}
              r={r}
              fill={
                node.isCenter
                  ? "var(--accent)"
                  : highlight
                    ? "var(--accent)"
                    : "var(--muted-foreground)"
              }
              opacity={highlight ? 1 : baseOpacity}
              style={{ transition: "fill 0.15s, opacity 0.15s" }}
            />
            {node.isCenter && (
              <circle
                cx={node.x}
                cy={node.y}
                r={r + 4}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={1}
                opacity={0.25}
              />
            )}
            <text
              x={node.x}
              y={node.isCenter ? node.y + r + 12 : node.y + r + 10}
              textAnchor="middle"
              fill={
                highlight || node.isCenter
                  ? "var(--foreground)"
                  : "var(--muted-foreground)"
              }
              fontSize={node.isCenter ? 10 : 9}
              fontFamily="var(--font-sans)"
              fontWeight={node.isCenter ? 600 : 400}
              opacity={highlight || node.isCenter ? 1 : baseOpacity}
              style={{ transition: "fill 0.15s, opacity 0.15s" }}
            >
              {truncate(node.label, node.isCenter ? 20 : 14)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/* ── Normal SVG ────────────────────────────────────────── */

function NormalSVG({
  nodes,
  edges,
  hoveredId,
  setHoveredId,
  onOpenNote,
}: {
  nodes: LocalGraphNode[]
  edges: LocalGraphEdge[]
  hoveredId: string | null
  setHoveredId: (id: string | null) => void
  onOpenNote: (id: string) => void
}) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  return (
    <svg viewBox="0 0 280 200" className="w-full" style={{ maxHeight: 200 }}>
      {/* Edges */}
      {edges.map((edge) => {
        const from = nodeMap.get(edge.from)
        const to = nodeMap.get(edge.to)
        if (!from || !to) return null
        const isHighlighted = hoveredId === edge.from || hoveredId === edge.to
        return (
          <line
            key={`${edge.from}-${edge.to}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={isHighlighted ? "var(--accent)" : "var(--border)"}
            strokeWidth={isHighlighted ? 1.5 : 1}
            opacity={isHighlighted ? 1 : 0.5}
            style={{ transition: "stroke 0.15s, opacity 0.15s, stroke-width 0.15s" }}
          />
        )
      })}

      {/* Nodes */}
      {nodes.map((node) => {
        const isHovered = hoveredId === node.id
        const isConnectedToHovered = edges.some(
          (e) =>
            (e.from === hoveredId && e.to === node.id) ||
            (e.to === hoveredId && e.from === node.id)
        )
        const highlight = isHovered || isConnectedToHovered

        return (
          <g
            key={node.id}
            style={{ cursor: node.isCenter ? "default" : "pointer" }}
            onMouseEnter={() => setHoveredId(node.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => {
              if (!node.isCenter) onOpenNote(node.id)
            }}
          >
            {/* Node circle */}
            <circle
              cx={node.x}
              cy={node.y}
              r={node.isCenter ? 8 : 5}
              fill={
                node.isCenter
                  ? "var(--accent)"
                  : highlight
                    ? "var(--accent)"
                    : "var(--muted-foreground)"
              }
              opacity={highlight || node.isCenter ? 1 : 0.5}
              style={{ transition: "fill 0.15s, opacity 0.15s" }}
            />
            {/* Glow ring on center */}
            {node.isCenter && (
              <circle
                cx={node.x}
                cy={node.y}
                r={12}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={1}
                opacity={0.25}
              />
            )}
            {/* Label */}
            <text
              x={node.x}
              y={node.isCenter ? node.y + 22 : node.y + 14}
              textAnchor="middle"
              fill={
                highlight || node.isCenter
                  ? "var(--foreground)"
                  : "var(--muted-foreground)"
              }
              fontSize={node.isCenter ? 10 : 9}
              fontFamily="var(--font-sans)"
              fontWeight={node.isCenter ? 600 : 400}
              opacity={highlight || node.isCenter ? 1 : 0.7}
              style={{ transition: "fill 0.15s, opacity 0.15s" }}
            >
              {truncate(node.label, node.isCenter ? 20 : 14)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/* ── Component ─────────────────────────────────────────── */

export function ConnectionsGraph({
  noteId,
  notes,
  onOpenNote,
}: {
  noteId: string
  notes: Note[]
  onOpenNote: (id: string) => void
}) {
  const graphFocusDepth = usePlotStore((s) => s.graphFocusDepth)
  const setGraphFocusDepth = usePlotStore((s) => s.setGraphFocusDepth)

  const focusResult = useMemo(
    () => (graphFocusDepth > 0 ? buildFocusGraph(noteId, notes, graphFocusDepth) : null),
    [noteId, notes, graphFocusDepth]
  )

  const normalResult = useMemo(
    () => (graphFocusDepth === 0 ? buildGraph(noteId, notes) : null),
    [noteId, notes, graphFocusDepth]
  )

  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const nodes = graphFocusDepth > 0 ? (focusResult?.nodes ?? []) : (normalResult?.nodes ?? [])
  const edges = graphFocusDepth > 0 ? (focusResult?.edges ?? []) : (normalResult?.edges ?? [])

  const isEmpty = nodes.length <= 1

  return (
    <div>
      {/* Focus toggle UI */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => setGraphFocusDepth(graphFocusDepth > 0 ? 0 : 1)}
          className={`text-[12px] px-2 py-0.5 rounded-full border transition-colors ${
            graphFocusDepth > 0
              ? "bg-accent/10 text-accent border-accent/30"
              : "bg-secondary text-muted-foreground border-border hover:text-foreground"
          }`}
        >
          Focus
        </button>
        {graphFocusDepth > 0 && (
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((d) => (
              <button
                key={d}
                onClick={() => setGraphFocusDepth(d)}
                className={`text-[11px] w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                  graphFocusDepth === d
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        )}
      </div>

      {isEmpty ? (
        <div className="flex items-center justify-center py-6">
          <p className="text-[14px] text-muted-foreground/60">
            No connections to visualize yet.
          </p>
        </div>
      ) : graphFocusDepth > 0 ? (
        <FocusSVG
          nodes={focusResult?.nodes ?? []}
          edges={focusResult?.edges ?? []}
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          onOpenNote={onOpenNote}
        />
      ) : (
        <NormalSVG
          nodes={normalResult?.nodes ?? []}
          edges={normalResult?.edges ?? []}
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          onOpenNote={onOpenNote}
        />
      )}
    </div>
  )
}
