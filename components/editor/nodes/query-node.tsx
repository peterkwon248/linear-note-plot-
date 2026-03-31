"use client"

import { Node as TiptapNode, mergeAttributes } from "@tiptap/core"
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import { useMemo, useEffect, useState, useCallback, useRef } from "react"
import { nanoid } from "nanoid"
import { usePlotStore } from "@/lib/store"
import { setActiveRoute } from "@/lib/table-route"
import { useNotesView } from "@/lib/view-engine/use-notes-view"
import type {
  ViewContextKey,
  FilterRule,
  FilterField,
  FilterOperator,
  SortField,
  GroupBy,
  ViewState,
  NoteGroup,
} from "@/lib/view-engine/types"
import type { Note } from "@/lib/types"
import { shortRelative } from "@/lib/format-utils"
import { CircleDashed } from "@phosphor-icons/react/dist/ssr/CircleDashed"
import { CircleHalf } from "@phosphor-icons/react/dist/ssr/CircleHalf"
import { CheckCircle } from "@phosphor-icons/react/dist/ssr/CheckCircle"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { CaretUpDown } from "@phosphor-icons/react/dist/ssr/CaretUpDown"
import { Funnel } from "@phosphor-icons/react/dist/ssr/Funnel"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { Table as TableIcon } from "@phosphor-icons/react/dist/ssr/Table"
import { SortAscending } from "@phosphor-icons/react/dist/ssr/SortAscending"
import { SortDescending } from "@phosphor-icons/react/dist/ssr/SortDescending"

/* ── Constants ────────────────────────────────────────────── */

const COLUMN_LABELS: Record<string, string> = {
  title: "Title",
  status: "Status",
  folder: "Folder",
  label: "Label",
  updatedAt: "Updated",
  createdAt: "Created",
  links: "Links",
  reads: "Reads",
}

const SORT_FIELD_OPTIONS: { value: SortField; label: string }[] = [
  { value: "updatedAt", label: "Updated" },
  { value: "createdAt", label: "Created" },
  { value: "title", label: "Title" },
  { value: "status", label: "Status" },
  { value: "links", label: "Links" },
  { value: "reads", label: "Reads" },
]

const GROUP_BY_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: "none", label: "None" },
  { value: "status", label: "Status" },
  { value: "folder", label: "Folder" },
  { value: "label", label: "Label" },
  { value: "priority", label: "Priority" },
  { value: "date", label: "Date" },
]

const FILTER_FIELD_OPTIONS: { value: FilterField; label: string }[] = [
  { value: "status", label: "Status" },
  { value: "folder", label: "Folder" },
  { value: "label", label: "Label" },
  { value: "tags", label: "Tags" },
  { value: "noteType", label: "Note Type" },
  { value: "pinned", label: "Pinned" },
]

const FILTER_OPERATOR_OPTIONS: { value: FilterOperator; label: string }[] = [
  { value: "eq", label: "is" },
  { value: "neq", label: "is not" },
]

/* ── Status Badge ─────────────────────────────────────────── */

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "inbox":
      return (
        <span className="inline-flex items-center gap-1 text-2xs text-muted-foreground">
          <CircleDashed size={12} /> Inbox
        </span>
      )
    case "capture":
      return (
        <span className="inline-flex items-center gap-1 text-2xs text-[var(--accent)]">
          <CircleHalf size={12} /> Capture
        </span>
      )
    case "permanent":
      return (
        <span className="inline-flex items-center gap-1 text-2xs text-[var(--accent)]">
          <CheckCircle size={12} weight="fill" /> Permanent
        </span>
      )
    default:
      return <span className="text-2xs text-muted-foreground">{status}</span>
  }
}

/* ── NoteRow ──────────────────────────────────────────────── */

function NoteRow({
  note,
  columns,
  onClick,
  folderNames,
  labelNames,
}: {
  note: Note
  columns: string[]
  onClick: (id: string) => void
  folderNames: Map<string, string>
  labelNames: Map<string, string>
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(note.id)}
      className="w-full flex items-center px-3 py-1.5 text-left hover:bg-hover-bg transition-colors border-b border-border-subtle/50 last:border-b-0"
    >
      {columns.map((col) => {
        const isTitle = col === "title"
        return (
          <div
            key={col}
            className={isTitle ? "flex-1 min-w-0 pr-2" : "w-[90px] shrink-0 pr-2"}
          >
            {col === "title" && (
              <span className="text-2xs font-medium text-foreground truncate block">
                {note.title || "Untitled"}
              </span>
            )}
            {col === "status" && <StatusBadge status={note.status} />}
            {col === "folder" && (
              <span className="text-2xs text-muted-foreground truncate block">
                {note.folderId ? (folderNames.get(note.folderId) ?? "—") : "—"}
              </span>
            )}
            {col === "label" && (
              <span className="text-2xs text-muted-foreground truncate block">
                {note.labelId ? (labelNames.get(note.labelId) ?? "—") : "—"}
              </span>
            )}
            {col === "updatedAt" && (
              <span className="text-2xs text-muted-foreground">
                {shortRelative(note.updatedAt)}
              </span>
            )}
            {col === "createdAt" && (
              <span className="text-2xs text-muted-foreground">
                {shortRelative(note.createdAt)}
              </span>
            )}
            {col === "links" && (
              <span className="text-2xs text-muted-foreground">
                {note.linksOut?.length ?? 0}
              </span>
            )}
            {col === "reads" && (
              <span className="text-2xs text-muted-foreground">
                {note.reads}
              </span>
            )}
          </div>
        )
      })}
    </button>
  )
}

/* ── InlineQueryTable ─────────────────────────────────────── */

function InlineQueryTable({
  groups,
  flatNotes,
  flatCount,
  viewState,
  maxRows,
  onNoteClick,
  onSort,
  folderNames,
  labelNames,
}: {
  groups: NoteGroup[]
  flatNotes: Note[]
  flatCount: number
  viewState: ViewState
  maxRows: number
  onNoteClick: (id: string) => void
  onSort: (field: string) => void
  folderNames: Map<string, string>
  labelNames: Map<string, string>
}) {
  const columns = viewState.visibleColumns.filter((c) => c in COLUMN_LABELS)
  const isGrouped = viewState.groupBy !== "none"
  const displayNotes = maxRows > 0 ? flatNotes.slice(0, maxRows) : flatNotes
  const [expanded, setExpanded] = useState(false)

  if (flatCount === 0) {
    return (
      <div className="px-3 py-6 text-center text-2xs text-muted-foreground">
        No notes match this query.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      {/* Column headers */}
      <div className="flex items-center border-b border-border-subtle px-3 py-1.5">
        {columns.map((col) => {
          const isTitle = col === "title"
          const isActive = viewState.sortField === col
          return (
            <button
              key={col}
              type="button"
              onClick={() => onSort(col)}
              className={`${isTitle ? "flex-1 min-w-0" : "w-[90px] shrink-0"} text-left text-2xs font-medium pr-2 flex items-center gap-0.5 ${
                isActive ? "text-foreground" : "text-muted-foreground"
              } hover:text-foreground transition-colors`}
            >
              {COLUMN_LABELS[col]}
              {isActive && (
                viewState.sortDirection === "asc"
                  ? <SortAscending size={10} />
                  : <SortDescending size={10} />
              )}
            </button>
          )
        })}
      </div>

      {/* Grouped or flat rendering */}
      {isGrouped ? (
        groups.map((group) => {
          const groupNotes = maxRows > 0 && !expanded ? group.notes.slice(0, maxRows) : group.notes
          return (
            <div key={group.key}>
              <div className="px-3 py-1.5 text-2xs font-medium text-muted-foreground bg-secondary/30">
                {group.label} ({group.notes.length})
              </div>
              {groupNotes.map((note) => (
                <NoteRow
                  key={note.id}
                  note={note}
                  columns={columns}
                  onClick={onNoteClick}
                  folderNames={folderNames}
                  labelNames={labelNames}
                />
              ))}
            </div>
          )
        })
      ) : (
        (expanded ? flatNotes : displayNotes).map((note) => (
          <NoteRow
            key={note.id}
            note={note}
            columns={columns}
            onClick={onNoteClick}
            folderNames={folderNames}
            labelNames={labelNames}
          />
        ))
      )}

      {/* Show all button */}
      {maxRows > 0 && flatCount > maxRows && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-full py-2 text-2xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Show all {flatCount} notes &rarr;
        </button>
      )}
      {expanded && flatCount > maxRows && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="w-full py-2 text-2xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Collapse
        </button>
      )}
    </div>
  )
}

/* ── Filter Add Dropdown ──────────────────────────────────── */

function FilterAddDropdown({
  onAdd,
}: {
  onAdd: (rule: FilterRule) => void
}) {
  const [open, setOpen] = useState(false)
  const [field, setField] = useState<FilterField>("status")
  const [operator, setOperator] = useState<FilterOperator>("eq")
  const [value, setValue] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const handleAdd = () => {
    if (!value.trim()) return
    onAdd({ field, operator, value: value.trim() })
    setValue("")
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 px-2 py-1 text-2xs text-muted-foreground hover:text-foreground hover:bg-hover-bg rounded transition-colors"
      >
        <Funnel size={12} />
        Filter
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-surface-overlay border border-border-subtle rounded-lg shadow-lg p-2 min-w-[240px] space-y-2">
          <div className="flex gap-1.5">
            <select
              value={field}
              onChange={(e) => setField(e.target.value as FilterField)}
              className="flex-1 bg-secondary/50 border border-border-subtle rounded px-1.5 py-1 text-2xs text-foreground"
            >
              {FILTER_FIELD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value as FilterOperator)}
              className="bg-secondary/50 border border-border-subtle rounded px-1.5 py-1 text-2xs text-foreground"
            >
              {FILTER_OPERATOR_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd() }}
              placeholder="Value..."
              className="flex-1 bg-secondary/50 border border-border-subtle rounded px-1.5 py-1 text-2xs text-foreground placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={handleAdd}
              className="px-2 py-1 bg-accent text-[var(--accent-foreground)] rounded text-2xs font-medium hover:opacity-90 transition-opacity"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── QueryNodeView ────────────────────────────────────────── */

function QueryNodeView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const queryId = node.attrs.queryId as string
  const maxRows = (node.attrs.maxRows as number) ?? 20

  // View engine hook
  const contextKey = `query-${queryId}` as ViewContextKey
  const { groups, flatNotes, flatCount, viewState, updateViewState } = useNotesView(contextKey)

  // Store selectors for name resolution
  const folders = usePlotStore((s) => s.folders)
  const labels = usePlotStore((s) => s.labels)
  const openNote = usePlotStore((s) => s.openNote)

  const folderNames = useMemo(() => {
    const map = new Map<string, string>()
    for (const f of folders) map.set(f.id, f.name)
    return map
  }, [folders])

  const labelNames = useMemo(() => {
    const map = new Map<string, string>()
    for (const l of labels) map.set(l.id, l.name)
    return map
  }, [labels])

  // Sync node attrs → view state
  const attrsFilters = node.attrs.filters as string
  const attrsSortField = node.attrs.sortField as string
  const attrsSortDirection = node.attrs.sortDirection as string
  const attrsGroupBy = node.attrs.groupBy as string
  const attrsVisibleColumns = node.attrs.visibleColumns as string

  useEffect(() => {
    let filters: FilterRule[] = []
    try {
      filters = attrsFilters ? JSON.parse(attrsFilters) : []
    } catch { /* empty */ }

    let visibleColumns: string[] = ["title", "status", "folder", "updatedAt"]
    try {
      visibleColumns = attrsVisibleColumns ? JSON.parse(attrsVisibleColumns) : ["title", "status", "folder", "updatedAt"]
    } catch { /* empty */ }

    const patch: Partial<ViewState> = {
      filters,
      sortField: (attrsSortField || "updatedAt") as SortField,
      sortDirection: (attrsSortDirection || "desc") as "asc" | "desc",
      groupBy: (attrsGroupBy || "none") as GroupBy,
      visibleColumns,
    }
    updateViewState(patch)
  }, [attrsFilters, attrsSortField, attrsSortDirection, attrsGroupBy, attrsVisibleColumns, updateViewState])

  // Navigation
  const handleNoteClick = useCallback(
    (noteId: string) => {
      setActiveRoute("/notes")
      openNote(noteId)
    },
    [openNote],
  )

  // Sort toggle
  const handleSort = useCallback(
    (field: string) => {
      if (viewState.sortField === field) {
        const newDir = viewState.sortDirection === "asc" ? "desc" : "asc"
        updateAttributes({ sortDirection: newDir })
      } else {
        updateAttributes({ sortField: field, sortDirection: "desc" })
      }
    },
    [viewState.sortField, viewState.sortDirection, updateAttributes],
  )

  // Group change
  const handleGroupChange = useCallback(
    (newGroup: string) => {
      updateAttributes({ groupBy: newGroup })
    },
    [updateAttributes],
  )

  // Sort field change
  const handleSortFieldChange = useCallback(
    (newField: string) => {
      if (newField === viewState.sortField) {
        updateAttributes({ sortDirection: viewState.sortDirection === "asc" ? "desc" : "asc" })
      } else {
        updateAttributes({ sortField: newField, sortDirection: "desc" })
      }
    },
    [viewState.sortField, viewState.sortDirection, updateAttributes],
  )

  // Add filter
  const handleAddFilter = useCallback(
    (rule: FilterRule) => {
      let current: FilterRule[] = []
      try {
        current = attrsFilters ? JSON.parse(attrsFilters) : []
      } catch { /* empty */ }
      const updated = [...current, rule]
      updateAttributes({ filters: JSON.stringify(updated) })
    },
    [attrsFilters, updateAttributes],
  )

  // Remove filter
  const handleRemoveFilter = useCallback(
    (index: number) => {
      let current: FilterRule[] = []
      try {
        current = attrsFilters ? JSON.parse(attrsFilters) : []
      } catch { /* empty */ }
      const updated = current.filter((_, i) => i !== index)
      updateAttributes({ filters: JSON.stringify(updated) })
    },
    [attrsFilters, updateAttributes],
  )

  // Parse current filters for display
  const currentFilters: FilterRule[] = useMemo(() => {
    try {
      return attrsFilters ? JSON.parse(attrsFilters) : []
    } catch {
      return []
    }
  }, [attrsFilters])

  return (
    <NodeViewWrapper
      data-type="query-block"
      className={`my-3 rounded-lg border ${selected ? "border-accent/50 ring-1 ring-accent/20" : "border-border-subtle"} bg-surface-overlay overflow-hidden`}
    >
      <div contentEditable={false}>
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle">
          <div className="flex items-center gap-1.5 text-2xs font-medium text-muted-foreground">
            <TableIcon size={14} />
            <span>Query</span>
            <span className="text-muted-foreground/60">({flatCount} results)</span>
          </div>
          <button
            type="button"
            onClick={deleteNode}
            className="p-0.5 rounded hover:bg-hover-bg text-muted-foreground hover:text-foreground transition-colors"
          >
            <PhX size={12} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border-subtle/50 flex-wrap">
          {/* Filter */}
          <FilterAddDropdown onAdd={handleAddFilter} />

          {/* Sort */}
          <div className="inline-flex items-center gap-1">
            <select
              value={viewState.sortField}
              onChange={(e) => handleSortFieldChange(e.target.value)}
              className="bg-transparent border-none text-2xs text-muted-foreground hover:text-foreground cursor-pointer py-1 px-1 rounded hover:bg-hover-bg transition-colors"
            >
              {SORT_FIELD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  Sort: {opt.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() =>
                updateAttributes({
                  sortDirection: viewState.sortDirection === "asc" ? "desc" : "asc",
                })
              }
              className="p-0.5 rounded hover:bg-hover-bg text-muted-foreground hover:text-foreground transition-colors"
              title={viewState.sortDirection === "asc" ? "Ascending" : "Descending"}
            >
              {viewState.sortDirection === "asc" ? (
                <SortAscending size={12} />
              ) : (
                <SortDescending size={12} />
              )}
            </button>
          </div>

          {/* Group */}
          <select
            value={viewState.groupBy}
            onChange={(e) => handleGroupChange(e.target.value)}
            className="bg-transparent border-none text-2xs text-muted-foreground hover:text-foreground cursor-pointer py-1 px-1 rounded hover:bg-hover-bg transition-colors"
          >
            {GROUP_BY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                Group: {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filter chips */}
        {currentFilters.length > 0 && (
          <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border-subtle/50 flex-wrap">
            {currentFilters.map((filter, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 bg-secondary/50 rounded px-1.5 py-0.5 text-2xs text-muted-foreground"
              >
                <span className="font-medium">{filter.field}</span>
                <span>{filter.operator === "eq" ? "is" : "is not"}</span>
                <span className="text-foreground">{filter.value}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveFilter(idx)}
                  className="ml-0.5 hover:text-foreground transition-colors"
                >
                  <PhX size={10} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Table */}
        <InlineQueryTable
          groups={groups}
          flatNotes={flatNotes}
          flatCount={flatCount}
          viewState={viewState}
          maxRows={maxRows}
          onNoteClick={handleNoteClick}
          onSort={handleSort}
          folderNames={folderNames}
          labelNames={labelNames}
        />
      </div>
    </NodeViewWrapper>
  )
}

/* ── TipTap Node Extension ────────────────────────────────── */

export const QueryBlockNode = TiptapNode.create({
  name: "queryBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      queryId: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute("data-query-id"),
        renderHTML: (attrs: Record<string, unknown>) => ({
          "data-query-id": attrs.queryId,
        }),
      },
      filters: {
        default: "[]",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-filters") || "[]",
        renderHTML: (attrs: Record<string, unknown>) => ({
          "data-filters": attrs.filters,
        }),
      },
      sortField: {
        default: "updatedAt",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-sort-field") || "updatedAt",
        renderHTML: (attrs: Record<string, unknown>) => ({
          "data-sort-field": attrs.sortField,
        }),
      },
      sortDirection: {
        default: "desc",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-sort-direction") || "desc",
        renderHTML: (attrs: Record<string, unknown>) => ({
          "data-sort-direction": attrs.sortDirection,
        }),
      },
      groupBy: {
        default: "none",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-group-by") || "none",
        renderHTML: (attrs: Record<string, unknown>) => ({
          "data-group-by": attrs.groupBy,
        }),
      },
      visibleColumns: {
        default: JSON.stringify(["title", "status", "folder", "updatedAt"]),
        parseHTML: (el: HTMLElement) =>
          el.getAttribute("data-visible-columns") ||
          JSON.stringify(["title", "status", "folder", "updatedAt"]),
        renderHTML: (attrs: Record<string, unknown>) => ({
          "data-visible-columns": attrs.visibleColumns,
        }),
      },
      maxRows: {
        default: 20,
        parseHTML: (el: HTMLElement) => {
          const v = el.getAttribute("data-max-rows")
          return v ? parseInt(v, 10) : 20
        },
        renderHTML: (attrs: Record<string, unknown>) => ({
          "data-max-rows": String(attrs.maxRows),
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="query-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "query-block" }),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(QueryNodeView)
  },
})
