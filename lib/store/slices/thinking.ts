import type { Note, Thread, ThreadStep } from "../../types"
import { extractLinksOut } from "../../body-helpers"
import { genId, now, persistBody, type AppendEventFn } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void
type Get = () => any

export function createThreadSlice(set: Set, get: Get, appendEvent: AppendEventFn) {
  return {
    startThread: (noteId: string) => {
      const id = genId()
      const thread: Thread = {
        id, noteId, startedAt: now(), endedAt: null, steps: [], status: "active"
      }
      set((state: any) => ({ threads: [...state.threads, thread] }))
      appendEvent(noteId, "thread_started", { threadId: id })
      return id
    },

    addThreadStep: (threadId: string, text: string) => {
      const step: ThreadStep = { id: genId(), at: now(), text }
      set((state: any) => ({
        threads: state.threads.map((c: Thread) =>
          c.id === threadId ? { ...c, steps: [...c.steps, step] } : c
        ),
      }))
      const thread = get().threads.find((c: Thread) => c.id === threadId)
      if (thread) appendEvent(thread.noteId, "thread_step_added", { threadId, stepId: step.id })
    },

    endThread: (threadId: string) => {
      set((state: any) => ({
        threads: state.threads.map((c: Thread) =>
          c.id === threadId ? { ...c, endedAt: now(), status: "done" as const } : c
        ),
      }))
      const thread = get().threads.find((c: Thread) => c.id === threadId)
      if (thread) appendEvent(thread.noteId, "thread_ended", { threadId })
    },

    deleteThread: (threadId: string) => {
      const thread = get().threads.find((c: Thread) => c.id === threadId)
      set((state: any) => ({
        threads: state.threads.filter((c: Thread) => c.id !== threadId),
      }))
      if (thread) appendEvent(thread.noteId, "thread_deleted", { threadId })
    },

    addWikiLink: (noteId: string, targetTitle: string) => {
      set((state: any) => ({
        notes: state.notes.map((n: Note) => {
          if (n.id !== noteId) return n
          const newContent = n.content + `\n[[${targetTitle}]]`
          return {
            ...n,
            content: newContent,
            contentJson: null,
            linksOut: extractLinksOut(newContent),
            updatedAt: now(),
            lastTouchedAt: now(),
          }
        }),
      }))
      const note = get().notes.find((n: Note) => n.id === noteId)
      if (note) {
        persistBody({ id: noteId, content: note.content, contentJson: null })
      }
      appendEvent(noteId, "link_added", { targetTitle })
    },

    setGraphFocusDepth: (depth: number) => set({ graphFocusDepth: depth }),

    setCommandPaletteMode: (mode: "search" | "commands" | "links") => set({ commandPaletteMode: mode }),
  }
}
