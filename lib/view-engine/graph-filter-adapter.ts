/**
 * Adapter: convert between OntologyFilters (used by graph canvas) and FilterRule[] (used by FilterPanel).
 *
 * OntologyFilters is the internal shape consumed by OntologyGraphCanvas.
 * FilterRule[] is the unified shape used by FilterPanel / view-engine.
 */

import type { OntologyFilters } from "@/components/ontology/ontology-graph-canvas"
import type { FilterRule } from "./types"
import { RELATION_TYPES } from "@/lib/relation-helpers"
import type { RelationType } from "@/lib/types"

/* ── OntologyFilters → FilterRule[] ────────────────────── */

export function ontologyFiltersToRules(filters: OntologyFilters): FilterRule[] {
  const rules: FilterRule[] = []

  // tagIds → multiple rules with field="tags"
  for (const tagId of filters.tagIds) {
    rules.push({ field: "tags", operator: "eq", value: tagId })
  }

  // labelId → single rule with field="label"
  if (filters.labelId) {
    rules.push({ field: "label", operator: "eq", value: filters.labelId })
  }

  // status (if not "all") → single rule with field="status"
  if (filters.status !== "all") {
    rules.push({ field: "status", operator: "eq", value: filters.status })
  }

  // relationTypes (if not "all") → multiple rules with field="relationType"
  if (filters.relationTypes !== "all") {
    for (const type of filters.relationTypes) {
      rules.push({ field: "relationType", operator: "eq", value: type })
    }
  }

  // showWikilinks toggle (only store rule when OFF — default is ON)
  if (!filters.showWikilinks) {
    rules.push({ field: "showWikilinks", operator: "eq", value: "false" })
  }

  // showTagNodes toggle (only store rule when ON — default is OFF)
  if (filters.showTagNodes) {
    rules.push({ field: "showTagNodes", operator: "eq", value: "true" })
  }

  return rules
}

/* ── FilterRule[] → OntologyFilters ────────────────────── */

export function rulesToOntologyFilters(rules: FilterRule[]): OntologyFilters {
  const tagIds: string[] = []
  let labelId: string | null = null
  let status: "inbox" | "capture" | "permanent" | "all" = "all"
  const relationTypes: RelationType[] = []
  let showWikilinks = true
  let showTagNodes = false

  for (const rule of rules) {
    switch (rule.field) {
      case "tags":
        tagIds.push(rule.value)
        break
      case "label":
        labelId = rule.value
        break
      case "status":
        status = rule.value as "inbox" | "capture" | "permanent"
        break
      case "relationType":
        relationTypes.push(rule.value as RelationType)
        break
      case "showWikilinks":
        showWikilinks = rule.value === "true"
        break
      case "showTagNodes":
        showTagNodes = rule.value === "true"
        break
    }
  }

  return {
    tagIds,
    labelId,
    status,
    relationTypes: relationTypes.length > 0 ? relationTypes : "all",
    showWikilinks,
    showTagNodes,
  }
}

/* ── Default OntologyFilters ───────────────────────────── */

export const DEFAULT_ONTOLOGY_FILTERS: OntologyFilters = {
  tagIds: [],
  labelId: null,
  status: "all",
  relationTypes: "all",
  showWikilinks: true,
  showTagNodes: false,
}
