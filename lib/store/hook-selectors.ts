/**
 * Hook selectors — pure helpers for reading the unified `hooks` slice.
 *
 * Phase 1b2 (unified-temporal-hooks-prd v0.2) read-sites consume hooks
 * through these selectors instead of the legacy per-entity fields
 * (`Note.reviewAt`, `srsStateByNoteId[noteId]`, `WikiArticle.plannedDate`).
 *
 * The selectors operate on plain `Hook[]` arrays so they can be reused
 * inside `useMemo` (React) or inside non-React queries (lib/queries/notes).
 * Phase 2 may introduce a memoised index (`Map<entityKey, Hook[]>`) if hook
 * counts grow; the current Phase 1 cardinality (one hook per
 * (entity, policy)) keeps linear scans cheap.
 */

import type { Hook, EntityKind } from "../types"
import type { SRSState } from "../srs"

/** Lookup the snooze hook for a note, returning its scheduled timestamp. */
export function getReminderForNote(hooks: Hook[], noteId: string): string | null {
  for (const h of hooks) {
    if (
      h.target.kind === "note" &&
      h.target.id === noteId &&
      h.policy === "snooze" &&
      h.trigger.kind === "scheduled"
    ) {
      return h.trigger.at
    }
  }
  return null
}

/** Lookup the SRS hook for a note, returning the wrapped SRSState. */
export function getSRSStateForNote(hooks: Hook[], noteId: string): SRSState | null {
  for (const h of hooks) {
    if (
      h.target.kind === "note" &&
      h.target.id === noteId &&
      h.policy === "srs"
    ) {
      // SRS state is mirrored on both trigger.srsState (v145→v146 migration)
      // and Hook.state.srsState (Phase 1b1 write-side). Prefer trigger as the
      // canonical source — Phase 2 will collapse to a single shape.
      if (h.trigger.kind === "srs") return h.trigger.srsState
      const fromState = (h.state as { srsState?: SRSState } | undefined)?.srsState
      return fromState ?? null
    }
  }
  return null
}

/** Lookup the plan hook for a wiki article, returning its scheduled date. */
export function getPlannedDateForWiki(hooks: Hook[], articleId: string): string | null {
  for (const h of hooks) {
    if (
      h.target.kind === "wiki" &&
      h.target.id === articleId &&
      h.policy === "plan" &&
      h.trigger.kind === "scheduled"
    ) {
      return h.trigger.at
    }
  }
  return null
}

/** Return all snooze hooks (note reminders). */
export function getSnoozeHooks(hooks: Hook[]): Hook[] {
  return hooks.filter((h) => h.policy === "snooze")
}

/** Return all SRS hooks. */
export function getSRSHooks(hooks: Hook[]): Hook[] {
  return hooks.filter((h) => h.policy === "srs")
}

/** Return all plan hooks (wiki article horizons). */
export function getPlanHooks(hooks: Hook[]): Hook[] {
  return hooks.filter((h) => h.policy === "plan")
}

/**
 * Build a `noteId → SRSState` map from the hook list. Backwards-compatible
 * shape for read-sites that historically consumed `srsStateByNoteId`
 * (insights, autopilot nudges, settings counters). Phase 1b3 will replace
 * those sites with native hook iteration; this helper keeps the diff small.
 */
export function buildSRSMapFromHooks(hooks: Hook[]): Record<string, SRSState> {
  const out: Record<string, SRSState> = {}
  for (const h of hooks) {
    if (h.policy !== "srs" || h.target.kind !== "note") continue
    const srs =
      h.trigger.kind === "srs"
        ? h.trigger.srsState
        : (h.state as { srsState?: SRSState } | undefined)?.srsState
    if (srs) out[h.target.id] = srs
  }
  return out
}

/** Return all hooks targeting a given entity (any policy). */
export function getHooksForEntity(
  hooks: Hook[],
  kind: EntityKind,
  id: string,
): Hook[] {
  return hooks.filter((h) => h.target.kind === kind && h.target.id === id)
}
