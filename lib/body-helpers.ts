"use client"

/**
 * Extract a plaintext preview from markdown content.
 * Strips headings, formatting chars, and trims to maxLen.
 */
export function extractPreview(content: string, maxLen = 120): string {
  return content
    .replace(/^#{1,6}\s+/gm, "")      // strip heading markers
    .replace(/[*_~`[\]]/g, "")         // strip formatting chars
    .replace(/\n+/g, " ")             // collapse newlines
    .trim()
    .slice(0, maxLen)
}

/**
 * Extract [[wiki-link]] targets from content, lowercased.
 * Returns unique link targets.
 */
export function extractLinksOut(content: string): string[] {
  const matches = content.match(/\[\[([^\]]+)\]\]/g)
  if (!matches) return []
  const unique = new Set(matches.map((m) => m.slice(2, -2).toLowerCase()))
  return Array.from(unique)
}
