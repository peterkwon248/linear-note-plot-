/**
 * Full IDB backup → restore round-trip.
 *
 * Guards the data-integrity contract: every Plot IDB store must survive a
 * backup/restore cycle with its keys intact. Regression test for the
 * wiki-block-meta bug — that store is keyed OUT-OF-LINE by articleId, so it
 * must be dumped as "kv" (preserving keys), not "objects" (which dropped the
 * articleId mapping and failed to re-key on restore).
 */

import "fake-indexeddb/auto"
import { describe, it, expect, beforeEach } from "vitest"
import { createFullBackup, restoreFromBackup } from "@/lib/idb-backup"
import { saveArticleBlocks, getArticleBlocks } from "@/lib/wiki-block-meta-store"
import { saveBody, getBody } from "@/lib/note-body-store"
import { saveBlockBody, getBlockBody } from "@/lib/wiki-block-body-store"
import { saveBlob, getBlob } from "@/lib/attachment-store"
import type { WikiBlock, NoteBody } from "@/lib/types"

const ALL_DBS = [
  "plot-zustand",
  "plot-note-bodies",
  "plot-wiki-block-bodies",
  "plot-wiki-block-meta",
  "plot-attachments",
]

function deleteDB(name: string): Promise<void> {
  return new Promise((resolve) => {
    const req = indexedDB.deleteDatabase(name)
    req.onsuccess = () => resolve()
    req.onerror = () => resolve()
    req.onblocked = () => resolve()
  })
}

// plot-zustand persist store: DB "plot-zustand" v1, keyless store "kv",
// out-of-line key "plot-store", value = JSON string (mirrors lib/idb-storage.ts).
function putZustand(value: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("plot-zustand", 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv")
    }
    req.onsuccess = () => {
      const db = req.result
      const tx = db.transaction("kv", "readwrite")
      tx.objectStore("kv").put(value, "plot-store")
      tx.oncomplete = () => {
        db.close()
        resolve()
      }
      tx.onerror = () => {
        db.close()
        reject(tx.error)
      }
    }
    req.onerror = () => reject(req.error)
  })
}

function getZustand(): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("plot-zustand", 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv")
    }
    req.onsuccess = () => {
      const db = req.result
      const g = db.transaction("kv", "readonly").objectStore("kv").get("plot-store")
      g.onsuccess = () => {
        db.close()
        resolve((g.result as string) ?? null)
      }
      g.onerror = () => {
        db.close()
        reject(g.error)
      }
    }
    req.onerror = () => reject(req.error)
  })
}

describe("idb-backup round-trip", () => {
  beforeEach(async () => {
    await Promise.all(ALL_DBS.map(deleteDB))
  })

  it("round-trips every store, preserving out-of-line wiki block meta keys", async () => {
    const articleId = "wiki-1"
    const blocks = [
      { id: "blk-1", type: "text" },
      { id: "blk-2", type: "heading" },
    ] as unknown as WikiBlock[]
    const noteBody = {
      id: "note-1",
      content: "hello world",
      contentJson: { type: "doc", content: [] },
    } as unknown as NoteBody
    const zustand = JSON.stringify({
      state: {
        notes: [{ id: "note-1" }],
        wikiArticles: [{ id: articleId }],
        references: [],
      },
      version: 154,
    })

    // ── setup: the app writes data, creating each DB at its real version ──
    await saveArticleBlocks(articleId, blocks)
    await saveBody(noteBody)
    await saveBlockBody({ id: "blk-1", content: "block text", contentJson: { type: "doc" } })
    await saveBlob({ id: "att-1", data: new Uint8Array([1, 2, 3, 4, 5]).buffer })
    await putZustand(zustand)

    // ── backup ──
    const backup = await createFullBackup()

    // Fix #1: wiki block meta is dumped as "kv" with the articleId key intact.
    const metaDump = backup.dbs.find((d) => d.dbName === "plot-wiki-block-meta")!
    expect(metaDump.format).toBe("kv")
    expect(metaDump.missing).toBeFalsy()
    expect(metaDump.entries).toEqual([{ key: articleId, value: blocks }])
    expect(backup.stats.notesCount).toBe(1)
    expect(backup.stats.wikiArticlesCount).toBe(1)

    // simulate writing to / reading from a .json file on disk
    const onDisk = JSON.parse(JSON.stringify(backup))

    // ── mutate live data so a no-op restore cannot pass ──
    await saveArticleBlocks(articleId, [{ id: "stale" }] as unknown as WikiBlock[])
    await saveBody({ id: "note-1", content: "STALE", contentJson: {} } as unknown as NoteBody)

    // ── restore ──
    const summary = await restoreFromBackup(onDisk)
    expect(summary.perDb.some((d) => d.skipped)).toBe(false)

    // ── verify the originals are back ──
    expect(await getArticleBlocks(articleId)).toEqual(blocks)
    expect((await getBody("note-1"))?.content).toBe("hello world")
    expect((await getBlockBody("blk-1"))?.content).toBe("block text")
    const blob = await getBlob("att-1")
    expect(blob && new Uint8Array(blob.data)).toEqual(new Uint8Array([1, 2, 3, 4, 5]))
    expect(await getZustand()).toBe(zustand)
  })
})
