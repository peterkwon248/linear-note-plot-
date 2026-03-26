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
import { Folder } from "@phosphor-icons/react/dist/ssr/Folder"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { Plus } from "@phosphor-icons/react/dist/ssr/Plus"
import { DotsThree } from "@phosphor-icons/react/dist/ssr/DotsThree"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { PencilSimple } from "@phosphor-icons/react/dist/ssr/PencilSimple"
import { TreeStructure } from "@phosphor-icons/react/dist/ssr/TreeStructure"
import { DotsSixVertical } from "@phosphor-icons/react/dist/ssr/DotsSixVertical"
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass"
import { List as PhList } from "@phosphor-icons/react/dist/ssr/List"

/* ── Props ── */

interface WikiCategoryPageProps {
  categoryId: string | null
  onOpenArticle: (articleId: string) => void
  onNavigateCategory: (categoryId: string) => void
  categoryViewMode?: "tree" | "list"
  categoryOrdering?: "name" | "articles" | "updated"
  categoryTierFilter?: string | null
  categoryStatusFilter?: string | null
  categoryShowDescription?: boolean
  categoryShowEmpty?: boolean
  categoryGrouping?: "none" | "tier" | "parent" | "family"
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

/* ── Section divider ── */

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="text-note font-medium text-muted-foreground/60 uppercase tracking-wider whitespace-nowrap">
        {label}
      </span>
      <div className="h-px flex-1 bg-border/40" />
    </div>
  )
}

/* ── Empty state ── */

function EmptyState({ message }: { message: string }) {
  return (
    <p className="py-3 px-1 text-xs text-muted-foreground/50 italic">
      {message}
    </p>
  )
}

/* ── Inline description editor ── */

function DescriptionEditor({
  categoryId,
  description,
}: {
  categoryId: string
  description: string | undefined
}) {
  const updateWikiCategory = usePlotStore((s) => s.updateWikiCategory)
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(description ?? "")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleClick = () => {
    setValue(description ?? "")
    setEditing(true)
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  const handleBlur = () => {
    setEditing(false)
    const trimmed = value.trim()
    updateWikiCategory(categoryId, { description: trimmed || undefined })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      setEditing(false)
      setValue(description ?? "")
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      textareaRef.current?.blur()
    }
  }

  if (editing) {
    return (
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        rows={3}
        placeholder="카테고리 설명을 입력하세요..."
        className="w-full resize-none rounded-md border border-accent/40 bg-secondary/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
      />
    )
  }

  return (
    <button
      onClick={handleClick}
      className="w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-colors"
    >
      {description ? (
        <span>{description}</span>
      ) : (
        <span className="italic text-muted-foreground/50">
          No description — click to add
        </span>
      )}
    </button>
  )
}

/* ══════════════════════════════════════════════════════════
   LEFT PANEL: Tree Editor
   ══════════════════════════════════════════════════════════ */

/* ── Tree node (draggable + droppable) ── */

interface TreeNodeProps {
  category: WikiCategory
  categories: WikiCategory[]
  depth: number
  selectedId: string | null
  onSelect: (id: string) => void
  expandedIds: Set<string>
  onToggleExpand: (id: string) => void
  dragOverId: string | null
  filteredIds?: Set<string> | null
  onCreateSub?: (parentId: string) => void
  creatingSubParentId?: string | null
  subInputRef?: React.RefObject<HTMLInputElement | null>
  subName?: string
  onSubNameChange?: (v: string) => void
  onSubConfirm?: () => void
  onSubKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

function TreeNode({
  category,
  categories,
  depth,
  selectedId,
  onSelect,
  expandedIds,
  onToggleExpand,
  dragOverId,
  filteredIds,
  onCreateSub,
  creatingSubParentId,
  subInputRef,
  subName,
  onSubNameChange,
  onSubConfirm,
  onSubKeyDown,
}: TreeNodeProps) {
  const updateWikiCategory = usePlotStore((s) => s.updateWikiCategory)
  const deleteWikiCategory = usePlotStore((s) => s.deleteWikiCategory)

  const children = useMemo(
    () => {
      let result = categories
        .filter((c) => c.parentIds.includes(category.id))
        .sort((a, b) => a.name.localeCompare(b.name))
      if (filteredIds) {
        result = result.filter(c => filteredIds.has(c.id))
      }
      return result
    },
    [categories, category.id, filteredIds]
  )
  const hasChildren = children.length > 0
  const isExpanded = expandedIds.has(category.id)
  const isSelected = selectedId === category.id
  const isDragOver = dragOverId === category.id

  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(category.name)
  const renameRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Draggable
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({ id: `drag-${category.id}`, data: { categoryId: category.id } })

  // Droppable
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-${category.id}`,
    data: { categoryId: category.id },
  })

  const handleRenameConfirm = () => {
    const trimmed = renameValue.trim()
    if (trimmed && trimmed !== category.name) {
      updateWikiCategory(category.id, { name: trimmed })
    }
    setRenaming(false)
  }

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleRenameConfirm()
    if (e.key === "Escape") {
      setRenaming(false)
      setRenameValue(category.name)
    }
  }

  const startRename = () => {
    setMenuOpen(false)
    setRenameValue(category.name)
    setRenaming(true)
    setTimeout(() => renameRef.current?.select(), 0)
  }

  const handleDelete = () => {
    setMenuOpen(false)
    deleteWikiCategory(category.id)
  }

  const handleAddSub = () => {
    setMenuOpen(false)
    onCreateSub?.(category.id)
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setMenuOpen(true)
  }

  return (
    <>
      <div
        ref={(node) => {
          setDropRef(node)
          setDragRef(node)
        }}
        data-tree-node
        {...attributes}
        onContextMenu={handleContextMenu}
        style={{ paddingLeft: depth * 20 }}
        className={`group relative flex items-center rounded-md transition-colors ${
          isDragging ? "opacity-40" : ""
        } ${isSelected ? "bg-white/[0.06]" : "hover:bg-white/[0.04]"} ${
          (isOver || isDragOver) && !isDragging
            ? "ring-1 ring-accent/40 bg-accent/[0.06]"
            : ""
        }`}
      >
        {/* drag handle */}
        <button
          {...listeners}
          className="shrink-0 p-0.5 opacity-0 group-hover:opacity-60 hover:!opacity-100 cursor-grab text-muted-foreground/40 transition-opacity"
          tabIndex={-1}
        >
          <DotsSixVertical size={14} weight="bold" />
        </button>

        {/* expand/collapse toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (hasChildren) onToggleExpand(category.id)
          }}
          className="shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-white/[0.06] text-muted-foreground/40 transition-colors"
        >
          {hasChildren ? (
            isExpanded ? (
              <CaretDown size={13} />
            ) : (
              <CaretRight size={13} />
            )
          ) : null}
        </button>

        {/* name */}
        <button
          onClick={() => onSelect(category.id)}
          className="flex flex-1 items-center gap-2 min-w-0 py-2 pr-1 text-left"
        >
          <FolderSimple
            size={17}
            weight="duotone"
            className={`shrink-0 ${
              isSelected ? "text-accent/70" : "text-muted-foreground/50"
            }`}
          />
          {renaming ? (
            <input
              ref={renameRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRenameConfirm}
              onKeyDown={handleRenameKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 min-w-0 bg-transparent text-sm text-foreground border-b border-accent/40 outline-none"
            />
          ) : (
            <span
              className={`flex-1 min-w-0 truncate text-sm ${
                isSelected
                  ? "text-foreground font-medium"
                  : "text-foreground/70"
              }`}
            >
              {category.name}
            </span>
          )}
        </button>

        {/* context menu */}
        <div className="relative shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen((v) => !v)
            }}
            className="opacity-0 group-hover:opacity-100 rounded p-0.5 text-muted-foreground/40 hover:text-foreground hover:bg-white/[0.06] transition-all"
          >
            <DotsThree size={14} weight="bold" />
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div
                ref={menuRef}
                className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-white/[0.08] bg-[#1a1a1a] py-1.5 shadow-xl"
              >
                <button
                  onClick={handleAddSub}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-foreground/80 hover:bg-white/[0.06] hover:text-foreground transition-colors"
                >
                  <Plus size={14} weight="regular" />
                  Add subcategory
                </button>
                <button
                  onClick={startRename}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-foreground/80 hover:bg-white/[0.06] hover:text-foreground transition-colors"
                >
                  <PencilSimple size={14} />
                  Rename
                </button>
                <div className="my-1.5 h-px bg-white/[0.06]" />
                <button
                  onClick={handleDelete}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-red-400/80 hover:bg-white/[0.06] hover:text-red-400 transition-colors"
                >
                  <Trash size={14} />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* children + sub-creation input */}
      {(hasChildren && isExpanded || creatingSubParentId === category.id) && (
        <div>
          {children.map((child) => (
            <TreeNode
              key={child.id}
              category={child}
              categories={categories}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              dragOverId={dragOverId}
              filteredIds={filteredIds}
              onCreateSub={onCreateSub}
              creatingSubParentId={creatingSubParentId}
              subInputRef={subInputRef}
              subName={subName}
              onSubNameChange={onSubNameChange}
              onSubConfirm={onSubConfirm}
              onSubKeyDown={onSubKeyDown}
            />
          ))}
          {/* Inline sub-category input */}
          {creatingSubParentId === category.id && (
            <div style={{ paddingLeft: (depth + 1) * 20 }} className="flex items-center gap-2 px-2 py-1.5">
              <FolderSimple size={14} weight="duotone" className="shrink-0 text-accent/50" />
              <input
                ref={subInputRef}
                value={subName ?? ""}
                onChange={(e) => onSubNameChange?.(e.target.value)}
                onBlur={onSubConfirm}
                onKeyDown={onSubKeyDown}
                placeholder="Subcategory name…"
                className="flex-1 min-w-0 bg-transparent text-sm text-foreground border-b border-accent/40 outline-none placeholder:text-muted-foreground/30"
              />
            </div>
          )}
        </div>
      )}
    </>
  )
}

/* ── Root drop zone (for making items root-level) ── */

function RootDropZone({ isDragActive }: { isDragActive: boolean }) {
  const { setNodeRef, isOver } = useDroppable({
    id: "drop-root",
    data: { categoryId: null },
  })

  if (!isDragActive) return null

  return (
    <div
      ref={setNodeRef}
      className={`mx-2 mt-1 rounded-md border border-dashed py-2 text-center text-xs transition-colors ${
        isOver
          ? "border-accent/50 bg-accent/[0.06] text-accent/70"
          : "border-white/[0.08] text-muted-foreground/30"
      }`}
    >
      Move to root
    </div>
  )
}

/* ── Category list view (flat alphabetical) ── */

function CategoryListView({
  categories,
  articles,
  selectedId,
  onSelect,
  searchQuery,
}: {
  categories: WikiCategory[]
  articles: WikiArticle[]
  selectedId: string | null
  onSelect: (id: string) => void
  searchQuery: string
}) {
  const categoryData = useMemo(() => {
    const getDepth = (catId: string, visited = new Set<string>()): number => {
      if (visited.has(catId)) return 0
      visited.add(catId)
      const cat = categories.find(c => c.id === catId)
      if (!cat || cat.parentIds.length === 0) return 0
      return 1 + getDepth(cat.parentIds[0], visited)
    }

    const q = searchQuery.toLowerCase().trim()

    return categories
      .map(cat => {
        const depth = getDepth(cat.id)
        const catArticles = articles.filter(a => a.categoryIds?.includes(cat.id))
        const articleCount = catArticles.filter(a => a.wikiStatus === "article").length
        const stubCount = catArticles.filter(a => a.wikiStatus === "stub").length
        const childCount = categories.filter(c => c.parentIds.includes(cat.id)).length
        return { cat, depth, articleCount, stubCount, childCount }
      })
      .filter(item => !q || item.cat.name.toLowerCase().includes(q))
      .sort((a, b) => a.cat.name.localeCompare(b.cat.name))
  }, [categories, articles, searchQuery])

  if (categoryData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
        <FolderSimple size={28} weight="thin" className="text-muted-foreground/20" />
        <p className="text-sm text-muted-foreground/40">
          {searchQuery ? "No matching categories" : "No categories yet"}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-0.5 px-1.5 py-1.5">
      {categoryData.map(({ cat, depth, articleCount, stubCount, childCount }) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left transition-colors ${
            selectedId === cat.id ? "bg-white/[0.06]" : "hover:bg-white/[0.04]"
          }`}
        >
          <FolderSimple
            size={16}
            weight="duotone"
            className={selectedId === cat.id ? "shrink-0 text-accent/70" : "shrink-0 text-muted-foreground/50"}
          />
          <span className={`min-w-0 flex-1 truncate text-sm ${
            selectedId === cat.id ? "text-foreground font-medium" : "text-foreground/70"
          }`}>
            {cat.name}
          </span>
          {depth > 0 && (
            <span className="shrink-0 rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-muted-foreground/40">
              d{depth}
            </span>
          )}
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground/30">
            {articleCount > 0 && `${articleCount}a`}
            {articleCount > 0 && stubCount > 0 && " · "}
            {stubCount > 0 && `${stubCount}s`}
            {articleCount === 0 && stubCount === 0 && "—"}
          </span>
        </button>
      ))}
    </div>
  )
}

/* ── Left panel ── */

interface TreePanelProps {
  categories: WikiCategory[]
  articles: WikiArticle[]
  selectedId: string | null
  onSelect: (id: string) => void
  externalViewMode?: "tree" | "list"
}

function TreePanel({ categories, articles, selectedId, onSelect, externalViewMode }: TreePanelProps) {
  const createWikiCategory = usePlotStore((s) => s.createWikiCategory)
  const updateWikiCategory = usePlotStore((s) => s.updateWikiCategory)

  const [viewMode, setViewMode] = useState<"tree" | "list">("tree")
  const effectiveViewMode = externalViewMode ?? viewMode
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const newInputRef = useRef<HTMLInputElement>(null)
  const [dragActiveId, setDragActiveId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [recentIds, setRecentIds] = useState<string[]>([])

  const handleSelectWithRecent = useCallback((id: string) => {
    // Track last selected (1 item only)
    setRecentIds(prev => {
      const filtered = prev.filter(x => x !== id)
      return [id, ...filtered].slice(0, 1)
    })
    onSelect(id)
  }, [onSelect])

  const rootCategories = useMemo(
    () =>
      categories
        .filter((c) => c.parentIds.length === 0)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [categories]
  )

  // Filter categories by search query
  const filteredCategoryIds = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return null // null = show all

    // Find matching categories
    const matchingIds = new Set<string>()
    for (const cat of categories) {
      if (cat.name.toLowerCase().includes(q)) {
        matchingIds.add(cat.id)
        // Also add all ancestors to preserve tree structure
        const breadcrumb = buildBreadcrumb(cat.id, categories)
        for (const ancestor of breadcrumb) {
          matchingIds.add(ancestor.id)
        }
      }
    }
    return matchingIds
  }, [searchQuery, categories])

  // Filtered root categories
  const displayRoots = useMemo(() => {
    if (!filteredCategoryIds) return rootCategories
    return rootCategories.filter(c => filteredCategoryIds.has(c.id))
  }, [rootCategories, filteredCategoryIds])

  // Auto-expand all when searching
  useEffect(() => {
    if (filteredCategoryIds && filteredCategoryIds.size > 0) {
      setExpandedIds(new Set(filteredCategoryIds))
    }
  }, [filteredCategoryIds])

  // Auto-expand to show selectedId
  useEffect(() => {
    if (!selectedId) return
    const breadcrumb = buildBreadcrumb(selectedId, categories)
    if (breadcrumb.length > 1) {
      setExpandedIds((prev) => {
        const next = new Set(prev)
        // expand all ancestors
        for (let i = 0; i < breadcrumb.length - 1; i++) {
          next.add(breadcrumb[i].id)
        }
        return next
      })
    }
  }, [selectedId, categories])

  const onToggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const catId = event.active.data.current?.categoryId as string | undefined
    setDragActiveId(catId ?? null)
  }

  const handleDragOver = (event: { over: { data: { current?: { categoryId?: string | null } } } | null }) => {
    const overCatId = event.over?.data.current?.categoryId
    setDragOverId(overCatId !== undefined ? (overCatId as string | null) : null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const draggedCatId = event.active.data.current?.categoryId as
      | string
      | undefined
    const overData = event.over?.data.current as
      | { categoryId: string | null }
      | undefined

    setDragActiveId(null)
    setDragOverId(null)

    if (!draggedCatId || overData === undefined) return
    const targetParentId = overData.categoryId

    // Prevent dropping onto self
    if (targetParentId === draggedCatId) return

    // Prevent cycle: can't drop onto own descendants
    if (targetParentId !== null) {
      const descendants = getDescendantIds(draggedCatId, categories)
      if (descendants.has(targetParentId)) return
    }

    // Update parentIds
    const newParentIds = targetParentId === null ? [] : [targetParentId]
    updateWikiCategory(draggedCatId, { parentIds: newParentIds })

    // Auto-expand target
    if (targetParentId) {
      setExpandedIds((prev) => new Set([...prev, targetParentId]))
    }
  }

  const handleDragCancel = () => {
    setDragActiveId(null)
    setDragOverId(null)
  }

  // Sub-category creation state
  const [creatingSubParentId, setCreatingSubParentId] = useState<string | null>(null)
  const [subName, setSubName] = useState("")
  const subInputRef = useRef<HTMLInputElement>(null)
  const [emptyMenuPos, setEmptyMenuPos] = useState<{ x: number; y: number } | null>(null)

  const handleCreateSub = useCallback((parentId: string) => {
    setCreatingSubParentId(parentId)
    setSubName("")
    // Auto-expand the parent
    setExpandedIds(prev => new Set([...prev, parentId]))
    setTimeout(() => subInputRef.current?.focus(), 0)
  }, [])

  const handleSubConfirm = () => {
    const trimmed = subName.trim()
    if (trimmed && creatingSubParentId) {
      createWikiCategory(trimmed, [creatingSubParentId])
    }
    setCreatingSubParentId(null)
    setSubName("")
  }

  const handleSubKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSubConfirm()
    if (e.key === "Escape") {
      setCreatingSubParentId(null)
      setSubName("")
    }
  }

  const handleStartCreate = () => {
    setNewName("")
    setCreating(true)
    setTimeout(() => newInputRef.current?.focus(), 0)
  }

  const handleCreateConfirm = () => {
    const trimmed = newName.trim()
    if (trimmed) createWikiCategory(trimmed)
    setCreating(false)
    setNewName("")
  }

  const handleCreateKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleCreateConfirm()
    if (e.key === "Escape") {
      setCreating(false)
      setNewName("")
    }
  }

  const draggedCategory = dragActiveId
    ? categories.find((c) => c.id === dragActiveId)
    : null

  return (
    <div
      className="flex h-full w-[280px] shrink-0 flex-col border-r border-white/[0.06] bg-white/[0.01]"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <TreeStructure
            size={16}
            weight="duotone"
            className="text-muted-foreground/50"
          />
          <span className="text-sm font-medium text-foreground/70">
            Categories
          </span>
          {categories.length > 0 && (
            <span className="text-sm text-muted-foreground/40">
              ({categories.length})
            </span>
          )}
        </div>
      </div>

      {/* search */}
      <div className="px-3 py-2 border-b border-white/[0.06]">
        <div className="relative">
          <MagnifyingGlass
            className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground/30"
            size={14}
            weight="regular"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories…"
            className="h-7 w-full rounded-md border border-white/[0.08] bg-white/[0.03] pl-7 pr-3 text-sm text-foreground placeholder:text-muted-foreground/30 focus:border-white/20 focus:outline-none"
          />
        </div>
      </div>

      {/* recent categories */}
      {!searchQuery && recentIds.length > 0 && (
        <div className="px-3 py-2 border-b border-white/[0.06]">
          <span className="text-xs font-medium text-muted-foreground/40 uppercase tracking-wider">Recent</span>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {recentIds
              .map(id => categories.find(c => c.id === id))
              .filter(Boolean)
              .map(cat => (
                <button
                  key={cat!.id}
                  onClick={() => handleSelectWithRecent(cat!.id)}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                    selectedId === cat!.id
                      ? "bg-accent/15 text-accent"
                      : "bg-white/[0.04] text-foreground/60 hover:bg-white/[0.08] hover:text-foreground/80"
                  }`}
                >
                  <FolderSimple size={12} weight="duotone" className="shrink-0" />
                  <span className="truncate max-w-[120px]">{cat!.name}</span>
                </button>
              ))
            }
          </div>
        </div>
      )}

      {/* tree / list */}
      {effectiveViewMode === "tree" ? (
        <div
          className="relative flex-1 overflow-y-auto px-1.5 py-1.5"
          onContextMenu={(e) => {
            if ((e.target as HTMLElement).closest('[data-tree-node]')) return
            e.preventDefault()
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
            setEmptyMenuPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
          }}
        >
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            {displayRoots.length === 0 && !creating ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                <FolderSimple
                  size={28}
                  weight="thin"
                  className="text-muted-foreground/20"
                />
                <p className="text-xs text-muted-foreground/40">
                  {searchQuery ? "No matching categories" : "No categories yet"}
                </p>
                {!searchQuery && (
                  <button
                    onClick={handleStartCreate}
                    className="mt-1 flex items-center gap-1 rounded-md border border-white/[0.08] px-2 py-1 text-xs text-muted-foreground/60 hover:text-foreground hover:bg-white/[0.04] transition-colors"
                  >
                    <Plus size={10} weight="bold" />
                    Create
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-px">
                {displayRoots.map((cat) => (
                  <TreeNode
                    key={cat.id}
                    category={cat}
                    categories={categories}
                    depth={0}
                    selectedId={selectedId}
                    onSelect={handleSelectWithRecent}
                    expandedIds={expandedIds}
                    onToggleExpand={onToggleExpand}
                    dragOverId={dragOverId}
                    filteredIds={filteredCategoryIds}
                    onCreateSub={handleCreateSub}
                    creatingSubParentId={creatingSubParentId}
                    subInputRef={subInputRef}
                    subName={subName}
                    onSubNameChange={setSubName}
                    onSubConfirm={handleSubConfirm}
                    onSubKeyDown={handleSubKeyDown}
                  />
                ))}
              </div>
            )}

            <RootDropZone isDragActive={!!dragActiveId} />

            <DragOverlay dropAnimation={null}>
              {draggedCategory && (
                <div className="flex items-center gap-1.5 rounded-md bg-[#1a1a1a] border border-white/[0.12] px-2 py-1.5 shadow-xl">
                  <FolderSimple
                    size={15}
                    weight="duotone"
                    className="text-accent/60"
                  />
                  <span className="text-xs text-foreground/80">
                    {draggedCategory.name}
                  </span>
                </div>
              )}
            </DragOverlay>
          </DndContext>

          {/* inline create */}
          {creating && (
            <div className="mt-1 flex items-center gap-1.5 rounded-md border border-accent/30 bg-white/[0.02] px-2 py-1.5">
              <FolderSimple
                size={15}
                weight="duotone"
                className="shrink-0 text-muted-foreground/40"
              />
              <input
                ref={newInputRef}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={handleCreateConfirm}
                onKeyDown={handleCreateKeyDown}
                placeholder="Category name..."
                className="flex-1 min-w-0 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/40 outline-none"
              />
            </div>
          )}

          {/* empty-space context menu */}
          {emptyMenuPos && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setEmptyMenuPos(null)} />
              <div
                className="absolute z-20 w-44 rounded-lg border border-white/[0.08] bg-[#1a1a1a] py-1.5 shadow-xl"
                style={{ left: emptyMenuPos.x, top: emptyMenuPos.y }}
              >
                <button
                  onClick={() => {
                    setEmptyMenuPos(null)
                    handleStartCreate()
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-foreground/80 hover:bg-white/[0.06] hover:text-foreground transition-colors"
                >
                  <Plus size={14} weight="regular" />
                  New category
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div
          className="relative flex-1 overflow-y-auto"
          onContextMenu={(e) => {
            if ((e.target as HTMLElement).closest('[data-tree-node]')) return
            e.preventDefault()
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
            setEmptyMenuPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
          }}
        >
          <CategoryListView
            categories={categories}
            articles={articles}
            selectedId={selectedId}
            onSelect={handleSelectWithRecent}
            searchQuery={searchQuery}
          />

          {/* empty-space context menu */}
          {emptyMenuPos && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setEmptyMenuPos(null)} />
              <div
                className="absolute z-20 w-44 rounded-lg border border-white/[0.08] bg-[#1a1a1a] py-1.5 shadow-xl"
                style={{ left: emptyMenuPos.x, top: emptyMenuPos.y }}
              >
                <button
                  onClick={() => {
                    setEmptyMenuPos(null)
                    handleStartCreate()
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-foreground/80 hover:bg-white/[0.06] hover:text-foreground transition-colors"
                >
                  <Plus size={14} weight="regular" />
                  New category
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   RIGHT PANEL: Detail View
   ══════════════════════════════════════════════════════════ */

interface DetailPanelProps {
  categoryId: string | null
  categories: WikiCategory[]
  articles: WikiArticle[]
  onSelect: (id: string) => void
  onOpenArticle: (articleId: string) => void
}

function DetailPanel({
  categoryId,
  categories,
  articles,
  onSelect,
  onOpenArticle,
}: DetailPanelProps) {
  const category = useMemo(
    () =>
      categoryId
        ? categories.find((c) => c.id === categoryId) ?? null
        : null,
    [categoryId, categories]
  )

  const breadcrumb = useMemo(
    () => (categoryId ? buildBreadcrumb(categoryId, categories) : []),
    [categoryId, categories]
  )

  const children = useMemo(
    () =>
      categoryId
        ? categories
            .filter((c) => c.parentIds.includes(categoryId))
            .sort((a, b) => a.name.localeCompare(b.name))
        : [],
    [categoryId, categories]
  )

  const categoryArticles = useMemo(
    () =>
      categoryId
        ? articles.filter((a) => a.categoryIds?.includes(categoryId))
        : [],
    [categoryId, articles]
  )

  /* ── Overview when no category selected ── */
  if (!category) {
    const allCategoryData = categories
      .map(cat => {
        const getDepth = (catId: string, visited = new Set<string>()): number => {
          if (visited.has(catId)) return 0
          visited.add(catId)
          const c = categories.find(x => x.id === catId)
          if (!c || c.parentIds.length === 0) return 0
          return 1 + getDepth(c.parentIds[0], visited)
        }
        const depth = getDepth(cat.id)
        const catArticles = articles.filter(a => a.categoryIds?.includes(cat.id))
        const articleCount = catArticles.filter(a => a.wikiStatus === "article").length
        const stubCount = catArticles.filter(a => a.wikiStatus === "stub").length
        const childCount = categories.filter(c => c.parentIds.includes(cat.id)).length
        return { cat, depth, articleCount, stubCount, childCount }
      })
      .sort((a, b) => a.depth - b.depth || a.cat.name.localeCompare(b.cat.name))

    const rootCount = allCategoryData.filter(d => d.depth === 0).length
    const totalArticles = articles.length
    const maxDepth = Math.max(0, ...allCategoryData.map(d => d.depth))

    return (
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground tracking-tight mb-1">
              All Categories
            </h2>
            <p className="text-sm text-muted-foreground/60">
              {categories.length} categories · {rootCount} root · depth {maxDepth} · {totalArticles} articles
            </p>
          </div>

          {/* Category list */}
          {allCategoryData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <FolderOpen size={32} className="text-muted-foreground/20" weight="thin" />
              <p className="text-sm text-muted-foreground/40">No categories yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {allCategoryData.map(({ cat, depth, articleCount, stubCount, childCount }) => (
                <button
                  key={cat.id}
                  onClick={() => onSelect(cat.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-secondary/30"
                >
                  <FolderSimple
                    size={18}
                    weight="duotone"
                    className="shrink-0 text-muted-foreground/50"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground/80 truncate">{cat.name}</p>
                    {cat.description && (
                      <p className="text-xs text-muted-foreground/40 truncate mt-0.5">{cat.description}</p>
                    )}
                  </div>
                  {depth > 0 && (
                    <span className="shrink-0 rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-muted-foreground/40">
                      depth {depth}
                    </span>
                  )}
                  {childCount > 0 && (
                    <span className="shrink-0 text-xs text-muted-foreground/30">
                      {childCount} sub
                    </span>
                  )}
                  <div className="shrink-0 flex items-center gap-2 text-xs tabular-nums">
                    {articleCount > 0 && (
                      <span className="text-wiki-complete/70">{articleCount} article{articleCount !== 1 ? "s" : ""}</span>
                    )}
                    {stubCount > 0 && (
                      <span className="text-chart-3/70">{stubCount} stub{stubCount !== 1 ? "s" : ""}</span>
                    )}
                  </div>
                  <CaretRight size={14} className="shrink-0 text-muted-foreground/20" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  const parentPath = breadcrumb.slice(0, -1)

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 py-6">
        {/* ── Breadcrumb ── */}
        {parentPath.length > 0 && (
          <nav className="mb-4 flex items-center gap-1 text-xs text-muted-foreground/60">
            {parentPath.map((crumb, i) => (
              <span key={crumb.id} className="flex items-center gap-1">
                {i > 0 && <CaretRight size={10} className="shrink-0" />}
                <button
                  onClick={() => onSelect(crumb.id)}
                  className="hover:text-foreground transition-colors truncate max-w-[120px]"
                >
                  {crumb.name}
                </button>
              </span>
            ))}
            <CaretRight size={10} className="shrink-0" />
            <span className="text-foreground/70 font-medium truncate max-w-[160px]">
              {category.name}
            </span>
          </nav>
        )}

        {/* ── Header ── */}
        <div className="mb-6">
          <div className="flex items-center gap-2.5 mb-3">
            <FolderOpen
              size={20}
              className="shrink-0 text-accent/70"
              weight="duotone"
            />
            <h2 className="text-xl font-semibold text-foreground tracking-tight">
              {category.name}
            </h2>
          </div>
          <DescriptionEditor
            categoryId={category.id}
            description={category.description}
          />
        </div>

        {/* ── Children categories ── */}
        <div className="mb-6">
          <SectionDivider
            label={`Subcategories ${
              children.length > 0 ? `(${children.length})` : ""
            }`}
          />
          {children.length === 0 ? (
            <EmptyState message="Subcategories 없음" />
          ) : (
            <ul className="mt-2 space-y-0.5">
              {children.map((child) => (
                <li key={child.id}>
                  <button
                    onClick={() => onSelect(child.id)}
                    className="group flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left transition-colors hover:bg-secondary/50"
                  >
                    <Folder
                      size={14}
                      className="shrink-0 text-muted-foreground/50 group-hover:text-accent/70 transition-colors"
                      weight="duotone"
                    />
                    <span className="flex-1 min-w-0 truncate text-sm text-foreground/80 group-hover:text-foreground transition-colors">
                      {child.name}
                    </span>
                    {child.description && (
                      <span className="shrink-0 max-w-[200px] truncate text-2xs text-muted-foreground/50">
                        {child.description}
                      </span>
                    )}
                    <CaretRight
                      size={12}
                      className="shrink-0 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Articles ── */}
        <div>
          <SectionDivider
            label={`Articles ${
              categoryArticles.length > 0
                ? `(${categoryArticles.length})`
                : ""
            }`}
          />
          {categoryArticles.length === 0 ? (
            <EmptyState message="No articles" />
          ) : (
            <ul className="mt-2 space-y-0.5">
              {categoryArticles.map((article) => (
                <li key={article.id}>
                  <button
                    onClick={() => onOpenArticle(article.id)}
                    className="group flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left transition-colors hover:bg-secondary/50"
                  >
                    <FileText
                      size={14}
                      className="shrink-0 text-muted-foreground/50 group-hover:text-accent/70 transition-colors"
                      weight="duotone"
                    />
                    <span className="flex-1 min-w-0 truncate text-sm text-foreground/80 group-hover:text-foreground transition-colors">
                      {article.title || "Untitled"}
                    </span>
                    <WikiStatusBadge status={article.wikiStatus} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
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
  tierFilter,
  statusFilter,
  showDescription = true,
  showEmpty = true,
  grouping,
}: {
  categories: WikiCategory[]
  articles: WikiArticle[]
  selectedId: string | null
  onSelect: (id: string) => void
  onOpenArticle: (articleId: string) => void
  ordering?: "name" | "articles" | "updated"
  tierFilter?: string | null
  statusFilter?: string | null
  showDescription?: boolean
  showEmpty?: boolean
  grouping?: "none" | "tier" | "parent" | "family"
}) {
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const getDepth = useCallback(
    (catId: string, visited = new Set<string>()): number => {
      if (visited.has(catId)) return 0
      visited.add(catId)
      const cat = catMap.get(catId)
      if (!cat || cat.parentIds.length === 0) return 0
      return 1 + getDepth(cat.parentIds[0], visited)
    },
    [catMap]
  )

  const categoryData = useMemo(() => {
    const data = categories.map((cat) => {
      const depth = getDepth(cat.id)
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
    if (ord === "name") {
      filtered.sort((a, b) => a.cat.name.localeCompare(b.cat.name))
    } else if (ord === "articles") {
      filtered.sort((a, b) => b.articleCount - a.articleCount || a.cat.name.localeCompare(b.cat.name))
    } else if (ord === "updated") {
      filtered.sort((a, b) => {
        const aTime = a.cat.updatedAt ? new Date(a.cat.updatedAt).getTime() : 0
        const bTime = (b.cat as any).updatedAt ? new Date((b.cat as any).updatedAt).getTime() : 0
        return bTime - aTime || a.cat.name.localeCompare(b.cat.name)
      })
    }

    return filtered
  }, [categories, articles, getDepth, catMap, tierFilter, statusFilter, ordering, showEmpty])

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
        familyGroups[root.id].members.push({ item, depth: getDepth(item.cat.id) })
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
  }, [categoryData, grouping, categories, getDepth])

  const [expandedCatId, setExpandedCatId] = useState<string | null>(null)

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

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header row */}
      <div className="sticky top-0 z-10 flex items-center border-b border-border/50 bg-background px-5 py-2.5">
        <span className="flex-1 text-[13px] font-medium text-muted-foreground">
          Name
        </span>
        <span className="w-[140px] text-[13px] font-medium text-muted-foreground">
          Parent
        </span>
        <span className="w-[60px] text-center text-[13px] font-medium text-muted-foreground">
          Tier
        </span>
        <span className="w-[72px] text-right text-[13px] font-medium text-muted-foreground">
          Articles
        </span>
        <span className="w-[72px] text-right text-[13px] font-medium text-muted-foreground">
          Stubs
        </span>
        <span className="w-[56px] text-right text-[13px] font-medium text-muted-foreground">
          Sub
        </span>
        <span className="w-[80px] text-right text-[13px] font-medium text-muted-foreground">
          Updated
        </span>
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
                  onClick={() => {
                    onSelect(cat.id)
                    setExpandedCatId((prev) =>
                      prev === cat.id ? null : cat.id
                    )
                  }}
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
                  <span className="w-[140px] text-note truncate text-muted-foreground/50">
                    {parentName ?? "\u2014"}
                  </span>
                  <span className="w-[60px] flex justify-center">
                    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-2xs font-medium ${tierClass(depth)}`}>
                      {tierLabel(depth)}
                    </span>
                  </span>
                  <span className="w-[72px] text-right text-note tabular-nums text-wiki-complete/70">
                    {articleCount > 0 ? articleCount : "\u2014"}
                  </span>
                  <span className="w-[72px] text-right text-note tabular-nums text-chart-3/70">
                    {stubCount > 0 ? stubCount : "\u2014"}
                  </span>
                  <span className="w-[56px] text-right text-note tabular-nums text-muted-foreground/40">
                    {childCount > 0 ? childCount : "\u2014"}
                  </span>
                  <span className="w-[80px] text-right text-note tabular-nums text-muted-foreground/40">
                    {cat.updatedAt ? shortRelative(cat.updatedAt) : "\u2014"}
                  </span>
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
   MAIN: 2-Panel Layout / Full List
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
}: WikiCategoryPageProps) {
  const wikiCategories = usePlotStore((s) => s.wikiCategories)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)

  const [selectedCatId, setSelectedCatId] = useState<string | null>(
    categoryId
  )

  // Sync selectedCatId when categoryId prop changes
  useEffect(() => {
    if (categoryId !== null) {
      setSelectedCatId(categoryId)
    }
  }, [categoryId])

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedCatId(id)
      onNavigateCategory(id)
    },
    [onNavigateCategory]
  )

  return (
    <div className="flex h-full flex-1 overflow-hidden">
      {categoryViewMode === "list" ? (
        <CategoryFullListView
          categories={wikiCategories}
          articles={wikiArticles}
          selectedId={selectedCatId}
          onSelect={handleSelect}
          onOpenArticle={onOpenArticle}
          ordering={categoryOrdering}
          tierFilter={categoryTierFilter}
          statusFilter={categoryStatusFilter}
          showDescription={categoryShowDescription}
          showEmpty={categoryShowEmpty}
          grouping={categoryGrouping}
        />
      ) : (
        <>
          <TreePanel
            categories={wikiCategories}
            articles={wikiArticles}
            selectedId={selectedCatId}
            onSelect={handleSelect}
            externalViewMode={categoryViewMode}
          />
          <DetailPanel
            categoryId={selectedCatId}
            categories={wikiCategories}
            articles={wikiArticles}
            onSelect={handleSelect}
            onOpenArticle={onOpenArticle}
          />
        </>
      )}
    </div>
  )
}
