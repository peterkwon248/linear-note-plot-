import type { Note, NoteBody } from "../../types"
import { persistBody } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void

export function createMapsSlice(set: Set) {
  return {
    _hydrateNoteBodies: (bodies: NoteBody[]) => {
      const bodyMap = new Map(bodies.map((b) => [b.id, b]))
      const needsPersist: NoteBody[] = []
      set((state: any) => ({
        notes: state.notes.map((n: Note) => {
          if (n.content) {
            if (!bodyMap.has(n.id)) {
              needsPersist.push({ id: n.id, content: n.content, contentJson: n.contentJson })
            }
            return n
          }
          const body = bodyMap.get(n.id)
          return body ? { ...n, content: body.content, contentJson: body.contentJson } : n
        }),
      }))
      for (const body of needsPersist) {
        persistBody(body)
      }
    },
  }
}
