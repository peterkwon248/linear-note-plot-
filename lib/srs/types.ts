/** Fixed-step intervals in days */
export const INTERVALS = [1, 3, 7, 14, 30, 60, 120] as const

export interface SRSState {
  step: number          // index into INTERVALS
  dueAt: string         // ISO timestamp — when next review is due
  lastReviewedAt: string
  introducedAt: string  // when note first entered SRS
  lapses: number        // cumulative "Again" count (diagnostic)
}

/** 0=Again, 1=Hard, 2=Good, 3=Easy */
export type SRSRating = 0 | 1 | 2 | 3
