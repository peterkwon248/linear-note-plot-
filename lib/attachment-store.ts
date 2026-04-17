/**
 * IndexedDB persistence for attachment blobs.
 * Metadata lives in Zustand store; binary data lives here.
 */

export interface AttachmentBlob {
  id: string
  data: ArrayBuffer
}

const DB_NAME = "plot-attachments"
// v2 (2026-04-16): some users' DBs ended up at v1 without the `blobs` store being created
// (race condition during initial onupgradeneeded). Bumping the version forces all clients
// to run the upgrade path and create the missing store.
const DB_VERSION = 2
const STORE_NAME = "blobs"

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" })
      }
    }
    req.onsuccess = () => {
      const db = req.result
      // Defensive: if the store is somehow still missing (very broken DB state),
      // close and reopen with a higher version to force an upgrade path.
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.close()
        const nextVersion = db.version + 1
        const retry = indexedDB.open(DB_NAME, nextVersion)
        retry.onupgradeneeded = () => {
          const retryDb = retry.result
          if (!retryDb.objectStoreNames.contains(STORE_NAME)) {
            retryDb.createObjectStore(STORE_NAME, { keyPath: "id" })
          }
        }
        retry.onsuccess = () => resolve(retry.result)
        retry.onerror = () => reject(retry.error)
        return
      }
      resolve(db)
    }
    req.onerror = () => reject(req.error)
  })
}

function promisifyTx(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function saveBlob(blob: AttachmentBlob): Promise<void> {
  const db = await openDB()
  try {
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).put(blob)
    await promisifyTx(tx)
  } finally {
    db.close()
  }
}

export async function saveBlobsBatch(blobs: AttachmentBlob[]): Promise<void> {
  if (blobs.length === 0) return
  const db = await openDB()
  try {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    for (const blob of blobs) {
      store.put(blob)
    }
    await promisifyTx(tx)
  } finally {
    db.close()
  }
}

export async function getBlob(id: string): Promise<AttachmentBlob | null> {
  const db = await openDB()
  try {
    const tx = db.transaction(STORE_NAME, "readonly")
    const req = tx.objectStore(STORE_NAME).get(id)
    return new Promise<AttachmentBlob | null>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => reject(req.error)
    })
  } finally {
    db.close()
  }
}

export async function getAllBlobs(): Promise<AttachmentBlob[]> {
  const db = await openDB()
  try {
    const tx = db.transaction(STORE_NAME, "readonly")
    const req = tx.objectStore(STORE_NAME).getAll()
    return new Promise<AttachmentBlob[]>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result ?? [])
      req.onerror = () => reject(req.error)
    })
  } finally {
    db.close()
  }
}

export async function deleteBlob(id: string): Promise<void> {
  const db = await openDB()
  try {
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).delete(id)
    await promisifyTx(tx)
  } finally {
    db.close()
  }
}
