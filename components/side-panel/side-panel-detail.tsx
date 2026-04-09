"use client"

import { useActiveSpace } from "@/lib/table-route"
import { useSidePanelEntity } from "./use-side-panel-entity"
import { SidePanelContext } from "./side-panel-context"
import { WikiArticleDetailPanel } from "./wiki-article-detail-panel"
import { ReferenceDetailPanel } from "./reference-detail-panel"

/**
 * Entity-aware detail panel that renders appropriate detail content
 * based on the active space and sidePanelContext. For notes, delegates
 * to SidePanelContext. For wiki articles, shows WikiArticleDetailPanel.
 * For references, shows ReferenceDetailPanel. Graph shows a placeholder.
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

  if (entity.type === "reference" && entity.referenceId) {
    return <ReferenceDetailPanel referenceId={entity.referenceId} />
  }

  // type === "note" or null — pass resolved noteId for pane-aware rendering
  return <SidePanelContext noteId={entity.noteId} />
}

function GraphDetailPlaceholder() {
  return (
    <div className="flex flex-1 items-center justify-center p-4 text-muted-foreground text-note">
      Select a node to see details
    </div>
  )
}
