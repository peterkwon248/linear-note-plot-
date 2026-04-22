/**
 * IndexedDB persistence for attachment blobs.
 * Metadata lives in Zustand store; binary data lives here.
 */

export interface AttachmentBlob {
  id: string
  data: ArrayBuffer
}

const DB_NAME = "plot-attachments"
const DB_VERSION = 1
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
