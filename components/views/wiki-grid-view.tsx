"use client"

/**
 * WikiGridView — Books-grid-parity card grid for Wiki articles.
 *
 * Before this existed, Wiki grid mode fell through to the default list
 * (WikiList row table). User signal (2026-05-24): "북스의 그리드
 * 디스플레이처럼 해야지" — true card grid like
 * `components/books/book-grid-card.tsx` + the books-view `grid` branch.
 *
 * Pure presentational. Caller (wiki-view.tsx) owns ViewHeader, filter
 * panel, and selection state.
 */

import { Pin as PushPin } from "lucide-react"
import { IconWikiStub, IconWikiArticle } from "@/components/plot-icons"
import { WIKI_STATUS_HEX } from "@/lib/colors"
import { isWikiStub } from "@/lib/wiki-utils"
import { shortRelative } from "@/lib/format-utils"
import { cn } from "@/lib/utils"
import type { WikiArticle } from "@/lib/types"

interface WikiGridViewProps {
  articles: WikiArticle[]
  onOpen: (articleId: string) => void
  activeArticleId?: string | null
}

function WikiGridCard({
  article,
  isActive,
  onOpen,
}: {
  article: WikiArticle
  isActive: boolean
  onOpen: () => void
}) {
  const stub = isWikiStub(article)
  const blockCount = article.blocks?.length ?? 0
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group relative flex flex-col items-start gap-2 rounded-lg border bg-card p-4 text-left transition-all",
        (article as { trashed?: boolean }).trashed
          ? "border-border/60 opacity-50 cursor-default"
          : "border-border/60 hover:bg-hover-bg hover:border-border hover:shadow-sm",
        isActive && "border-accent/60 bg-accent/[0.04]",
      )}
    >
      {/* Pin indicator */}
      {article.pinned && (
        <PushPin
          size={11}
          fill="currentColor"
          strokeWidth={2}
          className="absolute right-2 top-2 text-amber-500"
        />
      )}

      {/* Status icon — LOCKED #103: no tinted box, color tone only. */}
      {stub ? (
        <IconWikiStub size={22} style={{ color: WIKI_STATUS_HEX.stub }} />
      ) : (
        <IconWikiArticle size={22} style={{ color: WIKI_STATUS_HEX.article }} />
      )}

      {/* Title */}
      <h3 className="text-note font-medium text-foreground line-clamp-2 leading-snug">
        {article.title || "Untitled"}
      </h3>

      <div className="flex-1" />

      {/* Footer — block count + relative time (Books "N items · time" parity). */}
      <div className="mt-1 flex items-center gap-2 text-2xs text-muted-foreground/70">
        <span className="tabular-nums">
          {blockCount} block{blockCount === 1 ? "" : "s"}
        </span>
        <span>·</span>
        <span>{shortRelative(article.updatedAt)}</span>
      </div>
    </button>
  )
}

export function WikiGridView({ articles, onOpen, activeArticleId }: WikiGridViewProps) {
  if (articles.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <p className="text-note text-muted-foreground">No wiki articles</p>
      </div>
    )
  }
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3 p-6">
        {articles.map((a) => (
          <WikiGridCard
            key={a.id}
            article={a}
            isActive={activeArticleId === a.id}
            onOpen={() => onOpen(a.id)}
          />
        ))}
      </div>
    </div>
  )
}
