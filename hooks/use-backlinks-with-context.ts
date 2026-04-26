"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { usePlotStore } from "@/lib/store"
import { getBody, getAllBodies } from "@/lib/note-body-store"
import { getBlockBody } from "@/lib/wiki-block-body-store"
import {
  extractBlockLinkContexts,
  type BlockLinkContext,
} from "@/lib/body-helpers"
import {
  ensureMentionIndexBuilt,
  getMentionSources,
} from "@/lib/mention-index-store"

export interface BacklinkSource {
  sourceId: string
  sourceKind: "note" | "wiki"
  sourceTitle: string
  /** Block-level contexts. Empty when contentJson hasn't loaded or no atoms matched. */
  contexts: BlockLinkContext[]
  /** True while contentJson is being fetched from IDB. */
  loading: boolean
}

/**
 * Resolve sources that link to a target note/wiki using the existing
 * title-based linksOut index. Cheap — store-only, synchronous.
 */
function useTitleMatchSources(
  target: { kind: "note" | "wiki"; id: string } | null,
): { id: string; kind: "note" | "wiki"; title: string }[] {
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)

  return useMemo(() => {
    if (!target) return []

    // Resolve target's display titles (title + aliases)
    let titles: string[] = []
    if (target.kind === "note") {
      const note = notes.find((n) => n.id === target.id)
      if (!note) return []
      titles = [note.title, ...(note.aliases ?? [])]
        .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
        .map((t) => t.toLowerCase())
    } else {
      const article = wikiArticles.find((a) => a.id === target.id)
      if (!article) return []
      titles = [article.title, ...((article.aliases as string[] | undefined) ?? [])]
        .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
        .map((t) => t.toLowerCase())
    }

    if (titles.length === 0) return []

    const titleSet = new Set(titles)
    const sources: { id: string; kind: "note" | "wiki"; title: string }[] = []

    // Notes whose linksOut intersects target titles
    for (const n of notes) {
      if (n.id === target.id) continue
      if (n.trashed) continue
      if (!n.linksOut?.some((l) => titleSet.has(l.toLowerCase()))) continue
      sources.push({ id: n.id, kind: "note", title: n.title || "Untitled" })
    }

    // Wiki articles whose blocks reference titles via [[wikilinks]] in plaintext
    // OR via note-ref blocks (when target is a note)
    for (const article of wikiArticles) {
      if (article.id === target.id) continue
      let matched = false

      // note-ref blocks (only when target is note)
      if (target.kind === "note" && article.blocks) {
        if (article.blocks.some((b: { type: string; noteId?: string }) =>
          b.type === "note-ref" && b.noteId === target.id
        )) {
          matched = true
        }
      }

      // plaintext [[wikilink]] scan in text/section blocks
      if (!matched && article.blocks) {
        for (const b of article.blocks) {
          const content = (b.content || b.title || "") as string
          if (!content) continue
          const linkMatches = content.match(/\[\[([^\]]+)\]\]/g)
          if (!linkMatches) continue
          for (const m of linkMatches) {
            let t = m.slice(2, -2).toLowerCase()
            if (t.startsWith("wiki:")) t = t.slice(5)
            t = t.trim()
            if (titleSet.has(t)) {
              matched = true
              break
            }
          }
          if (matched) break
        }
      }

      if (matched) sources.push({ id: article.id, kind: "wiki", title: article.title })
    }

    return sources
  }, [target, notes, wikiArticles])
}

/**
 * Backlinks with rich block-level context for a target note/wiki.
 *
 * Strategy:
 *   1. Synchronously compute title-match sources from store (fast).
 *   2. Asynchronously load each source's contentJson from IDB and extract
 *      block contexts (wikilink + noteEmbed + wikiEmbed atoms).
 *   3. Merge async results back into the source list, keeping `loading: true`
 *      while in-flight.
 *
 * Returns sources with empty `contexts` until IDB loads complete; this lets
 * callers render the title row immediately and fill in snippets when ready.
 */
export function useBacklinksWithContext(
  target: { kind: "note" | "wiki"; id: string } | null,
): BacklinkSource[] {
  const titleMatches = useTitleMatchSources(target)
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)

  // Keyed by `${sourceKind}:${sourceId}` → contexts
  const [contextMap, setContextMap] = useState<Record<string, BlockLinkContext[]>>({})
  // Sources currently being loaded
  const [loadingSet, setLoadingSet] = useState<Set<string>>(new Set())

  // ── Mention-only sources (async IDB scan) ──────────────────────────
  // Notes that mention the target via @-mention atoms but are NOT in titleMatches
  // (i.e., they don't have [[wikilinks]] or linksOut entries for this target).
  const [mentionOnlySources, setMentionOnlySources] = useState<
    { id: string; kind: "note"; title: string }[]
  >([])

  // Latest target signature — used to invalidate stale promise resolutions.
  const targetKey = target ? `${target.kind}:${target.id}` : null
  const targetKeyRef = useRef<string | null>(targetKey)

  // Title for unresolved-wikilink fallback matching
  const targetTitle = useMemo(() => {
    if (!target) return undefined
    if (target.kind === "note") {
      return notes.find((n) => n.id === target.id)?.title
    }
    return wikiArticles.find((a) => a.id === target.id)?.title
  }, [target, notes, wikiArticles])

  // Reset cache when target changes
  useEffect(() => {
    targetKeyRef.current = targetKey
    setContextMap({})
    setLoadingSet(new Set())
    setMentionOnlySources([])
  }, [targetKey])

  // ── Async: look up mention-only sources via the IDB mention index ──
  // O(1) IDB read instead of scanning every note's contentJson. The index
  // is built lazily on first call and incrementally maintained by
  // persistBody/removeBody.
  useEffect(() => {
    if (!target) return
    if (!target.id) return

    const localTargetKey = `${target.kind}:${target.id}`
    let cancelled = false

    const lookup = async () => {
      // Ensure the one-time build has completed (fast no-op on subsequent runs).
      await ensureMentionIndexBuilt(async () => {
        const bodies = await getAllBodies()
        return bodies.map((b) => ({ id: b.id, contentJson: b.contentJson }))
      }).catch(() => {})

      if (cancelled || targetKeyRef.current !== localTargetKey) return

      const sourceIds = await getMentionSources(target.id)
      if (cancelled || targetKeyRef.current !== localTargetKey) return

      const titleMatchIds = new Set(
        titleMatches.filter((s) => s.kind === "note").map((s) => s.id),
      )

      // Filter to: (a) notes that still exist + aren't trashed,
      //            (b) not the target itself,
      //            (c) not already covered by title-match (which has plaintext links).
      const found: { id: string; kind: "note"; title: string }[] = []
      for (const id of sourceIds) {
        if (id === target.id) continue
        if (titleMatchIds.has(id)) continue
        const note = notes.find((n) => n.id === id)
        if (!note || note.trashed) continue
        found.push({ id, kind: "note", title: note.title || "Untitled" })
      }

      setMentionOnlySources(found)
    }

    void lookup()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, targetKey, notes])

  // Merged source list: title-match + mention-only (deduplicated)
  const allSources = useMemo(() => {
    const seen = new Set(titleMatches.map((s) => `${s.kind}:${s.id}`))
    const extras = mentionOnlySources.filter((s) => !seen.has(`${s.kind}:${s.id}`))
    return [...titleMatches, ...extras]
  }, [titleMatches, mentionOnlySources])

  // Load contentJson for each source in parallel and extract contexts.
  useEffect(() => {
    if (!target) return

    const localTargetKey = targetKey
    // Filter to sources we haven't loaded yet
    const toLoad = allSources.filter((s) => {
      const key = `${s.kind}:${s.id}`
      return !(key in contextMap) && !loadingSet.has(key)
    })
    if (toLoad.length === 0) return

    // Mark as loading
    setLoadingSet((prev) => {
      const next = new Set(prev)
      for (const s of toLoad) next.add(`${s.kind}:${s.id}`)
      return next
    })

    let cancelled = false

    async function loadOne(src: { id: string; kind: "note" | "wiki" }) {
      const key = `${src.kind}:${src.id}`
      try {
        let contexts: BlockLinkContext[] = []

        if (src.kind === "note") {
          const body = await getBody(src.id)
          if (body?.contentJson) {
            contexts = extractBlockLinkContexts(body.contentJson, {
              kind: target!.kind,
              id: target!.id,
              title: targetTitle,
            })
          }
        } else {
          // Wiki source: walk every text block's contentJson independently and
          // merge the resulting contexts. Each block's contentJson is itself a
          // doc-shaped TipTap tree (block.id is set as the top-level UniqueID
          // when it lacks one) so extractBlockLinkContexts works directly.
          const article = wikiArticles.find((a) => a.id === src.id)
          if (article?.blocks?.length) {
            const textBlocks = article.blocks.filter(
              (b: { type: string }) => b.type === "text",
            )

            // Two sources of contentJson per text block:
            //   (a) hydrated copy already in store (article.blocks[].contentJson)
            //   (b) fresh load from plot-wiki-block-bodies IDB
            // Prefer (a) when present, fall back to (b). Empty contentJson →
            // skip (plaintext-only blocks won't have any wikilink atoms anyway —
            // they show up via the title/[[]] plaintext scan in useTitleMatchSources).
            const aggregated: BlockLinkContext[] = []
            await Promise.all(
              textBlocks.map(async (block: { id: string; contentJson?: Record<string, unknown> }) => {
                let json: unknown = block.contentJson ?? null
                if (!json) {
                  const body = await getBlockBody(block.id)
                  if (body?.contentJson) json = body.contentJson
                }
                if (!json) return
                const blockContexts = extractBlockLinkContexts(json, {
                  kind: target!.kind,
                  id: target!.id,
                  title: targetTitle,
                })
                // Stamp each context with the wiki block id so callers can
                // dedupe and (eventually) anchor-scroll into the right block.
                // extractBlockLinkContexts already returns a `blockId` field
                // for the inner top-level node — for wiki we prepend the
                // outer block id to keep results unique across blocks.
                for (const ctx of blockContexts) {
                  aggregated.push({
                    ...ctx,
                    blockId: `${block.id}:${ctx.blockId}`,
                  })
                }
              }),
            )

            // Dedupe by blockId — a single TipTap block with multiple matching
            // atoms already collapsed to one entry inside extractBlockLinkContexts.
            const seen = new Set<string>()
            for (const ctx of aggregated) {
              if (seen.has(ctx.blockId)) continue
              seen.add(ctx.blockId)
              contexts.push(ctx)
            }
          }
        }

        if (cancelled || targetKeyRef.current !== localTargetKey) return

        setContextMap((prev) => ({ ...prev, [key]: contexts }))
        setLoadingSet((prev) => {
          if (!prev.has(key)) return prev
          const next = new Set(prev)
          next.delete(key)
          return next
        })
      } catch {
        if (cancelled || targetKeyRef.current !== localTargetKey) return
        // Mark as resolved with empty contexts to avoid retry loops
        setContextMap((prev) => ({ ...prev, [key]: [] }))
        setLoadingSet((prev) => {
          if (!prev.has(key)) return prev
          const next = new Set(prev)
          next.delete(key)
          return next
        })
      }
    }

    void Promise.all(toLoad.map((s) => loadOne(s)))

    return () => {
      cancelled = true
    }
    // We intentionally exclude contextMap/loadingSet from deps to avoid
    // re-running on each batch update — the diff is computed inside.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSources, target, targetKey, targetTitle])

  return useMemo(() => {
    return allSources.map((s) => {
      const key = `${s.kind}:${s.id}`
      return {
        sourceId: s.id,
        sourceKind: s.kind,
        sourceTitle: s.title,
        contexts: contextMap[key] ?? [],
        loading: loadingSet.has(key) && !(key in contextMap),
      }
    })
  }, [allSources, contextMap, loadingSet])
}
