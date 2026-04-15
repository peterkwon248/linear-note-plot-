"use client"

/**
 * InlineCategoryTags — wiki article 본문 위에 표시되는 카테고리 칩 + 트리 드롭다운.
 *
 * Phase 2-1B-3: 기존 `wiki-article-view.tsx`에서 분리. 통합 렌더러
 * (`wiki-article-renderer.tsx`)와 다른 호출 지점들이 여기서 import.
 */

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { usePlotStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight"
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass"

export function InlineCategoryTags({
  articleId,
  categoryIds,
  editable = true,
}: {
  articleId: string
  categoryIds: string[]
  editable?: boolean
}) {
  const wikiCategories = usePlotStore((s) => s.wikiCategories)
  const setArticleCategories = usePlotStore((s) => s.setArticleCategories)
  const createWikiCategory = usePlotStore((s) => s.createWikiCategory)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [creatingUnder, setCreatingUnder] = useState<string | null>(null)
  const [newChildName, setNewChildName] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const assignedSet = useMemo(() => new Set(categoryIds), [categoryIds])
  const assignedCategories = wikiCategories.filter((c) => assignedSet.has(c.id))

  // Build tree: root categories (no parent) with children
  const rootCategories = useMemo(
    () => wikiCategories.filter((c) => c.parentIds.length === 0),
    [wikiCategories],
  )

  const childrenOf = useMemo(() => {
    const map = new Map<string, typeof wikiCategories>()
    for (const cat of wikiCategories) {
      if (cat.parentIds.length > 0) {
        const parentId = cat.parentIds[0]
        if (!map.has(parentId)) map.set(parentId, [])
        map.get(parentId)!.push(cat)
      }
    }
    return map
  }, [wikiCategories])

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [dropdownOpen])

  useEffect(() => {
    if (dropdownOpen) setTimeout(() => searchRef.current?.focus(), 50)
  }, [dropdownOpen])

  const toggleAssign = (catId: string) => {
    if (assignedSet.has(catId)) {
      setArticleCategories(articleId, categoryIds.filter((id) => id !== catId))
    } else {
      setArticleCategories(articleId, [...categoryIds, catId])
    }
  }

  const toggleExpand = (catId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(catId)) next.delete(catId)
      else next.add(catId)
      return next
    })
  }

  // Filter tree by search
  const matchesSearch = useCallback(
    (cat: typeof wikiCategories[number]): boolean => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      if (cat.name.toLowerCase().includes(q)) return true
      const children = childrenOf.get(cat.id) ?? []
      return children.some((c) => matchesSearch(c))
    },
    [search, childrenOf],
  )

  // Render tree node recursively
  const renderNode = (cat: typeof wikiCategories[number], depth: number) => {
    if (!matchesSearch(cat)) return null
    const children = childrenOf.get(cat.id) ?? []
    const isExpanded = expanded.has(cat.id) || search.trim().length > 0 || creatingUnder === cat.id
    const isAssigned = assignedSet.has(cat.id)

    return (
      <div key={cat.id}>
        <div
          className="group/node flex items-center gap-1 rounded-md px-1.5 py-1 text-2xs transition-colors hover:bg-white/[0.06]"
          style={{ paddingLeft: depth * 16 + 6 }}
        >
          {/* Expand/collapse toggle */}
          {children.length > 0 ? (
            <button
              onClick={() => toggleExpand(cat.id)}
              className="shrink-0 p-0.5 text-muted-foreground/40 transition-colors hover:text-muted-foreground"
            >
              {isExpanded ? <CaretDown size={10} weight="bold" /> : <CaretRight size={10} weight="bold" />}
            </button>
          ) : (
            <span className="w-[18px]" />
          )}

          {/* Category name + check toggle */}
          <button
            onClick={() => toggleAssign(cat.id)}
            className="flex flex-1 items-center gap-1.5 truncate text-left text-foreground/80"
          >
            <span
              className={cn(
                "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition-colors",
                isAssigned ? "border-accent bg-accent" : "border-white/20 hover:border-white/40",
              )}
            >
              {isAssigned && <PhCheck size={9} weight="bold" className="text-white" />}
            </span>
            <span className="truncate">{cat.name}</span>
          </button>

          {/* [+] add child button (hover only) */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setCreatingUnder(cat.id)
              setExpanded((prev) => new Set([...prev, cat.id]))
            }}
            className="shrink-0 p-0.5 text-muted-foreground/40 opacity-0 transition-all hover:text-accent group-hover/node:opacity-100"
            title={`Add subcategory under ${cat.name}`}
          >
            <PhPlus size={9} weight="bold" />
          </button>
        </div>

        {/* Inline child creation input */}
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
                    toggleAssign(id)
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
              className="flex-1 border-b border-accent/30 bg-transparent text-2xs text-foreground outline-none placeholder:text-muted-foreground/30"
            />
          </div>
        )}

        {/* Children */}
        {isExpanded && (childrenOf.get(cat.id) ?? []).map((child) => renderNode(child, depth + 1))}
      </div>
    )
  }

  // Breadcrumb for hover tooltip
  const getBreadcrumb = useCallback(
    (cat: typeof wikiCategories[number]): string => {
      const parts: string[] = []
      let current = cat
      while (current.parentIds.length > 0) {
        const parent = wikiCategories.find((c) => c.id === current.parentIds[0])
        if (!parent) break
        parts.unshift(parent.name)
        current = parent
      }
      parts.push(cat.name)
      return parts.join(" > ")
    },
    [wikiCategories],
  )

  return (
    <div className="mb-5 flex min-h-[24px] flex-wrap items-center gap-1.5">
      {/* Display: flat names, hover tooltip shows full breadcrumb */}
      {assignedCategories.map((cat) => (
        <span
          key={cat.id}
          title={cat.parentIds.length > 0 ? getBreadcrumb(cat) : undefined}
          className="group inline-flex items-center gap-0.5 rounded-full border border-white/[0.08] bg-white/[0.06] px-2 py-0.5 text-2xs font-medium text-foreground/60 transition-colors hover:border-white/[0.14] hover:text-foreground/80"
        >
          {cat.name}
          {editable && (
            <button
              onClick={() => toggleAssign(cat.id)}
              className="ml-0.5 hidden rounded-full p-0 text-muted-foreground/40 transition-colors hover:text-foreground/70 group-hover:inline-flex"
            >
              <PhX size={9} weight="bold" />
            </button>
          )}
        </span>
      ))}

      {/* + Add with tree dropdown (edit mode only) */}
      {editable && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-white/[0.10] px-2 py-0.5 text-2xs text-white/40 transition-colors hover:border-white/[0.20] hover:text-white/60"
          >
            <PhPlus size={10} weight="regular" />
            Add
          </button>
          {dropdownOpen && (
            <div className="absolute left-0 top-full z-50 mt-1.5 w-64 rounded-lg border border-white/[0.08] bg-popover shadow-xl">
              {/* Search */}
              <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-2 py-1.5">
                <MagnifyingGlass size={12} weight="regular" className="shrink-0 text-muted-foreground/40" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setDropdownOpen(false)
                      setSearch("")
                    }
                  }}
                  placeholder="Search categories..."
                  className="flex-1 bg-transparent text-2xs text-foreground outline-none placeholder:text-muted-foreground/30"
                />
              </div>

              {/* Tree */}
              <div className="max-h-52 overflow-y-auto p-1">
                {rootCategories.map((cat) => renderNode(cat, 0))}
                {rootCategories.length === 0 && !search.trim() && (
                  <p className="px-2 py-2 text-center text-2xs text-muted-foreground/40">
                    No categories yet
                  </p>
                )}

                {/* Search = Create pattern */}
                {search.trim() &&
                  !wikiCategories.some(
                    (c) => c.name.toLowerCase() === search.trim().toLowerCase(),
                  ) && (
                    <div className="mt-1 border-t border-white/[0.06] p-1">
                      <button
                        onClick={() => {
                          const id = createWikiCategory(search.trim())
                          if (id) {
                            toggleAssign(id)
                            setSearch("")
                          }
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-2xs text-accent transition-colors hover:bg-white/[0.06]"
                      >
                        <PhPlus size={10} /> Create &ldquo;{search.trim()}&rdquo; as root
                      </button>
                      {/* Offer to create under last-expanded parent */}
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
                                toggleAssign(id)
                                setSearch("")
                              }
                            }}
                            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-2xs text-accent transition-colors hover:bg-white/[0.06]"
                          >
                            <PhPlus size={10} /> Create &ldquo;{search.trim()}&rdquo; under {parentCat.name}
                          </button>
                        )
                      })()}
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
