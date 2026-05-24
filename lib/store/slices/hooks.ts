/**
 * Hooks slice — unified-temporal-hooks-prd v0.2 §9-1.
 *
 * Single source of truth for all temporal hooks (snooze / plan / srs /
 * staleness in Phase 1). EntityRef-keyed store — per-entity fields
 * (`reviewAt`, `plannedDate`, `srsStateByNoteId`) are absorbed by v145→v146
 * migration and stay deprecated through Phase 1, removed in Phase 1b.
 *
 * Slice is intentionally thin: callers (workflow.ts, inbox, timeline) drive
 * the lifecycle. The slice owns identity (genId), persistence (set), and
 * cheap selectors only.
 */

import type { Hook, EntityRef, HookPolicy } from "../../types"
import { genId, now, type AppendEventFn } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void
type Get = () => any

export function createHooksSlice(set: Set, _get: Get, _appendEvent: AppendEventFn) {
  return {
    /** Create a new hook. Returns the hook id. */
    addHook: (partial: Omit<Hook, "id" | "createdAt">): string => {
      const id = genId()
      const hook: Hook = { ...partial, id, createdAt: now() }
      set((state: any) => ({ hooks: [...(state.hooks ?? []), hook] }))
      return id
    },

    /** Remove a hook by id. */
    removeHook: (hookId: string) => {
      set((state: any) => ({
        hooks: (state.hooks ?? []).filter((h: Hook) => h.id !== hookId),
      }))
    },

    /** Partial-merge update for a single hook. */
    updateHook: (hookId: string, patch: Partial<Omit<Hook, "id" | "createdAt">>) => {
      set((state: any) => ({
        hooks: (state.hooks ?? []).map((h: Hook) =>
          h.id === hookId ? { ...h, ...patch } : h,
        ),
      }))
    },

    /** Remove every hook whose target points at this entity. Used when an
     *  entity is hard-deleted so dangling hooks don't accumulate. */
    removeHooksForEntity: (target: EntityRef) => {
      set((state: any) => ({
        hooks: (state.hooks ?? []).filter(
          (h: Hook) => !(h.target.kind === target.kind && h.target.id === target.id),
        ),
      }))
    },

    /** Remove the (target, policy) hook if it exists. Convenience for
     *  "unenroll from SRS" / "clear reminder" style ops where only one
     *  hook of that policy is expected per target. */
    removeHooksByPolicy: (target: EntityRef, policy: HookPolicy) => {
      set((state: any) => ({
        hooks: (state.hooks ?? []).filter(
          (h: Hook) =>
            !(
              h.target.kind === target.kind &&
              h.target.id === target.id &&
              h.policy === policy
            ),
        ),
      }))
    },
  }
}
