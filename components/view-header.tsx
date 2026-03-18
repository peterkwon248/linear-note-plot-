"use client"

import { useState, type ReactNode } from "react"
import { Search, X } from "lucide-react"

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
  // Internal search state if not controlled
  const [internalSearch, setInternalSearch] = useState("")
  const search = searchValue ?? internalSearch
  const setSearch = onSearchChange ?? setInternalSearch
  const showSearch = searchPlaceholder !== undefined

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
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-8 w-48 rounded-md border border-border bg-background pl-8 pr-7 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {actions}
      </div>
      {children}
    </>
  )
}
