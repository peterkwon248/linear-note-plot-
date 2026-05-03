"use client"

import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { groupByInitial } from "@/lib/korean-utils"
import { shortRelative } from "@/lib/format-utils"
import { setWikiViewMode } from "@/lib/wiki-view-mode"
import { isWikiStub } from "@/lib/wiki-utils"
import { usePlotStore } from "@/lib/store"
import type { WikiArticle, WikiCategory } from "@/lib/types"
import type { GroupBy } from "@/lib/view-engine/types"
import type { WikiGroup } from "@/lib/view-engine/wiki-list-pipeline"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"
import { Minus } from "@phosphor-icons/react/dist/ssr/Minus"
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr/ArrowLeft"
import { Warning } from "@phosphor-icons/react/dist/ssr/Warning"
import { BookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"
import { FileDashed } from "@phosphor-icons/react/dist/ssr/FileDashed"
import { ListBullets } from "@phosphor-icons/react/dist/ssr/ListBullets"
import { GitMerge } from "@phosphor-icons/react/dist/ssr/GitMerge"
import { DotsThree } from "@phosphor-icons/react/dist/ssr/DotsThree"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { Scissors } from "@phosphor-icons/react/dist/ssr/Scissors"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { FolderOpen } from "@phosphor-icons/react/dist/ssr/FolderOpen"
import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight"
import { Link as PhLink } from "@phosphor-icons/react/dist/ssr/Link"

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
        <PhLink size={14} weight="regular" />
        <span className="flex-1 text-left">Show connected</span>
        <CaretRight size={10} weight="bold" className={cn("transition-transform", open && "rotate-90")} />
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

/* ── FolderPickerSubmenu ─────────────────────────────────────
 * Inline expand-to-list pattern (rather than nested Popover) — keeps
 * the action stay open while the user picks. Used by both wiki list
 * row menu and the global folder selector elsewhere. */
function FolderPickerSubmenu({
  currentFolderId,
  onSelect,
}: {
  currentFolderId: string | null
  onSelect: (folderId: string | null) => void
}) {
  const folders = usePlotStore((s) => s.folders)
  const [open, setOpen] = useState(false)
  const currentName = currentFolderId
    ? folders.find((f) => f.id === currentFolderId)?.name ?? "Unknown"
    : null
  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-2xs text-foreground/80 hover:bg-active-bg transition-colors"
      >
        <FolderOpen size={14} weight="regular" />
        <span className="flex-1 text-left">Move to folder</span>
        <span className="text-2xs text-muted-foreground truncate max-w-[80px]">
          {currentName ?? "—"}
        </span>
        <CaretRight size={10} weight="bold" className={cn("transition-transform", open && "rotate-90")} />
      </button>
      {open && (
        <div className="ml-4 mt-0.5 mb-1 flex flex-col gap-px max-h-[200px] overflow-y-auto">
          <button
            type="button"
            onClick={() => onSelect(null)}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-2xs hover:bg-active-bg transition-colors",
              !currentFolderId ? "text-foreground font-medium" : "text-muted-foreground"
            )}
          >
            No folder
            {!currentFolderId && <PhCheck className="ml-auto text-accent" size={12} weight="bold" />}
          </button>
          {folders.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onSelect(f.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-2xs hover:bg-active-bg transition-colors",
                currentFolderId === f.id ? "text-foreground font-medium" : "text-foreground/80"
              )}
            >
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: f.color }} />
              <span className="truncate">{f.name}</span>
              {currentFolderId === f.id && <PhCheck className="ml-auto text-accent shrink-0" size={12} weight="bold" />}
            </button>
          ))}
          {/* Inline folder creation — same flow as the notes context menu. */}
          <div className="my-1 h-px bg-border/40" />
          <button
            type="button"
            onClick={() => {
              const name = window.prompt("New folder name:")?.trim()
              if (!name) return
              const palette = ["#f97316", "#3b82f6", "#22c55e", "#a855f7", "#ec4899", "#14b8a6", "#eab308"]
              const color = palette[folders.length % palette.length]
              const newId = usePlotStore.getState().createFolder(name, color)
              onSelect(newId)
            }}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-2xs text-muted-foreground hover:text-foreground hover:bg-active-bg transition-colors"
          >
            <span className="text-base leading-none">+</span> New folder…
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Types ── */

interface WikiListProps {
  filteredWikiNotes: WikiArticle[]
  sortedFilteredWikiNotes: WikiArticle[]
  backlinkCounts: Map<string, number>

  // Filter state
  dashFilter: "all" | "articles" | "stubs"
  setDashFilter: (f: "all" | "articles" | "stubs") => void
  showAllArticles: boolean
  setShowAllArticles: (show: boolean) => void

  // Category filter
  categoryFilterLabel?: string | null
  onClearCategoryFilter?: () => void

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

  // Stub support
  stubCount?: number
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
}

/* ── Column Header ── */

function ColumnHeaders({
  hasSelection,
  onSelectAll,
  isAllSelected,
  isPartiallySelected,
  visibleColumns,
  showAlphaIndex,
  onToggleAlphaIndex,
}: {
  hasSelection?: boolean
  onSelectAll?: () => void
  isAllSelected?: boolean
  isPartiallySelected?: boolean
  visibleColumns?: string[]
  /** Index toggle state — when provided, renders an Index button next to Title */
  showAlphaIndex?: boolean
  onToggleAlphaIndex?: () => void
}) {
  // undefined visibleColumns => all visible (backwards compat).
  const isVisible = (key: string) => !visibleColumns || visibleColumns.includes(key)
  return (
    <div className="flex items-center px-5 py-2 text-note font-medium text-foreground/80 border-b border-border bg-secondary/30">
      {hasSelection && (
        <div className="w-7 shrink-0 flex items-center justify-center">
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
              {isAllSelected && <PhCheck size={10} weight="bold" className="text-accent-foreground" />}
              {isPartiallySelected && !isAllSelected && <Minus size={10} weight="regular" className="text-accent-foreground" />}
            </div>
          ) : (
            <span />
          )}
        </div>
      )}
      <span className="min-w-0 flex-1 flex items-center justify-between gap-1 pr-0">
        <span>Title</span>
        {/* Alphabetical Index toggle — Notes-style placement: Title left,
            Index pinned to the cell's right edge (= immediately before
            the next column's header). Sits with the data, not in the
            global toolbar. */}
        {onToggleAlphaIndex && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleAlphaIndex() }}
            className={cn(
              "flex h-6 items-center gap-1 rounded-md px-1.5 text-note font-medium transition-all duration-100",
              showAlphaIndex
                ? "bg-foreground/10 text-foreground"
                : "text-foreground/70 hover:bg-hover-bg hover:text-foreground"
            )}
            title={showAlphaIndex ? "Exit alphabetical index" : "Show alphabetical index"}
          >
            <ListBullets size={12} weight="bold" />
            <span>Index</span>
          </button>
        )}
      </span>
      {isVisible("status") && <span className="w-[72px] shrink-0 px-2">Status</span>}
      {isVisible("tags") && <span className="w-[140px] shrink-0 px-2">Categories</span>}
      {isVisible("aliases") && <span className="w-[140px] shrink-0 px-2">Aliases</span>}
      {isVisible("parent") && <span className="w-[100px] shrink-0 px-1">Parent</span>}
      {isVisible("children") && <span className="w-[56px] shrink-0 text-center">Children</span>}
      {isVisible("links") && <span className="w-[60px] shrink-0 text-right">Links</span>}
      {isVisible("reads") && <span className="w-[56px] shrink-0 text-right">Reads</span>}
      <span className="w-[36px] shrink-0" />
      {isVisible("createdAt") && <span className="w-[70px] shrink-0 text-right">Created</span>}
      {isVisible("updatedAt") && <span className="w-[70px] shrink-0 text-right">Updated</span>}
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
  selectionActive?: boolean
  onSelect?: (opts: { multi?: boolean; shift?: boolean; index?: number }) => void
  visibleColumns?: string[]
  wikiCategories?: WikiCategory[]
  wikiArticles?: WikiArticle[]
  childrenCount?: number
}) {
  const isVisible = (key: string) => !visibleColumns || visibleColumns.includes(key)
  const categoryNames = (note.categoryIds ?? [])
    .map((id) => wikiCategories?.find((c) => c.id === id)?.name)
    .filter((n): n is string => typeof n === "string" && n.length > 0)
  const aliases = note.aliases ?? []
  const parentTitle = note.parentArticleId
    ? wikiArticles?.find((a) => a.id === note.parentArticleId)?.title
    : undefined
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div
      className={cn(
        "group flex w-full items-center px-5 py-2.5 hover:bg-hover-bg transition-colors duration-100",
        isSelected && "bg-accent/5"
      )}
      onContextMenu={(e) => {
        if (onMerge || onSplit || onDelete) {
          e.preventDefault()
          setMenuOpen(true)
        }
      }}
    >
      {/* Checkbox */}
      {onSelect && (
        <div
          className={cn(
            "w-7 shrink-0 flex items-center justify-center cursor-pointer",
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
            {isSelected && <PhCheck size={10} weight="bold" className="text-accent-foreground" />}
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
        className="flex flex-1 items-center text-left min-w-0"
      >
        <span className="min-w-0 flex-1 truncate text-note font-medium text-foreground/90">
          {note.title || "Untitled"}
        </span>
      </button>
      {isVisible("status") && (
        <div className="w-[72px] shrink-0 flex items-center px-2">
          {isWikiStub(note) ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-zinc-400/15 px-1.5 py-0.5 text-2xs font-medium text-zinc-500 dark:text-zinc-400">
              <FileDashed size={11} weight="regular" />
              Stub
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md bg-accent/15 px-1.5 py-0.5 text-2xs font-medium text-accent">
              <BookOpen size={11} weight="regular" />
              Article
            </span>
          )}
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

      {/* Context menu */}
      <span className="w-[36px] shrink-0 flex justify-center">
        {(onMerge || onSplit || onDelete) ? (
          <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverTrigger asChild>
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(true) }}
                className="rounded-md p-1 text-muted-foreground/60 opacity-0 group-hover:opacity-100 hover:bg-active-bg hover:text-muted-foreground/60 transition-all duration-100"
              >
                <DotsThree size={14} weight="bold" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-44 p-1" onOpenAutoFocus={(e) => e.preventDefault()}>
              {onMerge && (
                <button
                  onClick={() => { setMenuOpen(false); onMerge() }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-2xs text-foreground/80 hover:bg-active-bg transition-colors"
                >
                  <GitMerge size={14} weight="regular" /> Merge into...
                </button>
              )}
              {onSplit && (
                <button
                  onClick={() => { setMenuOpen(false); onSplit() }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-2xs text-foreground/80 hover:bg-active-bg transition-colors"
                >
                  <Scissors size={14} weight="regular" /> Split wiki
                </button>
              )}
              {/* Show connected — in-place backlink filter inside the
                  Wiki view. Wikis use linksOut (extracted [[wiki-link]]s)
                  and a backlinks index just like notes do. */}
              {(onMerge || onSplit) && (
                <div className="my-1 h-px bg-border/40" />
              )}
              {onShowConnected && (
                <ShowConnectedSubmenu
                  onSelect={(direction) => {
                    setMenuOpen(false)
                    onShowConnected(direction)
                  }}
                />
              )}

              {/* Move to folder — wiki articles share the same global folder
                  containers as notes. Submenu of folders + "No folder" reset. */}
              {onShowConnected && <div className="my-1 h-px bg-border/40" />}
              <FolderPickerSubmenu
                currentFolderId={note.folderId ?? null}
                onSelect={(folderId) => {
                  setMenuOpen(false)
                  usePlotStore.getState().updateWikiArticle(note.id, { folderId })
                }}
              />
              {(onMerge || onSplit) && onDelete && (
                <div className="my-1 h-px bg-border/40" />
              )}
              {onDelete && (
                <button
                  onClick={() => { setMenuOpen(false); onDelete() }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-2xs text-destructive hover:bg-active-bg transition-colors"
                >
                  <Trash size={14} weight="regular" /> Delete
                </button>
              )}
            </PopoverContent>
          </Popover>
        ) : null}
      </span>

      {isVisible("createdAt") && (
        <span className="w-[70px] shrink-0 text-right text-2xs tabular-nums text-muted-foreground/60">
          {shortRelative(note.createdAt)}
        </span>
      )}
      {isVisible("updatedAt") && (
        <span className="w-[70px] shrink-0 text-right text-2xs tabular-nums text-muted-foreground/60">
          {shortRelative(note.updatedAt)}
        </span>
      )}
    </div>
  )
}

/* ── Index Row (used in alphabetical view) ── */

function IndexTableRow({
  note,
  backlinkCount,
  onClick,
}: {
  note: WikiArticle
  backlinkCount: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center px-5 py-2 hover:bg-hover-bg transition-colors duration-100 cursor-pointer text-left"
    >
      <span className="min-w-0 flex-1 truncate text-note text-foreground/90">
        {note.title || "Untitled"}
      </span>
      <span className="w-[60px] shrink-0 text-right text-2xs tabular-nums text-muted-foreground/60">
        {backlinkCount > 0 ? backlinkCount : "\u2014"}
      </span>
      <span className="w-[70px] shrink-0 text-right text-2xs tabular-nums text-muted-foreground/60">
        {shortRelative(note.updatedAt)}
      </span>
    </button>
  )
}

/* ── Empty State ── */

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/60">
        <BookOpen className="text-muted-foreground/70" size={20} weight="regular" />
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
  dashFilter,
  setDashFilter,
  showAllArticles,
  setShowAllArticles,
  categoryFilterLabel,
  onClearCategoryFilter,
  onOpenArticle,
  onMergeArticle,
  onShowConnectedArticle,
  onSplitArticle,
  onDeleteArticle,
  redLinks,
  onCreateFromRedLink,
  stubCount,
  wikiArticles,
  selectedIds,
  onSelect,
  onSelectAll,
  visibleColumns,
  wikiCategories,
  wikiGroups,
  groupBy,
}: WikiListProps) {
  const selectionActive = selectedIds ? selectedIds.size > 0 : false
  const groupedArticles = groupByInitial(filteredWikiNotes, (n: WikiArticle) => n.title || "Untitled")

  // Compute visible notes for the current filter (used for select-all)
  const visibleNotes = sortedFilteredWikiNotes.filter((note) => {
    if (dashFilter === "stubs") {
      const article = wikiArticles?.find((a) => a.id === note.id)
      return article ? isWikiStub(article) : false
    }
    if (dashFilter === "articles") {
      const article = wikiArticles?.find((a) => a.id === note.id)
      return article ? !isWikiStub(article) : true
    }
    return true
  })

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

  const counts = {
    all: sortedFilteredWikiNotes.length,
    articles: sortedFilteredWikiNotes.length - (stubCount ?? 0),
    stubs: stubCount ?? 0,
    redlinks: redLinks.length,
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

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* ── Controls Bar ── */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border-subtle px-5 py-2">
        {/* Back to Overview */}
        <button
          onClick={() => { setWikiViewMode("dashboard"); onClearCategoryFilter?.() }}
          className="flex items-center gap-1 text-note text-muted-foreground hover:text-foreground transition-colors duration-100 mr-1"
        >
          <ArrowLeft size={12} weight="regular" />
          Overview
        </button>

        <span className="h-4 w-px bg-border/50" />

        {/* Filter Tabs */}
        {(["all", "articles", "stubs"] as const).map((tab) => {
          const labels: Record<string, string> = { all: "All", articles: "Articles", stubs: "Stubs" }
          const tabCount = counts[tab as keyof typeof counts]
          return (
            <button
              key={tab}
              onClick={() => {
                setDashFilter(tab)
                setShowAllArticles(false)
              }}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-2xs font-medium transition-all duration-100",
                dashFilter === tab && !showAllArticles
                  ? tab === "stubs" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    : "bg-foreground/10 text-foreground"
                  : tab === "stubs" ? "text-amber-600/80 dark:text-amber-400/80 hover:bg-hover-bg hover:text-amber-600 dark:hover:text-amber-400"
                    : "text-muted-foreground hover:bg-hover-bg hover:text-foreground"
              )}
            >
              {labels[tab]}
              {tabCount !== undefined && tabCount > 0 && (
                <span className="ml-1 tabular-nums text-muted-foreground">
                  {tabCount}
                </span>
              )}
            </button>
          )
        })}

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
                <PhX size={10} weight="regular" />
              </button>
            </span>
          </>
        )}

        {/* Index toggle moved into ColumnHeaders so it sits with the data it
            groups (next to the Status column header). Frees this toolbar of
            data-level controls — it now hosts only tabs + category filter. */}
      </div>

      {/* ── Table Content ── */}
      {showAllArticles ? (
        /* ── Alphabetical Index ── */
        <div className="flex-1 overflow-y-auto">
          <ColumnHeaders
            visibleColumns={visibleColumns}
            showAlphaIndex={showAllArticles}
            onToggleAlphaIndex={() => setShowAllArticles(!showAllArticles)}
          />
          <div>
            {Array.from(groupedArticles.entries()).map(([group, articles]) => (
              <div key={group} id={`wiki-group-${group}`}>
                <div className="sticky top-0 z-10 bg-background py-1.5 px-5 text-2xs font-medium text-muted-foreground/70 border-b border-border-subtle">
                  {group}
                </div>
                {(articles as WikiArticle[]).map(note => (
                  <IndexTableRow
                    key={note.id}
                    note={note}
                    backlinkCount={backlinkCounts.get(note.id) ?? 0}
                    onClick={() => onOpenArticle(note.id)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ── Filtered Article Table ── */
        <div className="flex-1 overflow-y-auto">
          <ColumnHeaders
            hasSelection={!!onSelect}
            onSelectAll={handleSelectAll}
            isAllSelected={isAllSelected}
            isPartiallySelected={isPartiallySelected}
            visibleColumns={visibleColumns}
            showAlphaIndex={showAllArticles}
            onToggleAlphaIndex={() => setShowAllArticles(!showAllArticles)}
          />
          {sortedFilteredWikiNotes.length === 0 ? (
            <EmptyState />
          ) : groupBy && groupBy !== "none" && wikiGroups && wikiGroups.length > 0 && !(wikiGroups.length === 1 && wikiGroups[0].key === "_all") ? (
            /* ── Grouped view ── */
            <div>
              {wikiGroups.map((group) => {
                const groupArticles = group.articles.filter((note) => {
                  if (dashFilter === "stubs") {
                    const article = wikiArticles?.find((a) => a.id === note.id)
                    return article ? isWikiStub(article) : false
                  }
                  if (dashFilter === "articles") {
                    const article = wikiArticles?.find((a) => a.id === note.id)
                    return article ? !isWikiStub(article) : true
                  }
                  return true
                })
                if (groupArticles.length === 0) return null
                return (
                  <div key={group.key}>
                    {group.label && (
                      <div className="flex items-center gap-2.5 px-5 py-2 mt-3 mb-0.5 border-b border-border-subtle">
                        <span className="text-2xs font-semibold text-muted-foreground/60 uppercase tracking-wide">
                          {group.label}
                        </span>
                        <span className="text-2xs text-muted-foreground/70 tabular-nums">
                          {groupArticles.length}
                        </span>
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
              {dashFilter === "stubs" && (stubCount ?? 0) === 0 && <EmptyState />}
            </div>
          ) : (
            /* ── Flat view (no grouping) ── */
            <div>
              {/* Article/Stub rows */}
              {sortedFilteredWikiNotes
                .filter((note) => {
                  if (dashFilter === "stubs") {
                    const article = wikiArticles?.find((a) => a.id === note.id)
                    return article ? isWikiStub(article) : false
                  }
                  if (dashFilter === "articles") {
                    const article = wikiArticles?.find((a) => a.id === note.id)
                    return article ? !isWikiStub(article) : true
                  }
                  return true // "all"
                })
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
                  selectionActive={selectionActive}
                  onSelect={onSelect ? (opts) => onSelect(note.id, { ...opts, index: idx }) : undefined}
                  visibleColumns={visibleColumns}
                  wikiCategories={wikiCategories}
                  wikiArticles={wikiArticles}
                  childrenCount={childrenCounts.get(note.id) ?? 0}
                />
              ))}
              {/* Empty state for stubs filter with no stubs */}
              {dashFilter === "stubs" && (stubCount ?? 0) === 0 && <EmptyState />}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
