/**
 * Wiki Infobox Presets slice (PR-D, Phase 4) — user-defined infobox presets.
 *
 * Sits alongside the hardcoded builtin presets in `lib/wiki-infobox-presets.ts`.
 * Users save customized infobox layouts via "Save as preset…" from the
 * infobox edit footer; saved presets appear in the dropdown's "My Presets"
 * section and can be applied to Wiki Articles + Notes (cross-entity, per
 * PR #362 PR-B 후속).
 *
 * Persistence: cross-session via Zustand persist. onRehydrateStorage defense
 * (in store/index.ts) forces `Array.isArray` guarantee — protects against
 * IDB serialization round-trips that occasionally collapse arrays to objects
 * (observed in PR #358 WikiTemplate hydration).
 */

import type { UserInfoboxPreset, WikiInfoboxEntry } from "../../types"
import { genId, now } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void
type Get = () => any

export interface WikiInfoboxPresetInput {
  label: string
  hint?: string
  defaultHeaderColor: string | null
  defaultEntries: WikiInfoboxEntry[]
}

export function createWikiInfoboxPresetsSlice(set: Set, _get: Get) {
  return {
    /**
     * Save a user-defined preset. Returns the new id ("user-{nanoid}") so
     * the caller can optionally apply it immediately to the current article.
     * Entries are deep-cloned so subsequent edits to the article's infobox
     * don't mutate the preset's saved seed.
     */
    saveUserInfoboxPreset: (input: WikiInfoboxPresetInput): string => {
      const id = `user-${genId()}`
      const preset: UserInfoboxPreset = {
        id,
        label: input.label,
        hint: input.hint,
        defaultHeaderColor: input.defaultHeaderColor,
        defaultEntries: input.defaultEntries.map((e) => ({ ...e })),
        createdAt: now(),
        updatedAt: now(),
      }
      set((state: any) => ({
        userInfoboxPresets: [...(state.userInfoboxPresets ?? []), preset],
      }))
      return id
    },

    /**
     * Partial update — label / hint / color / entries 임의 patch.
     * id + createdAt은 보존, updatedAt은 자동 갱신.
     */
    updateUserInfoboxPreset: (
      id: string,
      patch: Partial<Omit<UserInfoboxPreset, "id" | "createdAt">>,
    ) => {
      set((state: any) => ({
        userInfoboxPresets: (state.userInfoboxPresets ?? []).map(
          (p: UserInfoboxPreset) =>
            p.id === id ? { ...p, ...patch, updatedAt: now() } : p,
        ),
      }))
    },

    /**
     * Hard delete — preset 자체를 store에서 제거.
     *
     * 사용처 article들의 `infoboxPreset` 필드는 그대로 유지 (orphan reference).
     * getPresetDefinitionUnified가 lookup 실패 시 "custom" fallback 반환하므로
     * UI 깨짐 없음. entries는 article 자체에 저장되어 있어 영향 0.
     */
    deleteUserInfoboxPreset: (id: string) => {
      set((state: any) => ({
        userInfoboxPresets: (state.userInfoboxPresets ?? []).filter(
          (p: UserInfoboxPreset) => p.id !== id,
        ),
      }))
    },
  }
}
