"use client"

import { cn } from "@/lib/utils"
import { useBlockCommentStatus, STATUS_COLORS } from "./use-block-comment-status"
import type { CommentAnchor } from "@/lib/types"

/**
 * Always-visible status marker on blocks with open comments.
 * Renders a 2px colored left bar + a small badge with open count.
 */
export function BlockCommentMarker({
  anchor,
  className,
}: {
  anchor: CommentAnchor
  className?: string
}) {
  const { topStatus, openCount } = useBlockCommentStatus(anchor)
  if (!topStatus || openCount === 0) return null

  const colors = STATUS_COLORS[topStatus]

  return (
    <div
      className={cn("pointer-events-none absolute left-0 top-0 bottom-0 flex items-start", className)}
      aria-label={`${openCount} open comment${openCount === 1 ? "" : "s"}`}
    >
      <div className={cn("w-[2px] h-full rounded-r", colors.dot, "opacity-70")} />
      {openCount > 1 && (
        <div
          className={cn(
            "absolute -left-1 top-0 min-w-[14px] h-[14px] rounded-full text-[9px] font-semibold flex items-center justify-center px-1",
            colors.dot,
            "text-background",
          )}
        >
          {openCount}
        </div>
      )}
    </div>
  )
}
