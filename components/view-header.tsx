"use client"

import { useState, useEffect, type ReactNode } from "react"
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { FunnelSimple } from "@phosphor-icons/react/dist/ssr/FunnelSimple"
import { SlidersHorizontal } from "@phosphor-icons/react/dist/ssr/SlidersHorizontal"
import { SidebarSimple } from "@phosphor-icons/react/dist/ssr/SidebarSimple"
import { Plus } from "@phosphor-icons/react/dist/ssr/Plus"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

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
          : "text-muted-foreground/70 hover:bg-hover-bg hover:text-foreground"
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
}: ViewHeaderProps) {
  // Internal search state if not controlled
  const [internalSearch, setInternalSearch] = useState("")
  const search = searchValue ?? internalSearch
  const setSearch = onSearchChange ?? setInternalSearch
  const showSearch = searchPlaceholder !== undefined

  // Filter/Display popover state
  const [filterOpen, setFilterOpen] = useState(false)
  const [displayOpen, setDisplayOpen] = useState(false)

  // Close other when one opens
  useEffect(() => {
    if (filterOpen) setDisplayOpen(false)
  }, [filterOpen])
  useEffect(() => {
    if (displayOpen) setFilterOpen(false)
  }, [displayOpen])

  const hasToolbar = showFilter || showDisplay || showDetailPanel || onCreateNew

  return (
    <>
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
        {/* Title area */}
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{icon}</span>
          <h1 className="text-[13px] font-semibold text-foreground">
            {title}
            {count !== undefined && (
              <span className="ml-1.5 text-[13px] font-normal text-muted-foreground">
                {count}
              </span>
            )}
          </h1>
        </div>

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
              className="h-8 w-48 rounded-md border border-border bg-background pl-8 pr-7 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
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
            {showFilter && (
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
                  className="!w-auto !max-w-none rounded-[10px] border border-border-subtle bg-surface-overlay p-0 shadow-lg"
                >
                  {filterContent}
                </PopoverContent>
              </Popover>
            )}

            {showDisplay && (
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
                  className="w-[300px] overflow-hidden rounded-[10px] border border-border-subtle bg-surface-overlay p-0 shadow-lg"
                >
                  {displayContent}
                </PopoverContent>
              </Popover>
            )}

            {showDetailPanel && (
              <HBtn active={detailPanelOpen} onClick={onDetailPanelToggle}>
                <SidebarSimple size={16} weight="regular" />
              </HBtn>
            )}

            {onCreateNew && (
              <HBtn onClick={onCreateNew}>
                <Plus size={16} weight="regular" />
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
