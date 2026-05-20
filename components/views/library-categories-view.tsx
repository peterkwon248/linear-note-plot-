"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { FilterRule, ViewState, ViewContextKey } from "@/lib/view-engine/types"
import { buildViewStateForContext } from "@/lib/view-engine/defaults"
import { FilterPanel } from "@/components/filter-panel"
import { DisplayPanel } from "@/components/display-panel"
import { WIKI_CATEGORY_VIEW_CONFIG } from "@/lib/view-engine/view-configs"
import { Folders } from "@phosphor-icons/react/dist/ssr/Folders"
import { usePlotStore } from "@/lib/store"
import { useActiveCategoryId, setActiveCategoryView, setWikiViewMode } from "@/lib/wiki-view-mode"
import { setActiveRoute } from "@/lib/table-route"
import { navigateToWikiArticle } from "@/lib/wiki-article-nav"
import { ViewHeader } from "@/components/view-header"
import { WikiCategoryPage } from "./wiki-category-page"
import { useSaveViewProps } from "@/lib/view-engine/use-save-view-props"

/**
 * Library Categories view — Categories own page (Plan A++ Phase 1).
 *
 * 2026-05-19 — Library는 cross-entity hub로 own view 없음. 단 Categories는
 * hierarchy + grouping 본질 때문에 own view 보유 (sub-entity 중 유일).
 *
 * 이 컴포넌트는 wiki-view 안 category overview UI를 own component로 분리.
 * own contextKey "library-categories" 사용 (wiki-view의 "wiki-category"와 분리).
 * saved view space도 own ("library-categories").
 *
 * 의존성:
 * - wiki-view-mode external store (setActiveCategoryView / useActiveCategoryId)
 *   는 그대로 재사용 (wiki-category-page와 동일 store 공유 — sub-category 진입
 *   시 wiki-view의 category 화면 대신 본 컴포넌트가 렌더).
 * - WikiCategoryPage 컴포넌트는 재사용 (presentation layer는 wiki/library 공통).
 */
export function LibraryCategoriesView() {
  const router = useRouter()
  const sidePanelOpen = usePlotStore((s) => s.sidePanelOpen)
  const createWikiCategory = usePlotStore((s) => s.createWikiCategory)

  const activeCategoryId = useActiveCategoryId()

  // Wiki-category display state from store, but now scoped to own contextKey
  // "library-categories" so saved view space "library-categories" can persist
  // independently from wiki space saved views.
  const catViewState = usePlotStore((s) => s.viewStateByContext["library-categories"]) ?? buildViewStateForContext("library-categories")
  const setViewState = usePlotStore((s) => s.setViewState)
  const updateCatViewState = useCallback(
    (patch: Partial<ViewState>) => setViewState("library-categories" as ViewContextKey, patch),
    [setViewState]
  )

  // Derived convenience aliases for passing to children
  const categoryViewMode = (catViewState.viewMode === "board" ? "board" : "list") as "list" | "board"
  const categoryOrdering = catViewState.sortField as "title" | "articles" | "updatedAt" | "parent" | "tier" | "sub"
  const categoryGrouping = catViewState.groupBy as "none" | "tier" | "parent" | "family"
  const categorySortDirection = catViewState.sortDirection
  const categoryShowDescription = catViewState.toggles?.showDescription !== false
  const categoryShowEmpty = catViewState.showEmptyGroups
  const categoryDisplayProps = catViewState.visibleColumns

  // Category-specific filters (tier and status) from viewState.filters
  const [categoryFilters, setCategoryFilters] = useState<FilterRule[]>([])

  // Save view button (snapshot UX) for Library Categories view
  const { saveViewMode: catSaveViewMode, onSaveView: onSaveCategoryView } = useSaveViewProps(
    "library-categories",
    "library-categories",
  )

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ViewHeader
        icon={<Folders size={20} weight="regular" />}
        title="Categories"
        saveViewMode={catSaveViewMode}
        onSaveView={onSaveCategoryView}
        showFilter
        hasActiveFilters={categoryFilters.length > 0}
        filterContent={(
          <FilterPanel
            categories={WIKI_CATEGORY_VIEW_CONFIG.filterCategories}
            activeFilters={categoryFilters}
            onToggle={(rule) => {
              setCategoryFilters(prev => {
                const exists = prev.some(f => f.field === rule.field && f.value === rule.value)
                return exists ? prev.filter(f => !(f.field === rule.field && f.value === rule.value)) : [...prev, rule]
              })
            }}
          />
        )}
        showDisplay
        displayContent={(
          <DisplayPanel
            config={WIKI_CATEGORY_VIEW_CONFIG.displayConfig}
            viewState={catViewState}
            onViewStateChange={updateCatViewState}
            showViewMode
            toggleStates={catViewState.toggles ?? {}}
            onToggleChange={(key, value) =>
              updateCatViewState({ toggles: { ...(catViewState.toggles ?? {}), [key]: value } })
            }
          />
        )}
        showDetailPanel
        detailPanelOpen={sidePanelOpen}
        onDetailPanelToggle={() => {
          const store = usePlotStore.getState()
          if (!store.sidePanelOpen) {
            store.setSidePanelOpen(true)
            usePlotStore.setState({ sidePanelMode: 'detail' })
          } else if (store.sidePanelMode === 'detail') {
            store.setSidePanelOpen(false)
          } else {
            usePlotStore.setState({ sidePanelMode: 'detail' })
          }
        }}
        onCreateNew={() => createWikiCategory("New Category")}
      />

      <WikiCategoryPage
        categoryId={activeCategoryId}
        onOpenArticle={(articleId) => {
          // Library Categories does not host the article reader itself.
          // Navigate to /wiki and queue the article for WikiView to open.
          // Set wikiViewMode to "dashboard" so WikiView lands in its
          // default render path when the article is later closed.
          setWikiViewMode("dashboard")
          navigateToWikiArticle(articleId)
          setActiveRoute("/wiki")
          router.push("/wiki")
        }}
        onNavigateCategory={(catId) => setActiveCategoryView(catId)}
        categoryViewMode={categoryViewMode}
        categoryOrdering={categoryOrdering}
        categoryTierFilter={categoryFilters.find(f => f.field === "wikiTier")?.value ?? null}
        categoryStatusFilter={categoryFilters.find(f => f.field === "status")?.value ?? null}
        categoryShowDescription={categoryShowDescription}
        categoryShowEmpty={categoryShowEmpty}
        categoryGrouping={categoryGrouping}
        categoryDisplayProps={categoryDisplayProps}
        categorySortDirection={categorySortDirection}
        onOrderingChange={(ordering) => updateCatViewState({ sortField: ordering as any })}
        onSortDirectionChange={(dir) => updateCatViewState({ sortDirection: dir })}
      />
    </div>
  )
}
