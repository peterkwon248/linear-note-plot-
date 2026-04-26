"use client"

import { useCallback } from "react"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { IconWiki } from "@/components/plot-icons"
import { showNotePreviewById, hideNotePreview } from "@/components/editor/note-hover-preview"
import type { BacklinkSource } from "@/hooks/use-backlinks-with-context"
import { cn } from "@/lib/utils"

const MAX_VISIBLE_CONTEXTS = 2

/**
 * BacklinkCard — Obsidian-style card for the Connections panel.
 *
 * Layout:
 *   ┌─────────────────────────────────────────┐
 *   │ [icon] Title                       [↔]   │  ← title row
 *   │ "…snippet around the [[link]]…"          │  ← context row
 *   │ "…second context…"                       │  ← (up to 2 visible)
 *   │                                  +N more │
 *   └─────────────────────────────────────────┘
 *
 * Hovering the card triggers the global note hover preview after the
 * standard 300ms delay (handled by `showNotePreviewById`).
 */
export function BacklinkCard({
  source,
  mutual = false,
  onClick,
}: {
  source: BacklinkSource
  /** Show ↔ badge (target also links back to this source). */
  mutual?: boolean
  onClick: () => void
}) {
  const onMouseEnter = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    showNotePreviewById(e.currentTarget, source.sourceId)
  }, [source.sourceId])

  const onMouseLeave = useCallback(() => {
    hideNotePreview()
  }, [])

  const Icon = source.sourceKind === "wiki" ? IconWiki : FileText
  const visibleContexts = source.contexts.slice(0, MAX_VISIBLE_CONTEXTS)
  const remaining = Math.max(0, source.contexts.length - MAX_VISIBLE_CONTEXTS)

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "group block w-full text-left rounded-md px-2 py-1.5",
        "transition-colors hover:bg-hover-bg",
        // Subtle border highlight on hover so the snippet feels distinct
        // from the surrounding list.
        "border border-transparent hover:border-border-subtle",
      )}
    >
      {/* Title row */}
      <div className="flex items-center gap-1.5">
        <Icon
          className="shrink-0 text-muted-foreground/60"
          size={13}
          weight="regular"
        />
        <span className="truncate text-note text-muted-foreground group-hover:text-foreground transition-colors">
          {source.sourceTitle || "Untitled"}
        </span>
        {mutual && (
          <span
            className="ml-auto shrink-0 text-2xs text-accent/60 font-medium"
            title="Mutual link"
          >
            ↔
          </span>
        )}
      </div>

      {/* Context snippets (Obsidian-style italic muted) */}
      {source.loading ? (
        <p className="mt-0.5 ml-[18px] text-2xs italic text-muted-foreground/40">
          Loading context…
        </p>
      ) : visibleContexts.length > 0 ? (
        <div className="mt-0.5 ml-[18px] space-y-0.5">
          {visibleContexts.map((ctx) => (
            <p
              key={ctx.blockId}
              className={cn(
                "text-2xs italic leading-snug line-clamp-2",
                "text-muted-foreground/70 group-hover:text-muted-foreground",
              )}
            >
              {ctx.text || <span className="opacity-50">(empty block)</span>}
            </p>
          ))}
          {remaining > 0 && (
            <p className="text-[10px] text-muted-foreground/40">
              +{remaining} more
            </p>
          )}
        </div>
      ) : null}
    </button>
  )
}
