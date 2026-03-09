import type { Note } from "@/lib/types"
import type { SRSState } from "@/lib/srs"

export type AnalysisSeverity = "info" | "warning" | "critical"

/** All data a rule might need — built once, shared across rules */
export interface RuleContext {
  notes: Note[] // active notes (non-trashed, non-archived)
  allNotes: Note[] // truly all notes
  srsMap: Record<string, SRSState>
  backlinks: Map<string, number> // noteId → inbound link count
  now: number // Date.now() snapshot for determinism
}

/** A single analysis rule definition */
export interface AnalysisRule {
  id: string // unique slug, e.g. "orphan-notes"
  label: string // display name
  description: string // one-line explanation
  severity: AnalysisSeverity
  match: (ctx: RuleContext) => string[] // returns matching note IDs
}

/** Output of running one rule */
export interface AnalysisResult {
  ruleId: string
  label: string
  description: string
  severity: AnalysisSeverity
  noteIds: string[]
  count: number
}
