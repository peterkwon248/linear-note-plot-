import type { Note, StubSource } from "./types"

/** Signal detection result */
export interface EnrollmentCandidate {
  type: StubSource         // "red-link" | "tag" | "backlink"
  title: string            // For red-link/tag: the name. For backlink: note title
  noteId?: string          // For backlink: existing note to convert
  score: number            // refCount or backlink count (for sorting)
}

/**
 * Scan all notes and detect wiki auto-enrollment candidates.
 * Pure function — does not mutate store.
 */
export function detectEnrollmentCandidates(notes: Note[]): EnrollmentCandidate[] {
  const activeNotes = notes.filter(n => !n.trashed)
  const wikiNotes = activeNotes.filter(n => n.isWiki)

  // Build wiki title set (title + aliases, lowercased)
  const wikiTitleSet = new Set<string>()
  for (const n of wikiNotes) {
    wikiTitleSet.add(n.title.toLowerCase())
    for (const a of n.aliases) {
      wikiTitleSet.add(a.toLowerCase())
    }
  }

  // Also build a map of all note titles (lowercased) -> noteId for existing note matching
  const titleToNoteId = new Map<string, string>()
  for (const n of activeNotes) {
    if (!n.isWiki) {
      titleToNoteId.set(n.title.toLowerCase(), n.id)
    }
  }

  const candidates: EnrollmentCandidate[] = []

  // ── Signal 1: Red links with refCount >= 2 ──
  const redLinkRefs = new Map<string, Set<string>>()
  for (const note of activeNotes) {
    for (const link of note.linksOut) {
      const normalized = link.toLowerCase()
      if (!wikiTitleSet.has(normalized)) {
        if (!redLinkRefs.has(link)) redLinkRefs.set(link, new Set())
        redLinkRefs.get(link)!.add(note.id)
      }
    }
  }
  for (const [title, refs] of redLinkRefs) {
    if (refs.size >= 2) {
      const existingNoteId = titleToNoteId.get(title.toLowerCase())
      candidates.push({
        type: "red-link",
        title,
        noteId: existingNoteId,
        score: refs.size,
      })
    }
  }

  // ── Signal 3: Backlinks >= 3 (non-inbox notes only) ──
  // Count how many notes link TO each note via linksOut
  const backlinkCounts = new Map<string, number>()
  const noteTitleToId = new Map<string, string>()
  for (const n of activeNotes) {
    noteTitleToId.set(n.title.toLowerCase(), n.id)
    for (const a of n.aliases ?? []) {
      noteTitleToId.set(a.toLowerCase(), n.id)
    }
  }

  for (const note of activeNotes) {
    for (const link of note.linksOut) {
      const targetId = noteTitleToId.get(link.toLowerCase())
      if (targetId && targetId !== note.id) {
        backlinkCounts.set(targetId, (backlinkCounts.get(targetId) ?? 0) + 1)
      }
    }
  }

  for (const [noteId, count] of backlinkCounts) {
    if (count < 3) continue
    const note = activeNotes.find(n => n.id === noteId)
    if (!note || note.isWiki || note.status === "inbox") continue
    candidates.push({
      type: "backlink",
      title: note.title,
      noteId,
      score: count,
    })
  }

  return candidates.sort((a, b) => b.score - a.score)
}

/**
 * Tag-based enrollment candidates.
 * Returns tagIds that are used in 3+ notes but don't have a corresponding wiki article.
 */
export function detectTagCandidates(
  notes: Note[],
  tags: { id: string; name: string; trashed?: boolean }[]
): EnrollmentCandidate[] {
  const activeNotes = notes.filter(n => !n.trashed)
  const wikiNotes = activeNotes.filter(n => n.isWiki)

  const wikiTitleSet = new Set<string>()
  for (const n of wikiNotes) {
    wikiTitleSet.add(n.title.toLowerCase())
    for (const a of n.aliases) wikiTitleSet.add(a.toLowerCase())
  }

  // Build a map of note titles for matching existing notes
  const titleToNoteId = new Map<string, string>()
  for (const n of activeNotes) {
    if (!n.isWiki) titleToNoteId.set(n.title.toLowerCase(), n.id)
  }

  const tagNoteCounts = new Map<string, number>()
  for (const note of activeNotes) {
    for (const tagId of note.tags) {
      tagNoteCounts.set(tagId, (tagNoteCounts.get(tagId) ?? 0) + 1)
    }
  }

  const candidates: EnrollmentCandidate[] = []
  for (const tag of tags) {
    if (tag.trashed) continue
    const count = tagNoteCounts.get(tag.id) ?? 0
    if (count < 3) continue
    // Skip if wiki already exists with this tag name
    if (wikiTitleSet.has(tag.name.toLowerCase())) continue

    const existingNoteId = titleToNoteId.get(tag.name.toLowerCase())
    candidates.push({
      type: "tag",
      title: tag.name,
      noteId: existingNoteId,
      score: count,
    })
  }

  return candidates.sort((a, b) => b.score - a.score)
}

// ── Auto-enrollment timer ──

let _timer: ReturnType<typeof setInterval> | null = null

const AUTO_ENROLL_INTERVAL = 10 * 60 * 1000 // 10 minutes

/**
 * Execute auto-enrollment: detect candidates and apply Signal 1-3 automatically.
 * Returns count of auto-enrolled items.
 */
export function runAutoEnrollment(
  getState: () => { notes: Note[]; tags: { id: string; name: string; trashed?: boolean }[] },
  actions: {
    createWikiStub: (title: string, aliases?: string[], stubSource?: string) => string
    convertToWiki: (noteId: string, stubSource?: string) => void
  }
): number {
  const { notes, tags } = getState()
  let enrolled = 0

  // Signal 1 + 3: red-links and backlinks
  const candidates = detectEnrollmentCandidates(notes)
  for (const c of candidates) {
    if (c.type === "red-link") {
      if (c.noteId) {
        // Existing note matches red-link title → convert to wiki
        actions.convertToWiki(c.noteId, "red-link")
      } else {
        // No existing note → create stub
        actions.createWikiStub(c.title, [], "red-link")
      }
      enrolled++
    } else if (c.type === "backlink") {
      if (c.noteId) {
        actions.convertToWiki(c.noteId, "backlink")
        enrolled++
      }
    }
  }

  // Signal 2: tags
  const tagCandidates = detectTagCandidates(notes, tags)
  for (const c of tagCandidates) {
    if (c.noteId) {
      actions.convertToWiki(c.noteId, "tag")
    } else {
      actions.createWikiStub(c.title, [], "tag")
    }
    enrolled++
  }

  return enrolled
}

/**
 * Start the auto-enrollment timer. Call once at app mount.
 */
export function startAutoEnrollment(
  getState: () => { notes: Note[]; tags: { id: string; name: string; trashed?: boolean }[] },
  actions: {
    createWikiStub: (title: string, aliases?: string[], stubSource?: string) => string
    convertToWiki: (noteId: string, stubSource?: string) => void
  }
) {
  // Defer initial run to avoid React state-update-before-mount warnings
  stopAutoEnrollment()
  _timer = setTimeout(() => {
    runAutoEnrollment(getState, actions)
    // Then every 10 minutes
    _timer = setInterval(() => {
      runAutoEnrollment(getState, actions)
    }, AUTO_ENROLL_INTERVAL)
  }, 2000) as unknown as ReturnType<typeof setInterval>
}

export function stopAutoEnrollment() {
  if (_timer) {
    clearInterval(_timer)
    _timer = null
  }
}
