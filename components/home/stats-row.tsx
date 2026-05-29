"use client"

import { useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import { useT } from "@/lib/i18n"
import { setActiveRoute } from "@/lib/table-route"
import type { Note, WikiArticle } from "@/lib/types"
import { KNOWLEDGE_INDEX_COLORS } from "@/lib/colors"
import { IconNotes } from "@/components/plot-icons"
import { BookOpen, Tag as PhTag, Quote as Quotes, Paperclip, Sticker as StickerIcon } from "lucide-react"

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
  const t = useT()
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const tags = usePlotStore((s) => s.tags)
  const references = usePlotStore((s) => s.references)
  const attachments = usePlotStore((s) => s.attachments)
  const stickers = usePlotStore((s) => s.stickers ?? [])

  const stats = useMemo(() => {
    const liveNotes = notes.filter((n: Note) => !n.trashed)
    const linkedCount = liveNotes.filter((n) => (n.linksOut?.length ?? 0) > 0).length
    const coverage =
      liveNotes.length > 0 ? Math.round((linkedCount / liveNotes.length) * 100) : 0

    const liveWiki = (wikiArticles as WikiArticle[]).filter(
      (w) => !(w as { trashed?: boolean }).trashed,
    )
    // v151: "incomplete" wiki articles (status !== "done", i.e. still being
    // worked) — the "needs work" signal for the Home tile sub-line.
    const stubCount = liveWiki.filter((w) => w.status !== "done").length

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

    // Stickers — Library cross-cutting index. "in use" = at least one member.
    const liveStickers = stickers.filter((s: { trashed?: boolean }) => !s.trashed)
    const usedStickerCount = liveStickers.filter(
      (s: { members?: Array<unknown> }) => (s.members ?? []).length > 0,
    ).length

    return {
      notes: liveNotes.length,
      notesSub: liveNotes.length > 0 ? t("home.tile.notes.sub").replace("{percent}", String(coverage)) : "",
      wiki: liveWiki.length,
      wikiSub: stubCount > 0 ? t("home.tile.wiki.sub").replace("{count}", String(stubCount)) : "",
      tags: liveTags.length,
      tagsSub: liveTags.length > 0 ? t("home.tile.tags.sub").replace("{count}", String(activeTags)) : "",
      refs: liveRefs.length,
      refsSub: unusedRefs > 0 ? `${unusedRefs} unused` : "",
      files: liveFiles.length,
      filesSub: liveFiles.length > 0 ? formatBytes(totalBytes) : "",
      stickers: liveStickers.length,
      stickersSub: liveStickers.length > 0 ? `${usedStickerCount} in use` : "",
    }
  }, [notes, wikiArticles, tags, references, attachments, stickers, t])

  // All entity colors come from KNOWLEDGE_INDEX_COLORS — single source of
  // truth shared with Library overview. Hardcoded color classes were the
  // root cause of the Tags green-vs-amber / References amber-vs-accent /
  // Files rose-vs-teal collisions between Home and Library before this PR.
  const items: Array<{
    label: string
    value: number
    sub: string
    route: string
    /** Tailwind color class applied to the big number (knowledge-base accent). */
    color: string
    bgColor: string
    icon: React.ReactNode
  }> = [
    { label: t("home.tile.notes"),      value: stats.notes,    sub: stats.notesSub,    route: "/notes",              color: KNOWLEDGE_INDEX_COLORS.notes.text,      bgColor: KNOWLEDGE_INDEX_COLORS.notes.bg,      icon: <IconNotes size={12} /> },
    { label: t("home.tile.wiki"),       value: stats.wiki,     sub: stats.wikiSub,     route: "/wiki",               color: KNOWLEDGE_INDEX_COLORS.wiki.text,       bgColor: KNOWLEDGE_INDEX_COLORS.wiki.bg,       icon: <BookOpen size={12} strokeWidth={2} /> },
    { label: t("home.tile.tags"),       value: stats.tags,     sub: stats.tagsSub,     route: "/library/tags",       color: KNOWLEDGE_INDEX_COLORS.tags.text,       bgColor: KNOWLEDGE_INDEX_COLORS.tags.bg,       icon: <PhTag size={12} strokeWidth={2} /> },
    { label: t("home.tile.references"), value: stats.refs,     sub: stats.refsSub,     route: "/library/references", color: KNOWLEDGE_INDEX_COLORS.references.text, bgColor: KNOWLEDGE_INDEX_COLORS.references.bg, icon: <Quotes size={12} strokeWidth={2} /> },
    { label: t("home.tile.files"),      value: stats.files,    sub: stats.filesSub,    route: "/library/files",      color: KNOWLEDGE_INDEX_COLORS.files.text,      bgColor: KNOWLEDGE_INDEX_COLORS.files.bg,      icon: <Paperclip size={12} strokeWidth={2} /> },
    { label: t("home.tile.stickers"),   value: stats.stickers, sub: stats.stickersSub, route: "/stickers",           color: KNOWLEDGE_INDEX_COLORS.stickers.text,   bgColor: KNOWLEDGE_INDEX_COLORS.stickers.bg,   icon: <StickerIcon size={12} strokeWidth={2} /> },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 min-[640px]:grid-cols-3 min-[960px]:grid-cols-6">
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={() => setActiveRoute(item.route)}
          className="group flex flex-col items-start gap-2 rounded-lg border border-border bg-card px-3 py-4 text-left transition-all duration-150 hover:border-accent/30 hover:bg-accent/[0.03] hover:shadow-sm"
        >
          {/* 2026-05-13: icon을 label 좌측으로 이동. 이전 `justify-between` 패턴은
              label이 길면 (예: "REFERENCES" 10자) icon과 충돌. 좌측 정렬은 길이 무관. */}
          <div className="flex items-center gap-1.5 w-full">
            <span className={`flex h-5 w-5 items-center justify-center rounded ${item.bgColor} ${item.color}`}>
              {item.icon}
            </span>
            <span className="text-2xs font-medium uppercase text-muted-foreground truncate">
              {item.label}
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
