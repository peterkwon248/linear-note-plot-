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
      return notes.filter((n) => !n.archived)

    case "inbox":
      return notes.filter(
        (n) => n.status === "inbox" && !n.archived && n.triageStatus !== "trashed"
      )

    case "capture":
      return notes.filter(
        (n) => n.status === "capture" && !n.archived && n.triageStatus !== "trashed"
      )

    case "reference":
      return notes.filter(
        (n) => n.status === "reference" && !n.archived
      )

    case "permanent":
      return notes.filter(
        (n) => n.status === "permanent" && !n.archived && n.triageStatus !== "trashed"
      )

    case "unlinked": {
      const backlinks = extras?.backlinksMap
      return notes.filter((n) => {
        if (n.archived) return false
        const linkCount = backlinks?.get(n.id) ?? 0
        const hasOutLinks = (n.linksOut?.length ?? 0) > 0
        return linkCount === 0 && !hasOutLinks
      })
    }

    case "review":
      // Review queue uses domain-specific logic from lib/queries/notes.ts.
      // For the pipeline, we return all non-archived notes and let
      // the Review page apply its own getReviewQueue() on top.
      return notes.filter((n) => !n.archived)

    case "archive":
      return notes.filter((n) => n.archived)

    case "folder":
      return notes.filter(
        (n) => !n.archived && n.folderId === extras?.folderId
      )

    case "category":
      return notes.filter(
        (n) => !n.archived && n.category === extras?.categoryId
      )

    case "tag":
      return notes.filter(
        (n) => !n.archived && extras?.tagId && n.tags.includes(extras.tagId)
      )

    case "projects":
      return notes.filter(
        (n) => !n.archived && n.project != null && n.project !== ""
      )

    default:
      return notes.filter((n) => !n.archived)
  }
}
