export type NoteStatus = "inbox" | "capture" | "permanent"
export type NotePriority = "none" | "urgent" | "high" | "medium" | "low"
/** Triage status for inbox notes */
export type TriageStatus = "untriaged" | "kept" | "snoozed" | "trashed"

/** Source of note creation */
export type NoteSource = "manual" | "webclip" | "import" | "share" | "api" | null

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
  archived: boolean
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
  archivedAt: string | null
  trashedAt: string | null

  /* ── Thread ──────────────────────────────────────── */
  parentNoteId: string | null

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
}

export interface Label {
  id: string
  name: string
  color: string
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
  | "archive" | "pin" | "add_tag" | "remove_tag"

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
  status: NoteStatus
  priority: NotePriority
  labelId: string | null
  tags: string[]         // tag IDs
  folderId: string | null
  // Meta
  pinned: boolean
  createdAt: string
  updatedAt: string
}

export type ActiveView =
  | { type: "inbox" }
  | { type: "all" }
  | { type: "views" }
  | { type: "folder"; folderId: string }
  | { type: "archive" }
  | { type: "templates" }
  | { type: "insights" }
  | { type: "pinned" }
  | { type: "tag"; tagId: string }
  | { type: "settings" }
  | { type: "map"; mapId: string }

/** Route-based note filter, used by each page route */
export type NoteFilter =
  | { type: "inbox" }
  | { type: "all" }
  | { type: "archive" }
  | { type: "trash" }
  | { type: "pinned" }
  | { type: "folder"; folderId: string }
  | { type: "tag"; tagId: string }
  | { type: "status-inbox" }
  | { type: "status-capture" }
  | { type: "status-permanent" }
  | { type: "map"; mapId: string }

/* ── Phase 2: Event Log / Timeline ──────────────────── */

export type NoteEventType =
  | "created" | "updated" | "opened" | "promoted" | "archived" | "unarchived" | "trashed" | "untrashed"
  | "triage_keep" | "triage_snooze" | "triage_trash"
  | "link_added" | "link_removed"
  | "thread_started" | "thread_step_added" | "thread_ended"
  | "map_added" | "map_removed"
  | "label_changed"
  | "srs_reviewed"
  | "autopilot_applied"

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
}

export interface Thread {
  id: string
  noteId: string
  startedAt: string
  endedAt: string | null
  steps: ThreadStep[]
  status: "active" | "done"
}

/* ── Saved Views ─────────────────────────────────── */

export interface SavedView {
  id: string
  name: string
  filters: { field: string; operator: string; value: string }[]
  sortField?: string
  sortDirection?: "asc" | "desc"
  groupBy?: string
  viewMode?: "list" | "table" | "board" | "insights"
  createdAt: string
  updatedAt: string
}

/* ── Phase 3: Knowledge Maps ───────────────────────── */

export interface KnowledgeMap {
  id: string
  title: string
  description: string
  noteIds: string[]
  color: string
  createdAt: string
  updatedAt: string
}
