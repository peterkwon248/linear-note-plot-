"use client"

import { useActiveSpace } from "@/lib/table-route"
import { useSidePanelEntity } from "./use-side-panel-entity"
import { SidePanelContext } from "./side-panel-context"
import { WikiArticleDetailPanel } from "./wiki-article-detail-panel"

/**
 * Entity-aware detail panel that renders appropriate detail content
 * based on the active space and sidePanelContext. For notes, delegates
 * to SidePanelContext. For wiki articles, shows WikiArticleDetailPanel.
 * Graph shows a placeholder.
 */
export function SidePanelDetail() {
  const activeSpace = useActiveSpace()
  const entity = useSidePanelEntity()

  if (activeSpace === "ontology") {
    return <GraphDetailPlaceholder />
  }

  if (entity.type === "wiki") {
    return <WikiArticleDetailPanel article={entity.wikiArticle} />
  }

  // type === "note" or null — existing behavior
  return <SidePanelContext />
}

function GraphDetailPlaceholder() {
  return (
    <div className="flex flex-1 items-center justify-center p-4 text-muted-foreground text-note">
      Select a node to see details
    </div>
  )
}
