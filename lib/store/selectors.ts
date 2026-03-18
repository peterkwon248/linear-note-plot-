import type { Note, ActiveView, NoteFilter } from "../types"
import type { PlotState } from "./types"

/* ── Selectors / Filters ──────────────────────────────── */

export function getFilteredNotes(state: PlotState): Note[] {
  const { notes, activeView, searchQuery } = state

  let filtered = notes

  const isActive = (n: Note) => !n.archived && !n.trashed

  switch (activeView.type) {
    case "inbox":
      filtered = filtered.filter((n) => n.status === "inbox" && isActive(n))
      break
    case "all":
      filtered = filtered.filter(isActive)
      break
    case "folder":
      filtered = filtered.filter(
        (n) => n.folderId === activeView.folderId && isActive(n)
      )
      break
    case "archive":
      filtered = filtered.filter((n) => n.archived && !n.trashed)
      break
    case "pinned":
      filtered = filtered.filter((n) => n.pinned && isActive(n))
      break
    case "tag":
      filtered = filtered.filter(
        (n) => n.tags.includes(activeView.tagId) && isActive(n)
      )
      break
    default:
      filtered = filtered.filter(isActive)
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase()
    filtered = filtered.filter(
      (n) =>
        (n.title || "Untitled").toLowerCase().includes(q) ||
        n.preview.toLowerCase().includes(q)
    )
  }

  return [...filtered].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
}

/** Route-based filter (used by NoteList via filter prop) */
export function filterNotesByRoute(notes: Note[], filter: NoteFilter, searchQuery = ""): Note[] {
  let filtered = notes
  const isActive = (n: Note) => !n.archived && !n.trashed

  switch (filter.type) {
    case "inbox":
      filtered = filtered.filter((n) => n.status === "inbox" && isActive(n))
      break
    case "all":
      filtered = filtered.filter(isActive)
      break
    case "archive":
      filtered = filtered.filter((n) => n.archived && !n.trashed)
      break
    case "trash":
      filtered = filtered.filter((n) => n.trashed)
      break
    case "pinned":
      filtered = filtered.filter((n) => n.pinned && isActive(n))
      break
    case "folder":
      filtered = filtered.filter((n) => n.folderId === filter.folderId && isActive(n))
      break
    case "tag":
      filtered = filtered.filter((n) => n.tags.includes(filter.tagId) && isActive(n))
      break
    case "status-inbox":
      filtered = filtered.filter((n) =>
        n.status === "inbox" &&
        isActive(n) &&
        n.triageStatus !== "trashed" &&
        (n.triageStatus === "untriaged" || (n.triageStatus === "snoozed" && n.reviewAt && new Date(n.reviewAt) <= new Date()))
      )
      break
    case "status-capture":
      filtered = filtered.filter((n) => n.status === "capture" && isActive(n) && n.triageStatus !== "trashed")
      break
    case "status-permanent":
      filtered = filtered.filter((n) => n.status === "permanent" && isActive(n) && n.triageStatus !== "trashed")
      break
    default:
      filtered = filtered.filter(isActive)
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase()
    filtered = filtered.filter(
      (n) =>
        (n.title || "Untitled").toLowerCase().includes(q) ||
        n.preview.toLowerCase().includes(q)
    )
  }

  return [...filtered].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
}

export function getFilterTitle(filter: NoteFilter, state: Pick<PlotState, "folders" | "tags">): string {
  switch (filter.type) {
    case "inbox":
      return "Inbox"
    case "all":
      return "All Notes"
    case "archive":
      return "Archive"
    case "trash":
      return "Trash"
    case "pinned":
      return "Pinned"
    case "status-inbox":
      return "Inbox"
    case "status-capture":
      return "Capture"
    case "status-permanent":
      return "Permanent"
    case "folder": {
      const folder = state.folders.find((f) => f.id === filter.folderId)
      return folder?.name ?? "Folder"
    }
    case "tag": {
      const tag = state.tags.find((t) => t.id === filter.tagId)
      return tag ? `#${tag.name}` : "Tag"
    }
    default:
      return "Notes"
  }
}

export function getViewTitle(view: ActiveView, state: PlotState): string {
  switch (view.type) {
    case "inbox":
      return "Inbox"
    case "all":
      return "All Notes"
    case "folder": {
      const folder = state.folders.find((f) => f.id === view.folderId)
      return folder?.name ?? "Folder"
    }
    case "archive":
      return "Archive"
    case "templates":
      return "Templates"
    case "insights":
      return "Insights"
    case "pinned":
      return "Pinned"
    case "tag": {
      const tag = state.tags.find((t) => t.id === view.tagId)
      return tag ? `#${tag.name}` : "Tag"
    }
    case "settings":
      return "Settings"
    default:
      return "Notes"
  }
}
