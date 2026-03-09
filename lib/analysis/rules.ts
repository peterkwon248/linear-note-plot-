import type { AnalysisRule } from "./types"

const DAY_MS = 24 * 60 * 60 * 1000

export const PRESET_RULES: AnalysisRule[] = [
  {
    id: "inbox-neglect",
    label: "inbox에 30일 이상 방치된 노트",
    description: "30일 넘게 inbox에 머물러 있는 노트",
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
    label: "SRS 복습 7일 초과 노트",
    description: "복습 기한이 7일 이상 지난 SRS 노트",
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
    label: "7일 이상 안 열린 노트",
    description: "7일 이상 편집되지 않은 capture/permanent 노트",
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
    label: "링크 없는 고아 노트",
    description: "다른 노트에서 링크되지 않고 나가는 링크도 없는 permanent 노트",
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
    label: "SRS 실패 횟수 높은 노트",
    description: "Again(실패) 3회 이상인 SRS 노트",
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
    label: "승격되지 않은 오래된 capture 노트",
    description: "14일 이상 capture 단계에 머물러 있는 노트",
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
    label: "내용 없는 빈 노트",
    description: "제목만 있고 본문이 비어있는 노트",
    severity: "info",
    match: (ctx) =>
      ctx.notes
        .filter((n) => n.preview.trim().length === 0)
        .map((n) => n.id),
  },
]
