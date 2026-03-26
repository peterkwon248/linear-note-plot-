"use client"

import { useState, useRef, useMemo, useEffect, useCallback, Fragment } from "react"
import { usePlotStore } from "@/lib/store"
import type { WikiCategory, WikiArticle } from "@/lib/types"
import { WikiStatusBadge } from "./wiki-shared"
import { shortRelative } from "@/lib/format-utils"
import {
  DndContext,
  DragOverlay,
  useDroppable,
  useDraggable,
  PointerSensor,
  useSensors,
  useSensor,
} from "@dnd-kit/core"
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core"
import { FolderOpen } from "@phosphor-icons/react/dist/ssr/FolderOpen"
import { FolderSimple } from "@phosphor-icons/react/dist/ssr/FolderSimple"
import { SortAscending } from "@phosphor-icons/react/dist/ssr/SortAscending"
import { SortDescending } from "@phosphor-icons/react/dist/ssr/SortDescending"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr/ArrowLeft"
import { ArrowRight } from "@phosphor-icons/react/dist/ssr/ArrowRight"
import { ArrowsDownUp } from "@phosphor-icons/react/dist/ssr/ArrowsDownUp"
import { CursorClick } from "@phosphor-icons/react/dist/ssr/CursorClick"
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"
import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { pushUndo, popUndo } from "@/lib/undo-manager"
import { setActiveCategoryView } from "@/lib/wiki-view-mode"

/* ── Props ── */

type CategoryOrdering = "name" | "articles" | "updated" | "parent" | "tier" | "stubs" | "sub"

interface WikiCategoryPageProps {
  categoryId: string | null
  onOpenArticle: (articleId: string) => void
  onNavigateCategory: (categoryId: string) => void
  categoryViewMode?: "list" | "board"
  categoryOrdering?: CategoryOrdering
  categoryTierFilter?: string | null
  categoryStatusFilter?: string | null
  categoryShowDescription?: boolean
  categoryShowEmpty?: boolean
  categoryGrouping?: "none" | "tier" | "parent" | "family"
  categoryDisplayProps?: string[]
  categorySortDirection?: "asc" | "desc"
  onOrderingChange?: (ordering: CategoryOrdering) => void
  onSortDirectionChange?: (dir: "asc" | "desc") => void
}

/* ── Breadcrumb helpers ── */

function buildBreadcrumb(
  categoryId: string,
  categories: WikiCategory[]
): WikiCategory[] {
  const map = new Map(categories.map((c) => [c.id, c]))
  const path: WikiCategory[] = []
  const visited = new Set<string>()

  let current: WikiCategory | undefined = map.get(categoryId)
  while (current && !visited.has(current.id)) {
    path.unshift(current)
    visited.add(current.id)
    const parentId = current.parentIds[0]
    current = parentId ? map.get(parentId) : undefined
  }

  return path
}

/* ── Descendants helper (for cycle prevention) ── */

function getDescendantIds(
  categoryId: string,
  categories: WikiCategory[]
): Set<string> {
  const result = new Set<string>()
  const queue = [categoryId]
  while (queue.length > 0) {
    const id = queue.pop()!
    for (const cat of categories) {
      if (cat.parentIds.includes(id) && !result.has(cat.id)) {
        result.add(cat.id)
        queue.push(cat.id)
      }
    }
  }
  return result
}

/* ── Depth helper ── */

function getDepth(catId: string, categories: WikiCategory[], visited = new Set<string>()): number {
  if (visited.has(catId)) return 0
  visited.add(catId)
  const cat = categories.find(c => c.id === catId)
  if (!cat || cat.parentIds.length === 0) return 0
  return 1 + getDepth(cat.parentIds[0], categories, visited)
}

/* ── isDescendant helper ── */

function isDescendant(possibleDescendantId: string, ancestorId: string, allCats: WikiCategory[]): boolean {
  let current = allCats.find(c => c.id === possibleDescendantId)
  const visited = new Set<string>()
  while (current) {
    if (visited.has(current.id)) return false
    visited.add(current.id)
    if (current.id === ancestorId) return true
    const parentId = current.parentIds?.[0]
    if (!parentId) return false
    current = allCats.find(c => c.id === parentId)
  }
  return false
}

/* ── Max descendant depth helper (for tier limit validation) ── */

function getMaxDescendantDepth(catId: string, categories: WikiCategory[]): number {
  let maxDepth = 0
  const children = categories.filter(c => c.parentIds.includes(catId))
  for (const child of children) {
    const childDepth = 1 + getMaxDescendantDepth(child.id, categories)
    if (childDepth > maxDepth) maxDepth = childDepth
  }
  return maxDepth
}

/* ══════════════════════════════════════════════════════════
   BOARD VIEW: Tier-based columns with drag-and-drop
   ══════════════════════════════════════════════════════════ */

interface CategoryDataItem {
  cat: WikiCategory
  depth: number
  articleCount: number
  stubCount: number
  childCount: number
}

/* ── Board Card (draggable + droppable) ── */

function CategoryBoardCard({
  item,
  onSelect,
  showDescription,
  isSelected,
  onDoubleClick,
}: {
  item: CategoryDataItem
  onSelect: (id: string, e?: React.MouseEvent) => void
  showDescription?: boolean
  isSelected?: boolean
  onDoubleClick?: (id: string) => void
}) {
  const { cat, articleCount, stubCount, childCount } = item
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: cat.id })
  const { setNodeRef: dropRef, isOver } = useDroppable({ id: `card-${cat.id}` })

  const mergedRef = (el: HTMLElement | null) => {
    setNodeRef(el)
    dropRef(el)
  }

  return (
    <div
      ref={mergedRef}
      {...attributes}
      {...listeners}
      onClick={(e) => { e.stopPropagation(); !isDragging && onSelect(cat.id, e) }}
      onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick?.(cat.id) }}
      className={cn(
        "group relative rounded-lg border border-border/50 bg-card p-3 transition-all select-none",
        isDragging ? "opacity-20 cursor-grabbing" : "cursor-grab",
        isOver && !isDragging && "ring-2 ring-accent border-accent/50 bg-accent/5",
        isSelected && !isDragging && !isOver && "border-accent/50 bg-accent/5 ring-1 ring-accent/20"
      )}
      style={{ touchAction: "none" }}
    >
      {/* Selection checkbox */}
      <div
        className={cn(
          "absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded border transition-all cursor-pointer z-10",
          isSelected
            ? "bg-accent border-accent"
            : "border-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:border-muted-foreground/50 bg-background"
        )}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(cat.id, { ...e, ctrlKey: true } as React.MouseEvent)
        }}
      >
        {isSelected && <PhCheck className="text-accent-foreground" size={10} weight="bold" />}
      </div>
      {/* Title row */}
      <div className="flex items-center gap-2">
        <FolderSimple size={14} weight="regular" className="text-muted-foreground/60 shrink-0" />
        <span className="text-sm font-medium text-foreground truncate">{cat.name}</span>
      </div>
      {/* Description */}
      {showDescription && cat.description && (
        <p className="text-xs text-muted-foreground/50 mt-1 line-clamp-1">{cat.description}</p>
      )}
      {/* Stats row */}
      {(articleCount > 0 || stubCount > 0 || childCount > 0) && (
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground/50">
          {articleCount > 0 && <span className="text-green-400">{articleCount} article{articleCount > 1 ? "s" : ""}</span>}
          {stubCount > 0 && <span className="text-orange-400">{stubCount} stub{stubCount > 1 ? "s" : ""}</span>}
          {childCount > 0 && <span>{childCount} sub</span>}
        </div>
      )}
    </div>
  )
}

/* ── Board Card Overlay (for drag preview) ── */

function CategoryBoardCardOverlay({ cat }: { cat: WikiCategory }) {
  return (
    <div className="rounded-lg border border-accent/50 bg-card p-3 shadow-lg w-[236px] opacity-90">
      <div className="flex items-center gap-2">
        <FolderSimple size={14} weight="regular" className="text-muted-foreground/60 shrink-0" />
        <span className="text-sm font-medium text-foreground truncate">{cat.name}</span>
      </div>
    </div>
  )
}

/* ── Board Column (droppable tier) ── */

function CategoryBoardColumn({
  columnKey,
  label,
  items,
  onSelect,
  showDescription,
  activeDragId,
  isRootColumn,
  selectedIds,
  onDoubleClick,
}: {
  columnKey: string
  label: string
  items: CategoryDataItem[]
  onSelect: (id: string, e?: React.MouseEvent) => void
  showDescription?: boolean
  activeDragId?: string | null
  isRootColumn?: boolean
  selectedIds?: Set<string>
  onDoubleClick?: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnKey })
  const isDragging = !!activeDragId

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col w-[260px] shrink-0 rounded-lg",
        isOver && "ring-1 ring-accent/30 bg-accent/5"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-foreground/80">
        <span>{label}</span>
        <span className="text-xs text-muted-foreground/50 tabular-nums">{items.length}</span>
        {isRootColumn && isDragging && (
          <span className="ml-auto text-xs text-accent/70 font-normal animate-pulse">
            Drop to make root
          </span>
        )}
      </div>
      {/* Cards */}
      <div className="flex flex-col gap-1.5 px-1.5 pb-2 overflow-y-auto max-h-[calc(100vh-200px)]">
        {items.map(item => (
          <CategoryBoardCard key={item.cat.id} item={item} onSelect={onSelect} showDescription={showDescription} isSelected={selectedIds?.has(item.cat.id)} onDoubleClick={onDoubleClick} />
        ))}
        {items.length === 0 && (
          <div className="text-xs text-muted-foreground/40 text-center py-8">No categories</div>
        )}
      </div>
    </div>
  )
}

/* ── Board View ── */

function CategoryBoardView({
  categories,
  articles,
  ordering,
  sortDirection = "asc",
  onSelect,
  showDescription,
  showEmpty,
  grouping = "tier",
  selectedIds,
  onDoubleClick,
}: {
  categories: WikiCategory[]
  articles: WikiArticle[]
  ordering: string
  sortDirection?: "asc" | "desc"
  onSelect: (id: string, e?: React.MouseEvent) => void
  showDescription?: boolean
  showEmpty?: boolean
  grouping?: "none" | "tier" | "parent" | "family"
  selectedIds?: Set<string>
  onDoubleClick?: (id: string) => void
}) {
  const updateWikiCategory = usePlotStore((s) => s.updateWikiCategory)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const [activeDragId, setActiveDragId] = useState<string | null>(null)

  // Compute enriched data for each category
  const categoryData = useMemo(() => {
    return categories.map(cat => {
      const depth = getDepth(cat.id, categories)
      const catArticles = articles.filter(a => a.categoryIds?.includes(cat.id))
      const articleCount = catArticles.filter(a => a.wikiStatus === "article").length
      const stubCount = catArticles.filter(a => a.wikiStatus === "stub").length
      const childCount = categories.filter(c => c.parentIds.includes(cat.id)).length
      return { cat, depth, articleCount, stubCount, childCount }
    })
  }, [categories, articles])

  // Sort helper
  const sortItems = useCallback((items: CategoryDataItem[]) => {
    const dir = sortDirection === "desc" ? -1 : 1
    return [...items].sort((a, b) => {
      if (ordering === "articles") return dir * (b.articleCount - a.articleCount)
      if (ordering === "updated") return dir * (new Date(b.cat.updatedAt ?? b.cat.createdAt).getTime() - new Date(a.cat.updatedAt ?? a.cat.createdAt).getTime())
      return dir * a.cat.name.localeCompare(b.cat.name)
    })
  }, [ordering, sortDirection])

  // Group into board columns
  const boardColumns = useMemo((): { key: string; label: string; items: CategoryDataItem[]; isRoot?: boolean }[] => {
    const effectiveGrouping = (!grouping || grouping === "none") ? "tier" : grouping

    if (effectiveGrouping === "tier") {
      const tiers: Record<string, CategoryDataItem[]> = { "0": [], "1": [], "2+": [] }
      for (const item of categoryData) {
        const d = item.depth
        const key = d >= 2 ? "2+" : String(d)
        tiers[key].push(item)
      }
      return [
        { key: "tier-0", label: "1st tier", items: sortItems(tiers["0"]), isRoot: true },
        { key: "tier-1", label: "2nd tier", items: sortItems(tiers["1"]), isRoot: false },
        { key: "tier-2+", label: "3rd+ tier", items: sortItems(tiers["2+"]), isRoot: false },
      ]
    }

    if (effectiveGrouping === "parent") {
      const groups: Record<string, CategoryDataItem[]> = {}
      for (const item of categoryData) {
        const parentId = item.cat.parentIds?.[0]
        const key = parentId ?? "_root"
        if (!groups[key]) groups[key] = []
        groups[key].push(item)
      }
      const columns: { key: string; label: string; items: CategoryDataItem[]; isRoot?: boolean }[] = []
      // Root items first
      if (groups["_root"]) {
        columns.push({ key: "parent-_root", label: "Root", items: sortItems(groups["_root"]), isRoot: true })
      }
      // Each parent with children
      for (const [parentId, items] of Object.entries(groups)) {
        if (parentId === "_root") continue
        const parent = categories.find(c => c.id === parentId)
        columns.push({ key: `parent-${parentId}`, label: parent?.name ?? "Unknown", items: sortItems(items) })
      }
      return columns
    }

    if (effectiveGrouping === "family") {
      function getRootAncestor(cat: WikiCategory): WikiCategory {
        let current = cat
        const visited = new Set<string>()
        while (current.parentIds?.[0] && !visited.has(current.id)) {
          visited.add(current.id)
          const parent = categories.find(c => c.id === current.parentIds![0])
          if (!parent) break
          current = parent
        }
        return current
      }
      const familyGroups: Record<string, { root: WikiCategory; items: CategoryDataItem[] }> = {}
      for (const item of categoryData) {
        const root = getRootAncestor(item.cat)
        if (!familyGroups[root.id]) familyGroups[root.id] = { root, items: [] }
        familyGroups[root.id].items.push(item)
      }
      return Object.values(familyGroups)
        .sort((a, b) => a.root.name.localeCompare(b.root.name))
        .map(({ root, items }) => ({
          key: `family-${root.id}`,
          label: root.name,
          items: sortItems(items).sort((a, b) => a.depth - b.depth || a.cat.name.localeCompare(b.cat.name)),
          isRoot: !root.parentIds?.[0],
        }))
    }

    return []
  }, [categoryData, grouping, ordering, sortDirection, showEmpty, categories, sortItems])

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null)
    const { active, over } = event
    if (!over) return

    const draggedId = active.id as string
    const overId = over.id as string

    // Prevent dropping on self
    if (draggedId === overId || draggedId === overId.replace("card-", "")) return

    // Check if dropping on a card (make child of that card)
    if (overId.startsWith("card-")) {
      const targetId = overId.replace("card-", "")
      // Prevent circular reference
      if (isDescendant(targetId, draggedId, categories)) return
      // Update parentIds
      updateWikiCategory(draggedId, { parentIds: [targetId] })
      return
    }

    // Dropping on a tier column
    if (overId.startsWith("tier-")) {
      const tierKey = overId.replace("tier-", "")
      if (tierKey === "0") {
        // Make root
        updateWikiCategory(draggedId, { parentIds: [] })
      }
      // For tier-1, tier-2+: keep existing parent (actual reparenting requires card-on-card drop)
      return
    }

    // Dropping on a parent-grouped column
    if (overId.startsWith("parent-")) {
      const parentKey = overId.replace("parent-", "")
      if (parentKey === "_root") {
        updateWikiCategory(draggedId, { parentIds: [] })
      } else {
        // Prevent circular reference
        if (isDescendant(parentKey, draggedId, categories)) return
        updateWikiCategory(draggedId, { parentIds: [parentKey] })
      }
      return
    }

    // Dropping on a family column — set parent to the root of that family
    if (overId.startsWith("family-")) {
      const rootId = overId.replace("family-", "")
      if (rootId === draggedId) return
      if (isDescendant(rootId, draggedId, categories)) return
      updateWikiCategory(draggedId, { parentIds: [rootId] })
      return
    }
  }

  const draggedCategory = activeDragId
    ? categories.find(c => c.id === activeDragId)
    : null

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 p-4 overflow-x-auto h-full">
        {boardColumns.map(col => (
          <CategoryBoardColumn
            key={col.key}
            columnKey={col.key}
            label={col.label}
            items={col.items}
            onSelect={onSelect}
            showDescription={showDescription}
            activeDragId={activeDragId}
            isRootColumn={col.isRoot}
            selectedIds={selectedIds}
            onDoubleClick={onDoubleClick}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {draggedCategory ? <CategoryBoardCardOverlay cat={draggedCategory} /> : null}
      </DragOverlay>
    </DndContext>
  )
}

/* ══════════════════════════════════════════════════════════
   FULL LIST VIEW (List mode — no sidebar tree)
   ══════════════════════════════════════════════════════════ */

function CategoryFullListView({
  categories,
  articles,
  selectedId,
  onSelect,
  onOpenArticle,
  ordering,
  sortDirection = "asc",
  tierFilter,
  statusFilter,
  showDescription = true,
  showEmpty = true,
  grouping,
  displayProps,
  onOrderingChange,
  onSortDirectionChange,
  onDoubleClick,
}: {
  categories: WikiCategory[]
  articles: WikiArticle[]
  selectedId: string | null
  onSelect: (id: string, e?: React.MouseEvent) => void
  onOpenArticle: (articleId: string) => void
  ordering?: CategoryOrdering
  sortDirection?: "asc" | "desc"
  tierFilter?: string | null
  statusFilter?: string | null
  showDescription?: boolean
  showEmpty?: boolean
  grouping?: "none" | "tier" | "parent" | "family"
  displayProps?: string[]
  onOrderingChange?: (ordering: CategoryOrdering) => void
  onSortDirectionChange?: (dir: "asc" | "desc") => void
  onDoubleClick?: (id: string) => void
}) {
  const showCol = (key: string) => !displayProps || displayProps.includes(key)
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const getDepthLocal = useCallback(
    (catId: string, visited = new Set<string>()): number => {
      if (visited.has(catId)) return 0
      visited.add(catId)
      const cat = catMap.get(catId)
      if (!cat || cat.parentIds.length === 0) return 0
      return 1 + getDepthLocal(cat.parentIds[0], visited)
    },
    [catMap]
  )

  const categoryData = useMemo(() => {
    const data = categories.map((cat) => {
      const depth = getDepthLocal(cat.id)
      const catArticles = articles.filter((a) =>
        a.categoryIds?.includes(cat.id)
      )
      const articleCount = catArticles.filter(
        (a) => a.wikiStatus === "article"
      ).length
      const stubCount = catArticles.filter(
        (a) => a.wikiStatus === "stub"
      ).length
      const childCount = categories.filter((c) =>
        c.parentIds.includes(cat.id)
      ).length
      const parentName = cat.parentIds.length > 0 ? catMap.get(cat.parentIds[0])?.name ?? null : null
      return { cat, depth, articleCount, stubCount, childCount, catArticles, parentName }
    })

    // Apply tier filter
    let filtered = data
    if (tierFilter === "1st") filtered = filtered.filter((d) => d.depth === 0)
    else if (tierFilter === "2nd") filtered = filtered.filter((d) => d.depth === 1)
    else if (tierFilter === "3rd+") filtered = filtered.filter((d) => d.depth >= 2)

    // Apply status filter
    if (statusFilter === "has-articles") filtered = filtered.filter((d) => d.articleCount > 0)
    else if (statusFilter === "has-stubs") filtered = filtered.filter((d) => d.stubCount > 0)
    else if (statusFilter === "empty") filtered = filtered.filter((d) => d.articleCount === 0 && d.stubCount === 0)

    // Apply showEmpty toggle
    if (!showEmpty) filtered = filtered.filter((d) => d.articleCount > 0 || d.stubCount > 0)

    // Apply ordering
    const ord = ordering ?? "name"
    const dir = sortDirection === "desc" ? -1 : 1
    if (ord === "name") {
      filtered.sort((a, b) => dir * a.cat.name.localeCompare(b.cat.name))
    } else if (ord === "articles") {
      filtered.sort((a, b) => dir * (b.articleCount - a.articleCount) || a.cat.name.localeCompare(b.cat.name))
    } else if (ord === "updated") {
      filtered.sort((a, b) => {
        const aTime = a.cat.updatedAt ? new Date(a.cat.updatedAt).getTime() : 0
        const bTime = (b.cat as any).updatedAt ? new Date((b.cat as any).updatedAt).getTime() : 0
        return dir * (bTime - aTime) || a.cat.name.localeCompare(b.cat.name)
      })
    } else if (ord === "parent") {
      filtered.sort((a, b) => dir * (a.parentName ?? "").localeCompare(b.parentName ?? "") || a.cat.name.localeCompare(b.cat.name))
    } else if (ord === "tier") {
      filtered.sort((a, b) => dir * (a.depth - b.depth) || a.cat.name.localeCompare(b.cat.name))
    } else if (ord === "stubs") {
      filtered.sort((a, b) => dir * (b.stubCount - a.stubCount) || a.cat.name.localeCompare(b.cat.name))
    } else if (ord === "sub") {
      filtered.sort((a, b) => dir * (b.childCount - a.childCount) || a.cat.name.localeCompare(b.cat.name))
    }

    return filtered
  }, [categories, articles, getDepthLocal, catMap, tierFilter, statusFilter, ordering, sortDirection, showEmpty])

  const grouped = useMemo(() => {
    if (!grouping || grouping === "none") return [{ key: "_all", label: "", items: categoryData }]

    if (grouping === "tier") {
      const groups: Record<string, typeof categoryData> = {}
      for (const item of categoryData) {
        const depth = item.depth
        const key = `tier-${depth}`
        if (!groups[key]) groups[key] = []
        groups[key].push(item)
      }
      return Object.entries(groups)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, items]) => {
          const depth = parseInt(key.replace("tier-", ""))
          const label = depth === 0 ? "1st tier" : depth === 1 ? "2nd tier" : depth === 2 ? "3rd tier" : `${depth + 1}th tier`
          return { key, label, items }
        })
    }

    if (grouping === "parent") {
      const groups: Record<string, typeof categoryData> = {}
      for (const item of categoryData) {
        const parentId = item.cat.parentIds?.[0]
        const key = parentId ?? "_root"
        if (!groups[key]) groups[key] = []
        groups[key].push(item)
      }
      return Object.entries(groups).map(([key, items]) => {
        const parent = categories.find((c) => c.id === key)
        return { key, label: parent?.name ?? "Root", items }
      })
    }

    if (grouping === "family") {
      function getRootAncestor(cat: WikiCategory): WikiCategory {
        let current = cat
        const visited = new Set<string>()
        while (current.parentIds?.[0] && !visited.has(current.id)) {
          visited.add(current.id)
          const parent = categories.find((c) => c.id === current.parentIds![0])
          if (!parent) break
          current = parent
        }
        return current
      }

      const familyGroups: Record<string, { root: WikiCategory; members: Array<{ item: typeof categoryData[number]; depth: number }> }> = {}

      for (const item of categoryData) {
        const root = getRootAncestor(item.cat)
        if (!familyGroups[root.id]) {
          familyGroups[root.id] = { root, members: [] }
        }
        familyGroups[root.id].members.push({ item, depth: getDepthLocal(item.cat.id) })
      }

      return Object.values(familyGroups)
        .sort((a, b) => a.root.name.localeCompare(b.root.name))
        .map(({ root, members }) => {
          const sorted = members
            .sort((a, b) => a.depth - b.depth || a.item.cat.name.localeCompare(b.item.cat.name))
          return {
            key: `family-${root.id}`,
            label: root.name,
            items: sorted.map((m) => m.item),
            depthMap: Object.fromEntries(sorted.map((m) => [m.item.cat.id, m.depth])),
          }
        })
    }

    return [{ key: "_all", label: "", items: categoryData }]
  }, [categoryData, grouping, categories, getDepthLocal])

  const [expandedCatId, setExpandedCatId] = useState<string | null>(null)

  // Reset expansion when selection is cleared
  useEffect(() => {
    if (selectedId === null) setExpandedCatId(null)
  }, [selectedId])

  const tierLabel = (depth: number) => {
    if (depth === 0) return "1st"
    if (depth === 1) return "2nd"
    if (depth === 2) return "3rd"
    return `${depth + 1}th`
  }

  const tierClass = (depth: number) => {
    if (depth === 0) return "bg-accent/10 text-accent"
    if (depth === 1) return "bg-chart-3/10 text-chart-3"
    return "bg-muted-foreground/10 text-muted-foreground"
  }

  function handleSortClick(col: CategoryOrdering) {
    if (ordering === col) {
      onSortDirectionChange?.(sortDirection === "asc" ? "desc" : "asc")
    } else {
      onOrderingChange?.(col)
      onSortDirectionChange?.("asc")
    }
  }

  function SortIcon({ col }: { col: CategoryOrdering }) {
    if (ordering !== col) {
      return <ArrowsDownUp size={10} weight="regular" className="opacity-0 group-hover/th:opacity-50 transition-opacity" />
    }
    return sortDirection === "asc"
      ? <SortAscending size={10} weight="regular" className="text-accent" />
      : <SortDescending size={10} weight="regular" className="text-accent" />
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header row */}
      <div className="sticky top-0 z-10 flex items-center border-b border-border/50 bg-background px-5 py-2.5">
        <div className="flex-1">
          <button
            onClick={() => handleSortClick("name")}
            className="group/th inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Name
            <SortIcon col="name" />
          </button>
        </div>
        {showCol("parent") && (
          <div className="w-[140px]">
            <button
              onClick={() => handleSortClick("parent")}
              className="group/th inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Parent
              <SortIcon col="parent" />
            </button>
          </div>
        )}
        {showCol("tier") && (
          <div className="w-[60px] flex justify-center">
            <button
              onClick={() => handleSortClick("tier")}
              className="group/th inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Tier
              <SortIcon col="tier" />
            </button>
          </div>
        )}
        {showCol("articles") && (
          <div className="w-[72px] flex justify-end">
            <button
              onClick={() => handleSortClick("articles")}
              className="group/th inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Articles
              <SortIcon col="articles" />
            </button>
          </div>
        )}
        {showCol("stubs") && (
          <div className="w-[72px] flex justify-end">
            <button
              onClick={() => handleSortClick("stubs")}
              className="group/th inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Stubs
              <SortIcon col="stubs" />
            </button>
          </div>
        )}
        {showCol("sub") && (
          <div className="w-[56px] flex justify-end">
            <button
              onClick={() => handleSortClick("sub")}
              className="group/th inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Sub
              <SortIcon col="sub" />
            </button>
          </div>
        )}
        {showCol("updated") && (
          <div className="w-[80px] flex justify-end">
            <button
              onClick={() => handleSortClick("updated")}
              className="group/th inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Updated
              <SortIcon col="updated" />
            </button>
          </div>
        )}
      </div>

      {/* Category rows */}
      {grouped.map((group) => (
        <Fragment key={group.key}>
          {group.label && (
            <div className="flex items-center gap-2.5 px-5 py-2 mt-3 mb-0.5">
              <span className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wide">{group.label}</span>
              <span className="text-xs text-muted-foreground/40 tabular-nums">{group.items.length}</span>
            </div>
          )}
          {group.items.map(
            ({ cat, depth, articleCount, stubCount, childCount, catArticles, parentName }) => {
              const familyDepth = (group as any).depthMap?.[cat.id] ?? 0
              return (
              <div key={cat.id} style={grouping === "family" ? { paddingLeft: `${familyDepth * 24}px` } : undefined}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelect(cat.id, e)
                    setExpandedCatId((prev) =>
                      prev === cat.id ? null : cat.id
                    )
                  }}
                  onDoubleClick={() => onDoubleClick?.(cat.id)}
                  className={`flex w-full items-center px-5 py-3 text-left transition-colors hover:bg-secondary/30 ${
                    selectedId === cat.id ? "bg-secondary/40" : ""
                  }`}
                >
                  <div className="flex flex-1 items-center gap-2.5 min-w-0">
                    <FolderSimple
                      size={16}
                      weight="duotone"
                      className={
                        selectedId === cat.id
                          ? "shrink-0 text-accent/70"
                          : "shrink-0 text-muted-foreground/40"
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-note font-medium text-foreground/80 truncate block">
                        {cat.name}
                      </span>
                      {showDescription && cat.description && (
                        <span className="text-xs text-muted-foreground/40 truncate block mt-0.5">
                          {cat.description}
                        </span>
                      )}
                    </div>
                  </div>
                  {showCol("parent") && (
                    <span className="w-[140px] text-note truncate text-muted-foreground/50">
                      {parentName ?? "\u2014"}
                    </span>
                  )}
                  {showCol("tier") && (
                    <span className="w-[60px] flex justify-center">
                      <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-2xs font-medium ${tierClass(depth)}`}>
                        {tierLabel(depth)}
                      </span>
                    </span>
                  )}
                  {showCol("articles") && (
                    <span className="w-[72px] text-right text-note tabular-nums text-wiki-complete/70">
                      {articleCount > 0 ? articleCount : "\u2014"}
                    </span>
                  )}
                  {showCol("stubs") && (
                    <span className="w-[72px] text-right text-note tabular-nums text-chart-3/70">
                      {stubCount > 0 ? stubCount : "\u2014"}
                    </span>
                  )}
                  {showCol("sub") && (
                    <span className="w-[56px] text-right text-note tabular-nums text-muted-foreground/40">
                      {childCount > 0 ? childCount : "\u2014"}
                    </span>
                  )}
                  {showCol("updated") && (
                    <span className="w-[80px] text-right text-note tabular-nums text-muted-foreground/40">
                      {cat.updatedAt ? shortRelative(cat.updatedAt) : "\u2014"}
                    </span>
                  )}
                </button>

                {/* Expanded: show articles in this category */}
                {expandedCatId === cat.id && catArticles.length > 0 && (
                  <div className="border-b border-border/30 bg-secondary/10 px-5 py-1.5">
                    {catArticles.map((article) => (
                      <button
                        key={article.id}
                        onClick={() => onOpenArticle(article.id)}
                        className="flex w-full items-center gap-2.5 rounded-md px-4 py-2 text-left text-note text-foreground/60 transition-colors hover:bg-secondary/30 hover:text-foreground/80"
                      >
                        <WikiStatusBadge status={article.wikiStatus} />
                        <span className="truncate">
                          {article.title}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </Fragment>
      ))}

      {categoryData.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <FolderSimple
            size={32}
            weight="thin"
            className="text-muted-foreground/20"
          />
          <p className="text-sm text-muted-foreground/40">No categories yet</p>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   CATEGORY EDITOR (Split-view detail panel)
   ══════════════════════════════════════════════════════════ */

function CategoryEditor({
  categoryId,
  categories,
  articles,
  onNavigateCategory,
  onOpenArticle,
  onClose,
}: {
  categoryId: string
  categories: WikiCategory[]
  articles: WikiArticle[]
  onNavigateCategory: (id: string) => void
  onOpenArticle: (articleId: string) => void
  onClose: () => void
}) {
  const updateWikiCategory = usePlotStore((s) => s.updateWikiCategory)
  const deleteWikiCategory = usePlotStore((s) => s.deleteWikiCategory)
  const createWikiCategory = usePlotStore((s) => s.createWikiCategory)

  const categoryMaybe = categories.find((c) => c.id === categoryId)
  if (!categoryMaybe) return null
  const category: WikiCategory = categoryMaybe

  const depth = getDepth(category.id, categories)
  const tierLabel =
    depth === 0
      ? "1st tier"
      : depth === 1
        ? "2nd tier"
        : depth === 2
          ? "3rd tier"
          : `${depth + 1}th tier`

  const parentCat =
    category.parentIds.length > 0
      ? categories.find((c) => c.id === category.parentIds[0])
      : null

  const subcategories = categories.filter((c) =>
    c.parentIds.includes(category.id)
  )
  const catArticles = articles.filter((a) =>
    a.categoryIds?.includes(category.id)
  )

  // All categories NOT in this category's subtree (to prevent circular refs)
  const getDescendantIds = (id: string): Set<string> => {
    const ids = new Set<string>()
    const queue = [id]
    while (queue.length > 0) {
      const current = queue.pop()!
      ids.add(current)
      for (const c of categories) {
        if (c.parentIds.includes(current) && !ids.has(c.id)) {
          queue.push(c.id)
        }
      }
    }
    return ids
  }
  const descendantIds = getDescendantIds(categoryId)
  const adoptableCats = categories.filter(
    (c) => !descendantIds.has(c.id) && !c.parentIds.includes(categoryId)
  )

  const [nameValue, setNameValue] = useState(category.name)
  const [descValue, setDescValue] = useState(category.description ?? "")
  const [newSubName, setNewSubName] = useState("")
  const [showNewSub, setShowNewSub] = useState(false)
  const [showAdoptPicker, setShowAdoptPicker] = useState(false)

  // Sync local state when categoryId changes
  useEffect(() => {
    setNameValue(category.name)
    setDescValue(category.description ?? "")
  }, [category.name, category.description, categoryId])

  function commitName() {
    const trimmed = nameValue.trim()
    if (trimmed && trimmed !== category.name) {
      updateWikiCategory(categoryId, { name: trimmed })
    } else {
      setNameValue(category.name)
    }
  }

  function commitDescription() {
    const trimmed = descValue.trim()
    if (trimmed !== (category.description ?? "")) {
      updateWikiCategory(categoryId, { description: trimmed || undefined })
    }
  }

  function handleDelete() {
    // Snapshot for undo
    const snapshot: WikiCategory = { ...category }
    const orphanedParentRefs: { catId: string; parentId: string }[] = []
    for (const c of categories) {
      for (const pid of c.parentIds) {
        if (pid === categoryId) {
          orphanedParentRefs.push({ catId: c.id, parentId: pid })
        }
      }
    }
    const articleCatRefs: { articleId: string; categoryId: string }[] = []
    for (const a of articles) {
      for (const cid of a.categoryIds ?? []) {
        if (cid === categoryId) {
          articleCatRefs.push({ articleId: a.id, categoryId: cid })
        }
      }
    }

    deleteWikiCategory(categoryId)
    onClose()

    pushUndo(
      `Delete category "${snapshot.name}"`,
      () => {
        const { wikiCategories: currentCats } = usePlotStore.getState()
        usePlotStore.setState({ wikiCategories: [...currentCats, snapshot] })
        if (orphanedParentRefs.length > 0) {
          const updated = usePlotStore.getState().wikiCategories.map((c) => {
            const refs = orphanedParentRefs.filter((r) => r.catId === c.id)
            if (refs.length === 0) return c
            const restoredParentIds = [
              ...new Set([...c.parentIds, ...refs.map((r) => r.parentId)]),
            ]
            return { ...c, parentIds: restoredParentIds }
          })
          usePlotStore.setState({ wikiCategories: updated })
        }
        if (articleCatRefs.length > 0) {
          const updatedArts = usePlotStore.getState().wikiArticles.map((a) => {
            const refs = articleCatRefs.filter((r) => r.articleId === a.id)
            if (refs.length === 0) return a
            const restoredCatIds = [
              ...new Set([
                ...(a.categoryIds ?? []),
                ...refs.map((r) => r.categoryId),
              ]),
            ]
            return { ...a, categoryIds: restoredCatIds }
          })
          usePlotStore.setState({ wikiArticles: updatedArts })
        }
        toast.success(`Restored "${snapshot.name}"`)
      },
      () => {
        usePlotStore.getState().deleteWikiCategory(snapshot.id)
      }
    )

    toast.success(`Deleted "${snapshot.name}"`, {
      action: { label: "Undo", onClick: () => popUndo() },
    })
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-5 pb-2">
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ArrowLeft size={16} weight="regular" />
        </button>
      </div>

      {/* Name */}
      <div className="px-6 pt-2 pb-1">
        <input
          type="text"
          value={nameValue}
          onChange={(e) => setNameValue(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur()
            }
          }}
          className="w-full bg-transparent text-xl font-semibold text-foreground placeholder:text-muted-foreground/30 border-none outline-none rounded-md px-1 -ml-1 hover:bg-secondary/30 focus:bg-secondary/30 focus:ring-1 focus:ring-accent/30 transition-colors"
          placeholder="Category name"
        />
      </div>

      {/* Description */}
      <div className="px-6 pb-4">
        <textarea
          value={descValue}
          onChange={(e) => setDescValue(e.target.value)}
          onBlur={commitDescription}
          placeholder="Add a description..."
          rows={2}
          className="w-full resize-none bg-transparent text-sm text-muted-foreground placeholder:text-muted-foreground/30 border-none outline-none rounded-md px-1 -ml-1 hover:bg-secondary/30 focus:bg-secondary/30 focus:ring-1 focus:ring-accent/30 transition-colors"
        />
      </div>

      {/* Info card */}
      <div className="mx-6 rounded-lg border border-border bg-background p-3 space-y-2.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground/70">Tier</span>
          <span className="text-foreground font-medium">{tierLabel}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground/70">Parent</span>
          <select
            value={category.parentIds[0] ?? ""}
            onChange={(e) => {
              const newParentId = e.target.value
              updateWikiCategory(categoryId, {
                parentIds: newParentId ? [newParentId] : [],
              })
            }}
            className="bg-transparent text-foreground font-medium text-right border-none outline-none cursor-pointer rounded-md px-1 hover:bg-secondary/30 focus:bg-secondary/30 focus:ring-1 focus:ring-accent/30 transition-colors text-sm"
          >
            <option value="">None (root)</option>
            {categories
              .filter((c) => c.id !== categoryId)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground/70">Created</span>
          <span className="text-foreground tabular-nums">
            {shortRelative(category.createdAt)} ago
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground/70">Updated</span>
          <span className="text-foreground tabular-nums">
            {shortRelative(category.updatedAt ?? category.createdAt)} ago
          </span>
        </div>
      </div>

      {/* Parent chain (ancestors) — only for 2nd+ tier */}
      {category.parentIds.length > 0 && (() => {
        const ancestors = buildBreadcrumb(categoryId, categories).slice(0, -1) // exclude self
        if (ancestors.length === 0) return null
        return (
          <div className="px-6 pt-5">
            <h4 className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wide mb-2">
              Parent categories ({ancestors.length})
            </h4>
            <div className="space-y-0.5">
              {ancestors.map((anc, i) => (
                <button
                  key={anc.id}
                  onClick={() => onNavigateCategory(anc.id)}
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-secondary/30"
                  style={{ paddingLeft: `${12 + i * 12}px` }}
                >
                  <FolderOpen
                    size={14}
                    weight="regular"
                    className="text-accent/50 shrink-0"
                  />
                  <span className="flex-1 truncate text-left">{anc.name}</span>
                  <span className="text-xs text-muted-foreground/40 shrink-0">
                    {getDepth(anc.id, categories) === 0 ? "root" : `${getDepth(anc.id, categories) + 1}th`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Subcategories */}
      <div className="px-6 pt-5">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wide">
            Subcategories ({subcategories.length})
          </h4>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowAdoptPicker(!showAdoptPicker)}
              className="rounded-md px-1.5 py-0.5 text-xs text-muted-foreground/60 transition-colors hover:bg-secondary/30 hover:text-foreground"
              title="Add existing category as subcategory"
            >
              Move here
            </button>
            <button
              onClick={() => setShowNewSub(true)}
              className="flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground/60 transition-colors hover:bg-secondary/30 hover:text-foreground"
              title="Create new subcategory"
            >
              <PhPlus size={10} weight="bold" />
              New
            </button>
          </div>
        </div>

        {/* Inline new subcategory input */}
        {showNewSub && (
          <div className="flex items-center gap-2 px-3 py-1.5 mb-1">
            <FolderSimple size={14} weight="regular" className="text-accent/60 shrink-0" />
            <input
              autoFocus
              type="text"
              value={newSubName}
              onChange={(e) => setNewSubName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newSubName.trim()) {
                  createWikiCategory(newSubName.trim(), [categoryId])
                  setNewSubName("")
                  setShowNewSub(false)
                  toast.success(`Created "${newSubName.trim()}"`)
                }
                if (e.key === "Escape") {
                  setNewSubName("")
                  setShowNewSub(false)
                }
              }}
              onBlur={() => {
                if (newSubName.trim()) {
                  createWikiCategory(newSubName.trim(), [categoryId])
                  toast.success(`Created "${newSubName.trim()}"`)
                }
                setNewSubName("")
                setShowNewSub(false)
              }}
              placeholder="Subcategory name..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/30 border-none outline-none"
            />
          </div>
        )}

        {/* Adopt existing category picker */}
        {showAdoptPicker && (
          <div className="mb-2 rounded-md border border-border bg-background p-2 max-h-[200px] overflow-y-auto">
            {adoptableCats.length > 0 ? (
              <div className="space-y-0.5">
                {adoptableCats.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      updateWikiCategory(c.id, {
                        parentIds: [categoryId],
                      })
                      setShowAdoptPicker(false)
                      toast.success(`Moved "${c.name}" under "${category.name}"`)
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-secondary/30"
                  >
                    <FolderSimple size={12} weight="regular" className="text-muted-foreground/50 shrink-0" />
                    <span className="truncate text-left">{c.name}</span>
                    {c.parentIds.length > 0 && (
                      <span className="text-xs text-muted-foreground/40 ml-auto shrink-0">
                        in {categories.find((p) => p.id === c.parentIds[0])?.name ?? "..."}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/40 py-2 text-center">No available categories</p>
            )}
          </div>
        )}

        {subcategories.length > 0 ? (
          <div className="space-y-0.5">
            {subcategories.map((sub) => (
              <button
                key={sub.id}
                onClick={() => onNavigateCategory(sub.id)}
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-secondary/30"
              >
                <FolderSimple
                  size={14}
                  weight="regular"
                  className="text-muted-foreground/50 shrink-0"
                />
                <span className="flex-1 truncate text-left">{sub.name}</span>
                <CaretRight
                  size={12}
                  weight="regular"
                  className="text-muted-foreground/30 shrink-0"
                />
              </button>
            ))}
          </div>
        ) : !showNewSub && (
          <p className="text-xs text-muted-foreground/40 px-3 py-2">
            No subcategories
          </p>
        )}
      </div>

      {/* Articles */}
      <div className="px-6 pt-4">
        <h4 className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wide mb-2">
          Articles ({catArticles.length})
        </h4>
        {catArticles.length > 0 ? (
          <div className="space-y-0.5">
            {catArticles.map((art) => (
              <button
                key={art.id}
                onClick={() => onOpenArticle(art.id)}
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-secondary/30"
              >
                <WikiStatusBadge status={art.wikiStatus} />
                <span className="flex-1 truncate text-left">
                  {art.title || "Untitled"}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground/40 px-3 py-2">
            No articles
          </p>
        )}
      </div>

      {/* Divider + Delete */}
      <div className="mt-auto px-6 pt-6 pb-6">
        <div className="border-t border-border/30 pt-4">
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-400/10"
          >
            <Trash size={16} weight="regular" />
            Delete Category
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   CATEGORY SIDE PANEL
   ══════════════════════════════════════════════════════════ */

export function CategorySidePanel({
  categories,
  articles,
  selectedId,
  selectedIds,
  onSelect,
  onDeleteSelected,
  onSelectAll,
}: {
  categories: WikiCategory[]
  articles: WikiArticle[]
  selectedId: string | null
  selectedIds: Set<string>
  onSelect: (id: string) => void
  onDeleteSelected: () => void
  onSelectAll?: () => void
}) {
  const updateWikiCategory = usePlotStore((s) => s.updateWikiCategory)

  // Multi-selection state
  if (selectedIds.size > 1) {
    return (
      <div className="p-4">
        <h3 className="text-ui font-semibold text-foreground flex items-center gap-2 mb-4">
          <FolderSimple className="text-accent" size={16} weight="regular" />
          Selected
        </h3>

        <div className="space-y-4">
          {/* Stats card */}
          <div className="rounded-md bg-background border border-border p-3">
            <div className="text-xl font-bold text-foreground">{selectedIds.size}</div>
            <div className="text-xs text-muted-foreground">categories selected</div>
          </div>

          {/* Batch Actions */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Batch Actions</h4>
            <div className="space-y-1">
              <button
                onClick={onDeleteSelected}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-400/10"
              >
                <Trash size={16} weight="regular" />
                Delete selected
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Single selection state
  if (selectedId) {
    const category = categories.find(c => c.id === selectedId)
    if (!category) return null

    const depth = getDepth(category.id, categories)
    const tierLabel = depth === 0 ? "1st tier" : depth === 1 ? "2nd tier" : depth === 2 ? "3rd tier" : `${depth + 1}th tier`
    const breadcrumbPath = buildBreadcrumb(category.id, categories).map(c => c.name)
    const subcategories = categories.filter(c => c.parentIds.includes(category.id))
    const catArticles = articles.filter(a => a.categoryIds?.includes(category.id))

    return (
      <div className="p-4">
        <h3 className="text-ui font-semibold text-foreground flex items-center gap-2 mb-4">
          <FolderSimple className="text-accent" size={16} weight="regular" />
          {category.name}
        </h3>

        <div className="space-y-4">
          {/* Breadcrumb + description */}
          {breadcrumbPath.length > 1 && (
            <div className="text-xs text-muted-foreground/50">
              {breadcrumbPath.join(" > ")}
            </div>
          )}

          {/* Description (editable) */}
          <input
            type="text"
            value={category.description ?? ""}
            placeholder="Add description..."
            onChange={(e) => updateWikiCategory(category.id, { description: e.target.value })}
            className="w-full bg-transparent text-sm text-muted-foreground placeholder:text-muted-foreground/30 border-none focus:outline-none"
          />

          {/* Meta info card */}
          <div className="rounded-md bg-background border border-border p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground/70">Tier</span>
              <span className="text-foreground font-medium">{tierLabel}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground/70">Created</span>
              <span className="text-foreground tabular-nums">{shortRelative(category.createdAt)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground/70">Updated</span>
              <span className="text-foreground tabular-nums">{shortRelative(category.updatedAt ?? category.createdAt)}</span>
            </div>
          </div>

          {/* Content stats */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Content</h4>
            <div className="space-y-1">
              <div className="flex items-center justify-between rounded-md px-3 py-1.5 text-sm">
                <span className="text-foreground/80">Articles</span>
                <span className="text-green-400 tabular-nums font-medium">{catArticles.filter(a => a.wikiStatus === "article").length || "—"}</span>
              </div>
              <div className="flex items-center justify-between rounded-md px-3 py-1.5 text-sm">
                <span className="text-foreground/80">Stubs</span>
                <span className="text-orange-400 tabular-nums font-medium">{catArticles.filter(a => a.wikiStatus === "stub").length || "—"}</span>
              </div>
              <div className="flex items-center justify-between rounded-md px-3 py-1.5 text-sm">
                <span className="text-foreground/80">Subcategories</span>
                <span className="text-muted-foreground/70 tabular-nums font-medium">{subcategories.length || "—"}</span>
              </div>
            </div>
          </div>

          {/* Subcategories list */}
          {subcategories.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Subcategories</h4>
              <div className="space-y-1">
                {subcategories.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => onSelect(sub.id)}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-secondary/30"
                  >
                    <FolderSimple size={12} weight="regular" className="text-muted-foreground/50 shrink-0" />
                    <span className="truncate">{sub.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Articles list */}
          {catArticles.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Articles</h4>
              <div className="space-y-1">
                {catArticles.map(art => (
                  <div key={art.id} className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-foreground/80">
                    <WikiStatusBadge status={art.wikiStatus} />
                    <span className="truncate">{art.title || "Untitled"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // No selection — All Overview
  const totalCategories = categories.length
  const tier1Count = categories.filter(c => getDepth(c.id, categories) === 0).length
  const tier2Count = categories.filter(c => getDepth(c.id, categories) === 1).length
  const tier3Count = categories.filter(c => getDepth(c.id, categories) >= 2).length
  const totalArticles = articles.filter(a => a.wikiStatus === "article").length
  const totalStubs = articles.filter(a => a.wikiStatus === "stub").length
  const categoriesWithArticles = new Set(articles.flatMap(a => a.categoryIds ?? []))
  const emptyCount = categories.filter(c => !categoriesWithArticles.has(c.id)).length

  return (
    <div className="p-4">
      <h3 className="text-ui font-semibold text-foreground flex items-center gap-2 mb-4">
        <FolderSimple className="text-accent" size={16} weight="regular" />
        All Overview
      </h3>

      <div className="space-y-4">
        {/* Stats card */}
        <div className="rounded-md bg-background border border-border p-3">
          <div className="text-xl font-bold text-foreground">{totalCategories}</div>
          <div className="text-xs text-muted-foreground">total categories</div>
        </div>

        {/* Tier distribution */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Tier Distribution</h4>
          <div className="space-y-1">
            {[
              { label: "1st tier", count: tier1Count },
              { label: "2nd tier", count: tier2Count },
              { label: "3rd tier", count: tier3Count },
            ].map(({ label, count }) => (
              <div key={label} className="flex items-center justify-between rounded-md px-3 py-1.5 text-sm">
                <span className="text-foreground/80">{label}</span>
                <span className="text-foreground tabular-nums font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content stats */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Content</h4>
          <div className="space-y-1">
            <div className="flex items-center justify-between rounded-md px-3 py-1.5 text-sm">
              <span className="text-foreground/80">Articles</span>
              <span className="text-green-400 tabular-nums font-medium">{totalArticles}</span>
            </div>
            <div className="flex items-center justify-between rounded-md px-3 py-1.5 text-sm">
              <span className="text-foreground/80">Stubs</span>
              <span className="text-orange-400 tabular-nums font-medium">{totalStubs}</span>
            </div>
            <div className="flex items-center justify-between rounded-md px-3 py-1.5 text-sm">
              <span className="text-foreground/80">Empty categories</span>
              <span className="text-muted-foreground/50 tabular-nums font-medium">{emptyCount}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Quick Actions</h4>
          <div className="space-y-1">
            <button
              onClick={onSelectAll}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <CursorClick size={16} weight="regular" />
              Select All
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   MAIN: Full List / Board View
   ══════════════════════════════════════════════════════════ */

export function WikiCategoryPage({
  categoryId,
  onOpenArticle,
  onNavigateCategory,
  categoryViewMode,
  categoryOrdering,
  categoryTierFilter,
  categoryStatusFilter,
  categoryShowDescription,
  categoryShowEmpty,
  categoryGrouping,
  categoryDisplayProps,
  categorySortDirection,
  onOrderingChange,
  onSortDirectionChange,
}: WikiCategoryPageProps) {
  const wikiCategories = usePlotStore((s) => s.wikiCategories)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const deleteWikiCategory = usePlotStore((s) => s.deleteWikiCategory)

  const [selectedCatId, setSelectedCatId] = useState<string | null>(
    categoryId
  )
  const [selectedCatIds, setSelectedCatIds] = useState<Set<string>>(new Set())
  const [openEditorId, setOpenEditorId] = useState<string | null>(null)

  // Sync selectedCatId when categoryId prop changes
  useEffect(() => {
    if (categoryId !== null) {
      setSelectedCatId(categoryId)
    }
  }, [categoryId])

  const handleSelect = useCallback(
    (id: string, e?: React.MouseEvent) => {
      if (e && (e.ctrlKey || e.metaKey)) {
        // Multi-select toggle
        setSelectedCatIds(prev => {
          const next = new Set(prev)
          if (next.has(id)) {
            next.delete(id)
          } else {
            next.add(id)
          }
          return next
        })
        return
      }
      // Single select — clear multi, update side panel but don't open editor
      setSelectedCatIds(new Set())
      setSelectedCatId(id)
      setActiveCategoryView(id)
    },
    []
  )

  const handleDoubleClick = useCallback((id: string) => {
    setOpenEditorId(id)
    setSelectedCatId(id)
    onNavigateCategory(id)
  }, [onNavigateCategory])

  const handleDeleteSelected = useCallback(() => {
    const count = selectedCatIds.size
    if (count === 0) return

    // Snapshot categories and their relationships before deletion
    const deletedCats = wikiCategories.filter(c => selectedCatIds.has(c.id))
    // Snapshot which other categories had these as parents
    const orphanedParentRefs: { catId: string; parentId: string }[] = []
    for (const c of wikiCategories) {
      for (const pid of c.parentIds) {
        if (selectedCatIds.has(pid)) {
          orphanedParentRefs.push({ catId: c.id, parentId: pid })
        }
      }
    }
    // Snapshot which articles had these categories
    const articleCatRefs: { articleId: string; categoryId: string }[] = []
    for (const a of wikiArticles) {
      for (const cid of (a.categoryIds ?? [])) {
        if (selectedCatIds.has(cid)) {
          articleCatRefs.push({ articleId: a.id, categoryId: cid })
        }
      }
    }

    // Perform deletion
    for (const id of selectedCatIds) {
      deleteWikiCategory(id)
    }
    setSelectedCatIds(new Set())

    // Register undo
    pushUndo(
      `Delete ${count} categor${count === 1 ? "y" : "ies"}`,
      () => {
        // Undo: restore categories
        const { wikiCategories: currentCats } = usePlotStore.getState()
        usePlotStore.setState({
          wikiCategories: [
            ...currentCats,
            ...deletedCats,
          ],
        })
        // Restore parent references
        if (orphanedParentRefs.length > 0) {
          const updated = usePlotStore.getState().wikiCategories.map(c => {
            const refs = orphanedParentRefs.filter(r => r.catId === c.id)
            if (refs.length === 0) return c
            const restoredParentIds = [...new Set([...c.parentIds, ...refs.map(r => r.parentId)])]
            return { ...c, parentIds: restoredParentIds }
          })
          usePlotStore.setState({ wikiCategories: updated })
        }
        // Restore article category references
        if (articleCatRefs.length > 0) {
          const updatedArts = usePlotStore.getState().wikiArticles.map(a => {
            const refs = articleCatRefs.filter(r => r.articleId === a.id)
            if (refs.length === 0) return a
            const restoredCatIds = [...new Set([...(a.categoryIds ?? []), ...refs.map(r => r.categoryId)])]
            return { ...a, categoryIds: restoredCatIds }
          })
          usePlotStore.setState({ wikiArticles: updatedArts })
        }
        toast.success(`Restored ${count} categor${count === 1 ? "y" : "ies"}`)
      },
      () => {
        // Redo: delete again
        const ids = new Set(deletedCats.map(c => c.id))
        for (const id of ids) {
          usePlotStore.getState().deleteWikiCategory(id)
        }
      }
    )

    toast.success(`Deleted ${count} categor${count === 1 ? "y" : "ies"}`, {
      action: { label: "Undo", onClick: () => popUndo() },
    })
  }, [selectedCatIds, deleteWikiCategory, wikiCategories, wikiArticles])

  const handleSelectAll = useCallback(() => {
    setSelectedCatIds(new Set(wikiCategories.map((c) => c.id)))
  }, [wikiCategories])

  // Clear selection when clicking background
  const handleBackgroundClick = useCallback(() => {
    setSelectedCatId(null)
    setSelectedCatIds(new Set())
    setOpenEditorId(null)
    setActiveCategoryView(null)
  }, [])

  return (
    <div className="flex h-full flex-1 overflow-hidden">
      <div
        className={cn(
          "overflow-auto",
          openEditorId
            ? "w-[280px] shrink-0 border-r border-border/30"
            : "flex-1"
        )}
        onClick={handleBackgroundClick}
      >
        {categoryViewMode === "board" ? (
          <CategoryBoardView
            categories={wikiCategories}
            articles={wikiArticles}
            ordering={categoryOrdering ?? "name"}
            sortDirection={categorySortDirection ?? "asc"}
            onSelect={handleSelect}
            showDescription={categoryShowDescription}
            showEmpty={categoryShowEmpty}
            grouping={categoryGrouping}
            selectedIds={selectedCatIds}
            onDoubleClick={handleDoubleClick}
          />
        ) : (
          <CategoryFullListView
            categories={wikiCategories}
            articles={wikiArticles}
            selectedId={selectedCatId}
            onSelect={handleSelect}
            onOpenArticle={onOpenArticle}
            ordering={categoryOrdering}
            sortDirection={categorySortDirection ?? "asc"}
            tierFilter={categoryTierFilter}
            statusFilter={categoryStatusFilter}
            showDescription={categoryShowDescription}
            showEmpty={categoryShowEmpty}
            grouping={categoryGrouping}
            displayProps={categoryDisplayProps}
            onOrderingChange={onOrderingChange}
            onSortDirectionChange={onSortDirectionChange}
            onDoubleClick={handleDoubleClick}
          />
        )}
      </div>
      {openEditorId && (
        <div className="flex-1 overflow-auto">
          <CategoryEditor
            categoryId={openEditorId}
            categories={wikiCategories}
            articles={wikiArticles}
            onNavigateCategory={(id) => {
              setOpenEditorId(id)
              setSelectedCatId(id)
              onNavigateCategory(id)
            }}
            onOpenArticle={onOpenArticle}
            onClose={() => {
              setOpenEditorId(null)
              setSelectedCatId(null)
              setSelectedCatIds(new Set())
              setActiveCategoryView(null)
            }}
          />
        </div>
      )}
    </div>
  )
}
