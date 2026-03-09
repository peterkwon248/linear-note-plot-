import type { Note, NoteStatus, NotePriority } from "../types"

/* ── View Context ──────────────────────────────────────── */

export type ViewContextKey =
  | "all"        // /notes
  | "pinned"     // /pinned
  | "inbox"      // /inbox
  | "capture"    // /capture
  | "reference"  // tab filter within /notes
  | "permanent"  // /permanent
  | "unlinked"   // tab filter within /notes
  | "review"     // /review
  | "archive"    // /archive
  | "folder"     // /folder/[id]
  | "category"   // /category/[id]
  | "tag"        // /tag/[id]
  | "projects"   // /projects
  | "trash"      // /trash
  | "savedView"  // /views/[id] — dynamic context for saved view detail

/* ── View State ────────────────────────────────────────── */

export type ViewMode = "list" | "table" | "board"

export type SortField =
  | "updatedAt"
  | "createdAt"
  | "priority"
  | "title"
  | "status"
  | "links"
  | "reads"
  | "project"

export type SortDirection = "asc" | "desc"

export type GroupBy = "none" | "status" | "priority" | "date" | "project" | "triage" | "linkCount"

export type FilterOperator = "eq" | "neq" | "gt" | "lt"

export type FilterField =
  | "status" | "priority" | "links" | "reads" | "project"
  | "updatedAt" | "createdAt" | "content" | "tags" | "pinned"
  | "source" | "wordCount" | "title"

export interface FilterRule {
  field: FilterField
  operator: FilterOperator
  value: string
}

export interface ViewState {
  viewMode: ViewMode
  sortField: SortField
  sortDirection: SortDirection
  groupBy: GroupBy
  filters: FilterRule[]
  visibleColumns: string[]
  showEmptyGroups: boolean
}

/* ── Pipeline Types ────────────────────────────────────── */

export interface NoteGroup {
  key: string
  label: string
  notes: Note[]
}

export interface PipelineResult {
  groups: NoteGroup[]
  flatNotes: Note[]
  flatCount: number
  totalCount: number
}

export interface PipelineExtras {
  backlinksMap?: Map<string, number>
  searchQuery?: string
  folderId?: string
  categoryId?: string
  tagId?: string
}

/* ── Sort Order Constants ──────────────────────────────── */

export const STATUS_ORDER: Record<NoteStatus, number> = {
  inbox: 0,
  capture: 1,
  reference: 2,
  permanent: 3,
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
  "all", "pinned", "inbox", "capture", "reference", "permanent",
  "unlinked", "review", "archive", "folder", "category", "tag", "projects", "trash",
  "savedView",
]

export const VALID_SORT_FIELDS: SortField[] = [
  "updatedAt", "createdAt", "priority", "title", "status", "links", "reads", "project",
]

export const VALID_GROUP_BY: GroupBy[] = [
  "none", "status", "priority", "date", "project", "triage", "linkCount",
]

export const VALID_VIEW_MODES: ViewMode[] = ["list", "table", "board"]

export const VALID_COLUMNS: string[] = [
  "title", "status", "project", "links", "reads", "priority", "createdAt", "updatedAt",
]
