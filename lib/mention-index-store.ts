/**
 * IndexedDB-backed mention index.
 *
 * Maps each mention target id (note or wiki) → the set of source note ids
 * whose contentJson contains a `mention` atom pointing at that target.
 *
 * Why this exists:
 *   The Connections panel needs to surface "mention-only" backlinks — notes
 *   that reference the current entity via @-mention atoms (no [[wikilink]]
 *   nor linksOut entry). The naive approach loads every note's contentJson
 *   from IDB on every panel render, which is O(N) and blocks rendering for
 *   N > ~100. This index turns that lookup into a single O(1) IDB read.
 *
 * Schema:
 *   key   = targetId   (note id or wiki id being mentioned)
 *   value = string[]   (source note ids that mention `key`)
 *
 * Lifecycle:
 *   - First call to `ensureMentionIndexBuilt()` walks every note's contentJson
 *     once and populates the index. Subsequent calls are no-ops (a localStorage
 *     flag tracks completion).
 *   - `updateMentionsForNote()` is called from `persistBody()` whenever a note
 *     body is saved — it re-extracts mentions and applies the diff.
 *   - `removeMentionsForNote()` is called from `removeBody()` on note delete.
 */

import { extractMentionTargets } from "./body-helpers"

const DB_NAME = "plot-mention-index"
const DB_VERSION = 1
const STORE_NAME = "edges"
const SOURCES_STORE = "sources" // sourceId → string[] of targetIds (reverse lookup)
const BUILD_FLAG = "plot-mention-index-built-v1"

// In-memory queue serializes IDB writes per-source to avoid concurrent
// upsert races (e.g. rapid keystrokes triggering parallel persistBody calls).
const writeQueueBySource = new Map<string, Promise<unknown>>()

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME) // key = targetId, value = string[]
      }
      if (!db.objectStoreNames.contains(SOURCES_STORE)) {
        db.createObjectStore(SOURCES_STORE) // key = sourceId, value = string[]
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function promisifyTx(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

function getAllRecord<T>(store: IDBObjectStore, key: IDBValidKey): Promise<T | null> {
  return new Promise((resolve, reject) => {
    const req = store.get(key)
    req.onsuccess = () => resolve((req.result as T | undefined) ?? null)
    req.onerror = () => reject(req.error)
  })
}

/**
 * Returns the set of source note ids that mention the given target.
 * O(1) IDB read.
 */
export async function getMentionSources(targetId: string): Promise<string[]> {
  if (typeof indexedDB === "undefined") return []
  try {
    const db = await openDB()
    try {
      const tx = db.transaction(STORE_NAME, "readonly")
      const store = tx.objectStore(STORE_NAME)
      const result = await getAllRecord<string[]>(store, targetId)
      return result ?? []
    } finally {
      db.close()
    }
  } catch {
    return []
  }
}

/**
 * Apply a per-note mention diff in IDB:
 *   - For target ids newly mentioned, add `sourceId` to that target's source list.
 *   - For target ids no longer mentioned, remove `sourceId` from that target's list.
 *   - Update the reverse `sources` row to the new full target id set.
 *
 * Called from `persistBody()` after each note save. Fire-and-forget; failures
 * are swallowed so editor UX never depends on index health.
 */
export async function updateMentionsForNote(
  sourceId: string,
  contentJson: unknown,
): Promise<void> {
  if (typeof indexedDB === "undefined") return

  // Compute the new full target set from the latest body.
  const { noteIds, wikiIds } = extractMentionTargets(contentJson)
  const newTargets = new Set<string>([...noteIds, ...wikiIds])

  // Serialize per-source so a fast typist doesn't race themselves.
  const prevQueued = writeQueueBySource.get(sourceId) ?? Promise.resolve()
  const next = prevQueued
    .catch(() => undefined)
    .then(() => applyMentionDiff(sourceId, newTargets))
    .finally(() => {
      // Clean up if we're still the tail of the queue.
      if (writeQueueBySource.get(sourceId) === next) {
        writeQueueBySource.delete(sourceId)
      }
    })
  writeQueueBySource.set(sourceId, next)
  return next
}

async function applyMentionDiff(sourceId: string, newTargets: Set<string>): Promise<void> {
  const db = await openDB()
  try {
    // 1. Read previous target set for this source. Separate readonly tx is fine —
    //    we won't race ourselves because writes are serialized via writeQueueBySource.
    const readTx = db.transaction(SOURCES_STORE, "readonly")
    const prevTargetsArr = await getAllRecord<string[]>(
      readTx.objectStore(SOURCES_STORE),
      sourceId,
    )
    await promisifyTx(readTx)
    const prevTargets = new Set(prevTargetsArr ?? [])

    // Compute diff.
    const added: string[] = []
    const removed: string[] = []
    for (const t of newTargets) if (!prevTargets.has(t)) added.push(t)
    for (const t of prevTargets) if (!newTargets.has(t)) removed.push(t)

    if (added.length === 0 && removed.length === 0) return

    // 2. Read current edge rows for every affected target before opening the
    //    write tx. We can't safely interleave async awaits inside a single
    //    readwrite tx (Chrome / Firefox auto-close idle transactions, causing
    //    "transaction finished" errors). One readonly read pass + one
    //    readwrite write pass, both fully synchronous w.r.t. their own tx.
    const affected = [...new Set([...added, ...removed])]
    const currentEdges = new Map<string, string[]>()
    if (affected.length > 0) {
      const edgeReadTx = db.transaction(STORE_NAME, "readonly")
      const edgeReadStore = edgeReadTx.objectStore(STORE_NAME)
      await Promise.all(
        affected.map(async (targetId) => {
          const arr = await getAllRecord<string[]>(edgeReadStore, targetId)
          if (arr) currentEdges.set(targetId, arr)
        }),
      )
      await promisifyTx(edgeReadTx)
    }

    // 3. Apply the diff in one readwrite transaction across both stores.
    const tx = db.transaction([STORE_NAME, SOURCES_STORE], "readwrite")
    const edges = tx.objectStore(STORE_NAME)
    const sourcesStore = tx.objectStore(SOURCES_STORE)

    // Update reverse row.
    if (newTargets.size === 0) {
      sourcesStore.delete(sourceId)
    } else {
      sourcesStore.put([...newTargets], sourceId)
    }

    for (const targetId of added) {
      const existing = currentEdges.get(targetId) ?? []
      const set = new Set(existing)
      set.add(sourceId)
      edges.put([...set], targetId)
    }

    for (const targetId of removed) {
      const existing = currentEdges.get(targetId)
      if (!existing) continue
      const next = existing.filter((id) => id !== sourceId)
      if (next.length === 0) edges.delete(targetId)
      else edges.put(next, targetId)
    }

    await promisifyTx(tx)
  } finally {
    db.close()
  }
}

/**
 * Remove a source note from the index entirely (called on note delete).
 * Removes `sourceId` from every targetId's source list it currently appears in,
 * then deletes the reverse `sources` row.
 */
export async function removeMentionsForNote(sourceId: string): Promise<void> {
  if (typeof indexedDB === "undefined") return

  const prevQueued = writeQueueBySource.get(sourceId) ?? Promise.resolve()
  const next = prevQueued
    .catch(() => undefined)
    .then(() => applyMentionDiff(sourceId, new Set()))
    .finally(() => {
      if (writeQueueBySource.get(sourceId) === next) {
        writeQueueBySource.delete(sourceId)
      }
    })
  writeQueueBySource.set(sourceId, next)
  return next
}

/**
 * One-time migration: walk every note's contentJson and populate the index.
 * Subsequent calls return immediately if the build flag is set.
 *
 * Called lazily — on the first useBacklinksWithContext() invocation in a
 * session. Runs in the background; consumers can read while it's still in
 * progress (results may be incomplete until first build finishes).
 */
let buildPromise: Promise<void> | null = null

export function ensureMentionIndexBuilt(
  loadAllBodies: () => Promise<Array<{ id: string; contentJson: unknown }>>,
): Promise<void> {
  if (typeof indexedDB === "undefined") return Promise.resolve()
  if (buildPromise) return buildPromise

  // localStorage flag is the durable signal that we've completed at least once.
  // Even if completed, we still allow incremental updates via updateMentionsForNote.
  if (typeof localStorage !== "undefined" && localStorage.getItem(BUILD_FLAG)) {
    return Promise.resolve()
  }

  buildPromise = (async () => {
    try {
      const bodies = await loadAllBodies()
      const db = await openDB()
      try {
        // Aggregate target → source[] map in memory first to avoid one tx per note.
        const targetToSources = new Map<string, Set<string>>()
        const sourceToTargets = new Map<string, Set<string>>()

        for (const body of bodies) {
          if (!body.contentJson) continue
          const { noteIds, wikiIds } = extractMentionTargets(body.contentJson)
          if (noteIds.size === 0 && wikiIds.size === 0) continue

          const targets = new Set<string>([...noteIds, ...wikiIds])
          sourceToTargets.set(body.id, targets)
          for (const t of targets) {
            let set = targetToSources.get(t)
            if (!set) {
              set = new Set()
              targetToSources.set(t, set)
            }
            set.add(body.id)
          }
        }

        const tx = db.transaction([STORE_NAME, SOURCES_STORE], "readwrite")
        const edges = tx.objectStore(STORE_NAME)
        const sources = tx.objectStore(SOURCES_STORE)
        for (const [targetId, sourceSet] of targetToSources) {
          edges.put([...sourceSet], targetId)
        }
        for (const [sourceId, targetSet] of sourceToTargets) {
          sources.put([...targetSet], sourceId)
        }
        await promisifyTx(tx)
      } finally {
        db.close()
      }

      if (typeof localStorage !== "undefined") {
        localStorage.setItem(BUILD_FLAG, "1")
      }
    } catch (err) {
      console.warn("[Plot] Mention index build failed:", err)
      // Don't cache the failure — let the next call retry.
      buildPromise = null
      throw err
    }
  })()

  return buildPromise
}

/**
 * Clear the entire index (debug / data wipe). Resets the build flag so the
 * next call to ensureMentionIndexBuilt() rebuilds from scratch.
 */
export async function clearMentionIndex(): Promise<void> {
  if (typeof indexedDB === "undefined") return
  const db = await openDB()
  try {
    const tx = db.transaction([STORE_NAME, SOURCES_STORE], "readwrite")
    tx.objectStore(STORE_NAME).clear()
    tx.objectStore(SOURCES_STORE).clear()
    await promisifyTx(tx)
  } finally {
    db.close()
  }
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(BUILD_FLAG)
  }
  buildPromise = null
}
