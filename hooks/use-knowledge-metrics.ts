"use client"

import { useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { computeKnowledgeMetrics } from "@/lib/insights/metrics"
import type { KnowledgeMetrics } from "@/lib/insights/types"

/**
 * Single source for knowledge metrics. Both the Ontology Insights tab and the
 * sidebar Health section read from this hook so the numbers stay in sync.
 *
 * Re-runs only when notes, wikiArticles, or backlinks change.
 */
export function useKnowledgeMetrics(): KnowledgeMetrics {
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const backlinks = useBacklinksIndex()

  return useMemo(
    () => computeKnowledgeMetrics({ notes, wikiArticles, backlinksMap: backlinks }),
    [notes, wikiArticles, backlinks],
  )
}
