import type { Relation, RelationType } from "../../types"
import { genId, now, type AppendEventFn } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void
type Get = () => any

export function createRelationsSlice(set: Set, get: Get, appendEvent: AppendEventFn) {
  return {
    addRelation: (sourceNoteId: string, targetNoteId: string, type: RelationType) => {
      const existing = get().relations as Relation[]
      if (existing.some(r =>
        r.sourceNoteId === sourceNoteId &&
        r.targetNoteId === targetNoteId &&
        r.type === type
      )) return null

      const id = genId()
      const relation: Relation = {
        id,
        sourceNoteId,
        targetNoteId,
        type,
        createdAt: now(),
      }
      set((state: any) => ({
        relations: [...state.relations, relation],
      }))
      appendEvent(sourceNoteId, "relation_added", { relationId: id, targetNoteId, type })
      return id
    },

    removeRelation: (relationId: string) => {
      const relation = (get().relations as Relation[]).find(r => r.id === relationId)
      if (!relation) return
      set((state: any) => ({
        relations: state.relations.filter((r: Relation) => r.id !== relationId),
      }))
      appendEvent(relation.sourceNoteId, "relation_removed", {
        relationId, targetNoteId: relation.targetNoteId, type: relation.type
      })
    },

    updateRelationType: (relationId: string, newType: RelationType) => {
      const relation = (get().relations as Relation[]).find(r => r.id === relationId)
      if (!relation) return
      const oldType = relation.type
      set((state: any) => ({
        relations: state.relations.map((r: Relation) =>
          r.id === relationId ? { ...r, type: newType } : r
        ),
      }))
      appendEvent(relation.sourceNoteId, "relation_type_changed", {
        relationId, targetNoteId: relation.targetNoteId, oldType, newType
      })
    },
  }
}
