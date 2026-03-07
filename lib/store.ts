import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Note, NoteBody, Folder, Tag, Category, ActiveView, NoteFilter, NoteStatus, TriageStatus, NoteEvent, NoteEventType, ThinkingChainSession, ThinkingChainStep, KnowledgeMap } from "./types"
import { extractPreview, extractLinksOut } from "./body-helpers"
import { saveBody as saveBodyToIDB, deleteBody as deleteBodyFromIDB, BODIES_MIGRATED_KEY } from "./note-body-store"
import { createIDBStorage } from "./idb-storage"
import type { ViewState, ViewContextKey } from "./view-engine/types"
import { buildDefaultViewStates, normalizeViewStatesMap } from "./view-engine/defaults"

/** Fire-and-forget IDB body write (guarded for SSR) */
function persistBody(body: NoteBody) {
  if (typeof indexedDB === "undefined") return
  saveBodyToIDB(body).catch((err) => console.warn("[Plot] Body save failed:", err))
}

/** Fire-and-forget IDB body delete (guarded for SSR) */
function removeBody(id: string) {
  if (typeof indexedDB === "undefined") return
  deleteBodyFromIDB(id).catch((err) => console.warn("[Plot] Body delete failed:", err))
}

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
function workflowDefaults(status: NoteStatus = "inbox"): Pick<
  Note,
  "triageStatus" | "reviewAt" | "inboxRank" | "summary" | "source" | "promotedAt" | "lastTouchedAt" | "snoozeCount" | "archivedAt" | "parentNoteId"
> {
  return {
    triageStatus: status === "inbox" ? "untriaged" : "kept",
    reviewAt: null,
    inboxRank: 0,
    summary: null,
    source: "manual",
    promotedAt: status === "permanent" ? now() : null,
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
    contentJson: null,
    folderId: null,
    category: "cat-1",
    tags: ["tag-2"],
    status: "permanent",
    priority: "high",
    reads: 5,
    pinned: true,
    archived: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    ...workflowDefaults("permanent"),
    summary: "Introduction to the Plot note-taking app",
    project: null,
    projectLevel: null,
    preview: "Welcome to Plot This is your new note-taking app. - Create notes with markdown - Organize with folders, categories, and tags",
    linksOut: [],
  },
  {
    id: "note-2",
    title: "Quick thought",
    content: "This is an inbox note - a quick thought captured for later sorting.",
    contentJson: null,
    folderId: null,
    category: "",
    tags: [],
    status: "inbox",
    project: null,
    projectLevel: null,
    priority: "none",
    reads: 1,
    pinned: false,
    archived: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    ...workflowDefaults("inbox"),
    preview: "This is an inbox note - a quick thought captured for later sorting.",
    linksOut: [],
  },
  {
    id: "note-3",
    title: "Project planning",
    content: "## Q1 Goals\n\n1. Ship v1.0\n2. User testing\n3. Marketing launch",
    contentJson: null,
    folderId: "folder-1",
    category: "cat-1",
    tags: ["tag-1"],
    status: "capture",
    project: "Q1 Goals",
    projectLevel: null,
    priority: "urgent",
    reads: 12,
    pinned: false,
    archived: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    ...workflowDefaults("capture"),
    triageStatus: "kept",
    preview: "Q1 Goals 1. Ship v1.0 2. User testing 3. Marketing launch",
    linksOut: [],
  },
  {
    id: "note-4",
    title: "API design notes",
    content: "REST vs GraphQL comparison for our new service.",
    contentJson: null,
    folderId: null,
    category: "cat-1",
    tags: ["tag-2"],
    status: "reference",
    project: null,
    projectLevel: null,
    priority: "medium",
    reads: 3,
    pinned: false,
    archived: false,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
    ...workflowDefaults("capture"),
    triageStatus: "kept",
    summary: "Comparison of REST and GraphQL approaches",
    preview: "REST vs GraphQL comparison for our new service.",
    linksOut: [],
  },
  {
    id: "note-5",
    title: "Meeting notes",
    content: "Discussed roadmap for Q2. Action items: finalize spec, assign tasks.",
    contentJson: null,
    folderId: "folder-2",
    category: "cat-1",
    tags: [],
    status: "inbox",
    project: null,
    projectLevel: null,
    priority: "none",
    reads: 0,
    pinned: false,
    archived: false,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    ...workflowDefaults("inbox"),
    preview: "Discussed roadmap for Q2. Action items: finalize spec, assign tasks.",
    linksOut: [],
  },
  {
    id: "note-6",
    title: "Bookmarks",
    content: "- https://example.com\n- https://another.dev",
    contentJson: null,
    folderId: null,
    category: "cat-2",
    tags: [],
    status: "inbox",
    project: null,
    projectLevel: null,
    priority: "low",
    reads: 0,
    pinned: false,
    archived: false,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    ...workflowDefaults("inbox"),
    source: "webclip",
    preview: "- https://example.com - https://another.dev",
    linksOut: [],
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

  // View Engine state
  viewStateByContext: Record<ViewContextKey, ViewState>
  setViewState: (ctx: ViewContextKey, patch: Partial<ViewState>) => void
  _viewStateHydrated: boolean

  shortcutOverlayOpen: boolean

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
  setShortcutOverlayOpen: (open: boolean) => void
  detailsOpen: boolean
  setDetailsOpen: (open: boolean) => void
  toggleDetailsOpen: () => void

  // Sidebar resize / collapse / peek
  sidebarWidth: number
  sidebarLastWidth: number
  sidebarCollapsed: boolean
  sidebarPeek: boolean
  setSidebarWidth: (width: number) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setSidebarPeek: (peek: boolean) => void
  restoreSidebar: () => void

  // Phase 2 state
  noteEvents: NoteEvent[]
  thinkingChains: ThinkingChainSession[]
  graphFocusDepth: number  // 0 = off, 1/2/3 = focus depth
  commandPaletteMode: "search" | "commands" | "links"

  // Phase 2 actions
  startThinkingChain: (noteId: string) => string
  addThinkingStep: (chainId: string, text: string, relatedNoteIds?: string[]) => void
  endThinkingChain: (chainId: string) => void
  addWikiLink: (noteId: string, targetTitle: string) => void
  setGraphFocusDepth: (depth: number) => void
  setCommandPaletteMode: (mode: "search" | "commands" | "links") => void

  // Phase 3: Knowledge Maps
  knowledgeMaps: KnowledgeMap[]
  createKnowledgeMap: (title: string, description?: string, color?: string) => string
  updateKnowledgeMap: (id: string, updates: Partial<KnowledgeMap>) => void
  deleteKnowledgeMap: (id: string) => void
  addNoteToMap: (mapId: string, noteId: string) => void
  removeNoteFromMap: (mapId: string, noteId: string) => void

  // Internal: body hydration from IndexedDB (called by BodyProvider)
  _hydrateNoteBodies: (bodies: NoteBody[]) => void
}

export const usePlotStore = create<PlotState>()(
  persist(
    (set, get) => {
      // Private helper for event logging
      const MAX_EVENTS_PER_NOTE = 1000
      const appendEvent = (noteId: string, type: NoteEventType, meta?: Record<string, unknown>) => {
        const event: NoteEvent = { id: genId(), noteId, type, at: now(), meta }
        set((state) => {
          const updated = [...state.noteEvents, event]
          const noteEventCount = updated.filter(e => e.noteId === noteId).length
          if (noteEventCount > MAX_EVENTS_PER_NOTE) {
            const excess = noteEventCount - MAX_EVENTS_PER_NOTE
            let removed = 0
            return { noteEvents: updated.filter(e => {
              if (e.noteId === noteId && removed < excess) {
                removed++
                return false
              }
              return true
            })}
          }
          return { noteEvents: updated }
        })
      }

      return {
      notes: SEED_NOTES,
      folders: SEED_FOLDERS,
      tags: SEED_TAGS,
      categories: SEED_CATEGORIES,

      activeView: { type: "all" } as ActiveView,
      selectedNoteId: null,
      searchQuery: "",
      searchOpen: false,
      shortcutOverlayOpen: false,
      detailsOpen: true,

      // Sidebar resize / collapse / peek
      sidebarWidth: 240,
      sidebarLastWidth: 240,
      sidebarCollapsed: false,
      sidebarPeek: false,

      // Phase 2 state
      noteEvents: [] as NoteEvent[],
      thinkingChains: [] as ThinkingChainSession[],
      graphFocusDepth: 0,
      commandPaletteMode: "search" as const,
      knowledgeMaps: [] as KnowledgeMap[],

      // View Engine
      viewStateByContext: buildDefaultViewStates(),
      _viewStateHydrated: false,

      createNote: (partial) => {
        const id = genId()
        const { activeView } = get()
        const content = partial?.content ?? ""
        const newNote: Note = {
          id,
          title: partial?.title ?? "",
          content,
          contentJson: partial?.contentJson ?? null,
          folderId:
            partial?.folderId ??
            (activeView.type === "folder" ? activeView.folderId : null),
          category:
            partial?.category ??
            (activeView.type === "category" ? activeView.categoryId : ""),
          tags: partial?.tags ?? [],
          status: partial?.status ?? "inbox",
          project: partial?.project ?? null,
          projectLevel: partial?.projectLevel ?? null,
          priority: partial?.priority ?? "none",
          reads: 0,
          pinned: partial?.pinned ?? false,
          archived: false,
          createdAt: now(),
          updatedAt: now(),
          preview: extractPreview(content),
          linksOut: extractLinksOut(content),
          ...workflowDefaults(partial?.status ?? "inbox"),
          ...(partial?.source != null ? { source: partial.source } : {}),
        }
        set((state) => ({
          notes: [newNote, ...state.notes],
          selectedNoteId: id,
        }))
        persistBody({ id, content, contentJson: partial?.contentJson ?? null })
        appendEvent(id, "created")
        return id
      },

      updateNote: (id, updates) => {
        // Recompute preview/linksOut when content changes
        const contentUpdates = updates.content !== undefined
          ? { preview: extractPreview(updates.content), linksOut: extractLinksOut(updates.content) }
          : {}
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, ...updates, ...contentUpdates, updatedAt: now(), lastTouchedAt: now() } : n
          ),
        }))
        // Persist body to IDB when content changes
        if (updates.content !== undefined || updates.contentJson !== undefined) {
          const note = get().notes.find((n) => n.id === id)
          if (note) {
            persistBody({ id, content: note.content, contentJson: note.contentJson })
          }
        }
        appendEvent(id, "updated")
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
                  status: "capture" as const,
                  triageStatus: "kept" as const,
                  reviewAt,
                  lastTouchedAt: now(),
                  updatedAt: now(),
                }
              : n
          ),
        }))
        appendEvent(id, "triage_keep")
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
        appendEvent(id, "triage_snooze", { reviewAt })
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
        appendEvent(id, "triage_trash")
      },

      promoteToPermament: (id) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id
              ? {
                  ...n,
                  status: "permanent" as const,
                  promotedAt: now(),
                  lastTouchedAt: now(),
                  updatedAt: now(),
                }
              : n
          ),
        }))
        appendEvent(id, "promoted")
      },

      undoPromote: (id) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id
              ? {
                  ...n,
                  status: "capture" as const,
                  promotedAt: null,
                  lastTouchedAt: now(),
                  updatedAt: now(),
                }
              : n
          ),
        }))
        appendEvent(id, "updated", { action: "undoPromote" })
      },

      moveBackToInbox: (id) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id
              ? {
                  ...n,
                  status: "inbox" as const,
                  triageStatus: "untriaged" as const,
                  lastTouchedAt: now(),
                  updatedAt: now(),
                }
              : n
          ),
        }))
        appendEvent(id, "updated", { action: "moveBackToInbox" })
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
          contentJson: null,
          folderId: parent.folderId,
          category: parent.category,
          tags: [...parent.tags],
          status: parent.status,
          project: parent.project,
          projectLevel: parent.projectLevel,
          priority: "none",
          reads: 0,
          pinned: false,
          archived: false,
          createdAt: now(),
          updatedAt: now(),
          preview: "",
          linksOut: [],
          ...workflowDefaults(parent.status),
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
        removeBody(id)
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
        persistBody({ id: newId, content: note.content, contentJson: note.contentJson })
      },

      togglePin: (id) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, pinned: !n.pinned, updatedAt: now(), lastTouchedAt: now() } : n
          ),
        }))
      },

      toggleArchive: (id) => {
        const note = get().notes.find((n) => n.id === id)
        const wasArchived = note?.archived ?? false
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, archived: !n.archived, updatedAt: now(), lastTouchedAt: now() } : n
          ),
        }))
        appendEvent(id, wasArchived ? "unarchived" : "archived")
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
        appendEvent(id, "opened")
      },
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSearchOpen: (open) => set({ searchOpen: open }),
      setShortcutOverlayOpen: (open) => set({ shortcutOverlayOpen: open }),
      setDetailsOpen: (open) => set({ detailsOpen: open }),
      toggleDetailsOpen: () => set((s) => ({ detailsOpen: !s.detailsOpen })),

      setSidebarWidth: (width) => set({ sidebarWidth: width, sidebarLastWidth: width }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed, sidebarPeek: false }),
      setSidebarPeek: (peek) => set({ sidebarPeek: peek }),
      restoreSidebar: () => set((s) => ({ sidebarCollapsed: false, sidebarPeek: false, sidebarWidth: s.sidebarLastWidth })),

      /* ── Phase 2: Thinking Chain Sessions ─────────────── */

      startThinkingChain: (noteId) => {
        const id = genId()
        const session: ThinkingChainSession = {
          id, noteId, startedAt: now(), endedAt: null, steps: [], status: "active"
        }
        set((state) => ({ thinkingChains: [...state.thinkingChains, session] }))
        appendEvent(noteId, "thinking_chain_started", { chainId: id })
        return id
      },

      addThinkingStep: (chainId, text, relatedNoteIds) => {
        const step: ThinkingChainStep = { id: genId(), at: now(), text, relatedNoteIds }
        set((state) => ({
          thinkingChains: state.thinkingChains.map((c) =>
            c.id === chainId ? { ...c, steps: [...c.steps, step] } : c
          ),
        }))
        const chain = get().thinkingChains.find((c) => c.id === chainId)
        if (chain) appendEvent(chain.noteId, "thinking_chain_step_added", { chainId, stepId: step.id })
      },

      endThinkingChain: (chainId) => {
        set((state) => ({
          thinkingChains: state.thinkingChains.map((c) =>
            c.id === chainId ? { ...c, endedAt: now(), status: "done" as const } : c
          ),
        }))
        const chain = get().thinkingChains.find((c) => c.id === chainId)
        if (chain) appendEvent(chain.noteId, "thinking_chain_ended", { chainId })
      },

      addWikiLink: (noteId, targetTitle) => {
        set((state) => ({
          notes: state.notes.map((n) => {
            if (n.id !== noteId) return n
            const newContent = n.content + `\n[[${targetTitle}]]`
            return {
              ...n,
              content: newContent,
              linksOut: extractLinksOut(newContent),
              updatedAt: now(),
              lastTouchedAt: now(),
            }
          }),
        }))
        // Persist updated body to IDB
        const note = get().notes.find((n) => n.id === noteId)
        if (note) {
          persistBody({ id: noteId, content: note.content, contentJson: note.contentJson })
        }
        appendEvent(noteId, "link_added", { targetTitle })
      },

      setGraphFocusDepth: (depth) => set({ graphFocusDepth: depth }),

      setCommandPaletteMode: (mode) => set({ commandPaletteMode: mode }),

      setViewState: (ctx, patch) => {
        set((state) => ({
          viewStateByContext: {
            ...state.viewStateByContext,
            [ctx]: { ...state.viewStateByContext[ctx], ...patch },
          },
        }))
      },

      /* ── Phase 3: Knowledge Maps ────────────────────────── */

      createKnowledgeMap: (title, description, color) => {
        const id = genId()
        const map: KnowledgeMap = {
          id,
          title,
          description: description ?? "",
          noteIds: [],
          color: color ?? "#5e6ad2",
          createdAt: now(),
          updatedAt: now(),
        }
        set((state) => ({ knowledgeMaps: [...state.knowledgeMaps, map] }))
        return id
      },

      updateKnowledgeMap: (id, updates) => {
        set((state) => ({
          knowledgeMaps: state.knowledgeMaps.map((m) =>
            m.id === id ? { ...m, ...updates, updatedAt: now() } : m
          ),
        }))
      },

      deleteKnowledgeMap: (id) => {
        set((state) => ({
          knowledgeMaps: state.knowledgeMaps.filter((m) => m.id !== id),
        }))
      },

      addNoteToMap: (mapId, noteId) => {
        set((state) => ({
          knowledgeMaps: state.knowledgeMaps.map((m) =>
            m.id === mapId && !m.noteIds.includes(noteId)
              ? { ...m, noteIds: [...m.noteIds, noteId], updatedAt: now() }
              : m
          ),
        }))
        appendEvent(noteId, "map_added", { mapId })
      },

      removeNoteFromMap: (mapId, noteId) => {
        set((state) => ({
          knowledgeMaps: state.knowledgeMaps.map((m) =>
            m.id === mapId
              ? { ...m, noteIds: m.noteIds.filter((id) => id !== noteId), updatedAt: now() }
              : m
          ),
        }))
        appendEvent(noteId, "map_removed", { mapId })
      },

      /* ── Internal: Body hydration from IndexedDB ──────── */

      _hydrateNoteBodies: (bodies) => {
        const bodyMap = new Map(bodies.map((b) => [b.id, b]))
        set((state) => ({
          notes: state.notes.map((n) => {
            // Only hydrate notes that have empty content (not already loaded)
            if (n.content) return n
            const body = bodyMap.get(n.id)
            return body ? { ...n, content: body.content, contentJson: body.contentJson } : n
          }),
        }))
      },
      }
    },
    {
      name: "plot-store",
      version: 16,
      storage: createIDBStorage<PlotState>(),
      partialize: (state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { sidebarPeek, _viewStateHydrated, ...rest } = state
        // Always strip body content — bodies are persisted separately in IndexedDB
        return {
          ...rest,
          notes: state.notes.map((n) => ({ ...n, content: "", contentJson: null })),
        } as unknown as PlotState
      },
      migrate: (persistedState: unknown) => {
        const state = persistedState as Record<string, unknown>
        if (state.notes && Array.isArray(state.notes)) {
          state.notes = (state.notes as Record<string, unknown>[]).map((n) => {
            // v11: Separate project from status
            if (n.status === "project") {
              n.status = "capture"
              n.project = "Migrated"
            } else {
              n.project = n.project ?? null
            }
            // v12: Merge stage into status, remove stage & isInbox
            const oldStage = n.stage ?? (n.isInbox ? "inbox" : (n.status === "permanent" ? "permanent" : "capture"));
            const mergedStatus = oldStage === "inbox" ? "inbox"
              : oldStage === "permanent" ? "permanent"
              : (n.status ?? "capture"); // capture stage keeps existing status (capture or reference)

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { stage: _stage, isInbox: _isInbox, ...rest } = n;

            // v13: Precompute preview and linksOut from content
            const content = typeof rest.content === "string" ? rest.content as string : ""
            return {
            ...rest,
            status: mergedStatus,
            priority: n.priority ?? "none",
            reads: n.reads ?? 0,
            triageStatus: n.triageStatus ?? (n.isInbox ? "untriaged" : "kept"),
            reviewAt: n.reviewAt ?? null,
            inboxRank: n.inboxRank ?? 0,
            summary: n.summary ?? null,
            source: n.source ?? "manual",
            promotedAt: n.promotedAt ?? null,
            lastTouchedAt: n.lastTouchedAt ?? n.updatedAt ?? new Date().toISOString(),
            snoozeCount: n.snoozeCount ?? 0,
            archivedAt: n.archivedAt ?? null,
            parentNoteId: n.parentNoteId ?? null,
            contentJson: n.contentJson ?? null,
            projectLevel: n.projectLevel ?? null,
            // v13: Precomputed fields
            preview: n.preview ?? extractPreview(content),
            linksOut: n.linksOut ?? extractLinksOut(content),
          }
          })
        }
        // v14: Extract bodies for IDB migration (handled async by BodyProvider)
        if (typeof window !== "undefined" && state.notes && Array.isArray(state.notes)) {
          const noteArr = state.notes as Array<Record<string, unknown>>
          const hasContent = noteArr.some(
            (n) => typeof n.content === "string" && (n.content as string).length > 0
          )
          if (hasContent) {
            const bodies: NoteBody[] = noteArr
              .filter((n) => typeof n.content === "string" && (n.content as string).length > 0)
              .map((n) => ({
                id: n.id as string,
                content: n.content as string,
                contentJson: (n.contentJson as Record<string, unknown>) ?? null,
              }))
            ;(window as any).__plotMigrationBodies = bodies
          }
        }

        // v6: Phase 2 defaults
        if (!state.noteEvents) state.noteEvents = []
        if (!state.thinkingChains) state.thinkingChains = []
        if (state.graphFocusDepth === undefined) state.graphFocusDepth = 0
        if (state.commandPaletteMode === undefined) state.commandPaletteMode = "search"
        // v7: Knowledge Maps
        if (!state.knowledgeMaps) state.knowledgeMaps = []
        // v9: Details panel toggle
        if (state.detailsOpen === undefined) state.detailsOpen = true
        // v10: Sidebar resize / collapse
        if (state.sidebarWidth === undefined) state.sidebarWidth = 240
        if (state.sidebarLastWidth === undefined) state.sidebarLastWidth = 240
        if (state.sidebarCollapsed === undefined) state.sidebarCollapsed = false
        state.sidebarPeek = false // always reset transient state
        // v16: ViewState per context
        if (state.viewStateByContext) {
          state.viewStateByContext = normalizeViewStatesMap(
            state.viewStateByContext as Record<string, unknown>
          )
        } else {
          state.viewStateByContext = buildDefaultViewStates()
        }
        state._viewStateHydrated = false // always reset transient flag
        return state as unknown as PlotState
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._viewStateHydrated = true
        }
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
