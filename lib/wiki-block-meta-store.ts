/**
 * IndexedDB persistence for wiki article block metadata arrays.
 * Separates block arrays from Zustand persist store,
 * following the same pattern as note-body-store.ts.
 *
 * Key = articleId, Value = WikiBlock[]
 */

import type { WikiBlock } from "./types"

const DB_NAME = "plot-wiki-block-meta"
const DB_VERSION = 1
const STORE_NAME = "blocks"

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

function promisifyTx(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function saveArticleBlocks(articleId: string, blocks: WikiBlock[]): Promise<void> {
  const db = await openDB()
  try {
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).put(blocks, articleId)
    await promisifyTx(tx)
  } finally {
    db.close()
  }
}

export async function getArticleBlocks(articleId: string): Promise<WikiBlock[] | null> {
  const db = await openDB()
  try {
    const tx = db.transaction(STORE_NAME, "readonly")
    const req = tx.objectStore(STORE_NAME).get(articleId)
    return new Promise<WikiBlock[] | null>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => reject(req.error)
    })
  } finally {
    db.close()
  }
}

export async function deleteArticleBlocks(articleId: string): Promise<void> {
  const db = await openDB()
  try {
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).delete(articleId)
    await promisifyTx(tx)
  } finally {
    db.close()
  }
}
