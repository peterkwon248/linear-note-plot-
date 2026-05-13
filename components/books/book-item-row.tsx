"use client"

/**
 * BookItemRow — single row in a Book's items list (Phase 3).
 *
 * Renders three variants based on `item.kind`:
 *  - `note`            — drag handle + StatusShapeIcon + title + remove ×
 *  - `wiki`            — drag handle + Wiki stub/article icon + title + remove ×
 *  - `chapter-heading` — bold heading + horizontal divider, click to edit
 *
 * Uses dnd-kit `useSortable` to integrate with the parent SortableContext.
 * Up/Down chevron buttons are always visible for accessibility (PRD §7);
 * the drag handle is hover-only to keep the row clean.
 *
 * Stale ref handling (PRD §10): when the referenced note/wiki has been
 * independently deleted, the row renders an "Item no longer available"
 * placeholder with only the × button so the user can clean up.
 */

import { useState, useEffect, useMemo, useRef, type ReactNode } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { usePlotStore } from "@/lib/store"
import type { ResolvedBookItem } from "@/lib/books/resolver"
import { Folder as PhFolder } from "@phosphor-icons/react/dist/ssr/Folder"
import { BookOpen as PhBookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"
import { Hash as PhHash } from "@phosphor-icons/react/dist/ssr/Hash"
import { Sticker as PhSticker } from "@phosphor-icons/react/dist/ssr/Sticker"
import { toast } from "sonner"
import { StatusShapeIcon } from "@/components/status-icon"
import { IconWikiStub, IconWikiArticle } from "@/components/plot-icons"
import { isWikiStub } from "@/lib/wiki-utils"
import { WIKI_STATUS_HEX } from "@/lib/colors"
import { DotsSixVertical } from "@phosphor-icons/react/dist/ssr/DotsSixVertical"
import { CaretUp } from "@phosphor-icons/react/dist/ssr/CaretUp"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { Warning } from "@phosphor-icons/react/dist/ssr/Warning"
import { cn } from "@/lib/utils"

interface BookItemRowProps {
  bookId: string
  item: ResolvedBookItem
  /** Whether ↑ should be enabled (false for first item in sorted list). */
  canMoveUp: boolean
  /** Whether ↓ should be enabled (false for last item). */
  canMoveDown: boolean
  /** Move this item one position up among the sorted list. */
  onMoveUp: () => void
  /** Move this item one position down among the sorted list. */
  onMoveDown: () => void
  /** Open the referenced entity (note/wiki). No-op for headings. */
  onOpen?: () => void
}

export function BookItemRow({
  bookId,
  item,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onOpen,
}: BookItemRowProps) {
  const removeItemFromBook = usePlotStore((s) => s.removeItemFromBook)
  const updateChapterHeading = usePlotStore((s) => s.updateChapterHeading)
  const addExcludeId = usePlotStore((s) => s.addExcludeId)
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const folders = usePlotStore((s) => s.folders)
  const wikiCategories = usePlotStore((s) => s.wikiCategories)
  const tags = usePlotStore((s) => s.tags)
  const labels = usePlotStore((s) => s.labels)
  const stickers = usePlotStore((s) => s.stickers)

  // v2 Phase G: auto entity items (note/wiki) are draggable within their
  // source group; auto chapter-headings stay fixed (auto-generated).
  // book-detail-page handleDragEnd enforces same-source restriction.
  const isAutoHeading = item.source === "auto" && item.kind === "chapter-heading"
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id, disabled: isAutoHeading })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // isAuto + sourceInfo hoisted above all conditional returns (hooks rules).
  const isAuto = item.source === "auto"
  // Tweak B (Phase F): resolve the smart-source provenance across all 5
  // kinds — folder / category / tag / label / sticker. The resolver tags
  // sourceRefId on both auto items and manual items that also match a
  // smart source (probe order in resolver). UI uses this for a subtle
  // "also in {source}" hint badge so users understand why a manual note
  // didn't surface as auto (it's already manual).
  const sourceInfo = useMemo<{
    kind: "folder" | "category" | "tag" | "label" | "sticker"
    name: string
  } | null>(() => {
    if (!item.sourceRefId || item.kind === "chapter-heading") return null
    const refId = item.sourceRefId
    const folder = folders.find((f) => f.id === refId)
    if (folder) return { kind: "folder", name: folder.name }
    const category = wikiCategories.find((c) => c.id === refId)
    if (category) return { kind: "category", name: category.name }
    const tag = tags.find((t) => t.id === refId)
    if (tag) return { kind: "tag", name: tag.name }
    const label = labels.find((l) => l.id === refId)
    if (label) return { kind: "label", name: label.name }
    const sticker = stickers?.find((st) => st.id === refId)
    if (sticker) return { kind: "sticker", name: sticker.name }
    return null
  }, [item.sourceRefId, item.kind, folders, wikiCategories, tags, labels, stickers])
  const showManualBadge = !isAuto && !!sourceInfo

  const handleRemove = () => {
    if (item.source === "auto") {
      if (item.kind === "note" || item.kind === "wiki") {
        addExcludeId(bookId, item.refId)
        toast("Excluded from auto-fill", { duration: 1500 })
      }
      // Auto chapter-heading: no-op (managed at SourcesSection level)
      return
    }
    removeItemFromBook(bookId, item.id)
  }

  /* ── Variant: chapter-heading ─────────────────────── */
  if (item.kind === "chapter-heading") {
    return (
      <ChapterHeadingRow
        nodeRef={setNodeRef}
        style={style}
        attributes={attributes}
        listeners={listeners as any}
        title={item.title}
        canMoveUp={canMoveUp && !isAuto}
        canMoveDown={canMoveDown && !isAuto}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onTitleChange={(title) => updateChapterHeading(bookId, item.id, title)}
        onRemove={handleRemove}
        isAuto={isAuto}
      />
    )
  }

  /* ── Variant: note / wiki ─────────────────────────── */

  let title = ""
  let icon: React.ReactNode = null
  let isStale = false

  if (item.kind === "note") {
    const note = notes.find((n) => n.id === item.refId && !n.trashed)
    if (note) {
      title = note.title || "Untitled"
      icon = <StatusShapeIcon status={note.status} size={14} />
    } else {
      isStale = true
    }
  } else {
    const wiki = wikiArticles.find((w) => w.id === item.refId)
    if (wiki) {
      title = wiki.title || "Untitled"
      icon = isWikiStub(wiki) ? (
        <IconWikiStub size={14} style={{ color: WIKI_STATUS_HEX.stub }} />
      ) : (
        <IconWikiArticle size={14} style={{ color: WIKI_STATUS_HEX.article }} />
      )
    } else {
      isStale = true
    }
  }

  if (isStale) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="group flex items-center gap-2 rounded-md px-2 py-1.5 text-note text-muted-foreground/70"
      >
        <Warning size={14} className="shrink-0 text-amber-500" weight="regular" />
        <span className="flex-1 italic">Item no longer available</span>
        <RemoveButton onClick={handleRemove} />
      </div>
    )
  }

  const autoTooltip = sourceInfo
    ? `Auto from ${sourceInfo.kind} "${sourceInfo.name}" — click × to exclude`
    : undefined

  // Leading slot icon for auto rows: matches the smart source kind so the
  // user can scan provenance at a glance (📁 folder, 📚 category, # tag,
  // 🏷 label, ✨ sticker). Falls back to folder for legacy rows where the
  // source no longer resolves.
  const renderSourceIcon = (size: number): ReactNode => {
    const kind = sourceInfo?.kind
    if (kind === "category")
      return <PhBookOpen size={size} weight="regular" className="text-muted-foreground/40" />
    if (kind === "tag")
      return <PhHash size={size} weight="regular" className="text-muted-foreground/40" />
    if (kind === "label")
      return (
        <span
          className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40"
          aria-hidden="true"
        />
      )
    if (kind === "sticker")
      return <PhSticker size={size} weight="regular" className="text-muted-foreground/40" />
    return <PhFolder size={size} weight="regular" className="text-muted-foreground/40" />
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-1 rounded-md pl-1 pr-2 py-1.5 transition-colors",
        "hover:bg-hover-bg",
        isAuto && "bg-muted/15",
      )}
      title={autoTooltip}
    >
      {/* Drag handle — manual rows + auto entity rows (within source).
          Auto chapter-headings stay non-draggable: show source-kind
          icon instead (chapter title already identifies the source). */}
      {!isAutoHeading ? (
        <button
          {...attributes}
          {...(listeners as any)}
          type="button"
          aria-label="Drag to reorder"
          className="flex h-6 w-5 items-center justify-center text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100 cursor-grab active:cursor-grabbing"
          title={isAuto ? "같은 소스 안에서 옮기기" : "Drag to reorder"}
        >
          <DotsSixVertical size={14} weight="bold" />
        </button>
      ) : (
        <span
          className="flex h-6 w-5 items-center justify-center"
          title={autoTooltip}
        >
          {renderSourceIcon(11)}
        </span>
      )}

      {/* Up / Down buttons — same rule as drag handle: auto entity rows
          can move within source; auto chapter-headings are fixed. */}
      <div className="flex items-center">
        <button
          type="button"
          aria-label="Move up"
          onClick={onMoveUp}
          disabled={!canMoveUp || isAutoHeading}
          className="flex h-6 w-5 items-center justify-center rounded text-muted-foreground/60 hover:text-foreground hover:bg-hover-bg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title={isAutoHeading ? "자동 챕터 헤딩은 옮길 수 없습니다" : "Move up"}
        >
          <CaretUp size={11} weight="bold" />
        </button>
        <button
          type="button"
          aria-label="Move down"
          onClick={onMoveDown}
          disabled={!canMoveDown || isAutoHeading}
          className="flex h-6 w-5 items-center justify-center rounded text-muted-foreground/60 hover:text-foreground hover:bg-hover-bg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title={isAutoHeading ? "자동 챕터 헤딩은 옮길 수 없습니다" : "Move down"}
        >
          <CaretDown size={11} weight="bold" />
        </button>
      </div>

      {/* Entity icon (옅은 색 if auto) */}
      <span className={cn(
        "flex shrink-0 items-center justify-center w-5 h-5 ml-0.5",
        isAuto && "opacity-70",
      )}>
        {icon}
      </span>

      {/* Title — click to open */}
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "flex-1 truncate text-left text-note hover:text-accent transition-colors",
          isAuto ? "text-foreground/70" : "text-foreground",
        )}
      >
        {title}
      </button>

      {/* Tweak B: subtle hint when a manual note also lives in a smart
          source. Helps users understand why adding the source didn't
          surface this note as auto (it's already manual). Phase F: icon
          matches the source kind across all 5 source kinds. */}
      {showManualBadge && sourceInfo && (
        <span
          className="flex shrink-0 items-center gap-0.5 text-2xs text-muted-foreground/40"
          title={`Also in "${sourceInfo.name}" ${sourceInfo.kind} source`}
        >
          {renderSourceIcon(10)}
        </span>
      )}

      <RemoveButton
        onClick={handleRemove}
        title={isAuto ? "Exclude from auto-fill" : "Remove from book"}
      />
    </div>
  )
}

/* ── Chapter heading row ───────────────────────────────────── */

interface ChapterHeadingRowProps {
  title: string
  canMoveUp: boolean
  canMoveDown: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onTitleChange: (title: string) => void
  onRemove: () => void
  attributes: Record<string, any>
  listeners?: Record<string, any>
  style: React.CSSProperties
  nodeRef: (node: HTMLDivElement | null) => void
  isAuto?: boolean
}

function ChapterHeadingRow({
  title,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onTitleChange,
  onRemove,
  attributes,
  listeners,
  style,
  nodeRef,
  isAuto = false,
}: ChapterHeadingRowProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      setDraft(title)
      setTimeout(() => inputRef.current?.select(), 0)
    }
  }, [editing, title])

  const commit = () => {
    const next = draft.trim()
    if (next !== title) onTitleChange(next)
    setEditing(false)
  }

  const cancel = () => {
    setDraft(title)
    setEditing(false)
  }

  return (
    <div ref={nodeRef} style={style} className={cn(
      "group mt-4 mb-1 first:mt-0",
      isAuto && "opacity-60",
    )}>
      <div className="flex items-center gap-2 px-1">
        {/* Drag handle (hover-only, hidden for auto) */}
        {!isAuto ? (
          <button
            {...attributes}
            {...listeners}
            type="button"
            aria-label="Drag heading"
            className="flex h-6 w-5 items-center justify-center text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100 cursor-grab active:cursor-grabbing"
            title="Drag to reorder"
          >
            <DotsSixVertical size={14} weight="bold" />
          </button>
        ) : (
          <div className="w-5" />
        )}

        {/* Up / Down (hidden for auto) */}
        {!isAuto ? (
          <div className="flex items-center">
            <button
              type="button"
              aria-label="Move heading up"
              onClick={onMoveUp}
              disabled={!canMoveUp}
              className="flex h-6 w-5 items-center justify-center rounded text-muted-foreground/60 hover:text-foreground hover:bg-hover-bg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Move up"
            >
              <CaretUp size={11} weight="bold" />
            </button>
            <button
              type="button"
              aria-label="Move heading down"
              onClick={onMoveDown}
              disabled={!canMoveDown}
              className="flex h-6 w-5 items-center justify-center rounded text-muted-foreground/60 hover:text-foreground hover:bg-hover-bg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Move down"
            >
              <CaretDown size={11} weight="bold" />
            </button>
          </div>
        ) : (
          <div className="w-10" />
        )}

        {/* Heading body — title + divider line */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          {isAuto ? (
            <span
              className="text-note font-semibold text-foreground/70 px-0.5 truncate text-left"
              title="Auto-generated heading from smart source"
            >
              {title}
            </span>
          ) : editing ? (
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  commit()
                } else if (e.key === "Escape") {
                  e.preventDefault()
                  cancel()
                }
              }}
              placeholder="Heading"
              className="text-note font-semibold text-foreground bg-transparent border-b border-accent/40 px-0.5 py-0.5 focus:outline-none focus:border-accent min-w-[120px] max-w-[280px]"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-note font-semibold text-foreground hover:text-accent transition-colors px-0.5 truncate text-left"
              title="Click to edit heading"
            >
              {title || (
                <span className="text-muted-foreground/60 italic font-normal">
                  Untitled heading
                </span>
              )}
            </button>
          )}
          <div className="flex-1 border-t border-border/60" />
        </div>

        {/* Remove × hidden for auto heading (managed via SourcesSection) */}
        {!isAuto && <RemoveButton onClick={onRemove} />}
      </div>
    </div>
  )
}

/* ── Remove × button (shared) ─────────────────────────────── */

function RemoveButton({ onClick, title = "Remove from book" }: { onClick: () => void; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={title}
      title={title}
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground/50 opacity-0 transition-all group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
    >
      <PhX size={12} weight="bold" />
    </button>
  )
}
