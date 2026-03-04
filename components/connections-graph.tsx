"use client"

import { useMemo, useState } from "react"
import type { Note } from "@/lib/types"

/* ── Helpers ───────────────────────────────────────────── */

/** Get notes that reference this note (backlinks) */
function getBacklinkNotes(noteId: string, notes: Note[]): Note[] {
  const note = notes.find((n) => n.id === noteId)
  if (!note || !note.title.trim()) return []
  const title = note.title.toLowerCase()
  return notes.filter((other) => {
    if (other.id === noteId) return false
    const content = other.content.toLowerCase()
    return (
      content.includes(`[[${title}]]`) ||
      (title.length > 3 && content.includes(title))
    )
  })
}

/** Get notes that this note references (forward links) */
function getForwardLinks(noteId: string, notes: Note[]): Note[] {
  const note = notes.find((n) => n.id === noteId)
  if (!note) return []
  const content = note.content.toLowerCase()
  return notes.filter((other) => {
    if (other.id === noteId) return false
    if (!other.title.trim()) return false
    const otherTitle = other.title.toLowerCase()
    return (
      content.includes(`[[${otherTitle}]]`) ||
      (otherTitle.length > 3 && content.includes(otherTitle))
    )
  })
}

interface GraphNode {
  id: string
  label: string
  x: number
  y: number
  isCenter: boolean
}

interface GraphEdge {
  from: string
  to: string
}

/* ── Layout ────────────────────────────────────────────── */

function buildGraph(
  noteId: string,
  notes: Note[]
): { nodes: GraphNode[]; edges: GraphEdge[] } {
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

  const nodes: GraphNode[] = [
    { id: note.id, label: note.title || "Untitled", x: cx, y: cy, isCenter: true },
  ]

  const edges: GraphEdge[] = []

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
  const { nodes, edges } = useMemo(
    () => buildGraph(noteId, notes),
    [noteId, notes]
  )
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  if (nodes.length <= 1) {
    return (
      <div className="flex items-center justify-center py-6">
        <p className="text-[12px] text-muted-foreground/60">
          No connections to visualize yet.
        </p>
      </div>
    )
  }

  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  return (
    <svg
      viewBox="0 0 280 200"
      className="w-full"
      style={{ maxHeight: 200 }}
    >
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
