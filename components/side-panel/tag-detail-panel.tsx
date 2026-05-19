"use client"

/**
 * TagDetailPanel — right-side panel for a Tag (Library Tags).
 *
 * P1 Library Tags Detail 강화 (PR #331 Files Detail 패턴 정합). 기존 minimal
 * 버전 (Header + Properties + Used by notes only) → cross-entity 풀구조:
 *
 *   - Header: Tag badge + color dot + name + total cross-entity count
 *   - Connections (NEW): Notes by status breakdown + Wiki articles count + Books count
 *   - Properties (확장): Notes / Wikis / Books / Color
 *   - Used by (확장): Notes + Wiki articles + Books unified list (entity icon row)
 *
 * Tag 특수성:
 *   - Tag interface에 createdAt/updatedAt 없음 → Dates 섹션 생략
 *   - cross-entity tags: Note.tags / WikiArticle.tags / Book.tags? 모두 string[]
 *
 * Rename/Color/Delete는 tags-view 컨텍스트 메뉴 + Library Tags 헤더에
 * 이미 있음 — Detail panel은 정보 표시 + 1-click navigate 한정 (중복 회피).
 */

import { useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import { Tag as PhTag } from "@phosphor-icons/react/dist/ssr/Tag"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { Link as PhLink } from "@phosphor-icons/react/dist/ssr/Link"
import { BookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"
import { IconWiki } from "@/components/plot-icons"
import { cn } from "@/lib/utils"
import { getEntityColor } from "@/lib/colors"
import type { Tag } from "@/lib/types"

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

export function TagDetailPanel({ tag }: { tag: Tag }) {
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const books = usePlotStore((s) => s.books)
  const openNote = usePlotStore((s) => s.openNote)

  // Cross-entity tagged collections (active only — trashed excluded).
  const taggedNotes = useMemo(
    () => notes.filter((n) => !n.trashed && n.tags.includes(tag.id)),
    [notes, tag.id],
  )
  const taggedWikis = useMemo(
    () => wikiArticles.filter((a) => !a.trashed && (a.tags ?? []).includes(tag.id)),
    [wikiArticles, tag.id],
  )
  const taggedBooks = useMemo(
    () => (books ?? []).filter((b) => !b.trashed && (b.tags ?? []).includes(tag.id)),
    [books, tag.id],
  )

  // Note status breakdown (stone / brick / keystone — UI 라벨 "Block" for keystone).
  const notesByStatus = useMemo(() => {
    let stone = 0
    let brick = 0
    let keystone = 0
    for (const n of taggedNotes) {
      if (n.status === "stone") stone++
      else if (n.status === "brick") brick++
      else if (n.status === "keystone") keystone++
    }
    return { stone, brick, keystone }
  }, [taggedNotes])

  const totalCount = taggedNotes.length + taggedWikis.length + taggedBooks.length
  const colorHex = getEntityColor(tag.color)
  const hasColor = tag.color !== null

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1 rounded-md bg-secondary/40 px-1.5 py-0.5 text-2xs font-medium text-muted-foreground">
            <PhTag size={11} weight="regular" />
            Tag
          </span>
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: colorHex }}
            aria-hidden
          />
          <span className="truncate text-note font-medium text-foreground">
            <span className="text-muted-foreground">#</span>
            {tag.name}
          </span>
        </div>
        <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-accent/10 px-1.5 py-0.5 text-2xs font-medium text-accent tabular-nums">
          {totalCount}
        </span>
      </div>

      {/* ── Connections (cross-entity stats) ──────────────── */}
      <InspectorSection title="Connections" icon={<PhLink size={16} weight="regular" />}>
        {totalCount === 0 ? (
          <p className="text-note text-muted-foreground/70 italic px-2 py-1">
            Not used yet
          </p>
        ) : (
          <div className="space-y-2.5">
            {/* Notes + status breakdown */}
            {taggedNotes.length > 0 && (
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-note text-muted-foreground">Notes</span>
                  <span className="text-note tabular-nums text-foreground">{taggedNotes.length}</span>
                </div>
                <div className="flex flex-wrap gap-1 text-2xs">
                  {notesByStatus.stone > 0 && (
                    <span className="rounded bg-secondary/40 px-1.5 py-0.5 text-muted-foreground tabular-nums">
                      Stone {notesByStatus.stone}
                    </span>
                  )}
                  {notesByStatus.brick > 0 && (
                    <span className="rounded bg-secondary/40 px-1.5 py-0.5 text-muted-foreground tabular-nums">
                      Brick {notesByStatus.brick}
                    </span>
                  )}
                  {notesByStatus.keystone > 0 && (
                    <span className="rounded bg-secondary/40 px-1.5 py-0.5 text-muted-foreground tabular-nums">
                      Block {notesByStatus.keystone}
                    </span>
                  )}
                </div>
              </div>
            )}
            {/* Wiki articles */}
            <div className="flex items-center justify-between">
              <span className="text-note text-muted-foreground">Wiki articles</span>
              <span className="text-note tabular-nums text-foreground">{taggedWikis.length}</span>
            </div>
            {/* Books */}
            <div className="flex items-center justify-between">
              <span className="text-note text-muted-foreground">Books</span>
              <span className="text-note tabular-nums text-foreground">{taggedBooks.length}</span>
            </div>
          </div>
        )}
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* ── Properties (= stats only) ────────────────────── */}
      <InspectorSection title="Properties" icon={<FileText size={16} weight="regular" />}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Notes</span>
            <span className="text-note tabular-nums text-foreground">{taggedNotes.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Wikis</span>
            <span className="text-note tabular-nums text-foreground">{taggedWikis.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Books</span>
            <span className="text-note tabular-nums text-foreground">{taggedBooks.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Color</span>
            {hasColor ? (
              <span className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full border border-border-subtle"
                  style={{ backgroundColor: colorHex }}
                />
                <span className="text-note font-mono text-2xs text-muted-foreground/80">
                  {colorHex}
                </span>
              </span>
            ) : (
              <span className="text-note text-muted-foreground/70 italic">None</span>
            )}
          </div>
        </div>
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* ── Used by (unified cross-entity list) ──────────── */}
      <InspectorSection title="Used by" icon={<PhLink size={16} weight="regular" />}>
        {totalCount === 0 ? (
          <p className="text-note text-muted-foreground/70 italic px-2">
            No entities use this tag yet
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {taggedNotes.map((n) => (
              <button
                key={`note-${n.id}`}
                onClick={() => openNote(n.id)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-note text-foreground hover:bg-hover-bg transition-colors"
              >
                <FileText size={13} weight="regular" className="shrink-0 text-muted-foreground" />
                <span className="truncate flex-1">{n.title || "Untitled"}</span>
              </button>
            ))}
            {taggedWikis.map((a) => (
              <div
                key={`wiki-${a.id}`}
                className="flex items-center gap-2 rounded-md px-2 py-1 text-note text-muted-foreground"
                title={a.title || "Untitled"}
              >
                <IconWiki size={13} className="shrink-0" />
                <span className="truncate flex-1">{a.title || "Untitled"}</span>
              </div>
            ))}
            {taggedBooks.map((b) => (
              <div
                key={`book-${b.id}`}
                className="flex items-center gap-2 rounded-md px-2 py-1 text-note text-muted-foreground"
                title={b.title || "Untitled"}
              >
                <BookOpen size={13} className="shrink-0" />
                <span className="truncate flex-1">{b.title || "Untitled"}</span>
              </div>
            ))}
          </div>
        )}
      </InspectorSection>
    </div>
  )
}
