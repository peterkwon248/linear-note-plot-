import type { Note, Hook } from "../../types"
import { now, type AppendEventFn } from "../helpers"
import { computeNextStep, dueAtFromStep } from "../../srs"
import type { SRSState, SRSRating } from "../../srs"

type Set = (fn: ((state: any) => any) | any) => void
type Get = () => any

/**
 * Phase 1b3 (unified-temporal-hooks-prd v0.2):
 * The unified `hooks` slice is now the sole source of truth for snooze /
 * plan / SRS state. Legacy fields (`Note.reviewAt`, `srsStateByNoteId`,
 * `WikiArticle.plannedDate`) are removed from the type system, and this
 * slice no longer writes them.
 *
 * Loudness convention follows the v145→v146 migration:
 *   - setReminder / triageKeep / enrollSRS → "active"
 *   - triageSnooze → "passive"
 *   - setWikiArticlePlannedDate → "passive" (wiki-articles.ts)
 */

export function createWorkflowSlice(set: Set, get: Get, appendEvent: AppendEventFn) {
  return {
    triageKeep: (id: string) => {
      const reviewAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      set((state: any) => ({
        notes: state.notes.map((n: Note) =>
          n.id === id
            ? { ...n, status: "brick" as const, triageStatus: "kept" as const, lastTouchedAt: now(), updatedAt: now() }
            : n
        ),
      }))
      get().removeHooksByPolicy({ kind: "note", id }, "snooze")
      get().addHook({
        target: { kind: "note", id },
        policy: "snooze",
        trigger: { kind: "scheduled", at: reviewAt },
        action: { loudness: "active" },
      })
      appendEvent(id, "triage_keep")
    },

    triageSnooze: (id: string, reviewAt: string) => {
      set((state: any) => ({
        notes: state.notes.map((n: Note) =>
          n.id === id
            ? { ...n, triageStatus: "snoozed" as const, snoozeCount: (n.snoozeCount ?? 0) + 1, lastTouchedAt: now(), updatedAt: now() }
            : n
        ),
      }))
      get().removeHooksByPolicy({ kind: "note", id }, "snooze")
      get().addHook({
        target: { kind: "note", id },
        policy: "snooze",
        trigger: { kind: "scheduled", at: reviewAt },
        action: { loudness: "passive" },
      })
      appendEvent(id, "triage_snooze", { reviewAt })
    },

    triageTrash: (id: string) => {
      set((state: any) => ({
        notes: state.notes.map((n: Note) =>
          n.id === id
            ? { ...n, triageStatus: "trashed" as const, trashed: true, trashedAt: now(), lastTouchedAt: now(), updatedAt: now() }
            : n
        ),
      }))
      appendEvent(id, "triage_trash")
    },

    promoteToPermanent: (id: string) => {
      set((state: any) => ({
        notes: state.notes.map((n: Note) =>
          n.id === id
            ? { ...n, status: "keystone" as const, promotedAt: now(), lastTouchedAt: now(), updatedAt: now() }
            : n
        ),
      }))
      appendEvent(id, "promoted")
      get().enrollSRS(id)
    },

    undoPromote: (id: string) => {
      set((state: any) => ({
        notes: state.notes.map((n: Note) =>
          n.id === id
            ? { ...n, status: "brick" as const, promotedAt: null, lastTouchedAt: now(), updatedAt: now() }
            : n
        ),
      }))
      get().unenrollSRS(id)
      appendEvent(id, "updated", { action: "undoPromote" })
    },

    moveBackToInbox: (id: string) => {
      set((state: any) => ({
        notes: state.notes.map((n: Note) =>
          n.id === id
            ? { ...n, status: "stone" as const, triageStatus: "untriaged" as const, lastTouchedAt: now(), updatedAt: now() }
            : n
        ),
      }))
      appendEvent(id, "updated", { action: "moveBackToInbox" })
    },

    setReminder: (id: string, reviewAt: string) => {
      // Phase 1b3: reminder is purely a hook write — no entity mutation.
      // Mirrors `setWikiArticlePlannedDate`: planning intent ≠ content
      // activity (영구 룰 #89), so the note's `updatedAt` is untouched.
      get().removeHooksByPolicy({ kind: "note", id }, "snooze")
      get().addHook({
        target: { kind: "note", id },
        policy: "snooze",
        trigger: { kind: "scheduled", at: reviewAt },
        action: { loudness: "active" },
      })
      appendEvent(id, "updated", { action: "setReminder", reviewAt })
    },

    clearReminder: (id: string) => {
      get().removeHooksByPolicy({ kind: "note", id }, "snooze")
      appendEvent(id, "updated", { action: "clearReminder" })
    },

    batchSetReminder: (ids: string[], reviewAt: string) => {
      for (const id of ids) {
        get().removeHooksByPolicy({ kind: "note", id }, "snooze")
        get().addHook({
          target: { kind: "note", id },
          policy: "snooze",
          trigger: { kind: "scheduled", at: reviewAt },
          action: { loudness: "active" },
        })
        appendEvent(id, "updated", { action: "setReminder", reviewAt })
      }
    },

    /* ── SRS Actions (Phase 1b3 — Hook-only) ────────────────────────────
     * SRS state lives inside the matching `srs` hook (mirror on both
     * `trigger.srsState` and `state.srsState` for query convenience). The
     * underlying engine in `lib/srs` is unchanged — these helpers wrap the
     * lifecycle on top of the unified hook store. */

    reviewSRS: (noteId: string, rating: SRSRating) => {
      const hooks = get().hooks as Hook[]
      const target = hooks.find(
        (h) => h.target.kind === "note" && h.target.id === noteId && h.policy === "srs",
      )
      const prev: SRSState | null =
        target?.trigger.kind === "srs"
          ? target.trigger.srsState
          : (target?.state as { srsState?: SRSState } | undefined)?.srsState ?? null
      if (!prev || !target) return
      const result = computeNextStep(rating, prev.step)
      const nextState: SRSState = {
        ...prev,
        step: result.step,
        dueAt: dueAtFromStep(result.step),
        lastReviewedAt: now(),
        lapses: prev.lapses + result.lapseDelta,
        introducedAt: prev.introducedAt,
      }
      set((state: any) => ({
        hooks: (state.hooks ?? []).map((h: Hook) =>
          h.id === target.id
            ? {
                ...h,
                trigger: { kind: "srs" as const, srsState: nextState },
                state: { ...(h.state ?? {}), srsState: nextState },
              }
            : h,
        ),
      }))
      appendEvent(noteId, "srs_reviewed", { rating, step: result.step })
    },

    enrollSRS: (noteId: string) => {
      const existing = (get().hooks as Hook[]).some(
        (h) => h.target.kind === "note" && h.target.id === noteId && h.policy === "srs",
      )
      if (existing) return
      const initial: SRSState = {
        step: 0,
        dueAt: dueAtFromStep(0),
        lastReviewedAt: now(),
        introducedAt: now(),
        lapses: 0,
      }
      get().addHook({
        target: { kind: "note", id: noteId },
        policy: "srs",
        trigger: { kind: "srs", srsState: initial },
        action: { loudness: "active" },
        state: { srsState: initial },
      })
    },

    unenrollSRS: (noteId: string) => {
      get().removeHooksByPolicy({ kind: "note", id: noteId }, "srs")
    },

    enrollAllPermanentSRS: () => {
      const state = get()
      const enrolled = new Set(
        (state.hooks as Hook[])
          .filter((h) => h.target.kind === "note" && h.policy === "srs")
          .map((h) => h.target.id),
      )
      const toEnroll = state.notes.filter(
        (n: Note) => n.status === "keystone" && !n.trashed && !enrolled.has(n.id)
      )
      if (toEnroll.length === 0) return 0
      const timestamp = now()
      for (const n of toEnroll) {
        const initial: SRSState = {
          step: 0,
          dueAt: dueAtFromStep(0),
          lastReviewedAt: timestamp,
          introducedAt: timestamp,
          lapses: 0,
        }
        get().addHook({
          target: { kind: "note", id: n.id },
          policy: "srs",
          trigger: { kind: "srs", srsState: initial },
          action: { loudness: "active" },
          state: { srsState: initial },
        })
      }
      return toEnroll.length
    },
  }
}
