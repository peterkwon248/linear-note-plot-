"use client"

/**
 * v3 Phase 5.3 — Editorial shell.
 *
 * Wraps `<EditorialView>` with the same workspace `<ViewHeader>` chrome that
 * `<NotesTable>` / `<GalleryViewShell>` / `<StudioViewShell>` use, so swapping
 * modes via `<ViewSwitcher>` keeps the Filter / Display / Save / Detail /
 * Create toolbar identical.
 *
 * Why a separate shell rather than reusing NotesTable/Gallery?
 *   - Editorial's body is a magazine spread (masthead + 2-column feature +
 *     companion rail). The table virtualization, gallery card grid, and
 *     studio rail-list don't apply.
 *   - The body inherits `Source Serif 4` typography and a warm canvas; both
 *     would conflict with table chrome. Keeping it as a parallel shell
 *     mirrors the Phase 5.1 / 5.2 isolation of mockup CSS.
 */

import { useEffect } from "react"
import { Newspaper } from "@phosphor-icons/react/dist/ssr/Newspaper"
import { ViewHeader } from "@/components/view-header"
import { FilterPanel } from "@/components/filter-panel"
import { DisplayPanel } from "@/components/display-panel"
import { FilterChipBar } from "@/components/filter-bar"
import { EditorialView } from "@/components/views/editorial-view"
import { useNotesView } from "@/lib/view-engine/use-notes-view"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { useSaveViewProps } from "@/lib/view-engine/use-save-view-props"
import { NOTES_VIEW_CONFIG } from "@/lib/view-engine/view-configs"
import { usePlotStore } from "@/lib/store"
import { usePendingFilters, clearPendingFilters } from "@/lib/table-route"
import type { ViewContextKey, FilterRule } from "@/lib/view-engine/types"
import type { ReactNode } from "react"

interface EditorialViewShellProps {
  context: ViewContextKey
  title?: string
  hideCreateButton?: boolean
  folderId?: string
  tagId?: string
  labelId?: string
  /** Toolbar slot — receives the <ViewSwitcher> from NotesTableView. */
  headerExtras?: ReactNode
  /** Rail entry click handler — wires to preview pane. */
  onNoteClick: (id: string) => void
  /** Currently active / featured note id. */
  activePreviewId: string | null
}

export function EditorialViewShell({
  context,
  title,
  hideCreateButton = false,
  folderId,
  tagId,
  labelId,
  headerExtras,
  onNoteClick,
  activePreviewId,
}: EditorialViewShellProps) {
  const folders = usePlotStore((s) => s.folders)
  const labels = usePlotStore((s) => s.labels)
  const tags = usePlotStore((s) => s.tags)
  const sidePanelOpen = usePlotStore((s) => s.sidePanelOpen)
  const createNote = usePlotStore((s) => s.createNote)
  const openNote = usePlotStore((s) => s.openNote)

  const backlinksMap = useBacklinksIndex()
  const { saveViewMode, onSaveView } = useSaveViewProps(context as any, "notes")
  const { flatNotes, viewState, updateViewState } = useNotesView(
    context,
    { backlinksMap, folderId, tagId, labelId },
  )

  /* ── Pending filters injection from Home cards (parity w/ NotesTable) ── */
  const pendingFilters = usePendingFilters()
  useEffect(() => {
    if (pendingFilters && pendingFilters.length > 0) {
      updateViewState({ filters: pendingFilters })
      clearPendingFilters()
    }
  }, [pendingFilters, updateViewState])

  /* ── Filter actions — mirror NotesTable.handleFilterToggle ── */
  const handleFilterToggleRule = (rule: FilterRule) => {
    const exists = viewState.filters.some(
      (f) => f.field === rule.field && f.operator === rule.operator && f.value === rule.value,
    )
    const next = exists
      ? viewState.filters.filter(
          (f) => !(f.field === rule.field && f.operator === rule.operator && f.value === rule.value),
        )
      : [...viewState.filters, rule]
    updateViewState({ filters: next })
  }
  const handleFilterToggleArgs = (
    field: FilterRule["field"],
    value: string,
    operator?: FilterRule["operator"],
  ) => handleFilterToggleRule({ field, operator: operator ?? "eq", value })

  /* ── Hydrate filter category values (folders / labels / tags) ── */
  const filteredCategories = NOTES_VIEW_CONFIG.filterCategories.map((cat) => {
    if (cat.key === "folder") {
      return {
        ...cat,
        values: folders
          .filter((f) => f.kind === "note")
          .map((f) => ({ key: f.id, label: f.name, color: f.color ?? undefined })),
      }
    }
    if (cat.key === "label") {
      return {
        ...cat,
        values: labels
          .filter((l) => !l.trashed)
          .map((l) => ({ key: l.id, label: l.name, color: l.color ?? undefined })),
      }
    }
    if (cat.key === "tags") {
      return {
        ...cat,
        values: tags
          .filter((t) => !t.trashed)
          .map((t) => ({ key: t.id, label: t.name, color: t.color ?? undefined })),
      }
    }
    return cat
  })

  return (
    <main className="flex h-full flex-1 flex-col overflow-hidden bg-background">
      <ViewHeader
        icon={<Newspaper size={20} weight="regular" />}
        title={title ?? "Notes"}
        count={flatNotes.length}
        saveViewMode={saveViewMode}
        onSaveView={onSaveView}
        extraToolbarButtons={headerExtras}
        showFilter
        hasActiveFilters={viewState.filters.length > 0}
        filterContent={
          <FilterPanel
            categories={filteredCategories}
            activeFilters={viewState.filters}
            onToggle={handleFilterToggleRule}
            quickFilters={NOTES_VIEW_CONFIG.quickFilters as any}
            onQuickFilter={(rules) => updateViewState({ filters: rules })}
          />
        }
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
                const id = createNote({})
                if (id) openNote(id)
              }
            : undefined
        }
      >
        <FilterChipBar
          filters={viewState.filters}
          groupBy={viewState.groupBy}
          isSingleStatusTab={false}
          folders={folders}
          tags={tags.filter((t) => !t.trashed)}
          labels={labels.filter((l) => !l.trashed)}
          onToggleFilter={handleFilterToggleArgs}
          onRemoveFilter={(idx: number) =>
            updateViewState({ filters: viewState.filters.filter((_, i) => i !== idx) })
          }
          onClearAll={() => updateViewState({ filters: [] })}
          onSetFilters={(filters) => updateViewState({ filters })}
          onUpdateFilter={(idx, rule) => {
            const next = [...(viewState.filters ?? [])]
            next[idx] = rule
            updateViewState({ filters: next })
          }}
        />
      </ViewHeader>

      {/* ── Editorial body (warm canvas, .u-mode wrapper provides positioned parent) ── */}
      <div className="u-mode flex flex-1 overflow-hidden" data-mode="editorial">
        <EditorialView
          notes={flatNotes}
          activeNoteId={activePreviewId}
          onNoteClick={onNoteClick}
        />
      </div>
    </main>
  )
}
