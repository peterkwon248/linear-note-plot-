import type { AutopilotRule } from "@/lib/types"

/** Default autopilot rules — Zettelkasten aligned */
export const DEFAULT_AUTOPILOT_RULES: AutopilotRule[] = [
  {
    id: "rule-stone-to-brick",
    name: "Stone → Brick 자동 승격",
    description: "내용이 충분하고 태그가 있으면 Brick으로 자동 승격",
    enabled: true,
    trigger: "on_save",
    conditions: [
      { field: "status", operator: "eq", value: "stone" },
      { field: "word_count", operator: "gte", value: 20 },
      { field: "has_tags", operator: "eq", value: true },
    ],
    actions: [
      { type: "set_status", value: "brick" },
      { type: "set_triage", value: "kept" },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "rule-brick-to-keystone",
    name: "Brick → Keystone 자동 승격",
    description: "3회 이상 읽고 링크가 있는 Brick 노트를 Keystone으로 승격",
    enabled: true,
    trigger: "on_save",
    conditions: [
      { field: "status", operator: "eq", value: "brick" },
      { field: "reads", operator: "gte", value: 3 },
      { field: "has_links", operator: "eq", value: true },
    ],
    actions: [
      { type: "set_status", value: "keystone" },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "rule-high-priority-stone",
    name: "긴 Stone 노트 우선순위 자동 부여",
    description: "내용이 긴 Stone 노트에 High 우선순위 자동 부여",
    enabled: false,  // disabled by default
    trigger: "on_save",
    conditions: [
      { field: "status", operator: "eq", value: "stone" },
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
