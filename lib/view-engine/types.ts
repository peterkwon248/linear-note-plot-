import type { Note, NoteStatus, NotePriority } from "../types"

/* ── View Context ──────────────────────────────────────── */

export type ViewContextKey =
  | "all"            // /notes
  | "pinned"         // /pinned
  | "stone"          // /stone
  | "brick"          // /brick
  | "keystone"       // /keystone
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
  | "templates"      // /templates — note template list (PR template-c)
  // Group C PR-D: entity index views (tag entity list, not tag-filtered notes)
  | "tags-list"      // /library/tags — Tag entity index (PR group-c-d-1)
  | "labels-list"    // /labels — Label entity index (PR group-c-d-2)
  | "stickers"       // /stickers — Sticker entity index (PR group-c-d-3)
  | "references"     // /library/references — Reference entity index (PR group-c-d-4)
  | "files"          // /library/files — Attachment entity index (PR group-c-d-5)
  | "books"          // /books — Book entity index (books-view-engine-1)
  | `query-${string}` // inline query blocks in editor

/* ── View State ────────────────────────────────────────── */

export type ViewMode = "list" | "board" | "grid" | "insights" | "calendar" | "graph" | "dashboard" | "gallery"

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
  // Group C PR-D: entity-specific sort fields
  | "name"        // tags-list / labels-list: alphabetical name sort
  | "noteCount"   // tags-list / labels-list: attached note count
  | "memberCount" // stickers: cross-entity members count (PR group-c-d-3)
  | "fieldCount"  // references: infobox field count (PR group-c-d-4)
  | "size"        // files: attachment size in bytes (PR group-c-d-5)
  | "fileType"    // files: attachment type (image/url/file) (PR group-c-d-5)
  | "itemCount"   // books: Book.items.length (books-view-engine-2)
  | "articles"    // wiki categories: descendant article count

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
  // book (v2 Ontology Hull Phase 2) = Book.items의 refIds로 hull 멤버 결정
  // (cross-entity user curation, sticker 패턴 정합).
  | "tag" | "category" | "connections" | "sticker" | "book"
  // books-view-engine-3: book-specific grouping
  | "kind"    // Smart / Manual / Hybrid (Books)
  | "pinned"  // Pinned / Others (Books; reusable by other entities)
  // Alphabetical index grouping (replaces legacy showAlphaIndex toggle) —
  // groups by name first letter. Plot-consistent UX: every entity exposes
  // grouping in the same place rather than scattering it between a toggle
  // (Notes/Wiki/Templates/Labels) and a grouping option (Wiki Categories).
  | "firstLetter"
  // Time-bucket grouping (Today / Yesterday / This week / This month / Older).
  // Currently used by Wiki Categories; can be wired into the Notes pipeline
  // by adding a `groupByCreatedAt` helper to group.ts.
  | "createdAt"
  // Wiki article maturity (Stub / Article) — derived from block count via
  // isWikiStub(). Mirrors the Notes Stone/Brick/Block fixed-column pattern
  // so Wiki board gets the same "always N columns" visual without depending
  // on parent-chain depth (which collapses to 1 column for flat content).
  | "wikiStatus"

export type GroupSortBy = "default" | "manual" | "name" | "count"

export type FilterOperator = "eq" | "neq" | "gt" | "lt"

export type FilterField =
  | "status" | "priority" | "links" | "reads" | "folder" | "label"
  | "updatedAt" | "createdAt" | "content" | "tags" | "pinned" | "reviewAt"
  | "source" | "wordCount" | "title" | "noteType"
  // Graph-specific filter fields
  | "nodeType" | "relationType" | "showWikilinks" | "showTagNodes"
  // v2 Ontology Hull Phase 4 — hull picker (visible hull entity ids).
  // value = entity id (folder/category/tag/label/sticker/book/etc).
  | "hullEntity"
  // Wiki-specific filter fields
  | "category" | "wikiTier"
  // Knowledge-graph filter fields
  | "wikiRegistered"
  // Files-entity filter fields (PR Path-A-Step-1)
  | "type"
  // Tags-entity filter fields (PR Path-A-Step-4)
  | "colorStatus"
  // Stickers-entity filter fields (Plan §11.2 Path-A bonus)
  | "memberStatus"
  | "memberKind"
  // Books-entity filter fields (books-view-engine-2)
  | "kind"          // Smart / Manual / Hybrid (Books)
  | "sourceType"    // folder / category / tag / label / sticker (Books smart sources)
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
  stone: 0,
  brick: 1,
  keystone: 2,
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
  "all", "pinned", "stone", "brick", "keystone",
  "unlinked", "review", "folder", "tag", "label", "trash",
  "savedView", "wiki", "wiki-category", "graph", "calendar",
  // PR template-c: templates list now uses the unified view-engine pipeline.
  "templates",
  // Group C PR-D: entity index views
  "tags-list",
  "labels-list",
  "stickers",
  "references",
  "files",
  // books-view-engine-1: Book entity index
  "books",
]

export const VALID_SORT_FIELDS: SortField[] = [
  "updatedAt", "createdAt", "priority", "title", "status", "links", "reads", "folder", "label",
  "sub", "tier", "parent",
  // Group C PR-D entity-specific
  "name", "noteCount", "memberCount", "fieldCount", "size", "fileType",
  // books-view-engine-2
  "itemCount",
]

export const VALID_GROUP_BY: GroupBy[] = [
  "none", "status", "priority", "date", "folder", "label", "triage", "linkCount",
  // Wiki-specific
  "tier", "parent",
  // Tree grouping
  "family",
  // Hierarchy role
  "role",
  // Cross-entity Ontology hull groupings
  "tag", "category", "sticker", "book", "connections",
  // books-view-engine-3 (Books)
  "kind", "pinned",
]

export const VALID_VIEW_MODES: ViewMode[] = ["list", "board", "grid", "insights", "calendar", "graph", "gallery"]

export const VALID_GROUP_SORT_BY: GroupSortBy[] = ["default", "manual", "name", "count"]

export const VALID_COLUMNS: string[] = [
  "title", "status", "folder", "links", "reads", "wordCount", "createdAt", "updatedAt",
  // Wiki-specific columns (article list)
  "tags", "aliases",
  // Wiki-category-specific columns
  "parent", "tier", "sub",
  // PR e: notes board now exposes priority/label/tags as toggleable chip
  // columns so the Display popover affects the board surface too. children
  // was already rendered by notes-table; whitelist it for visibleColumns.
  "priority", "label", "children",
  // PR group-c-d-1 (Tags): Tag entity index display properties.
  // noteCount = TagNoteCountChip toggle, color = leading color dot toggle.
  "noteCount", "color",
  // PR group-c-d-3 (Stickers): cross-entity member count display property.
  "memberCount",
  // PR group-c-d-4 (References): field count + image presence display properties.
  "fieldCount", "image",
  // PR group-c-d-5 (Files): file size + file type display properties.
  "size", "fileType",
  // books-view-engine-2 (Books): item count + book kind (Smart/Manual/Hybrid)
  // display properties for list mode chips.
  // books-view-engine-6 (polish): sources + pinned toggleable columns.
  "itemCount", "kind", "sources", "pinned",
]
