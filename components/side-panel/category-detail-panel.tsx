"use client"

/**
 * CategoryDetailPanel — right-side panel for a Wiki Category.
 *
 * Mini panel → sidebar 흡수 Phase 1+B+C (2026-05-15):
 *   - 다른 Library entity (Tag/Label/File) 동일 4탭 사이드바 패턴 정합 (영구 룰 21)
 *   - Detail 탭 = Category 핵심 정보 + preview
 *   - 풍부한 편집 (rename / subcategory add / adopt) = 기존 mini panel (double-click)
 *   - 사이드바 너비 표준 (240-360px) 안에 들어가도록 compact
 *
 * Plot 일반 패턴 정합:
 *   - Header: Folder icon + "Category" badge + Color dot + name + count badge
 *   - Properties (= stats): Tier / Parent / Created / Updated
 *   - PARENT CATEGORIES preview (1 row if parent exists)
 *   - SUBCATEGORIES preview (count + recent N)
 *   - ARTICLES preview (count + recent N)
 *
 * Future PRs:
 *   - Connections 탭: SUBCATEGORIES + ARTICLES full list (cross-entity)
 *   - Activity 탭: entityEvents (renamed, parent_changed, articles_added)
 */

import { useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { usePlotStore } from "@/lib/store"
import { setActiveCategoryView } from "@/lib/wiki-view-mode"
import { setActiveRoute } from "@/lib/table-route"
import { getCategoryColorName } from "@/lib/store/slices/wiki-categories"
import { FolderSimple } from "@phosphor-icons/react/dist/ssr/FolderSimple"
import { FolderOpen } from "@phosphor-icons/react/dist/ssr/FolderOpen"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { Link as PhLink } from "@phosphor-icons/react/dist/ssr/Link"
import { ArrowUp } from "@phosphor-icons/react/dist/ssr/ArrowUp"
import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight"
import { shortRelative } from "@/lib/format-utils"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ColorPickerGrid } from "@/components/color-picker-grid"
import type { WikiCategory } from "@/lib/types"

function InspectorSection({
  title,
  icon,
  children,
  className,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("px-4 py-3", className)}>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-2xs font-medium text-muted-foreground">
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}

function getDepth(catId: string, allCats: WikiCategory[]): number {
  let depth = 0
  let current = allCats.find((c) => c.id === catId)
  const visited = new Set<string>()
  while (current?.parentIds?.[0] && !visited.has(current.id)) {
    visited.add(current.id)
    current = allCats.find((c) => c.id === current!.parentIds[0])
    depth++
  }
  return depth
}

export function CategoryDetailPanel({
  category,
}: {
  category: WikiCategory
}) {
  const router = useRouter()
  const categories = usePlotStore((s) => s.wikiCategories)
  const articles = usePlotStore((s) => s.wikiArticles)
  const updateWikiCategory = usePlotStore((s) => s.updateWikiCategory)

  const navigateToCategory = useCallback(
    (catId: string) => {
      setActiveCategoryView(catId)
      setActiveRoute("/library/categories")
      router.push("/library/categories")
    },
    [router],
  )

  const depth = useMemo(() => getDepth(category.id, categories), [category.id, categories])
  const tierLabel =
    depth === 0
      ? "1st tier"
      : depth === 1
        ? "2nd tier"
        : depth === 2
          ? "3rd tier"
          : `${depth + 1}th tier`

  const parentCat = useMemo(
    () =>
      category.parentIds.length > 0
        ? categories.find((c) => c.id === category.parentIds[0]) ?? null
        : null,
    [category.parentIds, categories]
  )

  const subcategories = useMemo(
    () => categories.filter((c) => c.parentIds.includes(category.id)),
    [categories, category.id]
  )

  const catArticles = useMemo(
    () => articles.filter((a) => a.categoryIds?.includes(category.id)),
    [articles, category.id]
  )

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1 rounded-md bg-secondary/40 px-1.5 py-0.5 text-2xs font-medium text-muted-foreground">
            <FolderSimple size={11} weight="regular" />
            Category
          </span>
          {category.color && (
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: category.color }}
              aria-hidden
            />
          )}
          <span className="truncate text-note font-medium text-foreground">
            {category.name}
          </span>
        </div>
        <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-accent/10 px-1.5 py-0.5 text-2xs font-medium text-accent tabular-nums">
          {catArticles.length}
        </span>
      </div>

      {/* ── Description (if present) ───────────────────── */}
      {category.description && (
        <div className="px-4 py-3 border-b border-border-subtle">
          <p className="text-note text-muted-foreground/90 leading-relaxed">
            {category.description}
          </p>
        </div>
      )}

      {/* ── Properties ─────────────────────────────────── */}
      <InspectorSection
        title="Properties"
        icon={<FileText size={16} weight="regular" />}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Tier</span>
            <span className="text-note tabular-nums text-foreground">
              {tierLabel}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Parent</span>
            <span className="text-note text-foreground truncate ml-2">
              {parentCat?.name ?? (
                <span className="text-muted-foreground/60">None (root)</span>
              )}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Subs</span>
            <span className="text-note tabular-nums text-foreground">
              {subcategories.length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Articles</span>
            <span className="text-note tabular-nums text-foreground">
              {catArticles.length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Color</span>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 hover:bg-hover-bg transition-colors"
                  title="Change color"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full border border-border-subtle shrink-0"
                    style={{ backgroundColor: category.color ?? "#6b7280" }}
                  />
                  <span className="text-note text-foreground">
                    {getCategoryColorName(category.color)}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-auto p-2">
                <ColorPickerGrid
                  value={category.color ?? "#6b7280"}
                  onChange={(color) =>
                    updateWikiCategory(category.id, { color })
                  }
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Created</span>
            <span className="text-note tabular-nums text-foreground">
              {shortRelative(category.createdAt)} ago
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Updated</span>
            <span className="text-note tabular-nums text-foreground">
              {shortRelative(category.updatedAt ?? category.createdAt)} ago
            </span>
          </div>
        </div>
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* ── Parent Category (if exists) ─────────────────── */}
      {parentCat && (
        <>
          <InspectorSection
            title="Parent Category"
            icon={<ArrowUp size={16} weight="regular" />}
          >
            <button
              onClick={() => navigateToCategory(parentCat.id)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-hover-bg transition-colors group"
            >
              <FolderSimple
                size={14}
                weight="regular"
                className="shrink-0"
                style={{ color: parentCat.color ?? undefined }}
              />
              <span className="truncate flex-1 text-note text-foreground">
                {parentCat.name}
              </span>
              <CaretRight
                size={12}
                weight="regular"
                className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors"
              />
            </button>
          </InspectorSection>
          <div className="mx-4 border-b border-border" />
        </>
      )}

      {/* ── Subcategories preview ───────────────────────── */}
      <InspectorSection
        title={`Subcategories (${subcategories.length})`}
        icon={<FolderOpen size={16} weight="regular" />}
      >
        {subcategories.length === 0 ? (
          <p className="text-note text-muted-foreground/70 italic px-2">
            No subcategories
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {subcategories.slice(0, 6).map((sub) => (
              <button
                key={sub.id}
                onClick={() => navigateToCategory(sub.id)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left hover:bg-hover-bg transition-colors group"
              >
                <FolderSimple
                  size={13}
                  weight="regular"
                  className="shrink-0"
                  style={{ color: sub.color ?? undefined }}
                />
                <span className="truncate flex-1 text-note text-foreground">
                  {sub.name}
                </span>
                <CaretRight
                  size={11}
                  weight="regular"
                  className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors"
                />
              </button>
            ))}
            {subcategories.length > 6 && (
              <p className="px-2 pt-1 text-2xs text-muted-foreground/70">
                +{subcategories.length - 6} more
              </p>
            )}
          </div>
        )}
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* ── Articles preview ───────────────────────────── */}
      <InspectorSection
        title={`Articles (${catArticles.length})`}
        icon={<PhLink size={16} weight="regular" />}
      >
        {catArticles.length === 0 ? (
          <p className="text-note text-muted-foreground/70 italic px-2">
            No articles in this category
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {catArticles.slice(0, 8).map((a) => (
              <button
                key={a.id}
                onClick={() =>
                  usePlotStore.setState({
                    sidePanelContext: { type: "wiki", id: a.id },
                    sidePanelOpen: true,
                  })
                }
                className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-note text-foreground hover:bg-hover-bg transition-colors"
              >
                <FileText
                  size={13}
                  weight="regular"
                  className="shrink-0 text-muted-foreground"
                />
                <span className="truncate flex-1">
                  {a.title || "Untitled"}
                </span>
              </button>
            ))}
            {catArticles.length > 8 && (
              <p className="px-2 pt-1 text-2xs text-muted-foreground/70">
                +{catArticles.length - 8} more
              </p>
            )}
          </div>
        )}
      </InspectorSection>
    </div>
  )
}
