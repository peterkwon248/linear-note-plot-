import type { RelationType } from "./types"

export const RELATION_TYPE_CONFIG: Record<RelationType, {
  label: string
  inverseLabel: string
  color: string
}> = {
  "related-to":  { label: "Related to",    inverseLabel: "Related to",      color: "#6b7280" },
  "inspired-by": { label: "Inspired by",   inverseLabel: "Inspired",        color: "#8b5cf6" },
  "contradicts": { label: "Contradicts",   inverseLabel: "Contradicted by", color: "#ef4444" },
  "extends":     { label: "Extends",       inverseLabel: "Extended by",     color: "#3b82f6" },
  "depends-on":  { label: "Depends on",    inverseLabel: "Depended on by",  color: "#f59e0b" },
}

export const RELATION_TYPES: RelationType[] = [
  "related-to", "inspired-by", "contradicts", "extends", "depends-on"
]

export function getRelationLabel(type: RelationType, isSource: boolean): string {
  const config = RELATION_TYPE_CONFIG[type]
  return isSource ? config.label : config.inverseLabel
}
