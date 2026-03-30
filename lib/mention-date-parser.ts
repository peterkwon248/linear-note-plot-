/**
 * Simple date parsing for @mention date suggestions.
 * Supports Korean shortcuts (오늘, 내일, 어제, 모레),
 * English shortcuts (today, tomorrow, yesterday),
 * M/D format (3/30), and Korean format (3월 30일).
 */

export interface ParsedDate {
  iso: string // "2026-03-30"
  display: string // "3월 30일 (월)"
}

export function parseMentionDate(query: string): ParsedDate | null {
  const q = query.trim().toLowerCase()
  if (!q) return null

  const today = new Date()

  // Korean shortcuts
  if (q === "오늘" || q === "today") return formatDate(today)
  if (q === "내일" || q === "tomorrow") {
    const d = new Date(today)
    d.setDate(d.getDate() + 1)
    return formatDate(d)
  }
  if (q === "어제" || q === "yesterday") {
    const d = new Date(today)
    d.setDate(d.getDate() - 1)
    return formatDate(d)
  }
  if (q === "모레") {
    const d = new Date(today)
    d.setDate(d.getDate() + 2)
    return formatDate(d)
  }

  // M/D format: "3/30", "03/30"
  const slashMatch = q.match(/^(\d{1,2})\/(\d{1,2})$/)
  if (slashMatch) {
    const month = parseInt(slashMatch[1]) - 1
    const day = parseInt(slashMatch[2])
    const d = new Date(today.getFullYear(), month, day)
    if (!isNaN(d.getTime())) return formatDate(d)
  }

  // Korean format: "3월 30일", "3월30일"
  const koreanMatch = q.match(/^(\d{1,2})월\s*(\d{1,2})일?$/)
  if (koreanMatch) {
    const month = parseInt(koreanMatch[1]) - 1
    const day = parseInt(koreanMatch[2])
    const d = new Date(today.getFullYear(), month, day)
    if (!isNaN(d.getTime())) return formatDate(d)
  }

  return null
}

function formatDate(d: Date): ParsedDate {
  const days = ["일", "월", "화", "수", "목", "금", "토"]
  const iso = d.toISOString().split("T")[0]
  const display = `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`
  return { iso, display }
}
