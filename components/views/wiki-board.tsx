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
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { cn } from "@/lib/utils"
import { isWikiStub } from "@/lib/wiki-utils"
import { usePlotStore } from "@/lib/store"
import { WIKI_STATUS_HEX } from "@/lib/colors"
import { IconWikiStub, IconWikiArticle } from "@/components/plot-icons"
import {
  LinksChip,
  ReadsChip,
  CategoryChip,
  UpdatedChip,
  CreatedChip,
  ParentChip,
  ChildrenChip,
  AliasesChip,
  PinnedChip,
  PropertyChipRow,
} from "@/components/property-chips"
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
  /** Resolved parent article title (lookup done once at the parent). */
  parentTitle?: string
  /** Direct child article count (memoized lookup at the parent). */
  childrenCount?: number
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
  parentTitle,
  childrenCount,
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

  // Display Property gates — undefined visibleColumns = show all (back-compat)
  const isVisible = (key: string) => !visibleColumns || visibleColumns.includes(key)
  const showStatus = isVisible("status")

  // Resolve every category to {name, color} so CategoryChip can colour them.
  // PropertyChipRow caps the visible count, so we don't pre-slice here.
  const categoryEntries = useMemo(() => {
    const ids = article.categoryIds ?? []
    if (ids.length === 0) return []
    return ids
      .map((id) => {
        const c = wikiCategories.find((wc) => wc.id === id)
        return c ? { id, name: c.name, color: c.color } : null
      })
      .filter((c): c is { id: string; name: string; color: string } => !!c)
  }, [article.categoryIds, wikiCategories])

  const reads = article.reads ?? 0
  const aliases = article.aliases ?? []

  // Build the property chip row. Order: identity (categories) →
  // hierarchy (parent/children) → numeric (links/reads) → meta (aliases) →
  // time. Status chip stays in the title row (visual anchor).
  const propertyChips = useMemo(() => {
    const out: React.ReactNode[] = []
    // Categories — only when we're not already grouped by category (label).
    if (isVisible("tags") && groupBy !== "label" && categoryEntries.length > 0) {
      for (const c of categoryEntries) {
        out.push(<CategoryChip key={`cat-${c.id}`} name={c.name} color={c.color} />)
      }
    }
    if (
      parentTitle &&
      isVisible("parent") &&
      groupBy !== "parent"
    ) {
      out.push(<ParentChip key="parent" title={parentTitle} />)
    }
    if (isVisible("children") && (childrenCount ?? 0) > 0) {
      out.push(<ChildrenChip key="children" count={childrenCount!} />)
    }
    if (isVisible("links") && backlinks > 0) {
      out.push(<LinksChip key="links" count={backlinks} />)
    }
    if (isVisible("reads") && reads > 0) {
      out.push(<ReadsChip key="reads" count={reads} />)
    }
    if (isVisible("aliases") && aliases.length > 0) {
      out.push(<AliasesChip key="aliases" count={aliases.length} />)
    }
    if (isVisible("updatedAt")) {
      out.push(<UpdatedChip key="updated" iso={article.updatedAt} />)
    }
    if (isVisible("createdAt")) {
      out.push(<CreatedChip key="created" iso={article.createdAt} />)
    }
    return out
  }, [
    visibleColumns, groupBy, categoryEntries, parentTitle, childrenCount,
    backlinks, reads, aliases.length, article.updatedAt, article.createdAt,
  ]) // eslint-disable-line react-hooks/exhaustive-deps

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
          icons defined in components/plot-icons.tsx). Pinned shows on the
          right (Linear identity pattern). The status chip lives below in
          the property row so the title gets full width. */}
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
        {article.pinned && <PinnedChip />}
      </div>

      {/* Status chip + property row. Status keeps its own slot so it stays
          anchored to the left even when other chips overflow. */}
      {(showStatus || propertyChips.length > 0) && (
        <div className="mt-2 flex items-center gap-1 min-w-0">
          {showStatus && (
            <span
              className="inline-flex items-center h-5 rounded-sm px-1.5 text-2xs font-medium leading-none whitespace-nowrap shrink-0"
              style={{
                color: isStub ? WIKI_STATUS_HEX.stub : WIKI_STATUS_HEX.article,
                backgroundColor: `${isStub ? WIKI_STATUS_HEX.stub : WIKI_STATUS_HEX.article}1a`,
              }}
            >
              {isStub ? "Stub" : "Article"}
            </span>
          )}
          {propertyChips.length > 0 && (
            <PropertyChipRow chips={propertyChips} maxVisible={3} />
          )}
        </div>
      )}
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
  prev.article.createdAt === next.article.createdAt &&
  prev.article.title === next.article.title &&
  prev.article.reads === next.article.reads &&
  // PR e: new chip dimensions
  prev.article.aliases === next.article.aliases &&
  prev.article.categoryIds === next.article.categoryIds &&
  prev.article.parentArticleId === next.article.parentArticleId &&
  prev.article.pinned === next.article.pinned &&
  prev.cardKey === next.cardKey &&
  prev.backlinks === next.backlinks &&
  prev.isStub === next.isStub &&
  prev.isActive === next.isActive &&
  prev.isSelected === next.isSelected &&
  prev.groupBy === next.groupBy &&
  prev.isDragDisabled === next.isDragDisabled &&
  prev.visibleColumns === next.visibleColumns &&
  prev.wikiCategories === next.wikiCategories &&
  prev.parentTitle === next.parentTitle &&
  prev.childrenCount === next.childrenCount,
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
  // PR e: subscribe to wiki articles only when we need parent/children
  // resolution for chips. Reading from `groups` would miss articles outside
  // the current view.
  const wikiArticles = usePlotStore((s) => s.wikiArticles) as WikiArticle[]

  // ── Parent / Children lookups for chip rendering ──
  // Computed once per render; pass scalar primitives to each Card so memo
  // comparators can short-circuit.
  const showParentChip = !visibleColumns || visibleColumns.includes("parent")
  const showChildrenChip = !visibleColumns || visibleColumns.includes("children")

  const articlesByIdForParent = useMemo(() => {
    if (!showParentChip) return null
    const m = new Map<string, WikiArticle>()
    for (const a of wikiArticles) m.set(a.id, a)
    return m
  }, [wikiArticles, showParentChip])

  const childrenCountByParent = useMemo(() => {
    if (!showChildrenChip) return null
    const m = new Map<string, number>()
    for (const a of wikiArticles) {
      if (a.parentArticleId) {
        m.set(a.parentArticleId, (m.get(a.parentArticleId) ?? 0) + 1)
      }
    }
    return m
  }, [wikiArticles, showChildrenChip])

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
                        parentTitle={
                          article.parentArticleId
                            ? articlesByIdForParent?.get(article.parentArticleId)?.title
                            : undefined
                        }
                        childrenCount={childrenCountByParent?.get(article.id) ?? 0}
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
                parentTitle={
                  activeArticleFromDrag.parentArticleId
                    ? articlesByIdForParent?.get(activeArticleFromDrag.parentArticleId)?.title
                    : undefined
                }
                childrenCount={childrenCountByParent?.get(activeArticleFromDrag.id) ?? 0}
                onClick={() => {}}
              />
            )}
          </DragOverlay>
        </div>
      </DndContext>
    </div>
  )
}
