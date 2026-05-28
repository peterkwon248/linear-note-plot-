import type { AutopilotRule } from "@/lib/types"

/** Default autopilot rules — Zettelkasten aligned */
export const DEFAULT_AUTOPILOT_RULES: AutopilotRule[] = [
  {
    id: "rule-stone-to-brick",
    name: "Backlog → In Progress 자동 승격",
    description: "내용이 충분하고 태그가 있으면 In Progress로 자동 승격",
    enabled: true,
    trigger: "on_save",
    conditions: [
      { field: "status", operator: "eq", value: "backlog" },
      { field: "word_count", operator: "gte", value: 20 },
      { field: "has_tags", operator: "eq", value: true },
    ],
    actions: [
      { type: "set_status", value: "in_progress" },
      { type: "set_triage", value: "kept" },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "rule-brick-to-keystone",
    name: "In Progress → Done 자동 승격",
    description: "3회 이상 읽고 링크가 있는 In Progress 노트를 Done으로 승격",
    enabled: true,
    trigger: "on_save",
    conditions: [
      { field: "status", operator: "eq", value: "in_progress" },
      { field: "reads", operator: "gte", value: 3 },
      { field: "has_links", operator: "eq", value: true },
    ],
    actions: [
      { type: "set_status", value: "done" },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "rule-high-priority-stone",
    name: "긴 Backlog 노트 우선순위 자동 부여",
    description: "내용이 긴 Backlog 노트에 High 우선순위 자동 부여",
    enabled: false,  // disabled by default
    trigger: "on_save",
    conditions: [
      { field: "status", operator: "eq", value: "backlog" },
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
