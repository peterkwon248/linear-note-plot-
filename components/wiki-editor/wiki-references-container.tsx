"use client"

/**
 * WikiReferencesContainer — 위키용 어댑터.
 *
 * article.blocks 를 순회하고 IDB 에서 contentJson 을 로드해 footnoteRef 를 수집,
 * article.referenceIds 와 합쳐 ReferencesBox 에 전달한다.
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import type { WikiArticle } from "@/lib/types"
import { usePlotStore } from "@/lib/store"
import { getBlockBody } from "@/lib/wiki-block-body-store"
import { ReferencesBox, type FootnoteItem } from "@/components/editor/references-box"

interface WikiReferencesContainerProps {
  article: WikiArticle
  editable?: boolean
}

interface RawFootnote {
  id: string
  content: string
  contentJson: Record<string, unknown> | null
  referenceId: string | null
}

function extractFootnoteRefs(
  json: Record<string, unknown> | null | undefined,
): RawFootnote[] {
  if (!json) return []
  const results: RawFootnote[] = []
  function walk(node: unknown) {
    if (!node || typeof node !== "object") return
    const n = node as Record<string, unknown>
    const attrs = n.attrs as Record<string, unknown> | undefined
    if (n.type === "footnoteRef" && attrs?.id) {
      results.push({
        id: attrs.id as string,
        content: (attrs.content as string) ?? "",
        contentJson: (attrs.contentJson as Record<string, unknown>) ?? null,
        referenceId: (attrs.referenceId as string) ?? null,
      })
    }
    if (Array.isArray(n.content)) {
      for (const child of n.content) walk(child)
    }
  }
  walk(json)
  return results
}

export function WikiReferencesContainer({
  article,
  editable = false,
}: WikiReferencesContainerProps) {
  const addArticleReference = usePlotStore((s) => s.addArticleReference)
  const removeArticleReference = usePlotStore((s) => s.removeArticleReference)
  const createReference = usePlotStore((s) => s.createReference)

  const [blockContents, setBlockContents] = useState<
    Map<string, Record<string, unknown> | null>
  >(new Map())

  const textBlockIds = useMemo(
    () => article.blocks.filter((b) => b.type === "text").map((b) => b.id),
    [article.blocks],
  )

  useEffect(() => {
    let cancelled = false
    async function loadAll() {
      const entries = new Map<string, Record<string, unknown> | null>()
      await Promise.all(
        textBlockIds.map(async (blockId) => {
          const block = article.blocks.find((b) => b.id === blockId)
          if (
            block?.contentJson &&
            Object.keys(block.contentJson).length > 0
          ) {
            entries.set(blockId, block.contentJson)
            return
          }
          const body = await getBlockBody(blockId)
          entries.set(blockId, body?.contentJson ?? null)
        }),
      )
      if (!cancelled) setBlockContents(entries)
    }
    loadAll()
    return () => {
      cancelled = true
    }
  }, [textBlockIds, article.blocks])

  // Collect footnotes in document order, globally numbered, deduped by id
  const footnotes = useMemo<FootnoteItem[]>(() => {
    const results: FootnoteItem[] = []
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
          contentJson: ref.contentJson,
          referenceId: ref.referenceId,
          number: globalNum,
        })
      }
    }
    return results
  }, [article.blocks, blockContents])

  // Bibliography = article.referenceIds 중 각주에 이미 연결된 것 제외 (중복 방지)
  const bibliographyRefIds = useMemo(() => {
    const linked = new Set<string>()
    for (const fn of footnotes) {
      if (fn.referenceId) linked.add(fn.referenceId)
    }
    return (article.referenceIds ?? []).filter((id) => !linked.has(id))
  }, [article.referenceIds, footnotes])

  const handleScrollToFootnote = useCallback((id: string) => {
    const el = document.querySelector(`[data-footnote-id="${id}"]`)
    el?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [])

  const handleLinkReference = useCallback(
    (refId: string) => {
      addArticleReference(article.id, refId)
    },
    [article.id, addArticleReference],
  )

  const handleCreateAndLinkReference = useCallback(
    (ref: { title: string; content: string; fields: Array<{ key: string; value: string }> }) => {
      const refId = createReference(ref as Parameters<typeof createReference>[0])
      addArticleReference(article.id, refId)
    },
    [article.id, createReference, addArticleReference],
  )

  const handleRemoveReference = useCallback(
    (refId: string) => {
      removeArticleReference(article.id, refId)
    },
    [article.id, removeArticleReference],
  )

  return (
    <ReferencesBox
      footnotes={footnotes}
      bibliographyRefIds={bibliographyRefIds}
      editable={editable}
      onScrollToFootnote={handleScrollToFootnote}
      onLinkReference={handleLinkReference}
      onCreateAndLinkReference={handleCreateAndLinkReference}
      onRemoveReference={handleRemoveReference}
    />
  )
}
