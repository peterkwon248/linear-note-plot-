/**
 * AI Optional Layer — disabled by default.
 * All functions return null/no-op when AI_ENABLED is false.
 * Phase 3 will implement actual AI features behind this interface.
 */

export const AI_ENABLED = false

/** Future: distill a note into a concise summary */
export async function distillNote(_noteContent: string): Promise<string | null> {
  if (!AI_ENABLED) return null
  // TODO: Connect to AI provider for note distillation
  return null
}

/** Future: suggest topics/tags for a note */
export async function suggestTopics(_noteContent: string): Promise<string[] | null> {
  if (!AI_ENABLED) return null
  // TODO: Connect to AI provider for topic suggestions
  return null
}

/** Future: generate a summary for a note */
export async function generateSummary(_noteContent: string): Promise<string | null> {
  if (!AI_ENABLED) return null
  // TODO: Connect to AI provider for summary generation
  return null
}

/** Future: suggest related notes using embeddings */
export async function suggestRelatedNotes(
  _noteId: string,
  _allNotes: Array<{ id: string; content: string }>
): Promise<string[] | null> {
  if (!AI_ENABLED) return null
  // TODO: Connect to AI provider for semantic similarity
  return null
}

/** Future: auto-generate thinking chain steps */
export async function generateThinkingStep(
  _noteContent: string,
  _previousSteps: string[]
): Promise<string | null> {
  if (!AI_ENABLED) return null
  // TODO: Connect to AI provider for thinking chain generation
  return null
}
