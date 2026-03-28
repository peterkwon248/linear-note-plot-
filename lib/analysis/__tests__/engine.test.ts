import { describe, it, expect } from "vitest"
import type { Note, NoteStatus, NotePriority } from "../../types"
import type { SRSState } from "../../srs"
import type { AnalysisRule } from "../types"
import { runAnalysis } from "../engine"
import { PRESET_RULES } from "../rules"

/* ── Helper ───────────────────────────────────────────────────────────── */

const DAY_MS = 24 * 60 * 60 * 1000

function daysAgo(days: number): string {
  return new Date(Date.now() - days * DAY_MS).toISOString()
}

function makeNote(overrides: Partial<Note> = {}): Note {
  const now = new Date().toISOString()
  return {
    id: "test-id",
    title: "Test Note",
    content: "",
    contentJson: null,
    folderId: null,
    tags: [],
    status: "inbox" as NoteStatus,
    priority: "none" as NotePriority,
    reads: 0,
    pinned: false,
    createdAt: now,
    updatedAt: now,
    triageStatus: "untriaged",
    reviewAt: null,
    inboxRank: 0,
    summary: null,
    source: null,
    promotedAt: null,
    lastTouchedAt: now,
    snoozeCount: 0,
    trashedAt: null,
    trashed: false,
    parentNoteId: null,
    isWiki: false,
    labelId: null,
    preview: "",
    linksOut: [],
    aliases: [],
    wikiInfobox: [],
    wikiStatus: null,
    ...overrides,
  }
}

const emptySrsMap: Record<string, SRSState> = {}
const emptyBacklinks = new Map<string, number>()

/* ── Engine tests ─────────────────────────────────────────────────────── */

describe("runAnalysis", () => {
  it("returns empty array when no notes", () => {
    const results = runAnalysis([], emptySrsMap, emptyBacklinks)
    expect(results).toEqual([])
  })

  it("skips trashed notes", () => {
    const notes = [
      makeNote({ id: "t1", trashed: true, status: "capture", lastTouchedAt: daysAgo(10) }),
      makeNote({ id: "t2", triageStatus: "trashed", status: "inbox", createdAt: daysAgo(40) }),
    ]
    const results = runAnalysis(notes, emptySrsMap, emptyBacklinks)
    expect(results).toEqual([])
  })

  it("accepts custom rules", () => {
    const custom: AnalysisRule[] = [
      {
        id: "custom",
        label: "Custom",
        description: "Custom rule",
        severity: "info",
        match: (ctx) => ctx.notes.map((n) => n.id),
      },
    ]
    const notes = [makeNote({ id: "c1" })]
    const results = runAnalysis(notes, emptySrsMap, emptyBacklinks, custom)
    expect(results).toHaveLength(1)
    expect(results[0].ruleId).toBe("custom")
    expect(results[0].noteIds).toEqual(["c1"])
  })

  it("only returns rules with matches", () => {
    // Fresh inbox note — only empty-notes should match (preview is empty)
    const notes = [makeNote({ id: "n1", preview: "Some content here" })]
    const results = runAnalysis(notes, emptySrsMap, emptyBacklinks)
    // No rule should match a fresh inbox note with content
    expect(results).toEqual([])
  })
})

/* ── Per-rule tests ───────────────────────────────────────────────────── */

describe("stale-notes", () => {
  it("matches capture note untouched 8 days", () => {
    const notes = [
      makeNote({ id: "s1", status: "capture", lastTouchedAt: daysAgo(8) }),
    ]
    const results = runAnalysis(notes, emptySrsMap, emptyBacklinks)
    const stale = results.find((r) => r.ruleId === "stale-notes")
    expect(stale).toBeDefined()
    expect(stale!.noteIds).toEqual(["s1"])
  })

  it("matches permanent note untouched 8 days", () => {
    const notes = [
      makeNote({ id: "s2", status: "permanent", lastTouchedAt: daysAgo(8) }),
    ]
    const results = runAnalysis(notes, emptySrsMap, emptyBacklinks)
    const stale = results.find((r) => r.ruleId === "stale-notes")
    expect(stale).toBeDefined()
    expect(stale!.noteIds).toEqual(["s2"])
  })

  it("skips note untouched only 6 days", () => {
    const notes = [
      makeNote({ id: "s3", status: "capture", lastTouchedAt: daysAgo(6) }),
    ]
    const results = runAnalysis(notes, emptySrsMap, emptyBacklinks)
    const stale = results.find((r) => r.ruleId === "stale-notes")
    expect(stale).toBeUndefined()
  })

  it("skips inbox notes", () => {
    const notes = [
      makeNote({ id: "s4", status: "inbox", lastTouchedAt: daysAgo(10) }),
    ]
    const results = runAnalysis(notes, emptySrsMap, emptyBacklinks)
    const stale = results.find((r) => r.ruleId === "stale-notes")
    expect(stale).toBeUndefined()
  })
})

describe("orphan-notes", () => {
  it("matches permanent note with 0 backlinks and 0 linksOut", () => {
    const notes = [
      makeNote({ id: "o1", status: "permanent", linksOut: [] }),
    ]
    const results = runAnalysis(notes, emptySrsMap, emptyBacklinks)
    const orphan = results.find((r) => r.ruleId === "orphan-notes")
    expect(orphan).toBeDefined()
    expect(orphan!.noteIds).toEqual(["o1"])
  })

  it("skips note with backlinks", () => {
    const notes = [
      makeNote({ id: "o2", status: "permanent", linksOut: [] }),
    ]
    const bl = new Map([["o2", 1]])
    const results = runAnalysis(notes, emptySrsMap, bl)
    const orphan = results.find((r) => r.ruleId === "orphan-notes")
    expect(orphan).toBeUndefined()
  })

  it("skips note with outgoing links", () => {
    const notes = [
      makeNote({ id: "o3", status: "permanent", linksOut: ["other note"] }),
    ]
    const results = runAnalysis(notes, emptySrsMap, emptyBacklinks)
    const orphan = results.find((r) => r.ruleId === "orphan-notes")
    expect(orphan).toBeUndefined()
  })

  it("skips capture notes", () => {
    const notes = [
      makeNote({ id: "o4", status: "capture", linksOut: [] }),
    ]
    const results = runAnalysis(notes, emptySrsMap, emptyBacklinks)
    const orphan = results.find((r) => r.ruleId === "orphan-notes")
    expect(orphan).toBeUndefined()
  })
})

describe("inbox-neglect", () => {
  it("matches inbox note created 31 days ago", () => {
    const notes = [
      makeNote({ id: "i1", status: "inbox", createdAt: daysAgo(31) }),
    ]
    const results = runAnalysis(notes, emptySrsMap, emptyBacklinks)
    const neglect = results.find((r) => r.ruleId === "inbox-neglect")
    expect(neglect).toBeDefined()
    expect(neglect!.noteIds).toEqual(["i1"])
    expect(neglect!.severity).toBe("critical")
  })

  it("skips inbox note created 29 days ago", () => {
    const notes = [
      makeNote({ id: "i2", status: "inbox", createdAt: daysAgo(29) }),
    ]
    const results = runAnalysis(notes, emptySrsMap, emptyBacklinks)
    const neglect = results.find((r) => r.ruleId === "inbox-neglect")
    expect(neglect).toBeUndefined()
  })
})

describe("high-lapse-srs", () => {
  it("matches note with 3 lapses", () => {
    const notes = [makeNote({ id: "h1", status: "permanent" })]
    const srsMap: Record<string, SRSState> = {
      h1: { step: 0, dueAt: new Date().toISOString(), lastReviewedAt: new Date().toISOString(), introducedAt: new Date().toISOString(), lapses: 3 },
    }
    const results = runAnalysis(notes, srsMap, emptyBacklinks)
    const lapse = results.find((r) => r.ruleId === "high-lapse-srs")
    expect(lapse).toBeDefined()
    expect(lapse!.noteIds).toEqual(["h1"])
  })

  it("skips note with 2 lapses", () => {
    const notes = [makeNote({ id: "h2", status: "permanent" })]
    const srsMap: Record<string, SRSState> = {
      h2: { step: 2, dueAt: new Date().toISOString(), lastReviewedAt: new Date().toISOString(), introducedAt: new Date().toISOString(), lapses: 2 },
    }
    const results = runAnalysis(notes, srsMap, emptyBacklinks)
    const lapse = results.find((r) => r.ruleId === "high-lapse-srs")
    expect(lapse).toBeUndefined()
  })
})

describe("stuck-capture", () => {
  it("matches capture note 15 days old with no promotedAt", () => {
    const notes = [
      makeNote({ id: "sc1", status: "capture", promotedAt: null, createdAt: daysAgo(15) }),
    ]
    const results = runAnalysis(notes, emptySrsMap, emptyBacklinks)
    const stuck = results.find((r) => r.ruleId === "stuck-capture")
    expect(stuck).toBeDefined()
    expect(stuck!.noteIds).toEqual(["sc1"])
  })

  it("skips capture note only 13 days old", () => {
    const notes = [
      makeNote({ id: "sc2", status: "capture", promotedAt: null, createdAt: daysAgo(13) }),
    ]
    const results = runAnalysis(notes, emptySrsMap, emptyBacklinks)
    const stuck = results.find((r) => r.ruleId === "stuck-capture")
    expect(stuck).toBeUndefined()
  })

  it("skips permanent notes", () => {
    const notes = [
      makeNote({ id: "sc3", status: "permanent", promotedAt: daysAgo(1), createdAt: daysAgo(20) }),
    ]
    const results = runAnalysis(notes, emptySrsMap, emptyBacklinks)
    const stuck = results.find((r) => r.ruleId === "stuck-capture")
    expect(stuck).toBeUndefined()
  })
})

describe("empty-notes", () => {
  it("matches note with empty preview", () => {
    const notes = [makeNote({ id: "e1", preview: "" })]
    const results = runAnalysis(notes, emptySrsMap, emptyBacklinks)
    const empty = results.find((r) => r.ruleId === "empty-notes")
    expect(empty).toBeDefined()
    expect(empty!.noteIds).toEqual(["e1"])
  })

  it("matches note with whitespace-only preview", () => {
    const notes = [makeNote({ id: "e2", preview: "   " })]
    const results = runAnalysis(notes, emptySrsMap, emptyBacklinks)
    const empty = results.find((r) => r.ruleId === "empty-notes")
    expect(empty).toBeDefined()
  })

  it("skips note with content", () => {
    const notes = [makeNote({ id: "e3", preview: "This note has content" })]
    const results = runAnalysis(notes, emptySrsMap, emptyBacklinks)
    const empty = results.find((r) => r.ruleId === "empty-notes")
    expect(empty).toBeUndefined()
  })
})

describe("overdue-srs", () => {
  it("matches note 8 days overdue", () => {
    const notes = [makeNote({ id: "od1", status: "permanent" })]
    const srsMap: Record<string, SRSState> = {
      od1: { step: 1, dueAt: daysAgo(8), lastReviewedAt: daysAgo(10), introducedAt: daysAgo(20), lapses: 0 },
    }
    const results = runAnalysis(notes, srsMap, emptyBacklinks)
    const overdue = results.find((r) => r.ruleId === "overdue-srs")
    expect(overdue).toBeDefined()
    expect(overdue!.noteIds).toEqual(["od1"])
    expect(overdue!.severity).toBe("critical")
  })

  it("skips note only 1 day overdue", () => {
    const notes = [makeNote({ id: "od2", status: "permanent" })]
    const srsMap: Record<string, SRSState> = {
      od2: { step: 1, dueAt: daysAgo(1), lastReviewedAt: daysAgo(3), introducedAt: daysAgo(10), lapses: 0 },
    }
    const results = runAnalysis(notes, srsMap, emptyBacklinks)
    const overdue = results.find((r) => r.ruleId === "overdue-srs")
    expect(overdue).toBeUndefined()
  })

  it("skips note not enrolled in SRS", () => {
    const notes = [makeNote({ id: "od3", status: "permanent" })]
    const results = runAnalysis(notes, emptySrsMap, emptyBacklinks)
    const overdue = results.find((r) => r.ruleId === "overdue-srs")
    expect(overdue).toBeUndefined()
  })
})

/* ── Integration: multiple rules fire together ────────────────────────── */

describe("integration", () => {
  it("multiple rules can match different notes simultaneously", () => {
    const notes = [
      makeNote({ id: "n1", status: "inbox", createdAt: daysAgo(35) }),       // inbox-neglect
      makeNote({ id: "n2", status: "permanent", linksOut: [] }),              // orphan-notes
      makeNote({ id: "n3", status: "capture", lastTouchedAt: daysAgo(10) }), // stale-notes + stuck-capture
      makeNote({ id: "n4", preview: "" }),                                    // empty-notes
    ]
    // n3 is also 10 days old capture with no promotedAt → stuck-capture won't match (only 10d < 14d threshold)
    // But stale-notes will match (10d > 7d)
    const results = runAnalysis(notes, emptySrsMap, emptyBacklinks)

    expect(results.find((r) => r.ruleId === "inbox-neglect")?.noteIds).toEqual(["n1"])
    expect(results.find((r) => r.ruleId === "orphan-notes")?.noteIds).toEqual(["n2"])
    expect(results.find((r) => r.ruleId === "stale-notes")?.noteIds).toEqual(["n3"])
    expect(results.find((r) => r.ruleId === "empty-notes")).toBeDefined()
    // n4 is in empty-notes (preview="")
    expect(results.find((r) => r.ruleId === "empty-notes")!.noteIds).toContain("n4")
  })

  it("exports all 7 preset rules", () => {
    expect(PRESET_RULES).toHaveLength(7)
    const ids = PRESET_RULES.map((r) => r.id)
    expect(ids).toContain("stale-notes")
    expect(ids).toContain("orphan-notes")
    expect(ids).toContain("inbox-neglect")
    expect(ids).toContain("high-lapse-srs")
    expect(ids).toContain("stuck-capture")
    expect(ids).toContain("empty-notes")
    expect(ids).toContain("overdue-srs")
  })
})
