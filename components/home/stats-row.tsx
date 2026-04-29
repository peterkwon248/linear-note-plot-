"use client"

import { useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import { setActiveRoute } from "@/lib/table-route"
import { isWikiStub } from "@/lib/wiki-utils"
import type { Note, WikiArticle } from "@/lib/types"

/**
 * Home > Stats card grid.
 *
 * Five cards in a single row (responsive 2/3/5 wrap). Each card:
 *   - small uppercase label
 *   - large tabular-nums value
 *   - tiny muted sub line (Coverage / Stubs / Active / etc.)
 *
 * Linear discipline:
 *   - subtle border, bg-card/30
 *   - hover: border opacity ↑ + bg-secondary/40
 *   - 100ms transition-colors only
 */
export function StatsRow() {
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const tags = usePlotStore((s) => s.tags)
  const references = usePlotStore((s) => s.references)
  const attachments = usePlotStore((s) => s.attachments)

  const stats = useMemo(() => {
    const liveNotes = notes.filter((n: Note) => !n.trashed)
    const linkedCount = liveNotes.filter((n) => (n.linksOut?.length ?? 0) > 0).length
    const coverage =
      liveNotes.length > 0 ? Math.round((linkedCount / liveNotes.length) * 100) : 0

    const liveWiki = (wikiArticles as WikiArticle[]).filter(
      (w) => !(w as { trashed?: boolean }).trashed,
    )
    const stubCount = liveWiki.filter((w) => isWikiStub(w)).length

    const liveTags = tags.filter((t: { trashed?: boolean }) => !t.trashed)
    const activeTagIds = new Set<string>()
    for (const n of liveNotes) {
      for (const t of n.tags ?? []) activeTagIds.add(t)
    }
    const activeTags = liveTags.filter((t: { id: string }) => activeTagIds.has(t.id)).length

    const liveRefs = Object.values(references).filter(
      (r) => !(r as { trashed?: boolean }).trashed,
    ) as Array<{ id: string }>
    const usedRefIds = new Set<string>()
    for (const n of liveNotes) {
      for (const id of (n.referenceIds ?? []) as string[]) usedRefIds.add(id)
    }
    const unusedRefs = liveRefs.filter((r) => !usedRefIds.has(r.id)).length

    const liveFiles = attachments.filter(
      (a: { trashed?: boolean }) => !a.trashed,
    ) as Array<{ size?: number }>
    const totalBytes = liveFiles.reduce(
      (sum, a) => sum + (typeof a.size === "number" ? a.size : 0),
      0,
    )

    return {
      notes: liveNotes.length,
      notesSub: liveNotes.length > 0 ? `${coverage}% linked` : "",
      wiki: liveWiki.length,
      wikiSub: stubCount > 0 ? `${stubCount} stub${stubCount > 1 ? "s" : ""}` : "",
      tags: liveTags.length,
      tagsSub: liveTags.length > 0 ? `${activeTags} active` : "",
      refs: liveRefs.length,
      refsSub: unusedRefs > 0 ? `${unusedRefs} unused` : "",
      files: liveFiles.length,
      filesSub: liveFiles.length > 0 ? formatBytes(totalBytes) : "",
    }
  }, [notes, wikiArticles, tags, references, attachments])

  const items: Array<{
    label: string
    value: number
    sub: string
    route: string
    /** Tailwind color class applied to the big number (knowledge-base accent). */
    color: string
    bgColor: string
  }> = [
    { label: "Notes", value: stats.notes, sub: stats.notesSub, route: "/notes", color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-500/10" },
    { label: "Wiki", value: stats.wiki, sub: stats.wikiSub, route: "/wiki", color: "text-violet-600 dark:text-violet-400", bgColor: "bg-violet-500/10" },
    { label: "Tags", value: stats.tags, sub: stats.tagsSub, route: "/library/tags", color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-500/10" },
    { label: "References", value: stats.refs, sub: stats.refsSub, route: "/library/references", color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-500/10" },
    { label: "Files", value: stats.files, sub: stats.filesSub, route: "/library/files", color: "text-rose-600 dark:text-rose-400", bgColor: "bg-rose-500/10" },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 min-[640px]:grid-cols-3 min-[960px]:grid-cols-5">
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={() => setActiveRoute(item.route)}
          className="group flex flex-col items-start gap-2 rounded-lg border border-border bg-card px-4 py-4 text-left transition-all duration-150 hover:border-accent/30 hover:bg-accent/[0.03] hover:shadow-sm"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">
              {item.label}
            </span>
            <span className={`flex h-5 w-5 items-center justify-center rounded ${item.bgColor}`}>
              <span className={`text-2xs font-bold ${item.color}`}>{item.value > 99 ? "+" : ""}</span>
            </span>
          </div>
          <span className={`text-2xl font-semibold tabular-nums leading-none ${item.color}`}>
            {item.value}
          </span>
          <span className="text-2xs text-muted-foreground tabular-nums">
            {item.sub || "\u00A0"}
          </span>
        </button>
      ))}
    </div>
  )
}

/* ── Helpers ──────────────────────────────────────────── */

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B"
  const units = ["B", "KB", "MB", "GB", "TB"]
  let i = 0
  let value = bytes
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i++
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[i]}`
}
