"use client"

/**
 * WikiTocBlock — Phase 2-2-C.
 *
 * Block-wrapped Table of Contents. Pre-Phase 2-2-C this was an inline
 * `CollapsibleTOC` component inside WikiArticleRenderer, wired via a scalar
 * `WikiArticle.tocStyle`. Now each TOC is a first-class `WikiBlock` (type="toc")
 * whose position is controlled by `columnAssignments` like any other block.
 *
 * Sections are derived live from `article.blocks` — the block itself stores
 * only display state (`tocCollapsed`, `hiddenLevels`).
 */

import { useMemo, useState, useEffect } from "react"
import { usePlotStore } from "@/lib/store"
import type { WikiBlock } from "@/lib/types"
import { computeSectionNumbers } from "@/lib/wiki-block-utils"
import { cn } from "@/lib/utils"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { DotsSixVertical } from "@phosphor-icons/react/dist/ssr/DotsSixVertical"
import type { DraggableSyntheticListeners } from "@dnd-kit/core"

export interface WikiTocBlockProps {
  block: WikiBlock
  articleId: string
  editable?: boolean
  onUpdate?: (patch: Partial<Omit<WikiBlock, "id">>) => void
  onDelete?: () => void
  dragHandleProps?: DraggableSyntheticListeners
}

export function WikiTocBlock({ block, articleId, editable = false, onUpdate, onDelete, dragHandleProps }: WikiTocBlockProps) {
  const blocks = usePlotStore((s) => s.wikiArticles.find((a) => a.id === articleId)?.blocks ?? [])

  const sectionNumbers = useMemo(() => computeSectionNumbers(blocks), [blocks])
  const hidden = block.hiddenLevels ?? []
  const sections = useMemo(() => {
    const out: { id: string; title: string; level: number; number: string }[] = []
    for (const b of blocks) {
      if (b.type !== "section") continue
      const level = b.level ?? 2
      if (hidden.includes(level)) continue
      out.push({
        id: b.id,
        title: b.title || "Untitled",
        level,
        number: sectionNumbers.get(b.id) ?? "",
      })
    }
    return out
  }, [blocks, sectionNumbers, hidden])

  // Local open state mirrors block.tocCollapsed — controlled once persisted.
  const [open, setOpen] = useState(!(block.tocCollapsed ?? false))
  useEffect(() => {
    setOpen(!(block.tocCollapsed ?? false))
  }, [block.tocCollapsed])

  // Listen for plot:set-all-collapsed so the TOC follows the global toggle.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ collapsed: boolean }>).detail
      if (typeof detail?.collapsed === "boolean") setOpen(!detail.collapsed)
    }
    window.addEventListener("plot:set-all-collapsed", handler as EventListener)
    return () => window.removeEventListener("plot:set-all-collapsed", handler as EventListener)
  }, [])

  const handleToggle = () => {
    const next = !open
    setOpen(next)
    // Only persist in editable mode — view mode treats this as ephemeral.
    if (editable) onUpdate?.({ tocCollapsed: !next })
  }

  const dragHandle = editable && dragHandleProps ? (
    <div
      className="absolute -left-7 top-2 z-10 flex h-6 w-6 cursor-grab items-center justify-center rounded-md text-muted-foreground/0 transition-colors group-hover/toc-block:text-muted-foreground/40 hover:!text-muted-foreground active:cursor-grabbing"
      {...dragHandleProps}
    >
      <DotsSixVertical size={14} weight="bold" />
    </div>
  ) : null

  if (sections.length === 0) {
    if (!editable) return null
    return (
      <div className="group/toc-block relative max-w-sm rounded-lg border border-dashed border-border-subtle px-4 py-3 text-2xs text-muted-foreground/50">
        {dragHandle}
        Contents — add sections to populate
      </div>
    )
  }

  return (
    <div className="group/toc-block relative max-w-sm rounded-lg border border-border bg-secondary/30">
      {dragHandle}
      <button onClick={handleToggle} className="flex w-full items-center gap-2 px-4 py-3 text-left">
        <span className="font-bold text-foreground/80">Contents</span>
        <CaretDown
          size={14}
          weight="bold"
          className={cn("text-muted-foreground transition-transform duration-200", !open && "-rotate-90")}
        />
      </button>
      {open && (
        <div className="space-y-1 px-4 pb-3.5">
          {sections.map((s) => (
            <div key={s.id} style={{ paddingLeft: (s.level - 2) * 16 }}>
              <button
                onClick={() => {
                  document.getElementById(`wiki-block-${s.id}`)?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  })
                }}
                className="text-note text-accent/80 transition-colors hover:text-accent"
              >
                {s.number}. {s.title}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
