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
  const showTrashed = extras?.showTrashed === true

  switch (context) {
    case "all":
      return notes.filter((n) => showTrashed || !n.trashed)

    case "pinned":
      return notes.filter((n) => n.pinned && (showTrashed || !n.trashed))

    case "inbox":
      return notes.filter(
        (n) => n.status === "inbox" && n.triageStatus !== "trashed" && (showTrashed || !n.trashed)
      )

    case "capture":
      return notes.filter(
        (n) => n.status === "capture" && n.triageStatus !== "trashed" && (showTrashed || !n.trashed)
      )

    case "permanent":
      return notes.filter(
        (n) => n.status === "permanent" && n.triageStatus !== "trashed" && (showTrashed || !n.trashed)
      )

    case "unlinked": {
      const backlinks = extras?.backlinksMap
      return notes.filter((n) => {
        if (!showTrashed && n.trashed) return false
        const linkCount = backlinks?.get(n.id) ?? 0
        const hasOutLinks = (n.linksOut?.length ?? 0) > 0
        return linkCount === 0 && !hasOutLinks
      })
    }

    case "review":
      return notes.filter((n) => showTrashed || !n.trashed)

    case "folder":
      // v107 N:M: a note belongs to a folder when its folderIds contains
      // the URL-context folder id. URL context itself remains single
      // (`extras.folderId`) because routes still resolve one folder at a
      // time; only entity membership is array-typed.
      return notes.filter(
        (n) =>
          (showTrashed || !n.trashed) &&
          (extras?.folderId !== undefined
            ? (n.folderIds ?? []).includes(extras.folderId)
            : (n.folderIds ?? []).length === 0)
      )

    case "tag":
      return notes.filter(
        (n) => (showTrashed || !n.trashed) && extras?.tagId && n.tags.includes(extras.tagId)
      )

    case "label":
      return notes.filter(
        (n) => (showTrashed || !n.trashed) && extras?.labelId && n.labelId === extras.labelId
      )

    case "trash":
      return notes.filter((n) => n.trashed)

    case "savedView":
      return notes.filter((n) => showTrashed || !n.trashed)

    default:
      return notes.filter((n) => showTrashed || !n.trashed)
  }
}
