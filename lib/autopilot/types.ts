import type { Note, AutopilotRule, AutopilotAction, AutopilotCondition } from "@/lib/types"

/** Context for evaluating conditions against a note */
export interface AutopilotContext {
  note: Note
  now: number
  backlinksCount: number
}

/** Result of evaluating a single rule against a note */
export interface AutopilotEvalResult {
  ruleId: string
  ruleName: string
  matched: boolean
  actions: AutopilotAction[]
}

/** Result of running all rules on a note */
export interface AutopilotRunResult {
  noteId: string
  noteTitle: string
  applied: AutopilotEvalResult[]  // only matched rules
}
