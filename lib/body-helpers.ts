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
 * By default, only matches tags followed by whitespace/punctuation (UpNote-style).
 * Set includeEos=true to also match tags at end of string (for final extraction).
 * Supports Unicode. Skips pure-number tags like #123.
 * Returns unique tag names (preserves original case of first occurrence).
 */
export function extractHashtags(content: string, { includeEos = false } = {}): string[] {
  const regex = includeEos
    ? /#([\p{L}\p{N}_][\p{L}\p{N}_]*)(?=[\s\n,;.!?]|$)/gu
    : /#([\p{L}\p{N}_][\p{L}\p{N}_]*)(?=[\s\n,;.!?])/gu
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

/**
 * Extract [[wiki-link]] targets from WikiArticle blocks.
 * Scans text and section blocks for [[links]] in content/title fields.
 * Returns unique lowercased link targets.
 */
/**
 * Extract task items (checkboxes) from TipTap contentJson.
 * Recursively walks the JSON tree looking for taskItem nodes.
 */
export function extractTasks(contentJson: Record<string, unknown> | null): Array<{ text: string; checked: boolean; position: number }> {
  if (!contentJson) return []
  const tasks: Array<{ text: string; checked: boolean; position: number }> = []
  let pos = 0

  function walk(node: Record<string, unknown>) {
    if (node.type === "taskItem") {
      const attrs = (node.attrs as Record<string, unknown>) ?? {}
      const checked = attrs.checked === true
      // Extract text from child paragraphs
      const textParts: string[] = []
      const content = node.content as Array<Record<string, unknown>> | undefined
      if (content) {
        for (const child of content) {
          if (child.type === "paragraph" || child.type === "text") {
            collectText(child, textParts)
          }
        }
      }
      tasks.push({ text: textParts.join("").trim(), checked, position: pos++ })
    }
    // Recurse into children
    const content = node.content as Array<Record<string, unknown>> | undefined
    if (content && node.type !== "taskItem") {
      for (const child of content) {
        walk(child)
      }
    }
  }

  function collectText(node: Record<string, unknown>, parts: string[]) {
    if (node.type === "text" && typeof node.text === "string") {
      parts.push(node.text)
    }
    const content = node.content as Array<Record<string, unknown>> | undefined
    if (content) {
      for (const child of content) {
        collectText(child, parts)
      }
    }
  }

  walk(contentJson)
  return tasks
}

export function extractLinksFromWikiBlocks(blocks: { type: string; content?: string; title?: string }[]): string[] {
  const links = new Set<string>()
  for (const block of blocks) {
    if (block.type === "text" || block.type === "section") {
      const content = block.content || block.title || ""
      const matches = content.match(/\[\[([^\]]+)\]\]/g)
      if (matches) {
        for (const m of matches) {
          links.add(m.slice(2, -2).toLowerCase().trim())
        }
      }
    }
  }
  return Array.from(links)
}
