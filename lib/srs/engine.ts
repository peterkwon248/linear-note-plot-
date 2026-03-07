import { INTERVALS, type SRSRating } from "./types"

const MAX_STEP = INTERVALS.length - 1

/**
 * Compute next step and lapse delta from a rating.
 * Pure function — no side effects.
 */
export function computeNextStep(
  rating: SRSRating,
  currentStep: number,
): { step: number; lapseDelta: number } {
  switch (rating) {
    case 0: // Again — reset to step 0
      return { step: 0, lapseDelta: 1 }
    case 1: // Hard — hold at low steps, step back otherwise
      return { step: currentStep <= 1 ? currentStep : currentStep - 1, lapseDelta: 0 }
    case 2: // Good — advance one step
      return { step: Math.min(currentStep + 1, MAX_STEP), lapseDelta: 0 }
    case 3: // Easy — advance two steps
      return { step: Math.min(currentStep + 2, MAX_STEP), lapseDelta: 0 }
  }
}

/** Compute the ISO due date from a step index. */
export function dueAtFromStep(step: number): string {
  const clamped = Math.max(0, Math.min(step, MAX_STEP))
  return new Date(Date.now() + INTERVALS[clamped] * 86_400_000).toISOString()
}
