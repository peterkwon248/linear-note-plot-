/**
 * IndexedDB persistence for note bodies (content + contentJson).
 * Separates large body data from the Zustand/localStorage meta store,
 * breaking the ~5-10MB localStorage limit.
 */

import type { NoteBody } from "./types"

export const BODIES_MIGRATED_KEY = "plot-bodies-migrated"

const DB_NAME = "plot-note-bodies"
const DB_VERSION = 2
const STORE_NAME = "bodies"

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

export async function saveBody(body: NoteBody): Promise<void> {
  const db = await openDB()
  try {
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).put(body)
    await promisifyTx(tx)
  } finally {
    db.close()
  }
}

export async function saveBodiesBatch(bodies: NoteBody[]): Promise<void> {
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

export async function getBody(id: string): Promise<NoteBody | null> {
  const db = await openDB()
  try {
    const tx = db.transaction(STORE_NAME, "readonly")
    const req = tx.objectStore(STORE_NAME).get(id)
    return new Promise<NoteBody | null>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => reject(req.error)
    })
  } finally {
    db.close()
  }
}

export async function getAllBodies(): Promise<NoteBody[]> {
  const db = await openDB()
  try {
    const tx = db.transaction(STORE_NAME, "readonly")
    const req = tx.objectStore(STORE_NAME).getAll()
    return new Promise<NoteBody[]>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result ?? [])
      req.onerror = () => reject(req.error)
    })
  } finally {
    db.close()
  }
}

export async function deleteBody(id: string): Promise<void> {
  const db = await openDB()
  try {
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).delete(id)
    await promisifyTx(tx)
  } finally {
    db.close()
  }
}
