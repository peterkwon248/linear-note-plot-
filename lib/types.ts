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
export type ActivitySpace = "home" | "notes" | "wiki" | "calendar" | "ontology"

export interface WikiInfoboxEntry {
  key: string
  value: string
}

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
  createdAt: string
  updatedAt: string
}

/* ── Wiki Article (Assembly Model) ────────────────── */

/** Wiki block types — building blocks of a wiki article */
export type WikiBlockType = 'section' | 'text' | 'note-ref' | 'image' | 'table' | 'url'

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
  blocks: WikiBlock[]
  sectionIndex: WikiSectionIndex[]
  tags: string[]
  categoryIds?: string[]           // references to WikiCategory.id (DAG)
  layout?: WikiLayout              // article layout mode (default: "default")
  fontSize?: number                // global font size multiplier (0.85=S, 1=M default, 1.15=L, 1.3=XL)
  contentAlign?: "left" | "center" // content alignment (undefined = "left")
  linksOut?: string[]              // extracted [[wiki-links]] from text blocks
  mergeHistory?: WikiMergeSnapshot[]  // snapshots from N→1 merge for unmerge
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
    viewMode: "list" | "table" | "board" | "insights" | "calendar"
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
  content: string         // 자유 텍스트 설명
  fields: Array<{ key: string; value: string }>  // 인포박스식 메타데이터
  tags?: string[]         // 글로벌 태그 공유
  createdAt: string
  updatedAt: string
}

export interface Label {
  id: string
  name: string
  color: string
  trashed?: boolean
  trashedAt?: string | null
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
  icon: string           // emoji or lucide icon name
  color: string          // hex color
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

/* ── Phase 2: Reflection ───────────────────────────── */

export interface Reflection {
  id: string
  noteId: string
  text: string
  createdAt: string
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
