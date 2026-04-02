/**
 * IndexedDB persistence for wiki block bodies (text block content).
 * Separates large text content from the Zustand persist store,
 * following the same pattern as note-body-store.ts.
 */

const DB_NAME = "plot-wiki-block-bodies"
const DB_VERSION = 1
const STORE_NAME = "bodies"

export interface WikiBlockBody {
  id: string       // blockId
  content: string  // plaintext
  contentJson?: Record<string, unknown> | null  // TipTap JSON (rich text)
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" })
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

export async function saveBlockBody(body: WikiBlockBody): Promise<void> {
  const db = await openDB()
  try {
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).put(body)
    await promisifyTx(tx)
  } finally {
    db.close()
  }
}

export async function saveBlockBodiesBatch(bodies: WikiBlockBody[]): Promise<void> {
  if (bodies.length === 0) return
  const db = await openDB()
  try {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    for (const body of bodies) {
      store.put(body)
    }
    await promisifyTx(tx)
  } finally {
    db.close()
  }
}

export async function getBlockBody(id: string): Promise<WikiBlockBody | null> {
  const db = await openDB()
  try {
    const tx = db.transaction(STORE_NAME, "readonly")
    const req = tx.objectStore(STORE_NAME).get(id)
    return new Promise<WikiBlockBody | null>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => reject(req.error)
    })
  } finally {
    db.close()
  }
}

export async function getBlockBodies(ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map()
  const db = await openDB()
  try {
    const tx = db.transaction(STORE_NAME, "readonly")
    const store = tx.objectStore(STORE_NAME)
    const results = new Map<string, string>()

    const promises = ids.map((id) =>
      new Promise<void>((resolve, reject) => {
        const req = store.get(id)
        req.onsuccess = () => {
          const body = req.result as WikiBlockBody | undefined
          if (body) results.set(body.id, body.content)
          resolve()
        }
        req.onerror = () => reject(req.error)
      })
    )

    await Promise.all(promises)
    return results
  } finally {
    db.close()
  }
}

export async function deleteBlockBody(id: string): Promise<void> {
  const db = await openDB()
  try {
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).delete(id)
    await promisifyTx(tx)
  } finally {
    db.close()
  }
}
