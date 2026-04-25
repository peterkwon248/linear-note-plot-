"use client"

import { useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import { CommentPopover } from "@/components/comments/comment-popover"
import { PushPin } from "@phosphor-icons/react/dist/ssr/PushPin"
import { cn } from "@/lib/utils"

/**
 * Inline actions for a wiki block (shown on hover): 💬 comment + 📌 bookmark.
 * Pin toggles a global bookmark with anchorType "block" against this block.
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

  // For wiki blocks we use articleId as the "noteId" key in GlobalBookmark — bookmarks already use noteId for wiki articles too.
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
      pinBookmark(articleId, blockId, label || "Block", "block")
    }
  }

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      <CommentPopover
        anchor={{ kind: "wiki-block", articleId, blockId }}
        triggerClassName="opacity-0 group-hover/section:opacity-30 group-hover/text:opacity-30 group-hover/noteref:opacity-30 group-hover/image:opacity-30 group-hover/url:opacity-30 group-hover/table:opacity-30 hover:!opacity-100 transition-opacity"
      />
      <button
        type="button"
        onClick={togglePin}
        title={pinned ? "Unpin bookmark" : "Bookmark block"}
        className={cn(
          "p-1 rounded-md transition-all duration-100",
          pinned
            ? "text-accent opacity-100"
            : "opacity-0 group-hover/section:opacity-30 group-hover/text:opacity-30 group-hover/noteref:opacity-30 group-hover/image:opacity-30 group-hover/url:opacity-30 group-hover/table:opacity-30 hover:!opacity-100 text-muted-foreground hover:text-foreground",
        )}
      >
        <PushPin size={13} weight={pinned ? "fill" : "regular"} />
      </button>
    </div>
  )
}
