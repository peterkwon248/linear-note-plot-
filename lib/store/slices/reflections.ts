import type { Reflection } from "../../types"
import { genId, now, type AppendEventFn } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void
type Get = () => any

export function createReflectionsSlice(set: Set, _get: Get, appendEvent: AppendEventFn) {
  return {
    addReflection: (noteId: string, text: string) => {
      const reflection: Reflection = {
        id: genId(),
        noteId,
        text,
        createdAt: now(),
      }
      set((state: any) => ({
        reflections: [...state.reflections, reflection],
      }))
      appendEvent(noteId, "reflection_added", { reflectionId: reflection.id })
      return reflection.id
    },
  }
}
