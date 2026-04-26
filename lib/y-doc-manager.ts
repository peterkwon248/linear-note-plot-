/**
 * Y.Doc singleton manager for experimental split-view sync + IDB persistence.
 *
 * Returns the SAME Y.Doc instance for a given entity ID, so multiple
 * TipTap editors opened for the same note/wiki share a single CRDT
 * document. Collaboration extension binds ProseMirror state to this
 * Y.Doc → edits on one editor automatically propagate to the other.
 *
 * P0-1: y-indexeddb persistence is now attached at acquire time so the
 * Y.Doc state (CRDT undo history + collab metadata) survives a page
 * reload. The persistence is per-entity (one IDB DB per Y.Doc) so a
 * note's history is independent from other notes.
 *
 * Persistence lifecycle:
 *  - acquire(scope,id) → new IndexeddbPersistence("plot-yjs:scope:id", doc)
 *  - whenReady resolves to the IndexeddbPersistence's whenSynced.then(()⇒void)
 *    so callers can await hydration before deciding whether to seed initial
 *    content. Seeding before hydration would race the IDB load and either
 *    (a) overwrite persisted data with stale store content, or
 *    (b) duplicate the seed on top of restored state.
 *  - release() at refCount 0 → persistence.destroy() (closes IDB connection,
 *    flushes pending writes) before doc.destroy().
 */
import * as Y from "yjs"
import { IndexeddbPersistence } from "y-indexeddb"

type Scope = "note" | "wiki"

interface Registered {
  doc: Y.Doc
  refCount: number
  persistence: IndexeddbPersistence | null
  /**
   * Resolves once the IndexeddbPersistence has finished hydrating the Y.Doc
   * from IDB (or immediately if persistence is unavailable / disabled).
   * Cached so every acquirer sees the same Promise — no per-call recreation.
   */
  whenReady: Promise<void>
  /**
   * True iff this Y.Doc was created in-memory AND no prior IDB data was
   * found after hydration. Determined at hydration time, frozen after.
   * Callers that opt-in must await `whenReady` before reading this.
   */
  isFresh: boolean
}

const registry = new Map<string, Registered>()

function key(scope: Scope, id: string): string {
  return `${scope}:${id}`
}

function persistenceKey(scope: Scope, id: string): string {
  // IndexedDB DB name. Per-entity so notes don't share update streams.
  return `plot-yjs:${scope}:${id}`
}

export interface AcquireResult {
  doc: Y.Doc
  /**
   * Resolves after IDB hydration completes. Read `isFresh` (via the
   * exported helper) AFTER awaiting this.
   */
  whenReady: Promise<void>
  /**
   * Snapshot at acquire-time. UNRELIABLE for seed decisions — only use
   * it after `whenReady` resolves. Kept on the result for backwards
   * compatibility with the in-memory PoC; new code should prefer
   * `getIsFresh(scope,id)` after hydration.
   */
  isFresh: boolean
}

/**
 * Heuristic: does this Y.Doc already contain non-trivial application data?
 * Y.encodeStateAsUpdate always returns ≥2 bytes (header), so length alone is
 * misleading — we instead inspect the shared types map directly. Empty doc
 * has `share.size === 0`. Once Collaboration mounts and seeds an empty
 * paragraph, share.size becomes 1 (the "default" XmlFragment exists) but its
 * fragment length is 0. We treat both as "no prior data".
 */
function hasMeaningfulContent(doc: Y.Doc): boolean {
  try {
    if (doc.share.size === 0) return false
    // Inspect the conventional "default" field used by @tiptap/extension-collaboration.
    const fragment = doc.getXmlFragment("default")
    if (fragment.length > 0) return true
    // Other shared types could also count as data, but for the note tier we
    // only ever populate the "default" XmlFragment. Any other shared type
    // probably came from y-indexeddb's own bookkeeping or a future feature.
    return false
  } catch {
    return false
  }
}

/**
 * Acquire (or reuse) a Y.Doc for the given scope+id.
 * Call `releaseYDoc` when the editor unmounts to allow GC.
 */
export function acquireYDoc(scope: Scope, id: string): AcquireResult {
  const k = key(scope, id)
  const existing = registry.get(k)
  if (existing) {
    existing.refCount += 1
    if (typeof window !== "undefined") {
      console.debug("[y-doc] reuse", k, "refCount=", existing.refCount)
    }
    return {
      doc: existing.doc,
      whenReady: existing.whenReady,
      // Mid-session re-acquires are never fresh — the doc is already loaded.
      isFresh: false,
    }
  }

  const doc = new Y.Doc()

  // SSR / non-browser env: skip IDB persistence (it relies on `indexedDB`
  // which is undefined in Node). Build still loads this module during
  // pre-render of the (client-only) editor wrappers, so we must not throw.
  let persistence: IndexeddbPersistence | null = null
  let whenReady: Promise<void>
  if (typeof window !== "undefined" && typeof indexedDB !== "undefined") {
    try {
      persistence = new IndexeddbPersistence(persistenceKey(scope, id), doc)
      whenReady = persistence.whenSynced.then(() => undefined)
    } catch (e) {
      console.warn("[y-doc] IDB persistence init failed for", k, e)
      whenReady = Promise.resolve()
    }
  } else {
    whenReady = Promise.resolve()
  }

  // Default isFresh=true; flipped to false if hydration finds prior data.
  // Read by callers ONLY after awaiting whenReady.
  const entry: Registered = {
    doc,
    refCount: 1,
    persistence,
    whenReady,
    isFresh: true,
  }
  registry.set(k, entry)

  if (typeof window !== "undefined") {
    console.debug("[y-doc] create", k, persistence ? "(idb)" : "(memory-only)")
  }

  // Resolve isFresh after hydration. Mutates the SAME entry object so all
  // current refs see the updated value once whenReady resolves.
  whenReady
    .then(() => {
      // Entry could have been released between acquire and hydration. If so,
      // freeing it again is a no-op below.
      const live = registry.get(k)
      if (!live) return
      live.isFresh = !hasMeaningfulContent(doc)
      if (typeof window !== "undefined") {
        console.debug(
          "[y-doc] hydrated",
          k,
          "isFresh=",
          live.isFresh,
          "share.size=",
          doc.share.size,
        )
      }
    })
    .catch((e) => {
      console.warn("[y-doc] hydration error for", k, e)
    })

  return { doc, whenReady, isFresh: true }
}

/**
 * Release a reference to the Y.Doc. When refCount reaches zero the
 * Y.Doc is destroyed and removed from the registry.
 */
export function releaseYDoc(scope: Scope, id: string): void {
  const k = key(scope, id)
  const entry = registry.get(k)
  if (!entry) return
  entry.refCount -= 1
  if (typeof window !== "undefined") {
    console.debug("[y-doc] release", k, "refCount=", entry.refCount)
  }
  if (entry.refCount <= 0) {
    // Tear down persistence first so pending writes flush before the doc
    // is destroyed and the IDB transaction handles become orphans.
    if (entry.persistence) {
      try {
        // destroy() returns a Promise<void> but we don't need to await — the
        // IDB layer queues outstanding writes internally before closing.
        void entry.persistence.destroy()
      } catch (e) {
        console.warn("[y-doc] persistence.destroy failed for", k, e)
      }
    }
    entry.doc.destroy()
    registry.delete(k)
    if (typeof window !== "undefined") {
      console.debug("[y-doc] destroy", k)
    }
  }
}

/** Debug helper. Returns current registry size. */
export function getRegistrySize(): number {
  return registry.size
}

/** Debug helper. Returns current refCount for a given (scope,id). */
export function getRefCount(scope: Scope, id: string): number {
  return registry.get(key(scope, id))?.refCount ?? 0
}

/**
 * Read the latest `isFresh` status for an entity. Returns null if the doc
 * is not registered. Callers should only trust this AFTER awaiting the
 * `whenReady` Promise from acquireYDoc.
 */
export function getIsFresh(scope: Scope, id: string): boolean | null {
  return registry.get(key(scope, id))?.isFresh ?? null
}

/**
 * Experimental flag. Enabled if ANY of the following is true:
 *  - `?yjs=1` query param in URL (temporary, easy for one-off tests)
 *  - `localStorage["plot.yjs"] === "1"` (persistent across reloads)
 *  - `window.__PLOT_YJS__ === true` (runtime override for DevTools)
 *
 * Safe default OFF — existing users see no change.
 */
export function isYjsExperimentEnabled(): boolean {
  if (typeof window === "undefined") return false
  try {
    if ((window as unknown as { __PLOT_YJS__?: boolean }).__PLOT_YJS__ === true) return true
    if (new URLSearchParams(window.location.search).get("yjs") === "1") return true
    if (window.localStorage?.getItem("plot.yjs") === "1") return true
    return false
  } catch {
    return false
  }
}

/** Toggle the experiment flag from DevTools: `window.plotYjs(true)` */
if (typeof window !== "undefined") {
  ;(window as unknown as { plotYjs?: (on: boolean) => string }).plotYjs = (on: boolean) => {
    try {
      if (on) window.localStorage.setItem("plot.yjs", "1")
      else window.localStorage.removeItem("plot.yjs")
    } catch {
      /* ignore */
    }
    return `plot.yjs = ${on ? "ON" : "OFF"} — reload the page to apply`
  }
}
