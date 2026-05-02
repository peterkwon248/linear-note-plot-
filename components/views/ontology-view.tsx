"use client"

import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import { usePlotStore } from "@/lib/store"
import { buildOntologyGraphData, type OntologyGraph, type OntologyNode } from "@/lib/graph"
import { OntologyGraphCanvas } from "@/components/ontology/ontology-graph-canvas"
import { OntologyDetailPanel } from "@/components/ontology/ontology-detail-panel"
// OntologyTabBar removed in Phase 7 — view mode lives in Display popover
import { OntologyInsightsPanel } from "@/components/ontology/ontology-insights-panel"
import { OntologyDashboardPanel } from "@/components/ontology/ontology-dashboard-panel"
import { ontologyLayoutClient } from "@/lib/graph/ontology-layout-client"
import type { Note } from "@/lib/types"
import { ViewHeader } from "@/components/view-header"
import { FilterPanel } from "@/components/filter-panel"
import type { FilterCategory } from "@/components/filter-panel"
import { DisplayPanel } from "@/components/display-panel"
import { GRAPH_VIEW_CONFIG } from "@/lib/view-engine/view-configs"
import type { FilterRule, ViewContextKey, ViewState } from "@/lib/view-engine/types"
import { buildViewStateForContext } from "@/lib/view-engine/defaults"
import { rulesToOntologyFilters } from "@/lib/view-engine/graph-filter-adapter"
import type { OntologyFilters } from "@/components/ontology/ontology-graph-canvas"
import { Graph } from "@phosphor-icons/react/dist/ssr/Graph"

function applyFilters(notes: Note[], filters: OntologyFilters): Note[] {
  return notes.filter((n) => {
    if (n.trashed) return false
    if (filters.status !== "all" && n.status !== filters.status) return false
    if (filters.labelId && n.labelId !== filters.labelId) return false
    if (filters.tagIds.length > 0 && !filters.tagIds.some((t) => n.tags.includes(t))) return false
    return true
  })
}

export function OntologyView() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [graph, setGraph] = useState<OntologyGraph | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [graphFilters, setGraphFilters] = useState<FilterRule[]>([])

  // Graph display state from store (unified via viewStateByContext)
  const graphViewState = usePlotStore((s) => s.viewStateByContext["graph"]) ?? buildViewStateForContext("graph")
  const setViewState = usePlotStore((s) => s.setViewState)
  const updateGraphViewState = useCallback(
    (patch: Partial<ViewState>) => setViewState("graph" as ViewContextKey, patch),
    [setViewState]
  )

  // View mode: "graph" or "insights" (lives in graphViewState.viewMode).
  // External event compatibility: legacy listeners that fire `plot:set-ontology-tab`
  // (e.g. Home's "Improve your knowledge graph" link) are still honored.
  // 3-way tab: graph (default), insights (action prompts), dashboard (raw stats).
  const tab = (
    graphViewState.viewMode === "insights" ? "insights" :
    graphViewState.viewMode === "dashboard" ? "dashboard" :
    "graph"
  ) as "graph" | "insights" | "dashboard"
  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent<{ tab?: "graph" | "insights" | "dashboard" }>).detail
      if (detail?.tab === "graph" || detail?.tab === "insights" || detail?.tab === "dashboard") {
        updateGraphViewState({ viewMode: detail.tab })
      }
    }
    window.addEventListener("plot:set-ontology-tab", handler)
    return () => window.removeEventListener("plot:set-ontology-tab", handler)
  }, [updateGraphViewState])
  const graphToggles = graphViewState?.toggles ?? { showWikilinks: true, showTagNodes: false, showNotes: true, showWiki: true }

  const handleGraphFilterToggle = (rule: FilterRule) => {
    setGraphFilters(prev => {
      const exists = prev.some(f => f.field === rule.field && f.value === rule.value)
      return exists ? prev.filter(f => !(f.field === rule.field && f.value === rule.value)) : [...prev, rule]
    })
  }

  const notes = usePlotStore((s) => s.notes)
  const relations = usePlotStore((s) => s.relations)
  const tags = usePlotStore((s) => s.tags)
  const labels = usePlotStore((s) => s.labels)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const wikiCategories = usePlotStore((s) => s.wikiCategories)
  const folders = usePlotStore((s) => s.folders)
  const stickers = usePlotStore((s) => s.stickers)
  const openNote = usePlotStore((s) => s.openNote)
  const ontologyPositions = usePlotStore((s) => s.ontologyPositions)
  const updateOntologyPositions = usePlotStore((s) => s.updateOntologyPositions)
  const sidePanelOpen = usePlotStore((s) => s.sidePanelOpen)

  // Convert FilterRule[] → OntologyFilters for the canvas
  const ontologyFilters = useMemo<OntologyFilters>(() => {
    const base = rulesToOntologyFilters(graphFilters)
    // Merge display-panel toggles into the OntologyFilters
    return {
      ...base,
      showWikilinks: graphToggles.showWikilinks ?? true,
      showTagNodes: graphToggles.showTagNodes ?? false,
      showNotes: graphToggles.showNotes ?? true,
      showWiki: graphToggles.showWiki ?? true,
    }
  }, [graphFilters, graphToggles])

  const filteredNotes = useMemo(() => applyFilters(notes, ontologyFilters), [notes, ontologyFilters])

  // Build dynamic filter categories (inject tags/labels from store)
  const dynamicCategories = useMemo<FilterCategory[]>(() => {
    const base = GRAPH_VIEW_CONFIG.filterCategories

    return base.map((cat) => {
      if (cat.key === "tags") {
        return {
          ...cat,
          values: tags.map((t) => ({
            key: t.id,
            label: t.name,
            color: t.color,
          })),
        }
      }
      if (cat.key === "label") {
        return {
          ...cat,
          values: labels.map((l) => ({
            key: l.id,
            label: l.name,
            color: l.color,
          })),
        }
      }
      if (cat.key === "relationType" && graph) {
        // Enrich relation values with edge counts
        const counts = new Map<string, number>()
        for (const edge of graph.edges) {
          if (edge.kind !== "wikilink") {
            counts.set(edge.kind, (counts.get(edge.kind) ?? 0) + 1)
          }
        }
        return {
          ...cat,
          values: cat.values.map((v) => ({
            ...v,
            count: counts.get(v.key) ?? 0,
          })),
        }
      }
      return cat
    })
  }, [tags, labels, graph])

  // Build graph data (no positions — fast, synchronous)
  const tagsMapped = useMemo(
    () => tags.map((t) => ({ id: t.id, name: t.name, color: t.color })),
    [tags],
  )
  const wikiArticlesMapped = useMemo(
    () => wikiArticles.map((a) => ({
      id: a.id,
      title: a.title,
      aliases: a.aliases,
      parentArticleId: a.parentArticleId,
      // Extract noteIds from note-ref blocks so graph can link wiki nodes to referenced notes
      noteIds: a.blocks.filter((b) => b.type === "note-ref" && b.noteId).map((b) => b.noteId as string),
      // Group-by source fields — let buildOntologyGraphData populate
      // OntologyNode.tags/categoryIds/folderId/stickerIds for hull computation.
      tags: a.tags,
      categoryIds: a.categoryIds,
      folderId: a.folderId ?? null,
      stickerIds: a.stickerIds,
    })),
    [wikiArticles],
  )
  const graphData = useMemo(
    () => buildOntologyGraphData(filteredNotes, relations, tagsMapped, wikiArticlesMapped),
    [filteredNotes, relations, tagsMapped, wikiArticlesMapped],
  )

  // Previous positions for warm-start (initialized from persisted store)
  const prevPositionsRef = useRef<Map<string, { x: number; y: number }>>(
    new Map(Object.entries(ontologyPositions))
  )

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
      labelId: n.labelId,
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
        updateOntologyPositions(Object.fromEntries(newPosMap))

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
      updateOntologyPositions(Object.fromEntries(positions))
    },
    [updateOntologyPositions],
  )

  // Search match IDs
  const searchMatchIds = useMemo(() => {
    if (!searchQuery.trim() || !graph) return null
    const q = searchQuery.toLowerCase()
    return new Set(graph.nodes.filter((n) => n.label.toLowerCase().includes(q)).map((n) => n.id))
  }, [searchQuery, graph])

  // Cleanup worker on unmount
  useEffect(() => {
    return () => ontologyLayoutClient.destroy()
  }, [])

  return (
    <main className="flex h-full flex-1 flex-col overflow-hidden bg-background">
      <ViewHeader
        icon={<Graph size={20} weight="regular" />}
        title="Ontology"
        searchPlaceholder="Search nodes..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        count={searchMatchIds ? searchMatchIds.size : undefined}
        showFilter
        hasActiveFilters={graphFilters.length > 0}
        filterContent={
          <FilterPanel
            categories={dynamicCategories}
            activeFilters={graphFilters}
            onToggle={handleGraphFilterToggle}
          />
        }
        showDisplay
        displayContent={
          <DisplayPanel
            config={GRAPH_VIEW_CONFIG.displayConfig}
            viewState={graphViewState}
            onViewStateChange={updateGraphViewState}
            // View Mode (Graph / Insights / Dashboard) lives in the sidebar's
            // More section instead — keeps Display popover focused on the
            // current view's options (group by, ordering, toggles, etc.)
            // and avoids duplicating mode entry points.
            toggleStates={graphToggles}
            onToggleChange={(key, value) =>
              updateGraphViewState({ toggles: { ...graphToggles, [key]: value } })
            }
          />
        }
        showDetailPanel
        detailPanelOpen={sidePanelOpen}
        onDetailPanelToggle={() => {
          const store = usePlotStore.getState()
          if (!store.sidePanelOpen) {
            store.setSidePanelOpen(true)
            usePlotStore.setState({ sidePanelMode: 'detail' })
          } else if (store.sidePanelMode === 'detail') {
            store.setSidePanelOpen(false)
          } else {
            usePlotStore.setState({ sidePanelMode: 'detail' })
          }
        }}
      />
      {/* View mode (Graph/Insights) is controlled via Display popover.
          Legacy tab bar removed in favor of unified Display button (Phase 7). */}

      {/* Graph: always mounted (hidden when Insights is active) so the worker
          layout never re-runs on tab switch. */}
      <div
        className={
          tab === "graph"
            ? "flex flex-1 min-h-0 overflow-hidden"
            : "hidden"
        }
      >
        {graph ? (
          <OntologyGraphCanvas
            graph={graph}
            filters={ontologyFilters}
            labels={labels}
            wikiCategories={wikiCategories}
            folders={folders}
            stickers={stickers}
            groupBy={graphViewState.groupBy}
            onRequestGroupBy={(g) => updateGraphViewState({ groupBy: g })}
            // Visual filters (declutter the canvas, no data mutation)
            hiddenEdgeIds={graphViewState.hiddenEdgeIds}
            hiddenEdgeKinds={graphViewState.hiddenEdgeKinds}
            isolatedNodeIds={graphViewState.isolatedNodeIds}
            onHideEdge={(id) =>
              updateGraphViewState({
                hiddenEdgeIds: [...(graphViewState.hiddenEdgeIds ?? []), id],
              })
            }
            onHideEdgeKind={(kind) =>
              updateGraphViewState({
                hiddenEdgeKinds: [...(graphViewState.hiddenEdgeKinds ?? []), kind],
              })
            }
            onHideNodeConnections={(nodeId) => {
              // Add every visible edge touching this node to hiddenEdgeIds.
              if (!graph) return
              const idsToHide = graph.edges
                .filter((e) => e.source === nodeId || e.target === nodeId)
                .map((e) => `${e.source}→${e.target}:${e.kind}`)
              const merged = Array.from(new Set([...(graphViewState.hiddenEdgeIds ?? []), ...idsToHide]))
              updateGraphViewState({ hiddenEdgeIds: merged })
            }}
            onIsolateNodes={(ids) =>
              updateGraphViewState({ isolatedNodeIds: ids })
            }
            onShowAll={() =>
              updateGraphViewState({
                hiddenEdgeIds: [],
                hiddenEdgeKinds: [],
                isolatedNodeIds: [],
              })
            }
            notes={filteredNotes.map((n) => ({ id: n.id, title: n.title, preview: n.preview, status: n.status, tags: n.tags }))}
            tags={tags.map((t) => ({ id: t.id, name: t.name, color: t.color }))}
            searchMatchIds={searchMatchIds}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            onOpenNote={(noteId) => openNote(noteId)}
            onPositionsUpdate={handlePositionsUpdate}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex items-center gap-2 text-note text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
              Computing layout...
            </div>
          </div>
        )}
        {selectedNodeId && (
          <OntologyDetailPanel
            noteId={selectedNodeId}
            onClose={() => setSelectedNodeId(null)}
            onOpenNote={(noteId) => openNote(noteId)}
          />
        )}
      </div>

      {/* Insights: mounted on demand. Heavy compute lives behind a useMemo
          so re-mounting just re-reads the cached result. */}
      {tab === "insights" && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <OntologyInsightsPanel />
        </div>
      )}

      {/* Dashboard: pure stats, "sabermetrics for your knowledge base".
          Distinct from Insights (which prompts actions) and from Home
          (daily entry). Mounted on demand. */}
      {tab === "dashboard" && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <OntologyDashboardPanel />
        </div>
      )}
    </main>
  )
}
