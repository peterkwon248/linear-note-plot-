import { describe, it, expect, beforeEach } from 'vitest'
import { computeNextStep, dueAtFromStep } from '../engine'

const INTERVALS = [1, 3, 7, 14, 30, 60, 120] as const
const MAX_STEP = INTERVALS.length - 1

describe('computeNextStep', () => {
  describe('Again (rating=0)', () => {
    it('resets to step 0 from step 0 with lapseDelta=1', () => {
      const result = computeNextStep(0, 0)
      expect(result.step).toBe(0)
      expect(result.lapseDelta).toBe(1)
    })

    it('resets to step 0 from step 3 with lapseDelta=1', () => {
      const result = computeNextStep(0, 3)
      expect(result.step).toBe(0)
      expect(result.lapseDelta).toBe(1)
    })

    it('resets to step 0 from MAX_STEP with lapseDelta=1', () => {
      const result = computeNextStep(0, MAX_STEP)
      expect(result.step).toBe(0)
      expect(result.lapseDelta).toBe(1)
    })
  })

  describe('Hard (rating=1)', () => {
    it('keeps step 0 at step 0', () => {
      const result = computeNextStep(1, 0)
      expect(result.step).toBe(0)
      expect(result.lapseDelta).toBe(0)
    })

    it('keeps step 1 at step 1', () => {
      const result = computeNextStep(1, 1)
      expect(result.step).toBe(1)
      expect(result.lapseDelta).toBe(0)
    })

    it('steps back from step 3 to step 2', () => {
      const result = computeNextStep(1, 3)
      expect(result.step).toBe(2)
      expect(result.lapseDelta).toBe(0)
    })

    it('steps back from step 5 to step 4', () => {
      const result = computeNextStep(1, 5)
      expect(result.step).toBe(4)
      expect(result.lapseDelta).toBe(0)
    })

    it('steps back from MAX_STEP to MAX_STEP - 1', () => {
      const result = computeNextStep(1, MAX_STEP)
      expect(result.step).toBe(MAX_STEP - 1)
      expect(result.lapseDelta).toBe(0)
    })
  })

  describe('Good (rating=2)', () => {
    it('advances from step 0 to step 1', () => {
      const result = computeNextStep(2, 0)
      expect(result.step).toBe(1)
      expect(result.lapseDelta).toBe(0)
    })

    it('advances from step 2 to step 3', () => {
      const result = computeNextStep(2, 2)
      expect(result.step).toBe(3)
      expect(result.lapseDelta).toBe(0)
    })

    it('advances from step 5 to MAX_STEP', () => {
      const result = computeNextStep(2, 5)
      expect(result.step).toBe(MAX_STEP)
      expect(result.lapseDelta).toBe(0)
    })

    it('caps at MAX_STEP when at MAX_STEP', () => {
      const result = computeNextStep(2, MAX_STEP)
      expect(result.step).toBe(MAX_STEP)
      expect(result.lapseDelta).toBe(0)
    })
  })

  describe('Easy (rating=3)', () => {
    it('advances two steps from step 0 to step 2', () => {
      const result = computeNextStep(3, 0)
      expect(result.step).toBe(2)
      expect(result.lapseDelta).toBe(0)
    })

    it('advances two steps from step 2 to step 4', () => {
      const result = computeNextStep(3, 2)
      expect(result.step).toBe(4)
      expect(result.lapseDelta).toBe(0)
    })

    it('caps at MAX_STEP when advancing would exceed', () => {
      const result = computeNextStep(3, 5)
      expect(result.step).toBe(MAX_STEP)
      expect(result.lapseDelta).toBe(0)
    })

    it('caps at MAX_STEP when already at MAX_STEP', () => {
      const result = computeNextStep(3, MAX_STEP)
      expect(result.step).toBe(MAX_STEP)
      expect(result.lapseDelta).toBe(0)
    })
  })
})

describe('dueAtFromStep', () => {
  let baseTime: number

  beforeEach(() => {
    baseTime = Date.now()
  })

  it('step 0 returns date ~1 day from now', () => {
    const result = dueAtFromStep(0)
    const resultTime = new Date(result).getTime()
    const expectedTime = baseTime + INTERVALS[0] * 86_400_000

    // Allow 1-second tolerance due to execution time
    expect(Math.abs(resultTime - expectedTime)).toBeLessThan(1000)
  })

  it('step 6 (MAX_STEP) returns date ~120 days from now', () => {
    const result = dueAtFromStep(MAX_STEP)
    const resultTime = new Date(result).getTime()
    const expectedTime = baseTime + INTERVALS[MAX_STEP] * 86_400_000

    expect(Math.abs(resultTime - expectedTime)).toBeLessThan(1000)
  })

  it('step 3 returns date ~14 days from now', () => {
    const result = dueAtFromStep(3)
    const resultTime = new Date(result).getTime()
    const expectedTime = baseTime + INTERVALS[3] * 86_400_000

    expect(Math.abs(resultTime - expectedTime)).toBeLessThan(1000)
  })

  it('negative step clamps to 0 and returns ~1 day', () => {
    const result = dueAtFromStep(-5)
    const resultTime = new Date(result).getTime()
    const expectedTime = baseTime + INTERVALS[0] * 86_400_000

    expect(Math.abs(resultTime - expectedTime)).toBeLessThan(1000)
  })

  it('step beyond MAX_STEP clamps to MAX_STEP and returns ~120 days', () => {
    const result = dueAtFromStep(10)
    const resultTime = new Date(result).getTime()
    const expectedTime = baseTime + INTERVALS[MAX_STEP] * 86_400_000

    expect(Math.abs(resultTime - expectedTime)).toBeLessThan(1000)
  })

  it('returns a valid ISO string', () => {
    const result = dueAtFromStep(0)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    expect(new Date(result).toString()).not.toBe('Invalid Date')
  })

  it('step 1 returns date ~3 days from now', () => {
    const result = dueAtFromStep(1)
    const resultTime = new Date(result).getTime()
    const expectedTime = baseTime + INTERVALS[1] * 86_400_000

    expect(Math.abs(resultTime - expectedTime)).toBeLessThan(1000)
  })

  it('step 2 returns date ~7 days from now', () => {
    const result = dueAtFromStep(2)
    const resultTime = new Date(result).getTime()
    const expectedTime = baseTime + INTERVALS[2] * 86_400_000

    expect(Math.abs(resultTime - expectedTime)).toBeLessThan(1000)
  })
})
