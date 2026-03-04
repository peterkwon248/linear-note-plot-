import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Note, Folder, Tag, Category, ActiveView, NoteFilter, NoteStage, TriageStatus } from "./types"

const genId = () => crypto.randomUUID()
const now = () => new Date().toISOString()

const SEED_CATEGORIES: Category[] = [
  { id: "cat-1", name: "Work", color: "#5e6ad2" },
  { id: "cat-2", name: "Personal", color: "#26b5ce" },
  { id: "cat-3", name: "Ideas", color: "#f2994a" },
]

const SEED_FOLDERS: Folder[] = [
  { id: "folder-1", name: "Projects", color: "#5e6ad2" },
  { id: "folder-2", name: "Daily Log", color: "#45d483" },
]

const SEED_TAGS: Tag[] = [
  { id: "tag-1", name: "important", color: "#e5484d" },
  { id: "tag-2", name: "reference", color: "#5e6ad2" },
]

/** Default workflow fields for a note */
function workflowDefaults(stage: NoteStage = "inbox"): Pick<
  Note,
  "stage" | "triageStatus" | "reviewAt" | "inboxRank" | "summary" | "source" | "promotedAt" | "lastTouchedAt" | "snoozeCount" | "archivedAt" | "parentNoteId"
> {
  return {
    stage,
    triageStatus: stage === "inbox" ? "untriaged" : "kept",
    reviewAt: null,
    inboxRank: 0,
    summary: null,
    source: "manual",
    promotedAt: stage === "permanent" ? now() : null,
    lastTouchedAt: now(),
    snoozeCount: 0,
    archivedAt: null,
    parentNoteId: null,
  }
}

const SEED_NOTES: Note[] = [
  {
    id: "note-1",
    title: "Welcome to Plot",
    content:
      "# Welcome to Plot\n\nThis is your new note-taking app.\n\n- Create notes with **markdown**\n- Organize with folders, categories, and tags\n- Pin important notes\n- Archive when done",
    folderId: null,
    category: "cat-1",
    tags: ["tag-2"],
    status: "permanent",
    priority: "high",
    reads: 5,
    pinned: true,
    archived: false,
    isInbox: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    ...workflowDefaults("permanent"),
    summary: "Introduction to the Plot note-taking app",
  },
  {
    id: "note-2",
    title: "Quick thought",
    content: "This is an inbox note - a quick thought captured for later sorting.",
    folderId: null,
    category: "",
    tags: [],
    status: "capture",
    priority: "none",
    reads: 1,
    pinned: false,
    archived: false,
    isInbox: true,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    ...workflowDefaults("inbox"),
  },
  {
    id: "note-3",
    title: "Project planning",
    content: "## Q1 Goals\n\n1. Ship v1.0\n2. User testing\n3. Marketing launch",
    folderId: "folder-1",
    category: "cat-1",
    tags: ["tag-1"],
    status: "project",
    priority: "urgent",
    reads: 12,
    pinned: false,
    archived: false,
    isInbox: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    ...workflowDefaults("capture"),
    triageStatus: "kept",
  },
  {
    id: "note-4",
    title: "API design notes",
    content: "REST vs GraphQL comparison for our new service.",
    folderId: null,
    category: "cat-1",
    tags: ["tag-2"],
    status: "reference",
    priority: "medium",
    reads: 3,
    pinned: false,
    archived: false,
    isInbox: false,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
    ...workflowDefaults("capture"),
    triageStatus: "kept",
    summary: "Comparison of REST and GraphQL approaches",
  },
  {
    id: "note-5",
    title: "Meeting notes",
    content: "Discussed roadmap for Q2. Action items: finalize spec, assign tasks.",
    folderId: "folder-2",
    category: "cat-1",
    tags: [],
    status: "capture",
    priority: "none",
    reads: 0,
    pinned: false,
    archived: false,
    isInbox: true,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    ...workflowDefaults("inbox"),
  },
  {
    id: "note-6",
    title: "Bookmarks",
    content: "- https://example.com\n- https://another.dev",
    folderId: null,
    category: "cat-2",
    tags: [],
    status: "capture",
    priority: "low",
    reads: 0,
    pinned: false,
    archived: false,
    isInbox: true,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    ...workflowDefaults("inbox"),
    source: "webclip",
  },
]

interface PlotState {
  notes: Note[]
  folders: Folder[]
  tags: Tag[]
  categories: Category[]

  activeView: ActiveView
  selectedNoteId: string | null
  searchQuery: string
  searchOpen: boolean

  createNote: (partial?: Partial<Note>) => string
  updateNote: (id: string, updates: Partial<Note>) => void
  deleteNote: (id: string) => void
  duplicateNote: (id: string) => void
  togglePin: (id: string) => void
  toggleArchive: (id: string) => void

  /** Touch a note — updates lastTouchedAt */
  touchNote: (id: string) => void

  /** Triage actions */
  triageKeep: (id: string) => void
  triageSnooze: (id: string, reviewAt: string) => void
  triageTrash: (id: string) => void
  promoteToPermament: (id: string) => void
  undoPromote: (id: string) => void
  moveBackToInbox: (id: string) => void

  /** Thinking Chain */
  createChainNote: (parentId: string) => string

  createFolder: (name: string, color: string) => void
  updateFolder: (id: string, updates: Partial<Folder>) => void
  deleteFolder: (id: string) => void

  createTag: (name: string, color: string) => void
  updateTag: (id: string, updates: Partial<Tag>) => void
  deleteTag: (id: string) => void
  addTagToNote: (noteId: string, tagId: string) => void
  removeTagFromNote: (noteId: string, tagId: string) => void

  createCategory: (name: string, color: string) => void
  updateCategory: (id: string, updates: Partial<Category>) => void
  deleteCategory: (id: string) => void

  setActiveView: (view: ActiveView) => void
  setSelectedNoteId: (id: string | null) => void
  openNote: (id: string) => void
  setSearchQuery: (query: string) => void
  setSearchOpen: (open: boolean) => void
}

export const usePlotStore = create<PlotState>()(
  persist(
    (set, get) => ({
      notes: SEED_NOTES,
      folders: SEED_FOLDERS,
      tags: SEED_TAGS,
      categories: SEED_CATEGORIES,

      activeView: { type: "all" } as ActiveView,
      selectedNoteId: null,
      searchQuery: "",
      searchOpen: false,

      createNote: (partial) => {
        const id = genId()
        const { activeView } = get()
        const stage: NoteStage = partial?.stage ?? (activeView.type === "inbox" ? "inbox" : "inbox")
        const newNote: Note = {
          id,
          title: partial?.title ?? "",
          content: partial?.content ?? "",
          folderId:
            partial?.folderId ??
            (activeView.type === "folder" ? activeView.folderId : null),
          category:
            partial?.category ??
            (activeView.type === "category" ? activeView.categoryId : ""),
          tags: partial?.tags ?? [],
          status: partial?.status ?? "capture",
          priority: partial?.priority ?? "none",
          reads: 0,
          pinned: partial?.pinned ?? false,
          archived: false,
          isInbox: partial?.isInbox ?? activeView.type === "inbox",
          createdAt: now(),
          updatedAt: now(),
          ...workflowDefaults(stage),
          ...(partial?.source != null ? { source: partial.source } : {}),
        }
        set((state) => ({
          notes: [newNote, ...state.notes],
          selectedNoteId: id,
        }))
        return id
      },

      updateNote: (id, updates) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, ...updates, updatedAt: now(), lastTouchedAt: now() } : n
          ),
        }))
      },

      touchNote: (id) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, lastTouchedAt: now() } : n
          ),
        }))
      },

      /* ── Triage actions ─────────────────────────────── */

      triageKeep: (id) => {
        const reviewAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id
              ? {
                  ...n,
                  stage: "capture" as const,
                  triageStatus: "kept" as const,
                  reviewAt,
                  isInbox: false,
                  lastTouchedAt: now(),
                  updatedAt: now(),
                }
              : n
          ),
        }))
      },

      triageSnooze: (id, reviewAt) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id
              ? {
                  ...n,
                  triageStatus: "snoozed" as const,
                  reviewAt,
                  snoozeCount: (n.snoozeCount ?? 0) + 1,
                  lastTouchedAt: now(),
                  updatedAt: now(),
                }
              : n
          ),
        }))
      },

      triageTrash: (id) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id
              ? {
                  ...n,
                  triageStatus: "trashed" as const,
                  archivedAt: now(),
                  lastTouchedAt: now(),
                  updatedAt: now(),
                }
              : n
          ),
        }))
      },

      promoteToPermament: (id) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id
              ? {
                  ...n,
                  stage: "permanent" as const,
                  status: "permanent" as const,
                  promotedAt: now(),
                  lastTouchedAt: now(),
                  updatedAt: now(),
                }
              : n
          ),
        }))
      },

      undoPromote: (id) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id
              ? {
                  ...n,
                  stage: "capture" as const,
                  status: "capture" as const,
                  promotedAt: null,
                  lastTouchedAt: now(),
                  updatedAt: now(),
                }
              : n
          ),
        }))
      },

      moveBackToInbox: (id) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id
              ? {
                  ...n,
                  stage: "inbox" as const,
                  triageStatus: "untriaged" as const,
                  isInbox: true,
                  lastTouchedAt: now(),
                  updatedAt: now(),
                }
              : n
          ),
        }))
      },

      /* ── Thinking Chain ───────────────────────────────── */

      createChainNote: (parentId) => {
        const parent = get().notes.find((n) => n.id === parentId)
        if (!parent) return ""
        const id = genId()
        const newNote: Note = {
          id,
          title: "",
          content: "",
          folderId: parent.folderId,
          category: parent.category,
          tags: [...parent.tags],
          status: parent.status,
          priority: "none",
          reads: 0,
          pinned: false,
          archived: false,
          isInbox: false,
          createdAt: now(),
          updatedAt: now(),
          ...workflowDefaults(parent.stage),
          parentNoteId: parentId,
        }
        set((state) => ({
          notes: [newNote, ...state.notes],
          selectedNoteId: id,
        }))
        return id
      },

      deleteNote: (id) => {
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
          selectedNoteId:
            state.selectedNoteId === id ? null : state.selectedNoteId,
        }))
      },

      duplicateNote: (id) => {
        const note = get().notes.find((n) => n.id === id)
        if (!note) return
        const newId = genId()
        set((state) => ({
          notes: [
            {
              ...note,
              id: newId,
              title: `${note.title} (copy)`,
              createdAt: now(),
              updatedAt: now(),
              lastTouchedAt: now(),
            },
            ...state.notes,
          ],
          selectedNoteId: newId,
        }))
      },

      togglePin: (id) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, pinned: !n.pinned, updatedAt: now(), lastTouchedAt: now() } : n
          ),
        }))
      },

      toggleArchive: (id) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, archived: !n.archived, updatedAt: now(), lastTouchedAt: now() } : n
          ),
        }))
      },

      createFolder: (name, color) => {
        set((state) => ({
          folders: [...state.folders, { id: genId(), name, color }],
        }))
      },

      updateFolder: (id, updates) => {
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === id ? { ...f, ...updates } : f
          ),
        }))
      },

      deleteFolder: (id) => {
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== id),
          notes: state.notes.map((n) =>
            n.folderId === id ? { ...n, folderId: null } : n
          ),
          activeView:
            state.activeView.type === "folder" &&
            state.activeView.folderId === id
              ? ({ type: "all" } as ActiveView)
              : state.activeView,
        }))
      },

      createTag: (name, color) => {
        set((state) => ({
          tags: [...state.tags, { id: genId(), name, color }],
        }))
      },

      updateTag: (id, updates) => {
        set((state) => ({
          tags: state.tags.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }))
      },

      deleteTag: (id) => {
        set((state) => ({
          tags: state.tags.filter((t) => t.id !== id),
          notes: state.notes.map((n) => ({
            ...n,
            tags: n.tags.filter((t) => t !== id),
          })),
        }))
      },

      addTagToNote: (noteId, tagId) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === noteId && !n.tags.includes(tagId)
              ? { ...n, tags: [...n.tags, tagId], updatedAt: now(), lastTouchedAt: now() }
              : n
          ),
        }))
      },

      removeTagFromNote: (noteId, tagId) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === noteId
              ? { ...n, tags: n.tags.filter((t) => t !== tagId), updatedAt: now(), lastTouchedAt: now() }
              : n
          ),
        }))
      },

      createCategory: (name, color) => {
        set((state) => ({
          categories: [...state.categories, { id: genId(), name, color }],
        }))
      },

      updateCategory: (id, updates) => {
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }))
      },

      deleteCategory: (id) => {
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
          notes: state.notes.map((n) =>
            n.category === id ? { ...n, category: "" } : n
          ),
          activeView:
            state.activeView.type === "category" &&
            state.activeView.categoryId === id
              ? ({ type: "all" } as ActiveView)
              : state.activeView,
        }))
      },

      setActiveView: (view) => set({ activeView: view, selectedNoteId: null }),
      setSelectedNoteId: (id) => set({ selectedNoteId: id }),
      openNote: (id) => {
        set((state) => ({
          selectedNoteId: id,
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, reads: (n.reads ?? 0) + 1, lastTouchedAt: now() } : n
          ),
        }))
      },
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSearchOpen: (open) => set({ searchOpen: open }),
    }),
    {
      name: "plot-store",
      version: 5,
      migrate: (persistedState: unknown) => {
        const state = persistedState as Record<string, unknown>
        if (state.notes && Array.isArray(state.notes)) {
          state.notes = (state.notes as Record<string, unknown>[]).map((n) => ({
            ...n,
            status: n.status ?? "capture",
            priority: n.priority ?? "none",
            reads: n.reads ?? 0,
            // Workflow field migration
            stage: n.stage ?? (n.isInbox ? "inbox" : (n.status === "permanent" ? "permanent" : "capture")),
            triageStatus: n.triageStatus ?? (n.isInbox ? "untriaged" : "kept"),
            reviewAt: n.reviewAt ?? null,
            inboxRank: n.inboxRank ?? 0,
            summary: n.summary ?? null,
            source: n.source ?? "manual",
            promotedAt: n.promotedAt ?? null,
            lastTouchedAt: n.lastTouchedAt ?? n.updatedAt ?? new Date().toISOString(),
            snoozeCount: n.snoozeCount ?? 0,
            archivedAt: n.archivedAt ?? null,
            // v5: Thinking Chain
            parentNoteId: n.parentNoteId ?? null,
          }))
        }
        return state as PlotState
      },
    }
  )
)

/* ── Selectors / Filters ──────────────────────────────── */

export function getFilteredNotes(state: PlotState): Note[] {
  const { notes, activeView, searchQuery } = state

  let filtered = notes

  switch (activeView.type) {
    case "inbox":
      filtered = filtered.filter((n) => n.isInbox && !n.archived)
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
    default:
      filtered = filtered.filter((n) => !n.archived)
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase()
    filtered = filtered.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
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
      filtered = filtered.filter((n) => n.isInbox && !n.archived)
      break
    case "all":
      filtered = filtered.filter((n) => !n.archived)
      break
    case "archive":
      filtered = filtered.filter((n) => n.archived)
      break
    case "projects":
      filtered = filtered.filter((n) => n.status === "project" && !n.archived)
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
    case "stage-inbox":
      filtered = filtered.filter((n) =>
        n.stage === "inbox" &&
        n.triageStatus !== "trashed" &&
        (n.triageStatus === "untriaged" || (n.triageStatus === "snoozed" && n.reviewAt && new Date(n.reviewAt) <= new Date()))
      )
      break
    case "stage-capture":
      filtered = filtered.filter((n) => n.stage === "capture" && n.triageStatus !== "trashed")
      break
    case "stage-permanent":
      filtered = filtered.filter((n) => n.stage === "permanent" && n.triageStatus !== "trashed")
      break
    default:
      filtered = filtered.filter((n) => !n.archived)
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase()
    filtered = filtered.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
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
    case "stage-inbox":
      return "Inbox"
    case "stage-capture":
      return "Capture"
    case "stage-permanent":
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
    default:
      return "Notes"
  }
}
