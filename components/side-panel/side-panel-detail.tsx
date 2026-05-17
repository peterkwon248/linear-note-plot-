"use client"

import { usePlotStore } from "@/lib/store"
import { useActiveSpace } from "@/lib/table-route"
import { useSidePanelEntity } from "./use-side-panel-entity"
import { SidePanelContext } from "./side-panel-context"
import { WikiArticleDetailPanel } from "./wiki-article-detail-panel"
import { ReferenceDetailPanel } from "./reference-detail-panel"
import { TemplateDetailPanel } from "./template-detail-panel"
import { FileDetailPanel } from "./file-detail-panel"
import { BookDetailPanel } from "./book-detail-panel"
import { TagDetailPanel } from "./tag-detail-panel"
import { StickerDetailPanel } from "./sticker-detail-panel"
import { LabelDetailPanel } from "./label-detail-panel"
import { CategoryDetailPanel } from "./category-detail-panel"
import { WikiTemplateDetailPanel } from "./wiki-template-detail-panel"

/**
 * Entity-aware detail panel that renders appropriate detail content
 * based on the active space and sidePanelContext. For notes, delegates
 * to SidePanelContext. For wiki articles, shows WikiArticleDetailPanel.
 * For references, shows ReferenceDetailPanel. Graph shows a placeholder.
 */
export function SidePanelDetail() {
  const activeSpace = useActiveSpace()
  const entity = useSidePanelEntity()
  const sidePanelContext = usePlotStore((s) => s.sidePanelContext)
  const wikiCategories = usePlotStore((s) => s.wikiCategories)
  const wikiTemplates = usePlotStore((s) => Array.isArray(s.wikiTemplates) ? s.wikiTemplates : [])

  if (activeSpace === "ontology") {
    return <GraphDetailPlaceholder />
  }

  // Wiki category — direct lookup (not in useSidePanelEntity union)
  if (sidePanelContext?.type === "wiki-category") {
    const category = wikiCategories.find((c) => c.id === sidePanelContext.id)
    if (category) {
      return <CategoryDetailPanel category={category} />
    }
    return (
      <div className="flex flex-1 items-center justify-center p-4 text-muted-foreground text-note">
        Category not found
      </div>
    )
  }

  // Wiki template — direct lookup (CategoryDetailPanel 패턴 정합).
  // useSidePanelEntity 안 거치는 이유: 분기 7개 추가하는 boilerplate 회피.
  if (sidePanelContext?.type === "wikiTemplate") {
    const template = wikiTemplates.find((t) => t.id === sidePanelContext.id)
    if (template) {
      return <WikiTemplateDetailPanel template={template} />
    }
    return (
      <div className="flex flex-1 items-center justify-center p-4 text-muted-foreground text-note">
        Template not found
      </div>
    )
  }

  if (entity.type === "wiki") {
    return <WikiArticleDetailPanel article={entity.wikiArticle} />
  }

  if (entity.type === "reference" && entity.referenceId) {
    return <ReferenceDetailPanel referenceId={entity.referenceId} />
  }

  if (entity.type === "template" && entity.template) {
    return <TemplateDetailPanel template={entity.template} />
  }

  if (entity.type === "file" && entity.attachment) {
    return <FileDetailPanel attachment={entity.attachment} />
  }

  if (entity.type === "book" && entity.book) {
    return <BookDetailPanel book={entity.book} />
  }

  if (entity.type === "tag" && entity.tag) {
    return <TagDetailPanel tag={entity.tag} />
  }

  if (entity.type === "sticker" && entity.sticker) {
    return <StickerDetailPanel sticker={entity.sticker} />
  }

  if (entity.type === "label" && entity.label) {
    return <LabelDetailPanel label={entity.label} />
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
