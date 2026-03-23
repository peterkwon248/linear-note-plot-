import type { Note } from "@/lib/types"
import type { SRSState } from "@/lib/srs"
import type { RuleContext, AnalysisResult, AnalysisRule } from "./types"
import { PRESET_RULES } from "./rules"

/**
 * Run all analysis rules against current state.
 * Pure function — computed, not stored.
 * Follows the same pattern as computeAlerts() in lib/alerts.ts.
 */
export function runAnalysis(
  notes: Note[],
  srsMap: Record<string, SRSState>,
  backlinks: Map<string, number>,
  rules?: AnalysisRule[],
): AnalysisResult[] {
  const now = Date.now()

  const activeNotes = notes.filter(
    (n) => !n.trashed && n.triageStatus !== "trashed",
  )

  const ctx: RuleContext = {
    notes: activeNotes,
    allNotes: notes,
    srsMap,
    backlinks,
    now,
  }

  const ruleset = rules ?? PRESET_RULES

  return ruleset
    .map((rule) => {
      const noteIds = rule.match(ctx)
      return {
        ruleId: rule.id,
        label: rule.label,
        description: rule.description,
        severity: rule.severity,
        noteIds,
        count: noteIds.length,
      }
    })
    .filter((r) => r.count > 0)
}
