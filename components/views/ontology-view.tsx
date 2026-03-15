"use client"

import { useState, useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import { buildOntologyGraph } from "@/lib/graph"
import { OntologyGraphCanvas, type OntologyFilters } from "@/components/ontology/ontology-graph-canvas"
import { OntologyFilterBar } from "@/components/ontology/ontology-filter-bar"
import { OntologyDetailPanel } from "@/components/ontology/ontology-detail-panel"
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

  const notes = usePlotStore((s) => s.notes)
  const relations = usePlotStore((s) => s.relations)
  const tags = usePlotStore((s) => s.tags)
  const labels = usePlotStore((s) => s.labels)
  const openNoteInLeaf = usePlotStore((s) => s.openNoteInLeaf)

  const filteredNotes = useMemo(() => applyFilters(notes, filters), [notes, filters])

  const graph = useMemo(
    () => buildOntologyGraph(filteredNotes, relations),
    [filteredNotes, relations],
  )

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <OntologyFilterBar
        filters={filters}
        onChange={setFilters}
        tags={tags}
        labels={labels}
      />
      <div className="flex flex-1 overflow-hidden">
        <OntologyGraphCanvas
          graph={graph}
          filters={filters}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
          onOpenNote={(noteId) => openNoteInLeaf(noteId)}
        />
        {selectedNodeId && (
          <OntologyDetailPanel
            noteId={selectedNodeId}
            onClose={() => setSelectedNodeId(null)}
            onOpenNote={(noteId) => openNoteInLeaf(noteId)}
          />
        )}
      </div>
    </div>
  )
}
