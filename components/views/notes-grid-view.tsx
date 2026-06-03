"use client"

/**
 * NotesGridView — Books-grid-parity card grid for Notes.
 *
 * Before this view existed, Notes grid mode fell through to NotesTable's
 * default list rendering. User signal (2026-05-24): "북스의 그리드처럼".
 *
 * Surface here is presentational. The Shell wrapper (NotesGridShell) owns
 * ViewHeader, FilterChipBar, `useNotesView`, and selection state.
 *
 * Interaction (board/table parity): single click toggles selection (hover
 * checkbox top-right), double click opens the editor (list-nav).
 *
 * Grouping (2026-05-29): when `groups` is supplied and groupBy ≠ "none", cards
 * render as vertical sections (group-label header + card grid) — board is
 * columns (horizontal), grid groups are sections (vertical). Otherwise a flat
 * grid. The list-nav capture uses the flattened group order so prev/next walks
 * the on-screen order.
 */

import { useMemo } from "react"
import { Pin as PushPin, Check as PhCheck, ChevronDown } from "lucide-react"
import { StatusShapeIcon } from "@/components/status-icon"
import { GroupHeaderIcon, resolveGroupLabel } from "@/components/group-header"
import { cn } from "@/lib/utils"
import { useListNavCapture } from "@/hooks/use-list-nav-capture"
import { flattenNoteGroupIds, noteGroupsToListNav } from "@/lib/list-nav/flatten"
import {
  PriorityChip,
  FolderChip,
  LabelChip,
  TagChip,
  ParentChip,
  ChildrenChip,
  LinksChip,
  WordsChip,
  UpdatedChip,
  CreatedChip,
  TrashedChip,
  PropertyChipRow,
} from "@/components/property-chips"
import type { Note, Folder, Label, Tag } from "@/lib/types"
import type { NoteGroup, GroupBy } from "@/lib/view-engine/types"

interface NotesGridViewProps {
  notes: Note[]
  /** Grouped sections (from useNotesView). When set + groupBy≠none → sectioned. */
  groups?: NoteGroup[]
  groupBy?: GroupBy
  /** Single-click → side-panel preview (when no selection handler is wired). */
  onRowClick?: (noteId: string) => void
  /** Double-click → open editor (parity with notes-table/notes-board). */
  onOpenEditor?: (noteId: string) => void
  /** Screen label for the editor's list-nav bar ("Notes" / folder / view…). */
  label?: string
  activePreviewId?: string | null
  /** Selected note ids (board/table-parity multi-select). */
  selectedIds?: Set<string>
  /** Toggle a card's selection (hover checkbox / single click). */
  onSelect?: (noteId: string) => void
  /** Entity arrays for group-header identity (icon/label). */
  folders?: Folder[]
  labels?: Label[]
  /** Tags — resolves note.tags[] → Tag entities for the property chip row. */
  tags?: Tag[]
  /** Display Properties — which meta chips to surface on each card. Mirrors
   *  the board/list column visibility so the Display popover affects the
   *  grid surface too. Undefined = show all. */
  visibleColumns?: string[]
  /** Backlink counts (noteId → count) for the LinksChip. */
  backlinksMap?: Map<string, number>
  /** Full note lookup (id → Note) for resolving ParentChip titles. Built from
   *  the store's complete note set so a parent that's filtered out of the
   *  visible grid still resolves. Board parity (notesByIdForParent). */
  notesById?: Map<string, Note>
  /** Direct-children counts (parentId → count) for ChildrenChip. Board parity
   *  (childrenCountByParent). */
  childrenCountByParent?: Map<string, number>
  /** Store-backed group fold state (viewState.collapsedGroups) — shared w/ list. */
  collapsedGroups?: Set<string>
  onToggleGroup?: (groupKey: string) => void
}

function plaintextPreview(content: string | undefined, limit = 120): string {
  if (!content) return ""
  return content
    .replace(/\[\[wiki:([^\]]+)\]\]/g, "$1")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/^#+\s*/gm, "")
    .replace(/\n+/g, " ")
    .trim()
    .slice(0, limit)
}

function wordCount(content: string | undefined): number {
  if (!content) return 0
  const trimmed = content.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

function NoteGridCard({
  note,
  isActive,
  isSelected,
  folders,
  labels,
  tags,
  links,
  parentTitle,
  childrenCount,
  visibleColumns,
  onOpen,
  onDoubleClick,
  onSelect,
}: {
  note: Note
  isActive: boolean
  isSelected: boolean
  folders: Folder[]
  labels: Label[]
  tags: Tag[]
  links: number
  parentTitle?: string
  childrenCount?: number
  visibleColumns?: string[]
  onOpen: () => void
  onDoubleClick?: () => void
  onSelect?: () => void
}) {
  const preview = plaintextPreview(note.content)
  const words = wordCount(note.content)

  // Honor Display Properties — mirrors notes-board's isVisible. Undefined =
  // show all (back-compat). The TrashedChip is exempt (state flag, not column).
  const isVisible = (key: string) => !visibleColumns || visibleColumns.includes(key)

  // ── Resolve referenced entities for chip rendering (board parity) ──
  const noteFolderObjs = useMemo(() => {
    if (note.folderIds.length === 0) return []
    return note.folderIds
      .map((fid) => folders.find((f) => f.id === fid))
      .filter((f): f is Folder => !!f)
  }, [note.folderIds, folders])
  const label = note.labelId ? labels.find((l) => l.id === note.labelId) : null
  const noteTagObjs = useMemo(() => {
    if (!note.tags || note.tags.length === 0) return []
    return note.tags
      .map((id) => tags.find((t) => t.id === id))
      .filter((t): t is Tag => !!t)
  }, [note.tags, tags])

  // ── Build the property chip row (mirrors notes-board.tsx:510-590) ──
  // Status lives in the card header (StatusShapeIcon) — not re-rendered here.
  // Trashed is unconditional (a trashed item is always flagged).
  const propertyChips = useMemo(() => {
    const out: React.ReactNode[] = []
    if (note.trashed) {
      out.push(<TrashedChip key="trashed" />)
    }
    if (isVisible("priority") && note.priority !== "none") {
      out.push(<PriorityChip key="priority" priority={note.priority} />)
    }
    if (isVisible("folder") && noteFolderObjs.length > 0) {
      for (const f of noteFolderObjs) {
        out.push(<FolderChip key={`folder-${f.id}`} folder={f} />)
      }
    }
    if (label && isVisible("label")) {
      out.push(<LabelChip key="label" label={label} />)
    }
    if (isVisible("tags") && noteTagObjs.length > 0) {
      for (const t of noteTagObjs) {
        out.push(<TagChip key={`tag-${t.id}`} tag={t} />)
      }
    }
    if (parentTitle && isVisible("parent")) {
      out.push(<ParentChip key="parent" title={parentTitle} />)
    }
    if (isVisible("children") && (childrenCount ?? 0) > 0) {
      out.push(<ChildrenChip key="children" count={childrenCount!} />)
    }
    if (links > 0 && isVisible("links")) {
      out.push(<LinksChip key="links" count={links} />)
    }
    if (words > 0 && isVisible("wordCount")) {
      out.push(<WordsChip key="words" count={words} />)
    }
    if (isVisible("updatedAt")) {
      out.push(<UpdatedChip key="updated" iso={note.updatedAt} />)
    }
    if (isVisible("createdAt")) {
      out.push(<CreatedChip key="created" iso={note.createdAt} />)
    }
    return out
  }, [
    note.trashed, note.priority, note.updatedAt, note.createdAt,
    noteFolderObjs, label, noteTagObjs, parentTitle, childrenCount,
    links, words, visibleColumns,
  ]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      data-note-id={note.id}
      onClick={(e) => {
        if (onSelect) {
          e.stopPropagation()
          onSelect()
        } else {
          onOpen()
        }
      }}
      onDoubleClick={onDoubleClick}
      className={cn(
        "group relative flex cursor-pointer flex-col items-start gap-2 rounded-lg border bg-card p-4 text-left transition-all",
        note.trashed
          ? "border-border/60 opacity-50"
          : "border-border/60 hover:bg-hover-bg hover:border-border hover:shadow-sm",
        isSelected
          ? "border-accent/60 bg-accent/[0.04] ring-1 ring-accent/20"
          : isActive && "border-accent/60 bg-accent/[0.04]",
      )}
    >
      {/* Selection checkbox — hover or selected (board/table parity). */}
      <div
        className={cn(
          "absolute right-2 top-2 z-10 flex h-4 w-4 items-center justify-center rounded border transition-all",
          isSelected
            ? "border-accent bg-accent opacity-100"
            : "border-border bg-card opacity-0 group-hover:opacity-100 hover:border-foreground/50",
        )}
        onClick={(e) => {
          e.stopPropagation()
          onSelect?.()
        }}
      >
        {isSelected && <PhCheck className="text-accent-foreground" size={10} strokeWidth={2.5} />}
      </div>

      {/* Pin — yields its slot to the checkbox on hover/select. */}
      {note.pinned && (
        <PushPin
          size={11}
          fill="currentColor"
          strokeWidth={2}
          className={cn(
            "absolute top-2 text-amber-500 transition-all",
            isSelected ? "right-8" : "right-2 group-hover:right-8",
          )}
        />
      )}

      <StatusShapeIcon status={note.status} size={22} />

      <h3 className="text-note font-medium text-foreground line-clamp-2 leading-snug">
        {note.title || "Untitled"}
      </h3>

      {preview && (
        <p className="text-2xs text-muted-foreground line-clamp-3 leading-snug">
          {preview}
        </p>
      )}

      <div className="flex-1" />

      {/* Property chip row — board/grid parity (mirrors notes-board card).
          Single line, max 3 chips + "+N" overflow. Words/Updated/Created now
          live here (driven by Display Properties) instead of a bespoke footer. */}
      {propertyChips.length > 0 && (
        <div className="mt-1 w-full">
          <PropertyChipRow chips={propertyChips} maxVisible={3} />
        </div>
      )}
    </div>
  )
}

const GRID_COLS = "grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3"

export function NotesGridView({
  notes,
  groups,
  groupBy,
  onRowClick,
  onOpenEditor,
  label,
  activePreviewId,
  selectedIds,
  onSelect,
  folders,
  labels,
  tags,
  visibleColumns,
  backlinksMap,
  notesById,
  childrenCountByParent,
  collapsedGroups,
  onToggleGroup,
}: NotesGridViewProps) {
  // list-context-navigation: freeze the on-screen order into listNavContext
  // right before opening the editor (double-click → "← N/M →"). When grouped,
  // freeze the flattened group order so prev/next matches what's rendered.
  const captureListNav = useListNavCapture("notes")
  const grouped = !!groups && groupBy !== undefined && groupBy !== "none" && groups.length > 0
  const orderedIds = grouped ? flattenNoteGroupIds(groups!) : notes.map((n) => n.id)

  if (notes.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <p className="text-note text-muted-foreground">No notes</p>
      </div>
    )
  }

  const renderCard = (note: Note) => (
    <NoteGridCard
      key={note.id}
      note={note}
      isActive={activePreviewId === note.id}
      isSelected={selectedIds?.has(note.id) ?? false}
      folders={folders ?? []}
      labels={labels ?? []}
      tags={tags ?? []}
      links={backlinksMap?.get(note.id) ?? 0}
      parentTitle={
        note.parentNoteId ? notesById?.get(note.parentNoteId)?.title : undefined
      }
      childrenCount={childrenCountByParent?.get(note.id) ?? 0}
      visibleColumns={visibleColumns}
      onSelect={onSelect ? () => onSelect(note.id) : undefined}
      onOpen={() => onRowClick?.(note.id)}
      onDoubleClick={
        onOpenEditor
          ? () => {
              captureListNav(orderedIds, note.id, label ?? "Notes", grouped ? noteGroupsToListNav(groups!) : undefined)
              onOpenEditor(note.id)
            }
          : undefined
      }
    />
  )

  return (
    <div className="flex-1 overflow-y-auto">
      {grouped ? (
        <div className="space-y-6 p-6">
          {groups!.map((g) => {
            const isCollapsed = collapsedGroups?.has(g.key) ?? false
            return (
              <section key={g.key}>
                <div
                  className="flex items-center gap-2 px-0.5 py-1 cursor-pointer select-none"
                  onClick={() => onToggleGroup?.(g.key)}
                >
                  <ChevronDown
                    className={cn("text-muted-foreground transition-transform", isCollapsed && "-rotate-90")}
                    size={12}
                    strokeWidth={2}
                  />
                  <GroupHeaderIcon groupBy={groupBy!} groupKey={g.key} folders={folders} labels={labels ?? []} />
                  <span className="a-tg__label">
                    {resolveGroupLabel(groupBy!, g.key, g.label, folders ?? [], labels ?? [])}
                  </span>
                  <span className="a-tg__count tabular-nums">{g.notes.length}</span>
                  <div className="a-tg__line flex-1" />
                </div>
                {!isCollapsed && <div className={cn(GRID_COLS, "mt-3")}>{g.notes.map(renderCard)}</div>}
              </section>
            )
          })}
        </div>
      ) : (
        <div className={cn(GRID_COLS, "p-6")}>{notes.map(renderCard)}</div>
      )}
    </div>
  )
}
