"use client"

import { useState, useMemo, useCallback, useRef } from "react"
import { usePlotStore } from "@/lib/store"
import type { WikiArticle, WikiBlock, WikiSectionIndex } from "@/lib/types"
import { WikiBlockRenderer } from "./wiki-block-renderer"
import { useWikiBlockContent } from "@/hooks/use-wiki-block-content"
import { cn } from "@/lib/utils"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight"

/* ── Section number computation (reused from wiki-article-view) ── */

function computeSectionNumbers(blocks: WikiBlock[]): Map<string, string> {
  const result = new Map<string, string>()
  const sectionBlocks = blocks.filter((b) => b.type === "section")
  if (sectionBlocks.length === 0) return result

  const minLevel = Math.min(...sectionBlocks.map((b) => b.level ?? 2))
  const counters: number[] = []

  for (const block of blocks) {
    if (block.type !== "section") continue
    const depth = (block.level ?? 2) - minLevel
    while (counters.length <= depth) counters.push(0)
    counters[depth]++
    for (let i = depth + 1; i < counters.length; i++) counters[i] = 0
    result.set(block.id, counters.slice(0, depth + 1).join("."))
  }
  return result
}

/* ── Collapsible TOC (inline, namu-wiki style) ── */

function CollapsibleTOC({ sections, sectionNumbers }: {
  sections: WikiSectionIndex[]
  sectionNumbers: Map<string, string>
}) {
  const [open, setOpen] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState<number | null>(null)

  const handleResizeStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    const el = containerRef.current
    if (!el) return
    const startX = e.clientX
    const startW = el.offsetWidth

    const onMove = (ev: PointerEvent) => {
      const newW = Math.max(180, Math.min(600, startW + ev.clientX - startX))
      setWidth(newW)
    }
    const onUp = () => {
      document.removeEventListener("pointermove", onMove)
      document.removeEventListener("pointerup", onUp)
    }
    document.addEventListener("pointermove", onMove)
    document.addEventListener("pointerup", onUp)
  }, [])

  if (sections.length === 0) return null

  return (
    <div
      ref={containerRef}
      className="mb-6 rounded-lg border border-white/[0.08] bg-white/[0.02] inline-block min-w-[180px] relative"
      style={width ? { width } : { maxWidth: 400 }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-3 w-full text-left"
      >
        <span className="text-sm font-bold text-white/80">Contents</span>
        <CaretDown
          size={14}
          weight="bold"
          className={cn(
            "text-white/40 transition-transform duration-200",
            !open && "-rotate-90"
          )}
        />
      </button>
      {open && (
        <div className="px-4 pb-3.5 space-y-1">
          {sections.map((s) => {
            const num = sectionNumbers.get(s.id) ?? ""
            return (
              <div
                key={s.id}
                style={{ paddingLeft: (s.level - 2) * 16 }}
              >
                <button
                  onClick={() => {
                    document.getElementById(`enc-block-${s.id}`)?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    })
                  }}
                  className="text-sm text-accent/70 hover:text-accent transition-colors"
                >
                  {num}. {s.title}
                </button>
              </div>
            )
          })}
        </div>
      )}
      {/* Resize handle */}
      <div
        onPointerDown={handleResizeStart}
        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize group hover:bg-accent/20 rounded-r-lg transition-colors"
      >
        <div className="absolute right-0.5 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full bg-white/10 group-hover:bg-accent/50 transition-colors" />
      </div>
    </div>
  )
}

/* ── Encyclopedia Block — section headings with namu-wiki styling ── */

function EncyclopediaSectionHeading({
  block,
  sectionNumber,
  collapsed,
  onToggle,
}: {
  block: WikiBlock
  sectionNumber: string
  collapsed: boolean
  onToggle: () => void
}) {
  const level = block.level ?? 2
  return (
    <div
      id={`enc-block-${block.id}`}
      className="mt-8 mb-3 border-b border-white/[0.08] pb-1 flex items-center gap-2"
    >
      <button
        onClick={onToggle}
        className="p-0.5 text-white/40 hover:text-white/70 transition-colors"
      >
        {collapsed
          ? <CaretRight size={14} weight="bold" />
          : <CaretDown size={14} weight="bold" />
        }
      </button>
      {level === 2 ? (
        <h2 className="text-xl font-bold text-white/90">
          {sectionNumber}. {block.title || "Untitled Section"}
        </h2>
      ) : level === 3 ? (
        <h3 className="text-base font-bold text-white/80">
          {sectionNumber}. {block.title || "Untitled Section"}
        </h3>
      ) : (
        <h4 className="text-sm font-bold text-white/70">
          {sectionNumber}. {block.title || "Untitled Section"}
        </h4>
      )}
    </div>
  )
}

/* ── Block renderer for encyclopedia layout ── */

function EncyclopediaContentBlock({ block, editable }: { block: WikiBlock; editable: boolean }) {
  const isImage = block.type === "image"
  return (
    <div
      id={`enc-block-${block.id}`}
      className={isImage ? "max-h-[400px] overflow-hidden" : undefined}
    >
      <WikiBlockRenderer block={block} editable={editable} />
    </div>
  )
}

/* ── Main Encyclopedia Layout ── */

interface WikiArticleEncyclopediaProps {
  article: WikiArticle
  isEditing: boolean
  onBack: () => void
}

export function WikiArticleEncyclopedia({ article, isEditing, onBack }: WikiArticleEncyclopediaProps) {
  const wikiCategories = usePlotStore((s) => s.wikiCategories)
  const updateWikiBlock = usePlotStore((s) => s.updateWikiBlock)

  // Section numbers
  const sectionNumbers = useMemo(
    () => computeSectionNumbers(article.blocks),
    [article.blocks]
  )

  // Category names from IDs
  const categoryNames = useMemo(() => {
    const ids = article.categoryIds ?? []
    return ids
      .map((id) => wikiCategories.find((c) => c.id === id)?.name)
      .filter(Boolean) as string[]
  }, [article.categoryIds, wikiCategories])

  // Collapse state: track collapsed sections locally (not persisted in encyclopedia view)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())

  const toggleSection = useCallback((blockId: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev)
      if (next.has(blockId)) next.delete(blockId)
      else next.add(blockId)
      return next
    })
  }, [])

  // Build visible blocks respecting collapsed sections
  const visibleBlocks = useMemo(() => {
    const result: WikiBlock[] = []
    let collapsingLevel: number | null = null

    for (const block of article.blocks) {
      if (block.type === "section") {
        const level = block.level ?? 2
        if (collapsingLevel !== null && level <= collapsingLevel) {
          collapsingLevel = null
        }
        result.push(block)
        if (collapsedSections.has(block.id)) {
          collapsingLevel = level
        }
      } else if (collapsingLevel === null) {
        result.push(block)
      }
    }
    return result
  }, [article.blocks, collapsedSections])

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Category tag row */}
      {categoryNames.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-10 pt-4 pb-2">
          <span className="text-2xs text-white/40">분류:</span>
          {categoryNames.map((name) => (
            <span
              key={name}
              className="text-2xs text-accent/70 hover:text-accent cursor-pointer transition-colors"
            >
              {name}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <div className="px-10 pt-2 pb-4">
        <h1 className="text-3xl font-bold text-white/90">{article.title}</h1>
        {article.aliases.length > 0 && (
          <p className="mt-1 text-note text-white/40">
            {article.aliases.join(", ")}
          </p>
        )}
      </div>

      {/* Main content area */}
      <div className="px-10 pb-8">
        {/* Infobox (float right) */}
        {article.infobox.length > 0 && (
          <div className="float-right ml-6 mb-4 w-[320px] rounded-lg border border-white/[0.08] bg-white/[0.02] overflow-hidden">
            <div className="bg-accent/20 px-4 py-2 text-center">
              <h3 className="text-ui font-bold text-white/90">{article.title}</h3>
            </div>
            <table className="w-full">
              <tbody>
                {article.infobox.map((entry) => (
                  <tr key={entry.key} className="border-t border-white/[0.06]">
                    <td className="px-3 py-2 text-2xs font-medium text-white/50 w-[100px] text-right align-top">
                      {entry.key}
                    </td>
                    <td className="px-3 py-2 text-note text-white/80">
                      {entry.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TOC (collapsible) */}
        <CollapsibleTOC
          sections={article.sectionIndex}
          sectionNumbers={sectionNumbers}
        />

        {/* Block rendering */}
        {visibleBlocks.map((block) => {
          if (block.type === "section") {
            const num = sectionNumbers.get(block.id) ?? ""
            return (
              <EncyclopediaSectionHeading
                key={block.id}
                block={block}
                sectionNumber={num}
                collapsed={collapsedSections.has(block.id)}
                onToggle={() => toggleSection(block.id)}
              />
            )
          }
          return <EncyclopediaContentBlock key={block.id} block={block} editable={isEditing} />
        })}

        {article.blocks.length === 0 && (
          <p className="py-8 text-center text-note text-white/40">
            This article has no content yet.
          </p>
        )}

        {/* Clear float */}
        <div className="clear-both" />
      </div>
    </div>
  )
}
