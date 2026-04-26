/**
 * IndexedDB persistence for note bodies (content + contentJson).
 * Separates large body data from the Zustand/localStorage meta store,
 * breaking the ~5-10MB localStorage limit.
 *
 * DB_VERSION history:
 *  - v1: initial release
 *  - v2: corruption recovery — bumped to force onupgradeneeded re-run on
 *        DBs whose "bodies" store had gone missing (NotFoundError loop)
 *  - v3: defensive bump — ensures the store is always present even if a
 *        prior abort/crash left the DB in a half-upgraded state. The
 *        onupgradeneeded handler now also runs on every successful open
 *        to verify the store exists; if not, we re-create it.
 */

import type { NoteBody } from "./types"

export const BODIES_MIGRATED_KEY = "plot-bodies-migrated"

const DB_NAME = "plot-note-bodies"
const DB_VERSION = 3
const STORE_NAME = "bodies"

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      // Guard for ALL versions: the "bodies" store must exist. This is
      // idempotent — createObjectStore only runs when the store is
      // missing. Covers fresh installs (v0→v3), v1→v3, v2→v3, and any
      // pathological state where the store vanished.
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" })
      }
    }
    req.onsuccess = () => {
      const db = req.result
      // Belt-and-braces: even at the current DB_VERSION the store could
      // be missing (e.g., user manually wiped it via DevTools, or some
      // browser bug). Detect and force a version bump to recreate.
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.close()
        const recoveryReq = indexedDB.open(DB_NAME, DB_VERSION + 1)
        recoveryReq.onupgradeneeded = () => {
          const rdb = recoveryReq.result
          if (!rdb.objectStoreNames.contains(STORE_NAME)) {
            rdb.createObjectStore(STORE_NAME, { keyPath: "id" })
          }
        }
        recoveryReq.onsuccess = () => resolve(recoveryReq.result)
        recoveryReq.onerror = () => reject(recoveryReq.error)
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
