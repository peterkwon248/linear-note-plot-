"use client"

import { cn } from "@/lib/utils"
import { useBlockCommentStatus, STATUS_COLORS } from "./use-block-comment-status"
import type { CommentAnchor } from "@/lib/types"
import { ChatCircle } from "@phosphor-icons/react/dist/ssr/ChatCircle"
import { CommentPopover } from "./comment-popover"

/**
 * Block comment marker — clickable trigger for the comment popover.
 *
 * - When the block has open comments: always-visible chip with status color dot + count.
 * - When no comments: faint hover-only 💬 icon (so you can still add the first comment).
 *
 * Replaces the dual setup of "marker (always)" + "💬 hover trigger" — single entrypoint now.
 */
export function BlockCommentMarker({
  anchor,
  className,
  alwaysVisibleWhenEmpty = false,
}: {
  anchor: CommentAnchor
  className?: string
  /** If true, also show a faint trigger when zero comments (otherwise hover-only). */
  alwaysVisibleWhenEmpty?: boolean
}) {
  const { topStatus, openCount, totalCount } = useBlockCommentStatus(anchor)
  const hasComments = totalCount > 0

  return (
    <CommentPopover anchor={anchor}>
      <button
        type="button"
        onClick={(e) => e.stopPropagation()}
        title={
          openCount > 0
            ? `${openCount} open comment${openCount === 1 ? "" : "s"}`
            : totalCount > 0
              ? `${totalCount} resolved comment${totalCount === 1 ? "" : "s"}`
              : "Add comment"
        }
        className={cn(
          "inline-flex items-center gap-1 rounded-full pl-1 pr-1.5 py-0.5 text-[10px] font-semibold transition-all",
          hasComments
            ? "bg-muted-foreground/10 hover:bg-muted-foreground/20 text-muted-foreground/80 hover:text-foreground"
            : alwaysVisibleWhenEmpty
              ? "text-muted-foreground/70 hover:text-foreground hover:bg-hover-bg"
              : "opacity-0 group-hover/section:opacity-50 group-hover/text:opacity-50 group-hover/noteref:opacity-50 group-hover/image:opacity-50 group-hover/url:opacity-50 group-hover/table:opacity-50 hover:!opacity-100 text-muted-foreground/60 hover:text-foreground hover:bg-hover-bg",
          className,
        )}
      >
        {/* Status color dot (only when comments exist) */}
        {hasComments && topStatus && (
          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", STATUS_COLORS[topStatus].dot)} />
        )}
        <ChatCircle size={11} weight={hasComments ? "fill" : "regular"} className={hasComments ? "text-muted-foreground/70" : ""} />
        {hasComments && <span className="tabular-nums">{openCount > 0 ? openCount : totalCount}</span>}
      </button>
    </CommentPopover>
  )
}
