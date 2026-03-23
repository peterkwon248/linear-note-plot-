import type { RelationType } from "./types"
import { RELATION_HEX } from "./colors"

export const RELATION_TYPE_CONFIG: Record<RelationType, {
  label: string
  inverseLabel: string
  color: string
}> = {
  "related-to":  { label: "Related to",    inverseLabel: "Related to",      color: RELATION_HEX["related-to"] },
  "inspired-by": { label: "Inspired by",   inverseLabel: "Inspired",        color: RELATION_HEX["inspired-by"] },
  "contradicts": { label: "Contradicts",   inverseLabel: "Contradicted by", color: RELATION_HEX["contradicts"] },
  "extends":     { label: "Extends",       inverseLabel: "Extended by",     color: RELATION_HEX["extends"] },
  "depends-on":  { label: "Depends on",    inverseLabel: "Depended on by",  color: RELATION_HEX["depends-on"] },
}

export const RELATION_TYPES: RelationType[] = [
  "related-to", "inspired-by", "contradicts", "extends", "depends-on"
]

export function getRelationLabel(type: RelationType, isSource: boolean): string {
  const config = RELATION_TYPE_CONFIG[type]
  return isSource ? config.label : config.inverseLabel
}
