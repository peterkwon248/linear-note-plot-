import type { Note, NoteBody, ActiveView } from "../../types"
import { extractPreview, extractLinksOut } from "../../body-helpers"
import { genId, now, workflowDefaults, persistBody, removeBody, type AppendEventFn } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void
type Get = () => any

export function createNotesSlice(set: Set, get: Get, appendEvent: AppendEventFn) {
  return {
    createNote: (partial?: Partial<Note>) => {
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
      set((state: any) => ({
        notes: [newNote, ...state.notes],
        selectedNoteId: id,
      }))
      persistBody({ id, content, contentJson: partial?.contentJson ?? null })
      appendEvent(id, "created")
      return id
    },

    updateNote: (id: string, updates: Partial<Note>) => {
      const contentUpdates = updates.content !== undefined
        ? { preview: extractPreview(updates.content), linksOut: extractLinksOut(updates.content) }
        : {}
      set((state: any) => ({
        notes: state.notes.map((n: Note) =>
          n.id === id ? { ...n, ...updates, ...contentUpdates, updatedAt: now(), lastTouchedAt: now() } : n
        ),
      }))
      if (updates.content !== undefined || updates.contentJson !== undefined) {
        const note = get().notes.find((n: Note) => n.id === id)
        if (note) {
          persistBody({ id, content: note.content, contentJson: note.contentJson })
        }
      }
      appendEvent(id, "updated")
    },

    touchNote: (id: string) => {
      set((state: any) => ({
        notes: state.notes.map((n: Note) =>
          n.id === id ? { ...n, lastTouchedAt: now() } : n
        ),
      }))
    },

    deleteNote: (id: string) => {
      set((state: any) => ({
        notes: state.notes.filter((n: Note) => n.id !== id),
        selectedNoteId: state.selectedNoteId === id ? null : state.selectedNoteId,
      }))
      removeBody(id)
    },

    duplicateNote: (id: string) => {
      const note = get().notes.find((n: Note) => n.id === id)
      if (!note) return
      const newId = genId()
      set((state: any) => ({
        notes: [
          { ...note, id: newId, title: `${note.title} (copy)`, createdAt: now(), updatedAt: now(), lastTouchedAt: now() },
          ...state.notes,
        ],
        selectedNoteId: newId,
      }))
      persistBody({ id: newId, content: note.content, contentJson: note.contentJson })
    },

    togglePin: (id: string) => {
      set((state: any) => ({
        notes: state.notes.map((n: Note) =>
          n.id === id ? { ...n, pinned: !n.pinned, updatedAt: now(), lastTouchedAt: now() } : n
        ),
      }))
    },

    toggleArchive: (id: string) => {
      const note = get().notes.find((n: Note) => n.id === id)
      const wasArchived = note?.archived ?? false
      set((state: any) => ({
        notes: state.notes.map((n: Note) =>
          n.id === id ? { ...n, archived: !n.archived, updatedAt: now(), lastTouchedAt: now() } : n
        ),
      }))
      appendEvent(id, wasArchived ? "unarchived" : "archived")
    },

    createChainNote: (parentId: string) => {
      const parent = get().notes.find((n: Note) => n.id === parentId)
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
      set((state: any) => ({
        notes: [newNote, ...state.notes],
        selectedNoteId: id,
      }))
      return id
    },
  }
}
