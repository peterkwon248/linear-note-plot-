"use client"

import { useState, useEffect } from "react"
import { getBlockBody, getBlockBodies } from "@/lib/wiki-block-body-store"

/**
 * Loads wiki block content from IDB.
 * Falls back to in-memory content (for blocks that haven't been through a persist cycle).
 */
export function useWikiBlockContent(blockId: string, inMemoryContent?: string): string {
  const [content, setContent] = useState(inMemoryContent ?? "")

  useEffect(() => {
    // If we have in-memory content (not yet persisted/stripped), use it
    if (inMemoryContent) {
      setContent(inMemoryContent)
      return
    }

    // Load from IDB
    let cancelled = false
    getBlockBody(blockId).then((body) => {
      if (!cancelled && body) {
        setContent(body.content)
      }
    })
    return () => { cancelled = true }
  }, [blockId, inMemoryContent])

  return content
}

/**
 * Batch-loads block bodies for a set of block IDs.
 * Used for section lazy loading — load all blocks in a section at once.
 */
export function useWikiBlockBodies(blockIds: string[]): Map<string, string> {
  const [bodies, setBodies] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    if (blockIds.length === 0) return
    let cancelled = false

    getBlockBodies(blockIds).then((result) => {
      if (!cancelled) setBodies(result)
    })

    return () => { cancelled = true }
  }, [blockIds.join(",")]) // eslint-disable-line react-hooks/exhaustive-deps

  return bodies
}

/**
 * Loads wiki block content + contentJson from IDB.
 * Returns both plaintext and TipTap JSON for the TipTap editor.
 */
export function useWikiBlockContentJson(
  blockId: string,
  inMemoryContent?: string,
  inMemoryJson?: Record<string, unknown>
): { content: string; contentJson: Record<string, unknown> | null; loading: boolean } {
  const [state, setState] = useState<{
    content: string
    contentJson: Record<string, unknown> | null
    loading: boolean
  }>({
    content: inMemoryContent ?? "",
    contentJson: inMemoryJson ?? null,
    loading: !inMemoryContent && !inMemoryJson,
  })

  useEffect(() => {
    if (inMemoryContent || inMemoryJson) {
      setState({ content: inMemoryContent ?? "", contentJson: inMemoryJson ?? null, loading: false })
      return
    }

    let cancelled = false
    getBlockBody(blockId).then((body) => {
      if (cancelled) return
      if (body) {
        setState({
          content: body.content,
          contentJson: body.contentJson ?? null,
          loading: false,
        })
      } else {
        setState({ content: "", contentJson: null, loading: false })
      }
    })
    return () => { cancelled = true }
  }, [blockId, inMemoryContent, inMemoryJson])

  return state
}
