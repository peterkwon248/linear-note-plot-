"use client"

import { useState, useEffect, useMemo, type ReactNode } from "react"
import {
  Search as MagnifyingGlass,
  X as PhX,
  Filter as FunnelSimple,
  SlidersHorizontal,
  PanelRight as SidebarSimple,
  Plus,
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
// PanelsMenu lives in GlobalTopBar — view headers no longer mount it.
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ChevronDown as CaretDown,
  X as PhXIcon,
  SplitSquareHorizontal as SplitHorizontal,
} from "lucide-react"
import { setSecondarySpace, getSecondarySpace } from "@/lib/table-route"
import { useActiveSpace } from "@/lib/table-route"
import { usePane } from "@/components/workspace/pane-context"
import { usePlotStore } from "@/lib/store"
import { useT } from "@/lib/i18n"
import { Save as FloppyDisk } from "lucide-react"
import { QuickFilterCreateDialog } from "@/components/quick-filter/quick-filter-create-dialog"

/* ── Header Icon Button ── */

function HBtn({
  children,
  active,
  onClick,
}: {
  children: ReactNode
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded-md border-none transition-all duration-100 ${
        active
          ? "bg-active-bg text-foreground"
          : "text-foreground/65 hover:bg-hover-bg hover:text-foreground"
      }`}
    >
      {children}
    </button>
  )
}

export { HBtn }

/* ── ViewHeader Props ── */

interface ViewHeaderProps {
  icon: ReactNode
  title: string
  /** Optional rich title node that REPLACES the default `{icon} {title} {count}`
   *  rendering. Use for breadcrumb-style headers (e.g. `Library > Tags`,
   *  `Books > [book]`) where the title carries navigation semantics.
   *  When set, the leading icon/title/subtitle/count chain is hidden in
   *  favor of this slot. */
  titleNode?: ReactNode
  /** Optional sub-page label rendered after title with chevron prefix
   *  (e.g. Ontology / Graph). Used when a view has internal sub-modes
   *  (Graph / Insights / Dashboard) that aren't separate routes. */
  subtitle?: ReactNode
  count?: number
  /** Search placeholder (if provided, search bar is shown) */
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  /** Legacy: action button(s) on the right (before filter/display icons) */
  actions?: ReactNode
  /** Extra content after the header row (e.g. filter chips) */
  children?: ReactNode

  /* ── Filter / Display / Detail Panel ── */

  /** Show filter icon button */
  showFilter?: boolean
  /** Whether filter has active selections (highlights icon) */
  hasActiveFilters?: boolean
  /** Content rendered inside filter popover */
  filterContent?: ReactNode

  /** Show display icon button */
  showDisplay?: boolean
  /** Content rendered inside display popover */
  displayContent?: ReactNode

  /** Show detail panel icon button */
  showDetailPanel?: boolean
  /** Whether detail panel is open */
  detailPanelOpen?: boolean
  /** Toggle detail panel */
  onDetailPanelToggle?: () => void
  /** Extra icon buttons inserted before the filter icon */
  extraToolbarButtons?: ReactNode
  /** Create new item callback — renders + icon next to filter/display icons */
  onCreateNew?: () => void
  /** Custom create menu content — renders + as a popover trigger with this content */
  createMenuContent?: ReactNode

  /* ── Saved View Snapshot UX ── */

  /**
   * Save view button mode.
   *  - "hidden": no button (default)
   *  - "save-as": no active view → opens name-input popover, captures current state
   *  - "update": active view, dirty → "Save changes" overwrites saved viewState
   *  - "clean": active view, no changes → button hidden (or rendered greyed out)
   */
  saveViewMode?: "hidden" | "save-as" | "update" | "clean"
  /** Called when user clicks Save (update mode) or submits the name (save-as mode) */
  onSaveView?: (name?: string) => void

  /* ── Quick filter chips (PR-Q3) ── */

  /** Suggested 1-click filter presets surfaced as chips below the header
   *  row. Each chip toggles the whole rule-set on/off. Mode-agnostic — the
   *  same chip works in list, board, grid, timeline. */
  quickFilters?: Array<{
    label: string
    labelKey?: string
    desc: string
    descKey?: string
    rules: Array<{ field: string; operator: string; value: string }>
  }>
  /** Current active filter rules. Used to compute each chip's active state. */
  activeFilters?: Array<{ field: string; operator: string; value: string }>
  /** Receive the new filter list after a quick-chip toggle. */
  onFiltersChange?: (filters: Array<{ field: string; operator: string; value: string }>) => void

  /** View scope for user-defined custom quick filters. When set, ViewHeader
   *  merges hardcoded `quickFilters` with `customQuickFilters` filtered to
   *  this context and renders a "+" button + create dialog at the end of
   *  the chip bar. Omit to disable the create UI entirely. */
  viewContext?: string
  /** Filter categories for the in-dialog rule builder. When supplied, the
   *  QuickFilterCreateDialog renders a popover-mounted FilterPanel so
   *  users can build the rule list from scratch instead of being limited
   *  to promoting an existing active filter set. */
  filterCategories?: import("@/components/filter-panel").FilterCategory[]
  /** Lookup lists passed through to the chip preview inside the create
   *  dialog so filter values render as human-readable chips. */
  folders?: import("@/lib/types").Folder[]
  tags?: import("@/lib/types").Tag[]
  labels?: import("@/lib/types").Label[]
}

export function ViewHeader({
  icon,
  title,
  titleNode,
  subtitle,
  count,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  actions,
  children,
  showFilter,
  hasActiveFilters,
  filterContent,
  showDisplay,
  displayContent,
  showDetailPanel,
  detailPanelOpen,
  onDetailPanelToggle,
  extraToolbarButtons,
  onCreateNew,
  createMenuContent,
  saveViewMode = "hidden",
  onSaveView,
  quickFilters,
  activeFilters,
  onFiltersChange,
  viewContext,
  filterCategories,
  folders,
  tags,
  labels,
}: ViewHeaderProps) {
  const t = useT()
  const pane = usePane()

  // Custom quick filters (user-defined chip bar entries) — merged in below
  // the hardcoded `quickFilters` when a `viewContext` is supplied. Pull
  // the full array from the store and memo-filter outside the selector to
  // keep referential equality stable (Zustand uses === for selector
  // results — a new array per render would loop the server snapshot).
  const allCustomQuickFilters = usePlotStore((s) => s.customQuickFilters)
  const customQuickFilters = useMemo(
    () =>
      viewContext
        ? allCustomQuickFilters.filter((qf) => qf.viewContext === viewContext)
        : [],
    [allCustomQuickFilters, viewContext],
  )
  const removeCustomQuickFilter = usePlotStore((s) => s.removeCustomQuickFilter)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // Side panel toggle — auto-wired to the store unless explicitly overridden.
  // Default is ON (showDetailPanel === undefined ↦ true) so every entity
  // header surfaces the toggle consistently; callers that need to hide it
  // pass `showDetailPanel={false}`. Secondary pane uses controlled props.
  const storeSidePanelOpen = usePlotStore((s) => s.sidePanelOpen)
  const storeToggleSidePanel = usePlotStore((s) => s.toggleSidePanel)
  const resolvedShowDetailPanel = showDetailPanel ?? true
  const resolvedDetailPanelOpen = detailPanelOpen ?? storeSidePanelOpen
  const resolvedOnDetailPanelToggle = onDetailPanelToggle ?? storeToggleSidePanel
  // Internal search state if not controlled
  const [internalSearch, setInternalSearch] = useState("")
  const search = searchValue ?? internalSearch
  const setSearch = onSearchChange ?? setInternalSearch
  const showSearch = searchPlaceholder !== undefined

  // Filter/Display popover state
  const [filterOpen, setFilterOpen] = useState(false)
  const [displayOpen, setDisplayOpen] = useState(false)

  // Hydration guard: Radix Popover/Dropdown components emit aria-controls
  // referencing IDs that aren't stable between SSR + client (React 19 useId
  // collisions w/ Radix internals). Wait until client mount before rendering
  // the interactive Popover wrappers — the trigger HTML still exists during
  // SSR so layout doesn't shift, but the Popover's mount-time DOM mutations
  // happen after hydration is complete.
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    setHydrated(true)
  }, [])

  // Close other when one opens
  useEffect(() => {
    if (filterOpen) setDisplayOpen(false)
  }, [filterOpen])
  useEffect(() => {
    if (displayOpen) setFilterOpen(false)
  }, [displayOpen])

  const showSaveButton = saveViewMode === "save-as" || saveViewMode === "update"
  const hasToolbar = showFilter || showDisplay || resolvedShowDetailPanel || onCreateNew || showSaveButton

  // Save-as popover state (collect view name)
  const [saveAsOpen, setSaveAsOpen] = useState(false)
  const [saveAsName, setSaveAsName] = useState("")

  const handleSaveAsSubmit = () => {
    const name = saveAsName.trim()
    if (name && onSaveView) onSaveView(name)
    setSaveAsName("")
    setSaveAsOpen(false)
  }

  return (
    <>
      <div className="flex h-(--header-height) shrink-0 items-center gap-2 border-b border-border px-4">
        {/* PanelsMenu moved to GlobalTopBar (single source of truth). Keeping
         *  it here too would duplicate the hamburger between the global top
         *  bar and every view's header. */}

        {/* Title area — in secondary pane, show space dropdown instead */}
        {pane === 'secondary' ? (
          <SecondaryTitleDropdown currentTitle={title} icon={icon} count={count} />
        ) : titleNode ? (
          // Custom title slot (e.g. breadcrumb). Replaces the default
          // icon/title/count chain entirely — caller owns the layout.
          <div className="flex items-center min-w-0">{titleNode}</div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{icon}</span>
            <h1 className="text-note font-medium text-foreground flex items-center gap-1.5">
              <span>{title}</span>
              {subtitle}
              {count !== undefined && (
                <span className="ml-1.5 text-note font-normal text-muted-foreground">
                  {count}
                </span>
              )}
            </h1>
          </div>
        )}

        <div className="flex-1" />

        {/* Search bar */}
        {showSearch && (
          <div className="relative flex items-center">
            <MagnifyingGlass size={14} className="pointer-events-none absolute left-2.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-8 w-48 rounded-md border border-border bg-background pl-8 pr-7 text-note text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 text-muted-foreground hover:text-foreground"
              >
                <PhX size={14} />
              </button>
            )}
          </div>
        )}

        {/* Legacy actions slot */}
        {actions}

        {/* Filter / Display / Detail Panel icons */}
        {hasToolbar && (
          <div className="flex items-center gap-0.5">
            {extraToolbarButtons}

            {/* Save view button — icon-only, sized to match the rest of the
                toolbar (16px). Update mode uses accent color to signal unsaved
                changes; save-as mode is a neutral HBtn. */}
            {showSaveButton && (
              saveViewMode === "update" ? (
                <button
                  onClick={() => onSaveView?.()}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-accent transition-colors hover:bg-accent/15"
                  title="Save changes to this view"
                  aria-label="Save changes"
                >
                  <FloppyDisk size={16} />
                </button>
              ) : (
                hydrated ? (
                  <Popover open={saveAsOpen} onOpenChange={(o) => { setSaveAsOpen(o); if (!o) setSaveAsName("") }}>
                    <PopoverTrigger asChild>
                      <div>
                        <HBtn active={saveAsOpen}>
                          <FloppyDisk size={16} />
                        </HBtn>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent
                      align="end"
                      sideOffset={5}
                      className="w-[240px] rounded-lg border border-border-subtle bg-surface-overlay p-2 shadow-lg"
                    >
                      <input
                        autoFocus
                        type="text"
                        value={saveAsName}
                        onChange={(e) => setSaveAsName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveAsSubmit()
                          if (e.key === "Escape") { setSaveAsName(""); setSaveAsOpen(false) }
                        }}
                        placeholder="View name"
                        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-note text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </PopoverContent>
                  </Popover>
                ) : (
                  <button
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-foreground/60"
                    title="Save current view"
                    aria-label="Save view"
                  >
                    <FloppyDisk size={16} />
                  </button>
                )
              )
            )}

            {showFilter && (
              hydrated ? (
                <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                  <PopoverTrigger asChild>
                    <div>
                      <HBtn active={filterOpen || hasActiveFilters}>
                        <FunnelSimple size={16} />
                      </HBtn>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    sideOffset={5}
                    className="!w-auto !max-w-none rounded-lg border border-border-subtle bg-surface-overlay p-0 shadow-lg"
                  >
                    {filterContent}
                  </PopoverContent>
                </Popover>
              ) : (
                <HBtn active={hasActiveFilters}>
                  <FunnelSimple size={16} />
                </HBtn>
              )
            )}

            {showDisplay && (
              hydrated ? (
                <Popover open={displayOpen} onOpenChange={setDisplayOpen}>
                  <PopoverTrigger asChild>
                    <div>
                      <HBtn active={displayOpen}>
                        <SlidersHorizontal size={16} />
                      </HBtn>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    sideOffset={5}
                    className="w-[360px] overflow-hidden rounded-lg border border-border-subtle bg-surface-overlay p-0 shadow-lg"
                  >
                    {displayContent}
                  </PopoverContent>
                </Popover>
              ) : (
                <HBtn>
                  <SlidersHorizontal size={16} />
                </HBtn>
              )
            )}

            {resolvedShowDetailPanel && (
              <HBtn active={resolvedDetailPanelOpen} onClick={resolvedOnDetailPanelToggle}>
                <SidebarSimple size={16} />
              </HBtn>
            )}

            <SplitViewButton />

            {createMenuContent ? (
              hydrated ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <div><HBtn><Plus size={16} /></HBtn></div>
                  </PopoverTrigger>
                  <PopoverContent align="end" sideOffset={5} className="!w-auto !max-w-none rounded-lg border border-border-subtle bg-surface-overlay p-0 shadow-lg">
                    {createMenuContent}
                  </PopoverContent>
                </Popover>
              ) : (
                <HBtn><Plus size={16} /></HBtn>
              )
            ) : onCreateNew ? (
              <HBtn onClick={onCreateNew}>
                <Plus size={16} />
              </HBtn>
            ) : null}
            {pane === 'secondary' && (
              <HBtn onClick={() => usePlotStore.getState().closeSecondary()}>
                <PhXIcon size={16} />
              </HBtn>
            )}
          </div>
        )}
      </div>

      {/* Quick filter chips (PR-Q3) — 1-click presets from view-configs
          quickFilters + user-defined customQuickFilters (2026-05-25). Same
          chip surface works in list / board / grid / timeline. Default
          chips first, user-defined after, then a trailing "+" button when
          `viewContext` is supplied. */}
      {((quickFilters && quickFilters.length > 0) || customQuickFilters.length > 0 || viewContext) && (
        <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-border px-4 py-1.5">
          {quickFilters?.map((qf, i) => {
            const filters = activeFilters ?? []
            const active = qf.rules.every((r) =>
              filters.some(
                (f) => f.field === r.field && f.operator === r.operator && f.value === r.value,
              ),
            )
            const onClick = () => {
              if (!onFiltersChange) return
              if (active) {
                onFiltersChange(
                  filters.filter(
                    (f) =>
                      !qf.rules.some(
                        (r) => r.field === f.field && r.operator === f.operator && r.value === f.value,
                      ),
                  ),
                )
              } else {
                const merged = [...filters]
                for (const r of qf.rules) {
                  if (
                    !merged.some(
                      (f) => f.field === r.field && f.operator === r.operator && f.value === r.value,
                    )
                  ) {
                    merged.push(r)
                  }
                }
                onFiltersChange(merged)
              }
            }
            return (
              <button
                key={`${qf.label}-${i}`}
                type="button"
                onClick={onClick}
                title={qf.descKey ? t(qf.descKey) : qf.desc}
                className={
                  active
                    ? "shrink-0 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-2xs font-medium text-accent transition-colors"
                    : "shrink-0 rounded-full border border-border bg-secondary/30 px-2.5 py-0.5 text-2xs font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                }
              >
                {qf.labelKey ? t(qf.labelKey) : qf.label}
              </button>
            )
          })}

          {/* User-defined quick filters (scoped to viewContext) */}
          {customQuickFilters.map((qf) => {
            const filters = activeFilters ?? []
            const active = qf.rules.every((r) =>
              filters.some(
                (f) => f.field === r.field && f.operator === r.operator && f.value === r.value,
              ),
            )
            const onClick = () => {
              if (!onFiltersChange) return
              if (active) {
                onFiltersChange(
                  filters.filter(
                    (f) =>
                      !qf.rules.some(
                        (r) => r.field === f.field && r.operator === f.operator && r.value === f.value,
                      ),
                  ),
                )
              } else {
                const merged = [...filters]
                for (const r of qf.rules) {
                  if (
                    !merged.some(
                      (f) => f.field === r.field && f.operator === r.operator && f.value === r.value,
                    )
                  ) {
                    merged.push(r)
                  }
                }
                onFiltersChange(merged)
              }
            }
            return (
              <span
                key={qf.id}
                className={
                  "group inline-flex shrink-0 items-stretch overflow-hidden rounded-full border text-2xs font-medium transition-colors " +
                  (active
                    ? "border-accent/40 bg-accent/10 text-accent"
                    : "border-border bg-secondary/30 text-muted-foreground hover:border-border hover:text-foreground")
                }
              >
                <button
                  type="button"
                  onClick={onClick}
                  title={qf.desc}
                  className="px-2.5 py-0.5"
                >
                  {qf.label}
                </button>
                <button
                  type="button"
                  onClick={() => removeCustomQuickFilter(qf.id)}
                  title={t("filter.quick.delete")}
                  className="invisible flex w-5 items-center justify-center text-current/70 transition-colors hover:text-destructive group-hover:visible"
                >
                  <PhX size={10} strokeWidth={2.5} />
                </button>
              </span>
            )
          })}

          {/* "+" — open create dialog. Only rendered when a viewContext is
              passed by the caller (otherwise we have no scope to attach the
              new chip to). */}
          {viewContext && (
            <button
              type="button"
              onClick={() => setCreateDialogOpen(true)}
              title={t("filter.quick.add")}
              className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground transition-colors hover:border-accent/60 hover:text-accent"
            >
              <Plus size={12} strokeWidth={2.5} />
            </button>
          )}
        </div>
      )}

      {/* Children slot (filter chips, tabs, etc.) */}
      {children}

      {/* Custom quick filter create dialog (promote current filter rules) */}
      {viewContext && (
        <QuickFilterCreateDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          viewContext={viewContext}
          activeFilters={activeFilters ?? []}
          filterCategories={filterCategories}
          folders={folders}
          tags={tags}
          labels={labels}
        />
      )}
    </>
  )
}

/** Secondary pane title — dropdown to switch spaces + close button */

import { IconHome, IconNotes, IconWiki, IconCalendar } from "@/components/plot-icons"
import {
  Network as GraphIcon,
  Library as Books,
  BookOpen,
} from "lucide-react"

const SECONDARY_SPACE_CONFIG: Array<{ key: string; label: string; Icon: any }> = [
  { key: "home", label: "Home", Icon: IconHome },
  { key: "notes", label: "Notes", Icon: IconNotes },
  { key: "wiki", label: "Wiki", Icon: IconWiki },
  { key: "books", label: "Books", Icon: BookOpen },
  { key: "calendar", label: "Calendar", Icon: IconCalendar },
  { key: "ontology", label: "Ontology", Icon: GraphIcon },
  { key: "library", label: "Library", Icon: Books },
]

function SecondaryTitleDropdown({ currentTitle, icon, count }: { currentTitle: string; icon: ReactNode; count?: number }) {
  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
            <span className="text-muted-foreground">{icon}</span>
            <h1 className="text-note font-medium text-foreground flex items-center gap-1">
              {currentTitle}
              {count !== undefined && (
                <span className="text-note font-normal text-muted-foreground">{count}</span>
              )}
              <CaretDown size={12} strokeWidth={2.5} className="text-muted-foreground/60 ml-0.5" />
            </h1>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          {SECONDARY_SPACE_CONFIG.map(({ key, label, Icon }) => (
            <DropdownMenuItem
              key={key}
              onClick={() => {
                usePlotStore.getState().closeSecondary()
                setSecondarySpace(key as any)
              }}
              className="gap-2.5 py-2 text-sm"
            >
              <Icon size={18} strokeWidth={1.5} />
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

/** Split View toggle button — opens secondary panel with the current space */
function SplitViewButton() {
  const pane = usePane()
  const activeSpace = useActiveSpace()
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const secondaryNoteId = usePlotStore((s) => s.secondaryNoteId)
  const closeSecondary = usePlotStore((s) => s.closeSecondary)

  // Don't show in secondary pane
  if (pane === 'secondary') return null

  const isSplitOpen = !!secondaryNoteId || !!getSecondarySpace()

  return (
    <HBtn
      active={isSplitOpen}
      onClick={() => {
        if (isSplitOpen) {
          closeSecondary()
        } else {
          setSecondarySpace(activeSpace)
        }
      }}
    >
      <SplitHorizontal size={16} />
    </HBtn>
  )
}
