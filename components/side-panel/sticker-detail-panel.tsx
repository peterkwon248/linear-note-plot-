"use client"

/**
 * StickerDetailPanel — right-side panel for a Sticker (Library Stickers).
 *
 * Library-detail-panels follow-up (2026-05-14): PR #331 (Files Detail) +
 * PR #334 (Tags Detail) 패턴을 Stickers entity로 확장. Library 3 entity
 * (Files / Tags / Stickers) 사이드바 통합 완성.
 *
 * Sticker 특수성 (vs Tag):
 *   - createdAt 있음 → Dates 섹션 살아남
 *   - members: EntityRef[] (cross-entity) — note/wiki/tag/label/category/
 *     file/reference 7종 모두 참조 가능. "Used by" 풍부.
 *   - Tag와 달리 Sticker는 forward reference (members on Sticker 자체)
 *
 * Plot 일반 패턴 정합:
 *   - Header: Sticker + leading color dot + name + member count badge
 *   - Dates: Created / Age
 *   - Properties (= stats only): Total + kind별 breakdown
 *   - Used by: members list, kind별 그룹, note/wiki는 클릭 가능
 *
 * Rename/Color/Delete actions는 stickers-view 컨텍스트 메뉴에 이미 있음 — 중복 회피.
 */

import { useMemo } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { usePlotStore } from "@/lib/store"
import { Sticker as StickerIcon } from "@phosphor-icons/react/dist/ssr/Sticker"
import { CalendarBlank } from "@phosphor-icons/react/dist/ssr/CalendarBlank"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { Link as PhLink } from "@phosphor-icons/react/dist/ssr/Link"
import { Tag as PhTag } from "@phosphor-icons/react/dist/ssr/Tag"
import { IconWiki } from "@/components/plot-icons"
import { navigateToWikiArticle } from "@/lib/wiki-article-nav"
import { cn } from "@/lib/utils"
import type { Sticker, EntityKind } from "@/lib/types"

const KIND_LABEL: Record<EntityKind, string> = {
  note: "Notes",
  wiki: "Wikis",
  tag: "Tags",
  label: "Labels",
  category: "Categories",
  file: "Files",
  reference: "References",
}

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

export function StickerDetailPanel({ sticker }: { sticker: Sticker }) {
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const tags = usePlotStore((s) => s.tags)
  const labels = usePlotStore((s) => s.labels)
  const wikiCategories = usePlotStore((s) => s.wikiCategories)
  const attachments = usePlotStore((s) => s.attachments ?? [])
  const references = usePlotStore((s) => s.references)
  const openNote = usePlotStore((s) => s.openNote)

  // Active members only — skip refs pointing at trashed/missing entities.
  const resolvedMembers = useMemo(() => {
    return sticker.members
      .map((ref) => {
        let title: string | null = null
        let trashed = false
        switch (ref.kind) {
          case "note": {
            const n = notes.find((x) => x.id === ref.id)
            if (n) { title = n.title || "Untitled"; trashed = !!n.trashed }
            break
          }
          case "wiki": {
            const a = wikiArticles.find((x) => x.id === ref.id)
            if (a) { title = a.title || "Untitled"; trashed = !!a.trashed }
            break
          }
          case "tag": {
            const t = tags.find((x) => x.id === ref.id)
            if (t) { title = t.name; trashed = !!t.trashed }
            break
          }
          case "label": {
            const l = labels.find((x) => x.id === ref.id)
            if (l) { title = l.name; trashed = !!l.trashed }
            break
          }
          case "category": {
            const c = wikiCategories.find((x) => x.id === ref.id)
            if (c) { title = c.name; trashed = !!c.trashed }
            break
          }
          case "file": {
            const f = attachments.find((x) => x.id === ref.id)
            if (f) { title = f.name; trashed = !!f.trashed }
            break
          }
          case "reference": {
            const r = references[ref.id]
            if (r) { title = r.title; trashed = !!r.trashed }
            break
          }
        }
        return { kind: ref.kind, id: ref.id, title, trashed }
      })
      .filter((m) => m.title !== null && !m.trashed) as { kind: EntityKind; id: string; title: string; trashed: false }[]
  }, [sticker.members, notes, wikiArticles, tags, labels, wikiCategories, attachments, references])

  // kind별 breakdown — keep only kinds that exist on this sticker.
  const breakdown = useMemo(() => {
    const result: Partial<Record<EntityKind, number>> = {}
    for (const m of resolvedMembers) {
      result[m.kind] = (result[m.kind] ?? 0) + 1
    }
    return result
  }, [resolvedMembers])

  // Group resolved members by kind for the Used by list.
  const groupedMembers = useMemo(() => {
    const groups: Partial<Record<EntityKind, typeof resolvedMembers>> = {}
    for (const m of resolvedMembers) {
      if (!groups[m.kind]) groups[m.kind] = []
      groups[m.kind]!.push(m)
    }
    return groups
  }, [resolvedMembers])

  const totalMembers = resolvedMembers.length

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1 rounded-md bg-secondary/40 px-1.5 py-0.5 text-2xs font-medium text-muted-foreground">
            <StickerIcon size={11} weight="regular" />
            Sticker
          </span>
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: sticker.color }}
            aria-hidden
          />
          <span className="truncate text-note font-medium text-foreground">
            {sticker.name}
          </span>
        </div>
        <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-accent/10 px-1.5 py-0.5 text-2xs font-medium text-accent tabular-nums">
          {totalMembers}
        </span>
      </div>

      {/* ── Dates ────────────────────────────────────────── */}
      <InspectorSection title="Dates" icon={<CalendarBlank size={16} weight="regular" />}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Created</span>
            <span className="text-note text-foreground" title={sticker.createdAt}>
              {format(new Date(sticker.createdAt), "MMM d, yyyy")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Age</span>
            <span className="text-note text-muted-foreground/70">
              {formatDistanceToNow(new Date(sticker.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* ── Properties (= stats only) ────────────────────── */}
      <InspectorSection title="Properties" icon={<FileText size={16} weight="regular" />}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Total members</span>
            <span className="text-note tabular-nums text-foreground">{totalMembers}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Color</span>
            <span className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full border border-border-subtle"
                style={{ backgroundColor: sticker.color }}
              />
              <span className="text-note font-mono text-2xs text-muted-foreground/80">
                {sticker.color}
              </span>
            </span>
          </div>
          {/* kind별 breakdown (only kinds that appear) */}
          {(Object.keys(breakdown) as EntityKind[]).map((kind) => (
            <div key={kind} className="flex items-center justify-between">
              <span className="text-note text-muted-foreground">{KIND_LABEL[kind]}</span>
              <span className="text-note tabular-nums text-muted-foreground/80">
                {breakdown[kind]}
              </span>
            </div>
          ))}
        </div>
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* ── Used by (cross-entity members) ───────────────── */}
      <InspectorSection title="Used by" icon={<PhLink size={16} weight="regular" />}>
        {totalMembers === 0 ? (
          <p className="text-note text-muted-foreground/70 italic px-2">
            No members yet
          </p>
        ) : (
          <div className="space-y-3">
            {(Object.keys(groupedMembers) as EntityKind[]).map((kind) => {
              const items = groupedMembers[kind]
              if (!items || items.length === 0) return null
              return (
                <div key={kind} className="flex flex-col gap-0.5">
                  <span className="px-2 text-2xs font-semibold uppercase tracking-wider text-accent/80">
                    {KIND_LABEL[kind]}
                  </span>
                  {items.map((m) => (
                    <MemberRow
                      key={`${m.kind}:${m.id}`}
                      kind={m.kind}
                      title={m.title}
                      onClick={() => {
                        if (m.kind === "note") openNote(m.id)
                        else if (m.kind === "wiki") navigateToWikiArticle(m.id)
                        // 다른 kind는 navigation 없음 — list view에서 처리
                      }}
                      navigable={m.kind === "note" || m.kind === "wiki"}
                    />
                  ))}
                </div>
              )
            })}
          </div>
        )}
      </InspectorSection>
    </div>
  )
}

function MemberRow({
  kind,
  title,
  onClick,
  navigable,
}: {
  kind: EntityKind
  title: string
  onClick: () => void
  navigable: boolean
}) {
  const Icon = (() => {
    switch (kind) {
      case "note": return FileText
      case "wiki": return IconWiki
      case "tag": return PhTag
      case "label": return PhTag
      case "category": return IconWiki
      case "file": return FileText
      case "reference": return FileText
      default: return FileText
    }
  })()
  return (
    <button
      onClick={navigable ? onClick : undefined}
      disabled={!navigable}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-note transition-colors",
        navigable
          ? "text-foreground hover:bg-hover-bg cursor-pointer"
          : "text-muted-foreground cursor-default",
      )}
    >
      <Icon size={13} weight="regular" className="shrink-0 text-muted-foreground" />
      <span className="truncate flex-1">{title}</span>
    </button>
  )
}
