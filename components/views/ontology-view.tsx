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
import { resolveBookItems } from "@/lib/books/resolver"
import type { FilterRule, ViewContextKey, ViewState } from "@/lib/view-engine/types"
import { buildViewStateForContext } from "@/lib/view-engine/defaults"
import { rulesToOntologyFilters } from "@/lib/view-engine/graph-filter-adapter"
import type { OntologyFilters } from "@/components/ontology/ontology-graph-canvas"
import { Graph } from "@phosphor-icons/react/dist/ssr/Graph"
import { useActiveViewId } from "@/lib/table-route"
import { useSaveViewProps } from "@/lib/view-engine/use-save-view-props"
import { getEntityColor } from "@/lib/colors" // v109: opt-in color fallback

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
  // Ontology Hull P5 PR 3 — Lineage Focus. focusedNodeId !== null = mode active.
  // lineageMembers (computed below) is a Set of node ids in the focused node's
  // ancestor chain + descendant subtree. Canvas dims everything else to 0.15.
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null)

  // Graph display state from store (unified via viewStateByContext)
  const graphViewState = usePlotStore((s) => s.viewStateByContext["graph"]) ?? buildViewStateForContext("graph")
  const setViewState = usePlotStore((s) => s.setViewState)
  const updateGraphViewState = useCallback(
    (patch: Partial<ViewState>) => setViewState("graph" as ViewContextKey, patch),
    [setViewState]
  )

  // Saved view restoration — when an ontology-scoped saved view becomes active,
  // hydrate its viewState into viewStateByContext["graph"]
  const activeViewId = useActiveViewId()
  const savedViews = usePlotStore((s) => s.savedViews)
  useEffect(() => {
    if (!activeViewId) return
    const view = savedViews.find((v) => v.id === activeViewId)
    if (view && view.space === "ontology") {
      setViewState("graph" as ViewContextKey, view.viewState as Parameters<typeof setViewState>[1])
    }
  }, [activeViewId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Save view button (snapshot UX) for Ontology
  const { saveViewMode: graphSaveViewMode, onSaveView: onSaveGraphView } = useSaveViewProps("graph", "ontology")

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
  const books = usePlotStore((s) => s.books)

  // v2 Ontology Hull Phase 2 follow-up — node → bookIds mapping that
  // includes Smart Book auto items. Manual book.items[] + smartSources
  // 둘 다 resolveBookItems로 한 번에 처리 (auto re-resolve safe).
  // O(B × resolver-cost) per books/store change — books 보통 ≤20.
  const bookMembership = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const book of books) {
      if (book.trashed) continue
      const resolved = resolveBookItems(book, {
        notes, folders, wikiArticles, wikiCategories, tags, labels, stickers,
      })
      for (const item of resolved) {
        if (item.kind === "chapter-heading") continue
        const refId = (item as { refId?: string }).refId
        if (!refId) continue
        const existing = map.get(refId)
        if (existing) existing.push(book.id)
        else map.set(refId, [book.id])
      }
    }
    return map
  }, [books, notes, folders, wikiArticles, wikiCategories, tags, labels, stickers])

  // Family lineage hull (Ontology Hull P5) — node.id → root ancestor node.id.
  // Notes: parentNoteId chain (raw uuid key/value).
  // Wikis: parentArticleId chain (key/value prefixed with "wiki:" — matches
  // OntologyNode.id format produced by buildOntologyGraphData).
  // MAX_DEPTH=20 matches lib/view-engine/group.ts and wiki-list-pipeline.ts
  // (cycle guard + bounded traversal). resolveColor in canvas reads root
  // node's labelId / categoryIds[0] for color.
  const familyMembership = useMemo(() => {
    const MAX_DEPTH = 20
    const map = new Map<string, string>()
    const noteMap = new Map(notes.map((n) => [n.id, n]))
    for (const note of notes) {
      if (note.trashed) continue
      const visited = new Set<string>()
      let current = note.id
      let steps = 0
      while (steps < MAX_DEPTH) {
        if (visited.has(current)) break
        visited.add(current)
        const n = noteMap.get(current)
        if (!n || !n.parentNoteId || !noteMap.has(n.parentNoteId)) break
        current = n.parentNoteId
        steps++
      }
      map.set(note.id, current)
    }
    const wikiMap = new Map(wikiArticles.map((w) => [w.id, w]))
    for (const wiki of wikiArticles) {
      // WikiArticle has no `trashed` field — articles are deleted hard, not soft.
      const visited = new Set<string>()
      let current = wiki.id
      let steps = 0
      while (steps < MAX_DEPTH) {
        if (visited.has(current)) break
        visited.add(current)
        const w = wikiMap.get(current)
        if (!w || !w.parentArticleId || !wikiMap.has(w.parentArticleId)) break
        current = w.parentArticleId
        steps++
      }
      map.set(`wiki:${wiki.id}`, `wiki:${current}`)
    }
    return map
  }, [notes, wikiArticles])

  // Ontology Hull P5 PR 3 — Lineage Focus members. focusedNodeId의 ancestors
  // chain (parent → root) + descendants subtree (recursive children) + self.
  // Notes: parentNoteId chain + reverse lookup. Wikis: parentArticleId chain
  // + reverse lookup. node id format = OntologyNode.id (note는 raw uuid,
  // wiki는 "wiki:" prefix). null = focus inactive (canvas renders normally).
  const lineageMembers = useMemo<Set<string> | null>(() => {
    if (!focusedNodeId) return null
    const MAX_DEPTH = 20
    const set = new Set<string>([focusedNodeId])
    if (focusedNodeId.startsWith("wiki:")) {
      const startId = focusedNodeId.slice(5)
      const wikiMap = new Map(wikiArticles.map((w) => [w.id, w]))
      // Walk up (ancestors)
      let current: string | null | undefined = wikiMap.get(startId)?.parentArticleId
      const upVisited = new Set<string>()
      let steps = 0
      while (current && steps < MAX_DEPTH) {
        if (upVisited.has(current)) break
        upVisited.add(current)
        set.add(`wiki:${current}`)
        const w = wikiMap.get(current)
        if (!w) break
        current = w.parentArticleId
        steps++
      }
      // Walk down (descendants, recursive)
      const stack = [startId]
      const downVisited = new Set<string>()
      while (stack.length > 0) {
        const id = stack.pop()!
        if (downVisited.has(id)) continue
        downVisited.add(id)
        for (const w of wikiArticles) {
          if (w.parentArticleId === id) {
            set.add(`wiki:${w.id}`)
            stack.push(w.id)
          }
        }
      }
    } else {
      const noteMap = new Map(notes.map((n) => [n.id, n]))
      // Walk up (ancestors)
      let current: string | null | undefined = noteMap.get(focusedNodeId)?.parentNoteId
      const upVisited = new Set<string>()
      let steps = 0
      while (current && steps < MAX_DEPTH) {
        if (upVisited.has(current)) break
        upVisited.add(current)
        set.add(current)
        const n = noteMap.get(current)
        if (!n) break
        current = n.parentNoteId
        steps++
      }
      // Walk down (descendants, recursive)
      const stack = [focusedNodeId]
      const downVisited = new Set<string>()
      while (stack.length > 0) {
        const id = stack.pop()!
        if (downVisited.has(id)) continue
        downVisited.add(id)
        for (const n of notes) {
          if (n.parentNoteId === id) {
            set.add(n.id)
            stack.push(n.id)
          }
        }
      }
    }
    return set
  }, [focusedNodeId, notes, wikiArticles])

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

  // v2 Ontology Hull Phase 4 — picker filter. graphFilters에서
  // "hullEntity" field 값들을 Set으로 추출. 빈 set = 모든 hull 표시
  // (default). 있는 set = 그 entity ids만 hull 표시.
  const visibleHullKeys = useMemo(() => {
    const set = new Set<string>()
    for (const rule of graphFilters) {
      if (rule.field === "hullEntity") set.add(String(rule.value))
    }
    return set
  }, [graphFilters])

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
            color: t.color ?? undefined, // v109: null → undefined for FilterValue
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
      // v2 Ontology Hull Phase 4 — hullEntity values는 현재 groupBy에
      // 따라 동적 hydration. groupBy가 "none"/"connections"이면 빈
      // values (사용자가 hull source 선택해야 visible).
      if (cat.key === "hullEntity") {
        const groupBy = graphViewState.groupBy
        let values: typeof cat.values = []
        if (groupBy === "sticker") {
          values = (stickers ?? []).map((s) => ({ key: s.id, label: s.name, color: s.color }))
        } else if (groupBy === "book") {
          values = books.filter((b) => !b.trashed).map((b) => ({
            key: b.id, label: b.title || "Untitled", color: b.color ?? undefined,
          }))
        } else if (groupBy === "folder") {
          values = folders.map((f) => ({ key: f.id, label: f.name, color: (f as { color?: string }).color }))
        } else if (groupBy === "category") {
          values = wikiCategories.map((c) => ({ key: c.id, label: c.name, color: c.color }))
        } else if (groupBy === "tag") {
          values = tags.map((t) => ({ key: t.id, label: t.name, color: t.color ?? undefined }))
        } else if (groupBy === "label") {
          values = labels.map((l) => ({ key: l.id, label: l.name, color: l.color }))
        } else if (groupBy === "family") {
          // Family hull values = root entity ids (unique values in familyMembership).
          // Notes는 raw id, wikis는 "wiki:" prefix. label = root entity title.
          const rootIds = new Set(familyMembership.values())
          const list: typeof cat.values = []
          for (const rid of rootIds) {
            if (rid.startsWith("wiki:")) {
              const article = wikiArticles.find((a) => a.id === rid.slice(5))
              if (article) list.push({ key: rid, label: article.title || "Untitled" })
            } else {
              const note = notes.find((n) => n.id === rid)
              if (note) list.push({ key: rid, label: note.title || "Untitled" })
            }
          }
          values = list
        }
        return { ...cat, values }
      }
      return cat
    })
  }, [tags, labels, graph, graphViewState.groupBy, stickers, books, folders, wikiCategories, familyMembership, notes, wikiArticles])

  // Build graph data (no positions — fast, synchronous)
  const tagsMapped = useMemo(
    () => tags.map((t) => ({ id: t.id, name: t.name, color: getEntityColor(t.color) })),
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
      // OntologyNode.tags/categoryIds/folderIds for hull computation. Sticker
      // membership is derived from the `stickers` slice (옵션 D2). v107 N:M:
      // wiki articles can belong to multiple folders simultaneously.
      tags: a.tags,
      categoryIds: a.categoryIds,
      folderIds: a.folderIds ?? [],
    })),
    [wikiArticles],
  )
  const graphData = useMemo(
    () => buildOntologyGraphData(filteredNotes, relations, tagsMapped, wikiArticlesMapped, stickers),
    [filteredNotes, relations, tagsMapped, wikiArticlesMapped, stickers],
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
        searchDropdownContent={
          // Typeahead suggestions — only when query non-empty AND graph loaded
          // AND has matches. Click selects the node (canvas highlights it via
          // selectedNodeId prop) and clears query (auto-closes dropdown).
          // Cap at 10 entries; show "+N more" footer when truncated.
          searchQuery.trim() && graph && searchMatchIds && searchMatchIds.size > 0 ? (
            <div className="max-h-64 overflow-y-auto py-1">
              {graph.nodes
                .filter((n) => searchMatchIds.has(n.id))
                .slice(0, 10)
                .map((node) => (
                  <button
                    key={node.id}
                    type="button"
                    onMouseDown={(e) => {
                      // mousedown (not click) so the input's blur doesn't race
                      // with the click and dismiss the dropdown before we read it.
                      e.preventDefault()
                      setSelectedNodeId(node.id)
                      setSearchQuery("")
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-note text-foreground hover:bg-hover-bg transition-colors"
                  >
                    {/* node type marker — wiki nodes prefixed "wiki:", others raw uuid */}
                    <span
                      className={`shrink-0 w-1.5 h-1.5 rounded-full ${
                        node.id.startsWith("wiki:") ? "bg-chart-1" : "bg-muted-foreground/60"
                      }`}
                    />
                    <span className="truncate">{node.label || "Untitled"}</span>
                  </button>
                ))}
              {searchMatchIds.size > 10 && (
                <div className="px-3 py-1.5 text-2xs text-muted-foreground border-t border-border-subtle">
                  +{searchMatchIds.size - 10} more matches
                </div>
              )}
            </div>
          ) : null
        }
        saveViewMode={graphSaveViewMode}
        onSaveView={onSaveGraphView}
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
            books={books}
            bookMembership={bookMembership}
            familyMembership={familyMembership}
            lineageMembers={lineageMembers}
            focusedNodeId={focusedNodeId}
            onFocusNode={setFocusedNodeId}
            visibleHullKeys={visibleHullKeys}
            showBookSequence={Boolean(graphToggles.showBookSequence)}
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
            tags={tags.map((t) => ({ id: t.id, name: t.name, color: getEntityColor(t.color) }))}
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
