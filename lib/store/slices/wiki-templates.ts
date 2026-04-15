/**
 * wikiTemplates slice — user-defined wiki templates.
 *
 * Built-in templates (8 presets) live in `lib/wiki-templates/built-in.ts`
 * and are NOT stored here. This slice persists user-customized templates only.
 *
 * Lookup across both:
 *   - `getBuiltInTemplate(id)` for built-ins
 *   - `state.wikiTemplates[id]` for user templates
 *   - `resolveWikiTemplate(state, id)` helper (below) checks both
 */

import type { WikiTemplate } from "../../types"
import { BUILT_IN_TEMPLATES, getBuiltInTemplate, isBuiltInTemplateId } from "../../wiki-templates/built-in"
import { genId, now } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void
type Get = () => any

export function createWikiTemplatesSlice(set: Set, _get: Get) {
  return {
    /**
     * Create a new user template. Built-in IDs are not allowed.
     * Returns the new template's id.
     */
    createWikiTemplate: (partial: Omit<WikiTemplate, "id" | "createdAt" | "updatedAt" | "isBuiltIn">) => {
      const id = `wtmpl-${genId()}`
      const template: WikiTemplate = {
        ...partial,
        id,
        isBuiltIn: false,
        createdAt: now(),
        updatedAt: now(),
      }
      set((state: any) => ({
        wikiTemplates: { ...state.wikiTemplates, [id]: template },
      }))
      return id
    },

    /**
     * Update a user template. Built-in templates are never modified —
     * `updateWikiTemplate` on a built-in id is a no-op (use `duplicateWikiTemplate`
     * to create a customizable copy instead).
     */
    updateWikiTemplate: (id: string, updates: Partial<Omit<WikiTemplate, "id" | "createdAt" | "isBuiltIn">>) => {
      if (isBuiltInTemplateId(id)) return // guard: never mutate built-ins
      set((state: any) => {
        const existing = state.wikiTemplates[id]
        if (!existing) return state
        return {
          wikiTemplates: {
            ...state.wikiTemplates,
            [id]: { ...existing, ...updates, updatedAt: now() },
          },
        }
      })
    },

    /**
     * Delete a user template. Built-in templates cannot be deleted — no-op on built-in id.
     * Any WikiArticle.templateId still pointing to the deleted id is left untouched
     * (the reference becomes "orphan" — UI should resolve to Blank display).
     */
    deleteWikiTemplate: (id: string) => {
      if (isBuiltInTemplateId(id)) return
      set((state: any) => {
        if (!state.wikiTemplates[id]) return state
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [id]: _removed, ...rest } = state.wikiTemplates
        return { wikiTemplates: rest }
      })
    },

    /**
     * Duplicate a template (built-in OR user) into a new user template.
     * The new template always has `isBuiltIn: false` and a fresh id.
     * Returns the new template's id, or null if the source doesn't exist.
     */
    duplicateWikiTemplate: (sourceId: string, newName?: string): string | null => {
      // Resolve source — check built-ins first, then user templates (via get())
      const fromBuiltIn = getBuiltInTemplate(sourceId)
      let source: WikiTemplate | undefined = fromBuiltIn
      if (!source) {
        source = (_get().wikiTemplates as Record<string, WikiTemplate>)[sourceId]
      }
      if (!source) return null

      const id = `wtmpl-${genId()}`
      const copy: WikiTemplate = {
        ...source,
        id,
        name: newName ?? `${source.name} (Copy)`,
        isBuiltIn: false,
        createdAt: now(),
        updatedAt: now(),
      }
      set((state: any) => ({
        wikiTemplates: { ...state.wikiTemplates, [id]: copy },
      }))
      return id
    },
  }
}

/* ── Cross-slice helpers (not part of the slice, but shared state queries) ── */

/**
 * Resolve a template by id across built-ins + user templates.
 * Returns undefined if not found.
 *
 * Usage: `const tmpl = resolveWikiTemplate(usePlotStore.getState(), article.templateId)`
 */
export function resolveWikiTemplate(
  state: { wikiTemplates: Record<string, WikiTemplate> },
  id: string | undefined,
): WikiTemplate | undefined {
  if (!id) return undefined
  return getBuiltInTemplate(id) ?? state.wikiTemplates[id]
}

/**
 * Return all templates (built-ins first, then user templates by createdAt asc).
 * Use for picker galleries, settings, etc.
 */
export function getAllWikiTemplates(
  state: { wikiTemplates: Record<string, WikiTemplate> },
): WikiTemplate[] {
  const userTemplates = Object.values(state.wikiTemplates).sort(
    (a, b) => a.createdAt.localeCompare(b.createdAt),
  )
  return [...BUILT_IN_TEMPLATES, ...userTemplates]
}
