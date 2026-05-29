import type { AutoSource, SmartBookPreset } from "../../types"
import { genId, now } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void
type Get = () => any

/**
 * SmartBookPresets slice — reusable AutoSource blueprints ("Smart Book" =
 * the Books-space analog of NoteTemplate / WikiTemplate).
 *
 * A preset is a saved set of smart sources. "Applying" a preset spawns a
 * brand-new Smart Book seeded with `[...preset.sources]` — see
 * `applySmartBookPreset`. The engine itself (resolver / sources-section /
 * createBook / updateBook) is reused verbatim; this slice only manages the
 * blueprint pool + the apply handoff.
 *
 * CRUD mirrors the Templates slice (create / update / soft-delete / restore +
 * pin toggle). Soft delete sets `trashed=true` + `trashedAt` so presets are
 * recoverable, matching NoteTemplate semantics.
 *
 * Spec: `docs/01-plan/features/smart-book-preset.plan.md` §3.
 */
export interface SmartBookPresetsSlice {
  smartBookPresets: SmartBookPreset[]

  /** Create a preset. `partial` may omit id / pinned / timestamps (defaulted). */
  createSmartBookPreset: (
    partial: Partial<Omit<SmartBookPreset, "id" | "createdAt" | "updatedAt">> & { name: string },
  ) => string
  updateSmartBookPreset: (id: string, patch: Partial<SmartBookPreset>) => void
  /** Soft delete — sets `trashed=true`, `trashedAt=now`. */
  deleteSmartBookPreset: (id: string) => void
  /** Restore a soft-deleted preset. */
  restoreSmartBookPreset: (id: string) => void
  /** Toggle the pinned flag (sidebar / gallery surfacing). */
  toggleSmartBookPresetPin: (id: string) => void

  /**
   * Apply a preset → create a new Smart Book seeded with the preset's
   * sources. Reuses the existing books engine: `createBook` for the shell,
   * `updateBook` to attach `smartSources` (so the resolver auto-fills it).
   * Returns the new book id (caller navigates to `/books/{id}`). Returns ""
   * when the preset id is unknown.
   */
  applySmartBookPreset: (presetId: string) => string
}

export function createSmartBookPresetsSlice(
  set: Set,
  get: Get,
): Omit<SmartBookPresetsSlice, "smartBookPresets"> {
  // The `smartBookPresets` array is seeded in index.ts initial state (mirrors
  // how `books: SEED_BOOKS` is set there, not in createBooksSlice). The slice
  // factory returns actions only so it never clobbers the seed.
  return {
    createSmartBookPreset: (partial) => {
      const id = `sbp-${genId()}`
      const ts = now()
      const preset: SmartBookPreset = {
        id,
        name: partial.name,
        description: partial.description,
        sources: partial.sources ? [...partial.sources] : [],
        pinned: partial.pinned ?? false,
        trashed: false,
        trashedAt: null,
        createdAt: ts,
        updatedAt: ts,
      }
      set((state: any) => ({
        smartBookPresets: [...((state.smartBookPresets ?? []) as SmartBookPreset[]), preset],
      }))
      return id
    },

    updateSmartBookPreset: (id, patch) => {
      set((state: any) => ({
        smartBookPresets: ((state.smartBookPresets ?? []) as SmartBookPreset[]).map((p) =>
          p.id === id
            ? {
                ...p,
                ...patch,
                // id / createdAt immutable; always bump updatedAt.
                id: p.id,
                createdAt: p.createdAt,
                updatedAt: now(),
              }
            : p,
        ),
      }))
    },

    deleteSmartBookPreset: (id) => {
      set((state: any) => ({
        smartBookPresets: ((state.smartBookPresets ?? []) as SmartBookPreset[]).map((p) =>
          p.id === id ? { ...p, trashed: true, trashedAt: now() } : p,
        ),
      }))
    },

    restoreSmartBookPreset: (id) => {
      set((state: any) => ({
        smartBookPresets: ((state.smartBookPresets ?? []) as SmartBookPreset[]).map((p) =>
          p.id === id ? { ...p, trashed: false, trashedAt: null } : p,
        ),
      }))
    },

    toggleSmartBookPresetPin: (id) => {
      set((state: any) => ({
        smartBookPresets: ((state.smartBookPresets ?? []) as SmartBookPreset[]).map((p) =>
          p.id === id ? { ...p, pinned: !p.pinned, updatedAt: now() } : p,
        ),
      }))
    },

    applySmartBookPreset: (presetId) => {
      const state = get()
      const preset = ((state.smartBookPresets ?? []) as SmartBookPreset[]).find(
        (p) => p.id === presetId,
      )
      if (!preset) return ""
      // Reuse the books engine verbatim: create the shell, then attach the
      // blueprint's sources so resolveBookItems auto-fills the new book.
      const id: string = state.createBook(preset.name)
      const sources: AutoSource[] = preset.sources.map((s) => ({ ...s }))
      state.updateBook(id, { smartSources: sources })
      return id
    },
  }
}
