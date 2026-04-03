"use client"

import { useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import { useSidePanelEntity } from "./use-side-panel-entity"
import { ThreadPanel } from "@/components/editor/thread-panel"
import { ReflectionPanel } from "@/components/editor/reflection-panel"
import { ClockCounterClockwise } from "@phosphor-icons/react/dist/ssr/ClockCounterClockwise"
import { IconWiki } from "@/components/plot-icons"
import { formatDistanceToNow } from "date-fns"

export function SidePanelActivity() {
  const entity = useSidePanelEntity()
  const nestedReplies = usePlotStore((s) => s.viewStateByContext["all"]?.toggles?.nestedReplies === true)

  if (entity.type === "wiki") {
    return <WikiActivityPanel />
  }

  // Note or null — existing behavior
  const noteId = entity.type === "note" ? entity.noteId : null

  if (!noteId) return (
    <div className="flex flex-1 items-center justify-center p-8 text-center">
      <p className="text-note text-muted-foreground">Select a note to see activity</p>
    </div>
  )

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Thread */}
      <ThreadPanel noteId={noteId} nestedReplies={nestedReplies} />

      <div className="mx-4 border-b border-border" />

      {/* Reflections */}
      <ReflectionPanel noteId={noteId} />

      <div className="mx-4 border-b border-border" />

      {/* History placeholder */}
      <div className="px-4 py-3">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-muted-foreground"><ClockCounterClockwise size={16} weight="regular" /></span>
          <span className="text-2xs font-medium text-muted-foreground">History</span>
        </div>
        <span className="text-note text-muted-foreground">Coming soon</span>
      </div>
    </div>
  )
}

function WikiActivityPanel() {
  const entity = useSidePanelEntity()
  const article = entity.type === "wiki" ? entity.wikiArticle : null

  const stats = useMemo(() => {
    if (!article) return null
    const blocks = article.blocks ?? []
    return {
      blockCount: blocks.length,
      sectionCount: blocks.filter((b) => b.type === "section").length,
      imageCount: blocks.filter((b) => b.type === "image").length,
      layout: article.layout ?? "default",
      updatedAt: article.updatedAt,
    }
  }, [article])

  if (!article || !stats) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <p className="text-note text-muted-foreground">Select a wiki article to see activity</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Stats */}
      <div className="px-4 py-3">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-muted-foreground"><IconWiki size={16} /></span>
          <span className="text-2xs font-medium text-muted-foreground">Article Stats</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Blocks</span>
            <span className="text-note tabular-nums text-foreground">{stats.blockCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Sections</span>
            <span className="text-note tabular-nums text-foreground">{stats.sectionCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Images</span>
            <span className="text-note tabular-nums text-foreground">{stats.imageCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Layout</span>
            <span className="text-note text-foreground capitalize">{stats.layout}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-note text-muted-foreground">Last modified</span>
            <span className="text-note text-foreground">
              {formatDistanceToNow(new Date(stats.updatedAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-4 border-b border-border" />

      {/* Thread/Reflections not available */}
      <div className="px-4 py-3">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-muted-foreground"><ClockCounterClockwise size={16} weight="regular" /></span>
          <span className="text-2xs font-medium text-muted-foreground">Thread & Reflections</span>
        </div>
        <span className="text-note text-muted-foreground">
          Thread and Reflections are not available for wiki articles.
        </span>
      </div>
    </div>
  )
}
