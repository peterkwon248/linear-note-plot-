"use client"

import { useEffect, useRef } from "react"
import { usePlotStore } from "@/lib/store"
import { detectClusters } from "@/lib/co-occurrence"
import type { WikiClusterSuggestion } from "@/lib/types"

const MAX_SUGGESTIONS = 20

export function useClusterSuggestions(): void {
  const coOccurrences = usePlotStore((s) => s.coOccurrences)
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const clusterSuggestions = usePlotStore((s) => s.clusterSuggestions)
  const updateClusterSuggestions = usePlotStore((s) => s.updateClusterSuggestions)
  const prevCoRef = useRef(coOccurrences)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Only run when co-occurrences actually change
    if (prevCoRef.current === coOccurrences) return
    prevCoRef.current = coOccurrences

    // Debounce
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      if (coOccurrences.length === 0) return

      // Build title -> noteId map
      const titleToNoteId = new Map<string, string>()
      for (const note of notes) {
        if (note.trashed) continue
        const key = note.title.toLowerCase()
        if (key) titleToNoteId.set(key, note.id)
        // Also add aliases if present
        if (note.aliases) {
          for (const alias of note.aliases) {
            titleToNoteId.set(alias.toLowerCase(), note.id)
          }
        }
      }

      const candidates = detectClusters(coOccurrences, titleToNoteId)
      if (candidates.length === 0) return

      // Filter out clusters where a wiki article already covers the concept
      const wikiTitleSet = new Set(
        wikiArticles.map((a) => a.title.toLowerCase())
      )
      const existingAliases = new Set(
        wikiArticles.flatMap((a) => a.aliases.map((al) => al.toLowerCase()))
      )

      // Track dismissed IDs
      const dismissedIds = new Set(
        (clusterSuggestions ?? [])
          .filter((s) => s.status === "dismissed")
          .map((s) => s.noteIds.sort().join(","))
      )

      const newSuggestions: WikiClusterSuggestion[] = []

      for (const candidate of candidates) {
        // Skip if main concept is already a wiki article
        const mainConcept = candidate.concepts[0]
        if (wikiTitleSet.has(mainConcept) || existingAliases.has(mainConcept)) continue

        // Generate a stable key from sorted noteIds
        const key = candidate.noteIds.sort().join(",")
        if (dismissedIds.has(key)) continue

        newSuggestions.push({
          id: `cluster-${key.slice(0, 16)}`,
          conceptTitles: candidate.concepts,
          noteIds: candidate.noteIds,
          strength: candidate.density,
          status: "pending",
          createdAt: new Date().toISOString(),
        })

        if (newSuggestions.length >= MAX_SUGGESTIONS) break
      }

      // Merge with existing (preserve dismissed)
      const dismissed = (clusterSuggestions ?? []).filter((s) => s.status === "dismissed")
      updateClusterSuggestions([...dismissed, ...newSuggestions])
    }, 3000) // 3s debounce (after co-occurrence 2s debounce)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [coOccurrences, notes, wikiArticles])
}
