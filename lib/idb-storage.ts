/**
 * IndexedDB-backed StateStorage for Zustand persist.
 *
 * Replaces localStorage to remove the ~5MB size limit.
 * - getItem: async read from IDB (with localStorage migration fallback)
 * - setItem: debounced async write to IDB (500ms)
 * - removeItem: async delete from IDB
 *
 * On first read, migrates existing localStorage data to IDB automatically.
 */

import { createJSONStorage } from "zustand/middleware"

const DB_NAME = "plot-zustand"
const DB_VERSION = 1
const STORE_NAME = "kv"

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbGet(key: string): Promise<string | null> {
  const db = await openDB()
  try {
    const tx = db.transaction(STORE_NAME, "readonly")
    const req = tx.objectStore(STORE_NAME).get(key)
    return new Promise<string | null>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => reject(req.error)
    })
  } finally {
    db.close()
  }
}

async function idbSet(key: string, value: string): Promise<void> {
  const db = await openDB()
  try {
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).put(value, key)
    return new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

async function idbRemove(key: string): Promise<void> {
  const db = await openDB()
  try {
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).delete(key)
    return new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

// ── Debounced write ──────────────────────────────────────

const pendingWrites = new Map<string, string>()
let writeTimer: ReturnType<typeof setTimeout> | null = null
const DEBOUNCE_MS = 500

function flushWrites() {
  writeTimer = null
  const entries = Array.from(pendingWrites.entries())
  pendingWrites.clear()
  for (const [key, value] of entries) {
    idbSet(key, value).catch((err) =>
      console.warn("[Plot] IDB write failed:", err)
    )
  }
}

function debouncedSet(key: string, value: string): void {
  pendingWrites.set(key, value)
  if (writeTimer) clearTimeout(writeTimer)
  writeTimer = setTimeout(flushWrites, DEBOUNCE_MS)
}

// Flush on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    if (pendingWrites.size > 0) flushWrites()
  })
}

// ── StateStorage implementation ──────────────────────────

const LS_MIGRATED_KEY = "plot-store-migrated-to-idb"

const idbStateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (typeof indexedDB === "undefined") return null

    // Try IDB first
    let value = await idbGet(name)

    // If IDB empty, migrate from localStorage (one-time)
    if (value === null && typeof localStorage !== "undefined") {
      try {
        const migrated = localStorage.getItem(LS_MIGRATED_KEY)
        if (migrated !== "1") {
          const lsValue = localStorage.getItem(name)
          if (lsValue) {
            value = lsValue
            // Write to IDB asynchronously
            await idbSet(name, lsValue)
            // Mark migration done & clean up localStorage
            localStorage.setItem(LS_MIGRATED_KEY, "1")
            localStorage.removeItem(name)
          }
        }
      } catch {
        // localStorage unavailable (private browsing)
      }
    }

    return value
  },

  setItem: (name: string, value: string): void => {
    if (typeof indexedDB === "undefined") return
    debouncedSet(name, value)
  },

  removeItem: (name: string): void => {
    if (typeof indexedDB === "undefined") return
    idbRemove(name).catch((err) =>
      console.warn("[Plot] IDB remove failed:", err)
    )
  },
}

/**
 * Create a Zustand-compatible IDB persist storage.
 * Drop-in replacement for the default localStorage-based storage.
 */
export function createIDBStorage<S>() {
  return createJSONStorage<S>(() => idbStateStorage)
}
