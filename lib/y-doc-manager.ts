/**
 * Y.Doc singleton manager for experimental split-view sync.
 *
 * Returns the SAME Y.Doc instance for a given entity ID, so multiple
 * TipTap editors opened for the same note/wiki share a single CRDT
 * document. Collaboration extension binds ProseMirror state to this
 * Y.Doc → edits on one editor automatically propagate to the other.
 *
 * PoC scope: in-memory only. No IDB persistence.
 * When the page reloads the Y.Doc is discarded, but the regular
 * contentJson save path (note.contentJson → plot-note-bodies IDB)
 * still runs, so actual user data is not lost.
 */

import * as Y from "yjs"

type Scope = "note" | "wiki"

interface Registered {
  doc: Y.Doc
  refCount: number
}

const registry = new Map<string, Registered>()

function key(scope: Scope, id: string): string {
  return `${scope}:${id}`
}

export interface AcquireResult {
  doc: Y.Doc
  /** True when this call created the Y.Doc (refCount was 0). Only the first
   *  caller should seed initial content so later joiners don't overwrite
   *  edits that arrived in the meantime. */
  isFresh: boolean
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
    return { doc: existing.doc, isFresh: false }
  }
  const doc = new Y.Doc()
  registry.set(k, { doc, refCount: 1 })
  if (typeof window !== "undefined") {
    console.debug("[y-doc] create", k)
  }
  return { doc, isFresh: true }
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
