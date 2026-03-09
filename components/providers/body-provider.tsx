"use client"

import { useEffect } from "react"
import { usePlotStore } from "@/lib/store"
import { getAllBodies, saveBodiesBatch, BODIES_MIGRATED_KEY } from "@/lib/note-body-store"
import type { NoteBody } from "@/lib/types"

export function BodyProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    async function hydrate() {
      const store = usePlotStore.getState()
      const notes = store.notes

      // 1. Handle v13→v14 migration bodies (extracted by Zustand migrate)
      const migrationBodies = (window as any).__plotMigrationBodies as NoteBody[] | undefined
      if (migrationBodies && migrationBodies.length > 0) {
        await saveBodiesBatch(migrationBodies)
        delete (window as any).__plotMigrationBodies
        try { localStorage.setItem(BODIES_MIGRATED_KEY, "1") } catch {}
      }

      // 2. Load existing bodies from IDB
      let idbBodies: NoteBody[] = []
      try {
        idbBodies = await getAllBodies()
      } catch {
        // IDB unavailable (private browsing, etc.)
      }
      const idbBodyMap = new Map(idbBodies.map(b => [b.id, b]))

      // 3. Save any in-memory bodies not yet in IDB (e.g., seed notes on first load)
      const toSave: NoteBody[] = []
      for (const note of notes) {
        if (note.content && !idbBodyMap.has(note.id)) {
          const body: NoteBody = { id: note.id, content: note.content, contentJson: note.contentJson }
          toSave.push(body)
          idbBodyMap.set(note.id, body)
        }
      }
      if (toSave.length > 0) {
        await saveBodiesBatch(toSave)
      }

      // 4. Hydrate store — merge IDB bodies into notes that have content=""
      const bodiesToHydrate = Array.from(idbBodyMap.values())
      if (bodiesToHydrate.length > 0) {
        store._hydrateNoteBodies(bodiesToHydrate)
      }

      // 5. Mark migration complete (safe to strip content from localStorage now)
      try {
        if (localStorage.getItem(BODIES_MIGRATED_KEY) !== "1") {
          localStorage.setItem(BODIES_MIGRATED_KEY, "1")
        }
      } catch {}
    }

    hydrate()
  }, [])

  return <>{children}</>
}
