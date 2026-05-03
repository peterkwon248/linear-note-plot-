export type NoteStatus = "inbox" | "capture" | "permanent"
export type NotePriority = "none" | "urgent" | "high" | "medium" | "low"
/** Triage status for inbox notes */
export type TriageStatus = "untriaged" | "kept" | "snoozed" | "trashed"

/** Source of note creation */
export type NoteSource = "manual" | "webclip" | "import" | "share" | "api" | null

/** Note type discriminator — replaces legacy isWiki boolean */
export type NoteType = "note" | "wiki"

/** Wiki article layout mode */
export type WikiLayout = "default" | "encyclopedia"

/** Activity Bar spaces — top-level navigation */
export type ActivitySpace = "home" | "notes" | "wiki" | "calendar" | "ontology" | "library"

export interface WikiInfoboxEntry {
  key: string
  value: string
  /**
   * Tier 1-4 / PR1:
   * - "section" = section divider row (bold + tinted bg, value hidden, NOT collapsible).
   * - "group-header" = collapsible group header (chevron + label). Owns rows until next group-header.
   * - "field" or undefined = normal key/value row
   */
  type?: "field" | "section" | "group-header"
  /** group-header only: optional row background color (rgba/hex). null/undefined = default tinted bg. */
  color?: string | null
  /** group-header only: whether the group is collapsed by default on first render. */
  defaultCollapsed?: boolean
}

/**
 * Infobox preset — selects a domain-specific seed of fields/groups for a wiki article.
 * Persisted on WikiArticle.infoboxPreset. "custom" = user-curated, no seed applied.
 */
export type WikiInfoboxPreset =
  | "custom"
  | "person"
  | "character"
  | "place"
  | "organization"
  | "work-film"
  | "work-book"
  | "work-music"
  | "work-game"
  | "event"
  | "concept"

/** Item in a wiki article's collection (staging area for related material) */
export interface WikiCollectionItem {
  id: string
  type: 'note' | 'url' | 'image' | 'text' | 'file'
  /** Referenced note ID (for type='note') */
  sourceNoteId?: string
  /** URL reference (for type='url') */
  url?: string
  /** Title for URL or display name */
  urlTitle?: string
  /** Freeform text (for type='text') */
  text?: string
  /** Attachment ID in IDB (for type='file' | 'image') */
  attachmentId?: string
  /** File name (for type='file' | 'image') */
  fileName?: string
  /** File size in bytes (for type='file' | 'image') */
  fileSize?: number
  /** MIME type (for type='file' | 'image') */
  fileMimeType?: string
  /** When the item was added */
  addedAt: string
}

/* ── Wiki Category (DAG) ──────────────────────────── */

/** A wiki category node — forms a DAG (multiple parents allowed) */
export interface WikiCategory {
  id: string
  name: string
  parentIds: string[]  // multiple parents = DAG
  description?: string
  color: string        // Graph hull color for grouping visualization
  createdAt: string
  updatedAt: string
}

/* ── Wiki Article (Assembly Model) ────────────────── */

/** Wiki block types — building blocks of a wiki article */
export type WikiBlockType = 'section' | 'text' | 'note-ref' | 'image' | 'table' | 'url' | 'navbox' | 'nav' | 'banner'

/**
 * Per-group font size fine-tuning. Applied as a multiplier on top of
 * `WikiArticle.fontSize` (global). undefined = 1× (no change).
 *
 * Computed final size = baseEm × fontSize × scales[group]
 * Range: 0.7 ~ 1.6 (clamped in UI).
 */
export interface WikiFontScales {
  title?: number      // h1 article title
  heading?: number    // section h2/h3/h4
  body?: number       // paragraph + table cells + note-ref preview
  infobox?: number    // infobox header/group/field key/value
  meta?: number       // TOC + footnotes + references
  misc?: number       // navbox + banner
}

/** Navigation block slot — prev/current/next segment */
export interface WikiNavSlot {
  /** Optional linked article. When set, clicking navigates there. */
  articleId?: string
  /** Display text (overrides article title if both present). */
  text: string
  /** Optional subtext below text (e.g., "(2022~2024)"). */
  subtext?: string
}

/* ── Navbox (PR2: 다단 헤더 + 그룹 + 색상) ─────────────── */

/** Target type for a navbox item — wiki article, note, or external URL. */
export type NavboxItemTargetType = "wiki" | "note" | "url"

/** Single clickable item inside a navbox group. */
export interface NavboxItem {
  id: string
  /** Display label. If empty, falls back to target's title (wiki/note). */
  label: string
  /** What kind of target this item points to. */
  targetType?: NavboxItemTargetType
  /** Wiki article id or note id, depending on targetType. */
  targetId?: string | null
  /** External URL (when targetType === "url"). */
  url?: string | null
}

/** A row-grouping inside a navbox (e.g. "초대~제4대"). */
export interface NavboxGroup {
  id: string
  /** Group header label text. */
  label: string
  /** Group label row background (rgba/hex). null = default tinted bg. */
  labelColor?: string | null
  /** Item row background color (rgba/hex). null = default. */
  itemColor?: string | null
  /** Whether the group starts collapsed on first render. */
  collapsedByDefault?: boolean
  /** Items in this group, displayed as a grid. */
  items: NavboxItem[]
}

/** A single block in a wiki article */
export interface WikiBlock {
  id: string
  type: WikiBlockType
  /** Section: heading title */
  title?: string
  /** Section: heading level (2 = H2, 3 = H3, etc.) */
  level?: number
  /** Section: whether the section is collapsed in view */
  collapsed?: boolean
  /** Note reference: ID of the source note whose content is embedded */
  noteId?: string
  /** Text: directly authored wiki content (plaintext) */
  content?: string
  /** Text: TipTap JSON document (rich text) — used when available, content is plaintext fallback */
  contentJson?: Record<string, unknown>
  /** Image: attachment blob ID in IDB */
  attachmentId?: string
  /** Image: caption text */
  caption?: string
  /** Image: display width as percentage (25-100), default 100 */
  imageWidth?: number
  /** URL: embedded link */
  url?: string
  /** URL: title/label for the link */
  urlTitle?: string
  /** Table: caption text */
  tableCaption?: string
  /** Table: header row cells */
  tableHeaders?: string[]
  /** Table: data rows (array of string arrays) */
  tableRows?: string[][]
  /** Table: column alignment */
  tableColumnAligns?: ("left" | "center" | "right")[]
  /** Table: block position alignment (left/center/right) */
  tableAlign?: "left" | "center" | "right"
  /** Section: custom font size multiplier (1 = default, 0.8 = small, 1.2 = large, 1.5 = x-large) */
  fontSize?: number
  /** Text: editor width in edit mode (px). Null = full width */
  editorWidth?: number | null
  /** Text: editor height in edit mode (px). Null = auto height */
  editorHeight?: number | null
  /** Navbox mode: "category" auto-pulls from a category, "manual" uses curated list. Default "category". */
  navboxMode?: "category" | "manual"
  /** Navbox (category mode): target category id. */
  navboxCategoryId?: string
  /** Navbox (manual mode, legacy single-group): explicit article id list. Migrated to navboxGroups[0].items in v84. */
  navboxArticleIds?: string[]
  /** Navbox: optional custom title override. If omitted, category name is used. */
  navboxTitle?: string
  /** Navbox: grid columns (1-6, default 4). Widened to 1-6 in PR2. */
  navboxColumns?: 1 | 2 | 3 | 4 | 5 | 6
  /** Navbox PR2: header background color (rgba/hex). null/undefined = default. */
  navboxHeaderColor?: string | null
  /** Navbox PR2: header left icon image URL (optional). */
  navboxHeaderImage?: string | null
  /** Navbox PR2: groups (each with own label + items). The main multi-tier structure. */
  navboxGroups?: NavboxGroup[]
  /** Navbox PR2: footer caption text (e.g., classification breadcrumbs). */
  navboxFooterText?: string
  /** Navbox PR2: whether the entire box is collapsed by default on first render. */
  navboxCollapsedByDefault?: boolean
  /** Navigation: banner/header title (e.g., "Series name / Week N") */
  navTitle?: string
  /** Navigation: previous slot (left column, typically has articleId). */
  navPrev?: WikiNavSlot
  /** Navigation: current slot (middle column, defaults to owning article title). */
  navCurrent?: WikiNavSlot
  /** Navigation: next slot (right column, typically has articleId). */
  navNext?: WikiNavSlot
  /** Navigation PR2: header bg color override. null = default tinted. */
  navHeaderColor?: string | null
  /** Navigation PR2: header left icon image URL. */
  navHeaderImage?: string | null
  /** Banner: subtitle text (small line under title). Banner reuses `title` for the headline. */
  bannerSubtitle?: string
  /** Banner: background color (rgba/hex). null/undefined = default bg-secondary/40. */
  bannerBgColor?: string | null
  /** Banner v2: secondary color used for `bannerBgStyle === "gradient"`. null = auto-fade. */
  bannerBgColorEnd?: string | null
  /** Banner v2: leading icon key (megaphone | warning | info | lightbulb | star | sparkle | bookmark | pushpin). */
  bannerIcon?: string
  /** Banner v2: layout density. */
  bannerSize?: "compact" | "default" | "hero"
  /** Banner v2: visual treatment of the color (solid box / left stripe / gradient fade). */
  bannerBgStyle?: "solid" | "stripe" | "gradient"
  /** Merge history: snapshot of the merged article for unmerge */
  mergedFrom?: WikiMergeSnapshot
}

/** Snapshot of a merged article — stored on the divider section block for unmerge */
export interface WikiMergeSnapshot {
  articleId: string
  title: string
  aliases: string[]
  tags: string[]
  infobox: WikiInfoboxEntry[]
  blockIds: string[]       // IDs of blocks that came from this merged article
  blocks: WikiBlock[]      // full block data for restoration (deep clone)
  mergedAt: string
}

/** Lightweight section index entry — persisted in Zustand (blocks go to IDB) */
export interface WikiSectionIndex {
  id: string           // section block ID
  title: string        // section heading text
  level: number        // heading level (2, 3, etc.)
  blockCount: number   // blocks under this section (until next same-or-higher level section)
  collapsed?: boolean
}

/**
 * Wiki Article — a curated article assembled from notes and original content.
 * Separate entity from Note. Notes are raw material; WikiArticles are the compiled product.
 *
 * `blocks` stays in-memory for fast access but is stripped from Zustand persist.
 * Block metadata is stored in IDB (plot-wiki-block-meta).
 * `sectionIndex` is a lightweight summary persisted in Zustand.
 */
export interface WikiArticle {
  id: string
  title: string
  aliases: string[]
  infobox: WikiInfoboxEntry[]
  /** Tier 1-2: Infobox header background color (null/undefined = default bg-secondary/30). Raw CSS color (rgba/hex). */
  infoboxHeaderColor?: string | null
  /** PR1: domain preset (drives default header color and seed entries). Default "custom". */
  infoboxPreset?: WikiInfoboxPreset
  blocks: WikiBlock[]
  sectionIndex: WikiSectionIndex[]
  tags: string[]
  categoryIds?: string[]           // references to WikiCategory.id (DAG)
  /** Folder membership (mirrors Note.folderId). Enables unified note+wiki grouping by folder. */
  folderId?: string | null
  // Sticker membership lives on Sticker.members[] (옵션 D2). Reverse
  // lookup via `useStickerMembers({ kind: "wiki", id })` hook.
  layout?: WikiLayout              // article layout mode (default: "default")
  fontSize?: number                // global font size multiplier (0.85=S, 1=M default, 1.15=L, 1.3=XL)
  fontScales?: WikiFontScales      // per-group fine-tune multipliers (relative to global). undefined = 1×
  contentAlign?: "left" | "center" // content alignment (undefined = "left")
  linksOut?: string[]              // extracted [[wiki-links]] from text blocks
  referenceIds?: string[]              // linked Reference IDs (bibliography, not inline footnotes)
  mergeHistory?: WikiMergeSnapshot[]  // snapshots from N→1 merge for unmerge
  /** Parent article ID for hierarchy (single-parent tree). Null = root. Separate from WikiCategory. */
  parentArticleId?: string | null
  /** Whole-article pin (mirrors Note.pinned). Surfaces in Home > Quicklinks. */
  pinned?: boolean
  /** View count — incremented each time the article is opened. 0 by default. */
  reads?: number
  createdAt: string
  updatedAt: string
}

/** Saved custom view — user-defined filter/sort/grouping combination */
export interface SavedView {
  id: string
  name: string
  description?: string
  icon?: string
  color: string
  space: "inbox" | "notes" | "wiki" | "calendar" | "ontology" | "all"
  viewState: {
    viewMode: "list" | "table" | "board" | "insights" | "calendar" | "graph" | "dashboard"
    sortField: string
    sortDirection: "asc" | "desc"
    groupBy: string
    filters: Array<{ field: string; operator: string; value: string }>
    visibleColumns: string[]
    showEmptyGroups: boolean
  }
  pinned: boolean
  pinnedOrder: number
  createdAt: string
  updatedAt: string
}

export interface Note {
  id: string
  title: string
  content: string
  contentJson: Record<string, unknown> | null
  folderId: string | null
  tags: string[]
  // Sticker membership lives on Sticker.members[] (옵션 D2). Reverse
  // lookup via `useStickerMembers({ kind: "note", id })` hook.
  labelId: string | null
  status: NoteStatus
  priority: NotePriority
  reads: number
  pinned: boolean
  trashed: boolean
  createdAt: string
  updatedAt: string

  /* ── Workflow fields ─────────────────────────────── */
  triageStatus: TriageStatus
  reviewAt: string | null
  inboxRank: number
  summary: string | null
  source: NoteSource
  promotedAt: string | null
  lastTouchedAt: string
  snoozeCount: number
  trashedAt: string | null

  /* ── Thread ──────────────────────────────────────── */
  parentNoteId: string | null

  /* ── Wiki ──────────────────────────────────────── */
  noteType: NoteType
  aliases: string[]
  wikiInfobox: WikiInfoboxEntry[]

  /* ── References ─────────────────────────────── */
  referenceIds: string[]    // linked Reference IDs (bibliography)

  /* ── Precomputed (from content, for performance) ── */
  preview: string          // first ~120 chars of plaintext (for list display)
  linksOut: string[]       // extracted [[wiki-link]] targets, lowercased
}

/** Note body stored in IndexedDB (separated from meta for perf) */
export interface NoteBody {
  id: string
  content: string
  contentJson: Record<string, unknown> | null
}

export interface Folder {
  id: string
  name: string
  color: string
  parentId: string | null
  lastAccessedAt: string | null
  pinned: boolean
  pinnedOrder: number
  createdAt: string
}

export interface Tag {
  id: string
  name: string
  color: string
  trashed?: boolean
  trashedAt?: string | null
}

export interface Reference {
  id: string
  title: string           // 짧은 레이블 (e.g. "사피엔스 p.42")
  content: string         // 자유 텍스트 설명 (plain text, 검색용)
  contentJson?: Record<string, unknown> | null  // 리치텍스트 (TipTap JSON)
  fields: Array<{ key: string; value: string }>  // 인포박스식 메타데이터
  tags?: string[]         // 글로벌 태그 공유
  imageUrl?: string | null  // 각주/참조에 첨부된 이미지 URL
  createdAt: string
  updatedAt: string
  trashed?: boolean
  trashedAt?: string | null
  history: Array<{
    timestamp: string
    action: "created" | "edited" | "linked" | "unlinked"
    detail?: string
  }>
}

export interface Label {
  id: string
  name: string
  color: string
  trashed?: boolean
  trashedAt?: string | null
}

/**
 * EntityKind — discriminator for cross-entity references.
 *
 * Plot's "cross-everything" containers (Sticker v2, future Book) need to
 * point at heterogeneous entity types. EntityRef uses this kind tag to
 * disambiguate IDs that may collide across slices.
 */
export type EntityKind =
  | "note"
  | "wiki"
  | "tag"
  | "label"
  | "category"
  | "file"
  | "reference"

/**
 * EntityRef — typed pointer to any first-class entity in the store.
 *
 * Used by cross-entity containers (Sticker.members[]) instead of bare ID
 * strings. The `kind` discriminator removes ambiguity when the same ID
 * could exist in multiple slices.
 */
export interface EntityRef {
  kind: EntityKind
  id: string
}

/**
 * Sticker — a free-form, cross-entity grouping marker.
 *
 * Unlike Label (note-only color category) or WikiCategory (wiki-only DAG),
 * a Sticker can be attached to ANY entity: notes, wikis, tags, labels,
 * categories, files, references. It exists for the user intent:
 * "I just want to bundle these together — not necessarily by topic,
 * label, or category."
 *
 * Data model: **single forward reference** (옵션 D2). Membership lives
 * on the Sticker (`members[]`), not on each entity. Reverse lookup is
 * provided by the `useStickerMembers` hook (memoized index).
 *
 * Multi-membership: a single entity can carry multiple stickers (hulls
 * may overlap in the graph). Color drives the graph hull when grouping
 * by sticker.
 */
export interface Sticker {
  id: string
  name: string
  color: string
  /** Cross-entity membership (옵션 D2 — single forward reference). */
  members: EntityRef[]
  trashed?: boolean
  trashedAt?: string | null
  createdAt: string
}

/* ── Autopilot Rules ─────────────────────────────── */

export type AutopilotTrigger = "on_save" | "on_open" | "on_interval"

export type AutopilotConditionField =
  | "status" | "priority" | "content_length" | "word_count"
  | "reads" | "age_days" | "has_links" | "has_tags" | "has_label"
  | "has_folder" | "link_count" | "tag_count" | "title_length"
  | "snooze_count" | "triage_status"

export type AutopilotConditionOperator =
  | "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "not_contains"

export interface AutopilotCondition {
  field: AutopilotConditionField
  operator: AutopilotConditionOperator
  value: string | number | boolean
}

export type AutopilotActionType =
  | "set_status" | "set_priority" | "set_label" | "set_triage"
  | "pin" | "add_tag" | "remove_tag"

export interface AutopilotAction {
  type: AutopilotActionType
  value?: string  // status value, priority value, labelId, tagId, etc.
}

export interface AutopilotRule {
  id: string
  name: string
  description: string
  enabled: boolean
  trigger: AutopilotTrigger
  conditions: AutopilotCondition[]  // AND logic: all must match
  actions: AutopilotAction[]         // executed sequentially
  createdAt: string
  updatedAt: string
}

export interface AutopilotLogEntry {
  id: string
  ruleId: string
  ruleName: string
  noteId: string
  noteTitle: string
  actions: AutopilotAction[]
  at: string
  undone: boolean
}

/* ── Note Templates ──────────────────────────────── */

export interface NoteTemplate {
  id: string
  name: string
  description: string
  // Note: `icon` (emoji) and `color` (hex) fields were removed in v102.
  // Templates take their visual cues from the linked `labelId` like notes
  // do — single source of truth. Migration v102 strips the legacy fields.
  // Pre-filled fields
  title: string          // template for title (can contain {date}, {time} placeholders)
  content: string        // markdown body template
  contentJson: Record<string, unknown> | null  // TipTap JSON content
  status: NoteStatus
  priority: NotePriority
  labelId: string | null
  tags: string[]         // tag IDs
  folderId: string | null
  // Meta
  pinned: boolean
  trashed?: boolean
  trashedAt?: string | null
  createdAt: string
  updatedAt: string
}

export type ActiveView =
  | { type: "inbox" }
  | { type: "all" }
  | { type: "folder"; folderId: string }
  | { type: "templates" }
  | { type: "insights" }
  | { type: "pinned" }
  | { type: "tag"; tagId: string }
  | { type: "settings" }

/** Route-based note filter, used by each page route */
export type NoteFilter =
  | { type: "inbox" }
  | { type: "all" }
  | { type: "trash" }
  | { type: "pinned" }
  | { type: "folder"; folderId: string }
  | { type: "tag"; tagId: string }
  | { type: "status-inbox" }
  | { type: "status-capture" }
  | { type: "status-permanent" }

/* ── Phase 2: Event Log / Timeline ──────────────────── */

export type NoteEventType =
  | "created" | "updated" | "opened" | "promoted" | "trashed" | "untrashed"
  | "triage_keep" | "triage_snooze" | "triage_trash"
  | "link_added" | "link_removed"
  | "thread_started" | "thread_step_added" | "thread_ended" | "thread_deleted"
  | "label_changed"
  | "srs_reviewed"
  | "autopilot_applied"
  | "relation_added" | "relation_removed" | "relation_type_changed"
  | "alias_changed" | "wiki_converted" | "attachment_added" | "attachment_removed"
  | "reflection_added"
  | "split"

export interface NoteEvent {
  id: string
  noteId: string
  type: NoteEventType
  at: string
  meta?: Record<string, unknown>
}

/* ── Phase 2: Thread ────────────────────────────────── */

export interface ThreadStep {
  id: string
  at: string
  text: string
  parentId: string | null
}

export interface Thread {
  id: string
  noteId: string
  startedAt: string
  endedAt: string | null
  steps: ThreadStep[]
  status: "active" | "done"
}

/* ── Relations ─────────────────────────────────────── */

export type RelationType = "related-to" | "inspired-by" | "contradicts" | "extends" | "depends-on"

export interface Relation {
  id: string
  sourceNoteId: string
  targetNoteId: string
  type: RelationType
  createdAt: string
}

/* ── Attachments ──────────────────────────────────── */

export type AttachmentType = "image" | "url" | "file"

export interface Attachment {
  id: string
  noteId: string
  name: string
  type: AttachmentType
  url: string
  mimeType: string
  size: number
  createdAt: string
  trashed?: boolean
  trashedAt?: string | null
}

/* ── Ontology Data ────────────────────────────────── */

export interface CoOccurrence {
  conceptA: string
  conceptB: string
  count: number
  noteIds: string[]
}

export interface RelationSuggestion {
  id: string
  sourceNoteId: string
  targetNoteId: string
  suggestedType: RelationType
  coOccurrenceCount: number
  reason: string
  status: "pending" | "accepted" | "dismissed"
  createdAt: string
}

/** Auto-detected cluster of related notes that could form a wiki article */
export interface WikiClusterSuggestion {
  id: string
  conceptTitles: string[]
  noteIds: string[]
  strength: number        // 0-1 density score
  status: "pending" | "accepted" | "dismissed"
  createdAt: string
}

/* ── Global Bookmarks ─────────────────────────────── */

export interface GlobalBookmark {
  id: string
  /** Target entity id — noteId for notes, articleId for wiki articles. */
  noteId: string
  anchorId: string
  label: string
  anchorType: "inline" | "divider" | "heading" | "block"
  /** Target entity kind. Default "note" for backward compat. */
  targetKind?: "note" | "wiki"
  createdAt: string
}

/* ── Comments ─────────────────────────────── */

/**
 * Target anchor for a comment — polymorphic across Note and Wiki.
 * - "block" anchors target a specific block within an entity
 * - "entity" anchors (note/wiki) target the document as a whole (replaces legacy Reflection/Thread)
 */
export type CommentAnchor =
  | { kind: "wiki-block"; articleId: string; blockId: string }
  | { kind: "note-block"; noteId: string; nodeId: string }
  | { kind: "wiki"; articleId: string }
  | { kind: "note"; noteId: string }

/** Linear-style status for a comment. Default "backlog" = not yet actioned. */
export type CommentStatus = "backlog" | "todo" | "done" | "blocker"

/** Single comment attached to a block (wiki) or ProseMirror top-level node (note). */
export interface Comment {
  id: string
  anchor: CommentAnchor
  body: string
  createdAt: string
  updatedAt: string
  status: CommentStatus
  /** Optional 1-level threaded reply parent. */
  parentId?: string
  /** Deprecated — kept for migration compatibility. Mirrors `status === "done"`. */
  resolved?: boolean
}
