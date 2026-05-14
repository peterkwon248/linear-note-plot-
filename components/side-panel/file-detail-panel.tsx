"use client"

/**
 * FileDetailPanel — right-side panel for an Attachment (Library Files).
 *
 * Library-detail-panels PR (2026-05-14): 사용자 시그널 — "라이브러리에
 * 저장된 파일은 클릭해도 왜 보이지가 않지? 보여줘야 의미가 있지. 사이드바도
 * 있어야지. 언제 저장되었고, 어디서 저장되었으며, 또 어떤 것들에 저장이
 * 되어있는지." → Files entity의 Detail panel 신설.
 *
 * Plot 일반 패턴 정합 (Note/Wiki/Template/Book Detail과 동일):
 *   - Header: File + type badge (Image/Document/etc) + delete action
 *   - Preview: image type만 thumbnail (간단 fallback X — image 전용 가시화)
 *   - Dates: Uploaded (createdAt)
 *   - Source: 처음 업로드된 note (attachment.noteId)
 *   - Used in: source note + wiki articles의 blocks(type="image")에서
 *     이 attachmentId를 reference하는 모든 entity
 *   - Properties (= stats only): Size / Type / MIME
 *   - Actions: Open source / Delete attachment
 */

import { useMemo } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { usePlotStore } from "@/lib/store"
import { CalendarBlank } from "@phosphor-icons/react/dist/ssr/CalendarBlank"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { Paperclip } from "@phosphor-icons/react/dist/ssr/Paperclip"
import { Image as PhImage } from "@phosphor-icons/react/dist/ssr/Image"
import { Lightning } from "@phosphor-icons/react/dist/ssr/Lightning"
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr/ArrowSquareOut"
import { Link as PhLink } from "@phosphor-icons/react/dist/ssr/Link"
import { IconWiki } from "@/components/plot-icons"
import { cn } from "@/lib/utils"
import type { Attachment } from "@/lib/types"

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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function FileDetailPanel({ attachment }: { attachment: Attachment }) {
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const openNote = usePlotStore((s) => s.openNote)

  const isImage = attachment.type === "image" || attachment.mimeType?.startsWith("image/")

  // Source note: where the attachment was originally uploaded.
  const sourceNote = useMemo(
    () => notes.find((n) => n.id === attachment.noteId) ?? null,
    [notes, attachment.noteId],
  )

  // Used in: wiki articles whose blocks reference this attachment.
  // (Plot wiki blocks of type "image" carry `attachmentId`.)
  const usedInWikis = useMemo(() => {
    return wikiArticles.filter((a) =>
      (a.blocks ?? []).some(
        (b) => b.type === "image" && b.attachmentId === attachment.id,
      ),
    )
  }, [wikiArticles, attachment.id])

  const typeLabel = (() => {
    if (isImage) return "Image"
    if (attachment.type) return attachment.type.charAt(0).toUpperCase() + attachment.type.slice(1)
    return "File"
  })()

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-secondary/40 px-1.5 py-0.5 text-2xs font-medium text-muted-foreground">
            {isImage ? <PhImage size={11} weight="regular" /> : <Paperclip size={11} weight="regular" />}
            File
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-1.5 py-0.5 text-2xs font-medium text-accent">
            {typeLabel}
          </span>
        </div>
      </div>

      {/* ── Image preview (image type only) ──────────────── */}
      {isImage && attachment.url && (
        <div className="border-b border-border bg-muted/20 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={attachment.url}
            alt={attachment.name}
            className="mx-auto max-h-48 w-auto rounded-md object-contain"
          />
          <p
            className="mt-2 truncate text-center text-2xs text-muted-foreground"
            title={attachment.name}
          >
            {attachment.name}
          </p>
        </div>
      )}

      {/* ── Dates ────────────────────────────────────────── */}
      <InspectorSection title="Dates" icon={<CalendarBlank size={16} weight="regular" />}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Uploaded</span>
            <span className="text-note text-foreground" title={attachment.createdAt}>
              {format(new Date(attachment.createdAt), "MMM d, yyyy")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Age</span>
            <span className="text-note text-muted-foreground/70">
              {formatDistanceToNow(new Date(attachment.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* ── Source (where it was uploaded) ───────────────── */}
      <InspectorSection title="Source" icon={<FileText size={16} weight="regular" />}>
        {sourceNote ? (
          <button
            onClick={() => openNote(sourceNote.id)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-note text-foreground hover:bg-hover-bg transition-colors"
          >
            <FileText size={13} weight="regular" className="shrink-0 text-muted-foreground" />
            <span className="truncate flex-1">{sourceNote.title || "Untitled"}</span>
          </button>
        ) : (
          <p className="text-note text-muted-foreground italic px-2">Source unknown</p>
        )}
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* ── Used in (cross-reference) ────────────────────── */}
      {(usedInWikis.length > 0) && (
        <>
          <InspectorSection title="Used in" icon={<PhLink size={16} weight="regular" />}>
            <div className="flex flex-col gap-0.5">
              {usedInWikis.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1 text-note text-muted-foreground"
                >
                  <IconWiki size={13} className="shrink-0" />
                  <span className="truncate">{a.title || "Untitled"}</span>
                </div>
              ))}
            </div>
          </InspectorSection>
          <div className="mx-4 border-b border-border" />
        </>
      )}

      {/* ── Properties (= stats only) ────────────────────── */}
      <InspectorSection title="Properties" icon={<FileText size={16} weight="regular" />}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Size</span>
            <span className="text-note tabular-nums text-foreground">
              {formatBytes(attachment.size)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Type</span>
            <span className="text-note text-foreground capitalize">{typeLabel}</span>
          </div>
          {attachment.mimeType && (
            <div className="flex items-center justify-between">
              <span className="text-note text-muted-foreground">MIME</span>
              <span className="text-note text-muted-foreground/80 font-mono text-2xs truncate ml-2">
                {attachment.mimeType}
              </span>
            </div>
          )}
        </div>
      </InspectorSection>

      <div className="mx-4 border-b border-border" />

      {/* ── Actions ──────────────────────────────────────── */}
      {/* Delete action 미구현 — attachments slice에 deleteAttachment 액션 없음.
          별도 PR에서 trash flow 추가 시 활성화. 이번 PR은 Detail 정보 표시 한정. */}
      <InspectorSection title="Actions" icon={<Lightning size={16} weight="regular" />}>
        <div className="flex flex-col gap-2">
          {attachment.url && (
            <a
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-note font-medium text-muted-foreground hover:bg-hover-bg hover:text-foreground transition-colors"
            >
              <ArrowSquareOut size={14} weight="regular" />
              Open in new tab
            </a>
          )}
        </div>
      </InspectorSection>
    </div>
  )
}
