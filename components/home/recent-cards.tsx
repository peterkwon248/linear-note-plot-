"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { usePlotStore } from "@/lib/store"
import { setActiveRoute } from "@/lib/table-route"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { BookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"
import type { Note, WikiArticle } from "@/lib/types"

/**
 * Home > Recent — horizontal card grid (Notion-style).
 *
 * Each card:
 *   [icon]            [time]
 *   Title (2 lines, truncate)
 *   Preview / sub line
 *   meta footer (backlinks · tags)
 *
 * Responsive: 1 col (mobile) → 2 → 3 → 4 (desktop).
 *
 * Linear discipline:
 *   - subtle border, bg-card/30
 *   - hover: border opacity ↑ + bg-secondary/40
 *   - 100ms transition-colors only
 */
export function RecentCards({ limit = 8 }: { limit?: number }) {
  const router = useRouter()
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const tags = usePlotStore((s) => s.tags)
  const openNote = usePlotStore((s) => s.openNote)
  const backlinks = useBacklinksIndex()

  const tagNames = useMemo(() => {
    const map = new Map<string, string>()
    for (const t of tags as Array<{ id: string; name?: string }>) {
      if (t.id) map.set(t.id, t.name ?? "")
    }
    return map
  }, [tags])

  const items = useMemo(() => {
    type Item = {
      id: string
      kind: "note" | "wiki"
      title: string
      preview: string
      ts: string
      meta: string
      onClick: () => void
    }
    const result: Item[] = []

    for (const n of notes as Note[]) {
      if (n.trashed) continue
      const ts = n.lastTouchedAt || n.updatedAt
      const incoming = backlinks.get(n.id) ?? 0
      const firstTagId = n.tags?.[0]
      const tagName = firstTagId ? tagNames.get(firstTagId) : undefined
      const metaParts: string[] = []
      if (incoming > 0) metaParts.push(`${incoming} link${incoming > 1 ? "s" : ""}`)
      if (tagName) metaParts.push(`#${tagName}`)
      result.push({
        id: n.id,
        kind: "note",
        title: n.title || "Untitled",
        preview: (n.preview ?? "").trim(),
        ts,
        meta: metaParts.join(" · "),
        onClick: () => {
          setActiveRoute("/notes")
          openNote(n.id)
        },
      })
    }

    for (const w of wikiArticles as WikiArticle[]) {
      const incoming = backlinks.get(w.id) ?? 0
      const catCount = w.categoryIds?.length ?? 0
      const metaParts: string[] = []
      if (incoming > 0) metaParts.push(`${incoming} link${incoming > 1 ? "s" : ""}`)
      if (catCount > 0) metaParts.push(`${catCount} categor${catCount > 1 ? "ies" : "y"}`)
      result.push({
        id: w.id,
        kind: "wiki",
        title: w.title,
        preview: "",
        ts: w.updatedAt,
        meta: metaParts.join(" · "),
        onClick: () => {
          setActiveRoute("/wiki")
          router.push(`/wiki/${w.id}`)
        },
      })
    }

    return result.sort((a, b) => b.ts.localeCompare(a.ts)).slice(0, limit)
  }, [notes, wikiArticles, openNote, router, backlinks, tagNames, limit])

  if (items.length === 0) {
    return (
      <p className="px-2 py-6 text-2xs text-muted-foreground/60">
        Open a note to start building context.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 min-[800px]:grid-cols-3 min-[1100px]:grid-cols-4">
      {items.map((it) => (
        <button
          key={`${it.kind}:${it.id}`}
          type="button"
          onClick={it.onClick}
          className="group flex h-32 flex-col rounded-lg border border-border bg-card p-3.5 text-left transition-all duration-150 hover:border-accent/30 hover:bg-accent/[0.03] hover:shadow-sm"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
              it.kind === "wiki" ? "bg-violet-500/10 text-violet-600 dark:text-violet-400" : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
            }`}>
              {it.kind === "wiki" ? (
                <BookOpen size={13} weight="regular" />
              ) : (
                <FileText size={13} weight="regular" />
              )}
            </span>
            <span className="text-2xs tabular-nums text-muted-foreground">
              {compactTime(it.ts)}
            </span>
          </div>
          <h3 className="mb-1 line-clamp-2 text-note font-medium leading-snug text-foreground group-hover:text-accent transition-colors">
            {it.title}
          </h3>
          {it.preview && (
            <p className="line-clamp-2 text-2xs leading-relaxed text-muted-foreground">
              {it.preview}
            </p>
          )}
          {it.meta && (
            <p className="mt-auto truncate pt-2 text-2xs text-muted-foreground/70">
              {it.meta}
            </p>
          )}
        </button>
      ))}
    </div>
  )
}

/* ── Helpers ──────────────────────────────────────────── */

function compactTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "now"
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
