import type { AutopilotRule } from "@/lib/types"

/** Default autopilot rules — Zettelkasten aligned */
export const DEFAULT_AUTOPILOT_RULES: AutopilotRule[] = [
  {
    id: "rule-inbox-to-capture",
    name: "Inbox → Capture 자동 승격",
    description: "내용이 충분하고 태그가 있으면 Capture로 자동 승격",
    enabled: true,
    trigger: "on_save",
    conditions: [
      { field: "status", operator: "eq", value: "inbox" },
      { field: "word_count", operator: "gte", value: 20 },
      { field: "has_tags", operator: "eq", value: true },
    ],
    actions: [
      { type: "set_status", value: "capture" },
      { type: "set_triage", value: "kept" },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "rule-capture-to-permanent",
    name: "Capture → Permanent 자동 승격",
    description: "3회 이상 읽고 링크가 있는 Capture 노트를 Permanent로 승격",
    enabled: true,
    trigger: "on_save",
    conditions: [
      { field: "status", operator: "eq", value: "capture" },
      { field: "reads", operator: "gte", value: 3 },
      { field: "has_links", operator: "eq", value: true },
    ],
    actions: [
      { type: "set_status", value: "permanent" },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "rule-auto-archive-stale",
    name: "오래된 Permanent 노트 자동 정리",
    description: "60일 이상 안 열린 Permanent 노트를 자동으로 trash로 이동",
    enabled: false,  // disabled by default — opt-in
    trigger: "on_interval",
    conditions: [
      { field: "status", operator: "eq", value: "permanent" },
      { field: "age_days", operator: "gte", value: 60 },
      { field: "reads", operator: "lte", value: 1 },
    ],
    actions: [
      { type: "archive" },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "rule-high-priority-inbox",
    name: "긴 Inbox 노트 우선순위 자동 부여",
    description: "내용이 긴 Inbox 노트에 High 우선순위 자동 부여",
    enabled: false,  // disabled by default
    trigger: "on_save",
    conditions: [
      { field: "status", operator: "eq", value: "inbox" },
      { field: "word_count", operator: "gte", value: 50 },
      { field: "priority", operator: "eq", value: "none" },
    ],
    actions: [
      { type: "set_priority", value: "high" },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]
