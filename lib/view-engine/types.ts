import type { Note, NoteStatus, NotePriority } from "../types"

/* ── View Context ──────────────────────────────────────── */

export type ViewContextKey =
  | "all"            // /notes
  | "pinned"         // /pinned
  | "inbox"          // /inbox
  | "capture"        // /capture
  | "permanent"      // /permanent
  | "unlinked"       // tab filter within /notes
  | "review"         // /review
  | "folder"         // /folder/[id]
  | "tag"            // /tag/[id]
  | "label"          // /label/[id]
  | "trash"          // /trash
  | "savedView"      // /views/[id] — dynamic context for saved view detail
  | "wiki"           // /wiki — wiki articles list
  | "wiki-category"  // /wiki/categories — category management
  | "graph"          // /ontology — graph view
  | "calendar"       // /calendar — calendar view
  | `query-${string}` // inline query blocks in editor

/* ── View State ────────────────────────────────────────── */

export type ViewMode = "list" | "board" | "insights" | "calendar" | "graph" | "dashboard"

export type SortField =
  | "updatedAt"
  | "createdAt"
  | "priority"
  | "title"
  | "status"
  | "links"
  | "reads"
  | "folder"
  | "label"
  // Wiki-category-specific sort fields
  | "sub"
  | "tier"
  | "parent"

export type SortDirection = "asc" | "desc"

/** Single sort step. Multiple steps form a chain (primary → secondary → tertiary). */
export interface SortRule {
  field: SortField
  direction: SortDirection
}

/** Maximum number of chained sort rules. Linear/Notion match this cap. */
export const MAX_SORT_RULES = 3

export type GroupBy =
  | "none" | "status" | "priority" | "date" | "folder" | "label" | "triage" | "linkCount"
  // Wiki-specific groupings (Notes pipeline ignores these — handled by wiki-list-pipeline)
  | "tier" | "parent"
  // Tree grouping: same root ancestor → one group, depth indentation in List view only
  | "family"
  // Hierarchy role (Root/Parent/Child/Solo) — shared by Notes + Wiki
  | "role"
  // Graph-specific grouping (Ontology view hull): tag/category for unified
  // note+wiki grouping; connections = legacy BFS connected component fallback.
  // sticker = explicit cross-entity bundling marker (Sticker entity).
  | "tag" | "category" | "connections" | "sticker"

export type GroupSortBy = "default" | "manual" | "name" | "count"

export type FilterOperator = "eq" | "neq" | "gt" | "lt"

export type FilterField =
  | "status" | "priority" | "links" | "reads" | "folder" | "label"
  | "updatedAt" | "createdAt" | "content" | "tags" | "pinned" | "reviewAt"
  | "source" | "wordCount" | "title" | "noteType"
  // Graph-specific filter fields
  | "nodeType" | "relationType" | "showWikilinks" | "showTagNodes"
  // Wiki-specific filter fields
  | "category" | "wikiTier"
  // Knowledge-graph filter fields
  | "wikiRegistered"
  // Connection filter — "show entities connected to this one in the graph".
  // Lets users do in-place backlink/linksOut filtering inside Notes/Wiki
  // views without jumping to the Ontology graph.
  // value format: "<entityId>:<direction>"  where direction ∈ both/in/out
  // - both: union of incoming + outgoing references (default)
  // - in:   only entities that REFERENCE the target (backlinks)
  // - out:  only entities REFERENCED BY the target (linksOut)
  | "connectedTo"

export interface FilterRule {
  field: FilterField
  operator: FilterOperator
  value: string
}

/** Direction modes for the "connectedTo" filter. */
export type ConnectionDirection = "both" | "in" | "out"

export interface ViewState {
  viewMode: ViewMode
  /** Multi-sort chain (primary → secondary → tertiary). Always has length >= 1. */
  sortFields: SortRule[]
  /** @deprecated mirror of sortFields[0].field. Kept in sync by setViewState; remove in v95. */
  sortField: SortField
  /** @deprecated mirror of sortFields[0].direction. Kept in sync by setViewState; remove in v95. */
  sortDirection: SortDirection
  groupBy: GroupBy
  subGroupBy: GroupBy
  filters: FilterRule[]
  visibleColumns: string[]
  showEmptyGroups: boolean
  /** View-config-specific toggle states (showArchived, showTrashed, etc.) */
  toggles: Record<string, boolean>
  /** Custom group ordering per groupBy dimension. null = natural order */
  groupOrder: Record<string, string[]> | null
  /** Custom sub-group ordering per subGroupBy dimension. null = natural order */
  subGroupOrder: Record<string, string[]> | null
  /** Sub-group sort criterion: default (natural), manual (drag), name (alpha), count (by size) */
  subGroupSortBy: GroupSortBy
  /** ── Graph-only: hidden edge state ────────────────── *
   * Visual-only filters used by the Ontology graph view to let users
   * temporarily declutter the canvas without modifying underlying data.
   * - hiddenEdgeIds: specific "src→tgt:kind" identifiers
   * - hiddenEdgeKinds: bulk kinds ("wikilink" / "tag" / relation types)
   * - isolatedNodeIds: when non-empty, only these nodes (and their edges
   *   to other isolated nodes) render at full opacity; everything else dims.
   * All cleared by "Show all" / clearing isolation in the Display popover. */
  hiddenEdgeIds?: string[]
  hiddenEdgeKinds?: string[]
  isolatedNodeIds?: string[]
}

/* ── Pipeline Types ────────────────────────────────────── */

export interface NoteGroup {
  key: string
  label: string
  notes: Note[]
  subGroups?: NoteGroup[]
  /** Per-note depth (0 = root, 1 = child, …). Only populated when groupBy="family". */
  depthMap?: Record<string, number>
}

export interface PipelineResult {
  groups: NoteGroup[]
  flatNotes: Note[]
  flatCount: number
  totalCount: number
}

export interface PipelineExtras {
  backlinksMap?: Map<string, number>
  /** Lowercase set of all wiki article titles + aliases for wikiRegistered filter */
  wikiTitles?: Set<string>
  searchQuery?: string
  folderId?: string
  tagId?: string
  labelId?: string
  showTrashed?: boolean
}

/* ── Sort Order Constants ──────────────────────────────── */

export const STATUS_ORDER: Record<NoteStatus, number> = {
  inbox: 0,
  capture: 1,
  permanent: 2,
}

export const PRIORITY_ORDER: Record<NotePriority, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
}

/* ── Valid Keys (for migration normalization) ──────────── */

export const VALID_VIEW_CONTEXT_KEYS: ViewContextKey[] = [
  "all", "pinned", "inbox", "capture", "permanent",
  "unlinked", "review", "folder", "tag", "label", "trash",
  "savedView", "wiki", "wiki-category", "graph", "calendar",
]

export const VALID_SORT_FIELDS: SortField[] = [
  "updatedAt", "createdAt", "priority", "title", "status", "links", "reads", "folder", "label",
  "sub", "tier", "parent",
]

export const VALID_GROUP_BY: GroupBy[] = [
  "none", "status", "priority", "date", "folder", "label", "triage", "linkCount",
  // Wiki-specific
  "tier", "parent",
  // Tree grouping
  "family",
  // Hierarchy role
  "role",
]

export const VALID_VIEW_MODES: ViewMode[] = ["list", "board", "insights", "calendar", "graph"]

export const VALID_GROUP_SORT_BY: GroupSortBy[] = ["default", "manual", "name", "count"]

export const VALID_COLUMNS: string[] = [
  "title", "status", "folder", "links", "reads", "wordCount", "createdAt", "updatedAt",
  // Wiki-specific columns (article list)
  "tags", "aliases",
  // Wiki-category-specific columns
  "parent", "tier", "sub",
]
