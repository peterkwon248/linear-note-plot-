"use client"

/**
 * TagDetailPanel — right-side panel for a Tag (Library Tags).
 *
 * Library-detail-panels follow-up (2026-05-14): PR #331 (Files Detail) 패턴을
 * Tags entity로 확장. 사용자 시그널 "라이브러리 entity (Files/Tags/Stickers)
 * 모두 4탭 사이드바 통합" → 두 번째 Library entity (Tags) Detail panel.
 *
 * Tag 특수성:
 *   - Tag interface에 createdAt/updatedAt 없음 → Dates 섹션 생략
 *   - Tag는 cross-reference attribute (Files처럼 "source" 없음)
 *   - "Used by" = notes with this tag (Files의 Used in 패턴)
 *
 * Plot 일반 패턴 정합 (Note/Wiki/Template/Book/File Detail과 동일):
 *   - Header: Tag + leading color dot + note count badge
 *   - Properties (= stats only): Note count / Color
 *   - Used by: notes with this tag (cross-reference list)
 *
 * Rename/Color/Delete actions는 tags-view 컨텍스트 메뉴에 이미 있음 — 중복 회피.
 */

import { useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import { Tag as PhTag } from "@phosphor-icons/react/dist/ssr/Tag"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { Link as PhLink } from "@phosphor-icons/react/dist/ssr/Link"
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
  const openNote = usePlotStore((s) => s.openNote)

  // Used by: active notes carrying this tag.
  const taggedNotes = useMemo(
    () => notes.filter((n) => !n.trashed && n.tags.includes(tag.id)),
    [notes, tag.id],
  )

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
          {taggedNotes.length}
        </span>
      </div>

      {/* ── Properties (= stats only) ────────────────────── */}
      <InspectorSection title="Properties" icon={<FileText size={16} weight="regular" />}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Notes</span>
            <span className="text-note tabular-nums text-foreground">
              {taggedNotes.length}
            </span>
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

      {/* ── Used by (cross-reference) ────────────────────── */}
      <InspectorSection title="Used by" icon={<PhLink size={16} weight="regular" />}>
        {taggedNotes.length === 0 ? (
          <p className="text-note text-muted-foreground/70 italic px-2">
            No notes use this tag yet
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {taggedNotes.map((n) => (
              <button
                key={n.id}
                onClick={() => openNote(n.id)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-note text-foreground hover:bg-hover-bg transition-colors"
              >
                <FileText size={13} weight="regular" className="shrink-0 text-muted-foreground" />
                <span className="truncate flex-1">{n.title || "Untitled"}</span>
              </button>
            ))}
          </div>
        )}
      </InspectorSection>
    </div>
  )
}
