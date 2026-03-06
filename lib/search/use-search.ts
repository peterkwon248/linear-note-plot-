"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { usePlotStore } from "@/lib/store"
import { searchClient } from "./search-client"
import type { Note } from "@/lib/types"

interface UseSearchResult {
  results: Note[]
  isIndexing: boolean
}

export function useSearch(query: string, limit: number = 20): UseSearchResult {
  const [results, setResults] = useState<Note[]>([])
  const [isIndexing, setIsIndexing] = useState(true)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevNotesRef = useRef<Map<string, string>>(new Map())
  const initializedRef = useRef(false)

  // On mount: build the index from all notes
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    const notes = usePlotStore.getState().notes
    // Include updatedAt so worker can do delta detection against cached index
    const data = notes.map((n) => ({
      id: n.id,
      title: n.title,
      content: n.content,
      updatedAt: n.updatedAt,
    }))

    // Track initial notes for diffing
    const map = new Map<string, string>()
    for (const n of notes) {
      map.set(n.id, n.updatedAt)
    }
    prevNotesRef.current = map

    setIsIndexing(true)
    searchClient.init(data).then(() => {
      setIsIndexing(false)
    })
  }, [])

  // Subscribe to store notes changes for incremental updates
  useEffect(() => {
    const unsub = usePlotStore.subscribe((state, prevState) => {
      if (state.notes === prevState.notes) return

      const prevMap = prevNotesRef.current
      const nextMap = new Map<string, string>()
      const currentIds = new Set<string>()

      for (const note of state.notes) {
        currentIds.add(note.id)
        nextMap.set(note.id, note.updatedAt)

        const prevUpdatedAt = prevMap.get(note.id)
        if (prevUpdatedAt === undefined || prevUpdatedAt !== note.updatedAt) {
          // New or updated note
          searchClient.upsert(
            { id: note.id, title: note.title, content: note.content },
            note.updatedAt
          )
        }
      }

      // Detect deletions
      for (const [id] of prevMap) {
        if (!currentIds.has(id)) {
          searchClient.remove(id)
        }
      }

      prevNotesRef.current = nextMap
    })

    return unsub
  }, [])

  // Search when query changes (debounced)
  const doSearch = useCallback(
    (q: string) => {
      if (!q.trim()) {
        setResults([])
        return
      }
      searchClient.search(q, limit).then((ids) => {
        const notes = usePlotStore.getState().notes
        const noteMap = new Map<string, Note>()
        for (const n of notes) {
          noteMap.set(n.id, n)
        }
        const mapped: Note[] = []
        for (const id of ids) {
          const note = noteMap.get(id)
          if (note) mapped.push(note)
        }
        setResults(mapped)
      })
    },
    [limit]
  )

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      doSearch(query)
    }, 150)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, doSearch])

  // Save cache on beforeunload (placed last to preserve hook order)
  useEffect(() => {
    const handleBeforeUnload = () => {
      searchClient.saveNow()
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [])

  return { results, isIndexing }
}
