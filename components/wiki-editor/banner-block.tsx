"use client"

import { useState, useMemo } from "react"
import type { WikiBlock } from "@/lib/types"
import {
  BookmarkSimple,
  GearSix,
  X as PhX,
} from "@/lib/editor/editor-icons"
import { BlockCommentMarker } from "@/components/comments/block-comment-marker"
import { usePlotStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { DotsSixVertical } from "@phosphor-icons/react/dist/ssr/DotsSixVertical"
import {
  BANNER_SIZE_STYLES,
  BannerSettingsPopover,
  computeBannerVisual,
  resolveBannerBgStyle,
  resolveBannerIcon,
  resolveBannerSize,
  type BannerIconKey,
} from "@/components/editor/nodes/banner-block-node"
import type { DraggableSyntheticListeners } from "@dnd-kit/core"

/**
 * Wiki-tier Banner block.
 *
 * Visually identical to the TipTap BannerBlockNode. Data model is the wiki
 * block (`type: "banner"`, `title`, `bannerSubtitle`, `bannerBgColor`,
 * `bannerBgColorEnd`, `bannerIcon`, `bannerSize`, `bannerBgStyle`).
 *
 * The hover cluster mirrors the TipTap banner cluster: Settings + Comment +
 * Bookmark + X — all four buttons in a single row at the top-right. The
 * Settings popover gives access to style / color / icon / size in one panel.
 */

interface WikiBannerBlockProps {
  block: WikiBlock
  editable: boolean
  articleId?: string
  onUpdate?: (patch: Partial<Omit<WikiBlock, "id">>) => void
  onDelete?: () => void
  dragHandleProps?: DraggableSyntheticListeners
}

export function WikiBannerBlock({
  block,
  editable,
  articleId,
  onUpdate,
  onDelete,
  dragHandleProps,
}: WikiBannerBlockProps) {
  const title       = block.title ?? ""
  const subtitle    = block.bannerSubtitle ?? ""
  const bgColor     = block.bannerBgColor ?? null
  const bgColorEnd  = block.bannerBgColorEnd ?? null
  const iconKey     = block.bannerIcon ?? "megaphone"
  const sizeAttr    = block.bannerSize ?? "default"
  const bgStyleAttr = block.bannerBgStyle ?? "solid"

  const [showSettings, setShowSettings] = useState(false)

  // Bookmark integration — same shape as WikiBlockInlineActions.
  const globalBookmarks = usePlotStore((s) => s.globalBookmarks)
  const pinBookmark = usePlotStore((s) => s.pinBookmark)
  const unpinBookmark = usePlotStore((s) => s.unpinBookmark)
  const existingBookmark = useMemo(() => {
    if (!articleId) return undefined
    return Object.values(globalBookmarks).find(
      (b) => b.noteId === articleId && b.anchorId === block.id,
    )
  }, [globalBookmarks, articleId, block.id])
  const bookmarked = !!existingBookmark

  const toggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!articleId) return
    if (bookmarked && existingBookmark) {
      unpinBookmark(existingBookmark.id)
    } else {
      pinBookmark(articleId, block.id, title || "Banner", "block", "wiki")
    }
  }

  // Resolve visual primitives (shared with TipTap node).
  const size       = resolveBannerSize(sizeAttr)
  const bgStyle    = resolveBannerBgStyle(bgStyleAttr)
  const sizeStyles = BANNER_SIZE_STYLES[size]
  const Icon       = resolveBannerIcon(iconKey)
  const visual     = computeBannerVisual(bgStyle, bgColor, bgColorEnd)

  const hasCustomization = !!bgColor
    || iconKey !== "megaphone"
    || size !== "default"
    || bgStyle !== "solid"

  const settingsActive = showSettings || hasCustomization

  return (
    <div className="group/banner relative my-4">
      {/* Drag handle (outside left edge) */}
      {editable && (
        <div className="absolute -left-6 top-3 opacity-0 group-hover/banner:opacity-30 hover:!opacity-100 transition-opacity duration-100">
          <button
            className="p-0.5 text-muted-foreground cursor-grab"
            {...(dragHandleProps ?? {})}
          >
            <DotsSixVertical size={14} weight="regular" />
          </button>
        </div>
      )}

      <div
        className={cn(
          "rounded-lg relative select-none",
          sizeStyles.containerPadding,
          visual.useDefaultBg && "bg-secondary/40",
          visual.containerExtraClass,
        )}
        style={visual.containerStyle}
      >
        {/* Action cluster: Settings + Comment + Bookmark + X */}
        <div className="absolute top-2 right-2 flex items-center gap-0.5 z-10">
          {editable && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setShowSettings((v) => !v)
              }}
              className={cn(
                "rounded p-1 transition-colors",
                settingsActive
                  ? "text-foreground bg-hover-bg"
                  : "text-muted-foreground/30 hover:text-foreground hover:bg-hover-bg opacity-0 group-hover/banner:opacity-100",
              )}
              title="Banner settings"
            >
              <GearSix size={13} />
            </button>
          )}

          {articleId && (
            <span
              className={cn(
                "transition-opacity",
                settingsActive ? "opacity-100" : "opacity-0 group-hover/banner:opacity-100",
              )}
            >
              <BlockCommentMarker
                anchor={{ kind: "wiki-block", articleId, blockId: block.id }}
                alwaysVisibleWhenEmpty
                className="!px-1 !py-1 !rounded !text-muted-foreground/60 hover:!text-foreground"
              />
            </span>
          )}

          {articleId && (
            <button
              type="button"
              onClick={toggleBookmark}
              title={bookmarked ? "Remove bookmark" : "Add bookmark"}
              className={cn(
                "rounded p-1 transition-colors",
                bookmarked
                  ? "text-accent bg-hover-bg"
                  : settingsActive
                    ? "text-foreground hover:bg-hover-bg"
                    : "text-muted-foreground/30 hover:text-foreground hover:bg-hover-bg opacity-0 group-hover/banner:opacity-100",
              )}
            >
              <BookmarkSimple size={13} />
            </button>
          )}

          {editable && onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className={cn(
                "rounded p-1 transition-colors",
                settingsActive
                  ? "text-foreground hover:bg-hover-bg"
                  : "text-muted-foreground/30 hover:text-foreground hover:bg-hover-bg opacity-0 group-hover/banner:opacity-100",
              )}
              title="Remove banner"
            >
              <PhX size={13} />
            </button>
          )}
        </div>

        {/* Settings popover */}
        {editable && showSettings && (
          <BannerSettingsPopover
            values={{
              bgStyle,
              bgColor,
              bgColorEnd,
              icon: (iconKey as BannerIconKey),
              size,
            }}
            onChange={(patch) => {
              const wikiPatch: Partial<Omit<WikiBlock, "id">> = {}
              if (patch.bgStyle !== undefined)    wikiPatch.bannerBgStyle    = patch.bgStyle
              if (patch.bgColor !== undefined)    wikiPatch.bannerBgColor    = patch.bgColor
              if (patch.bgColorEnd !== undefined) wikiPatch.bannerBgColorEnd = patch.bgColorEnd
              if (patch.icon !== undefined)       wikiPatch.bannerIcon       = patch.icon
              if (patch.size !== undefined)       wikiPatch.bannerSize       = patch.size
              onUpdate?.(wikiPatch)
            }}
            onClose={() => setShowSettings(false)}
          />
        )}

        {/* Icon + title/subtitle */}
        <div className={cn("flex items-start", sizeStyles.gapClass, sizeStyles.rightPadClass)}>
          <Icon
            size={sizeStyles.iconSize}
            className={cn("shrink-0 text-foreground/60", sizeStyles.iconMarginTop)}
          />
          <div className="flex-1 min-w-0">
            {editable ? (
              <input
                type="text"
                value={title}
                onChange={(e) => onUpdate?.({ title: e.target.value })}
                placeholder="Banner title"
                className={cn(
                  "w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/30",
                  sizeStyles.titleClass,
                )}
              />
            ) : (
              <div className={cn("text-foreground", sizeStyles.titleClass)}>
                {title || <span className="text-muted-foreground/30">Banner title</span>}
              </div>
            )}

            {editable ? (
              <input
                type="text"
                value={subtitle}
                onChange={(e) => onUpdate?.({ bannerSubtitle: e.target.value })}
                placeholder="Subtitle (optional)"
                className={cn(
                  "w-full bg-transparent border-none outline-none text-muted-foreground placeholder:text-muted-foreground/30",
                  sizeStyles.subtitleClass,
                )}
              />
            ) : (
              subtitle && (
                <div className={cn("text-muted-foreground", sizeStyles.subtitleClass)}>
                  {subtitle}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
