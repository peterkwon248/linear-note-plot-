"use client"

/**
 * v3 Phase 5.1 — Gallery shell.
 *
 * Wraps `<GalleryView>` with the same workspace `<ViewHeader>` chrome that
 * `<NotesTable>` / `<NotesBoard>` use, keeping the Filter / Display / Save /
 * Detail / Create toolbar identical. Gallery mode is selected via the Display
 * popover (supportedModes: ["list", "board", "gallery"]).
 *
 * Why a separate shell rather than reusing NotesTable/Board?
 *   - Gallery's body is a card grid; the table virtualization, sticky column
 *     header, alphabetical-index toggle, and group-collapse rail don't apply.
 *   - Routing the Gallery body through NotesTable would require gating ~30
 *     table-only behaviors. Keeping a parallel shell is simpler and isolates
 *     mockup CSS to mockup-fed components.
 */

import { useEffect, useMemo, type ReactNode } from "react"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { Folder as FolderIcon } from "@phosphor-icons/react/dist/ssr/Folder"
import { Hash } from "@phosphor-icons/react/dist/ssr/Hash"
import { Tree } from "@phosphor-icons/react/dist/ssr/Tree"
import { ViewHeader } from "@/components/view-header"
import { FilterPanel } from "@/components/filter-panel"
import { DisplayPanel } from "@/components/display-panel"
import { FilterChipBar } from "@/components/filter-bar"
import { GalleryView, type GalleryGroup, type GalleryItem } from "@/components/views/gallery-view"
import { StatusShapeIcon } from "@/components/status-icon"
import { useNotesView } from "@/lib/view-engine/use-notes-view"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { useSaveViewProps } from "@/lib/view-engine/use-save-view-props"
import { NOTES_VIEW_CONFIG } from "@/lib/view-engine/view-configs"
import { NOTE_STATUS_HEX, SPACE_COLORS } from "@/lib/colors"
import { shortRelative } from "@/lib/format-utils"
import { usePlotStore } from "@/lib/store"
import { usePendingFilters, clearPendingFilters } from "@/lib/table-route"
import type { ViewContextKey, FilterRule, GroupBy } from "@/lib/view-engine/types"
import type { Note, NoteStatus } from "@/lib/types"

interface GalleryViewShellProps {
  context: ViewContextKey
  title?: string
  hideCreateButton?: boolean
  folderId?: string
  tagId?: string
  labelId?: string
  /** Optional extra toolbar nodes rendered before the standard buttons. */
  headerExtras?: ReactNode
  /** Card click handler — wires to preview pane. */
  onNoteClick: (id: string) => void
  /** Currently active / previewed note id. */
  activePreviewId: string | null
}

export function GalleryViewShell({
  context,
  title,
  hideCreateButton = false,
  folderId,
  tagId,
  labelId,
  headerExtras,
  onNoteClick,
  activePreviewId,
}: GalleryViewShellProps) {
  const folders = usePlotStore((s) => s.folders)
  const labels = usePlotStore((s) => s.labels)
  const tags = usePlotStore((s) => s.tags)
  const sidePanelOpen = usePlotStore((s) => s.sidePanelOpen)
  const createNote = usePlotStore((s) => s.createNote)
  const openNote = usePlotStore((s) => s.openNote)

  const backlinksMap = useBacklinksIndex()
  const { saveViewMode, onSaveView } = useSaveViewProps(context as any, "notes")
  const { flatNotes, groups, viewState, updateViewState } = useNotesView(
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
  // FilterPanel passes a FilterRule (object form).
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
  // FilterChipBar uses a (field, value, operator?) signature.
  const handleFilterToggleArgs = (
    field: FilterRule["field"],
    value: string,
    operator?: FilterRule["operator"],
  ) => handleFilterToggleRule({ field, operator: operator ?? "eq", value })

  /* ── Notes → Gallery adapter ──
   * Honor view-engine groupBy (status/folder/label/tags/parent/...)
   * and sortFields by reusing the `groups` returned from useNotesView.
   * When groupBy = "none" the engine returns a single synthetic group; we
   * pass the flat items directly so the gallery renders without a header. */
  const { galleryItems, galleryGroups } = useMemo<{
    galleryItems?: GalleryItem[]
    galleryGroups?: GalleryGroup[]
  }>(() => {
    const isUngrouped = viewState.groupBy === "none" || groups.length <= 1
    if (isUngrouped) {
      return { galleryItems: flatNotes.map((n) => noteToGalleryItem(n, labels, tags)) }
    }
    return {
      galleryGroups: groups.map((g) => ({
        id: g.key,
        label: g.label,
        icon: getGroupIcon(viewState.groupBy, g.key, labels),
        items: g.notes.map((n) => noteToGalleryItem(n, labels, tags)),
      })),
    }
  }, [viewState.groupBy, groups, flatNotes, labels, tags])

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
        icon={<FileText size={20} weight="regular" />}
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
            usePlotStore.setState({ sidePanelMode: 'detail' })
          } else if (store.sidePanelMode === 'detail') {
            store.setSidePanelOpen(false)
          } else {
            usePlotStore.setState({ sidePanelMode: 'detail' })
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

      {/* ── Gallery body ── */}
      <div className="flex flex-1 overflow-hidden">
        <GalleryView
          items={galleryItems}
          groups={galleryGroups}
          activeId={activePreviewId}
          onItemClick={onNoteClick}
        />
      </div>
    </main>
  )
}

/* ── Group header icon mapping ──
 * Mirrors list/board group iconography so the gallery doesn't feel
 * orphaned. status uses Plot's stone/brick/keystone shapes; label
 * uses a colored dot derived from the label entity. */

function getGroupIcon(
  groupBy: GroupBy | undefined,
  key: string,
  labels: Array<{ id: string; name: string; color?: string | null }>,
): ReactNode {
  if (!groupBy || groupBy === "none") return null
  switch (groupBy) {
    case "status": {
      const statusKeys: NoteStatus[] = ["stone", "brick", "keystone"]
      if (!statusKeys.includes(key as NoteStatus)) return null
      return <StatusShapeIcon status={key as NoteStatus} size={14} />
    }
    case "label": {
      const label = labels.find((l) => l.id === key)
      const color = label?.color || "#6b7280"
      return <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
    }
    case "folder":
      return <FolderIcon size={14} weight="regular" className="text-muted-foreground" />
    case "tag":
      return <Hash size={14} weight="regular" className="text-muted-foreground" />
    case "family":
    case "parent":
      return <Tree size={14} weight="regular" className="text-muted-foreground" />
    default:
      return null
  }
}

/* ── Notes adapter: single-note → GalleryItem ────────────────────────────
 * Accent priority: label color → status color → notes-space fallback.
 * Grouping is delegated to the view-engine (`useNotesView`'s `groups`),
 * so this helper only handles per-item presentation. */

function noteToGalleryItem(
  n: Note,
  labels: Array<{ id: string; name: string; color?: string | null }>,
  tags: Array<{ id: string; name: string }>,
): GalleryItem {
  const label = n.labelId ? labels.find((l) => l.id === n.labelId) : undefined
  const accentColor =
    (label?.color ?? null) ||
    NOTE_STATUS_HEX[n.status as keyof typeof NOTE_STATUS_HEX] ||
    SPACE_COLORS.notes

  const tagNames = (n.tags ?? [])
    .map((id) => tags.find((t) => t.id === id)?.name)
    .filter(Boolean) as string[]

  return {
    id: n.id,
    title: n.title || "Untitled",
    excerpt: n.summary || n.preview || "",
    accentColor,
    badge: label ? { label: label.name } : undefined,
    metaLeft: tagNames,
    metaRight: [shortRelative(n.updatedAt)],
  }
}
