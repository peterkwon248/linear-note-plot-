"use client"

import { useState, useEffect, type ReactNode } from "react"
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { FunnelSimple } from "@phosphor-icons/react/dist/ssr/FunnelSimple"
import { SlidersHorizontal } from "@phosphor-icons/react/dist/ssr/SlidersHorizontal"
import { SidebarSimple } from "@phosphor-icons/react/dist/ssr/SidebarSimple"
import { Plus } from "@phosphor-icons/react/dist/ssr/Plus"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { X as PhXIcon } from "@phosphor-icons/react/dist/ssr/X"
import { SplitHorizontal } from "@phosphor-icons/react/dist/ssr/SplitHorizontal"
import { setSecondarySpace, getSecondarySpace } from "@/lib/table-route"
import { useActiveSpace } from "@/lib/table-route"
import { usePane } from "@/components/workspace/pane-context"
import { usePlotStore } from "@/lib/store"
import { FloppyDisk } from "@phosphor-icons/react/dist/ssr/FloppyDisk"

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
}

export function ViewHeader({
  icon,
  title,
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
}: ViewHeaderProps) {
  const pane = usePane()
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
  const hasToolbar = showFilter || showDisplay || showDetailPanel || onCreateNew || showSaveButton

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
        {/* Title area — in secondary pane, show space dropdown instead */}
        {pane === 'secondary' ? (
          <SecondaryTitleDropdown currentTitle={title} icon={icon} count={count} />
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{icon}</span>
            <h1 className="text-note font-medium text-foreground">
              {title}
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
            <MagnifyingGlass size={14} weight="regular" className="pointer-events-none absolute left-2.5 text-muted-foreground" />
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
                <PhX size={14} weight="regular" />
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

            {/* Save view button — Linear pattern. Update mode shows when dirty,
                save-as mode shows when no active view exists. Either reveals
                an explicit signal so the user knows there are unsaved changes. */}
            {showSaveButton && (
              saveViewMode === "update" ? (
                <button
                  onClick={() => onSaveView?.()}
                  className="flex h-7 items-center gap-1 rounded-md border-none bg-accent/10 px-2 text-2xs font-medium text-accent transition-colors hover:bg-accent/15"
                  title="Save changes to this view"
                >
                  <FloppyDisk size={12} weight="regular" />
                  <span>Save</span>
                </button>
              ) : (
                hydrated ? (
                  <Popover open={saveAsOpen} onOpenChange={(o) => { setSaveAsOpen(o); if (!o) setSaveAsName("") }}>
                    <PopoverTrigger asChild>
                      <button
                        className="flex h-7 items-center gap-1 rounded-md border-none bg-secondary/60 px-2 text-2xs font-medium text-foreground/80 transition-colors hover:bg-hover-bg hover:text-foreground"
                        title="Save current filters/sort/grouping as a view"
                      >
                        <FloppyDisk size={12} weight="regular" />
                        <span>Save view</span>
                      </button>
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
                  <button className="flex h-7 items-center gap-1 rounded-md border-none bg-secondary/60 px-2 text-2xs font-medium text-foreground/80">
                    <FloppyDisk size={12} weight="regular" />
                    <span>Save view</span>
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
                        <FunnelSimple size={16} weight="regular" />
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
                  <FunnelSimple size={16} weight="regular" />
                </HBtn>
              )
            )}

            {showDisplay && (
              hydrated ? (
                <Popover open={displayOpen} onOpenChange={setDisplayOpen}>
                  <PopoverTrigger asChild>
                    <div>
                      <HBtn active={displayOpen}>
                        <SlidersHorizontal size={16} weight="regular" />
                      </HBtn>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    sideOffset={5}
                    className="w-[300px] overflow-hidden rounded-lg border border-border-subtle bg-surface-overlay p-0 shadow-lg"
                  >
                    {displayContent}
                  </PopoverContent>
                </Popover>
              ) : (
                <HBtn>
                  <SlidersHorizontal size={16} weight="regular" />
                </HBtn>
              )
            )}

            {showDetailPanel && (
              <HBtn active={detailPanelOpen} onClick={onDetailPanelToggle}>
                <SidebarSimple size={16} weight="regular" />
              </HBtn>
            )}

            <SplitViewButton />

            {createMenuContent ? (
              hydrated ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <div><HBtn><Plus size={16} weight="regular" /></HBtn></div>
                  </PopoverTrigger>
                  <PopoverContent align="end" sideOffset={5} className="!w-auto !max-w-none rounded-lg border border-border-subtle bg-surface-overlay p-0 shadow-lg">
                    {createMenuContent}
                  </PopoverContent>
                </Popover>
              ) : (
                <HBtn><Plus size={16} weight="regular" /></HBtn>
              )
            ) : onCreateNew ? (
              <HBtn onClick={onCreateNew}>
                <Plus size={16} weight="regular" />
              </HBtn>
            ) : null}
            {pane === 'secondary' && (
              <HBtn onClick={() => usePlotStore.getState().closeSecondary()}>
                <PhXIcon size={16} weight="regular" />
              </HBtn>
            )}
          </div>
        )}
      </div>

      {/* Children slot (filter chips, tabs, etc.) */}
      {children}
    </>
  )
}

/** Secondary pane title — dropdown to switch spaces + close button */

import { IconHome, IconNotes, IconWiki, IconCalendar } from "@/components/plot-icons"
import { Graph as GraphIcon } from "@phosphor-icons/react/dist/ssr/Graph"
import { Books } from "@phosphor-icons/react/dist/ssr/Books"

const SECONDARY_SPACE_CONFIG: Array<{ key: string; label: string; Icon: any }> = [
  { key: "home", label: "Home", Icon: IconHome },
  { key: "notes", label: "Notes", Icon: IconNotes },
  { key: "wiki", label: "Wiki", Icon: IconWiki },
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
              <CaretDown size={12} weight="bold" className="text-muted-foreground/60 ml-0.5" />
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
              <Icon size={18} weight="light" />
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
      <SplitHorizontal size={16} weight="regular" />
    </HBtn>
  )
}
