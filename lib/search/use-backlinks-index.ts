"use client"

import { useState, useEffect, useRef } from "react"
import { usePlotStore } from "@/lib/store"
import { BacklinksIndex } from "@/lib/backlinks"

/**
 * React hook that maintains an incremental BacklinksIndex.
 * Returns a stable Map<noteId, count> that updates incrementally on note changes.
 */
export function useBacklinksIndex(): Map<string, number> {
  const notes = usePlotStore((s) => s.notes)
  const indexRef = useRef<BacklinksIndex | null>(null)
  const prevNotesRef = useRef<Map<string, string>>(new Map()) // id -> updatedAt
  const [countMap, setCountMap] = useState<Map<string, number>>(new Map())

  useEffect(() => {
    // Initialize on first run
    if (!indexRef.current) {
      const idx = new BacklinksIndex()
      idx.buildFromScratch(notes.map(n => ({ id: n.id, title: n.title, linksOut: n.linksOut, aliases: n.aliases })))
      indexRef.current = idx

      // Build initial prev map
      const prev = new Map<string, string>()
      for (const n of notes) prev.set(n.id, n.updatedAt)
      prevNotesRef.current = prev

      setCountMap(idx.toCountMap())
      return
    }

    const idx = indexRef.current
    const prev = prevNotesRef.current
    const currentIds = new Set<string>()

    // Detect upserts
    for (const note of notes) {
      currentIds.add(note.id)
      const oldUpdated = prev.get(note.id)
      if (!oldUpdated || oldUpdated !== note.updatedAt) {
        idx.upsert(note.id, note.title, note.linksOut, note.aliases)
      }
    }

    // Detect deletions
    for (const [id] of prev) {
      if (!currentIds.has(id)) {
        idx.remove(id)
      }
    }

    // Update prev map
    const newPrev = new Map<string, string>()
    for (const n of notes) newPrev.set(n.id, n.updatedAt)
    prevNotesRef.current = newPrev

    // Only update React state if actual counts changed
    const newCountMap = idx.toCountMap()
    setCountMap((prev) => {
      if (prev.size !== newCountMap.size) return newCountMap
      for (const [id, count] of newCountMap) {
        if (prev.get(id) !== count) return newCountMap
      }
      return prev  // same reference → no rerender
    })
  }, [notes])

  return countMap
}
