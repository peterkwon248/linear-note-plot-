/**
 * Discover Engine — local recommendation engine for related content.
 *
 * Scores notes by title/keyword overlap, tag co-occurrence,
 * backlink proximity, and folder proximity. No AI/API required.
 */

// ── Stopwords (Korean + English) ─────────────────────────

const STOPWORDS = new Set([
  // Korean particles / connectors
  "의", "가", "이", "은", "는", "를", "을", "에", "에서", "으로", "로", "와", "과",
  "도", "만", "에게", "부터", "까지", "처럼", "보다", "같이", "대해", "통해",
  "위해", "대한", "그", "저", "것",
  // English
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could", "should",
  "may", "might", "can", "shall", "and", "or", "but", "if", "then", "else",
  "when", "where", "how", "what", "which", "who", "whom", "this", "that",
  "these", "those", "not", "no", "nor", "so", "too", "very", "just",
  "in", "on", "at", "to", "for", "of", "with", "by", "from", "as",
  "into", "through", "during", "before", "after", "above", "below",
  "between", "out", "off", "over", "under", "again", "further",
  "it", "its", "he", "she", "they", "them", "we", "you", "i", "me", "my",
])

// ── Tokenizer ────────────────────────────────────────────

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w))
}

// ── Types ────────────────────────────────────────────────

export interface DiscoverResult {
  relatedNotes: Array<{ noteId: string; score: number; reasons: string[] }>
  relatedWiki: Array<{ noteId: string; score: number; reasons: string[] }>
  suggestedTags: Array<{ tagId: string; tagName: string; score: number }>
}

export interface DiscoverNoteInput {
  id: string
  title: string
  tags: string[]
  linksOut: string[]
  folderId?: string | null
  isWiki?: boolean
  preview?: string
}

export interface DiscoverParams {
  noteId: string
  noteTitle: string
  noteBody: string
  noteTags: string[]
  noteLinksOut: string[]
  noteFolderId: string | null
  allNotes: DiscoverNoteInput[]
  backlinksMap: Record<string, string[]>
  allTags: Array<{ id: string; name: string }>
}

// ── Scoring ──────────────────────────────────────────────

const W_KEYWORD = 3
const W_TAG = 5
const W_BACKLINK = 4
const W_FOLDER = 1

export function discoverRelated(params: DiscoverParams): DiscoverResult {
  const {
    noteId,
    noteTitle,
    noteBody,
    noteTags,
    noteLinksOut,
    noteFolderId,
    allNotes,
    backlinksMap,
    allTags,
  } = params

  // Tokenize current note
  const sourceText = noteTitle + " " + noteBody
  const sourceTokens = new Set(tokenize(sourceText))
  const sourceLinksSet = new Set(noteLinksOut)
  const sourceTagsSet = new Set(noteTags)

  // Pre-compute: which notes does the current note link TO?
  // backlinksMap[X] = [notes that link to X]
  // We need: shared backlink targets = both notes link to the same third note
  // For that we need the current note's outgoing link targets as IDs.
  // noteLinksOut contains lowercase titles, not IDs. We'll use them directly.

  const scored: Array<{ noteId: string; score: number; reasons: string[]; isWiki: boolean }> = []

  for (const other of allNotes) {
    if (other.id === noteId) continue

    let score = 0
    const reasons: string[] = []

    // 1. Title/keyword overlap (weight: W_KEYWORD)
    if (sourceTokens.size > 0) {
      const otherText = other.title + " " + (other.preview ?? "")
      const otherTokens = new Set(tokenize(otherText))
      let matchCount = 0
      for (const token of sourceTokens) {
        if (otherTokens.has(token)) matchCount++
      }
      if (matchCount > 0) {
        const keywordScore = (matchCount / sourceTokens.size) * W_KEYWORD
        score += keywordScore
        reasons.push(`${matchCount} keyword${matchCount > 1 ? "s" : ""}`)
      }
    }

    // 2. Tag co-occurrence (weight: W_TAG)
    if (sourceTagsSet.size > 0) {
      let sharedCount = 0
      for (const t of other.tags) {
        if (sourceTagsSet.has(t)) sharedCount++
      }
      if (sharedCount >= 1) {
        const tagScore = (sharedCount / Math.max(sourceTagsSet.size, 1)) * W_TAG
        score += tagScore
        reasons.push(`${sharedCount} shared tag${sharedCount > 1 ? "s" : ""}`)
      }
    }

    // 3. Backlink proximity (weight: W_BACKLINK)
    // Direct link bonus: current note links to other or other links to current
    const otherLinksSet = new Set(other.linksOut)
    const otherTitleLower = other.title.toLowerCase()
    const currentTitleLower = noteTitle.toLowerCase()

    let backlinkScore = 0
    if (sourceLinksSet.has(otherTitleLower) || otherLinksSet.has(currentTitleLower)) {
      backlinkScore += W_BACKLINK
      reasons.push("direct link")
    }

    // Shared backlink targets: both link to the same note
    let sharedTargets = 0
    for (const link of noteLinksOut) {
      if (otherLinksSet.has(link)) sharedTargets++
    }
    if (sharedTargets > 0) {
      backlinkScore += sharedTargets * 2
      reasons.push(`${sharedTargets} shared link target${sharedTargets > 1 ? "s" : ""}`)
    }

    // Shared backlinkers: both are linked FROM the same note
    const myBacklinkers = backlinksMap[noteId] ?? []
    const otherBacklinkers = new Set(backlinksMap[other.id] ?? [])
    let sharedBacklinkers = 0
    for (const bl of myBacklinkers) {
      if (otherBacklinkers.has(bl)) sharedBacklinkers++
    }
    if (sharedBacklinkers > 0) {
      backlinkScore += sharedBacklinkers
      reasons.push(`${sharedBacklinkers} shared backlinker${sharedBacklinkers > 1 ? "s" : ""}`)
    }

    score += backlinkScore

    // 4. Folder proximity (weight: W_FOLDER)
    if (noteFolderId && other.folderId === noteFolderId) {
      score += W_FOLDER
      reasons.push("same folder")
    }

    if (score > 0) {
      scored.push({
        noteId: other.id,
        score: Math.round(score * 10) / 10,
        reasons,
        isWiki: !!other.isWiki,
      })
    }
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score)

  // Related Notes: top 10 (all)
  const relatedNotes = scored.slice(0, 10).map(({ noteId, score, reasons }) => ({
    noteId,
    score,
    reasons,
  }))

  // Related Wiki: top 5 from wiki notes
  const relatedWiki = scored
    .filter((s) => s.isWiki)
    .slice(0, 5)
    .map(({ noteId, score, reasons }) => ({ noteId, score, reasons }))

  // Suggested Tags: collect tags from top-20 related, subtract current note's tags
  const tagFreq = new Map<string, number>()
  const top20 = scored.slice(0, 20)
  for (const item of top20) {
    const note = allNotes.find((n) => n.id === item.noteId)
    if (!note) continue
    for (const tagId of note.tags) {
      if (!sourceTagsSet.has(tagId)) {
        tagFreq.set(tagId, (tagFreq.get(tagId) ?? 0) + 1)
      }
    }
  }

  // Build tag id → name map
  const tagNameMap = new Map(allTags.map((t) => [t.id, t.name]))

  const suggestedTags = [...tagFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tagId, freq]) => ({
      tagId,
      tagName: tagNameMap.get(tagId) ?? tagId,
      score: freq,
    }))

  return { relatedNotes, relatedWiki, suggestedTags }
}
