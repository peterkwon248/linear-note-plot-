import type { Note, AutopilotRule } from "@/lib/types"
import type { AutopilotContext, AutopilotEvalResult, AutopilotRunResult } from "./types"
import { matchesAllConditions } from "./conditions"

/**
 * Evaluate a single rule against a note.
 * Pure function — no side effects.
 */
export function evaluateRule(ctx: AutopilotContext, rule: AutopilotRule): AutopilotEvalResult {
  const matched = rule.enabled && matchesAllConditions(ctx, rule.conditions)
  return {
    ruleId: rule.id,
    ruleName: rule.name,
    matched,
    actions: matched ? rule.actions : [],
  }
}

/**
 * Run all applicable rules for a given trigger against a note.
 * Returns only matched rules (with actions to execute).
 * Rules are evaluated in order; first-match-wins for conflicting actions.
 */
export function runAutopilot(
  note: Note,
  rules: AutopilotRule[],
  trigger: "on_save" | "on_open" | "on_interval",
  backlinksCount: number = 0
): AutopilotRunResult {
  const ctx: AutopilotContext = {
    note,
    now: Date.now(),
    backlinksCount,
  }

  // Filter rules by trigger type and enabled
  const applicableRules = rules.filter((r) => r.enabled && r.trigger === trigger)

  const applied: AutopilotEvalResult[] = []
  const usedActionTypes = new Set<string>()

  for (const rule of applicableRules) {
    const result = evaluateRule(ctx, rule)
    if (result.matched) {
      // Filter out conflicting actions (first-match-wins)
      const novelActions = result.actions.filter((a) => !usedActionTypes.has(a.type))
      if (novelActions.length > 0) {
        for (const a of novelActions) usedActionTypes.add(a.type)
        applied.push({ ...result, actions: novelActions })
      }
    }
  }

  return {
    noteId: note.id,
    noteTitle: note.title,
    applied,
  }
}
