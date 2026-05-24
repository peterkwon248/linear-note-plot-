"use client"

/**
 * NotesTimelineShell — data + selection + chrome wrapper around NotesTimelineView.
 *
 * Mirrors NotesTable's chrome (ViewHeader + FilterChipBar) so the timeline
 * view exposes the same Filter / Display / Save view / Detail panel toolbar
 * that the list/board views have. Without this Shell wiring the ViewHeader,
 * Notes timeline would lose its filter+display panel (NotesTable hosts the
 * ViewHeader inline, so the timeline mode in NotesTableView previously
 * rendered headless).
 */

import { useState, useCallback, useMemo } from "react"
import { FileText } from "lucide-react"
import type { ViewContextKey, FilterRule } from "@/lib/view-engine/types"
import type { Note, NoteStatus } from "@/lib/types"
import { usePlotStore } from "@/lib/store"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { useNotesView } from "@/lib/view-engine/use-notes-view"
import { useSaveViewProps } from "@/lib/view-engine/use-save-view-props"
import { NotesTimelineView } from "@/components/views/notes-timeline-view"
import { ViewHeader } from "@/components/view-header"
import { StatusShapeIcon } from "@/components/status-icon"
import { FilterPanel } from "@/components/filter-panel"
import { DisplayPanel } from "@/components/display-panel"
import { FilterChipBar } from "@/components/filter-bar"
import { NOTES_VIEW_CONFIG } from "@/lib/view-engine/view-configs"

interface NotesTimelineShellProps {
  context: ViewContextKey
  title?: string
  hideCreateButton?: boolean
  createNoteOverrides?: Partial<Note>
  folderId?: string
  tagId?: string
  labelId?: string
  /** Single-click → side-panel preview (Notes parity). */
  onRowClick?: (noteId: string) => void
  activePreviewId?: string | null
}

export function NotesTimelineShell({
  context,
  title,
  hideCreateButton = false,
  createNoteOverrides,
  folderId,
  tagId,
  labelId,
  onRowClick,
  activePreviewId,
}: NotesTimelineShellProps) {
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

  const isSingleStatusTab = ["stone", "brick", "keystone"].includes(context)

  // Dynamic filter categories — inject folder/label/tag counts so the
  // FilterPanel inside ViewHeader matches NotesTable's shape exactly.
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

  // Single-status tabs (stone/brick/keystone) hide the Status category — the
  // context already pre-filters to a single status.
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

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const handleOpenNote = useCallback(
    (id: string) => {
      // Single-click → preview (handled by onRowClick). Real open routes
      // through the editor stack via openNote in handlers above.
      onRowClick?.(id)
    },
    [onRowClick],
  )

  const handleSelect = useCallback(
    (id: string, opts: { multi?: boolean; shift?: boolean; index?: number }) => {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        if (opts.multi) {
          if (next.has(id)) next.delete(id)
          else next.add(id)
        } else {
          next.clear()
          next.add(id)
        }
        return next
      })
    },
    [],
  )

  return (
    <main className="flex h-full flex-1 flex-col overflow-hidden bg-background">
      <ViewHeader
        icon={
          context === "stone" || context === "brick" || context === "keystone" ? (
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
          groupBy={viewState.groupBy}
          isSingleStatusTab={isSingleStatusTab}
          folders={folders}
          tags={tags.filter((t) => !t.trashed)}
          labels={labels.filter((l) => !l.trashed)}
          onToggleFilter={toggleFilter}
          onRemoveFilter={removeFilter}
          onClearAll={() => updateViewState({ filters: [] })}
          onSetFilters={(filters) => updateViewState({ filters })}
          onUpdateFilter={(idx, rule) => {
            const next = [...(viewState.filters ?? [])]
            next[idx] = rule
            updateViewState({ filters: next })
          }}
        />
      </ViewHeader>

      <div className="flex flex-1 overflow-hidden">
        <NotesTimelineView
          notes={flatNotes}
          viewState={viewState}
          noteGroups={groups}
          selectedIds={selectedIds}
          activeNoteId={activePreviewId ?? null}
          onOpenNote={handleOpenNote}
          onSelect={handleSelect}
          onUpdateViewState={updateViewState}
        />
      </div>
    </main>
  )
}
