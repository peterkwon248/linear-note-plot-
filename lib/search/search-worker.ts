// @ts-nocheck
import FlexSearch from "flexsearch"
import { saveCache, loadCache, clearCache } from "./search-index-db"

const Document = FlexSearch.Document

// ── Cache versioning ─────────────────────────────────
// Bump this whenever FlexSearch config changes (fields, tokenizer, resolution)
const CACHE_VERSION = 1

// ── FlexSearch config (reused for fresh + restored indexes) ──
const FLEXSEARCH_CONFIG = {
  document: {
    id: "id",
    index: [
      { field: "title", tokenize: "forward", resolution: 9 },
      { field: "content", tokenize: "forward", resolution: 5 },
    ],
  },
}

let index = new Document(FLEXSEARCH_CONFIG)

// ── Debounced background save ────────────────────────
let savePending = false
let saveTimer: ReturnType<typeof setTimeout> | null = null
const SAVE_DEBOUNCE_MS = 10_000 // 10 seconds after last mutation

let currentNoteHashes: Record<string, string> = {}

function scheduleSave() {
  savePending = true
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    performSave()
  }, SAVE_DEBOUNCE_MS)
}

async function performSave() {
  if (!savePending) return
  savePending = false
  saveTimer = null

  try {
    const chunks: Array<{ key: string; data: string }> = []
    index.export((key: string, data: string) => {
      chunks.push({ key, data })
    })
    await saveCache(CACHE_VERSION, { ...currentNoteHashes }, chunks)
    self.postMessage({ type: "CACHE_SAVED", chunkCount: chunks.length })
  } catch (err) {
    console.warn("[SearchWorker] Failed to save cache:", err)
  }
}

// ── Message handler ──────────────────────────────────
self.onmessage = async (e: MessageEvent) => {
  const msg = e.data

  switch (msg.type) {
    case "INIT": {
      const notes: {
        id: string
        title: string
        content: string
        updatedAt: string
      }[] = msg.notes
      const total = notes.length

      // Build noteHashes from incoming data
      const incomingHashes: Record<string, string> = {}
      for (const n of notes) {
        incomingHashes[n.id] = n.updatedAt
      }

      // Try loading cached index
      let cacheUsed = false
      try {
        const cached = await loadCache(CACHE_VERSION)
        if (cached && cached.chunks.length > 0) {
          // Restore index from cache
          index = new Document(FLEXSEARCH_CONFIG)
          for (const chunk of cached.chunks) {
            index.import(chunk.key, chunk.data)
          }

          // Delta detection
          const cachedHashes = cached.meta.noteHashes
          let deltaUpserts = 0
          let deltaDeletes = 0

          // Find notes to upsert (new or changed)
          for (const n of notes) {
            const cachedUpdatedAt = cachedHashes[n.id]
            if (!cachedUpdatedAt || cachedUpdatedAt !== n.updatedAt) {
              try {
                index.update(n)
              } catch {
                index.add(n)
              }
              deltaUpserts++
            }
          }

          // Find notes to delete (in cache but not in current)
          const currentIdSet = new Set(Object.keys(incomingHashes))
          for (const cachedId of Object.keys(cachedHashes)) {
            if (!currentIdSet.has(cachedId)) {
              index.remove(cachedId)
              deltaDeletes++
            }
          }

          currentNoteHashes = incomingHashes
          cacheUsed = true

          self.postMessage({
            type: "READY",
            source: "cache",
            deltaUpserts,
            deltaDeletes,
            total,
          })

          // If there were deltas, schedule a background save to update cache
          if (deltaUpserts > 0 || deltaDeletes > 0) {
            scheduleSave()
          }
        }
      } catch (err) {
        console.warn(
          "[SearchWorker] Cache restore failed, falling back to full rebuild:",
          err
        )
        cacheUsed = false
        // Reset index in case partial import corrupted it
        index = new Document(FLEXSEARCH_CONFIG)
      }

      if (!cacheUsed) {
        // Full rebuild (existing chunked flow)
        const CHUNK = 500
        let offset = 0

        function indexChunk() {
          const end = Math.min(offset + CHUNK, total)
          for (let i = offset; i < end; i++) {
            index.add(notes[i])
          }
          offset = end
          self.postMessage({ type: "PROGRESS", indexed: offset, total })

          if (offset < total) {
            setTimeout(indexChunk, 0)
          } else {
            currentNoteHashes = incomingHashes
            self.postMessage({ type: "READY", source: "rebuild", total })
            // Save to IndexedDB after full rebuild
            scheduleSave()
          }
        }

        indexChunk()
      }
      break
    }

    case "QUERY": {
      const { query, limit, reqId } = msg
      const raw = index.search(query, { limit, enrich: false })
      const seen = new Set<string>()
      const ids: string[] = []
      for (const fieldResult of raw) {
        for (const id of fieldResult.result) {
          const strId = String(id)
          if (!seen.has(strId)) {
            seen.add(strId)
            ids.push(strId)
          }
        }
      }
      self.postMessage({ type: "RESULTS", ids, reqId })
      break
    }

    case "UPSERT": {
      const note = msg.note
      try {
        index.update(note)
      } catch {
        index.add(note)
      }
      if (msg.updatedAt) {
        currentNoteHashes[note.id] = msg.updatedAt
      }
      scheduleSave()
      break
    }

    case "DELETE": {
      index.remove(msg.id)
      delete currentNoteHashes[msg.id]
      scheduleSave()
      break
    }

    case "SAVE_NOW": {
      // Immediate save (triggered by beforeunload)
      if (saveTimer) clearTimeout(saveTimer)
      savePending = true
      await performSave()
      break
    }

    case "CLEAR_CACHE": {
      await clearCache()
      self.postMessage({ type: "CACHE_CLEARED" })
      break
    }
  }
}

export {}
