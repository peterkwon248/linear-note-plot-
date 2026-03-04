import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Note, Folder, Tag, Category, ActiveView } from "./types"

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

const SEED_NOTES: Note[] = [
  {
    id: "note-1",
    title: "Welcome to Plot",
    content:
      "# Welcome to Plot\n\nThis is your new note-taking app.\n\n- Create notes with **markdown**\n- Organize with folders, categories, and tags\n- Pin important notes\n- Archive when done",
    folderId: null,
    category: "cat-1",
    tags: ["tag-2"],
    pinned: true,
    archived: false,
    isInbox: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "note-2",
    title: "Quick thought",
    content: "This is an inbox note - a quick thought captured for later sorting.",
    folderId: null,
    category: "",
    tags: [],
    pinned: false,
    archived: false,
    isInbox: true,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "note-3",
    title: "Project planning",
    content: "## Q1 Goals\n\n1. Ship v1.0\n2. User testing\n3. Marketing launch",
    folderId: "folder-1",
    category: "cat-1",
    tags: ["tag-1"],
    pinned: false,
    archived: false,
    isInbox: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
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
          pinned: partial?.pinned ?? false,
          archived: false,
          isInbox: partial?.isInbox ?? activeView.type === "inbox",
          createdAt: now(),
          updatedAt: now(),
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
            n.id === id ? { ...n, ...updates, updatedAt: now() } : n
          ),
        }))
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
            },
            ...state.notes,
          ],
          selectedNoteId: newId,
        }))
      },

      togglePin: (id) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, pinned: !n.pinned, updatedAt: now() } : n
          ),
        }))
      },

      toggleArchive: (id) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, archived: !n.archived, updatedAt: now() } : n
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
              ? { ...n, tags: [...n.tags, tagId], updatedAt: now() }
              : n
          ),
        }))
      },

      removeTagFromNote: (noteId, tagId) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === noteId
              ? { ...n, tags: n.tags.filter((t) => t !== tagId), updatedAt: now() }
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
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSearchOpen: (open) => set({ searchOpen: open }),
    }),
    {
      name: "plot-store",
      version: 1,
    }
  )
)

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
