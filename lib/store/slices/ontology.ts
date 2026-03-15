import type { CoOccurrence, RelationSuggestion } from "../../types"
import { genId, now, type AppendEventFn } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void
type Get = () => any

const MAX_COOCCURRENCES = 500
const MAX_SUGGESTIONS = 100

export function createOntologySlice(set: Set, get: Get, _appendEvent: AppendEventFn) {
  return {
    updateCoOccurrences: (items: CoOccurrence[]) => {
      set({ coOccurrences: items.slice(0, MAX_COOCCURRENCES) })
    },

    addRelationSuggestion: (
      partial: Omit<RelationSuggestion, "id" | "createdAt" | "status">
    ) => {
      const id = genId()
      const suggestion: RelationSuggestion = {
        ...partial,
        id,
        status: "pending",
        createdAt: now(),
      }
      set((state: any) => {
        const updated = [...state.relationSuggestions, suggestion]
        return {
          relationSuggestions:
            updated.length > MAX_SUGGESTIONS
              ? updated.slice(updated.length - MAX_SUGGESTIONS)
              : updated,
        }
      })
      return id
    },

    acceptRelationSuggestion: (suggestionId: string) => {
      const suggestion = (get().relationSuggestions as RelationSuggestion[]).find(
        (s) => s.id === suggestionId
      )
      if (!suggestion || suggestion.status !== "pending") return
      get().addRelation(suggestion.sourceNoteId, suggestion.targetNoteId, suggestion.suggestedType)
      set((state: any) => ({
        relationSuggestions: state.relationSuggestions.map((s: RelationSuggestion) =>
          s.id === suggestionId ? { ...s, status: "accepted" as const } : s
        ),
      }))
    },

    dismissRelationSuggestion: (suggestionId: string) => {
      set((state: any) => ({
        relationSuggestions: state.relationSuggestions.map((s: RelationSuggestion) =>
          s.id === suggestionId ? { ...s, status: "dismissed" as const } : s
        ),
      }))
    },
  }
}
