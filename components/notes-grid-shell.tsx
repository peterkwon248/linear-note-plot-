"use client"

/**
 * NotesGridShell — chrome wrapper around NotesGridView.
 *
 * Mirrors NotesTimelineShell so the grid mode exposes the same ViewHeader
 * (Filter / Display / Save view / Detail panel / Create) as list/board.
 * Without this shell, NotesTableView's grid branch would render a headless
 * card grid — `NotesTable`'s ViewHeader is bound to its own list view.
 *
 * Pattern: same chrome composition as `notes-timeline-shell.tsx`. Cleanup
 * follow-up could extract the chrome into a reusable `<NotesViewChrome>`
 * — keeping it inline for v1 to bound the diff.
 */

import { useCallback, useMemo, useState, useEffect } from "react"
import { FileText } from "lucide-react"
import type { ViewContextKey, FilterRule } from "@/lib/view-engine/types"
import type { Note, NoteStatus } from "@/lib/types"
import { usePlotStore } from "@/lib/store"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { useNotesView } from "@/lib/view-engine/use-notes-view"
import { useSaveViewProps } from "@/lib/view-engine/use-save-view-props"
import { NotesGridView } from "@/components/views/notes-grid-view"
import { FloatingActionBar } from "@/components/floating-action-bar"
import { ViewHeader } from "@/components/view-header"
import { StatusShapeIcon } from "@/components/status-icon"
import { FilterPanel } from "@/components/filter-panel"
import { DisplayPanel } from "@/components/display-panel"
import { FilterChipBar } from "@/components/filter-bar"
import { NOTES_VIEW_CONFIG } from "@/lib/view-engine/view-configs"

interface NotesGridShellProps {
  context: ViewContextKey
  title?: string
  hideCreateButton?: boolean
  createNoteOverrides?: Partial<Note>
  folderId?: string
  tagId?: string
  labelId?: string
  onRowClick?: (noteId: string) => void
  activePreviewId?: string | null
}

export function NotesGridShell({
  context,
  title,
  hideCreateButton = false,
  createNoteOverrides,
  folderId,
  tagId,
  labelId,
  onRowClick,
  activePreviewId,
}: NotesGridShellProps) {
  const backlinksMap = useBacklinksIndex()
  const folders = usePlotStore((s) => s.folders)
  const labels = usePlotStore((s) => s.labels)
  const tags = usePlotStore((s) => s.tags)
  const notes = usePlotStore((s) => s.notes)
  const createNote = usePlotStore((s) => s.createNote)
  const openNote = usePlotStore((s) => s.openNote)
  const sidePanelOpen = usePlotStore((s) => s.sidePanelOpen)

  const { flatNotes, groups, viewState, updateViewState } = useNotesView(context, {
    backlinksMap,
    folderId,
    tagId,
    labelId,
  })

  const { saveViewMode, onSaveView } = useSaveViewProps(context as any, "notes")

  // Multi-select (board/table parity). Hover checkbox toggles membership;
  // the FloatingActionBar surfaces bulk actions while a selection is active.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const selectionActive = selectedIds.size > 0

  const handleCardSelect = useCallback((noteId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(noteId)) next.delete(noteId)
      else next.add(noteId)
      return next
    })
  }, [])

  // Single selection → side-panel preview (board/table parity).
  useEffect(() => {
    if (selectedIds.size === 1) onRowClick?.(Array.from(selectedIds)[0])
  }, [selectedIds]) // eslint-disable-line react-hooks/exhaustive-deps

  // ESC clears the selection.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedIds.size > 0) setSelectedIds(new Set())
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [selectedIds.size])

  // Clear selection when the view context changes (route / folder / tab switch).
  useEffect(() => {
    setSelectedIds(new Set())
  }, [context])

  const isSingleStatusTab = ["backlog", "todo", "in_progress", "done"].includes(context)

  const notesFilterCategories = useMemo(() => {
    return NOTES_VIEW_CONFIG.filterCategories.map((cat) => {
      if (cat.key === "folder") {
        return {
          ...cat,
          values: folders.map((f) => ({
            key: f.id,
            label: f.name,
            count: notes.filter((n) => !n.trashed && n.folderIds.includes(f.id)).length,
          })),
        }
      }
      if (cat.key === "label") {
        return {
          ...cat,
          values: labels
            .filter((l) => !l.trashed)
            .map((l) => ({
              key: l.id,
              label: l.name,
              color: l.color,
              count: notes.filter((n) => !n.trashed && n.labelId === l.id).length,
            })),
        }
      }
      if (cat.key === "tags") {
        return {
          ...cat,
          values: tags
            .filter((t) => !t.trashed)
            .map((t) => ({
              key: t.id,
              label: t.name,
              count: notes.filter((n) => !n.trashed && n.tags?.includes(t.id)).length,
            })),
        }
      }
      if (cat.key === "status") {
        return {
          ...cat,
          values: cat.values.map((v) => ({
            ...v,
            count: notes.filter((n) => !n.trashed && n.status === v.key).length,
          })),
        }
      }
      return cat
    })
  }, [folders, labels, tags, notes])

  const filteredCategories = useMemo(() => {
    if (isSingleStatusTab) {
      return notesFilterCategories.filter((cat) => cat.key !== "status")
    }
    return notesFilterCategories
  }, [notesFilterCategories, isSingleStatusTab])

  const handleFilterToggle = useCallback(
    (rule: FilterRule) => {
      const exists = viewState.filters.some(
        (f) => f.field === rule.field && f.operator === rule.operator && f.value === rule.value,
      )
      if (exists) {
        updateViewState({
          filters: viewState.filters.filter(
            (f) =>
              !(f.field === rule.field && f.operator === rule.operator && f.value === rule.value),
          ),
        })
      } else {
        updateViewState({ filters: [...viewState.filters, rule] })
      }
    },
    [viewState.filters, updateViewState],
  )

  const toggleFilter = useCallback(
    (field: FilterRule["field"], value: string, operator: FilterRule["operator"] = "eq") => {
      handleFilterToggle({ field, operator, value })
    },
    [handleFilterToggle],
  )

  const removeFilter = useCallback(
    (idx: number) => {
      updateViewState({ filters: viewState.filters.filter((_, i) => i !== idx) })
    },
    [viewState.filters, updateViewState],
  )

  // ── Parent / Children lookups for the card property-chip row (board parity).
  // Built from the full store `notes` so a ParentChip resolves even when the
  // parent is filtered out of the visible grid. Computed lazily — only when the
  // relevant chip column is enabled in Display Properties. Mirrors notes-board's
  // notesByIdForParent / childrenCountByParent. */
  const showParentChip = !viewState.visibleColumns || viewState.visibleColumns.includes("parent")
  const showChildrenChip = !viewState.visibleColumns || viewState.visibleColumns.includes("children")

  const notesById = useMemo(() => {
    if (!showParentChip) return undefined
    const m = new Map<string, Note>()
    for (const n of notes) m.set(n.id, n)
    return m
  }, [notes, showParentChip])

  const childrenCountByParent = useMemo(() => {
    if (!showChildrenChip) return undefined
    const m = new Map<string, number>()
    for (const n of notes) {
      if (n.parentNoteId && !n.trashed) {
        m.set(n.parentNoteId, (m.get(n.parentNoteId) ?? 0) + 1)
      }
    }
    return m
  }, [notes, showChildrenChip])

  // Store-backed group fold state (shared with list via viewState.collapsedGroups).
  const collapsedGroups = useMemo(
    () => new Set(viewState.collapsedGroups ?? []),
    [viewState.collapsedGroups],
  )
  const handleToggleGroup = useCallback(
    (key: string) => {
      const next = new Set(collapsedGroups)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      updateViewState({ collapsedGroups: Array.from(next) })
    },
    [collapsedGroups, updateViewState],
  )

  return (
    <main className="flex h-full flex-1 flex-col overflow-hidden bg-background">
      <ViewHeader
        icon={
          context === "backlog" || context === "todo" || context === "in_progress" || context === "done" ? (
            <StatusShapeIcon status={context as NoteStatus} size={20} />
          ) : (
            <FileText size={20} strokeWidth={2} />
          )
        }
        title={title ?? "Notes"}
        count={flatNotes.length}
        saveViewMode={saveViewMode}
        onSaveView={onSaveView}
        showFilter
        hasActiveFilters={viewState.filters.length > 0}
        filterContent={
          <FilterPanel
            categories={filteredCategories}
            activeFilters={viewState.filters}
            onToggle={handleFilterToggle}
            quickFilters={NOTES_VIEW_CONFIG.quickFilters as any}
            onQuickFilter={(rules) => updateViewState({ filters: rules })}
          />
        }
        quickFilters={NOTES_VIEW_CONFIG.quickFilters as any}
        activeFilters={viewState.filters as any}
        onFiltersChange={(filters) => updateViewState({ filters: filters as any })}
        showDisplay
        displayContent={
          <DisplayPanel
            config={NOTES_VIEW_CONFIG.displayConfig}
            viewState={viewState}
            onViewStateChange={(patch) => updateViewState(patch)}
            showViewMode
            toggleStates={viewState.toggles ?? {}}
            onToggleChange={(key, value) =>
              updateViewState({ toggles: { ...(viewState.toggles ?? {}), [key]: value } })
            }
          />
        }
        showDetailPanel
        detailPanelOpen={sidePanelOpen}
        onDetailPanelToggle={() => {
          const store = usePlotStore.getState()
          if (!store.sidePanelOpen) {
            store.setSidePanelOpen(true)
            usePlotStore.setState({ sidePanelMode: "detail" })
          } else if (store.sidePanelMode === "detail") {
            store.setSidePanelOpen(false)
          } else {
            usePlotStore.setState({ sidePanelMode: "detail" })
          }
        }}
        onCreateNew={
          !hideCreateButton
            ? () => {
                const id = createNote(createNoteOverrides ?? {})
                if (id) openNote(id)
              }
            : undefined
        }
      >
        <FilterChipBar
          filters={viewState.filters}
          folders={folders}
          tags={tags.filter((t) => !t.trashed)}
          labels={labels.filter((l) => !l.trashed)}
          onRemoveFilter={removeFilter}
          onClearAll={() => updateViewState({ filters: [] })}
          filterCategories={filteredCategories}
          onToggleRule={handleFilterToggle}
          quickFilters={NOTES_VIEW_CONFIG.quickFilters as any}
          onQuickFilter={(rules) => updateViewState({ filters: rules })}
          onUpdateFilter={(idx, rule) => {
            const next = [...(viewState.filters ?? [])]
            next[idx] = rule
            updateViewState({ filters: next })
          }}
        />
      </ViewHeader>

      <NotesGridView
        notes={flatNotes}
        groups={groups}
        groupBy={viewState.groupBy}
        onRowClick={onRowClick}
        onOpenEditor={(id) => openNote(id)}
        label={title ?? "Notes"}
        activePreviewId={activePreviewId}
        selectedIds={selectedIds}
        onSelect={handleCardSelect}
        folders={folders}
        labels={labels}
        tags={tags}
        visibleColumns={viewState.visibleColumns}
        backlinksMap={backlinksMap}
        notesById={notesById}
        childrenCountByParent={childrenCountByParent}
        collapsedGroups={collapsedGroups}
        onToggleGroup={handleToggleGroup}
      />

      {selectionActive && (
        <FloatingActionBar
          selectedIds={selectedIds}
          effectiveTab={context}
          notes={flatNotes}
          onClearSelection={() => setSelectedIds(new Set())}
        />
      )}
    </main>
  )
}
