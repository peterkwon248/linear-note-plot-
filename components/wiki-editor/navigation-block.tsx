"use client"

import { useState, useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import type { WikiBlock, WikiNavSlot } from "@/lib/types"
import { cn } from "@/lib/utils"
import { WikiPickerDialog } from "@/components/wiki-picker-dialog"
import { navigateToWikiArticle } from "@/lib/wiki-article-nav"
import {
  shouldUseLightText,
  navboxForegroundClass,
} from "@/lib/wiki-color-contrast"
import { BannerColorPickerPopover } from "@/components/editor/nodes/banner-block-node"
import { ArrowRight } from "@phosphor-icons/react/dist/ssr/ArrowRight"
import { BookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"
import { LinkSimple } from "@phosphor-icons/react/dist/ssr/LinkSimple"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { DotsThree } from "@phosphor-icons/react/dist/ssr/DotsThree"
import { DotsSixVertical } from "@phosphor-icons/react/dist/ssr/DotsSixVertical"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { PaintBucket } from "@phosphor-icons/react/dist/ssr/PaintBucket"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { DraggableSyntheticListeners } from "@dnd-kit/core"
import { BlockCommentMarker } from "@/components/comments/block-comment-marker"
import { WikiBlockInlineActions } from "./wiki-block-inline-actions"

type SlotKey = "navPrev" | "navCurrent" | "navNext"

interface NavigationBlockProps {
  block: WikiBlock
  articleId?: string
  editable: boolean
  onUpdate: (patch: Partial<WikiBlock>) => void
  onDelete?: () => void
  dragHandleProps?: DraggableSyntheticListeners
}

export function NavigationBlock({ block, articleId, editable, onUpdate, onDelete, dragHandleProps }: NavigationBlockProps) {
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const currentArticle = useMemo(
    () => (articleId ? wikiArticles.find((a) => a.id === articleId) : null),
    [wikiArticles, articleId]
  )

  const [pickerOpenFor, setPickerOpenFor] = useState<SlotKey | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showHeaderColor, setShowHeaderColor] = useState(false)

  const headerColor = block.navHeaderColor ?? null
  const headerImage = block.navHeaderImage ?? null
  const headerLight = shouldUseLightText(headerColor)
  const headerFgClass = navboxForegroundClass(headerColor)

  const prev: WikiNavSlot = block.navPrev ?? { text: "" }
  const current: WikiNavSlot = block.navCurrent ?? { text: "" }
  const next: WikiNavSlot = block.navNext ?? { text: "" }

  // Resolve display text for each slot
  const resolveSlotText = (slot: WikiNavSlot, fallback?: string) => {
    if (slot.text.trim()) return slot.text
    if (slot.articleId) {
      const a = wikiArticles.find((x) => x.id === slot.articleId)
      if (a) return a.title
    }
    return fallback ?? ""
  }

  const prevText = resolveSlotText(prev)
  const currentText = resolveSlotText(current, currentArticle?.title || "")
  const nextText = resolveSlotText(next)

  const updateSlot = (key: SlotKey, patch: Partial<WikiNavSlot>) => {
    const existing: WikiNavSlot =
      (key === "navPrev" && prev) ||
      (key === "navCurrent" && current) ||
      (key === "navNext" && next) ||
      { text: "" }
    const merged: WikiNavSlot = { ...existing, ...patch }
    onUpdate({ [key]: merged })
  }

  const handlePickerSelect = (articleId: string) => {
    if (!pickerOpenFor) return
    const article = wikiArticles.find((a) => a.id === articleId)
    updateSlot(pickerOpenFor, { articleId, text: article?.title ?? "" })
    setPickerOpenFor(null)
  }

  const handleSlotClick = (slot: WikiNavSlot) => {
    if (editable) return // in edit mode, clicking does not navigate
    if (slot.articleId) navigateToWikiArticle(slot.articleId)
  }

  // ── Read-only render ──────────────────────────────
  if (!editable) {
    return (
      <div className="group/nav relative my-4 rounded-lg border border-border-subtle overflow-hidden">
        {block.navTitle && block.navTitle.trim() && (
          <div
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-center text-sm font-semibold border-b",
              !headerColor && "bg-secondary/40",
              headerLight ? "border-black/15" : "border-border-subtle",
              headerFgClass || "text-foreground",
            )}
            style={headerColor ? { backgroundColor: headerColor } : undefined}
          >
            {headerImage && (
              <img
                src={headerImage}
                alt=""
                className="h-5 w-5 rounded-sm object-cover shrink-0"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = "none"
                }}
              />
            )}
            <span className="flex-1 truncate">{block.navTitle}</span>
          </div>
        )}
        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center bg-card/30">
          <SlotDisplay
            slot={prev}
            displayText={prevText}
            onClick={() => handleSlotClick(prev)}
          />
          <Divider />
          <SlotDisplay
            slot={current}
            displayText={currentText}
            onClick={() => handleSlotClick(current)}
            isCurrent
          />
          <Divider />
          <SlotDisplay
            slot={next}
            displayText={nextText}
            onClick={() => handleSlotClick(next)}
          />
        </div>
      </div>
    )
  }

  // ── Edit render ───────────────────────────────────
  return (
    <>
      <div className="group/nav flex items-start gap-1 my-4">
        {/* Drag handle — flex item outside card, no overflow clip */}
        <button
          className="mt-2 p-0.5 opacity-0 group-hover/nav:opacity-30 hover:!opacity-100 cursor-grab shrink-0 text-muted-foreground transition-opacity duration-100"
          {...(dragHandleProps ?? {})}
        >
          <DotsSixVertical size={14} weight="regular" />
        </button>

        <div className="relative flex-1">
          {/* Right-side actions cluster: [marker] [bookmark] [⋯] — outside overflow-hidden card */}
          <div className="absolute left-full top-1 ml-2 z-20 flex items-center gap-0.5">
            {articleId && (
              <BlockCommentMarker anchor={{ kind: "wiki-block", articleId, blockId: block.id }} />
            )}
            {articleId && (
              <WikiBlockInlineActions articleId={articleId} blockId={block.id} label="Navigation" />
            )}
            {editable && (
            <Popover open={menuOpen} onOpenChange={setMenuOpen}>
              <PopoverTrigger asChild>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(true) }}
                  className="opacity-0 group-hover/nav:opacity-30 hover:!opacity-100 p-1 text-muted-foreground hover:text-foreground transition-all duration-100"
                >
                  <DotsThree size={14} weight="bold" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-44 p-1" onOpenAutoFocus={(e) => e.preventDefault()} style={{ fontSize: '13px' }}>
                {onDelete && (
                  <button
                    onClick={() => { setMenuOpen(false); onDelete() }}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-2xs text-destructive hover:bg-active-bg transition-colors"
                  >
                    <Trash size={14} weight="regular" />
                    Delete navigation
                  </button>
                )}
              </PopoverContent>
            </Popover>
            )}
          </div>
          <div className="rounded-lg border border-border-subtle overflow-hidden bg-card/30">
          {/* Title row + header color/image picker */}
          <div
            className={cn(
              "relative flex items-center gap-2 px-3 py-2 border-b",
              !headerColor && "bg-secondary/40",
              headerLight ? "border-black/15" : "border-border-subtle",
            )}
            style={headerColor ? { backgroundColor: headerColor } : undefined}
          >
            {headerImage && (
              <img
                src={headerImage}
                alt=""
                className="h-5 w-5 rounded-sm object-cover shrink-0"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = "none"
                }}
              />
            )}
            <input
              type="text"
              value={block.navTitle ?? ""}
              onChange={(e) => onUpdate({ navTitle: e.target.value })}
              placeholder="Navigation title (optional)"
              className={cn(
                "flex-1 bg-transparent text-sm font-semibold text-center outline-none placeholder:font-normal",
                headerFgClass || "text-foreground",
                headerLight ? "placeholder:text-white/40" : "placeholder:text-muted-foreground/40",
              )}
            />
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowHeaderColor((v) => !v)
              }}
              title="Header color"
              className={cn(
                "shrink-0 p-1 rounded transition-colors",
                headerLight
                  ? "text-white/70 hover:text-white hover:bg-white/10"
                  : "text-muted-foreground/60 hover:text-foreground hover:bg-hover-bg",
              )}
            >
              <PaintBucket size={11} weight="regular" />
            </button>
            {showHeaderColor && (
              <BannerColorPickerPopover
                bgColor={headerColor}
                onPick={(value) => onUpdate({ navHeaderColor: value })}
                onClose={() => setShowHeaderColor(false)}
              />
            )}
          </div>
          {/* Header image URL row */}
          <div className="px-3 py-1 bg-secondary/15 border-b border-border-subtle">
            <input
              type="text"
              value={headerImage ?? ""}
              onChange={(e) => onUpdate({ navHeaderImage: e.target.value || null })}
              placeholder="Header image URL (optional)"
              className="w-full bg-transparent text-2xs text-foreground/80 outline-none placeholder:text-muted-foreground/40 text-center"
            />
          </div>

          {/* 3 editable slots */}
          <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-stretch">
            <SlotEditor
              slot={prev}
              fallbackText=""
              onChange={(patch) => updateSlot("navPrev", patch)}
              onPickArticle={() => setPickerOpenFor("navPrev")}
              wikiArticles={wikiArticles}
            />
            <Divider />
            <SlotEditor
              slot={current}
              fallbackText={currentArticle?.title || ""}
              onChange={(patch) => updateSlot("navCurrent", patch)}
              onPickArticle={() => setPickerOpenFor("navCurrent")}
              wikiArticles={wikiArticles}
              isCurrent
            />
            <Divider />
            <SlotEditor
              slot={next}
              fallbackText=""
              onChange={(patch) => updateSlot("navNext", patch)}
              onPickArticle={() => setPickerOpenFor("navNext")}
              wikiArticles={wikiArticles}
            />
          </div>
          </div>
        </div>
      </div>

      {/* Article picker dialog */}
      <WikiPickerDialog
        open={pickerOpenFor !== null}
        onOpenChange={(open) => !open && setPickerOpenFor(null)}
        title="Pick article for navigation slot"
        onSelect={handlePickerSelect}
      />
    </>
  )
}

/* ── Read-only slot ─── */

function SlotDisplay({
  slot,
  displayText,
  onClick,
  isCurrent,
}: {
  slot: WikiNavSlot
  displayText: string
  onClick: () => void
  isCurrent?: boolean
}) {
  const hasLink = !!slot.articleId && !isCurrent
  const textClass = hasLink
    ? "text-accent/80 hover:text-accent hover:underline cursor-pointer"
    : "text-foreground cursor-default"

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!hasLink}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 px-3 py-3 transition-colors min-h-[56px]",
        hasLink && "hover:bg-hover-bg"
      )}
    >
      <span className={cn("text-sm font-medium", textClass, isCurrent && "text-foreground font-semibold")}>
        {displayText || "—"}
      </span>
      {slot.subtext && slot.subtext.trim() && (
        <span className="text-2xs text-muted-foreground/60">{slot.subtext}</span>
      )}
    </button>
  )
}

function Divider() {
  return (
    <div className="flex items-center justify-center text-muted-foreground/40 px-1.5">
      <ArrowRight size={14} weight="regular" />
    </div>
  )
}

/* ── Edit-mode slot ─── */

function SlotEditor({
  slot,
  fallbackText,
  onChange,
  onPickArticle,
  wikiArticles,
  isCurrent,
}: {
  slot: WikiNavSlot
  fallbackText: string
  onChange: (patch: Partial<WikiNavSlot>) => void
  onPickArticle: () => void
  wikiArticles: ReturnType<typeof usePlotStore.getState>["wikiArticles"]
  isCurrent?: boolean
}) {
  const linkedArticle = slot.articleId
    ? wikiArticles.find((a) => a.id === slot.articleId)
    : null

  const clearArticle = () => onChange({ articleId: undefined })

  return (
    <div className="flex flex-col items-stretch gap-1 px-2 py-2 min-w-0">
      {/* Article link row */}
      {!isCurrent && (
        <div className="flex items-center gap-1">
          {linkedArticle ? (
            <div className="flex-1 min-w-0 flex items-center gap-1 rounded-md bg-accent/10 px-1.5 py-0.5 text-2xs">
              <BookOpen size={10} weight="regular" className="text-accent/70 shrink-0" />
              <span className="truncate text-foreground/80">{linkedArticle.title}</span>
              <button
                onClick={clearArticle}
                className="p-0.5 text-muted-foreground/60 hover:text-destructive shrink-0"
                title="Remove article link"
              >
                <PhX size={9} weight="bold" />
              </button>
            </div>
          ) : (
            <button
              onClick={onPickArticle}
              className="flex-1 inline-flex items-center gap-1 rounded-md border border-dashed border-border-subtle px-1.5 py-0.5 text-2xs text-muted-foreground/70 hover:border-border hover:text-foreground transition-colors justify-center"
            >
              <LinkSimple size={10} weight="regular" />
              Link article
            </button>
          )}
        </div>
      )}

      {/* Text input */}
      <input
        type="text"
        value={slot.text}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder={fallbackText || "Label"}
        className={cn(
          "w-full bg-transparent text-sm text-center outline-none placeholder:text-muted-foreground/40",
          isCurrent ? "font-semibold text-foreground" : "font-medium text-foreground"
        )}
      />

      {/* Subtext input */}
      <input
        type="text"
        value={slot.subtext ?? ""}
        onChange={(e) => onChange({ subtext: e.target.value })}
        placeholder="Subtext (optional)"
        className="w-full bg-transparent text-2xs text-center text-muted-foreground/70 outline-none placeholder:text-muted-foreground/30"
      />
    </div>
  )
}
