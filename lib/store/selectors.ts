import type { Note, ActiveView, NoteFilter, KnowledgeMap } from "../types"
import type { PlotState } from "./types"

/* ── Selectors / Filters ──────────────────────────────── */

export function getFilteredNotes(state: PlotState): Note[] {
  const { notes, activeView, searchQuery } = state

  let filtered = notes

  switch (activeView.type) {
    case "inbox":
      filtered = filtered.filter((n) => n.status === "inbox" && !n.archived)
      break
    case "all":
      filtered = filtered.filter((n) => !n.archived)
      break
    case "folder":
      filtered = filtered.filter(
        (n) => n.folderId === activeView.folderId && !n.archived
      )
      break
    case "archive":
      filtered = filtered.filter((n) => n.archived)
      break
    case "category":
      filtered = filtered.filter(
        (n) => n.category === activeView.categoryId && !n.archived
      )
      break
    case "pinned":
      filtered = filtered.filter((n) => n.pinned && !n.archived)
      break
    case "tag":
      filtered = filtered.filter(
        (n) => n.tags.includes(activeView.tagId) && !n.archived
      )
      break
    case "map": {
      const map = state.knowledgeMaps.find((m: KnowledgeMap) => m.id === activeView.mapId)
      if (map) filtered = filtered.filter((n) => map.noteIds.includes(n.id))
      break
    }
    default:
      filtered = filtered.filter((n) => !n.archived)
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase()
    filtered = filtered.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
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

  switch (filter.type) {
    case "inbox":
      filtered = filtered.filter((n) => n.status === "inbox" && !n.archived)
      break
    case "all":
      filtered = filtered.filter((n) => !n.archived)
      break
    case "archive":
      filtered = filtered.filter((n) => n.archived)
      break
    case "projects":
      filtered = filtered.filter((n) => n.project != null && n.project !== "" && !n.archived)
      break
    case "pinned":
      filtered = filtered.filter((n) => n.pinned && !n.archived)
      break
    case "folder":
      filtered = filtered.filter((n) => n.folderId === filter.folderId && !n.archived)
      break
    case "category":
      filtered = filtered.filter((n) => n.category === filter.categoryId && !n.archived)
      break
    case "tag":
      filtered = filtered.filter((n) => n.tags.includes(filter.tagId) && !n.archived)
      break
    case "status-inbox":
      filtered = filtered.filter((n) =>
        n.status === "inbox" &&
        n.triageStatus !== "trashed" &&
        (n.triageStatus === "untriaged" || (n.triageStatus === "snoozed" && n.reviewAt && new Date(n.reviewAt) <= new Date()))
      )
      break
    case "status-capture":
      filtered = filtered.filter((n) => n.status === "capture" && n.triageStatus !== "trashed")
      break
    case "status-permanent":
      filtered = filtered.filter((n) => n.status === "permanent" && n.triageStatus !== "trashed")
      break
    default:
      filtered = filtered.filter((n) => !n.archived)
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase()
    filtered = filtered.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.preview.toLowerCase().includes(q)
    )
  }

  return [...filtered].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
}

export function getFilterTitle(filter: NoteFilter, state: PlotState): string {
  switch (filter.type) {
    case "inbox":
      return "Inbox"
    case "all":
      return "All Notes"
    case "archive":
      return "Archive"
    case "projects":
      return "Projects"
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
    case "category": {
      const cat = state.categories.find((c) => c.id === filter.categoryId)
      return cat?.name ?? "Category"
    }
    case "tag": {
      const tag = state.tags.find((t) => t.id === filter.tagId)
      return tag ? `#${tag.name}` : "Tag"
    }
    case "map":
      return "Knowledge Map"
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
    case "views":
      return "Views"
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
    case "category": {
      const cat = state.categories.find((c) => c.id === view.categoryId)
      return cat?.name ?? "Category"
    }
    case "pinned":
      return "Pinned"
    case "tag": {
      const tag = state.tags.find((t) => t.id === view.tagId)
      return tag ? `#${tag.name}` : "Tag"
    }
    case "settings":
      return "Settings"
    case "map": {
      const map = state.knowledgeMaps.find((m: KnowledgeMap) => m.id === view.mapId)
      return map?.title ?? "Knowledge Map"
    }
    default:
      return "Notes"
  }
}
