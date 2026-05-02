"use client"

import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { usePlotStore } from "@/lib/store"
import type { WikiBlock, NavboxGroup, NavboxItem, NavboxItemTargetType } from "@/lib/types"
import { cn } from "@/lib/utils"
import { CategoryTreePicker } from "./category-tree-picker"
import { setActiveCategoryView } from "@/lib/wiki-view-mode"
import { setActiveRoute } from "@/lib/table-route"
import { navigateToWikiArticle } from "@/lib/wiki-article-nav"
import { WikiPickerDialog } from "@/components/wiki-picker-dialog"
import { NotePickerDialog } from "@/components/note-picker-dialog"
import {
  deriveNavboxGroups,
  makeEmptyGroup,
  makeEmptyItem,
} from "@/lib/wiki-navbox-helpers"
import {
  useNavboxBlockCollapsed,
  useNavboxGroupCollapsed,
} from "@/lib/wiki-navbox-collapse"
import {
  shouldUseLightText,
  navboxForegroundClass,
  navboxBorderTint,
} from "@/lib/wiki-color-contrast"
import { BannerColorPickerPopover } from "@/components/editor/nodes/banner-block-node"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight"
import { Folders } from "@phosphor-icons/react/dist/ssr/Folders"
import { BookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { LinkSimple } from "@phosphor-icons/react/dist/ssr/LinkSimple"
import { PencilSimple } from "@phosphor-icons/react/dist/ssr/PencilSimple"
import { DotsThree } from "@phosphor-icons/react/dist/ssr/DotsThree"
import { DotsSixVertical } from "@phosphor-icons/react/dist/ssr/DotsSixVertical"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { Plus } from "@phosphor-icons/react/dist/ssr/Plus"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { PaintBucket } from "@phosphor-icons/react/dist/ssr/PaintBucket"
import { ArrowUp } from "@phosphor-icons/react/dist/ssr/ArrowUp"
import { ArrowDown } from "@phosphor-icons/react/dist/ssr/ArrowDown"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { DraggableSyntheticListeners } from "@dnd-kit/core"
import { BlockCommentMarker } from "@/components/comments/block-comment-marker"
import { WikiBlockInlineActions } from "./wiki-block-inline-actions"

interface NavboxBlockProps {
  block: WikiBlock
  editable: boolean
  onUpdate: (patch: Partial<WikiBlock>) => void
  onDelete?: () => void
  dragHandleProps?: DraggableSyntheticListeners
  articleId?: string
}

/* ── Constants ───────────────────────────────────────── */

const COLUMN_OPTIONS: Array<1 | 2 | 3 | 4 | 5 | 6> = [2, 3, 4, 5, 6]

/* ── Component ───────────────────────────────────────── */

export function NavboxBlock({
  block,
  editable,
  onUpdate,
  onDelete,
  dragHandleProps,
  articleId,
}: NavboxBlockProps) {
  const router = useRouter()
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const wikiCategories = usePlotStore((s) => s.wikiCategories)
  const notes = usePlotStore((s) => s.notes)
  const setSelectedNoteId = usePlotStore((s) => s.setSelectedNoteId)

  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  /** Track which (groupId | "header") owns an open color picker. */
  const [colorPickerFor, setColorPickerFor] = useState<
    | { kind: "header" }
    | { kind: "group-label"; groupId: string }
    | { kind: "group-items"; groupId: string }
    | null
  >(null)
  /** Open picker dialogs (track which item is being edited). */
  const [pickerState, setPickerState] = useState<
    | { type: "wiki"; groupId: string; itemId: string }
    | { type: "note"; groupId: string; itemId: string }
    | null
  >(null)
  const categoryPickerRef = useRef<HTMLDivElement>(null)

  const mode: "category" | "manual" = block.navboxMode ?? "category"
  const columns = (block.navboxColumns ?? 4) as 1 | 2 | 3 | 4 | 5 | 6

  /* ── Click-outside for category picker ──────────── */
  useEffect(() => {
    if (!categoryPickerOpen) return
    const handler = (e: MouseEvent) => {
      if (
        categoryPickerRef.current &&
        !categoryPickerRef.current.contains(e.target as Node)
      ) {
        setCategoryPickerOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [categoryPickerOpen])

  /* ── Derived navbox groups (back-compat aware) ──── */
  const groups = useMemo<NavboxGroup[]>(() => {
    if (mode === "manual") {
      const derived = deriveNavboxGroups(block)
      // If no groups but legacy single list present, derived gave us one. If
      // both empty, return empty (component will show empty state).
      return derived
    }
    // category mode: build a single virtual group from category articles
    if (!block.navboxCategoryId) return []
    const catId = block.navboxCategoryId
    const categoryArticles = wikiArticles
      .filter((a) => a.categoryIds?.includes(catId))
      .sort((a, b) => a.title.localeCompare(b.title))
    if (categoryArticles.length === 0) return []
    return [
      {
        id: "category",
        label: "",
        labelColor: null,
        itemColor: null,
        collapsedByDefault: false,
        items: categoryArticles.map((a) => ({
          id: a.id,
          label: a.title,
          targetType: "wiki" as const,
          targetId: a.id,
          url: null,
        })),
      },
    ]
  }, [mode, block, wikiArticles])

  /* ── Mutators (manual mode only) ────────────────── */

  const persistGroups = useCallback(
    (next: NavboxGroup[]) => {
      // Persist new shape AND clear legacy field so we don't dual-author.
      onUpdate({
        navboxGroups: next,
        navboxArticleIds: undefined,
      })
    },
    [onUpdate],
  )

  const updateGroup = useCallback(
    (groupId: string, patch: Partial<NavboxGroup>) => {
      const next = groups.map((g) =>
        g.id === groupId ? { ...g, ...patch } : g,
      )
      persistGroups(next)
    },
    [groups, persistGroups],
  )

  const removeGroup = useCallback(
    (groupId: string) => {
      persistGroups(groups.filter((g) => g.id !== groupId))
    },
    [groups, persistGroups],
  )

  const moveGroup = useCallback(
    (groupId: string, direction: -1 | 1) => {
      const idx = groups.findIndex((g) => g.id === groupId)
      if (idx < 0) return
      const target = idx + direction
      if (target < 0 || target >= groups.length) return
      const next = [...groups]
      ;[next[idx], next[target]] = [next[target], next[idx]]
      persistGroups(next)
    },
    [groups, persistGroups],
  )

  const addGroup = useCallback(() => {
    persistGroups([...groups, makeEmptyGroup()])
  }, [groups, persistGroups])

  const addItem = useCallback(
    (groupId: string, partial?: Partial<NavboxItem>) => {
      const next = groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              items: [
                ...g.items,
                { ...makeEmptyItem(partial?.targetType ?? "wiki"), ...partial },
              ],
            }
          : g,
      )
      persistGroups(next)
    },
    [groups, persistGroups],
  )

  const updateItem = useCallback(
    (groupId: string, itemId: string, patch: Partial<NavboxItem>) => {
      const next = groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              items: g.items.map((it) =>
                it.id === itemId ? { ...it, ...patch } : it,
              ),
            }
          : g,
      )
      persistGroups(next)
    },
    [groups, persistGroups],
  )

  const removeItem = useCallback(
    (groupId: string, itemId: string) => {
      const next = groups.map((g) =>
        g.id === groupId
          ? { ...g, items: g.items.filter((it) => it.id !== itemId) }
          : g,
      )
      persistGroups(next)
    },
    [groups, persistGroups],
  )

  const moveItem = useCallback(
    (groupId: string, itemId: string, direction: -1 | 1) => {
      const next = groups.map((g) => {
        if (g.id !== groupId) return g
        const idx = g.items.findIndex((it) => it.id === itemId)
        if (idx < 0) return g
        const target = idx + direction
        if (target < 0 || target >= g.items.length) return g
        const items = [...g.items]
        ;[items[idx], items[target]] = [items[target], items[idx]]
        return { ...g, items }
      })
      persistGroups(next)
    },
    [groups, persistGroups],
  )

  /* ── Item navigation (read mode) ────────────────── */

  const handleItemClick = useCallback(
    (item: NavboxItem) => {
      if (editable) return
      const t = item.targetType ?? "wiki"
      if (t === "wiki" && item.targetId) {
        navigateToWikiArticle(item.targetId)
      } else if (t === "note" && item.targetId) {
        setSelectedNoteId(item.targetId)
      } else if (t === "url" && item.url) {
        if (typeof window !== "undefined") {
          window.open(item.url, "_blank", "noopener,noreferrer")
        }
      }
    },
    [editable, setSelectedNoteId],
  )

  /* ── Category mode helpers ──────────────────────── */
  const category = useMemo(
    () =>
      block.navboxCategoryId
        ? wikiCategories.find((c) => c.id === block.navboxCategoryId)
        : null,
    [wikiCategories, block.navboxCategoryId],
  )

  const handleCategorySelect = useCallback(
    (catId: string) => {
      onUpdate({ navboxCategoryId: catId })
      setCategoryPickerOpen(false)
    },
    [onUpdate],
  )

  const handleCategoryHeaderClick = useCallback(() => {
    if (!category) return
    setSelectedNoteId(null)
    setActiveRoute("/wiki")
    setActiveCategoryView(category.id)
    router.push("/wiki")
  }, [category, setSelectedNoteId, router])

  const handleSetMode = useCallback(
    (newMode: "category" | "manual") => {
      onUpdate({ navboxMode: newMode })
    },
    [onUpdate],
  )

  /* ── Picker dialog selection ────────────────────── */
  const handlePickerSelect = useCallback(
    (id: string) => {
      if (!pickerState) return
      const { groupId, itemId, type } = pickerState
      const targetType: NavboxItemTargetType = type === "wiki" ? "wiki" : "note"
      // If the existing item has no label, seed it from the target's title.
      const group = groups.find((g) => g.id === groupId)
      const item = group?.items.find((it) => it.id === itemId)
      let label = item?.label ?? ""
      if (!label.trim()) {
        if (type === "wiki") {
          const article = wikiArticles.find((a) => a.id === id)
          if (article) label = article.title
        } else {
          const note = notes.find((n) => n.id === id)
          if (note) label = note.title
        }
      }
      updateItem(groupId, itemId, { targetType, targetId: id, label })
      setPickerState(null)
    },
    [pickerState, groups, wikiArticles, notes, updateItem],
  )

  /* ── Persistent (whole-box) collapse ─────────────── */
  const [boxCollapsed, toggleBoxCollapsed] = useNavboxBlockCollapsed(
    articleId ?? "_no-article",
    block.id,
    !!block.navboxCollapsedByDefault,
  )

  /* ── Display state ───────────────────────────────── */
  const displayTitle =
    block.navboxTitle ||
    (mode === "category" ? category?.name : undefined) ||
    "Navbox"
  const headerColor = block.navboxHeaderColor ?? null
  const headerImage = block.navboxHeaderImage ?? null
  const headerLight = shouldUseLightText(headerColor)
  const headerFgClass = navboxForegroundClass(headerColor)

  // In manual mode, "unconfigured" means NO groups exist yet. Empty groups
  // (with 0 items) are a valid editable state — user is curating.
  // In read mode, an entirely-empty navbox renders nothing.
  const isUnconfigured =
    mode === "category"
      ? !block.navboxCategoryId
      : groups.length === 0

  const totalItemCount = groups.reduce((sum, g) => sum + g.items.length, 0)

  /* ── Right-side action cluster (shared) ─────────── */
  const dotMenu = (
    <div className="absolute left-full top-1 ml-2 z-10 flex items-center gap-0.5">
      {articleId && (
        <BlockCommentMarker
          anchor={{ kind: "wiki-block", articleId, blockId: block.id }}
        />
      )}
      {articleId && (
        <WikiBlockInlineActions
          articleId={articleId}
          blockId={block.id}
          label={displayTitle || "Navbox"}
        />
      )}
      {editable && (
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen(true)
              }}
              className="opacity-0 group-hover/navbox:opacity-30 hover:!opacity-100 p-1 text-muted-foreground hover:text-foreground transition-all duration-100"
            >
              <DotsThree size={14} weight="bold" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-48 p-1"
            onOpenAutoFocus={(e) => e.preventDefault()}
            style={{ fontSize: "13px" }}
          >
            {onDelete && (
              <button
                onClick={() => {
                  setMenuOpen(false)
                  onDelete()
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-2xs text-destructive hover:bg-active-bg transition-colors"
              >
                <Trash size={14} weight="regular" />
                Delete navbox
              </button>
            )}
          </PopoverContent>
        </Popover>
      )}
    </div>
  )

  /* ── Unconfigured state (no category / empty manual) ─── */
  // Hide entirely-empty navboxes in read mode (no groups, or all groups empty).
  if (!editable && (groups.length === 0 || groups.every((g) => g.items.length === 0))) {
    return null
  }
  if (isUnconfigured) {
    if (!editable) return null
    return (
      <UnconfiguredView
        block={block}
        mode={mode}
        dragHandleProps={dragHandleProps}
        dotMenu={dotMenu}
        categoryPickerOpen={categoryPickerOpen}
        setCategoryPickerOpen={setCategoryPickerOpen}
        categoryPickerRef={categoryPickerRef}
        onSelectCategory={handleCategorySelect}
        onSetMode={handleSetMode}
        onAddGroup={() => {
          // Atomic switch to manual mode + seed first group, in one onUpdate call.
          const seed = makeEmptyGroup()
          onUpdate({
            navboxMode: "manual",
            navboxGroups: [seed],
            navboxArticleIds: undefined,
          })
        }}
      />
    )
  }

  /* ── Configured render ────────────────────────────── */
  return (
    <div className="group/navbox flex items-start gap-1 my-4">
      {editable && (
        <button
          className="mt-2 p-0.5 opacity-0 group-hover/navbox:opacity-30 hover:!opacity-100 cursor-grab shrink-0 text-muted-foreground transition-opacity duration-100"
          {...(dragHandleProps ?? {})}
        >
          <DotsSixVertical size={14} weight="regular" />
        </button>
      )}
      <div className="relative flex-1">
        {dotMenu}
        <div
          className={cn(
            "rounded-lg overflow-hidden",
            "border border-border-subtle bg-card/30",
            "shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
          )}
          style={
            headerColor
              ? { borderColor: navboxBorderTint(headerColor) }
              : undefined
          }
        >
          {/* ── Main header row ── */}
          <div
            className={cn(
              "relative flex items-center gap-3 px-4 py-3 border-b",
              !headerColor && "bg-secondary/40",
              headerLight && "border-black/15",
              !headerLight && "border-border-subtle",
            )}
            style={
              headerColor
                ? { backgroundColor: headerColor }
                : undefined
            }
          >
            {headerImage ? (
              <img
                src={headerImage}
                alt=""
                className="h-7 w-7 rounded-sm object-cover shrink-0"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = "none"
                }}
              />
            ) : (
              <div className={cn("shrink-0", headerFgClass || "text-muted-foreground/70")}>
                {mode === "category" ? (
                  <Folders size={16} weight="regular" />
                ) : (
                  <BookOpen size={16} weight="regular" />
                )}
              </div>
            )}

            <div className="flex-1 min-w-0 flex items-center justify-center">
              {editable && mode === "manual" ? (
                <input
                  type="text"
                  value={block.navboxTitle ?? ""}
                  onChange={(e) => onUpdate({ navboxTitle: e.target.value })}
                  placeholder="Navbox title"
                  className={cn(
                    "w-full bg-transparent text-center text-[calc(1em*var(--scale-misc,1))] font-semibold tracking-tight outline-none placeholder:text-muted-foreground/70 placeholder:font-normal",
                    headerFgClass || "text-foreground",
                  )}
                />
              ) : mode === "category" && category ? (
                <button
                  onClick={handleCategoryHeaderClick}
                  title="Open category page"
                  className={cn(
                    "text-[calc(1em*var(--scale-misc,1))] font-semibold tracking-tight truncate hover:underline transition-colors",
                    headerFgClass || "text-foreground",
                  )}
                >
                  {displayTitle}
                </button>
              ) : (
                <span
                  className={cn(
                    "text-[calc(1em*var(--scale-misc,1))] font-semibold tracking-tight truncate",
                    headerFgClass || "text-foreground",
                  )}
                >
                  {displayTitle}
                </span>
              )}
            </div>

            {/* Right side: count + edit affordances */}
            <div className="flex items-center gap-1 shrink-0">
              {!editable && totalItemCount > 0 && (
                <span
                  className={cn(
                    "text-2xs",
                    headerLight ? "text-white/70" : "text-muted-foreground/60",
                  )}
                >
                  {totalItemCount}
                </span>
              )}
              {editable && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setColorPickerFor(
                        colorPickerFor?.kind === "header"
                          ? null
                          : { kind: "header" },
                      )
                    }}
                    title="Header color"
                    className={cn(
                      "p-1 rounded transition-colors",
                      headerLight
                        ? "text-white/70 hover:text-white hover:bg-white/10"
                        : "text-muted-foreground/60 hover:text-foreground hover:bg-hover-bg",
                    )}
                  >
                    <PaintBucket size={12} weight="regular" />
                  </button>
                  {mode === "category" && (
                    <div className="relative" ref={categoryPickerRef}>
                      <button
                        onClick={() => setCategoryPickerOpen(!categoryPickerOpen)}
                        title="Change category"
                        className={cn(
                          "p-1 rounded transition-colors",
                          headerLight
                            ? "text-white/70 hover:text-white hover:bg-white/10"
                            : "text-muted-foreground/60 hover:text-foreground hover:bg-hover-bg",
                        )}
                      >
                        <PencilSimple size={12} weight="regular" />
                      </button>
                      {categoryPickerOpen && (
                        <div className="absolute right-0 top-full mt-1.5 z-50">
                          <CategoryTreePicker
                            mode="single"
                            selectedIds={
                              block.navboxCategoryId
                                ? [block.navboxCategoryId]
                                : []
                            }
                            onSelect={handleCategorySelect}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
              <button
                onClick={() => toggleBoxCollapsed()}
                title={boxCollapsed ? "Expand" : "Collapse"}
                className={cn(
                  "p-1 rounded transition-colors",
                  headerLight
                    ? "text-white/70 hover:text-white hover:bg-white/10"
                    : "text-muted-foreground/60 hover:text-foreground hover:bg-hover-bg",
                )}
              >
                <CaretDown
                  size={12}
                  weight="bold"
                  className={cn(
                    "transition-transform",
                    boxCollapsed && "-rotate-90",
                  )}
                />
              </button>
            </div>

            {colorPickerFor?.kind === "header" && (
              <BannerColorPickerPopover
                bgColor={headerColor}
                onPick={(value) => onUpdate({ navboxHeaderColor: value })}
                onClose={() => setColorPickerFor(null)}
              />
            )}
          </div>

          {/* ── Mode + columns toolbar (edit only) ── */}
          {editable && (
            <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-secondary/15 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <div className="inline-flex rounded bg-secondary/40 p-0.5">
                  <button
                    onClick={() => handleSetMode("category")}
                    className={cn(
                      "px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors",
                      mode === "category"
                        ? "bg-accent/20 text-accent"
                        : "text-muted-foreground/60 hover:text-foreground",
                    )}
                  >
                    Auto
                  </button>
                  <button
                    onClick={() => handleSetMode("manual")}
                    className={cn(
                      "px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors",
                      mode === "manual"
                        ? "bg-accent/20 text-accent"
                        : "text-muted-foreground/60 hover:text-foreground",
                    )}
                  >
                    Manual
                  </button>
                </div>
                {/* Header image URL (manual mode) */}
                {mode === "manual" && (
                  <input
                    type="text"
                    value={headerImage ?? ""}
                    onChange={(e) =>
                      onUpdate({ navboxHeaderImage: e.target.value || null })
                    }
                    placeholder="Header image URL (optional)"
                    className="flex-1 max-w-[260px] bg-secondary/30 rounded px-2 py-0.5 text-2xs text-foreground/80 outline-none placeholder:text-muted-foreground/70 focus:bg-secondary/60"
                  />
                )}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground/60">cols</span>
                <div className="inline-flex rounded bg-secondary/40 p-0.5">
                  {COLUMN_OPTIONS.map((c) => (
                    <button
                      key={c}
                      onClick={() => onUpdate({ navboxColumns: c })}
                      className={cn(
                        "w-5 h-5 text-[10px] font-medium rounded transition-colors",
                        columns === c
                          ? "bg-accent/20 text-accent"
                          : "text-muted-foreground/60 hover:text-foreground",
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Whole-box toggle row (read mode only) ── */}
          {!editable && groups.length > 0 && (
            <button
              onClick={() => toggleBoxCollapsed()}
              className="w-full flex items-center justify-center gap-1 py-1 text-[10px] tracking-wide text-muted-foreground/60 hover:text-foreground hover:bg-hover-bg transition-colors border-b border-border-subtle"
            >
              {boxCollapsed ? "[Expand]" : "[Collapse]"}
            </button>
          )}

          {/* ── Body: groups ── */}
          {!boxCollapsed && (
            <div>
              {groups.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground/70">
                  {mode === "category"
                    ? "No articles in this category yet."
                    : "No items yet."}
                </div>
              ) : (
                groups.map((group, gi) => (
                  <NavboxGroupRow
                    key={group.id}
                    group={group}
                    columns={columns}
                    editable={editable}
                    articleId={articleId ?? "_no-article"}
                    blockId={block.id}
                    canMoveUp={gi > 0}
                    canMoveDown={gi < groups.length - 1}
                    isSingleVirtualGroup={mode === "category"}
                    activeColorPicker={colorPickerFor}
                    setActiveColorPicker={setColorPickerFor}
                    onUpdateGroup={(patch) => updateGroup(group.id, patch)}
                    onRemoveGroup={() => removeGroup(group.id)}
                    onMoveGroup={(dir) => moveGroup(group.id, dir)}
                    onAddItem={(partial) => addItem(group.id, partial)}
                    onUpdateItem={(itemId, patch) =>
                      updateItem(group.id, itemId, patch)
                    }
                    onRemoveItem={(itemId) => removeItem(group.id, itemId)}
                    onMoveItem={(itemId, dir) => moveItem(group.id, itemId, dir)}
                    onItemClick={handleItemClick}
                    onOpenPicker={(itemId, type) =>
                      setPickerState({ type, groupId: group.id, itemId })
                    }
                    wikiArticles={wikiArticles}
                    notes={notes}
                  />
                ))
              )}

              {/* Add-group button (manual edit only) */}
              {editable && mode === "manual" && (
                <button
                  onClick={addGroup}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-2xs text-muted-foreground/60 hover:text-foreground hover:bg-hover-bg transition-colors border-t border-dashed border-border-subtle"
                >
                  <Plus size={12} weight="bold" />
                  Add group
                </button>
              )}

              {/* Footer text */}
              {(block.navboxFooterText || editable) && mode === "manual" && (
                <div className="px-3 py-1.5 text-center text-2xs text-muted-foreground/60 border-t border-border-subtle bg-secondary/10">
                  {editable ? (
                    <input
                      type="text"
                      value={block.navboxFooterText ?? ""}
                      onChange={(e) =>
                        onUpdate({ navboxFooterText: e.target.value })
                      }
                      placeholder="Footer caption (e.g. classification breadcrumbs)"
                      className="w-full bg-transparent text-center outline-none placeholder:text-muted-foreground/60"
                    />
                  ) : (
                    <span>{block.navboxFooterText}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pickers */}
      {pickerState?.type === "wiki" && (
        <WikiPickerDialog
          open
          onOpenChange={(open) => !open && setPickerState(null)}
          title="Select wiki article"
          onSelect={handlePickerSelect}
        />
      )}
      {pickerState?.type === "note" && (
        <NotePickerDialog
          open
          onOpenChange={(open) => !open && setPickerState(null)}
          title="Select note"
          onSelect={handlePickerSelect}
        />
      )}
    </div>
  )
}

/* ── Unconfigured (empty / first-time) view ────────── */

function UnconfiguredView({
  block,
  mode,
  dragHandleProps,
  dotMenu,
  categoryPickerOpen,
  setCategoryPickerOpen,
  categoryPickerRef,
  onSelectCategory,
  onSetMode,
  onAddGroup,
}: {
  block: WikiBlock
  mode: "category" | "manual"
  dragHandleProps?: DraggableSyntheticListeners
  dotMenu: React.ReactNode
  categoryPickerOpen: boolean
  setCategoryPickerOpen: (b: boolean) => void
  categoryPickerRef: React.RefObject<HTMLDivElement | null>
  onSelectCategory: (catId: string) => void
  onSetMode: (m: "category" | "manual") => void
  onAddGroup: () => void
}) {
  return (
    <div className="group/navbox flex items-center gap-1 my-4">
      <button
        className="p-0.5 opacity-0 group-hover/navbox:opacity-30 hover:!opacity-100 cursor-grab shrink-0 text-muted-foreground transition-opacity duration-100"
        {...(dragHandleProps ?? {})}
      >
        <DotsSixVertical size={14} weight="regular" />
      </button>
      <div className="relative flex-1 rounded-lg border-2 border-dashed border-border-subtle bg-secondary/10 px-4 py-5">
        {dotMenu}
        <div className="flex justify-center mb-3">
          <div className="inline-flex rounded-md bg-secondary/40 p-0.5">
            <button
              onClick={() => onSetMode("category")}
              className={cn(
                "px-2.5 py-1 text-2xs font-medium rounded transition-colors",
                mode === "category"
                  ? "bg-accent/20 text-accent"
                  : "text-muted-foreground/70 hover:text-foreground",
              )}
            >
              <Folders size={11} weight="regular" className="inline mr-1" />
              Category
            </button>
            <button
              onClick={() => onSetMode("manual")}
              className={cn(
                "px-2.5 py-1 text-2xs font-medium rounded transition-colors",
                mode === "manual"
                  ? "bg-accent/20 text-accent"
                  : "text-muted-foreground/70 hover:text-foreground",
              )}
            >
              <BookOpen size={11} weight="regular" className="inline mr-1" />
              Manual
            </button>
          </div>
        </div>
        <div className="flex items-center justify-center">
          {mode === "category" ? (
            <div className="relative" ref={categoryPickerRef}>
              <button
                onClick={() => setCategoryPickerOpen(!categoryPickerOpen)}
                className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm text-muted-foreground hover:bg-hover-bg hover:text-foreground transition-colors"
              >
                <Folders size={16} weight="regular" />
                Pick a category
                <CaretDown size={12} weight="bold" />
              </button>
              {categoryPickerOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50">
                  <CategoryTreePicker
                    mode="single"
                    selectedIds={[]}
                    onSelect={onSelectCategory}
                  />
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onAddGroup}
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm text-muted-foreground hover:bg-hover-bg hover:text-foreground transition-colors"
            >
              <Plus size={16} weight="regular" />
              Add first group
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Single group row ──────────────────────────────────── */

interface NavboxGroupRowProps {
  group: NavboxGroup
  columns: 1 | 2 | 3 | 4 | 5 | 6
  editable: boolean
  articleId: string
  blockId: string
  canMoveUp: boolean
  canMoveDown: boolean
  isSingleVirtualGroup: boolean
  activeColorPicker:
    | { kind: "header" }
    | { kind: "group-label"; groupId: string }
    | { kind: "group-items"; groupId: string }
    | null
  setActiveColorPicker: (
    s:
      | { kind: "header" }
      | { kind: "group-label"; groupId: string }
      | { kind: "group-items"; groupId: string }
      | null,
  ) => void
  onUpdateGroup: (patch: Partial<NavboxGroup>) => void
  onRemoveGroup: () => void
  onMoveGroup: (dir: -1 | 1) => void
  onAddItem: (partial?: Partial<NavboxItem>) => void
  onUpdateItem: (itemId: string, patch: Partial<NavboxItem>) => void
  onRemoveItem: (itemId: string) => void
  onMoveItem: (itemId: string, dir: -1 | 1) => void
  onItemClick: (item: NavboxItem) => void
  onOpenPicker: (itemId: string, type: "wiki" | "note") => void
  wikiArticles: ReturnType<typeof usePlotStore.getState>["wikiArticles"]
  notes: ReturnType<typeof usePlotStore.getState>["notes"]
}

function NavboxGroupRow({
  group,
  columns,
  editable,
  articleId,
  blockId,
  canMoveUp,
  canMoveDown,
  isSingleVirtualGroup,
  activeColorPicker,
  setActiveColorPicker,
  onUpdateGroup,
  onRemoveGroup,
  onMoveGroup,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onMoveItem,
  onItemClick,
  onOpenPicker,
  wikiArticles,
  notes,
}: NavboxGroupRowProps) {
  const labelColor = group.labelColor ?? null
  const itemColor = group.itemColor ?? null
  const labelLight = shouldUseLightText(labelColor)
  const itemLight = shouldUseLightText(itemColor)
  const labelFgClass = navboxForegroundClass(labelColor)
  const itemFgClass = navboxForegroundClass(itemColor)

  const [collapsed, toggleCollapsed] = useNavboxGroupCollapsed(
    articleId,
    blockId,
    group.id,
    !!group.collapsedByDefault,
  )

  const showLabelRow =
    editable || (group.label && group.label.trim().length > 0)

  return (
    <div className="border-b border-border-subtle last:border-b-0">
      {/* Group label row */}
      {showLabelRow && !isSingleVirtualGroup && (
        <div
          className={cn(
            "relative flex items-center gap-2 px-3 py-1.5 transition-colors",
            !labelColor && "bg-secondary/25",
            labelLight && "border-y border-black/10",
          )}
          style={labelColor ? { backgroundColor: labelColor } : undefined}
        >
          <button
            onClick={() => toggleCollapsed()}
            title={collapsed ? "Expand" : "Collapse"}
            className={cn(
              "p-0.5 rounded transition-colors shrink-0",
              labelLight
                ? "text-white/70 hover:text-white hover:bg-white/10"
                : "text-muted-foreground/60 hover:text-foreground hover:bg-hover-bg",
            )}
          >
            {collapsed ? (
              <CaretRight size={11} weight="bold" />
            ) : (
              <CaretDown size={11} weight="bold" />
            )}
          </button>

          <div className="flex-1 min-w-0 flex items-center justify-center">
            {editable ? (
              <input
                type="text"
                value={group.label}
                onChange={(e) => onUpdateGroup({ label: e.target.value })}
                placeholder="Group label (e.g. 초대~제4대)"
                className={cn(
                  "w-full bg-transparent text-center text-xs font-medium tracking-wide outline-none placeholder:font-normal",
                  labelFgClass || "text-foreground",
                  labelLight
                    ? "placeholder:text-white/40"
                    : "placeholder:text-muted-foreground/70",
                )}
              />
            ) : (
              <span
                className={cn(
                  "text-xs font-medium tracking-wide truncate",
                  labelFgClass || "text-foreground",
                )}
              >
                {group.label}
              </span>
            )}
          </div>

          {editable && (
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={() =>
                  setActiveColorPicker(
                    activeColorPicker?.kind === "group-label" &&
                      activeColorPicker.groupId === group.id
                      ? null
                      : { kind: "group-label", groupId: group.id },
                  )
                }
                title="Label color"
                className={cn(
                  "p-1 rounded transition-colors",
                  labelLight
                    ? "text-white/70 hover:text-white hover:bg-white/10"
                    : "text-muted-foreground/60 hover:text-foreground hover:bg-hover-bg",
                )}
              >
                <PaintBucket size={11} weight="regular" />
              </button>
              <button
                onClick={() =>
                  setActiveColorPicker(
                    activeColorPicker?.kind === "group-items" &&
                      activeColorPicker.groupId === group.id
                      ? null
                      : { kind: "group-items", groupId: group.id },
                  )
                }
                title="Item row color"
                className={cn(
                  "p-1 rounded transition-colors",
                  labelLight
                    ? "text-white/70 hover:text-white hover:bg-white/10"
                    : "text-muted-foreground/60 hover:text-foreground hover:bg-hover-bg",
                )}
              >
                <PaintBucket size={11} weight="fill" />
              </button>
              <button
                onClick={() => onMoveGroup(-1)}
                disabled={!canMoveUp}
                title="Move group up"
                className={cn(
                  "p-1 rounded transition-colors",
                  canMoveUp
                    ? labelLight
                      ? "text-white/70 hover:text-white hover:bg-white/10"
                      : "text-muted-foreground/60 hover:text-foreground hover:bg-hover-bg"
                    : "opacity-30 cursor-not-allowed",
                )}
              >
                <ArrowUp size={11} weight="bold" />
              </button>
              <button
                onClick={() => onMoveGroup(1)}
                disabled={!canMoveDown}
                title="Move group down"
                className={cn(
                  "p-1 rounded transition-colors",
                  canMoveDown
                    ? labelLight
                      ? "text-white/70 hover:text-white hover:bg-white/10"
                      : "text-muted-foreground/60 hover:text-foreground hover:bg-hover-bg"
                    : "opacity-30 cursor-not-allowed",
                )}
              >
                <ArrowDown size={11} weight="bold" />
              </button>
              <button
                onClick={onRemoveGroup}
                title="Delete group"
                className={cn(
                  "p-1 rounded transition-colors",
                  labelLight
                    ? "text-white/70 hover:text-red-200 hover:bg-white/10"
                    : "text-muted-foreground/60 hover:text-destructive hover:bg-hover-bg",
                )}
              >
                <Trash size={11} weight="regular" />
              </button>
            </div>
          )}

          {/* Group-level color pickers */}
          {activeColorPicker?.kind === "group-label" &&
            activeColorPicker.groupId === group.id && (
              <BannerColorPickerPopover
                bgColor={labelColor}
                onPick={(value) => onUpdateGroup({ labelColor: value })}
                onClose={() => setActiveColorPicker(null)}
              />
            )}
          {activeColorPicker?.kind === "group-items" &&
            activeColorPicker.groupId === group.id && (
              <BannerColorPickerPopover
                bgColor={itemColor}
                onPick={(value) => onUpdateGroup({ itemColor: value })}
                onClose={() => setActiveColorPicker(null)}
              />
            )}
        </div>
      )}

      {/* Item grid row */}
      {!collapsed && (
        <div
          className={cn(
            "transition-all",
            !itemColor && "bg-card/0",
          )}
          style={itemColor ? { backgroundColor: itemColor } : undefined}
        >
          {group.items.length === 0 && editable ? (
            <div className="px-3 py-3 text-center text-2xs text-muted-foreground/70">
              No items. Use the + button to add.
            </div>
          ) : group.items.length === 0 ? null : (
            <div
              className={cn(
                "grid gap-px p-1",
                editable ? "p-2" : "p-1",
              )}
              style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              }}
            >
              {group.items.map((item, idx) => (
                <NavboxItemCell
                  key={item.id}
                  item={item}
                  editable={editable}
                  itemLight={itemLight}
                  itemFgClass={itemFgClass}
                  hasItemColor={!!itemColor}
                  canMoveUp={idx > 0}
                  canMoveDown={idx < group.items.length - 1}
                  onClick={() => onItemClick(item)}
                  onUpdate={(patch) => onUpdateItem(item.id, patch)}
                  onRemove={() => onRemoveItem(item.id)}
                  onMove={(dir) => onMoveItem(item.id, dir)}
                  onOpenPicker={(type) => onOpenPicker(item.id, type)}
                  wikiArticles={wikiArticles}
                  notes={notes}
                />
              ))}
            </div>
          )}

          {editable && (
            <div className="flex items-center justify-center gap-1 py-1.5 px-2 border-t border-border-subtle">
              <button
                onClick={() => onAddItem({ targetType: "wiki" })}
                className={cn(
                  "inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium transition-colors",
                  itemLight
                    ? "text-white/80 hover:bg-white/10"
                    : "text-muted-foreground/70 hover:text-foreground hover:bg-hover-bg",
                )}
              >
                <BookOpen size={10} weight="regular" />
                + Wiki
              </button>
              <button
                onClick={() => onAddItem({ targetType: "note" })}
                className={cn(
                  "inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium transition-colors",
                  itemLight
                    ? "text-white/80 hover:bg-white/10"
                    : "text-muted-foreground/70 hover:text-foreground hover:bg-hover-bg",
                )}
              >
                <FileText size={10} weight="regular" />
                + Note
              </button>
              <button
                onClick={() => onAddItem({ targetType: "url" })}
                className={cn(
                  "inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium transition-colors",
                  itemLight
                    ? "text-white/80 hover:bg-white/10"
                    : "text-muted-foreground/70 hover:text-foreground hover:bg-hover-bg",
                )}
              >
                <LinkSimple size={10} weight="regular" />
                + URL
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Single item cell ──────────────────────────────────── */

interface NavboxItemCellProps {
  item: NavboxItem
  editable: boolean
  itemLight: boolean
  itemFgClass: string
  hasItemColor: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  onClick: () => void
  onUpdate: (patch: Partial<NavboxItem>) => void
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
  onOpenPicker: (type: "wiki" | "note") => void
  wikiArticles: ReturnType<typeof usePlotStore.getState>["wikiArticles"]
  notes: ReturnType<typeof usePlotStore.getState>["notes"]
}

function NavboxItemCell({
  item,
  editable,
  itemLight,
  itemFgClass,
  hasItemColor,
  canMoveUp,
  canMoveDown,
  onClick,
  onUpdate,
  onRemove,
  onMove,
  onOpenPicker,
  wikiArticles,
  notes,
}: NavboxItemCellProps) {
  const targetType = item.targetType ?? "wiki"

  // Resolve display label + missing-target detection.
  const { resolvedLabel, isMissing } = useMemo(() => {
    if (item.label && item.label.trim()) {
      // Check whether linked target still exists (red-link styling).
      if (targetType === "wiki" && item.targetId) {
        const exists = wikiArticles.some((a) => a.id === item.targetId)
        return { resolvedLabel: item.label, isMissing: !exists }
      }
      if (targetType === "note" && item.targetId) {
        const exists = notes.some((n) => n.id === item.targetId && !n.trashed)
        return { resolvedLabel: item.label, isMissing: !exists }
      }
      if (targetType === "url" && !item.url) {
        return { resolvedLabel: item.label, isMissing: true }
      }
      return { resolvedLabel: item.label, isMissing: false }
    }

    // No explicit label — derive from target.
    if (targetType === "wiki" && item.targetId) {
      const a = wikiArticles.find((x) => x.id === item.targetId)
      return {
        resolvedLabel: a?.title || "(untitled)",
        isMissing: !a,
      }
    }
    if (targetType === "note" && item.targetId) {
      const n = notes.find((x) => x.id === item.targetId && !x.trashed)
      return {
        resolvedLabel: n?.title || "(untitled)",
        isMissing: !n,
      }
    }
    if (targetType === "url" && item.url) {
      return { resolvedLabel: item.url, isMissing: false }
    }
    return { resolvedLabel: "", isMissing: editable ? false : true }
  }, [item, targetType, wikiArticles, notes, editable])

  /* ── Read-only render ── */
  if (!editable) {
    const clickable =
      (targetType === "wiki" || targetType === "note") && !!item.targetId && !isMissing
        ? true
        : targetType === "url" && !!item.url
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={!clickable}
        title={resolvedLabel}
        className={cn(
          "group/item relative flex items-center justify-center px-2 py-1.5 text-[12px] leading-tight transition-colors min-h-[28px]",
          itemFgClass || "text-foreground/85",
          clickable
            ? itemLight
              ? "hover:bg-white/10 cursor-pointer"
              : "hover:bg-hover-bg cursor-pointer"
            : "cursor-default",
          isMissing && "line-through opacity-60",
        )}
      >
        <span className="truncate">{resolvedLabel || "—"}</span>
      </button>
    )
  }

  /* ── Edit render ── */

  // Choose icon by target type.
  const TypeIcon =
    targetType === "wiki"
      ? BookOpen
      : targetType === "note"
        ? FileText
        : LinkSimple

  const cycleType = () => {
    const order: NavboxItemTargetType[] = ["wiki", "note", "url"]
    const idx = order.indexOf(targetType)
    const next = order[(idx + 1) % order.length]
    onUpdate({ targetType: next, targetId: null, url: null })
  }

  return (
    <div
      className={cn(
        "group/item relative flex flex-col gap-0.5 rounded px-1.5 py-1 border border-transparent",
        hasItemColor ? "" : "bg-secondary/10",
        "hover:border-border-subtle transition-colors",
      )}
      style={hasItemColor ? { backgroundColor: "transparent" } : undefined}
    >
      {/* Top row: type cycle button + label input + remove */}
      <div className="flex items-center gap-1">
        <button
          onClick={cycleType}
          title={`Type: ${targetType} (click to cycle)`}
          className={cn(
            "shrink-0 p-0.5 rounded transition-colors",
            itemLight
              ? "text-white/70 hover:text-white hover:bg-white/10"
              : "text-muted-foreground/60 hover:text-foreground hover:bg-hover-bg",
          )}
        >
          <TypeIcon size={10} weight="regular" />
        </button>
        <input
          type="text"
          value={item.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder={
            targetType === "wiki"
              ? "Label (or pick wiki)"
              : targetType === "note"
                ? "Label (or pick note)"
                : "Label"
          }
          className={cn(
            "flex-1 min-w-0 bg-transparent text-[11px] outline-none",
            itemFgClass || "text-foreground",
            itemLight ? "placeholder:text-white/30" : "placeholder:text-muted-foreground/70",
          )}
        />
        <button
          onClick={onRemove}
          title="Remove item"
          className={cn(
            "shrink-0 p-0.5 rounded opacity-0 group-hover/item:opacity-60 hover:!opacity-100 transition-all",
            itemLight
              ? "text-white/70 hover:text-red-200"
              : "text-muted-foreground hover:text-destructive",
          )}
        >
          <PhX size={9} weight="bold" />
        </button>
      </div>

      {/* Bottom row: target details */}
      <div className="flex items-center gap-1">
        {targetType === "wiki" || targetType === "note" ? (
          item.targetId ? (
            <div
              className={cn(
                "flex-1 min-w-0 flex items-center gap-1 rounded px-1 py-0.5 text-[9px]",
                itemLight ? "bg-white/15" : "bg-accent/10",
              )}
            >
              <span
                className={cn(
                  "truncate",
                  itemLight ? "text-white/80" : "text-foreground/70",
                )}
              >
                {targetType === "wiki"
                  ? wikiArticles.find((a) => a.id === item.targetId)?.title ??
                    "(missing)"
                  : notes.find((n) => n.id === item.targetId)?.title ?? "(missing)"}
              </span>
              <button
                onClick={() => onUpdate({ targetId: null })}
                className={cn(
                  "p-0.5 shrink-0",
                  itemLight ? "text-white/60 hover:text-white" : "text-muted-foreground/60 hover:text-destructive",
                )}
              >
                <PhX size={8} weight="bold" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onOpenPicker(targetType)}
              className={cn(
                "flex-1 inline-flex items-center justify-center gap-1 rounded border border-dashed px-1.5 py-0.5 text-[9px] transition-colors",
                itemLight
                  ? "border-white/20 text-white/60 hover:text-white hover:border-white/50"
                  : "border-border-subtle text-muted-foreground/60 hover:text-foreground hover:border-border",
              )}
            >
              <LinkSimple size={9} weight="regular" />
              Pick {targetType}
            </button>
          )
        ) : (
          <input
            type="text"
            value={item.url ?? ""}
            onChange={(e) => onUpdate({ url: e.target.value })}
            placeholder="https://…"
            className={cn(
              "flex-1 min-w-0 bg-transparent text-[9px] outline-none px-1",
              itemFgClass || "text-foreground/70",
              itemLight ? "placeholder:text-white/30" : "placeholder:text-muted-foreground/70",
            )}
          />
        )}
        {/* Reorder */}
        <button
          onClick={() => onMove(-1)}
          disabled={!canMoveUp}
          title="Move left/up"
          className={cn(
            "shrink-0 p-0.5 rounded opacity-0 group-hover/item:opacity-60 hover:!opacity-100 transition-all",
            !canMoveUp && "!opacity-20 cursor-not-allowed",
            itemLight ? "text-white/70 hover:text-white" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <ArrowUp size={9} weight="bold" />
        </button>
        <button
          onClick={() => onMove(1)}
          disabled={!canMoveDown}
          title="Move right/down"
          className={cn(
            "shrink-0 p-0.5 rounded opacity-0 group-hover/item:opacity-60 hover:!opacity-100 transition-all",
            !canMoveDown && "!opacity-20 cursor-not-allowed",
            itemLight ? "text-white/70 hover:text-white" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <ArrowDown size={9} weight="bold" />
        </button>
      </div>
    </div>
  )
}
