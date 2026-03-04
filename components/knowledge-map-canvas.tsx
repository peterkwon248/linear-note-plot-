"use client"

import { useMemo, useState, useCallback } from "react"
import { usePlotStore } from "@/lib/store"
import { buildMapGraph } from "@/lib/graph"
import type { Note, KnowledgeMap } from "@/lib/types"

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max) + "..." : str
}

export function KnowledgeMapCanvas({
  map,
  notes,
  onOpenNote,
  focusNoteId,
}: {
  map: KnowledgeMap
  notes: Note[]
  onOpenNote: (id: string) => void
  focusNoteId?: string | null
}) {
  const { nodes, edges } = useMemo(
    () => buildMapGraph(map.noteIds, notes, focusNoteId),
    [map.noteIds, notes, focusNoteId]
  )
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  if (nodes.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center py-20">
        <p className="text-[13px] text-muted-foreground">No notes in this map yet.</p>
        <p className="mt-1 text-[12px] text-muted-foreground/60">
          Add notes from the command palette or note detail panel.
        </p>
      </div>
    )
  }

  // Calculate viewBox from node positions
  const padding = 60
  const minX = Math.min(...nodes.map((n) => n.x)) - padding
  const minY = Math.min(...nodes.map((n) => n.y)) - padding
  const maxX = Math.max(...nodes.map((n) => n.x)) + padding
  const maxY = Math.max(...nodes.map((n) => n.y)) + padding
  const width = Math.max(maxX - minX, 300)
  const height = Math.max(maxY - minY, 200)

  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  return (
    <svg
      viewBox={`${minX} ${minY} ${width} ${height}`}
      className="w-full h-full"
      style={{ minHeight: 400 }}
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
            strokeWidth={isHighlighted ? 2 : 1}
            opacity={isHighlighted ? 1 : 0.4}
            style={{ transition: "stroke 0.15s, opacity 0.15s" }}
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
        const isFocused = focusNoteId === node.id

        const radius = isFocused ? 10 : node.isCenter ? 8 : 6
        const opacity = node.depth === 99 ? 0.4 : node.depth > 2 ? 0.6 : node.depth > 1 ? 0.8 : 1

        return (
          <g
            key={node.id}
            style={{ cursor: "pointer" }}
            onMouseEnter={() => setHoveredId(node.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => onOpenNote(node.id)}
          >
            <circle
              cx={node.x}
              cy={node.y}
              r={radius}
              fill={
                isFocused || highlight
                  ? "var(--accent)"
                  : "var(--muted-foreground)"
              }
              opacity={highlight ? 1 : opacity}
              style={{ transition: "fill 0.15s, opacity 0.15s" }}
            />
            {isFocused && (
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
            <text
              x={node.x}
              y={node.y + radius + 12}
              textAnchor="middle"
              fill={highlight || isFocused ? "var(--foreground)" : "var(--muted-foreground)"}
              fontSize={isFocused ? 11 : 10}
              fontFamily="var(--font-sans)"
              fontWeight={isFocused ? 600 : 400}
              opacity={highlight || isFocused ? 1 : opacity * 0.8}
              style={{ transition: "fill 0.15s, opacity 0.15s" }}
            >
              {truncate(node.label, 18)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
