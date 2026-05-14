"use client"

/**
 * LabelDetailPanel — right-side panel for a Label (Library Labels).
 *
 * Library-detail-panels follow-up (2026-05-14): TagDetailPanel (PR #334)
 * 패턴 그대로 Labels entity로 확장. Library entity-uniformity 100% 완성
 * (Files / Tags / Stickers / References + 이제 Labels).
 *
 * Label 특수성 (vs Tag):
 *   - Label.color는 non-null (Tag와 달리 항상 색 있음)
 *   - Label은 1:N (note당 1 label) — Tag는 N:M (note당 N tags)
 *   - "Used by" = notes with this label (Note.labelId === label.id)
 *   - Tag와 마찬가지로 createdAt/updatedAt 없음 → Dates 섹션 생략
 *
 * Plot 일반 패턴 정합:
 *   - Header: Label icon + color dot + name + note count badge
 *   - Properties (= stats only): Notes count / Color
 *   - Used by: notes with this label (cross-reference list)
 *
 * Rename/Color/Delete actions는 labels-view 컨텍스트 메뉴에 이미 있음 — 중복 회피.
 */

import { useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import { Bookmark as PhBookmark } from "@phosphor-icons/react/dist/ssr/Bookmark"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { Link as PhLink } from "@phosphor-icons/react/dist/ssr/Link"
import { cn } from "@/lib/utils"
import type { Label } from "@/lib/types"

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

export function LabelDetailPanel({ label }: { label: Label }) {
  const notes = usePlotStore((s) => s.notes)
  const openNote = usePlotStore((s) => s.openNote)

  // Used by: active notes carrying this label (1:N — Note.labelId is a
  // single id, unlike Tag.tags array).
  const labeledNotes = useMemo(
    () => notes.filter((n) => !n.trashed && n.labelId === label.id),
    [notes, label.id],
  )

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1 rounded-md bg-secondary/40 px-1.5 py-0.5 text-2xs font-medium text-muted-foreground">
            <PhBookmark size={11} weight="regular" />
            Label
          </span>
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: label.color }}
            aria-hidden
          />
          <span className="truncate text-note font-medium text-foreground">
            {label.name}
          </span>
        </div>
        <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-accent/10 px-1.5 py-0.5 text-2xs font-medium text-accent tabular-nums">
          {labeledNotes.length}
        </span>
      </div>

      {/* ── Properties (= stats only) ────────────────────── */}
      <InspectorSection title="Properties" icon={<FileText size={16} weight="regular" />}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Notes</span>
            <span className="text-note tabular-nums text-foreground">
              {labeledNotes.length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Color</span>
            <span className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full border border-border-subtle"
                style={{ backgroundColor: label.color }}
              />
              <span className="text-note font-mono text-2xs text-muted-foreground/80">
                {label.color}
              </span>
            </span>
          </div>
        </div>
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* ── Used by (cross-reference) ────────────────────── */}
      <InspectorSection title="Used by" icon={<PhLink size={16} weight="regular" />}>
        {labeledNotes.length === 0 ? (
          <p className="text-note text-muted-foreground/70 italic px-2">
            No notes use this label yet
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {labeledNotes.map((n) => (
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
