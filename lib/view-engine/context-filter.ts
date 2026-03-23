import type { Note } from "../types"
import type { ViewContextKey, PipelineExtras } from "./types"

/**
 * Stage 1: Filter notes by context (route-level filtering).
 * This replaces the per-route filtering that was previously scattered
 * across filterNotesByRoute() and various page components.
 */
export function applyContext(
  notes: Note[],
  context: ViewContextKey,
  extras?: PipelineExtras
): Note[] {
  switch (context) {
    case "all":
      return notes.filter((n) => !n.trashed)

    case "pinned":
      return notes.filter((n) => n.pinned && !n.trashed)

    case "inbox":
      return notes.filter(
        (n) => n.status === "inbox" && n.triageStatus !== "trashed" && !n.trashed
      )

    case "capture":
      return notes.filter(
        (n) => n.status === "capture" && n.triageStatus !== "trashed" && !n.trashed
      )

    case "permanent":
      return notes.filter(
        (n) => n.status === "permanent" && n.triageStatus !== "trashed" && !n.trashed
      )

    case "unlinked": {
      const backlinks = extras?.backlinksMap
      return notes.filter((n) => {
        if (n.trashed) return false
        const linkCount = backlinks?.get(n.id) ?? 0
        const hasOutLinks = (n.linksOut?.length ?? 0) > 0
        return linkCount === 0 && !hasOutLinks
      })
    }

    case "review":
      // Review queue uses domain-specific logic from lib/queries/notes.ts.
      // For the pipeline, we return all active notes and let
      // the Review page apply its own getReviewQueue() on top.
      return notes.filter((n) => !n.trashed)

    case "folder":
      return notes.filter(
        (n) => !n.trashed && n.folderId === extras?.folderId
      )

    case "tag":
      return notes.filter(
        (n) => !n.trashed && extras?.tagId && n.tags.includes(extras.tagId)
      )

    case "label":
      return notes.filter(
        (n) => !n.trashed && extras?.labelId && n.labelId === extras.labelId
      )

    case "trash":
      return notes.filter((n) => n.trashed)

    case "savedView":
      // Saved views apply their own user-filters in stage 2;
      // context stage just returns all active (non-trashed) notes.
      return notes.filter((n) => !n.trashed)

    default:
      return notes.filter((n) => !n.trashed)
  }
}
