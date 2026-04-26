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
  }> = [
    { label: "Notes", value: stats.notes, sub: stats.notesSub, route: "/notes", color: "text-blue-400" },
    { label: "Wiki", value: stats.wiki, sub: stats.wikiSub, route: "/wiki", color: "text-violet-400" },
    { label: "Tags", value: stats.tags, sub: stats.tagsSub, route: "/library/tags", color: "text-emerald-400" },
    { label: "References", value: stats.refs, sub: stats.refsSub, route: "/library/references", color: "text-amber-400" },
    { label: "Files", value: stats.files, sub: stats.filesSub, route: "/library/files", color: "text-rose-400" },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 min-[640px]:grid-cols-3 min-[960px]:grid-cols-5">
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={() => setActiveRoute(item.route)}
          className="flex flex-col items-start gap-1.5 rounded-lg border border-border/40 bg-card/30 px-4 py-4 text-left transition-colors duration-100 hover:border-border/70 hover:bg-secondary/40"
        >
          <span className="text-2xs font-medium uppercase tracking-wider text-muted-foreground/70">
            {item.label}
          </span>
          <span className={`text-2xl font-semibold tabular-nums leading-none ${item.color}`}>
            {item.value}
          </span>
          <span className="text-2xs text-muted-foreground/50 tabular-nums">
            {item.sub || " "}
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
