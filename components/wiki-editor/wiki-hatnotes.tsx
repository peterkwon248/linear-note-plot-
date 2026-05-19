"use client"

/**
 * Wiki article hatnotes — small italic notices at the top of an article
 * (Wikipedia / 나무위키 standard). Renders italic muted text indented 1.6em.
 *
 * View mode: prefix label by hatnote type, then the text (optionally rendered
 * as a link when `targetArticleId` resolves to an existing article).
 * Edit mode (`editable`): hover reveals edit + delete icons; an "+ Add hatnote"
 * button is always shown at the bottom of the list so users can append more.
 *
 * Persistence routes through `setWikiArticleHatnotes` (dedicated setter,
 * sibling to setWikiArticleInfobox). PR-C uses generic `updateWikiArticle`
 * for infoboxHero — no dedicated setter there.
 */

import { useMemo, useState } from "react"
import { usePlotStore } from "@/lib/store"
import { navigateToWikiArticle } from "@/lib/wiki-article-nav"
import { cn } from "@/lib/utils"
import type { Hatnote, HatnoteType } from "@/lib/types"
import { HatnoteEditDialog } from "./hatnote-edit-dialog"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { PencilSimple as PhPencilSimple } from "@phosphor-icons/react/dist/ssr/PencilSimple"
import { Trash as PhTrash } from "@phosphor-icons/react/dist/ssr/Trash"

interface WikiHatnotesProps {
  articleId: string
  hatnotes: Hatnote[]
  editable?: boolean
  className?: string
}

const TYPE_LABEL: Record<HatnoteType, string> = {
  above:       "Part of:",
  below:       "Subtopics:",
  distinguish: "Not to be confused with",
  main:        "Main article:",
  "see-also":  "See also:",
}

export function WikiHatnotes({
  articleId,
  hatnotes,
  editable = false,
  className,
}: WikiHatnotesProps) {
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const setWikiArticleHatnotes = usePlotStore((s) => s.setWikiArticleHatnotes)
  const [editing, setEditing] = useState<Hatnote | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  // Lookup map for target article titles
  const titleById = useMemo(() => {
    const m = new Map<string, string>()
    for (const a of wikiArticles) m.set(a.id, a.title)
    return m
  }, [wikiArticles])

  const list = hatnotes ?? []

  // Nothing to show in read mode when the article has no hatnotes — keep the
  // chrome minimal (Linear-style "gentle by default").
  if (!editable && list.length === 0) return null

  const handleSave = (next: Hatnote) => {
    const existingIdx = list.findIndex((h) => h.id === next.id)
    const updated =
      existingIdx >= 0
        ? list.map((h) => (h.id === next.id ? next : h))
        : [...list, next]
    setWikiArticleHatnotes(articleId, updated)
  }

  const handleDelete = (id: string) => {
    setWikiArticleHatnotes(articleId, list.filter((h) => h.id !== id))
  }

  return (
    <>
      {/* PR-E2 — Hatnote left accent border. transparent fallback when no
          --wiki-theme-color → invisible but layout-stable (Linear "gentle by
          default" principle, 영구 룰 #67). pl 1.4em + border 2px ≈ visual 1.6em
          indent (back-compat with prior ml-[1.6em] visual). */}
      <div
        className={cn("space-y-0.5 ml-0 border-l-2 pl-[1.4em]", className)}
        style={{ borderLeftColor: "var(--wiki-theme-color, transparent)" }}
      >
        {list.map((h) => {
          const targetTitle = h.targetArticleId ? titleById.get(h.targetArticleId) : undefined
          const hasLink = !!(h.targetArticleId && targetTitle)
          return (
            <div
              key={h.id}
              className="group/hatnote flex items-baseline gap-1.5 text-sm italic text-muted-foreground"
            >
              <span className="shrink-0">
                <em className="not-italic font-medium">{TYPE_LABEL[h.type]}</em>{" "}
                {hasLink ? (
                  <button
                    type="button"
                    onClick={() => navigateToWikiArticle(h.targetArticleId!)}
                    className="text-accent underline decoration-accent/30 underline-offset-2 transition-colors hover:decoration-accent"
                  >
                    {h.text}
                  </button>
                ) : (
                  <span>{h.text}</span>
                )}
              </span>
              {editable && (
                <span className="ml-1 inline-flex items-center gap-0.5 opacity-0 transition-opacity group-hover/hatnote:opacity-100">
                  <button
                    type="button"
                    onClick={() => setEditing(h)}
                    title="Edit hatnote"
                    className="rounded p-0.5 text-muted-foreground/70 transition-colors hover:bg-hover-bg hover:text-foreground"
                  >
                    <PhPencilSimple size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(h.id)}
                    title="Delete hatnote"
                    className="rounded p-0.5 text-muted-foreground/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <PhTrash size={12} />
                  </button>
                </span>
              )}
            </div>
          )
        })}

        {editable && (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 rounded px-1 py-0.5 text-2xs text-muted-foreground/70 transition-colors hover:bg-hover-bg hover:text-foreground"
          >
            <PhPlus size={11} />
            Add hatnote
          </button>
        )}
      </div>

      {/* Add dialog */}
      <HatnoteEditDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        articleId={articleId}
        existing={null}
        onSave={handleSave}
      />

      {/* Edit dialog — keyed on the edited hatnote so its state resets cleanly */}
      <HatnoteEditDialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
        articleId={articleId}
        existing={editing}
        onSave={handleSave}
      />
    </>
  )
}
