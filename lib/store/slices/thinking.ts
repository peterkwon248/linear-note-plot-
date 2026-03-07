import type { Note, ThinkingChainSession, ThinkingChainStep } from "../../types"
import { extractLinksOut } from "../../body-helpers"
import { genId, now, persistBody, type AppendEventFn } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void
type Get = () => any

export function createThinkingSlice(set: Set, get: Get, appendEvent: AppendEventFn) {
  return {
    startThinkingChain: (noteId: string) => {
      const id = genId()
      const session: ThinkingChainSession = {
        id, noteId, startedAt: now(), endedAt: null, steps: [], status: "active"
      }
      set((state: any) => ({ thinkingChains: [...state.thinkingChains, session] }))
      appendEvent(noteId, "thinking_chain_started", { chainId: id })
      return id
    },

    addThinkingStep: (chainId: string, text: string, relatedNoteIds?: string[]) => {
      const step: ThinkingChainStep = { id: genId(), at: now(), text, relatedNoteIds }
      set((state: any) => ({
        thinkingChains: state.thinkingChains.map((c: ThinkingChainSession) =>
          c.id === chainId ? { ...c, steps: [...c.steps, step] } : c
        ),
      }))
      const chain = get().thinkingChains.find((c: ThinkingChainSession) => c.id === chainId)
      if (chain) appendEvent(chain.noteId, "thinking_chain_step_added", { chainId, stepId: step.id })
    },

    endThinkingChain: (chainId: string) => {
      set((state: any) => ({
        thinkingChains: state.thinkingChains.map((c: ThinkingChainSession) =>
          c.id === chainId ? { ...c, endedAt: now(), status: "done" as const } : c
        ),
      }))
      const chain = get().thinkingChains.find((c: ThinkingChainSession) => c.id === chainId)
      if (chain) appendEvent(chain.noteId, "thinking_chain_ended", { chainId })
    },

    addWikiLink: (noteId: string, targetTitle: string) => {
      set((state: any) => ({
        notes: state.notes.map((n: Note) => {
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
      const note = get().notes.find((n: Note) => n.id === noteId)
      if (note) {
        persistBody({ id: noteId, content: note.content, contentJson: note.contentJson })
      }
      appendEvent(noteId, "link_added", { targetTitle })
    },

    setGraphFocusDepth: (depth: number) => set({ graphFocusDepth: depth }),

    setCommandPaletteMode: (mode: "search" | "commands" | "links") => set({ commandPaletteMode: mode }),
  }
}
