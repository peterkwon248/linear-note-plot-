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

import { useState, useEffect, useRef } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { usePlotStore } from "@/lib/store"
import type { BookItem } from "@/lib/types"
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
  item: BookItem
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
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleRemove = () => removeItemFromBook(bookId, item.id)

  /* ── Variant: chapter-heading ─────────────────────── */
  if (item.kind === "chapter-heading") {
    return (
      <ChapterHeadingRow
        nodeRef={setNodeRef}
        style={style}
        attributes={attributes}
        listeners={listeners as any}
        title={item.title}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onTitleChange={(title) => updateChapterHeading(bookId, item.id, title)}
        onRemove={handleRemove}
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-1 rounded-md pl-1 pr-2 py-1.5 transition-colors",
        "hover:bg-hover-bg",
      )}
    >
      {/* Drag handle (hover-only) */}
      <button
        {...attributes}
        {...(listeners as any)}
        type="button"
        aria-label="Drag to reorder"
        className="flex h-6 w-5 items-center justify-center text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100 cursor-grab active:cursor-grabbing"
        title="Drag to reorder"
      >
        <DotsSixVertical size={14} weight="bold" />
      </button>

      {/* Up / Down buttons (always visible for accessibility) */}
      <div className="flex items-center">
        <button
          type="button"
          aria-label="Move up"
          onClick={onMoveUp}
          disabled={!canMoveUp}
          className="flex h-6 w-5 items-center justify-center rounded text-muted-foreground/60 hover:text-foreground hover:bg-hover-bg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Move up"
        >
          <CaretUp size={11} weight="bold" />
        </button>
        <button
          type="button"
          aria-label="Move down"
          onClick={onMoveDown}
          disabled={!canMoveDown}
          className="flex h-6 w-5 items-center justify-center rounded text-muted-foreground/60 hover:text-foreground hover:bg-hover-bg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Move down"
        >
          <CaretDown size={11} weight="bold" />
        </button>
      </div>

      {/* Entity icon */}
      <span className="flex shrink-0 items-center justify-center w-5 h-5 ml-0.5">
        {icon}
      </span>

      {/* Title — click to open */}
      <button
        type="button"
        onClick={onOpen}
        className="flex-1 truncate text-left text-note text-foreground hover:text-accent transition-colors"
      >
        {title}
      </button>

      <RemoveButton onClick={handleRemove} />
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
    <div ref={nodeRef} style={style} className="group mt-4 mb-1 first:mt-0">
      <div className="flex items-center gap-2 px-1">
        {/* Drag handle (hover-only) */}
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

        {/* Up / Down */}
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

        {/* Heading body — title + divider line */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          {editing ? (
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

        <RemoveButton onClick={onRemove} />
      </div>
    </div>
  )
}

/* ── Remove × button (shared) ─────────────────────────────── */

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Remove from book"
      title="Remove from book"
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground/50 opacity-0 transition-all group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
    >
      <PhX size={12} weight="bold" />
    </button>
  )
}
