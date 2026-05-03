"use client"

import { useState, useMemo, useCallback, memo } from "react"
import {
  DndContext,
  DragOverlay,
  useDroppable,
  useDraggable,
  PointerSensor,
  KeyboardSensor,
  useSensors,
  useSensor,
} from "@dnd-kit/core"
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core"
import { SortableContext, horizontalListSortingStrategy, arrayMove, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Link as PhLink } from "@phosphor-icons/react/dist/ssr/Link"
import { Eye } from "@phosphor-icons/react/dist/ssr/Eye"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { cn } from "@/lib/utils"
import { shortRelative } from "@/lib/format-utils"
import { isWikiStub } from "@/lib/wiki-utils"
import { usePlotStore } from "@/lib/store"
import { WIKI_STATUS_HEX } from "@/lib/colors"
import { IconWikiStub, IconWikiArticle } from "@/components/plot-icons"
import type { WikiArticle, WikiCategory } from "@/lib/types"
import type { GroupBy, ViewState } from "@/lib/view-engine/types"
import type { WikiGroup } from "@/lib/view-engine/wiki-list-pipeline"

/* ─────────────────────────────────────────────────────────
 * WikiBoard — board view for wiki articles
 *
 * Differences vs NotesBoard (1139 lines):
 *   - Article-typed (not Note). Reads from wiki-articles slice.
 *   - Multi-membership for "label" (Category) groupBy: an article with
 *     N categoryIds appears as N distinct cards keyed `${id}::${groupKey}`.
 *   - Drag semantics depend on groupBy:
 *       label   → categoryIds add (drop column added; source column removed)
 *       parent  → setWikiArticleParent
 *       tier/role/linkCount/family/none → drag disabled (derived dimensions)
 *   - No status field on article (isWikiStub is runtime-derived) → drag for
 *     status grouping is not exposed; wiki uses "label/parent/tier/linkCount/role/family".
 *   - Compact Linear-style cards: title + stub badge + backlinks + reads + relative date.
 * ───────────────────────────────────────────────────────── */

const COLUMN_CARD_LIMIT = 50

interface WikiBoardProps {
  groups: WikiGroup[]
  groupBy: GroupBy
  viewState: ViewState
  visibleColumns?: string[]
  wikiCategories: WikiCategory[]
  backlinkCounts: Map<string, number>
  selectedIds: Set<string>
  activeArticleId?: string | null
  onOpenArticle: (id: string) => void
  onSelect?: (id: string, opts: { multi?: boolean; shift?: boolean; index?: number }) => void
  onUpdateViewState: (patch: Partial<ViewState>) => void
}

/* ── Column ──────────────────────────────────────────── */

function BoardColumn({
  group,
  groupBy,
  children,
  isDragDisabled,
  activeDragId,
}: {
  group: WikiGroup
  groupBy: GroupBy
  children: React.ReactNode
  isDragDisabled: boolean
  activeDragId: string | null
}) {
  const {
    setNodeRef: setSortableRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `col-${group.key}`, disabled: false })

  const { setNodeRef: setDropRef, isOver: isCardOver } = useDroppable({
    id: group.key,
    disabled: isDragDisabled,
  })

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={(node) => {
        setSortableRef(node)
        setDropRef(node)
      }}
      style={sortableStyle}
      className={cn(
        "flex w-[260px] shrink-0 flex-col rounded-lg border border-border-subtle transition-colors",
        isCardOver ? "bg-accent/8 ring-1 ring-accent/30" : "bg-secondary/40",
      )}
    >
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <span className="text-note font-semibold text-foreground truncate">{group.label || "Untitled"}</span>
        <span className="text-2xs text-muted-foreground">{group.articles.length}</span>
      </div>
      {isCardOver && activeDragId && !activeDragId.startsWith("col-") && !isDragDisabled && (
        <div className="mx-1.5 mb-1 rounded-md bg-accent/10 px-2.5 py-1.5 text-center text-2xs font-medium text-accent">
          Move here
        </div>
      )}
      <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-1.5 pb-1.5 max-h-[calc(100vh-200px)]">
        {children}
      </div>
    </div>
  )
}

/* ── Card ────────────────────────────────────────────── */

interface CardProps {
  article: WikiArticle
  cardKey: string
  backlinks: number
  isStub: boolean
  isActive: boolean
  isSelected: boolean
  isDragOverlay?: boolean
  isDragDisabled: boolean
  visibleColumns?: string[]
  wikiCategories: WikiCategory[]
  groupBy: GroupBy
  onClick: () => void
  onSelect?: (id: string, e: React.MouseEvent) => void
}

function CardInner({
  article,
  cardKey,
  backlinks,
  isStub,
  isActive,
  isSelected,
  isDragOverlay,
  isDragDisabled,
  visibleColumns,
  wikiCategories,
  groupBy,
  onClick,
  onSelect,
}: CardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: cardKey,
    disabled: isDragDisabled || isDragOverlay,
  })

  const dragStyle = transform
    ? { transform: CSS.Transform.toString(transform), opacity: isDragging ? 0.5 : 1, touchAction: "none" as const }
    : { touchAction: "none" as const }

  const showStatus = !visibleColumns || visibleColumns.includes("status")
  const showLinks = !visibleColumns || visibleColumns.includes("links")
  const showReads = !visibleColumns || visibleColumns.includes("reads")
  const showUpdated = !visibleColumns || visibleColumns.includes("updatedAt")
  const showCategories = (!visibleColumns || visibleColumns.includes("tags")) && groupBy !== "label"

  const categoryNames = useMemo(() => {
    if (!showCategories) return []
    const ids = article.categoryIds ?? []
    return ids
      .map((id) => wikiCategories.find((c) => c.id === id)?.name)
      .filter((n): n is string => !!n)
      .slice(0, 2)
  }, [article.categoryIds, wikiCategories, showCategories])

  const reads = article.reads ?? 0

  const visual = (
    <div
      data-wiki-board-card
      data-article-id={article.id}
      onClick={(e) => {
        if (isDragOverlay) return
        if (onSelect && (e.metaKey || e.ctrlKey || e.shiftKey)) {
          e.stopPropagation()
          onSelect(article.id, e)
          return
        }
        onClick()
      }}
      className={cn(
        "group relative cursor-pointer rounded-md border bg-card shadow-sm p-2.5 transition-all hover:border-muted-foreground/30",
        isSelected
          ? "border-accent/50 bg-accent/5 ring-1 ring-accent/20"
          : isActive
            ? "border-accent ring-1 ring-accent/30"
            : "border-border",
        isDragOverlay && "shadow-lg rotate-[2deg]",
        isDragging && "opacity-50",
      )}
    >
      {/* Title row — uses IconWikiStub / IconWikiArticle (status-specific
          icons defined in components/plot-icons.tsx). The wiki entity icon
          (BookOpen, used in activity bar / sidebar) is reserved for entity-
          level surfaces; here we want stub-vs-article differentiation, so
          the dedicated status icons are correct. Color from WIKI_STATUS_HEX. */}
      <div className="flex items-start gap-2">
        {showStatus && (
          isStub ? (
            <IconWikiStub className="shrink-0 mt-0.5" size={12} style={{ color: WIKI_STATUS_HEX.stub }} />
          ) : (
            <IconWikiArticle className="shrink-0 mt-0.5" size={12} style={{ color: WIKI_STATUS_HEX.article }} />
          )
        )}
        <span className="flex-1 truncate text-ui font-medium text-foreground leading-snug">
          {article.title || "Untitled"}
        </span>
      </div>

      {/* Bottom meta row */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {showStatus && (
          <span
            className="rounded-sm px-1.5 py-0.5 text-2xs font-medium"
            style={{
              color: isStub ? WIKI_STATUS_HEX.stub : WIKI_STATUS_HEX.article,
              backgroundColor: `${isStub ? WIKI_STATUS_HEX.stub : WIKI_STATUS_HEX.article}1a`,
            }}
          >
            {isStub ? "Stub" : "Article"}
          </span>
        )}
        {showLinks && backlinks > 0 && (
          <span className="flex items-center gap-0.5 text-2xs text-muted-foreground">
            <PhLink size={10} weight="regular" />
            {backlinks}
          </span>
        )}
        {showReads && reads > 0 && (
          <span className="flex items-center gap-0.5 text-2xs text-muted-foreground">
            <Eye size={10} weight="regular" />
            {reads}
          </span>
        )}
        {showCategories && categoryNames.length > 0 && (
          <span className="truncate rounded-sm bg-secondary px-1.5 py-0.5 text-2xs font-medium text-muted-foreground">
            {categoryNames.join(", ")}
          </span>
        )}
        {showUpdated && (
          <span className="ml-auto text-2xs text-muted-foreground/70">
            {shortRelative(article.updatedAt)}
          </span>
        )}
      </div>
    </div>
  )

  if (isDragOverlay) return visual

  return (
    <div ref={setNodeRef} style={dragStyle} {...attributes} {...listeners} data-drag-id={cardKey}>
      {visual}
    </div>
  )
}

const Card = memo(CardInner, (prev, next) =>
  prev.article.id === next.article.id &&
  prev.article.updatedAt === next.article.updatedAt &&
  prev.article.title === next.article.title &&
  prev.article.reads === next.article.reads &&
  prev.cardKey === next.cardKey &&
  prev.backlinks === next.backlinks &&
  prev.isStub === next.isStub &&
  prev.isActive === next.isActive &&
  prev.isSelected === next.isSelected &&
  prev.groupBy === next.groupBy &&
  prev.isDragDisabled === next.isDragDisabled,
)

/* ── Drag rules ──────────────────────────────────────── */

/** Whether drag-to-reassign is enabled for this groupBy. */
function isGroupDragDisabled(groupBy: GroupBy): boolean {
  // Only "label" (Category) and "parent" can be reassigned via drag.
  // Other groupings are derived (tier/linkCount/role/family) or trivial (none).
  return groupBy !== "label" && groupBy !== "parent"
}

/* ── WikiBoard ───────────────────────────────────────── */

export function WikiBoard({
  groups,
  groupBy,
  viewState,
  visibleColumns,
  wikiCategories,
  backlinkCounts,
  selectedIds,
  activeArticleId,
  onOpenArticle,
  onSelect,
  onUpdateViewState,
}: WikiBoardProps) {
  const updateWikiArticle = usePlotStore((s) => s.updateWikiArticle)
  const setWikiArticleParent = usePlotStore((s) => s.setWikiArticleParent)

  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const isColumnDrag = activeDragId?.startsWith("col-") ?? false
  const activeArticleFromDrag = useMemo(() => {
    if (!activeDragId || isColumnDrag) return null
    // cardKey = `${articleId}::${groupKey}` — extract articleId
    const [articleId] = activeDragId.split("::")
    for (const g of groups) {
      const found = g.articles.find((a) => a.id === articleId)
      if (found) return found
    }
    return null
  }, [activeDragId, isColumnDrag, groups])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  )

  const isDragDisabled = isGroupDragDisabled(groupBy)

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over) {
        setActiveDragId(null)
        return
      }
      const activeId = active.id as string
      const overId = over.id as string

      // ── Column reorder ──
      if (activeId.startsWith("col-") && overId.startsWith("col-")) {
        const activeKey = activeId.replace("col-", "")
        const overKey = overId.replace("col-", "")
        if (activeKey !== overKey) {
          const currentOrder = groups.map((g) => g.key)
          const oldIndex = currentOrder.indexOf(activeKey)
          const newIndex = currentOrder.indexOf(overKey)
          if (oldIndex !== -1 && newIndex !== -1) {
            const newOrder = arrayMove(currentOrder, oldIndex, newIndex)
            onUpdateViewState({
              groupOrder: {
                ...(viewState.groupOrder ?? {}),
                [groupBy]: newOrder,
              },
            })
          }
        }
        setActiveDragId(null)
        return
      }

      // ── Card drag ──
      if (isDragDisabled) {
        setActiveDragId(null)
        return
      }

      // cardKey format: `${articleId}::${sourceGroupKey}`
      const [articleId, sourceGroupKey] = activeId.split("::")
      if (!articleId) {
        setActiveDragId(null)
        return
      }
      const targetGroupKey = overId
      if (sourceGroupKey === targetGroupKey) {
        setActiveDragId(null)
        return
      }

      if (groupBy === "label") {
        // label group key format: `label-${categoryId}` or `_no_label`
        const targetCatId = targetGroupKey.startsWith("label-")
          ? targetGroupKey.slice("label-".length)
          : null
        const sourceCatId =
          sourceGroupKey && sourceGroupKey.startsWith("label-")
            ? sourceGroupKey.slice("label-".length)
            : null

        // Find article in current groups (multi-membership: any occurrence is fine)
        let article: WikiArticle | null = null
        for (const g of groups) {
          const f = g.articles.find((a) => a.id === articleId)
          if (f) {
            article = f
            break
          }
        }
        if (!article) {
          setActiveDragId(null)
          return
        }

        const current = new Set(article.categoryIds ?? [])
        // Remove source category if known and target is different
        if (sourceCatId) current.delete(sourceCatId)
        // Add target category (skip when dropping into _no_label = remove only)
        if (targetCatId) current.add(targetCatId)
        updateWikiArticle(articleId, { categoryIds: Array.from(current) })
      } else if (groupBy === "parent") {
        // parent group key format: `parent-${parentArticleId}` or `_no_parent`
        const targetParentId = targetGroupKey.startsWith("parent-")
          ? targetGroupKey.slice("parent-".length)
          : null
        setWikiArticleParent(articleId, targetParentId)
      }

      setActiveDragId(null)
    },
    [groupBy, groups, isDragDisabled, viewState.groupOrder, onUpdateViewState, updateWikiArticle, setWikiArticleParent],
  )

  // Empty-state
  const totalArticles = groups.reduce((sum, g) => sum + g.articles.length, 0)
  if (totalArticles === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-center">
        <div>
          <FileText className="mx-auto mb-3 text-muted-foreground/70" size={40} weight="regular" />
          <p className="text-ui text-muted-foreground">No articles found</p>
          <p className="mt-1 text-note text-muted-foreground/60">
            {viewState.filters.length > 0 ? "Try adjusting your filters." : "Create your first wiki article."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex flex-1 gap-3 overflow-x-auto px-5 py-4">
          <SortableContext
            items={groups.map((g) => `col-${g.key}`)}
            strategy={horizontalListSortingStrategy}
          >
            {groups.map((group) => {
              if (group.articles.length === 0 && !viewState.showEmptyGroups) return null
              const visibleArticles = group.articles.slice(0, COLUMN_CARD_LIMIT)
              const hidden = group.articles.length - visibleArticles.length

              return (
                <BoardColumn
                  key={group.key}
                  group={group}
                  groupBy={groupBy}
                  isDragDisabled={isDragDisabled}
                  activeDragId={activeDragId}
                >
                  {visibleArticles.map((article) => {
                    const cardKey = `${article.id}::${group.key}`
                    return (
                      <Card
                        key={cardKey}
                        article={article}
                        cardKey={cardKey}
                        backlinks={backlinkCounts.get(article.id) ?? 0}
                        isStub={isWikiStub(article)}
                        isActive={activeArticleId === article.id}
                        isSelected={selectedIds.has(article.id)}
                        isDragDisabled={isDragDisabled}
                        visibleColumns={visibleColumns}
                        wikiCategories={wikiCategories}
                        groupBy={groupBy}
                        onClick={() => onOpenArticle(article.id)}
                        onSelect={(id, e) => onSelect?.(id, { multi: e.metaKey || e.ctrlKey, shift: e.shiftKey })}
                      />
                    )
                  })}
                  {hidden > 0 && (
                    <div className="px-2.5 py-1.5 text-2xs text-muted-foreground/70">
                      +{hidden} more
                    </div>
                  )}
                </BoardColumn>
              )
            })}
          </SortableContext>

          <DragOverlay dropAnimation={null}>
            {activeArticleFromDrag && (
              <Card
                article={activeArticleFromDrag}
                cardKey={`overlay-${activeArticleFromDrag.id}`}
                backlinks={backlinkCounts.get(activeArticleFromDrag.id) ?? 0}
                isStub={isWikiStub(activeArticleFromDrag)}
                isActive={false}
                isSelected={false}
                isDragOverlay
                isDragDisabled
                visibleColumns={visibleColumns}
                wikiCategories={wikiCategories}
                groupBy={groupBy}
                onClick={() => {}}
              />
            )}
          </DragOverlay>
        </div>
      </DndContext>
    </div>
  )
}
