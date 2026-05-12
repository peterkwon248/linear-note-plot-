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

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { toast } from "sonner"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { Folder as FolderIcon } from "@phosphor-icons/react/dist/ssr/Folder"
import { Tag as TagIcon } from "@phosphor-icons/react/dist/ssr/Tag"
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
import { getSnoozeTime } from "@/lib/queries/notes"
import type { ViewContextKey, FilterRule, GroupBy } from "@/lib/view-engine/types"
import type { Note, NoteStatus } from "@/lib/types"
// 2026-05-12: Gallery shares the full 13-item right-click menu with
// list/board via the NoteContextMenuItems helper (Linear principle).
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { useFolderPickerData } from "@/components/folder-picker"
import { NoteContextMenuItems } from "@/components/note-context-menu-items"
// 2026-05-12: Multi-select + 하단 FloatingActionBar (list/board parity).
import { FloatingActionBar } from "@/components/floating-action-bar"

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
  /** 2026-05-12: Double-click opens the note (list/board parity). */
  onNoteDoubleClick?: (id: string) => void
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
  onNoteDoubleClick,
  activePreviewId,
}: GalleryViewShellProps) {
  const folders = usePlotStore((s) => s.folders)
  const labels = usePlotStore((s) => s.labels)
  const tags = usePlotStore((s) => s.tags)
  const sidePanelOpen = usePlotStore((s) => s.sidePanelOpen)
  const createNote = usePlotStore((s) => s.createNote)
  const openNote = usePlotStore((s) => s.openNote)
  // 2026-05-12: store actions wired for the gallery card right-click menu
  // (shared with list/board via NoteContextMenuItems).
  const updateNote = usePlotStore((s) => s.updateNote)
  const triageKeep = usePlotStore((s) => s.triageKeep)
  const triageSnooze = usePlotStore((s) => s.triageSnooze)
  const triageTrash = usePlotStore((s) => s.triageTrash)
  const promoteToPermanent = usePlotStore((s) => s.promoteToPermanent)
  const undoPromote = usePlotStore((s) => s.undoPromote)
  const moveBackToInbox = usePlotStore((s) => s.moveBackToInbox)
  const setReminder = usePlotStore((s) => s.setReminder)
  const setMergePickerOpen = usePlotStore((s) => s.setMergePickerOpen)
  const setLinkPickerOpen = usePlotStore((s) => s.setLinkPickerOpen)
  const notesAll = usePlotStore((s) => s.notes)
  const { folders: noteFolders, createFolderInline } = useFolderPickerData("note")

  // 2026-05-12: Multi-select state — Linear-principle parity with list/board.
  // Single click = preview, cmd/ctrl-click 또는 checkbox click = toggle select.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const handleClearSelection = () => setSelectedIds(new Set())

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
   * Honor view-engine groupBy (status/folder/label/tags/priority/parent/...)
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

      {/* ── Multi-select FloatingActionBar (list/board parity) ── */}
      {selectedIds.size > 0 && (
        <FloatingActionBar
          selectedIds={selectedIds}
          effectiveTab={context}
          notes={notesAll}
          onClearSelection={handleClearSelection}
        />
      )}

      {/* ── Gallery body ── */}
      <div className="flex flex-1 overflow-hidden">
        <GalleryView
          items={galleryItems}
          groups={galleryGroups}
          activeId={activePreviewId}
          selectedIds={selectedIds}
          onItemToggleSelect={handleToggleSelect}
          onItemClick={(id) => {
            // Selection 활성 중에 일반 click = selection clear + preview (list 패턴)
            if (selectedIds.size > 0) handleClearSelection()
            onNoteClick(id)
          }}
          onItemDoubleClick={onNoteDoubleClick}
          renderContextMenu={(item, card) => {
            // 2026-05-12: Gallery card right-click — match list/board via
            // shared NoteContextMenuItems. GalleryItem only carries cosmetic
            // fields, so look up the real Note from the store.
            const note = notesAll.find((n) => n.id === item.id)
            if (!note) return card
            return (
              <ContextMenu>
                <ContextMenuTrigger asChild>{card}</ContextMenuTrigger>
                <ContextMenuContent className="w-52">
                  <NoteContextMenuItems
                    note={note}
                    noteFolders={noteFolders}
                    createFolderInline={createFolderInline}
                    onKeep={() => triageKeep(note.id)}
                    onSnooze={(opt) => triageSnooze(note.id, getSnoozeTime(opt))}
                    onTrash={() => triageTrash(note.id)}
                    onPromote={() => promoteToPermanent(note.id)}
                    onMoveBack={() => moveBackToInbox(note.id)}
                    onDemote={() => undoPromote(note.id)}
                    onRemind={(isoDate) => { setReminder(note.id, isoDate); toast("Reminder set") }}
                    onTogglePin={() => {
                      const nextPinned = !note.pinned
                      updateNote(note.id, { pinned: nextPinned })
                      toast.success(nextPinned ? "Pinned note" : "Unpinned note")
                    }}
                    onOpen={() => openNote(note.id)}
                    onMergeWith={() => setMergePickerOpen(true, note.id)}
                    onLinkWith={() => setLinkPickerOpen(true, note.id)}
                    onShowConnected={(direction) => {
                      const otherRules = (viewState.filters ?? []).filter(
                        (r) => r.field !== "connectedTo"
                      )
                      updateViewState({
                        filters: [
                          ...otherRules,
                          { field: "connectedTo", operator: "eq", value: `${note.id}:${direction}` },
                        ],
                      })
                      const dirLabel = direction === "in" ? "backlinks" : direction === "out" ? "links out" : "both directions"
                      toast(`Filtering: connected to "${note.title || "Untitled"}" (${dirLabel})`)
                    }}
                    onSetFolder={(folderId) => updateNote(note.id, { folderIds: folderId ? [folderId] : [] })}
                    onSetFolders={(folderIds) => usePlotStore.getState().setNoteFolders(note.id, folderIds)}
                  />
                </ContextMenuContent>
              </ContextMenu>
            )
          }}
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
    case "priority":
      return <TagIcon size={14} weight="regular" className="text-muted-foreground" />
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
