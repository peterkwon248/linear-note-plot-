import type { AnalysisRule } from "./types"

const DAY_MS = 24 * 60 * 60 * 1000

export const PRESET_RULES: AnalysisRule[] = [
  {
    id: "inbox-neglect",
    label: "Inbox neglected 30+ days",
    description: "Notes sitting in inbox for over 30 days",
    severity: "critical",
    match: (ctx) =>
      ctx.notes
        .filter(
          (n) =>
            n.status === "inbox" &&
            ctx.now - new Date(n.createdAt).getTime() > 30 * DAY_MS,
        )
        .map((n) => n.id),
  },

  {
    id: "overdue-srs",
    label: "SRS overdue 7+ days",
    description: "SRS notes past due date by more than 7 days",
    severity: "critical",
    match: (ctx) =>
      ctx.notes
        .filter((n) => {
          const srs = ctx.srsMap[n.id]
          if (!srs) return false
          return new Date(srs.dueAt).getTime() < ctx.now - 7 * DAY_MS
        })
        .map((n) => n.id),
  },

  {
    id: "stale-notes",
    label: "Stale notes (7+ days)",
    description: "Capture/permanent notes not touched in over 7 days",
    severity: "warning",
    match: (ctx) =>
      ctx.notes
        .filter((n) => {
          if (n.status !== "capture" && n.status !== "permanent") return false
          const touched = new Date(
            n.lastTouchedAt ?? n.updatedAt,
          ).getTime()
          return ctx.now - touched > 7 * DAY_MS
        })
        .map((n) => n.id),
  },

  {
    id: "orphan-notes",
    label: "Orphan notes",
    description: "Permanent notes with no inbound or outbound links",
    severity: "warning",
    match: (ctx) =>
      ctx.notes
        .filter(
          (n) =>
            n.status === "permanent" &&
            (ctx.backlinks.get(n.id) ?? 0) === 0 &&
            n.linksOut.length === 0,
        )
        .map((n) => n.id),
  },

  {
    id: "high-lapse-srs",
    label: "High-lapse SRS notes",
    description: "SRS notes with 3+ Again (fail) ratings",
    severity: "warning",
    match: (ctx) =>
      ctx.notes
        .filter((n) => {
          const srs = ctx.srsMap[n.id]
          return srs != null && srs.lapses >= 3
        })
        .map((n) => n.id),
  },

  {
    id: "stuck-capture",
    label: "Stuck in capture",
    description: "Notes in capture stage for over 14 days without promotion",
    severity: "info",
    match: (ctx) =>
      ctx.notes
        .filter(
          (n) =>
            n.status === "capture" &&
            n.promotedAt === null &&
            ctx.now - new Date(n.createdAt).getTime() > 14 * DAY_MS,
        )
        .map((n) => n.id),
  },

  {
    id: "empty-notes",
    label: "Empty notes",
    description: "Notes with title only — no body content",
    severity: "info",
    match: (ctx) =>
      ctx.notes
        .filter((n) => n.preview.trim().length === 0)
        .map((n) => n.id),
  },
]
