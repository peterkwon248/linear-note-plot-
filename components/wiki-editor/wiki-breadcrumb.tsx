"use client"

import { useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import { getAncestors } from "@/lib/wiki-hierarchy"
import { navigateToWikiArticle } from "@/lib/wiki-article-nav"
import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight"

interface WikiBreadcrumbProps {
  articleId: string
}

/**
 * Renders the ancestor chain for a wiki article.
 * Format: Root > ... > Parent > (current article implied)
 * Returns null if article has no parent (no breadcrumb to show).
 */
export function WikiBreadcrumb({ articleId }: WikiBreadcrumbProps) {
  const wikiArticles = usePlotStore((s) => s.wikiArticles)

  const ancestors = useMemo(() => {
    return getAncestors(articleId, { wikiArticles })
  }, [articleId, wikiArticles])

  // No parent = no breadcrumb
  if (ancestors.length === 0) return null

  // ancestors is ordered from direct parent → root; reverse for display (root first)
  const chain = [...ancestors].reverse()

  return (
    <nav className="flex items-center gap-0.5 mb-2 flex-wrap" aria-label="Article hierarchy">
      {chain.map((ancestor, i) => (
        <span key={ancestor.id} className="flex items-center gap-0.5">
          {i > 0 && (
            <CaretRight
              size={10}
              weight="bold"
              className="text-muted-foreground/30 shrink-0"
            />
          )}
          <button
            onClick={() => navigateToWikiArticle(ancestor.id)}
            className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors duration-100 truncate max-w-[160px]"
            title={ancestor.title}
          >
            {ancestor.title}
          </button>
        </span>
      ))}
      <CaretRight
        size={10}
        weight="bold"
        className="text-muted-foreground/30 shrink-0"
      />
    </nav>
  )
}
