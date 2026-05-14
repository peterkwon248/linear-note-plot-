"use client"

import { useSidePanelEntity } from "./use-side-panel-entity"
import { ActivityTimeline } from "@/components/activity/activity-timeline"
import { CommentsByEntity } from "@/components/comments/comments-by-entity"
import { ClockCounterClockwise } from "@phosphor-icons/react/dist/ssr/ClockCounterClockwise"
import type { EntityRef } from "@/lib/types"

/**
 * SidePanelActivity — entity-aware Activity tab.
 *
 * PR 5d (activity-unification, 2026-05-14): entityEvents 완비 후 모든 entity
 * (Note / Wiki / Template / Book / Tag / Sticker / File / Reference) 의
 * Activity 탭이 실제 timeline 표시. Comments는 Note / Wiki만 노출 (Template
 * / Book / Library entity는 collaboration 단위 X — PR #322 결정).
 */
export function SidePanelActivity() {
  const entity = useSidePanelEntity()

  if (entity.type === "wiki") {
    return (
      <div className="flex-1 overflow-y-auto">
        {/* Comments — block + entity-level, unified */}
        <CommentsByEntity entity={{ kind: "wiki", articleId: entity.wikiArticleId }} />

        <div className="mx-4 border-b border-border" />

        {/* History — wiki entityEvents */}
        <HistorySection entity={{ kind: "wiki", id: entity.wikiArticleId }} />
      </div>
    )
  }

  // Template / Book / Library entities (Tag / Sticker / File / Reference)
  // — collaboration 단위 X, Comments 생략. History만 노출.
  if (entity.type === "template" && entity.templateId) {
    return <SoloHistory entity={{ kind: "template", id: entity.templateId }} />
  }
  if (entity.type === "book" && entity.bookId) {
    return <SoloHistory entity={{ kind: "book", id: entity.bookId }} />
  }
  if (entity.type === "tag" && entity.tagId) {
    return <SoloHistory entity={{ kind: "tag", id: entity.tagId }} />
  }
  if (entity.type === "sticker" && entity.stickerId) {
    return <SoloHistory entity={{ kind: "sticker", id: entity.stickerId }} />
  }
  if (entity.type === "file" && entity.attachmentId) {
    return <SoloHistory entity={{ kind: "file", id: entity.attachmentId }} />
  }
  if (entity.type === "reference" && entity.referenceId) {
    return <SoloHistory entity={{ kind: "reference", id: entity.referenceId }} />
  }
  if (entity.type === "label" && entity.labelId) {
    return <SoloHistory entity={{ kind: "label", id: entity.labelId }} />
  }

  // Note or null
  const noteId = entity.type === "note" ? entity.noteId : null

  if (!noteId) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <p className="text-note text-muted-foreground">Select a note to see activity</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Comments — replaces legacy Thread + Reflection panels */}
      <CommentsByEntity entity={{ kind: "note", noteId }} />

      <div className="mx-4 border-b border-border" />

      {/* History */}
      <HistorySection entity={{ kind: "note", id: noteId }} />
    </div>
  )
}

/**
 * SoloHistory — wrapper for entities without Comments (Template / Book /
 * Library entities). Just renders the History section.
 */
function SoloHistory({ entity }: { entity: EntityRef }) {
  return (
    <div className="flex-1 overflow-y-auto">
      <HistorySection entity={entity} />
    </div>
  )
}

/**
 * HistorySection — shared History header + ActivityTimeline for any entity.
 * Replaces the per-entity "X history is not yet available" placeholders that
 * existed before PR 5 wire-up completed.
 */
function HistorySection({ entity }: { entity: EntityRef }) {
  return (
    <div className="px-4 py-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-muted-foreground"><ClockCounterClockwise size={16} weight="regular" /></span>
        <span className="text-2xs font-medium text-muted-foreground">History</span>
      </div>
      <ActivityTimeline entity={entity} />
    </div>
  )
}
