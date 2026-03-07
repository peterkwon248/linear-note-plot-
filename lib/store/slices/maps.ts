import type { Note, NoteBody, KnowledgeMap } from "../../types"
import { genId, now, type AppendEventFn } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void

export function createMapsSlice(set: Set, appendEvent: AppendEventFn) {
  return {
    createKnowledgeMap: (title: string, description?: string, color?: string) => {
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
      set((state: any) => ({ knowledgeMaps: [...state.knowledgeMaps, map] }))
      return id
    },

    updateKnowledgeMap: (id: string, updates: Partial<KnowledgeMap>) => {
      set((state: any) => ({
        knowledgeMaps: state.knowledgeMaps.map((m: KnowledgeMap) =>
          m.id === id ? { ...m, ...updates, updatedAt: now() } : m
        ),
      }))
    },

    deleteKnowledgeMap: (id: string) => {
      set((state: any) => ({
        knowledgeMaps: state.knowledgeMaps.filter((m: KnowledgeMap) => m.id !== id),
      }))
    },

    addNoteToMap: (mapId: string, noteId: string) => {
      set((state: any) => ({
        knowledgeMaps: state.knowledgeMaps.map((m: KnowledgeMap) =>
          m.id === mapId && !m.noteIds.includes(noteId)
            ? { ...m, noteIds: [...m.noteIds, noteId], updatedAt: now() }
            : m
        ),
      }))
      appendEvent(noteId, "map_added", { mapId })
    },

    removeNoteFromMap: (mapId: string, noteId: string) => {
      set((state: any) => ({
        knowledgeMaps: state.knowledgeMaps.map((m: KnowledgeMap) =>
          m.id === mapId
            ? { ...m, noteIds: m.noteIds.filter((id) => id !== noteId), updatedAt: now() }
            : m
        ),
      }))
      appendEvent(noteId, "map_removed", { mapId })
    },

    _hydrateNoteBodies: (bodies: NoteBody[]) => {
      const bodyMap = new Map(bodies.map((b) => [b.id, b]))
      set((state: any) => ({
        notes: state.notes.map((n: Note) => {
          if (n.content) return n
          const body = bodyMap.get(n.id)
          return body ? { ...n, content: body.content, contentJson: body.contentJson } : n
        }),
      }))
    },
  }
}
