"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { usePlotStore } from "@/lib/store"
import type { WikiBlock } from "@/lib/types"
import { cn } from "@/lib/utils"
import { CategoryTreePicker } from "./category-tree-picker"
import { setActiveCategoryView } from "@/lib/wiki-view-mode"
import { setActiveRoute } from "@/lib/table-route"
import { navigateToWikiArticle } from "@/lib/wiki-article-nav"
import { WikiPickerDialog } from "@/components/wiki-picker-dialog"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { Folders } from "@phosphor-icons/react/dist/ssr/Folders"
import { BookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"
import { PencilSimple } from "@phosphor-icons/react/dist/ssr/PencilSimple"
import { DotsThree } from "@phosphor-icons/react/dist/ssr/DotsThree"
import { DotsSixVertical } from "@phosphor-icons/react/dist/ssr/DotsSixVertical"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { Plus } from "@phosphor-icons/react/dist/ssr/Plus"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
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

export function NavboxBlock({ block, editable, onUpdate, onDelete, dragHandleProps, articleId }: NavboxBlockProps) {
  const router = useRouter()
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const wikiCategories = usePlotStore((s) => s.wikiCategories)
  const setSelectedNoteId = usePlotStore((s) => s.setSelectedNoteId)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [articlePickerOpen, setArticlePickerOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  const mode: "category" | "manual" = block.navboxMode ?? "category"

  const category = useMemo(
    () =>
      block.navboxCategoryId
        ? wikiCategories.find((c) => c.id === block.navboxCategoryId)
        : null,
    [wikiCategories, block.navboxCategoryId]
  )

  const articles = useMemo(() => {
    if (mode === "manual") {
      const ids = block.navboxArticleIds ?? []
      return ids
        .map((id) => wikiArticles.find((a) => a.id === id))
        .filter((a): a is NonNullable<typeof a> => !!a)
    }
    // category mode
    if (!block.navboxCategoryId) return []
    const catId = block.navboxCategoryId
    return wikiArticles
      .filter((a) => a.categoryIds?.includes(catId))
      .sort((a, b) => a.title.localeCompare(b.title))
  }, [mode, wikiArticles, block.navboxCategoryId, block.navboxArticleIds])

  const handleAddArticle = (id: string) => {
    const current = block.navboxArticleIds ?? []
    if (current.includes(id)) return
    onUpdate({ navboxArticleIds: [...current, id] })
    setArticlePickerOpen(false)
  }

  const handleRemoveArticle = (id: string) => {
    const current = block.navboxArticleIds ?? []
    onUpdate({ navboxArticleIds: current.filter((x) => x !== id) })
  }

  const handleSetMode = (newMode: "category" | "manual") => {
    onUpdate({ navboxMode: newMode })
  }

  useEffect(() => {
    if (!pickerOpen) return
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [pickerOpen])

  const handleCategorySelect = (catId: string) => {
    onUpdate({ navboxCategoryId: catId })
    setPickerOpen(false)
  }

  const handleCategoryHeaderClick = () => {
    if (!category) return
    setSelectedNoteId(null)
    setActiveRoute("/wiki")
    setActiveCategoryView(category.id)
    router.push("/wiki")
  }

  const handleArticleClick = (articleId: string) => {
    navigateToWikiArticle(articleId)
  }

  const isCollapsed = !!block.collapsed
  const displayTitle = block.navboxTitle || (mode === "category" ? category?.name : "Navbox") || "Navbox"
  const columns = block.navboxColumns ?? 4
  const isUnconfigured = mode === "category" ? !block.navboxCategoryId : (block.navboxArticleIds ?? []).length === 0

  // Shared right-side cluster: [marker] [bookmark] [⋯]
  const dotMenu = (
    <div className="absolute left-full top-1 ml-2 z-10 flex items-center gap-0.5">
      {articleId && (
        <BlockCommentMarker anchor={{ kind: "wiki-block", articleId, blockId: block.id }} />
      )}
      {articleId && (
        <WikiBlockInlineActions articleId={articleId} blockId={block.id} label="Navbox" />
      )}
      {editable && (
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(true) }}
              className="opacity-0 group-hover/navbox:opacity-30 hover:!opacity-100 p-1 text-muted-foreground hover:text-foreground transition-all duration-100"
            >
              <DotsThree size={14} weight="bold" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-44 p-1" onOpenAutoFocus={(e) => e.preventDefault()} style={{ fontSize: '13px' }}>
            {onDelete && (
              <button
                onClick={() => { setMenuOpen(false); onDelete() }}
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

  // Unconfigured (no category in category mode, or no articles in manual mode)
  if (isUnconfigured) {
    if (!editable) return null
    return (
      <div className="group/navbox flex items-center gap-1 my-4">
        {/* Drag handle */}
        <button className="p-0.5 opacity-0 group-hover/navbox:opacity-30 hover:!opacity-100 cursor-grab shrink-0 text-muted-foreground transition-opacity duration-100" {...(dragHandleProps ?? {})}>
          <DotsSixVertical size={14} weight="regular" />
        </button>
        <div className="relative flex-1 rounded-lg border-2 border-dashed border-border-subtle bg-secondary/10 px-4 py-5">
          {dotMenu}
          {/* Mode toggle */}
          <div className="flex justify-center mb-3">
            <div className="inline-flex rounded-md bg-secondary/40 p-0.5">
              <button
                onClick={() => handleSetMode("category")}
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
                onClick={() => handleSetMode("manual")}
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

          {/* Action: pick category or pick first article */}
          <div className="flex items-center justify-center">
            {mode === "category" ? (
              <div className="relative" ref={pickerRef}>
                <button
                  onClick={() => setPickerOpen(!pickerOpen)}
                  className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm text-muted-foreground hover:bg-hover-bg hover:text-foreground transition-colors"
                >
                  <Folders size={16} weight="regular" />
                  Pick a category
                  <CaretDown size={12} weight="bold" />
                </button>
                {pickerOpen && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50">
                    <CategoryTreePicker
                      mode="single"
                      selectedIds={[]}
                      onSelect={handleCategorySelect}
                    />
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setArticlePickerOpen(true)}
                className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm text-muted-foreground hover:bg-hover-bg hover:text-foreground transition-colors"
              >
                <Plus size={16} weight="regular" />
                Add articles
              </button>
            )}
          </div>
        </div>

        {articlePickerOpen && (
          <WikiPickerDialog
            open={articlePickerOpen}
            onOpenChange={setArticlePickerOpen}
            title="Add article to navbox"
            onSelect={(id) => handleAddArticle(id)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="group/navbox flex items-start gap-1 my-4">
      {/* Drag handle — flex item, outside card */}
      {editable && (
        <button className="mt-2 p-0.5 opacity-0 group-hover/navbox:opacity-30 hover:!opacity-100 cursor-grab shrink-0 text-muted-foreground transition-opacity duration-100" {...(dragHandleProps ?? {})}>
          <DotsSixVertical size={14} weight="regular" />
        </button>
      )}
      <div className="relative flex-1">
        {dotMenu}
        <div className="rounded-lg border border-border-subtle overflow-hidden bg-card/30">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 bg-secondary/40 px-4 py-2.5 border-b border-border-subtle">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {mode === "category" ? (
            <Folders size={14} weight="regular" className="text-muted-foreground/60 shrink-0" />
          ) : (
            <BookOpen size={14} weight="regular" className="text-muted-foreground/60 shrink-0" />
          )}
          {mode === "category" && category ? (
            <button
              onClick={handleCategoryHeaderClick}
              title="Open category page"
              className="font-semibold text-foreground hover:text-accent hover:underline transition-colors truncate"
            >
              {displayTitle}
            </button>
          ) : (
            <span className="font-semibold text-foreground truncate">{displayTitle}</span>
          )}
          <span className="text-2xs text-muted-foreground/60 shrink-0">
            {articles.length} article{articles.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {editable && (
            <>
              {/* Mode toggle */}
              <div className="inline-flex rounded bg-secondary/40 p-0.5 mr-1">
                <button
                  onClick={() => handleSetMode("category")}
                  className={cn(
                    "px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors",
                    mode === "category" ? "bg-accent/20 text-accent" : "text-muted-foreground/60 hover:text-foreground",
                  )}
                  title="Auto-pull from category"
                >
                  Auto
                </button>
                <button
                  onClick={() => handleSetMode("manual")}
                  className={cn(
                    "px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors",
                    mode === "manual" ? "bg-accent/20 text-accent" : "text-muted-foreground/60 hover:text-foreground",
                  )}
                  title="Manual curation (Wiki standard)"
                >
                  Manual
                </button>
              </div>

              {mode === "category" && (
                <div className="relative" ref={pickerRef}>
                  <button
                    onClick={() => setPickerOpen(!pickerOpen)}
                    title="Change category"
                    className="p-1 rounded-md text-muted-foreground/60 hover:bg-hover-bg hover:text-foreground transition-colors"
                  >
                    <PencilSimple size={12} weight="regular" />
                  </button>
                  {pickerOpen && (
                    <div className="absolute right-0 top-full mt-1.5 z-50">
                      <CategoryTreePicker
                        mode="single"
                        selectedIds={block.navboxCategoryId ? [block.navboxCategoryId] : []}
                        onSelect={handleCategorySelect}
                      />
                    </div>
                  )}
                </div>
              )}
              {mode === "manual" && (
                <button
                  onClick={() => setArticlePickerOpen(true)}
                  title="Add article"
                  className="p-1 rounded-md text-muted-foreground/60 hover:bg-hover-bg hover:text-foreground transition-colors"
                >
                  <Plus size={12} weight="bold" />
                </button>
              )}
            </>
          )}
          <button
            onClick={() => onUpdate({ collapsed: !isCollapsed })}
            title={isCollapsed ? "Expand" : "Collapse"}
            className="p-1 rounded-md text-muted-foreground/60 hover:bg-hover-bg hover:text-foreground transition-colors"
          >
            <CaretDown
              size={12}
              weight="bold"
              className={cn("transition-transform", isCollapsed && "-rotate-90")}
            />
          </button>
        </div>
      </div>

      {/* Body (grid of articles) */}
      {!isCollapsed &&
        (articles.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground/50">
            {mode === "category"
              ? "No articles in this category yet."
              : "No articles added yet. Click + to add."}
          </div>
        ) : (
          <div
            className="grid gap-1.5 p-3"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {articles.map((a) => (
              <div
                key={a.id}
                className="group/item relative flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-foreground/80 hover:bg-hover-bg hover:text-foreground transition-colors"
              >
                <button
                  onClick={() => handleArticleClick(a.id)}
                  title={a.title}
                  className="flex items-center gap-2 flex-1 min-w-0 text-left"
                >
                  <BookOpen
                    size={12}
                    weight="regular"
                    className="text-muted-foreground/50 shrink-0"
                  />
                  <span className="truncate">{a.title || "Untitled"}</span>
                </button>
                {editable && mode === "manual" && (
                  <button
                    onClick={() => handleRemoveArticle(a.id)}
                    title="Remove from navbox"
                    className="opacity-0 group-hover/item:opacity-60 hover:!opacity-100 p-0.5 rounded text-muted-foreground hover:text-destructive transition-all"
                  >
                    <PhX size={10} weight="bold" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      </div>

      {articlePickerOpen && (
        <WikiPickerDialog
          open={articlePickerOpen}
          onOpenChange={setArticlePickerOpen}
          title="Add article to navbox"
          onSelect={(id) => handleAddArticle(id)}
        />
      )}
    </div>
  )
}
