/**
 * Full IndexedDB Backup utility.
 *
 * Dumps every Plot-related IDB database into a single JSON snapshot
 * suitable for download. Used as the pre-migration safety net in
 * `docs/PHASE-PLAN-wiki-enrichment.md` (PF-1).
 *
 * Targets:
 * - plot-zustand (Zustand persist — 22 slice)
 * - plot-note-bodies (note contentJson)
 * - plot-wiki-block-bodies (wiki block contentJson)
 * - plot-wiki-block-meta (wiki block metadata)
 * - plot-attachments (attachment blobs — base64 encoded)
 *
 * Excluded (regenerated on demand; reset after restore so they rebuild
 * from the restored data instead of stale pre-restore state):
 * - plot-search-cache (FlexSearch index)
 * - plot-mention-index (backlink edges)
 */

export type BackupFormat = "kv" | "objects" | "attachments"

export interface BackupDBDump {
  dbName: string
  storeName: string
  format: BackupFormat
  /**
   * - "kv": [{ key: string, value: any }]
   * - "objects": raw objects with `id` field
   * - "attachments": [{ id: string, data_base64: string, size: number }]
   */
  entries: unknown[]
  /** `true` if the database/store was missing. Entries will be empty. */
  missing?: boolean
  /** Error message if dump failed. */
  error?: string
}

export interface PlotBackup {
  version: "1"
  generator: "plot"
  timestamp: number
  createdAt: string
  /** Zustand persist schema version (from store config). */
  schemaVersion: number
  stats: {
    notesCount: number
    wikiArticlesCount: number
    referencesCount: number
    totalEntries: number
    totalSizeBytes: number
  }
  dbs: BackupDBDump[]
}

// ── Utilities ───────────────────────────────────────────────────────────

function promisifyReq<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/**
 * Convert ArrayBuffer → base64 string via chunked processing.
 * Chunked to avoid "Maximum call stack" on large buffers.
 */
function arrayBufferToBase64(ab: ArrayBuffer): string {
  const bytes = new Uint8Array(ab)
  const CHUNK = 0x8000
  let binary = ""
  for (let i = 0; i < bytes.byteLength; i += CHUNK) {
    const chunk = bytes.subarray(i, Math.min(i + CHUNK, bytes.byteLength))
    binary += String.fromCharCode.apply(null, chunk as unknown as number[])
  }
  return btoa(binary)
}

function openDbReadonly(dbName: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// ── Core dump ───────────────────────────────────────────────────────────

async function dumpDB(
  dbName: string,
  storeName: string,
  format: BackupFormat
): Promise<BackupDBDump> {
  let db: IDBDatabase
  try {
    db = await openDbReadonly(dbName)
  } catch (e) {
    return {
      dbName,
      storeName,
      format,
      entries: [],
      missing: true,
      error: e instanceof Error ? e.message : String(e),
    }
  }

  try {
    if (!db.objectStoreNames.contains(storeName)) {
      return { dbName, storeName, format, entries: [], missing: true }
    }

    const tx = db.transaction(storeName, "readonly")
    const store = tx.objectStore(storeName)

    if (format === "kv") {
      const keysReq = store.getAllKeys()
      const valuesReq = store.getAll()
      const [keys, values] = await Promise.all([
        promisifyReq(keysReq),
        promisifyReq(valuesReq),
      ])
      const entries = (keys as unknown[]).map((k, i) => ({
        key: String(k),
        value: (values as unknown[])[i],
      }))
      return { dbName, storeName, format, entries }
    }

    if (format === "attachments") {
      const valuesReq = store.getAll()
      const values = await promisifyReq(valuesReq)
      const entries = (values as Array<{ id: string; data: ArrayBuffer }>).map(
        (att) => ({
          id: att.id,
          data_base64: arrayBufferToBase64(att.data),
          size: att.data?.byteLength ?? 0,
        })
      )
      return { dbName, storeName, format, entries }
    }

    // "objects" — objects with keyPath "id"
    const valuesReq = store.getAll()
    const values = await promisifyReq(valuesReq)
    return { dbName, storeName, format, entries: values as unknown[] }
  } catch (e) {
    return {
      dbName,
      storeName,
      format,
      entries: [],
      error: e instanceof Error ? e.message : String(e),
    }
  } finally {
    db.close()
  }
}

// ── Backup orchestration ────────────────────────────────────────────────

const BACKUP_TARGETS: Array<{
  dbName: string
  storeName: string
  format: BackupFormat
}> = [
  { dbName: "plot-zustand", storeName: "kv", format: "kv" },
  { dbName: "plot-note-bodies", storeName: "bodies", format: "objects" },
  { dbName: "plot-wiki-block-bodies", storeName: "bodies", format: "objects" },
  // wiki block metadata is keyed OUT-OF-LINE by articleId (value = WikiBlock[]),
  // so it must use "kv" — "objects" would drop the articleId keys on dump and
  // fail to re-key on restore (put without key on a keyless store).
  { dbName: "plot-wiki-block-meta", storeName: "blocks", format: "kv" },
  { dbName: "plot-attachments", storeName: "blobs", format: "attachments" },
]

function countEntities(x: unknown): number {
  if (Array.isArray(x)) return x.length
  if (x && typeof x === "object") return Object.keys(x as object).length
  return 0
}

/**
 * Create a full snapshot of every Plot IDB database.
 * Caller is responsible for downloading or importing later.
 */
export async function createFullBackup(): Promise<PlotBackup> {
  const dbs = await Promise.all(
    BACKUP_TARGETS.map(({ dbName, storeName, format }) =>
      dumpDB(dbName, storeName, format)
    )
  )

  // Derive high-level stats from the Zustand persist payload
  let notesCount = 0
  let wikiArticlesCount = 0
  let referencesCount = 0
  let schemaVersion = 0

  const kvDump = dbs.find((d) => d.dbName === "plot-zustand")
  if (kvDump) {
    const storeEntry = (kvDump.entries as Array<{ key: string; value: unknown }>).find(
      (e) => e.key === "plot-store"
    )
    if (storeEntry) {
      try {
        const parsed =
          typeof storeEntry.value === "string"
            ? JSON.parse(storeEntry.value)
            : storeEntry.value
        const state = parsed?.state ?? parsed
        notesCount = countEntities(state?.notes)
        wikiArticlesCount = countEntities(state?.wikiArticles)
        referencesCount = countEntities(state?.references)
        schemaVersion = typeof parsed?.version === "number" ? parsed.version : 0
      } catch {
        /* ignore parse errors — stats will stay 0 */
      }
    }
  }

  const totalEntries = dbs.reduce((sum, d) => sum + d.entries.length, 0)

  const backup: PlotBackup = {
    version: "1",
    generator: "plot",
    timestamp: Date.now(),
    createdAt: new Date().toISOString(),
    schemaVersion,
    stats: {
      notesCount,
      wikiArticlesCount,
      referencesCount,
      totalEntries,
      totalSizeBytes: 0, // filled after serialization
    },
    dbs,
  }

  return backup
}

/**
 * Serialize a backup into a File-download-ready JSON string plus size.
 * Called by `downloadBackup` but exposed for testing or import workflows.
 */
export function serializeBackup(backup: PlotBackup): {
  json: string
  sizeBytes: number
} {
  const json = JSON.stringify(backup)
  const sizeBytes = new Blob([json]).size
  return { json, sizeBytes }
}

/**
 * Trigger a browser download of the full backup.
 * Filename format: `plot-full-backup-YYYY-MM-DD.json`.
 */
export async function downloadFullBackup(): Promise<{
  sizeBytes: number
  stats: PlotBackup["stats"]
}> {
  const backup = await createFullBackup()
  const { json, sizeBytes } = serializeBackup(backup)
  backup.stats.totalSizeBytes = sizeBytes

  // Re-serialize with the final size included (small overhead, not a real concern)
  const finalJson = JSON.stringify(backup)
  const blob = new Blob([finalJson], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  const date = new Date().toISOString().slice(0, 10)
  a.download = `plot-full-backup-${date}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  return { sizeBytes, stats: backup.stats }
}

/**
 * Format byte count for display ("1.23 MB", "456 KB", etc.).
 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

// ── Restore from backup ─────────────────────────────────────────────────

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64)
  const len = bin.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i)
  return bytes.buffer
}

/** Open the target DB for writing, creating the object store if missing.
 *  Tries a plain (versionless) open first; if the required store is absent,
 *  re-opens with version + 1 and runs an upgrade transaction. */
function openDbForRestore(dbName: string, storeName: string, format: BackupFormat): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => {
      const db = req.result
      if (db.objectStoreNames.contains(storeName)) {
        resolve(db)
        return
      }
      const nextVersion = db.version + 1
      db.close()
      const upgradeReq = indexedDB.open(dbName, nextVersion)
      upgradeReq.onerror = () => reject(upgradeReq.error)
      upgradeReq.onupgradeneeded = () => {
        const upgraded = upgradeReq.result
        if (!upgraded.objectStoreNames.contains(storeName)) {
          // "kv" dumps are keyed out-of-line (the key is passed to put());
          // every other format stores objects with an in-line "id" keyPath.
          // Keyed by FORMAT, not store name — plot-wiki-block-meta's "blocks"
          // store is also out-of-line (key = articleId), so it uses "kv" too.
          const keyPath = format === "kv" ? undefined : "id"
          upgraded.createObjectStore(storeName, keyPath ? { keyPath } : undefined)
        }
      }
      upgradeReq.onsuccess = () => resolve(upgradeReq.result)
    }
  })
}

async function restoreDump(dump: BackupDBDump): Promise<{ written: number }> {
  if (dump.missing) return { written: 0 }
  const db = await openDbForRestore(dump.dbName, dump.storeName, dump.format)
  try {
    const tx = db.transaction(dump.storeName, "readwrite")
    const store = tx.objectStore(dump.storeName)
    await promisifyReq(store.clear())

    let written = 0
    if (dump.format === "kv") {
      for (const entry of dump.entries as Array<{ key: string; value: unknown }>) {
        store.put(entry.value, entry.key)
        written++
      }
    } else if (dump.format === "attachments") {
      for (const entry of dump.entries as Array<{ id: string; data_base64: string }>) {
        store.put({ id: entry.id, data: base64ToArrayBuffer(entry.data_base64) })
        written++
      }
    } else {
      // "objects" — id keyPath; the value already carries `id`.
      for (const entry of dump.entries as Array<Record<string, unknown>>) {
        store.put(entry)
        written++
      }
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
    return { written }
  } finally {
    db.close()
  }
}

export interface RestoreSummary {
  perDb: Array<{ dbName: string; storeName: string; written: number; skipped?: string }>
  totalWritten: number
}

/**
 * Restore a Plot backup into the current browser. Clears the target DBs
 * before writing — the user's existing data in any included store is
 * replaced. Caller is responsible for prompting confirmation and reloading
 * the page so the Zustand store re-hydrates from the new snapshot.
 */
export async function restoreFromBackup(raw: unknown): Promise<RestoreSummary> {
  const backup = raw as PlotBackup
  if (!backup || backup.generator !== "plot") {
    throw new Error("Not a Plot backup file (generator mismatch)")
  }
  if (backup.version !== "1") {
    throw new Error(`Unsupported backup version: ${backup.version}`)
  }
  if (!Array.isArray(backup.dbs)) {
    throw new Error("Backup is missing the `dbs` payload")
  }

  const summary: RestoreSummary = { perDb: [], totalWritten: 0 }
  for (const dump of backup.dbs) {
    if (dump.missing) {
      summary.perDb.push({ dbName: dump.dbName, storeName: dump.storeName, written: 0, skipped: "missing in backup" })
      continue
    }
    if (dump.error) {
      summary.perDb.push({ dbName: dump.dbName, storeName: dump.storeName, written: 0, skipped: `dump error: ${dump.error}` })
      continue
    }
    const { written } = await restoreDump(dump)
    summary.perDb.push({ dbName: dump.dbName, storeName: dump.storeName, written })
    summary.totalWritten += written
  }
  return summary
}

/** Read a File handle as JSON and pipe through {@link restoreFromBackup}. */
export async function restoreFromFile(file: File): Promise<RestoreSummary> {
  const text = await file.text()
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (e) {
    throw new Error(`File is not valid JSON: ${e instanceof Error ? e.message : String(e)}`)
  }
  return restoreFromBackup(parsed)
}
