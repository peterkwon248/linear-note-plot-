/**
 * IndexedDB persistence layer for FlexSearch index.
 * Designed to run inside a Web Worker (Workers have full IndexedDB access).
 *
 * Stores exported FlexSearch key-value chunks + metadata for delta detection.
 */

const DB_NAME = "plot-search-cache"
const DB_VERSION = 1
const STORE_CHUNKS = "chunks"
const STORE_META = "meta"

export interface CacheMeta {
  cacheVersion: number
  noteHashes: Record<string, string> // { noteId: updatedAt }
  savedAt: number
  chunkCount: number
}

export interface CacheData {
  meta: CacheMeta
  chunks: Array<{ key: string; data: string }>
}

function promisifyRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function promisifyTransaction(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)

    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_CHUNKS)) {
        db.createObjectStore(STORE_CHUNKS)
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META)
      }
    }

    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/**
 * Save FlexSearch export chunks + metadata to IndexedDB.
 */
export async function saveCache(
  cacheVersion: number,
  noteHashes: Record<string, string>,
  chunks: Array<{ key: string; data: string }>
): Promise<void> {
  const db = await openDB()
  try {
    const tx = db.transaction([STORE_CHUNKS, STORE_META], "readwrite")
    const chunkStore = tx.objectStore(STORE_CHUNKS)
    const metaStore = tx.objectStore(STORE_META)

    // Store all chunks as single array (fewer IDB operations)
    chunkStore.put(chunks, "idx")

    const meta: CacheMeta = {
      cacheVersion,
      noteHashes,
      savedAt: Date.now(),
      chunkCount: chunks.length,
    }
    metaStore.put(meta, "meta")

    await promisifyTransaction(tx)
  } finally {
    db.close()
  }
}

/**
 * Load cached index from IndexedDB.
 * Returns null if cache is missing, corrupted, or version mismatch.
 */
export async function loadCache(
  expectedVersion: number
): Promise<CacheData | null> {
  let db: IDBDatabase
  try {
    db = await openDB()
  } catch {
    return null // IndexedDB unavailable (private browsing, etc.)
  }

  try {
    const tx = db.transaction([STORE_CHUNKS, STORE_META], "readonly")
    const metaStore = tx.objectStore(STORE_META)
    const chunkStore = tx.objectStore(STORE_CHUNKS)

    const [meta, chunks] = await Promise.all([
      promisifyRequest<CacheMeta | undefined>(metaStore.get("meta")),
      promisifyRequest<Array<{ key: string; data: string }> | undefined>(
        chunkStore.get("idx")
      ),
    ])

    if (!meta || !chunks) return null
    if (meta.cacheVersion !== expectedVersion) return null

    return { meta, chunks }
  } catch {
    return null
  } finally {
    db.close()
  }
}

/**
 * Clear all cached index data.
 */
export async function clearCache(): Promise<void> {
  let db: IDBDatabase
  try {
    db = await openDB()
  } catch {
    return
  }

  try {
    const tx = db.transaction([STORE_CHUNKS, STORE_META], "readwrite")
    tx.objectStore(STORE_CHUNKS).clear()
    tx.objectStore(STORE_META).clear()
    await promisifyTransaction(tx)
  } finally {
    db.close()
  }
}
