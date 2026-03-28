import { describe, it, expect } from "vitest"
import { runAutopilot, evaluateRule } from "../engine"
import { matchesCondition, matchesAllConditions } from "../conditions"
import type { Note, AutopilotRule, AutopilotCondition } from "@/lib/types"
import type { AutopilotContext } from "../types"

/* ── Helpers ──────────────────────────────────────── */

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: "test-1",
    title: "Test Note",
    content: "",
    contentJson: null,
    folderId: null,
    tags: [],
    labelId: null,
    status: "inbox",
    priority: "none",
    reads: 0,
    pinned: false,
    trashed: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updatedAt: new Date().toISOString(),
    triageStatus: "untriaged",
    reviewAt: null,
    inboxRank: 0,
    summary: null,
    source: "manual",
    promotedAt: null,
    lastTouchedAt: new Date().toISOString(),
    snoozeCount: 0,
    trashedAt: null,
    parentNoteId: null,
    isWiki: false,
    preview: "This is a test note with some preview text for testing",
    linksOut: [],
    aliases: [],
    wikiInfobox: [],
    wikiStatus: null,
    ...overrides,
  }
}

function makeRule(overrides: Partial<AutopilotRule> = {}): AutopilotRule {
  return {
    id: "rule-test",
    name: "Test Rule",
    description: "A test rule",
    enabled: true,
    trigger: "on_save",
    conditions: [],
    actions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

function makeCtx(note: Note, backlinksCount = 0): AutopilotContext {
  return { note, now: Date.now(), backlinksCount }
}

/* ── Condition Tests ──────────────────────────────── */

describe("matchesCondition", () => {
  it("matches status eq", () => {
    const note = makeNote({ status: "inbox" })
    const cond: AutopilotCondition = { field: "status", operator: "eq", value: "inbox" }
    expect(matchesCondition(makeCtx(note), cond)).toBe(true)
  })

  it("rejects status neq when equal", () => {
    const note = makeNote({ status: "inbox" })
    const cond: AutopilotCondition = { field: "status", operator: "neq", value: "inbox" }
    expect(matchesCondition(makeCtx(note), cond)).toBe(false)
  })

  it("matches reads gte", () => {
    const note = makeNote({ reads: 5 })
    const cond: AutopilotCondition = { field: "reads", operator: "gte", value: 3 }
    expect(matchesCondition(makeCtx(note), cond)).toBe(true)
  })

  it("rejects reads lt when equal", () => {
    const note = makeNote({ reads: 3 })
    const cond: AutopilotCondition = { field: "reads", operator: "lt", value: 3 }
    expect(matchesCondition(makeCtx(note), cond)).toBe(false)
  })

  it("matches has_links boolean true", () => {
    const note = makeNote({ linksOut: ["test-link"] })
    const cond: AutopilotCondition = { field: "has_links", operator: "eq", value: true }
    expect(matchesCondition(makeCtx(note), cond)).toBe(true)
  })

  it("matches has_tags boolean false", () => {
    const note = makeNote({ tags: [] })
    const cond: AutopilotCondition = { field: "has_tags", operator: "eq", value: false }
    expect(matchesCondition(makeCtx(note), cond)).toBe(true)
  })

  it("matches age_days gte", () => {
    const note = makeNote({
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    })
    const cond: AutopilotCondition = { field: "age_days", operator: "gte", value: 7 }
    expect(matchesCondition(makeCtx(note), cond)).toBe(true)
  })

  it("matches word_count gte", () => {
    const note = makeNote({ preview: "one two three four five six seven eight nine ten eleven" })
    const cond: AutopilotCondition = { field: "word_count", operator: "gte", value: 10 }
    expect(matchesCondition(makeCtx(note), cond)).toBe(true)
  })

  it("matches link_count with backlinks", () => {
    const note = makeNote({ linksOut: ["a", "b"] })
    const ctx = makeCtx(note, 3) // 2 out + 3 in = 5
    const cond: AutopilotCondition = { field: "link_count", operator: "gte", value: 5 }
    expect(matchesCondition(ctx, cond)).toBe(true)
  })
})

describe("matchesAllConditions", () => {
  it("returns false for empty conditions", () => {
    const note = makeNote()
    expect(matchesAllConditions(makeCtx(note), [])).toBe(false)
  })

  it("returns true when all conditions match (AND)", () => {
    const note = makeNote({ status: "inbox", reads: 5 })
    const conditions: AutopilotCondition[] = [
      { field: "status", operator: "eq", value: "inbox" },
      { field: "reads", operator: "gte", value: 3 },
    ]
    expect(matchesAllConditions(makeCtx(note), conditions)).toBe(true)
  })

  it("returns false when one condition fails (AND)", () => {
    const note = makeNote({ status: "inbox", reads: 1 })
    const conditions: AutopilotCondition[] = [
      { field: "status", operator: "eq", value: "inbox" },
      { field: "reads", operator: "gte", value: 3 },
    ]
    expect(matchesAllConditions(makeCtx(note), conditions)).toBe(false)
  })
})

/* ── Engine Tests ─────────────────────────────────── */

describe("evaluateRule", () => {
  it("returns matched=true when conditions match", () => {
    const note = makeNote({ status: "inbox", reads: 5 })
    const rule = makeRule({
      conditions: [
        { field: "status", operator: "eq", value: "inbox" },
        { field: "reads", operator: "gte", value: 3 },
      ],
      actions: [{ type: "set_status", value: "capture" }],
    })
    const result = evaluateRule(makeCtx(note), rule)
    expect(result.matched).toBe(true)
    expect(result.actions).toHaveLength(1)
  })

  it("returns matched=false when disabled", () => {
    const note = makeNote({ status: "inbox" })
    const rule = makeRule({
      enabled: false,
      conditions: [{ field: "status", operator: "eq", value: "inbox" }],
      actions: [{ type: "set_status", value: "capture" }],
    })
    const result = evaluateRule(makeCtx(note), rule)
    expect(result.matched).toBe(false)
  })
})

describe("runAutopilot", () => {
  it("returns empty applied when no rules match", () => {
    const note = makeNote({ status: "permanent" })
    const rules = [
      makeRule({
        id: "r1",
        conditions: [{ field: "status", operator: "eq", value: "inbox" }],
        actions: [{ type: "set_status", value: "capture" }],
      }),
    ]
    const result = runAutopilot(note, rules, "on_save")
    expect(result.applied).toHaveLength(0)
  })

  it("applies matching rules", () => {
    const note = makeNote({
      status: "inbox",
      preview: "word ".repeat(25).trim(),
      tags: ["tag-1"],
    })
    const rules = [
      makeRule({
        id: "r1",
        name: "Inbox to Capture",
        conditions: [
          { field: "status", operator: "eq", value: "inbox" },
          { field: "word_count", operator: "gte", value: 20 },
          { field: "has_tags", operator: "eq", value: true },
        ],
        actions: [{ type: "set_status", value: "capture" }],
      }),
    ]
    const result = runAutopilot(note, rules, "on_save")
    expect(result.applied).toHaveLength(1)
    expect(result.applied[0].ruleId).toBe("r1")
  })

  it("first-match-wins for conflicting action types", () => {
    const note = makeNote({ status: "inbox", reads: 5, tags: ["t1"] })
    const rules = [
      makeRule({
        id: "r1",
        name: "Rule 1",
        conditions: [{ field: "status", operator: "eq", value: "inbox" }],
        actions: [{ type: "set_status", value: "capture" }],
      }),
      makeRule({
        id: "r2",
        name: "Rule 2",
        conditions: [{ field: "status", operator: "eq", value: "inbox" }],
        actions: [{ type: "set_status", value: "permanent" }], // conflicts with r1
      }),
    ]
    const result = runAutopilot(note, rules, "on_save")
    // Only r1's set_status should be applied
    expect(result.applied).toHaveLength(1)
    expect(result.applied[0].ruleId).toBe("r1")
  })

  it("filters by trigger type", () => {
    const note = makeNote({ status: "inbox" })
    const rules = [
      makeRule({
        id: "r1",
        trigger: "on_open",
        conditions: [{ field: "status", operator: "eq", value: "inbox" }],
        actions: [{ type: "set_priority", value: "high" }],
      }),
    ]
    const result = runAutopilot(note, rules, "on_save")
    expect(result.applied).toHaveLength(0)
  })

  it("skips disabled rules", () => {
    const note = makeNote({ status: "inbox" })
    const rules = [
      makeRule({
        id: "r1",
        enabled: false,
        conditions: [{ field: "status", operator: "eq", value: "inbox" }],
        actions: [{ type: "set_status", value: "capture" }],
      }),
    ]
    const result = runAutopilot(note, rules, "on_save")
    expect(result.applied).toHaveLength(0)
  })
})
