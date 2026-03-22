/**
 * Hook to resolve attachment:// URLs to displayable blob: URLs.
 *
 * Flow: attachment://<id> → IDB lookup → blob: URL (cached per session)
 *
 * Also handles legacy data: URLs (pass-through) and regular http(s) URLs.
 */

import { useEffect, useState } from "react"
import { getBlob } from "./attachment-store"

// Session-scoped cache: attachment ID → blob URL
// Prevents re-creating blob URLs on every render
const blobUrlCache = new Map<string, string>()

/**
 * Parse an attachment:// URL and return the attachment ID.
 * Returns null if the URL is not an attachment:// URL.
 */
export function parseAttachmentUrl(src: string): string | null {
  if (src.startsWith("attachment://")) {
    return src.slice("attachment://".length)
  }
  return null
}

/**
 * Check if a src string needs resolution (is an attachment:// URL).
 */
export function isAttachmentUrl(src: string): boolean {
  return src.startsWith("attachment://")
}

/**
 * Resolve an attachment ID to a blob: URL.
 * Uses a session-scoped cache to avoid redundant IDB reads.
 */
export async function resolveAttachmentUrl(attachmentId: string): Promise<string | null> {
  // Check cache first
  const cached = blobUrlCache.get(attachmentId)
  if (cached) return cached

  // Load from IDB
  const record = await getBlob(attachmentId)
  if (!record) return null

  // Create blob URL and cache it
  const blob = new Blob([record.data])
  const url = URL.createObjectURL(blob)
  blobUrlCache.set(attachmentId, url)
  return url
}

/**
 * React hook that resolves any src to a displayable URL.
 *
 * - attachment://<id> → loads from IDB, returns blob: URL
 * - data:... → pass-through (legacy support)
 * - http(s):// → pass-through
 */
export function useAttachmentUrl(src: string): { url: string | null; loading: boolean } {
  const [url, setUrl] = useState<string | null>(() => {
    // Synchronous fast path for non-attachment URLs
    if (!isAttachmentUrl(src)) return src
    // Check cache synchronously
    const id = parseAttachmentUrl(src)
    if (id) {
      const cached = blobUrlCache.get(id)
      if (cached) return cached
    }
    return null
  })
  const [loading, setLoading] = useState(() => isAttachmentUrl(src) && url === null)

  useEffect(() => {
    if (!isAttachmentUrl(src)) {
      setUrl(src)
      setLoading(false)
      return
    }

    const id = parseAttachmentUrl(src)
    if (!id) {
      setUrl(null)
      setLoading(false)
      return
    }

    // Check cache
    const cached = blobUrlCache.get(id)
    if (cached) {
      setUrl(cached)
      setLoading(false)
      return
    }

    // Async load from IDB
    let cancelled = false
    setLoading(true)

    resolveAttachmentUrl(id).then((resolved) => {
      if (!cancelled) {
        setUrl(resolved)
        setLoading(false)
      }
    })

    return () => { cancelled = true }
  }, [src])

  return { url, loading }
}

/**
 * Cleanup: revoke all cached blob URLs.
 * Call on app teardown if needed (not strictly necessary — browser
 * revokes them when the page unloads).
 */
export function revokeAllBlobUrls(): void {
  for (const url of blobUrlCache.values()) {
    URL.revokeObjectURL(url)
  }
  blobUrlCache.clear()
}
