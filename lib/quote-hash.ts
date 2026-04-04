/**
 * Simple djb2 hash for detecting source content changes.
 * Used by WikiQuote to warn when the original note has been modified.
 */
export function computeSourceHash(content: string): string {
  let hash = 5381
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) + hash) + content.charCodeAt(i)
    hash = hash & hash // 32bit integer
  }
  return (hash >>> 0).toString(36)
}
