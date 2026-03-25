"use client"

import { useState, useRef, useMemo, useEffect, useCallback } from "react"
import { usePlotStore } from "@/lib/store"
import type { WikiCategory, WikiArticle } from "@/lib/types"
import { WikiStatusBadge } from "./wiki-shared"
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

/* ── Props ── */

interface WikiCategoryPageProps {
  categoryId: string | null
  onOpenArticle: (articleId: string) => void
  onNavigateCategory: (categoryId: string) => void
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
      <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider whitespace-nowrap">
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
}: TreeNodeProps) {
  const updateWikiCategory = usePlotStore((s) => s.updateWikiCategory)
  const deleteWikiCategory = usePlotStore((s) => s.deleteWikiCategory)

  const children = useMemo(
    () =>
      categories
        .filter((c) => c.parentIds.includes(category.id))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [categories, category.id]
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

  return (
    <>
      <div
        ref={(node) => {
          setDropRef(node)
          setDragRef(node)
        }}
        {...attributes}
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
          <DotsSixVertical size={12} weight="bold" />
        </button>

        {/* expand/collapse toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (hasChildren) onToggleExpand(category.id)
          }}
          className="shrink-0 w-4 h-4 flex items-center justify-center text-muted-foreground/40"
        >
          {hasChildren ? (
            isExpanded ? (
              <CaretDown size={10} />
            ) : (
              <CaretRight size={10} />
            )
          ) : null}
        </button>

        {/* name */}
        <button
          onClick={() => onSelect(category.id)}
          className="flex flex-1 items-center gap-1.5 min-w-0 py-1.5 pr-1 text-left"
        >
          <FolderSimple
            size={13}
            weight="duotone"
            className={`shrink-0 ${
              isSelected ? "text-accent/70" : "text-muted-foreground/40"
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
              className="flex-1 min-w-0 bg-transparent text-xs text-foreground border-b border-accent/40 outline-none"
            />
          ) : (
            <span
              className={`flex-1 min-w-0 truncate text-xs ${
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
                className="absolute right-0 top-full z-20 mt-1 w-32 rounded-md border border-white/[0.08] bg-[#1a1a1a] py-1 shadow-xl"
              >
                <button
                  onClick={startRename}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-foreground/80 hover:bg-white/[0.06] hover:text-foreground transition-colors"
                >
                  <PencilSimple size={12} />
                  Rename
                </button>
                <button
                  onClick={handleDelete}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-400/80 hover:bg-white/[0.06] hover:text-red-400 transition-colors"
                >
                  <Trash size={12} />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* children */}
      {hasChildren && isExpanded && (
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
            />
          ))}
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

/* ── Left panel ── */

interface TreePanelProps {
  categories: WikiCategory[]
  selectedId: string | null
  onSelect: (id: string) => void
}

function TreePanel({ categories, selectedId, onSelect }: TreePanelProps) {
  const createWikiCategory = usePlotStore((s) => s.createWikiCategory)
  const updateWikiCategory = usePlotStore((s) => s.updateWikiCategory)

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const newInputRef = useRef<HTMLInputElement>(null)
  const [dragActiveId, setDragActiveId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const rootCategories = useMemo(
    () =>
      categories
        .filter((c) => c.parentIds.length === 0)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [categories]
  )

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
    <div className="flex h-full w-[280px] shrink-0 flex-col border-r border-white/[0.06] bg-white/[0.01]">
      {/* header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-1.5">
          <TreeStructure
            size={14}
            weight="duotone"
            className="text-muted-foreground/50"
          />
          <span className="text-xs font-medium text-foreground/70">
            Categories
          </span>
          {categories.length > 0 && (
            <span className="text-xs text-muted-foreground/40">
              ({categories.length})
            </span>
          )}
        </div>
        <button
          onClick={handleStartCreate}
          className="rounded p-1 text-muted-foreground/40 hover:text-foreground hover:bg-white/[0.06] transition-colors"
          title="New category"
        >
          <Plus size={13} weight="bold" />
        </button>
      </div>

      {/* tree */}
      <div className="flex-1 overflow-y-auto px-1.5 py-1.5">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          {rootCategories.length === 0 && !creating ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <FolderSimple
                size={28}
                weight="thin"
                className="text-muted-foreground/20"
              />
              <p className="text-xs text-muted-foreground/40">
                No categories yet
              </p>
              <button
                onClick={handleStartCreate}
                className="mt-1 flex items-center gap-1 rounded-md border border-white/[0.08] px-2 py-1 text-xs text-muted-foreground/60 hover:text-foreground hover:bg-white/[0.04] transition-colors"
              >
                <Plus size={10} weight="bold" />
                Create
              </button>
            </div>
          ) : (
            <div className="space-y-px">
              {rootCategories.map((cat) => (
                <TreeNode
                  key={cat.id}
                  category={cat}
                  categories={categories}
                  depth={0}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  expandedIds={expandedIds}
                  onToggleExpand={onToggleExpand}
                  dragOverId={dragOverId}
                />
              ))}
            </div>
          )}

          <RootDropZone isDragActive={!!dragActiveId} />

          <DragOverlay dropAnimation={null}>
            {draggedCategory && (
              <div className="flex items-center gap-1.5 rounded-md bg-[#1a1a1a] border border-white/[0.12] px-2 py-1.5 shadow-xl">
                <FolderSimple
                  size={13}
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
              size={13}
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
      </div>
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

  /* ── Empty state ── */
  if (!category) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <FolderOpen
            size={32}
            className="mx-auto mb-3 text-muted-foreground/20"
            weight="thin"
          />
          <p className="text-sm text-muted-foreground/40">
            Select a category
          </p>
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
   MAIN: 2-Panel Layout
   ══════════════════════════════════════════════════════════ */

export function WikiCategoryPage({
  categoryId,
  onOpenArticle,
  onNavigateCategory,
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
      <TreePanel
        categories={wikiCategories}
        selectedId={selectedCatId}
        onSelect={handleSelect}
      />
      <DetailPanel
        categoryId={selectedCatId}
        categories={wikiCategories}
        articles={wikiArticles}
        onSelect={handleSelect}
        onOpenArticle={onOpenArticle}
      />
    </div>
  )
}
