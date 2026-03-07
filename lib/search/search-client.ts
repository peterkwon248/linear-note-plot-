type NoteData = { id: string; title: string; content: string }
type InitNoteData = NoteData & { updatedAt: string }

interface ReadyInfo {
  source: "cache" | "rebuild"
  deltaUpserts?: number
  deltaDeletes?: number
  total: number
}

class SearchClient {
  private worker: Worker | null = null
  private reqCounter = 0
  private pendingQueries = new Map<number, (ids: string[]) => void>()
  private readyResolve: ((info: ReadyInfo) => void) | null = null
  private readyPromise: Promise<ReadyInfo> | null = null
  private progressCallback:
    | ((indexed: number, total: number) => void)
    | null = null

  private ensureWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(
        new URL("./search-worker.ts", import.meta.url)
      )
      this.worker.onmessage = (e: MessageEvent) => {
        const msg = e.data
        switch (msg.type) {
          case "READY":
            if (this.readyResolve) {
              this.readyResolve({
                source: msg.source ?? "rebuild",
                deltaUpserts: msg.deltaUpserts,
                deltaDeletes: msg.deltaDeletes,
                total: msg.total ?? 0,
              })
              this.readyResolve = null
            }
            break
          case "PROGRESS":
            if (this.progressCallback) {
              this.progressCallback(msg.indexed, msg.total)
            }
            break
          case "RESULTS": {
            const resolve = this.pendingQueries.get(msg.reqId)
            if (resolve) {
              this.pendingQueries.delete(msg.reqId)
              resolve(msg.ids)
            }
            break
          }
          case "CACHE_SAVED":
            console.log(
              `[SearchClient] Cache saved (${msg.chunkCount} chunks)`
            )
            break
          case "CACHE_CLEARED":
            console.log("[SearchClient] Cache cleared")
            break
        }
      }
    }
    return this.worker
  }

  init(
    notes: InitNoteData[],
    onProgress?: (indexed: number, total: number) => void
  ): Promise<ReadyInfo> {
    const worker = this.ensureWorker()
    this.progressCallback = onProgress ?? null
    const initStart = performance.now()
    this.readyPromise = new Promise<ReadyInfo>((resolve) => {
      this.readyResolve = (info: ReadyInfo) => {
        const elapsed = Math.round(performance.now() - initStart)
        if (typeof window !== "undefined") {
          ;(window as unknown as Record<string, unknown>).__SEARCH_INDEX_MS = elapsed
        }
        const cacheMsg =
          info.source === "cache"
            ? ` (from cache, delta: +${info.deltaUpserts ?? 0}/-${info.deltaDeletes ?? 0})`
            : " (full rebuild)"
        console.log(
          `[SearchClient] Ready in ${elapsed}ms for ${info.total} notes${cacheMsg}`
        )
        resolve(info)
      }
    })
    worker.postMessage({ type: "INIT", notes })
    return this.readyPromise
  }

  search(query: string, limit: number = 20): Promise<string[]> {
    const worker = this.ensureWorker()
    const reqId = ++this.reqCounter
    return new Promise<string[]>((resolve) => {
      this.pendingQueries.set(reqId, resolve)
      worker.postMessage({ type: "QUERY", query, limit, reqId })
    })
  }

  upsert(note: NoteData, updatedAt?: string): void {
    const worker = this.ensureWorker()
    worker.postMessage({ type: "UPSERT", note, updatedAt })
  }

  remove(id: string): void {
    const worker = this.ensureWorker()
    worker.postMessage({ type: "DELETE", id })
  }

  /** Trigger immediate cache save (call on beforeunload) */
  saveNow(): void {
    if (this.worker) {
      this.worker.postMessage({ type: "SAVE_NOW" })
    }
  }

  /** Clear persisted cache */
  clearCache(): void {
    if (this.worker) {
      this.worker.postMessage({ type: "CLEAR_CACHE" })
    }
  }

  destroy(): void {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
    this.pendingQueries.clear()
    this.readyResolve = null
    this.readyPromise = null
    this.progressCallback = null
  }
}

export const searchClient = new SearchClient()
