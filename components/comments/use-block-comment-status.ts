"use client"

import { useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import type { CommentAnchor, CommentStatus } from "@/lib/types"

/** Severity priority — higher = more visually prominent. */
const PRIORITY: Record<CommentStatus, number> = {
  blocker: 4,
  todo: 3,
  note: 2,
  done: 0,
}

export interface BlockCommentSummary {
  /** Most severe non-resolved status (null if no open comments). */
  topStatus: CommentStatus | null
  /** Count of open (non-done) comments. */
  openCount: number
  /** Count of all comments including resolved. */
  totalCount: number
}

/**
 * Compute the visual marker status for a block-level anchor.
 * Returns null status if no comments or all resolved.
 */
export function useBlockCommentStatus(anchor: CommentAnchor): BlockCommentSummary {
  const comments = usePlotStore((s) => s.comments)
  return useMemo(() => {
    let topStatus: CommentStatus | null = null
    let topPriority = 0
    let openCount = 0
    let totalCount = 0
    for (const c of Object.values(comments)) {
      const a = c.anchor
      if (a.kind !== anchor.kind) continue
      if (a.kind === "wiki-block" && anchor.kind === "wiki-block") {
        if (a.articleId !== anchor.articleId || a.blockId !== anchor.blockId) continue
      } else if (a.kind === "note-block" && anchor.kind === "note-block") {
        if (a.noteId !== anchor.noteId || a.nodeId !== anchor.nodeId) continue
      } else {
        continue
      }
      totalCount++
      if (c.status !== "done") {
        openCount++
        const p = PRIORITY[c.status] || 0
        if (p > topPriority) {
          topPriority = p
          topStatus = c.status
        }
      }
    }
    return { topStatus, openCount, totalCount }
  }, [comments, anchor])
}

/** Tailwind classes for status colors (shared with popover). */
export const STATUS_COLORS: Record<CommentStatus, { dot: string; border: string }> = {
  note: { dot: "bg-muted-foreground/60", border: "border-l-muted-foreground/40" },
  todo: { dot: "bg-blue-400", border: "border-l-blue-400" },
  done: { dot: "bg-emerald-400", border: "border-l-emerald-400" },
  blocker: { dot: "bg-red-400", border: "border-l-red-400" },
}
