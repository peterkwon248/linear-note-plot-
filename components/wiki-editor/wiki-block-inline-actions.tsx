"use client"

import { useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import { PushPin } from "@phosphor-icons/react/dist/ssr/PushPin"
import { cn } from "@/lib/utils"

/**
 * Inline hover actions for a wiki block — pin (bookmark) only.
 * Comment trigger is handled by BlockCommentMarker (always visible when comments exist).
 */
export function WikiBlockInlineActions({
  articleId,
  blockId,
  label,
  className,
}: {
  articleId: string
  blockId: string
  /** Short label for the bookmark (block title / first line) */
  label: string
  className?: string
}) {
  const globalBookmarks = usePlotStore((s) => s.globalBookmarks)
  const pinBookmark = usePlotStore((s) => s.pinBookmark)
  const unpinBookmark = usePlotStore((s) => s.unpinBookmark)

  const existing = useMemo(
    () => Object.values(globalBookmarks).find((b) => b.noteId === articleId && b.anchorId === blockId),
    [globalBookmarks, articleId, blockId],
  )
  const pinned = !!existing

  const togglePin = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (pinned && existing) {
      unpinBookmark(existing.id)
    } else {
      pinBookmark(articleId, blockId, label || "Block", "block", "wiki")
    }
  }

  return (
    <button
      type="button"
      onClick={togglePin}
      title={pinned ? "Unpin bookmark" : "Bookmark block"}
      className={cn(
        "p-1 rounded-md transition-all duration-100",
        pinned
          ? "text-accent opacity-100"
          : "opacity-0 group-hover/section:opacity-30 group-hover/text:opacity-30 group-hover/noteref:opacity-30 group-hover/image:opacity-30 group-hover/url:opacity-30 group-hover/table:opacity-30 hover:!opacity-100 text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      <PushPin size={13} weight={pinned ? "fill" : "regular"} />
    </button>
  )
}
