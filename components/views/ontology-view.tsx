"use client"

import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import { usePlotStore } from "@/lib/store"
import { buildOntologyGraphData, type OntologyGraph, type OntologyNode } from "@/lib/graph"
import { OntologyGraphCanvas, type OntologyFilters } from "@/components/ontology/ontology-graph-canvas"
import { OntologyFilterBar } from "@/components/ontology/ontology-filter-bar"
import { OntologyDetailPanel } from "@/components/ontology/ontology-detail-panel"
import { ontologyLayoutClient } from "@/lib/graph/ontology-layout-client"
import type { Note } from "@/lib/types"

const DEFAULT_FILTERS: OntologyFilters = {
  tagIds: [],
  labelId: null,
  status: "all",
  relationTypes: "all",
  showWikilinks: true,
}

function applyFilters(notes: Note[], filters: OntologyFilters): Note[] {
  return notes.filter((n) => {
    if (n.trashed || n.archived) return false
    if (filters.status !== "all" && n.status !== filters.status) return false
    if (filters.labelId && n.labelId !== filters.labelId) return false
    if (filters.tagIds.length > 0 && !filters.tagIds.some((t) => n.tags.includes(t))) return false
    return true
  })
}

export function OntologyView() {
  const [filters, setFilters] = useState<OntologyFilters>(DEFAULT_FILTERS)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [graph, setGraph] = useState<OntologyGraph | null>(null)

  const notes = usePlotStore((s) => s.notes)
  const relations = usePlotStore((s) => s.relations)
  const tags = usePlotStore((s) => s.tags)
  const labels = usePlotStore((s) => s.labels)
  const openNoteInLeaf = usePlotStore((s) => s.openNoteInLeaf)

  const filteredNotes = useMemo(() => applyFilters(notes, filters), [notes, filters])

  // Build graph data (no positions — fast, synchronous)
  const graphData = useMemo(
    () => buildOntologyGraphData(filteredNotes, relations),
    [filteredNotes, relations],
  )

  // Previous positions for warm-start
  const prevPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map())

  // Layout via Web Worker (async)
  useEffect(() => {
    if (graphData.nodeData.length === 0) {
      setGraph({ nodes: [], edges: [] })
      return
    }

    const prevPos = prevPositionsRef.current
    const layoutNodes = graphData.nodeData.map((n) => ({
      id: n.id,
      connectionCount: n.connectionCount,
      prevX: prevPos.get(n.id)?.x,
      prevY: prevPos.get(n.id)?.y,
    }))

    const edgesForWorker = graphData.edges.map((e) => ({
      source: e.source,
      target: e.target,
    }))

    ontologyLayoutClient
      .layout(layoutNodes, edgesForWorker, graphData.forceConfig)
      .then((positions) => {
        const posMap = new Map(positions.map((p) => [p.id, p]))
        const nodes: OntologyNode[] = graphData.nodeData.map((nd) => ({
          ...nd,
          x: posMap.get(nd.id)?.x ?? 0,
          y: posMap.get(nd.id)?.y ?? 0,
        }))

        // Save positions for next warm-start
        const newPosMap = new Map<string, { x: number; y: number }>()
        for (const n of nodes) {
          newPosMap.set(n.id, { x: n.x, y: n.y })
        }
        prevPositionsRef.current = newPosMap

        setGraph({ nodes, edges: graphData.edges })
      })
      .catch((err) => {
        if (err.message === "Cancelled") return // superseded by newer request
        // Fallback: place nodes at origin
        const nodes: OntologyNode[] = graphData.nodeData.map((nd) => ({
          ...nd,
          x: 0,
          y: 0,
        }))
        setGraph({ nodes, edges: graphData.edges })
      })
  }, [graphData])

  // Update prevPositions when graph changes (e.g., after drag in canvas)
  const handlePositionsUpdate = useCallback(
    (positions: Map<string, { x: number; y: number }>) => {
      prevPositionsRef.current = positions
    },
    [],
  )

  // Cleanup worker on unmount
  useEffect(() => {
    return () => ontologyLayoutClient.destroy()
  }, [])

  return (
    <main className="flex h-full flex-1 flex-col overflow-hidden bg-background">
      {/* ── Page title ─────────────────────────────────── */}
      <header className="flex shrink-0 items-center justify-between px-5 pt-5 pb-2">
        <h1 className="text-lg font-semibold text-foreground">Ontology</h1>
      </header>

      <OntologyFilterBar
        filters={filters}
        onChange={setFilters}
        tags={tags}
        labels={labels}
      />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {graph ? (
          <OntologyGraphCanvas
            graph={graph}
            filters={filters}
            labels={labels}
            notes={filteredNotes.map((n) => ({ id: n.id, title: n.title, preview: n.preview, status: n.status, tags: n.tags }))}
            tags={tags.map((t) => ({ id: t.id, name: t.name, color: t.color }))}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            onOpenNote={(noteId) => openNoteInLeaf(noteId)}
            onPositionsUpdate={handlePositionsUpdate}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
              Computing layout…
            </div>
          </div>
        )}
        {selectedNodeId && (
          <OntologyDetailPanel
            noteId={selectedNodeId}
            onClose={() => setSelectedNodeId(null)}
            onOpenNote={(noteId) => openNoteInLeaf(noteId)}
          />
        )}
      </div>
    </main>
  )
}
