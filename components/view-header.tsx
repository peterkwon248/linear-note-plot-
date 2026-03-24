"use client"

import { useState, useMemo, useRef, useCallback, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { FileText as PhFileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { PushPin } from "@phosphor-icons/react/dist/ssr/PushPin"
import { FunnelSimple } from "@phosphor-icons/react/dist/ssr/FunnelSimple"
import { SlidersHorizontal } from "@phosphor-icons/react/dist/ssr/SlidersHorizontal"
import { SidebarSimple } from "@phosphor-icons/react/dist/ssr/SidebarSimple"
import { Plus } from "@phosphor-icons/react/dist/ssr/Plus"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { usePlotStore } from "@/lib/store"

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
          : "text-muted-foreground/50 hover:bg-hover-bg hover:text-muted-foreground"
      }`}
    >
      {children}
    </button>
  )
}

export { HBtn }

/* ── highlight helper ── */

function highlightMatch(text: string, query: string): ReactNode {
  if (!query.trim()) return text
  const lower = text.toLowerCase()
  const q = query.toLowerCase().trim()
  const idx = lower.indexOf(q)
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-accent/40 text-foreground rounded-sm">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  )
}

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
  const router = useRouter()
  const notes = usePlotStore((s) => s.notes)
  const setSelectedNoteId = usePlotStore((s) => s.setSelectedNoteId)

  // Internal search state if not controlled
  const [internalSearch, setInternalSearch] = useState("")
  const search = searchValue ?? internalSearch
  const setSearch = onSearchChange ?? setInternalSearch
  const showSearch = searchPlaceholder !== undefined

  // Dropdown state
  const [focused, setFocused] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  // Match notes by title
  const matchedNotes = useMemo(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase().trim()
    return notes
      .filter((n) => !n.trashed && n.triageStatus !== "trashed")
      .filter((n) => (n.title || "").toLowerCase().includes(q))
      .slice(0, 6)
  }, [notes, search])

  const showDropdown = focused && search.trim().length > 0 && matchedNotes.length > 0

  const selectNote = useCallback((noteId: string) => {
    setSelectedNoteId(noteId)
    router.push("/notes")
    setFocused(false)
    setHighlightedIndex(-1)
  }, [setSelectedNoteId, router])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showDropdown) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev < matchedNotes.length - 1 ? prev + 1 : 0))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : matchedNotes.length - 1))
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault()
      selectNote(matchedNotes[highlightedIndex].id)
    } else if (e.key === "Escape") {
      setFocused(false)
      setHighlightedIndex(-1)
    }
  }, [showDropdown, highlightedIndex, matchedNotes, selectNote])

  const statusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const hasToolbar = showFilter || showDisplay || showDetailPanel || onCreateNew

  return (
    <>
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-5">
        {/* Title area */}
        <div className="flex items-center gap-2.5">
          <span className="text-muted-foreground">{icon}</span>
          <h1 className="text-xl font-semibold text-foreground">
            {title}
            {count !== undefined && (
              <span className="ml-1.5 text-base font-normal text-muted-foreground">
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
              onChange={(e) => {
                setSearch(e.target.value)
                setHighlightedIndex(-1)
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => {
                setTimeout(() => setFocused(false), 150)
              }}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              className="h-8 w-48 rounded-md border border-border bg-background pl-8 pr-7 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("")
                  setFocused(false)
                  setHighlightedIndex(-1)
                }}
                className="absolute right-2 text-muted-foreground hover:text-foreground"
              >
                <PhX size={14} weight="regular" />
              </button>
            )}

            {/* Dropdown autocomplete */}
            {showDropdown && (
              <div
                ref={dropdownRef}
                className="absolute right-0 top-full z-50 mt-1 w-72 overflow-hidden rounded-md border border-border bg-popover shadow-md"
              >
                <div className="max-h-64 overflow-y-auto py-1">
                  {matchedNotes.map((note, i) => (
                    <button
                      key={note.id}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        selectNote(note.id)
                      }}
                      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                        i === highlightedIndex
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground hover:bg-secondary"
                      }`}
                    >
                      {note.pinned ? (
                        <PushPin size={14} weight="regular" className="shrink-0 text-muted-foreground" />
                      ) : (
                        <PhFileText size={14} weight="regular" className="shrink-0 text-muted-foreground" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate">
                          {highlightMatch(note.title || "Untitled", search)}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {statusLabel(note.status)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
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
                      <FunnelSimple size={15} weight="regular" />
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
                      <SlidersHorizontal size={15} weight="regular" />
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
                <SidebarSimple size={15} weight="regular" />
              </HBtn>
            )}

            {onCreateNew && (
              <HBtn onClick={onCreateNew}>
                <Plus size={15} weight="regular" />
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
