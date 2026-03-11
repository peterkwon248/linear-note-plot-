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
 * Extract #hashtag tokens from content.
 * Only matches tags followed by whitespace or at end of string,
 * so IME composition (e.g. Korean) mid-typing won't create partial tags.
 * Supports Unicode. Skips pure-number tags like #123.
 * Returns unique tag names (preserves original case of first occurrence).
 */
export function extractHashtags(content: string): string[] {
  const regex = /#([\p{L}\p{N}_][\p{L}\p{N}_]*)(?=[\s\n,;.!?]|$)/gu
  const seen = new Map<string, string>() // lowercase → original
  let match
  while ((match = regex.exec(content)) !== null) {
    const tag = match[1]
    if (/^\d+$/.test(tag)) continue // skip pure numbers
    const lower = tag.toLowerCase()
    if (!seen.has(lower)) seen.set(lower, tag)
  }
  return Array.from(seen.values())
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
