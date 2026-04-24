"use client"

import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import { usePlotStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight"
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass"

interface CategoryTreePickerProps {
  mode: "multi" | "single"
  selectedIds: string[]
  onSelect: (catId: string) => void
  widthClass?: string
  autoFocusSearch?: boolean
}

export function CategoryTreePicker({
  mode,
  selectedIds,
  onSelect,
  widthClass = "w-64",
  autoFocusSearch = true,
}: CategoryTreePickerProps) {
  const wikiCategories = usePlotStore((s) => s.wikiCategories)
  const createWikiCategory = usePlotStore((s) => s.createWikiCategory)
  const [search, setSearch] = useState("")
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [creatingUnder, setCreatingUnder] = useState<string | null>(null)
  const [newChildName, setNewChildName] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)

  const assignedSet = useMemo(() => new Set(selectedIds), [selectedIds])

  // Dedupe by id (defensive against seed duplication bugs)
  const uniqueCategories = useMemo(() => {
    const seen = new Set<string>()
    return wikiCategories.filter((c) => {
      if (seen.has(c.id)) return false
      seen.add(c.id)
      return true
    })
  }, [wikiCategories])

  const rootCategories = useMemo(
    () => uniqueCategories.filter((c) => c.parentIds.length === 0),
    [uniqueCategories]
  )

  const childrenOf = useMemo(() => {
    const map = new Map<string, typeof uniqueCategories>()
    for (const cat of uniqueCategories) {
      if (cat.parentIds.length > 0) {
        const parentId = cat.parentIds[0]
        if (!map.has(parentId)) map.set(parentId, [])
        map.get(parentId)!.push(cat)
      }
    }
    return map
  }, [uniqueCategories])

  useEffect(() => {
    if (autoFocusSearch) setTimeout(() => searchRef.current?.focus(), 50)
  }, [autoFocusSearch])

  const toggleExpand = (catId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(catId)) next.delete(catId)
      else next.add(catId)
      return next
    })
  }

  const matchesSearch = useCallback(
    (cat: typeof wikiCategories[number]): boolean => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      if (cat.name.toLowerCase().includes(q)) return true
      const children = childrenOf.get(cat.id) ?? []
      return children.some((c) => matchesSearch(c))
    },
    [search, childrenOf]
  )

  const renderNode = (cat: typeof wikiCategories[number], depth: number) => {
    if (!matchesSearch(cat)) return null
    const children = childrenOf.get(cat.id) ?? []
    const isExpanded =
      expanded.has(cat.id) || search.trim().length > 0 || creatingUnder === cat.id
    const isAssigned = assignedSet.has(cat.id)

    return (
      <div key={cat.id}>
        <div
          className="group/node flex items-center gap-1 rounded-md px-1.5 py-1 text-2xs transition-colors hover:bg-hover-bg"
          style={{ paddingLeft: depth * 16 + 6 }}
        >
          {children.length > 0 ? (
            <button
              onClick={() => toggleExpand(cat.id)}
              className="p-0.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0"
            >
              {isExpanded ? (
                <CaretDown size={10} weight="bold" />
              ) : (
                <CaretRight size={10} weight="bold" />
              )}
            </button>
          ) : (
            <span className="w-[18px]" />
          )}

          <button
            onClick={() => onSelect(cat.id)}
            className="flex-1 flex items-center gap-1.5 text-left text-foreground/80 truncate"
          >
            {mode === "multi" ? (
              <span
                className={cn(
                  "w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors",
                  isAssigned
                    ? "bg-accent border-accent"
                    : "border-border-subtle hover:border-border"
                )}
              >
                {isAssigned && <PhCheck size={9} weight="bold" className="text-white" />}
              </span>
            ) : (
              <span
                className={cn(
                  "w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                  isAssigned
                    ? "border-accent"
                    : "border-border-subtle hover:border-border"
                )}
              >
                {isAssigned && <span className="w-2 h-2 rounded-full bg-accent" />}
              </span>
            )}
            <span className="truncate">{cat.name}</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              setCreatingUnder(cat.id)
              setExpanded((prev) => new Set([...prev, cat.id]))
            }}
            className="opacity-0 group-hover/node:opacity-100 p-0.5 text-muted-foreground/40 hover:text-accent transition-all shrink-0"
            title={`Add subcategory under ${cat.name}`}
          >
            <PhPlus size={9} weight="bold" />
          </button>
        </div>

        {creatingUnder === cat.id && (
          <div
            style={{ paddingLeft: (depth + 1) * 16 + 6 }}
            className="flex items-center gap-1 px-1.5 py-1"
          >
            <input
              autoFocus
              value={newChildName}
              onChange={(e) => setNewChildName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newChildName.trim()) {
                  const id = createWikiCategory(newChildName.trim(), [cat.id])
                  if (id) {
                    onSelect(id)
                    setCreatingUnder(null)
                    setNewChildName("")
                  }
                }
                if (e.key === "Escape") {
                  setCreatingUnder(null)
                  setNewChildName("")
                }
              }}
              onBlur={() => {
                setTimeout(() => {
                  setCreatingUnder(null)
                  setNewChildName("")
                }, 150)
              }}
              placeholder="New subcategory..."
              className="flex-1 bg-transparent text-2xs text-foreground outline-none placeholder:text-muted-foreground/30 border-b border-accent/30"
            />
          </div>
        )}

        {isExpanded &&
          (childrenOf.get(cat.id) ?? []).map((child) => renderNode(child, depth + 1))}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-border-subtle bg-popover shadow-xl",
        widthClass
      )}
    >
      <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-border-subtle">
        <MagnifyingGlass
          size={12}
          weight="regular"
          className="text-muted-foreground/40 shrink-0"
        />
        <input
          ref={searchRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search categories..."
          className="flex-1 bg-transparent text-2xs text-foreground outline-none placeholder:text-muted-foreground/30"
        />
      </div>

      <div className="max-h-52 overflow-y-auto p-1">
        {rootCategories.map((cat) => renderNode(cat, 0))}
        {rootCategories.length === 0 && !search.trim() && (
          <p className="px-2 py-2 text-2xs text-muted-foreground/40 text-center">
            No categories yet
          </p>
        )}

        {search.trim() &&
          !wikiCategories.some(
            (c) => c.name.toLowerCase() === search.trim().toLowerCase()
          ) && (
            <div className="border-t border-border-subtle p-1 mt-1">
              <button
                onClick={() => {
                  const id = createWikiCategory(search.trim())
                  if (id) {
                    onSelect(id)
                    setSearch("")
                  }
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-2xs text-accent transition-colors hover:bg-hover-bg"
              >
                <PhPlus size={10} /> Create &ldquo;{search.trim()}&rdquo; as root
              </button>
              {(() => {
                const expandedArr = Array.from(expanded)
                const lastExpanded =
                  expandedArr.length > 0 ? expandedArr[expandedArr.length - 1] : null
                const parentCat = lastExpanded
                  ? wikiCategories.find((c) => c.id === lastExpanded)
                  : null
                if (!parentCat) return null
                return (
                  <button
                    onClick={() => {
                      const id = createWikiCategory(search.trim(), [parentCat.id])
                      if (id) {
                        onSelect(id)
                        setSearch("")
                      }
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-2xs text-accent transition-colors hover:bg-hover-bg"
                  >
                    <PhPlus size={10} /> Create &ldquo;{search.trim()}&rdquo; under{" "}
                    {parentCat.name}
                  </button>
                )
              })()}
            </div>
          )}
      </div>
    </div>
  )
}
