"use client"

import { useMemo, useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { WikiGroupHeaderIcon } from "@/components/views/wiki-shared"
import { shortRelative } from "@/lib/format-utils"
import { setWikiViewMode, useWikiStatusFilter, setWikiStatusFilter } from "@/lib/wiki-view-mode"
import { useT } from "@/lib/i18n"
import { usePlotStore } from "@/lib/store"
import { getPlannedDateForWiki } from "@/lib/store/hook-selectors"
import { StatusShapeIcon } from "@/components/status-icon"
import { STATUS_CONFIG } from "@/components/note-fields"
import { WIKI_STATUS_ORDER } from "@/lib/view-engine/wiki-list-pipeline"
import type { WikiArticle, WikiCategory, WikiStatus } from "@/lib/types"
import type { GroupBy } from "@/lib/view-engine/types"
import type { WikiGroup } from "@/lib/view-engine/wiki-list-pipeline"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
} from "@/components/ui/context-menu"
import {
  Check as PhCheck,
  Pin as PushPin,
  Minus,
  ArrowLeft,
  BookOpen,
  GitMerge,
  MoreHorizontal as DotsThree,
  Trash2 as Trash,
  Scissors,
  X as PhX,
  FolderOpen,
  ChevronRight as CaretRight,
  Link as PhLink,
  Target,
} from "lucide-react"
import { Calendar as CalendarUI } from "@/components/ui/calendar"
import { FolderPickerInlineSubmenu } from "@/components/folder-picker"

/* ── ShowConnectedSubmenu ──────────────────────────────────
 * Inline expand-to-list pattern (matching FolderPickerSubmenu).
 * Three direction options for the "Connected to" filter applied via
 * the wiki view's filter state. */
function ShowConnectedSubmenu({
  onSelect,
}: {
  onSelect: (direction: "both" | "in" | "out") => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-2xs text-foreground/80 hover:bg-active-bg transition-colors"
      >
        <PhLink size={14} strokeWidth={2} />
        <span className="flex-1 text-left">Show connected</span>
        <CaretRight size={10} strokeWidth={2.5} className={cn("transition-transform", open && "rotate-90")} />
      </button>
      {open && (
        <div className="ml-4 mt-0.5 mb-1 flex flex-col gap-px">
          <button type="button" onClick={() => onSelect("both")} className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-2xs text-foreground/80 hover:bg-active-bg">
            <span className="text-muted-foreground">↔</span> Both directions
          </button>
          <button type="button" onClick={() => onSelect("in")} className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-2xs text-foreground/80 hover:bg-active-bg">
            <span className="text-muted-foreground">←</span> Backlinks only
          </button>
          <button type="button" onClick={() => onSelect("out")} className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-2xs text-foreground/80 hover:bg-active-bg">
            <span className="text-muted-foreground">→</span> Links out only
          </button>
        </div>
      )}
    </div>
  )
}

/* ── FolderPickerSubmenu (PR b) ───────────────────────────────
 * Replaced by the shared `FolderPickerInlineSubmenu` from
 * `components/folder-picker.tsx`. Kept this banner so a future grep for
 * "FolderPickerSubmenu" in this file lands on the explanation rather
 * than nothing. The shared component is kind-aware — wiki-list passes
 * `kind="wiki"` so the picker only shows / creates wiki-kind folders. */

/* ── PlanForSubmenu (timeline-planning, 2026-05-20) ────────────
 * Inline expand-to-calendar pattern (matches FolderPickerInlineSubmenu's
 * shape so it works inside both Popover and Radix ContextMenu containers
 * without losing its own open state when the container portal renders). */
function PlanForSubmenu({
  currentDate,
  onSelect,
  onClear,
}: {
  currentDate: string | null | undefined
  onSelect: (iso: string) => void
  onClear: () => void
}) {
  const [open, setOpen] = useState(false)
  const selected = currentDate ? new Date(currentDate) : undefined
  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-2xs text-foreground/80 hover:bg-active-bg transition-colors"
      >
        <Target size={14} strokeWidth={2} />
        <span className="flex-1 text-left">
          {currentDate ? `Planned: ${format(currentDate)}` : "Plan for…"}
        </span>
        <CaretRight size={10} strokeWidth={2.5} className={cn("transition-transform", open && "rotate-90")} />
      </button>
      {open && (
        <div className="mt-1 mb-1 px-1">
          <CalendarUI
            mode="single"
            selected={selected}
            onSelect={(d) => {
              if (!d) return
              onSelect(d.toISOString())
              setOpen(false)
            }}
            className="p-0"
          />
          {currentDate && (
            <button
              type="button"
              onClick={() => { onClear(); setOpen(false) }}
              className="mt-1 flex w-full items-center justify-center gap-1 rounded-md px-2 py-1 text-2xs text-muted-foreground transition-colors hover:bg-active-bg hover:text-foreground"
            >
              <PhX size={10} strokeWidth={2.5} />
              Clear plan
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/** Compact date formatter for the "Planned: …" submenu trigger. */
function format(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

/* ── WikiArticleMenuItems ─────────────────────────────────────
 * Menu body shared between the row's DotsThree click Popover, the row's
 * right-click ContextMenu, and (Task 3) the gallery card's ContextMenu.
 * Caller provides `close()` so each container can dismiss itself.
 * Items render as plain buttons + the existing `FolderPickerInlineSubmenu`
 * so the same content works inside both Popover and Radix ContextMenu
 * (Radix's `ContextMenuItem` would lose the inline-submenu open state). */
export function WikiArticleMenuItems({
  note,
  close,
  onMerge,
  onSplit,
  onDelete,
  onShowConnected,
}: {
  note: WikiArticle
  close: () => void
  onMerge?: () => void
  onSplit?: () => void
  onDelete?: () => void
  onShowConnected?: (direction: "both" | "in" | "out") => void
}) {
  // Phase 1b2: plannedDate read-site moved to the `hooks` slice.
  const plannedDate = usePlotStore((s) => getPlannedDateForWiki(s.hooks, note.id))
  return (
    <>
      {onMerge && (
        <button
          onClick={() => { close(); onMerge() }}
          className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-2xs text-foreground/80 hover:bg-active-bg transition-colors"
        >
          <GitMerge size={14} strokeWidth={2} /> Merge into...
        </button>
      )}
      {onSplit && (
        <button
          onClick={() => { close(); onSplit() }}
          className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-2xs text-foreground/80 hover:bg-active-bg transition-colors"
        >
          <Scissors size={14} strokeWidth={2} /> Split wiki
        </button>
      )}
      {(onMerge || onSplit) && onShowConnected && (
        <div className="my-1 h-px bg-border/40" />
      )}
      {onShowConnected && (
        <ShowConnectedSubmenu
          onSelect={(direction) => {
            close()
            onShowConnected(direction)
          }}
        />
      )}
      {onShowConnected && <div className="my-1 h-px bg-border/40" />}
      {/* Plan for… — timeline-planning (2026-05-20). Inline-expand Calendar
          submenu (FolderPickerInlineSubmenu pattern). Setter does NOT touch
          updatedAt — planning = intent, not content activity. */}
      <PlanForSubmenu
        currentDate={plannedDate}
        onSelect={(iso) => {
          close()
          usePlotStore.getState().setWikiArticlePlannedDate(note.id, iso)
        }}
        onClear={() => {
          close()
          usePlotStore.getState().setWikiArticlePlannedDate(note.id, null)
        }}
      />
      <div className="my-1 h-px bg-border/40" />
      <FolderPickerInlineSubmenu
        kind="wiki"
        currentFolderIds={note.folderIds}
        triggerLabel="Move to folder"
        triggerIcon={<FolderOpen size={14} strokeWidth={2} />}
        onSelect={(folderId) => {
          close()
          usePlotStore.getState().updateWikiArticle(note.id, {
            folderIds: folderId ? [folderId] : [],
          })
        }}
      />
      <FolderPickerInlineSubmenu
        kind="wiki"
        currentFolderIds={note.folderIds}
        selectMode="multi"
        triggerLabel="Add to folders…"
        triggerIcon={<FolderOpen size={14} strokeWidth={2} />}
        onApply={(folderIds) => {
          close()
          usePlotStore.getState().setWikiFolders(note.id, folderIds)
        }}
      />
      {(onMerge || onSplit) && onDelete && (
        <div className="my-1 h-px bg-border/40" />
      )}
      {onDelete && (
        <button
          onClick={() => { close(); onDelete() }}
          className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-2xs text-destructive hover:bg-active-bg transition-colors"
        >
          <Trash size={14} strokeWidth={2} /> Delete
        </button>
      )}
    </>
  )
}

/* ── Types ── */

interface WikiListProps {
  filteredWikiNotes: WikiArticle[]
  sortedFilteredWikiNotes: WikiArticle[]
  backlinkCounts: Map<string, number>

  // Filter state — v151: 4-stage status quick-filter (was all/articles/stubs).
  // Source of truth lifted to the `wikiStatusFilter` external store so the
  // sidebar status nav links and these in-list tabs stay in sync. These props
  // are no longer the source of truth; the component reads/writes the store
  // directly. Kept optional for back-compat with any other caller.
  dashFilter?: "all" | WikiStatus
  setDashFilter?: (f: "all" | WikiStatus) => void

  // Category filter
  categoryFilterLabel?: string | null
  onClearCategoryFilter?: () => void

  // A+ folder filter (sidebar wiki folder → scoped list)
  folderFilterLabel?: string | null
  onClearFolderFilter?: () => void

  // Red links
  redLinks: { title: string; refCount: number }[]
  onCreateFromRedLink: (title: string) => void

  // Actions
  onOpenArticle: (id: string) => void
  onMergeArticle?: (sourceId: string) => void
  onSplitArticle?: (id: string) => void
  onDeleteArticle?: (id: string) => void
  /** "Show connected" filter — applied via the wiki view's filter state.
   *  Direction: both / in (backlinks) / out (links from this article). */
  onShowConnectedArticle?: (id: string, direction: "both" | "in" | "out") => void

  // v151: 4-stage status breakdown (for the quick-filter tab counts).
  statusCounts?: Record<WikiStatus, number>
  wikiArticles?: WikiArticle[]

  // Selection
  selectedIds?: Set<string>
  onSelect?: (id: string, opts: { multi?: boolean; shift?: boolean; index?: number }) => void
  onSelectAll?: (ids: string[]) => void

  /** Visible column keys from WIKI_VIEW_CONFIG.displayConfig.properties.
   *  Keys: "title" | "links" | "tags" (Categories) | "aliases" | "updatedAt".
   *  Title is always shown. Undefined => all columns visible (backwards compat). */
  visibleColumns?: string[]
  /** Wiki categories for resolving categoryIds → display names. */
  wikiCategories?: WikiCategory[]
  /** Grouped articles from applyWikiGrouping. When groupBy !== "none", renders with group headers. */
  wikiGroups?: WikiGroup[]
  /** Current groupBy from ViewState. Used to decide if group headers should be shown. */
  groupBy?: GroupBy
  /** Phase 3 (split-mode-prd): when true, this list is rendered inside the
   *  dual-mode left pane. Active row highlight comes from `activeArticleId`
   *  (mirrors NotesTable's `activePreviewId`). Caller routes row clicks
   *  through `onOpenArticle` which writes `dualSelection` instead of
   *  navigating into the article reader. */
  dualMode?: boolean
  /** Phase 3: active wiki article id in the editor pane (highlights the
   *  matching row). Mirrors `NotesTable.activePreviewId`. */
  activeArticleId?: string | null
}

/* ── Column Header ── */

function ColumnHeaders({
  hasSelection,
  onSelectAll,
  isAllSelected,
  isPartiallySelected,
  visibleColumns,
}: {
  hasSelection?: boolean
  onSelectAll?: () => void
  isAllSelected?: boolean
  isPartiallySelected?: boolean
  visibleColumns?: string[]
}) {
  const t = useT()
  // undefined visibleColumns => all visible (backwards compat).
  const isVisible = (key: string) => !visibleColumns || visibleColumns.includes(key)
  return (
    <div className="flex items-center px-5 py-2 text-note font-medium text-foreground/80 border-b border-border bg-secondary/30">
      {hasSelection && (
        <div className="w-[32px] shrink-0 flex items-center justify-center">
          {onSelectAll ? (
            <div
              data-checkbox
              onClick={onSelectAll}
              className={cn(
                "h-4 w-4 rounded-[4px] border flex items-center justify-center cursor-pointer transition-colors shadow-sm",
                isAllSelected
                  ? "bg-accent border-accent"
                  : isPartiallySelected
                    ? "bg-accent/50 border-accent"
                    : "bg-card border-zinc-400 dark:border-zinc-600 hover:border-zinc-500 dark:hover:border-zinc-500"
              )}
            >
              {isAllSelected && <PhCheck size={10} strokeWidth={2.5} className="text-accent-foreground" />}
              {isPartiallySelected && !isAllSelected && <Minus size={10} strokeWidth={2} className="text-accent-foreground" />}
            </div>
          ) : (
            <span />
          )}
        </div>
      )}
      <span className="min-w-0 flex-1 flex items-center gap-2 pr-0">
        <span>{t("display.ordering.title")}</span>
      </span>
      {isVisible("status") && <span className="w-[110px] shrink-0 px-2">{t("column.status")}</span>}
      {isVisible("tags") && <span className="w-[140px] shrink-0 px-2">{t("column.categories")}</span>}
      {isVisible("aliases") && <span className="w-[140px] shrink-0 px-2">{t("column.aliases")}</span>}
      {isVisible("parent") && <span className="w-[100px] shrink-0 px-1">{t("display.property.parent")}</span>}
      {isVisible("children") && <span className="w-[56px] shrink-0 text-center">{t("column.children")}</span>}
      {isVisible("links") && <span className="w-[60px] shrink-0 text-right">{t("column.links")}</span>}
      {isVisible("reads") && <span className="w-[56px] shrink-0 text-right">{t("column.reads")}</span>}
      <span className="w-[36px] shrink-0" />
      {isVisible("updatedAt") && <span className="w-[70px] shrink-0 text-right">{t("display.ordering.updated")}</span>}
      {isVisible("createdAt") && <span className="w-[70px] shrink-0 text-right">{t("display.ordering.created")}</span>}
    </div>
  )
}

/* ── Article Row ── */

function ArticleTableRow({
  note,
  backlinkCount,
  index,
  onClick,
  onMerge,
  onSplit,
  onDelete,
  onShowConnected,
  isSelected,
  isActive,
  selectionActive,
  onSelect,
  visibleColumns,
  wikiCategories,
  wikiArticles,
  childrenCount,
}: {
  note: WikiArticle
  backlinkCount: number
  index?: number
  onClick: () => void
  onMerge?: () => void
  onSplit?: () => void
  onDelete?: () => void
  onShowConnected?: (direction: "both" | "in" | "out") => void
  isSelected?: boolean
  /** Phase 3 (split-mode-prd): article currently shown in the dual editor
   *  pane — drives row highlight while keeping selection state separate. */
  isActive?: boolean
  selectionActive?: boolean
  onSelect?: (opts: { multi?: boolean; shift?: boolean; index?: number }) => void
  visibleColumns?: string[]
  wikiCategories?: WikiCategory[]
  wikiArticles?: WikiArticle[]
  childrenCount?: number
}) {
  const t = useT()
  const isVisible = (key: string) => !visibleColumns || visibleColumns.includes(key)
  const categoryNames = (note.categoryIds ?? [])
    .map((id) => wikiCategories?.find((c) => c.id === id)?.name)
    .filter((n): n is string => typeof n === "string" && n.length > 0)
  const aliases = note.aliases ?? []
  const parentTitle = note.parentArticleId
    ? wikiArticles?.find((a) => a.id === note.parentArticleId)?.title
    : undefined
  const [menuOpen, setMenuOpen] = useState(false)

  const hasMenu = !!(onMerge || onSplit || onDelete || onShowConnected)

  const rowContent = (
    <div
      className={cn(
        "group flex w-full items-center px-5 py-2.5 hover:bg-hover-bg transition-colors duration-100",
        isSelected && "bg-accent/5",
        // Phase 3: highlight the row whose article is mirrored in the dual
        // editor pane. Stronger background than `isSelected` so multi-select
        // checkmarks and the active editor row remain visually distinct.
        isActive && "bg-accent/10"
      )}
    >
      {/* Checkbox */}
      {onSelect && (
        <div
          className={cn(
            "w-[32px] shrink-0 flex items-center justify-center cursor-pointer",
            selectionActive || isSelected ? "visible" : "invisible group-hover:visible"
          )}
          onClick={(e) => {
            e.stopPropagation()
            onSelect({ multi: true, shift: e.shiftKey, index })
          }}
        >
          <div className={cn(
            "h-4 w-4 rounded-[4px] border flex items-center justify-center transition-colors shadow-sm",
            isSelected
              ? "bg-accent border-accent"
              : "bg-card border-zinc-400 dark:border-zinc-600 hover:border-zinc-500"
          )}>
            {isSelected && <PhCheck size={10} strokeWidth={2.5} className="text-accent-foreground" />}
          </div>
        </div>
      )}
      <button
        onClick={(e) => {
          if (onSelect && (e.metaKey || e.ctrlKey || e.shiftKey)) {
            onSelect({ multi: e.metaKey || e.ctrlKey, shift: e.shiftKey, index })
          } else {
            onClick()
          }
        }}
        className="flex flex-1 items-center gap-2 text-left min-w-0"
      >
        {/* Always-on leading status icon — gives the 4-stage status at a glance
            even when the optional Status column is hidden. Shared 4-circle
            StatusShapeIcon, unified with Notes (v151). */}
        <span className="a-row__icon shrink-0 flex items-center">
          <StatusShapeIcon status={note.status} size={13} />
        </span>
        {/* Title + pin: pin sits immediately to the right of the title text
            (영구 결정 — Books book-table.tsx:497-502 pattern). Removing
            `flex-1` from the title span prevents the title from stretching
            and pushing the pin to the cell's right edge / next to the status
            chip — the layout bug the user flagged. */}
        <span className="min-w-0 truncate text-note font-medium text-foreground/90">
          {note.title || "Untitled"}
        </span>
        {(note as { pinned?: boolean }).pinned && (
          <PushPin
            size={11}
            fill="currentColor"
            className="ml-1 shrink-0 text-amber-500"
          />
        )}
      </button>
      {isVisible("status") && (
        <div className="w-[110px] shrink-0 flex items-center px-2">
          {/* 4-stage status (manual, unified with Notes — v151). Shared
              4-circle StatusShapeIcon + STATUS_CONFIG i18n label. */}
          <span className="inline-flex items-center gap-1.5 text-2xs font-medium text-foreground/80">
            <StatusShapeIcon status={note.status} size={12} />
            {t((STATUS_CONFIG[note.status] ?? STATUS_CONFIG.backlog).labelKey)}
          </span>
        </div>
      )}
      {isVisible("tags") && (
        <div
          className="w-[140px] shrink-0 flex items-center gap-1 px-2 overflow-hidden"
          title={categoryNames.length > 0 ? categoryNames.join(", ") : undefined}
        >
          {categoryNames.length === 0 ? (
            <span className="text-2xs text-muted-foreground/70">{"\u2014"}</span>
          ) : (
            <>
              <span className="truncate rounded-md bg-accent/10 px-1.5 py-0.5 text-2xs font-medium text-accent">
                {categoryNames[0]}
              </span>
              {categoryNames.length > 1 && (
                <span className="shrink-0 text-2xs tabular-nums text-muted-foreground/60">
                  +{categoryNames.length - 1}
                </span>
              )}
            </>
          )}
        </div>
      )}
      {isVisible("aliases") && (
        <div
          className="w-[140px] shrink-0 flex items-center gap-1 px-2 overflow-hidden"
          title={aliases.length > 0 ? aliases.join(", ") : undefined}
        >
          {aliases.length === 0 ? (
            <span className="text-2xs text-muted-foreground/70">{"\u2014"}</span>
          ) : (
            <>
              <span className="truncate text-2xs text-muted-foreground/80">
                {aliases[0]}
              </span>
              {aliases.length > 1 && (
                <span className="shrink-0 text-2xs tabular-nums text-muted-foreground/60">
                  +{aliases.length - 1}
                </span>
              )}
            </>
          )}
        </div>
      )}
      {isVisible("parent") && (
        <div
          className="w-[100px] shrink-0 flex items-center px-1 overflow-hidden"
          title={parentTitle || undefined}
        >
          {parentTitle ? (
            <span className="truncate text-2xs text-muted-foreground/80">{parentTitle}</span>
          ) : (
            <span className="text-2xs text-muted-foreground/70">{"\u2014"}</span>
          )}
        </div>
      )}
      {isVisible("children") && (
        <span className="w-[56px] shrink-0 text-center text-2xs tabular-nums text-muted-foreground/60">
          {(childrenCount ?? 0) > 0 ? childrenCount : "\u2014"}
        </span>
      )}
      {isVisible("links") && (
        <span className="w-[60px] shrink-0 text-right text-2xs tabular-nums text-muted-foreground/60">
          {backlinkCount > 0 ? backlinkCount : "\u2014"}
        </span>
      )}
      {isVisible("reads") && (
        <span className="w-[56px] shrink-0 text-right text-2xs tabular-nums text-muted-foreground/60">
          {(note.reads ?? 0) > 0 ? (note.reads ?? 0) : "\u2014"}
        </span>
      )}

      {/* DotsThree click menu — hover affordance. Cursor-anchored right-click
          uses Radix ContextMenu (wraps this row, see return below). Both
          surface the same content via the shared `WikiArticleMenuItems`. */}
      <span className="w-[36px] shrink-0 flex justify-center">
        {hasMenu ? (
          <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverTrigger asChild>
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(true) }}
                className="rounded-md p-1 text-muted-foreground/60 opacity-0 group-hover:opacity-100 hover:bg-active-bg hover:text-muted-foreground/60 transition-all duration-100"
              >
                <DotsThree size={14} strokeWidth={2.5} />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-1" onOpenAutoFocus={(e) => e.preventDefault()}>
              <WikiArticleMenuItems
                note={note}
                close={() => setMenuOpen(false)}
                onMerge={onMerge}
                onSplit={onSplit}
                onDelete={onDelete}
                onShowConnected={onShowConnected}
              />
            </PopoverContent>
          </Popover>
        ) : null}
      </span>

      {isVisible("updatedAt") && (
        <span className="w-[70px] shrink-0 text-right text-2xs tabular-nums text-muted-foreground/60">
          {shortRelative(note.updatedAt)}
        </span>
      )}
      {isVisible("createdAt") && (
        <span className="w-[70px] shrink-0 text-right text-2xs tabular-nums text-muted-foreground/60">
          {shortRelative(note.createdAt)}
        </span>
      )}
    </div>
  )

  // Cursor-anchored right-click menu. Without this wrap, Popover was
  // anchored to the DotsThree button so the menu opened on the row's right
  // edge instead of at the cursor. ContextMenuContent portals to <body> at
  // the cursor location automatically (Radix).
  if (!hasMenu) return rowContent
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{rowContent}</ContextMenuTrigger>
      <ContextMenuContent className="w-64 p-1">
        <WikiArticleMenuItems
          note={note}
          close={() => {/* Radix auto-closes after item click */}}
          onMerge={onMerge}
          onSplit={onSplit}
          onDelete={onDelete}
          onShowConnected={onShowConnected}
        />
      </ContextMenuContent>
    </ContextMenu>
  )
}

/* ── Empty State ── */

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/60">
        <BookOpen className="text-muted-foreground/70" size={20} strokeWidth={2} />
      </div>
      <p className="text-note text-muted-foreground/60">No articles found</p>
    </div>
  )
}

/* ── ListBullets View ── */

export function WikiList({
  filteredWikiNotes,
  sortedFilteredWikiNotes,
  backlinkCounts,
  categoryFilterLabel,
  onClearCategoryFilter,
  folderFilterLabel,
  onClearFolderFilter,
  onOpenArticle,
  onMergeArticle,
  onShowConnectedArticle,
  onSplitArticle,
  onDeleteArticle,
  redLinks,
  onCreateFromRedLink,
  wikiArticles,
  selectedIds,
  onSelect,
  onSelectAll,
  statusCounts,
  visibleColumns,
  wikiCategories,
  wikiGroups,
  groupBy,
  // Phase 3 (split-mode-prd): dual mode wiring — `activeArticleId` drives
  // the row highlight that mirrors the editor pane. Row click routes through
  // `onOpenArticle`, which the caller wires to
  // `setDualSelection({ kind: "wiki", refId })` when in dual mode.
  // Phase 6: when dualMode === true, ↑↓ keyboard nav drives the editor
  // pane through `onOpenArticle` (same callback as click).
  dualMode = false,
  activeArticleId,
}: WikiListProps) {
  const t = useT()

  // v151 + sidebar sync: the 4-stage status quick-filter source of truth is the
  // `wikiStatusFilter` external store (null = "all"), so the sidebar status nav
  // links and these tabs control the same value. Map null ↔ "all" at the edge.
  const statusFilter = useWikiStatusFilter()
  const dashFilter: "all" | WikiStatus = statusFilter ?? "all"
  const setDashFilter = (f: "all" | WikiStatus) =>
    setWikiStatusFilter(f === "all" ? null : f)

  const selectionActive = selectedIds ? selectedIds.size > 0 : false

  // Compute visible notes for the current filter (used for select-all).
  // v151: dashFilter is "all" | WikiStatus — match on note.status directly.
  const matchesDashFilter = (note: WikiArticle) =>
    dashFilter === "all" || note.status === dashFilter
  const visibleNotes = sortedFilteredWikiNotes.filter(matchesDashFilter)

  const isAllSelected = visibleNotes.length > 0 && selectedIds ? selectedIds.size >= visibleNotes.length && visibleNotes.every((n) => selectedIds.has(n.id)) : false
  const isPartiallySelected = selectedIds ? selectedIds.size > 0 && !isAllSelected : false

  const handleSelectAll = onSelectAll
    ? () => {
        if (isAllSelected) {
          onSelectAll([]) // clear all
        } else {
          onSelectAll(visibleNotes.map((n) => n.id)) // select all visible
        }
      }
    : undefined

  // v151: tab counts per 4-stage status (+ all). statusCounts is computed
  // from the trashed-filtered article set by the parent (wiki-view).
  const counts: Record<"all" | WikiStatus, number> = {
    all: sortedFilteredWikiNotes.length,
    backlog: statusCounts?.backlog ?? 0,
    todo: statusCounts?.todo ?? 0,
    in_progress: statusCounts?.in_progress ?? 0,
    done: statusCounts?.done ?? 0,
  }

  // Children count map: articleId → number of articles whose parentArticleId === id
  const childrenCounts = useMemo(() => {
    const map = new Map<string, number>()
    if (!wikiArticles) return map
    for (const a of wikiArticles) {
      if (a.parentArticleId) {
        map.set(a.parentArticleId, (map.get(a.parentArticleId) ?? 0) + 1)
      }
    }
    return map
  }, [wikiArticles])

  // ── Phase 6 (split-mode-prd): keyboard ↑↓ nav for dual list pane ──
  // When dualMode is true, ↑↓ moves through `visibleNotes` (the same flat
  // list used by select-all) and writes through `onOpenArticle`, which the
  // parent wires to `setDualSelection({ kind: "wiki", refId })`. Mirrors the
  // pattern in NotesTable (Phase 6) and ReferencesView (Phase 6).
  // No-ops when target is an input / textarea / contenteditable so we don't
  // fight TipTap or filter inputs.
  useEffect(() => {
    if (!dualMode) return
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && target.matches('input, textarea, [contenteditable="true"]')) return
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return
      if (visibleNotes.length === 0) return
      // No selection: pick the first article.
      if (!activeArticleId) {
        e.preventDefault()
        onOpenArticle(visibleNotes[0].id)
        return
      }
      const currentIdx = visibleNotes.findIndex((n) => n.id === activeArticleId)
      if (currentIdx < 0) {
        e.preventDefault()
        onOpenArticle(visibleNotes[0].id)
        return
      }
      const delta = e.key === "ArrowDown" ? 1 : -1
      const nextIdx = currentIdx + delta
      if (nextIdx < 0 || nextIdx >= visibleNotes.length) return
      e.preventDefault()
      onOpenArticle(visibleNotes[nextIdx].id)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [dualMode, activeArticleId, visibleNotes, onOpenArticle])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* ── Controls Bar ── */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-5 py-2">
        {/* Back to Overview */}
        <button
          onClick={() => { setWikiViewMode("dashboard"); setWikiStatusFilter(null); onClearCategoryFilter?.(); onClearFolderFilter?.() }}
          className="flex items-center gap-1 text-note text-muted-foreground hover:text-foreground transition-colors duration-100 mr-1"
        >
          <ArrowLeft size={12} strokeWidth={2} />
          Overview
        </button>

        <span className="h-4 w-px bg-border/50" />

        {/* Filter Tabs — v151: All + 4-stage status (backlog/todo/in_progress/
            done), unified with Notes. Active status tab shows its colored
            4-circle icon; "All" stays neutral. */}
        {(["all", ...WIKI_STATUS_ORDER] as const).map((tab) => {
          const tabCount = counts[tab]
          const label = tab === "all" ? t("filter.tab.all") : t(STATUS_CONFIG[tab].labelKey)
          const active = dashFilter === tab
          return (
            <button
              key={tab}
              onClick={() => setDashFilter(tab)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-2xs font-medium transition-all duration-100",
                active
                  ? "bg-foreground/10 text-foreground"
                  : "text-muted-foreground hover:bg-hover-bg hover:text-foreground",
              )}
            >
              {tab !== "all" && <StatusShapeIcon status={tab} size={12} />}
              {label}
              {tabCount > 0 && (
                <span className="tabular-nums text-muted-foreground">{tabCount}</span>
              )}
            </button>
          )
        })}

        {/* A+ folder filter badge — mirrors the category badge, FolderOpen icon
            distinguishes "where" (folder) from "what" (category). */}
        {folderFilterLabel && (
          <>
            <span className="h-4 w-px bg-border/50" />
            <span className="flex items-center gap-1 rounded-md bg-accent/10 px-2 py-1 text-2xs font-medium text-accent">
              <FolderOpen size={11} strokeWidth={2} />
              {folderFilterLabel}
              <button
                onClick={onClearFolderFilter}
                className="ml-0.5 rounded-sm p-0.5 hover:bg-accent/20 transition-colors duration-100"
              >
                <PhX size={10} strokeWidth={2} />
              </button>
            </span>
          </>
        )}

        {/* Category filter badge */}
        {categoryFilterLabel && (
          <>
            <span className="h-4 w-px bg-border/50" />
            <span className="flex items-center gap-1 rounded-md bg-accent/10 px-2 py-1 text-2xs font-medium text-accent">
              {categoryFilterLabel}
              <button
                onClick={onClearCategoryFilter}
                className="ml-0.5 rounded-sm p-0.5 hover:bg-accent/20 transition-colors duration-100"
              >
                <PhX size={10} strokeWidth={2} />
              </button>
            </span>
          </>
        )}

        {/* Index toggle moved into ColumnHeaders so it sits with the data it
            groups (next to the Status column header). Frees this toolbar of
            data-level controls — it now hosts only tabs + category filter. */}
      </div>

      {/* ── Table Content ── */}
      {/* ── Filtered Article Table ── */}
      <div className="flex-1 overflow-y-auto">
          <ColumnHeaders
            hasSelection={!!onSelect}
            onSelectAll={handleSelectAll}
            isAllSelected={isAllSelected}
            isPartiallySelected={isPartiallySelected}
            visibleColumns={visibleColumns}
          />
          {sortedFilteredWikiNotes.length === 0 ? (
            <EmptyState />
          ) : groupBy && groupBy !== "none" && wikiGroups && wikiGroups.length > 0 && !(wikiGroups.length === 1 && wikiGroups[0].key === "_all") ? (
            /* ── Grouped view ── */
            <div>
              {wikiGroups.map((group) => {
                const groupArticles = group.articles.filter(matchesDashFilter)
                if (groupArticles.length === 0) return null
                return (
                  <div key={group.key}>
                    {group.label && (
                      // Notes `.a-tg` 패턴 통일 (2026-05-13) — 사용자: 그룹 헤더
                      // 모양새 entity별 다른 거 정리 + label opacity 흐린 거 (muted/60)
                      // 진하게 (var(--fg)). 통일 grid: chevron / icon / label /
                      // count / divider line.
                      <div className="a-tg">
                        <span />
                        <WikiGroupHeaderIcon groupBy={groupBy ?? "none"} groupKey={group.key} wikiCategories={wikiCategories} />
                        <span className="a-tg__label">{group.label}</span>
                        <span className="a-tg__count tabular-nums">{groupArticles.length}</span>
                        <div className="a-tg__line" />
                      </div>
                    )}
                    {groupArticles.map((note, idx) => {
                      const depth = group.depthMap?.[note.id] ?? 0
                      return (
                        <div key={note.id} style={depth > 0 ? { paddingLeft: `${depth * 24}px` } : undefined}>
                          <ArticleTableRow
                            note={note}
                            backlinkCount={backlinkCounts.get(note.id) ?? 0}
                            index={idx}
                            onClick={() => onOpenArticle(note.id)}
                            onMerge={onMergeArticle ? () => onMergeArticle(note.id) : undefined}
                            onSplit={onSplitArticle ? () => onSplitArticle(note.id) : undefined}
                            onDelete={onDeleteArticle ? () => onDeleteArticle(note.id) : undefined}
                            onShowConnected={onShowConnectedArticle ? (dir) => onShowConnectedArticle(note.id, dir) : undefined}
                            isSelected={selectedIds?.has(note.id)}
                            isActive={activeArticleId === note.id}
                            selectionActive={selectionActive}
                            onSelect={onSelect ? (opts) => onSelect(note.id, { ...opts, index: idx }) : undefined}
                            visibleColumns={visibleColumns}
                            wikiCategories={wikiCategories}
                            wikiArticles={wikiArticles}
                            childrenCount={childrenCounts.get(note.id) ?? 0}
                          />
                        </div>
                      )
                    })}
                  </div>
                )
              })}
              {dashFilter !== "all" && visibleNotes.length === 0 && <EmptyState />}
            </div>
          ) : (
            /* ── Flat view (no grouping) ── */
            <div>
              {/* Article rows (4-stage status filter via matchesDashFilter) */}
              {sortedFilteredWikiNotes
                .filter(matchesDashFilter)
                .map((note, idx) => (
                <ArticleTableRow
                  key={note.id}
                  note={note}
                  backlinkCount={backlinkCounts.get(note.id) ?? 0}
                  index={idx}
                  onClick={() => onOpenArticle(note.id)}
                  onMerge={onMergeArticle ? () => onMergeArticle(note.id) : undefined}
                  onSplit={onSplitArticle ? () => onSplitArticle(note.id) : undefined}
                  onDelete={onDeleteArticle ? () => onDeleteArticle(note.id) : undefined}
                  isSelected={selectedIds?.has(note.id)}
                  isActive={activeArticleId === note.id}
                  selectionActive={selectionActive}
                  onSelect={onSelect ? (opts) => onSelect(note.id, { ...opts, index: idx }) : undefined}
                  visibleColumns={visibleColumns}
                  wikiCategories={wikiCategories}
                  wikiArticles={wikiArticles}
                  childrenCount={childrenCounts.get(note.id) ?? 0}
                />
              ))}
              {/* Empty state when a status filter matches nothing */}
              {dashFilter !== "all" && visibleNotes.length === 0 && <EmptyState />}
            </div>
          )}
      </div>
    </div>
  )
}
