"use client"

import { useState, useEffect, useMemo } from "react"
import type { WikiArticle } from "@/lib/types"
import { usePlotStore } from "@/lib/store"
import { getBlockBody } from "@/lib/wiki-block-body-store"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { cn } from "@/lib/utils"

interface FootnoteEntry {
  id: string
  content: string
  referenceId: string | null
  blockId: string
  globalNumber: number
}

/** Extract footnoteRef nodes from a TipTap JSON document */
function extractFootnoteRefs(json: Record<string, unknown> | null | undefined): Array<{ id: string; content: string; referenceId: string | null }> {
  if (!json) return []
  const results: Array<{ id: string; content: string; referenceId: string | null }> = []
  function walk(node: any) {
    if (!node) return
    if (node.type === "footnoteRef" && node.attrs?.id) {
      results.push({
        id: node.attrs.id as string,
        content: (node.attrs.content as string) ?? "",
        referenceId: (node.attrs.referenceId as string) ?? null,
      })
    }
    if (Array.isArray(node.content)) {
      for (const child of node.content) walk(child)
    }
  }
  walk(json)
  return results
}

interface WikiFootnotesSectionProps {
  article: WikiArticle
}

export function WikiFootnotesSection({ article }: WikiFootnotesSectionProps) {
  const references = usePlotStore((s) => s.references)
  const [blockContents, setBlockContents] = useState<Map<string, Record<string, unknown> | null>>(new Map())
  const [collapsed, setCollapsed] = useState(false)

  // Load all text blocks' contentJson from IDB
  const textBlockIds = useMemo(
    () => article.blocks.filter((b) => b.type === "text").map((b) => b.id),
    [article.blocks]
  )

  useEffect(() => {
    let cancelled = false
    async function loadAll() {
      const entries = new Map<string, Record<string, unknown> | null>()
      await Promise.all(
        textBlockIds.map(async (blockId) => {
          // Check in-memory first (block.contentJson from store)
          const block = article.blocks.find((b) => b.id === blockId)
          if (block?.contentJson && Object.keys(block.contentJson).length > 0) {
            entries.set(blockId, block.contentJson)
            return
          }
          // Fall back to IDB
          const body = await getBlockBody(blockId)
          entries.set(blockId, body?.contentJson ?? null)
        })
      )
      if (!cancelled) setBlockContents(entries)
    }
    loadAll()
    return () => { cancelled = true }
  }, [textBlockIds, article.blocks])

  // Collect all footnotes in document order
  const footnotes = useMemo(() => {
    const results: FootnoteEntry[] = []
    const seen = new Set<string>()
    let globalNum = 0

    for (const block of article.blocks) {
      if (block.type !== "text") continue
      const json = blockContents.get(block.id)
      const refs = extractFootnoteRefs(json)
      for (const ref of refs) {
        if (seen.has(ref.id)) continue
        seen.add(ref.id)
        globalNum++
        results.push({
          id: ref.id,
          content: ref.content,
          referenceId: ref.referenceId,
          blockId: block.id,
          globalNumber: globalNum,
        })
      }
    }
    return results
  }, [article.blocks, blockContents])

  // Listen for scroll-to-footnote events from inline badges
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail?.id) return
      // Auto-expand if collapsed
      setCollapsed(false)
      requestAnimationFrame(() => {
        const el = document.querySelector(`[data-wiki-footnote-id="${detail.id}"]`)
        el?.scrollIntoView({ behavior: "smooth", block: "center" })
      })
    }
    window.addEventListener("plot:scroll-to-footnote", handler)
    return () => window.removeEventListener("plot:scroll-to-footnote", handler)
  }, [])

  if (footnotes.length === 0) return null

  return (
    <div className="mt-10 border-t border-border/40 pt-4">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 mb-3 group"
      >
        <h3 className="text-lg font-semibold text-foreground/80">Footnotes</h3>
        <CaretDown
          size={14}
          weight="bold"
          className={cn(
            "text-muted-foreground/40 transition-transform duration-200",
            collapsed && "-rotate-90"
          )}
        />
        <span className="text-2xs text-muted-foreground/40 tabular-nums">{footnotes.length}</span>
      </button>

      {!collapsed && (
        <ol className="space-y-1.5 text-note">
          {footnotes.map((fn) => {
            const ref = fn.referenceId ? references[fn.referenceId] : null
            const urlField = ref?.fields.find((f) => f.key.toLowerCase() === "url")
            const url = urlField?.value || null

            return (
              <li
                key={fn.id}
                data-wiki-footnote-id={fn.id}
                className="flex items-start gap-2 rounded-md px-2 py-1 hover:bg-hover-bg transition-colors"
              >
                <span className="shrink-0 text-accent/70 font-semibold tabular-nums w-5 text-right pt-0.5">
                  {fn.globalNumber}.
                </span>
                <button
                  onClick={() => {
                    // Scroll back to inline reference
                    const el = document.querySelector(`[data-footnote-id="${fn.id}"]`)
                    el?.scrollIntoView({ behavior: "smooth", block: "center" })
                  }}
                  className="shrink-0 text-accent/50 hover:text-accent transition-colors pt-0.5"
                  title="Jump to reference"
                >
                  ^
                </button>
                <span className="text-foreground/70 flex-1">
                  {fn.content || <span className="text-muted-foreground/30 italic">Empty footnote</span>}
                  {url && (
                    <>
                      {" "}
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent/60 hover:text-accent hover:underline transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {url.replace(/^https?:\/\//, "").split("/")[0]}
                      </a>
                    </>
                  )}
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
