/**
 * Rebuild all Reference.usedInNoteIds by scanning note bodies from IDB.
 * Call this once to backfill existing data, or as a "repair" action.
 *
 * Scans:
 * - Note bodies (plot-note-bodies IDB) — footnoteRef + referenceLink nodes in contentJson
 * - Wiki block bodies (plot-wiki-block-bodies IDB) — same node types in wiki text blocks
 */

import { getAllBodies } from "@/lib/note-body-store"
import { usePlotStore } from "@/lib/store"

/** Walk a TipTap JSON tree and collect all unique referenceIds. */
function extractReferenceIds(json: unknown): string[] {
  const ids = new Set<string>()
  function walk(node: any) {
    if (!node) return
    if ((node.type === "footnoteRef" || node.type === "referenceLink") && node.attrs?.referenceId) {
      ids.add(node.attrs.referenceId as string)
    }
    if (Array.isArray(node.content)) {
      for (const child of node.content) walk(child)
    }
  }
  walk(json)
  return [...ids]
}

/**
 * Rebuild all Reference usedInNoteIds from IDB note bodies.
 * Returns the number of references updated.
 */
export async function rebuildAllReferenceLinks(): Promise<number> {
  const store = usePlotStore.getState()
  const references = store.references
  const refIds = new Set(Object.keys(references))
  if (refIds.size === 0) return 0

  // Build reverse map: refId → Set<noteId>
  const refToNotes = new Map<string, Set<string>>()
  for (const refId of refIds) {
    refToNotes.set(refId, new Set())
  }

  // 1. Scan note bodies from IDB
  try {
    const bodies = await getAllBodies()
    for (const body of bodies) {
      if (!body.contentJson) continue
      const ids = extractReferenceIds(body.contentJson)
      for (const refId of ids) {
        if (refToNotes.has(refId)) {
          refToNotes.get(refId)!.add(body.id)
        }
      }
    }
  } catch (err) {
    console.warn("[rebuildAllReferenceLinks] Failed to read note bodies:", err)
  }

  // 2. Scan wiki block bodies from IDB (if available)
  try {
    const wikiDB = await openWikiBlockBodiesDB()
    if (wikiDB) {
      const tx = wikiDB.transaction("bodies", "readonly")
      const allReq = tx.objectStore("bodies").getAll()
      const wikiBlocks = await new Promise<any[]>((resolve, reject) => {
        allReq.onsuccess = () => resolve(allReq.result ?? [])
        allReq.onerror = () => reject(allReq.error)
      })
      wikiDB.close()

      // Wiki articles store blocks with article ID — map block to article
      const wikiArticles = store.wikiArticles
      const blockToArticle = new Map<string, string>()
      for (const article of wikiArticles) {
        for (const block of article.blocks) {
          blockToArticle.set(block.id, article.id)
        }
      }

      for (const block of wikiBlocks) {
        if (!block.body) continue
        const ids = extractReferenceIds(block.body)
        const articleId = blockToArticle.get(block.id)
        if (!articleId) continue
        for (const refId of ids) {
          if (refToNotes.has(refId)) {
            refToNotes.get(refId)!.add(articleId)
          }
        }
      }
    }
  } catch (err) {
    // Wiki block IDB might not exist — that's OK
    console.warn("[rebuildAllReferenceLinks] Wiki block scan skipped:", err)
  }

  // 3. Update all references in one batch
  let updated = 0
  const nextRefs = { ...references }
  for (const [refId, noteIds] of refToNotes) {
    const ref = nextRefs[refId]
    if (!ref) continue
    const newIds = [...noteIds].sort()
    const oldIds = (ref.usedInNoteIds ?? []).sort()
    // Only update if changed
    if (JSON.stringify(newIds) !== JSON.stringify(oldIds)) {
      nextRefs[refId] = { ...ref, usedInNoteIds: newIds }
      updated++
    }
  }

  if (updated > 0) {
    usePlotStore.setState({ references: nextRefs })
  }

  return updated
}

/** Open the wiki-block-bodies IDB (returns null if it doesn't exist). */
async function openWikiBlockBodiesDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open("plot-wiki-block-bodies", 1)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
      req.onupgradeneeded = () => {
        // DB doesn't exist yet — close and return null
        req.result.close()
        resolve(null)
      }
    } catch {
      resolve(null)
    }
  })
}
