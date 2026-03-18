"use client"

import { useState, useMemo, useRef, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Search, X, FileText, Pin } from "lucide-react"
import { usePlotStore } from "@/lib/store"

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

interface ViewHeaderProps {
  icon: ReactNode
  title: string
  count?: number
  /** Search placeholder (if provided, search bar is shown) */
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  /** Action button(s) on the right */
  actions?: ReactNode
  /** Extra content after the header (e.g. filter bar, tabs) */
  children?: ReactNode
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

  // Match notes by title
  const matchedNotes = useMemo(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase().trim()
    return notes
      .filter((n) => !n.archived && !n.trashed && n.triageStatus !== "trashed")
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

  return (
    <>
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-5">
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

        {showSearch && (
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setHighlightedIndex(-1)
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => {
                // Delay to allow mousedown on dropdown item to fire first
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
                <X className="h-3.5 w-3.5" />
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
                        <Pin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      ) : (
                        <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
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

        {actions}
      </div>
      {children}
    </>
  )
}
