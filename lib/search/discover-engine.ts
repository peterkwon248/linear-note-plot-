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
  /** v107 N:M: a note can belong to multiple folders. */
  folderIds?: string[]
  isWiki?: boolean
  preview?: string
  /**
   * Mention atom targets extracted from this note's contentJson.
   * `noteIds` = ids of @-mentioned notes; `wikiIds` = ids of @-mentioned wiki articles.
   * Optional — when omitted, mention overlap is skipped for this note.
   */
  mentionTargets?: { noteIds: string[]; wikiIds: string[] }
}

export interface DiscoverParams {
  noteId: string
  noteTitle: string
  noteBody: string
  noteTags: string[]
  noteLinksOut: string[]
  /** v107 N:M: source note's folder memberships. Empty = unfoldered. */
  noteFolderIds: string[]
  allNotes: DiscoverNoteInput[]
  backlinksMap: Record<string, string[]>
  allTags: Array<{ id: string; name: string }>
  /**
   * Current note's @-mention atom targets (note ids + wiki ids).
   * When provided, candidates that appear in either set get a "mention"
   * bonus equivalent to a direct wikilink, and shared mention overlap
   * counts the same as shared link targets.
   */
  noteMentionTargets?: { noteIds: Set<string>; wikiIds: Set<string> }
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
    noteFolderIds,
    allNotes,
    backlinksMap,
    allTags,
    noteMentionTargets,
  } = params

  // Tokenize current note
  const sourceText = noteTitle + " " + noteBody
  const sourceTokens = new Set(tokenize(sourceText))
  const sourceLinksSet = new Set(noteLinksOut)
  const sourceTagsSet = new Set(noteTags)
  // Combined mention id set (note + wiki ids) — used for fast O(1) lookup of
  // candidates the current note has @-mentioned anywhere in its body.
  const sourceMentionIds = new Set<string>()
  if (noteMentionTargets) {
    for (const id of noteMentionTargets.noteIds) sourceMentionIds.add(id)
    for (const id of noteMentionTargets.wikiIds) sourceMentionIds.add(id)
  }

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

    // Mention bonus (treated equivalent to direct link):
    //   (a) current note @-mentions `other`
    //   (b) `other` @-mentions current note
    // Either case earns a single "mention" reason — we don't double-count
    // when both directions hold to keep scores comparable to "direct link".
    let mentionMatched = false
    if (sourceMentionIds.has(other.id)) mentionMatched = true
    if (!mentionMatched && other.mentionTargets) {
      const otherMentions = other.mentionTargets
      if (
        otherMentions.noteIds.includes(noteId) ||
        otherMentions.wikiIds.includes(noteId)
      ) {
        mentionMatched = true
      }
    }
    if (mentionMatched) {
      backlinkScore += W_BACKLINK
      reasons.push("mention")
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

    // Shared mention targets: both mention the same note/wiki id.
    // Counts the same as shared link targets to stay consistent with the
    // wikilink-based shared-target bonus.
    if (other.mentionTargets && sourceMentionIds.size > 0) {
      let sharedMentions = 0
      for (const id of other.mentionTargets.noteIds) {
        if (sourceMentionIds.has(id)) sharedMentions++
      }
      for (const id of other.mentionTargets.wikiIds) {
        if (sourceMentionIds.has(id)) sharedMentions++
      }
      if (sharedMentions > 0) {
        backlinkScore += sharedMentions * 2
        reasons.push(`${sharedMentions} shared mention${sharedMentions > 1 ? "s" : ""}`)
      }
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

    // 4. Folder proximity (weight: W_FOLDER) — v107 N:M: any folder
    //    overlap counts.
    const otherFolderIds = other.folderIds ?? []
    const sharedFolders = noteFolderIds.filter((fid) => otherFolderIds.includes(fid))
    if (sharedFolders.length > 0) {
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
