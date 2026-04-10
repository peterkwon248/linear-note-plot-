import type { Reference, ReferenceHistoryEntry } from "../../types"
import { genId, now } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void

const MAX_HISTORY_ENTRIES = 50

/** Append a history entry to a reference, bounded to MAX_HISTORY_ENTRIES (oldest evicted). */
function appendHistory(ref: Reference, entry: ReferenceHistoryEntry): ReferenceHistoryEntry[] {
  const prev = ref.history ?? []
  const next = [...prev, entry]
  if (next.length > MAX_HISTORY_ENTRIES) {
    return next.slice(next.length - MAX_HISTORY_ENTRIES)
  }
  return next
}

/** Fields that are tracked in history snapshots. */
const TRACKED_FIELDS = ["title", "content", "fields"] as const

/** Check if an update modifies any tracked fields (vs metadata-only changes like trashed). */
function hasContentChange(existing: Reference, updates: Partial<Reference>): boolean {
  for (const key of TRACKED_FIELDS) {
    if (key in updates && (updates as any)[key] !== undefined) {
      return true
    }
  }
  return false
}

export function createReferencesSlice(set: Set) {
  return {
    createReference: (partial: { title: string; content: string; fields?: Array<{ key: string; value: string }>; tags?: string[] }): string => {
      const id = genId()
      const timestamp = now()
      const ref: Reference = {
        id,
        title: partial.title,
        content: partial.content,
        fields: partial.fields ?? [],
        tags: partial.tags,
        createdAt: timestamp,
        updatedAt: timestamp,
        history: [{ at: timestamp, action: "created" }],
      }
      set((state: any) => ({
        references: { ...state.references, [id]: ref },
      }))
      return id
    },

    updateReference: (id: string, updates: Partial<Omit<Reference, "id" | "createdAt">>) => {
      set((state: any) => {
        const existing = state.references[id] as Reference | undefined
        if (!existing) return {}
        // Only record history when tracked fields change
        const isContentEdit = hasContentChange(existing, updates)
        const timestamp = now()
        const nextRef: Reference = {
          ...existing,
          ...updates,
          updatedAt: timestamp,
        }
        if (isContentEdit) {
          // Snapshot the PREVIOUS state for potential revert
          nextRef.history = appendHistory(existing, {
            at: timestamp,
            action: "edited",
            snapshot: {
              title: existing.title,
              content: existing.content,
              fields: existing.fields,
            },
          })
        }
        return {
          references: {
            ...state.references,
            [id]: nextRef,
          },
        }
      })
    },

    deleteReference: (id: string) => {
      set((state: any) => {
        const existing = state.references[id] as Reference | undefined
        if (!existing) return {}
        const timestamp = new Date().toISOString()
        return {
          references: {
            ...state.references,
            [id]: {
              ...existing,
              trashed: true,
              trashedAt: timestamp,
              history: appendHistory(existing, { at: timestamp, action: "trashed" }),
            },
          },
        }
      })
    },

    restoreReference: (id: string) => {
      set((state: any) => {
        const existing = state.references[id] as Reference | undefined
        if (!existing) return {}
        const timestamp = new Date().toISOString()
        return {
          references: {
            ...state.references,
            [id]: {
              ...existing,
              trashed: false,
              trashedAt: null,
              history: appendHistory(existing, { at: timestamp, action: "restored" }),
            },
          },
        }
      })
    },

    permanentlyDeleteReference: (id: string) => {
      set((state: any) => {
        const { [id]: _, ...rest } = state.references
        return { references: rest }
      })
    },

    /** Link a note to a reference (add noteId to usedInNoteIds if not already present). */
    linkNoteToReference: (refId: string, noteId: string) => {
      set((state: any) => {
        const ref = state.references[refId] as Reference | undefined
        if (!ref) return {}
        const current = ref.usedInNoteIds ?? []
        if (current.includes(noteId)) return {} // already linked
        return {
          references: {
            ...state.references,
            [refId]: { ...ref, usedInNoteIds: [...current, noteId] },
          },
        }
      })
    },

    /** Unlink a note from a reference (remove noteId from usedInNoteIds). */
    unlinkNoteFromReference: (refId: string, noteId: string) => {
      set((state: any) => {
        const ref = state.references[refId] as Reference | undefined
        if (!ref) return {}
        const current = ref.usedInNoteIds ?? []
        if (!current.includes(noteId)) return {}
        return {
          references: {
            ...state.references,
            [refId]: { ...ref, usedInNoteIds: current.filter((id: string) => id !== noteId) },
          },
        }
      })
    },

    /** Sync all reference links for a given note — replaces the full set of refs that this note uses. */
    syncNoteReferenceLinks: (noteId: string, referenceIds: string[]) => {
      set((state: any) => {
        const refs = { ...state.references } as Record<string, Reference>
        const refIdSet = new Set(referenceIds)
        let changed = false

        for (const [id, ref] of Object.entries(refs)) {
          const current = ref.usedInNoteIds ?? []
          const shouldHave = refIdSet.has(id)
          const has = current.includes(noteId)

          if (shouldHave && !has) {
            refs[id] = { ...ref, usedInNoteIds: [...current, noteId] }
            changed = true
          } else if (!shouldHave && has) {
            refs[id] = { ...ref, usedInNoteIds: current.filter((n: string) => n !== noteId) }
            changed = true
          }
        }

        return changed ? { references: refs } : {}
      })
    },
  }
}
