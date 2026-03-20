/**
 * Korean initial consonant utilities for wiki alphabet index navigation.
 */

// Korean initial consonant display groups (14)
const INITIAL_CONSONANTS = [
  "ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
] as const

// Map from 19 Jamo indexes to 14 display groups
// 0=ㄱ, 1=ㄲ→ㄱ, 2=ㄴ, 3=ㄷ, 4=ㄸ→ㄷ, 5=ㄹ, 6=ㅁ, 7=ㅂ, 8=ㅃ→ㅂ,
// 9=ㅅ, 10=ㅆ→ㅅ, 11=ㅇ, 12=ㅈ, 13=ㅉ→ㅈ, 14=ㅊ, 15=ㅋ, 16=ㅌ, 17=ㅍ, 18=ㅎ
const JAMO_TO_GROUP: number[] = [0, 0, 1, 2, 2, 3, 4, 5, 5, 6, 6, 7, 8, 8, 9, 10, 11, 12, 13]

const HANGUL_START = 0xac00 // '가'
const HANGUL_END = 0xd7a3   // '힣'
const INITIAL_COUNT = 588    // 21 * 28

export type InitialGroup = (typeof INITIAL_CONSONANTS)[number] | string

/**
 * Get the initial consonant / letter group for a given string.
 * - Korean: extracts the initial consonant (ㄱ~ㅎ, doubled consonants merge)
 * - English: uppercased first letter (A~Z)
 * - Other: "#"
 */
export function getInitialGroup(text: string): InitialGroup {
  const trimmed = text.trim()
  if (!trimmed) return "#"

  const first = trimmed.charCodeAt(0)

  // Korean syllable block (가~힣)
  if (first >= HANGUL_START && first <= HANGUL_END) {
    const jamoIndex = Math.floor((first - HANGUL_START) / INITIAL_COUNT)
    const groupIndex = JAMO_TO_GROUP[jamoIndex]
    return INITIAL_CONSONANTS[groupIndex] ?? "#"
  }

  // English letter
  const char = trimmed[0].toUpperCase()
  if (char >= "A" && char <= "Z") return char

  return "#"
}

/** All possible index groups in display order: ㄱ~ㅎ, A~Z, # */
export const INDEX_GROUPS: readonly string[] = [
  ...INITIAL_CONSONANTS,
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
  "#",
]

/**
 * Group items by their initial consonant/letter.
 * Returns a Map preserving INDEX_GROUPS order, only including non-empty groups.
 */
export function groupByInitial<T>(
  items: T[],
  getText: (item: T) => string
): Map<string, T[]> {
  const groups = new Map<string, T[]>()

  for (const item of items) {
    const group = getInitialGroup(getText(item))
    const arr = groups.get(group)
    if (arr) arr.push(item)
    else groups.set(group, [item])
  }

  // Sort within each group alphabetically (Korean-aware)
  for (const [, arr] of groups) {
    arr.sort((a, b) => getText(a).localeCompare(getText(b), "ko"))
  }

  // Reorder keys by INDEX_GROUPS order
  const ordered = new Map<string, T[]>()
  for (const key of INDEX_GROUPS) {
    const arr = groups.get(key)
    if (arr) ordered.set(key, arr)
  }
  return ordered
}
