"use client"

import { useEffect, useRef } from "react"
import { usePlotStore } from "@/lib/store"
import { computeCoOccurrences } from "@/lib/co-occurrence"

/**
 * Reactively recomputes co-occurrences when notes change.
 * Debounced at 2 seconds to avoid excessive computation during typing.
 * Mount once in app layout.
 */
export function useCoOccurrences() {
  const notes = usePlotStore((s) => s.notes)
  const updateCoOccurrences = usePlotStore((s) => s.updateCoOccurrences)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      const result = computeCoOccurrences(notes)
      updateCoOccurrences(result)
    }, 2000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [notes, updateCoOccurrences])
}
