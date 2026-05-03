"use client"

/**
 * TemplatesTable — list-mode renderer for the Templates view (PR template-c).
 *
 * Mirrors the structural shape of notes-table.tsx (header row + body rows +
 * group headers + context menu) but strips:
 *   - Trash sub-filter tabs (Templates have no /trash sub-page yet)
 *   - Drag-and-drop reorder
 *   - Virtualization (template list is small — typical user has < 100)
 *   - SRS / triage / autopilot row actions
 *
 * Row click → setActiveTemplate(id) on the parent (which surfaces the editor
 * page); side-panel context is wired in the parent too, so the list focuses
 * purely on rendering.
 *
 * Multi-select: selectedIds / onSelectionChange are lifted up to templates-view
 * so that TemplatesFloatingActionBar can be rendered outside this component.
 */

import { useRef, useEffect, type ReactNode } from "react"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu"
import { Layout } from "@phosphor-icons/react/dist/ssr/Layout"
import { PushPin } from "@phosphor-icons/react/dist/ssr/PushPin"
import { PushPinSlash } from "@phosphor-icons/react/dist/ssr/PushPinSlash"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { ListBullets } from "@phosphor-icons/react/dist/ssr/ListBullets"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"
import { Minus as PhMinus } from "@phosphor-icons/react/dist/ssr/Minus"
import { format, formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import type { TemplateGroup } from "@/lib/view-engine/use-templates-view"
import type { GroupBy } from "@/lib/view-engine/types"
import type { NoteTemplate } from "@/lib/types"

/* ── Column definitions ───────────────────────────────── */

interface ColumnDef {
  id: string
  label: string
  width: string
  align?: string
  /** When true, this column is always visible (cannot be toggled off). */
  required?: boolean
}

const COLUMN_DEFS: ColumnDef[] = [
  { id: "title", label: "Name", width: "flex-1 min-w-0", required: true },
  { id: "updatedAt", label: "Updated", width: "w-[90px] shrink-0", align: "text-right" },
  { id: "createdAt", label: "Created", width: "w-[90px] shrink-0", align: "text-right" },
]

/* ── TemplatesTable ───────────────────────────────────── */

interface TemplatesTableProps {
  groups: TemplateGroup[]
  flatTemplates: NoteTemplate[]
  groupBy: GroupBy
  visibleColumns: string[]
  selectedTemplateId: string | null
  onSelect: (id: string) => void
  onUseTemplate: (id: string) => void
  onDelete: (id: string) => void
  onTogglePin: (id: string) => void
  onCreateNew: () => void
  showAlphaIndex: boolean
  onToggleAlphaIndex: () => void
  // Multi-select (lifted up to templates-view)
  selectedIds: Set<string>
  onSelectionChange: (ids: Set<string>) => void
}

export function TemplatesTable({
  groups,
  flatTemplates,
  groupBy,
  visibleColumns,
  selectedTemplateId,
  onSelect,
  onUseTemplate,
  onDelete,
  onTogglePin,
  onCreateNew,
  showAlphaIndex,
  onToggleAlphaIndex,
  selectedIds,
  onSelectionChange,
}: TemplatesTableProps) {
  const lastClickedIndexRef = useRef<number | null>(null)

  // ESC to clear selection
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedIds.size > 0) {
        onSelectionChange(new Set())
        e.preventDefault()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [selectedIds.size, onSelectionChange])

  const handleRowClick = (tmplId: string, rowIndex: number, e: React.MouseEvent) => {
    // Shift+click: range select
    if (e.shiftKey && lastClickedIndexRef.current !== null) {
      const start = Math.min(lastClickedIndexRef.current, rowIndex)
      const end = Math.max(lastClickedIndexRef.current, rowIndex)
      const rangeIds = flatTemplates.slice(start, end + 1).map((t) => t.id)
      onSelectionChange(new Set(rangeIds))
      e.preventDefault()
      return
    }
    // Ctrl/Cmd+click or selection active → toggle
    if (e.metaKey || e.ctrlKey) {
      const next = new Set(selectedIds)
      if (next.has(tmplId)) next.delete(tmplId)
      else next.add(tmplId)
      onSelectionChange(next)
      lastClickedIndexRef.current = rowIndex
      e.preventDefault()
      return
    }
    // Selection active: clicking a row toggles it (no edit navigation)
    if (selectedIds.size > 0) {
      const next = new Set(selectedIds)
      if (next.has(tmplId)) next.delete(tmplId)
      else next.add(tmplId)
      onSelectionChange(next)
      lastClickedIndexRef.current = rowIndex
      return
    }
    // Normal click: navigate to edit
    lastClickedIndexRef.current = rowIndex
    onSelect(tmplId)
  }

  const handleCheckboxClick = (tmplId: string, rowIndex: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = new Set(selectedIds)
    if (next.has(tmplId)) next.delete(tmplId)
    else next.add(tmplId)
    onSelectionChange(next)
    lastClickedIndexRef.current = rowIndex
  }

  // Empty state — show only when there are NO templates anywhere (not just
  // when the current filter slice is empty). When filters yield zero results,
  // a different empty hint reads more truthfully ("No matches" vs "No templates").
  if (flatTemplates.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="flex flex-col items-center gap-2">
          <Layout className="text-muted-foreground/60" size={32} weight="regular" />
          <span className="text-2xs text-muted-foreground">No templates match the current view</span>
          <button
            onClick={onCreateNew}
            className="mt-1 flex items-center gap-1 px-2.5 py-1.5 rounded-md text-2xs bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
          >
            <PhPlus size={12} weight="regular" />
            New template
          </button>
        </div>
      </div>
    )
  }

  // Resolve which columns are actually rendered (required + visible).
  const activeColumns = COLUMN_DEFS.filter(
    (c) => c.required || visibleColumns.includes(c.id),
  )

  const allSelected = selectedIds.size === flatTemplates.length && flatTemplates.length > 0
  const someSelected = selectedIds.size > 0 && selectedIds.size < flatTemplates.length

  return (
    <div className={cn("flex flex-1 flex-col overflow-hidden", selectedIds.size > 0 && "pb-20")}>
      {/* Header row */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background px-5 py-2">
        {/* Checkbox column header — 32px */}
        <div className="w-8 shrink-0 flex items-center justify-center">
          <div
            className={cn(
              "h-4 w-4 rounded-[4px] border flex items-center justify-center cursor-pointer transition-colors shadow-sm",
              allSelected
                ? "bg-accent border-accent"
                : someSelected
                  ? "bg-accent/50 border-accent"
                  : "bg-card border-zinc-400 dark:border-zinc-600 hover:border-zinc-500 dark:hover:border-zinc-500",
            )}
            onClick={() => {
              if (allSelected) {
                onSelectionChange(new Set())
              } else {
                onSelectionChange(new Set(flatTemplates.map((t) => t.id)))
              }
            }}
          >
            {allSelected && <PhCheck className="text-accent-foreground" size={10} weight="bold" />}
            {someSelected && <PhMinus className="text-accent-foreground" size={10} weight="regular" />}
          </div>
        </div>
        {activeColumns.map((c) => (
          <span
            key={c.id}
            className={cn(
              "text-note font-medium text-foreground/80",
              c.width,
              c.align,
              c.id === "title" && "flex items-center justify-between",
            )}
          >
            {c.id === "title" ? (
              <>
                <span>{c.label}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    onToggleAlphaIndex()
                  }}
                  className={`flex h-6 items-center gap-1 rounded-md px-1.5 text-note font-medium transition-all duration-100 ${
                    showAlphaIndex
                      ? "bg-foreground/10 text-foreground"
                      : "text-foreground/70 hover:bg-hover-bg hover:text-foreground"
                  }`}
                  title={showAlphaIndex ? "Exit alphabetical index" : "Show alphabetical index"}
                >
                  <ListBullets size={12} weight="bold" />
                  <span>Index</span>
                </button>
              </>
            ) : (
              c.label
            )}
          </span>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {groups.map((group) => (
          <TemplateGroupSection
            key={group.key}
            group={group}
            showHeader={groupBy !== "none" || showAlphaIndex}
            activeColumns={activeColumns}
            selectedTemplateId={selectedTemplateId}
            selectedIds={selectedIds}
            flatTemplates={flatTemplates}
            onRowClick={handleRowClick}
            onCheckboxClick={handleCheckboxClick}
            onUseTemplate={onUseTemplate}
            onDelete={onDelete}
            onTogglePin={onTogglePin}
          />
        ))}
      </div>
    </div>
  )
}

/* ── Group section ────────────────────────────────────── */

function TemplateGroupSection({
  group,
  showHeader,
  activeColumns,
  selectedTemplateId,
  selectedIds,
  flatTemplates,
  onRowClick,
  onCheckboxClick,
  onUseTemplate,
  onDelete,
  onTogglePin,
}: {
  group: TemplateGroup
  showHeader: boolean
  activeColumns: ColumnDef[]
  selectedTemplateId: string | null
  selectedIds: Set<string>
  flatTemplates: NoteTemplate[]
  onRowClick: (id: string, index: number, e: React.MouseEvent) => void
  onCheckboxClick: (id: string, index: number, e: React.MouseEvent) => void
  onUseTemplate: (id: string) => void
  onDelete: (id: string) => void
  onTogglePin: (id: string) => void
}) {
  if (group.templates.length === 0 && showHeader) return null
  return (
    <div>
      {showHeader && (
        <div className="flex items-center gap-2 px-5 py-2 mt-3 mb-0.5">
          <CaretDown size={12} weight="regular" className="text-muted-foreground" />
          <span className="text-note font-semibold text-foreground">
            {group.label || "Ungrouped"}
          </span>
          <span className="text-2xs text-muted-foreground tabular-nums">
            {group.templates.length}
          </span>
        </div>
      )}
      {group.templates.map((tmpl) => {
        const rowIndex = flatTemplates.findIndex((t) => t.id === tmpl.id)
        return (
          <TemplateRow
            key={tmpl.id}
            tmpl={tmpl}
            activeColumns={activeColumns}
            isSelected={selectedTemplateId === tmpl.id}
            isChecked={selectedIds.has(tmpl.id)}
            selectionActive={selectedIds.size > 0}
            rowIndex={rowIndex}
            onRowClick={onRowClick}
            onCheckboxClick={onCheckboxClick}
            onUseTemplate={onUseTemplate}
            onDelete={onDelete}
            onTogglePin={onTogglePin}
          />
        )
      })}
    </div>
  )
}

/* ── Single row ───────────────────────────────────────── */

function TemplateRow({
  tmpl,
  activeColumns,
  isSelected,
  isChecked,
  selectionActive,
  rowIndex,
  onRowClick,
  onCheckboxClick,
  onUseTemplate,
  onDelete,
  onTogglePin,
}: {
  tmpl: NoteTemplate
  activeColumns: ColumnDef[]
  isSelected: boolean
  isChecked: boolean
  selectionActive: boolean
  rowIndex: number
  onRowClick: (id: string, index: number, e: React.MouseEvent) => void
  onCheckboxClick: (id: string, index: number, e: React.MouseEvent) => void
  onUseTemplate: (id: string) => void
  onDelete: (id: string) => void
  onTogglePin: (id: string) => void
}) {
  const renderCell = (col: ColumnDef): ReactNode => {
    switch (col.id) {
      case "title":
        return (
          <div className={cn("flex items-center gap-2 min-w-0", col.width)}>
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-secondary/40 text-muted-foreground">
              <Layout size={12} weight="regular" />
            </span>
            <div className="flex-1 min-w-0 flex items-center gap-1.5">
              <span className="text-note font-medium text-foreground truncate">
                {tmpl.name || "Untitled template"}
              </span>
              {tmpl.pinned && (
                <PushPin className="text-accent shrink-0" size={11} weight="regular" />
              )}
            </div>
          </div>
        )

      case "updatedAt":
        return (
          <span
            className={cn("text-note text-muted-foreground", col.width, col.align)}
            title={tmpl.updatedAt}
          >
            {formatDistanceToNow(new Date(tmpl.updatedAt), { addSuffix: false })}
          </span>
        )

      case "createdAt":
        return (
          <span
            className={cn("text-note text-muted-foreground", col.width, col.align)}
            title={tmpl.createdAt}
          >
            {format(new Date(tmpl.createdAt), "MMM d")}
          </span>
        )

      default:
        return null
    }
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          onClick={(e) => onRowClick(tmpl.id, rowIndex, e)}
          className={cn(
            "group w-full flex items-center gap-3 px-5 py-2 text-left transition-colors",
            isChecked
              ? "bg-accent/5"
              : isSelected
                ? "bg-accent/10"
                : "hover:bg-hover-bg",
          )}
        >
          {/* Checkbox — 32px, always in DOM, visible on hover or when selection is active */}
          <div
            data-checkbox
            className={cn(
              "w-8 shrink-0 flex items-center justify-center",
              selectionActive || isChecked ? "visible" : "invisible group-hover:visible",
            )}
            onClick={(e) => onCheckboxClick(tmpl.id, rowIndex, e)}
          >
            <div
              className={cn(
                "h-4 w-4 rounded-[4px] border flex items-center justify-center transition-colors pointer-events-none shadow-sm",
                isChecked
                  ? "bg-accent border-accent"
                  : "bg-card border-zinc-400 dark:border-zinc-600 hover:border-zinc-500",
              )}
            >
              {isChecked && <PhCheck className="text-accent-foreground" size={8} weight="bold" />}
            </div>
          </div>
          {activeColumns.map((c) => (
            <span key={c.id} className={c.id === "title" ? "flex-1 min-w-0" : ""}>
              {renderCell(c)}
            </span>
          ))}
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem
          className="text-note"
          onClick={() => onUseTemplate(tmpl.id)}
        >
          <FileText className="mr-2 text-accent" size={16} weight="regular" />
          Use template
        </ContextMenuItem>
        <ContextMenuItem
          className="text-note"
          onClick={() => onRowClick(tmpl.id, rowIndex, { shiftKey: false, metaKey: false, ctrlKey: false } as React.MouseEvent)}
        >
          <Layout className="mr-2 text-muted-foreground" size={16} weight="regular" />
          Edit
        </ContextMenuItem>
        <ContextMenuItem className="text-note" onClick={() => onTogglePin(tmpl.id)}>
          {tmpl.pinned ? (
            <>
              <PushPinSlash className="mr-2 text-muted-foreground" size={16} weight="regular" />
              Unpin
            </>
          ) : (
            <>
              <PushPin className="mr-2 text-accent" size={16} weight="regular" />
              Pin
            </>
          )}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => onDelete(tmpl.id)}
          className="text-red-400 focus:text-red-400"
        >
          <Trash className="mr-2" size={16} weight="regular" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
