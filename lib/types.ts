export type NoteStatus = "inbox" | "capture" | "reference" | "permanent"
export type NotePriority = "none" | "urgent" | "high" | "medium" | "low"
export type ProjectLevel = "planning" | "active" | "review" | "done"

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
  category: string
  tags: string[]
  status: NoteStatus
  project: string | null
  projectLevel: ProjectLevel | null
  priority: NotePriority
  reads: number
  pinned: boolean
  archived: boolean
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

  /* ── Thinking Chain ──────────────────────────────── */
  parentNoteId: string | null
}

export interface Folder {
  id: string
  name: string
  color: string
}

export interface Tag {
  id: string
  name: string
  color: string
}

export interface Category {
  id: string
  name: string
  color: string
}

export type ActiveView =
  | { type: "inbox" }
  | { type: "all" }
  | { type: "views" }
  | { type: "folder"; folderId: string }
  | { type: "archive" }
  | { type: "templates" }
  | { type: "insights" }
  | { type: "category"; categoryId: string }
  | { type: "pinned" }
  | { type: "tag"; tagId: string }
  | { type: "settings" }
  | { type: "map"; mapId: string }

/** Route-based note filter, used by each page route */
export type NoteFilter =
  | { type: "inbox" }
  | { type: "all" }
  | { type: "archive" }
  | { type: "projects" }
  | { type: "pinned" }
  | { type: "folder"; folderId: string }
  | { type: "category"; categoryId: string }
  | { type: "tag"; tagId: string }
  | { type: "status-inbox" }
  | { type: "status-capture" }
  | { type: "status-permanent" }
  | { type: "map"; mapId: string }

/* ── Phase 2: Event Log / Timeline ──────────────────── */

export type NoteEventType =
  | "created" | "updated" | "opened" | "promoted" | "archived" | "unarchived"
  | "triage_keep" | "triage_snooze" | "triage_trash"
  | "link_added" | "link_removed"
  | "thinking_chain_started" | "thinking_chain_step_added" | "thinking_chain_ended"
  | "map_added" | "map_removed"

export interface NoteEvent {
  id: string
  noteId: string
  type: NoteEventType
  at: string
  meta?: Record<string, unknown>
}

/* ── Phase 2: Thinking Chain ────────────────────────── */

export interface ThinkingChainStep {
  id: string
  at: string
  text: string
  relatedNoteIds?: string[]
}

export interface ThinkingChainSession {
  id: string
  noteId: string
  startedAt: string
  endedAt: string | null
  steps: ThinkingChainStep[]
  status: "active" | "done"
}

/* ── Phase 2: Review Queue ──────────────────────────── */

export interface ReviewQueueItem {
  noteId: string
  reason: string
  score: number
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
