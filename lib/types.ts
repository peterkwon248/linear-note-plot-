export type NoteStatus = "capture" | "reference" | "permanent" | "project"
export type NotePriority = "none" | "urgent" | "high" | "medium" | "low"

/** PRIMARY workflow stage — drives the Inbox → Capture → Permanent flow */
export type NoteStage = "inbox" | "capture" | "permanent"

/** Triage status for inbox notes */
export type TriageStatus = "untriaged" | "kept" | "snoozed" | "trashed"

/** Source of note creation */
export type NoteSource = "manual" | "webclip" | "import" | "share" | "api" | null

export interface Note {
  id: string
  title: string
  content: string
  folderId: string | null
  category: string
  tags: string[]
  status: NoteStatus
  priority: NotePriority
  reads: number
  pinned: boolean
  archived: boolean
  isInbox: boolean
  createdAt: string
  updatedAt: string

  /* ── Workflow fields ─────────────────────────────── */
  stage: NoteStage
  triageStatus: TriageStatus
  reviewAt: string | null
  inboxRank: number
  summary: string | null
  source: NoteSource
  promotedAt: string | null
  lastTouchedAt: string
  snoozeCount: number
  archivedAt: string | null
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
  | { type: "stage-inbox" }
  | { type: "stage-capture" }
  | { type: "stage-permanent" }
