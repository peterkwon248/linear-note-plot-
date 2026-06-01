import type { ReactNode } from "react"
import type { NoteStatus, NotePriority, NoteSource } from "@/lib/types"

/**
 * Notes-list surface view-model — the props contract between the live container
 * (`components/notes-table.tsx`) and the pure presentational `NotesListView`
 * in this folder.
 *
 * Everything is plain data: store-derived maps become arrays/records, i18n
 * labels become literal strings (mock supplies real 한국어), handlers become
 * optional callbacks. The presentational never touches the store, router, or
 * i18n hooks.
 *
 * Faithful to the live god's NoteRowProps + group/column shapes.
 */

/* ── Column / sort ──────────────────────────────────────── */

export type SortField =
  | "updatedAt" | "createdAt" | "priority" | "title" | "status"
  | "links" | "reads" | "folder" | "label" | "sub" | "tier"
  | "parent" | "articles" | "name" | "noteCount" | "memberCount"
  | "fieldCount" | "size" | "fileType" | "itemCount"

export type SortDirection = "asc" | "desc"

/** Column ids that the table supports (mirrors live COLUMN_DEFS). */
export type ColumnId =
  | "title" | "status" | "folder" | "parent" | "children"
  | "links" | "reads" | "wordCount" | "updatedAt" | "createdAt"

/** One column definition — mirrors live COLUMN_DEFS shape. */
export interface NoteColumnDef {
  id: ColumnId
  /** Resolved display label (mock provides literal ko string). */
  label: string
  /** Tailwind width class(es) — copied verbatim from live COLUMN_DEFS. */
  width: string
  /** Tailwind text-align class (e.g. "text-center"). */
  align?: string
  sortField?: SortField
}

/* ── Folder chip (rendered inside rows) ────────────────── */

export interface NotesFolderChip {
  id: string
  name: string
  /** Resolved hex color (may be null → render without color dot). */
  color: string | null
}

/* ── Label chip ─────────────────────────────────────────── */

export interface NotesLabelChip {
  id: string
  name: string
  /** Hex e.g. "#f43f5e" */
  color: string
}

/* ── One note row ───────────────────────────────────────── */

export interface NotesListNote {
  id: string
  title: string
  status: NoteStatus
  priority: NotePriority
  source: NoteSource
  /** Resolved folder chips for this note (N:M membership). */
  folders: NotesFolderChip[]
  /** Resolved label (null = no label). */
  label: NotesLabelChip | null
  /** Backlink count from backlinksMap. */
  links: number
  reads: number
  wordCount: number
  /** ISO date string (for shortRelative display). */
  updatedAt: string
  /** ISO date string (for absDate display). */
  createdAt: string
  pinned: boolean
  /** Parent note title (undefined = no parent). */
  parentTitle?: string
  /** Child note titles (undefined / empty = no children). */
  childTitles?: string[]
  /** Preview text (first ~120 chars). */
  preview: string
}

/* ── Group header ───────────────────────────────────────── */

export interface NotesListGroup {
  key: string
  /** Rendered label (e.g. "Backlog", "2026년 5월"). */
  label: string
  /** Note count shown in the header badge. */
  count: number
  notes: NotesListNote[]
}

/* ── View state (what the header chrome reflects) ─────── */

export interface NotesListViewState {
  sortField: SortField
  sortDirection: SortDirection
  /** Column ids currently shown (title always included). */
  visibleColumns: ColumnId[]
  /** CSS grid-template-columns string — computed from visibleColumns. */
  gridTemplate: string
  /** Whether at least one group exists (drives group header rendering). */
  isGrouped: boolean
  /** Group by axis label for the header (e.g. "Status") — "" when none. */
  groupByLabel: string
}

/* ── Top-level view model ───────────────────────────────── */

export interface NotesListViewModel {
  /** Page title shown in the header. */
  title: string
  /** Total note count (displayed next to title). */
  totalCount: number
  /** All column definitions (including hidden ones — view filters visibleColumns). */
  columnDefs: NoteColumnDef[]
  /**
   * Flat mode (no groups): provide a single group with key="" and notes array.
   * Grouped mode: 2+ groups.
   */
  groups: NotesListGroup[]
  viewState: NotesListViewState
  /** Whether any notes are in the list (drives empty-state rendering). */
  isEmpty: boolean
  /** Whether a sort chip is shown (sortField !== "updatedAt"). */
  showSortChip: boolean
  /** Sort chip label e.g. "Title ↑". */
  sortChipLabel: string
}

/* ── Optional callbacks ─────────────────────────────────── */

export interface NotesListCallbacks {
  onRowClick?: (noteId: string) => void
  onSort?: (field: SortField) => void
  onToggleGroupCollapse?: (groupKey: string) => void
  onSelectAll?: () => void
  onClearSelection?: () => void
  onRemoveSortChip?: () => void
  onToggleSortDirection?: () => void
}
