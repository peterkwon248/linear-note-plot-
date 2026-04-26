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
  const unique = new Set(matches.map((m) => {
    let title = m.slice(2, -2).toLowerCase()
    // Strip "wiki:" prefix (used for explicit wiki links)
    if (title.startsWith("wiki:")) title = title.slice(5)
    return title
  }))
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

// ─────────────────────────────────────────────────────────────────────
// Block-level link context extraction (for backlink panels with snippets)
// ─────────────────────────────────────────────────────────────────────

export type LinkKind = "wikilink" | "noteEmbed" | "wikiEmbed" | "referenceLink"

export interface BlockLinkContext {
  /** UniqueID of the top-level block (heading/paragraph/etc) where the link lives. */
  blockId: string
  /** Top-level block type (e.g. "paragraph", "heading"). */
  blockType: string
  /** ~100-char text snippet around the link (full block text trimmed). */
  text: string
  /** Which kind of inline node referenced the target. */
  linkKind: LinkKind
}

/** Read attrs.id from a node (UniqueID extension). */
function getNodeId(node: Record<string, unknown>): string | null {
  const attrs = (node.attrs as Record<string, unknown> | undefined) ?? undefined
  if (attrs && typeof attrs.id === "string" && attrs.id) return attrs.id
  return null
}

/** Recursively concat all `text` fields + wikilink labels in a subtree. */
function collectInlineText(node: Record<string, unknown>, parts: string[], depth = 0) {
  if (depth > 12) return
  if (typeof node !== "object" || node === null) return

  const type = node.type
  const attrs = (node.attrs as Record<string, unknown> | undefined) ?? {}

  if (type === "text" && typeof node.text === "string") {
    parts.push(node.text)
    return
  }

  // Wikilink atom: contribute its display title
  if (type === "wikilink") {
    const title = typeof attrs.title === "string" ? attrs.title : ""
    if (title) parts.push(title)
    return
  }

  // referenceLink atom: contribute its title
  if (type === "referenceLink") {
    const title = typeof attrs.title === "string" ? attrs.title : ""
    if (title) parts.push(title)
    return
  }

  // mention atom: contribute its label
  if (type === "mention") {
    const label = typeof attrs.label === "string" ? attrs.label : ""
    if (label) parts.push(`@${label}`)
    return
  }

  const content = node.content as Array<Record<string, unknown>> | undefined
  if (Array.isArray(content)) {
    for (const child of content) collectInlineText(child, parts, depth + 1)
  }
}

/**
 * Determine if an inline node references the given target.
 * Returns the matching linkKind, or null if no match.
 */
function matchInlineLink(
  node: Record<string, unknown>,
  target: { kind: "note" | "wiki"; id: string },
  targetTitleLower: string | null,
): LinkKind | null {
  const type = node.type
  const attrs = (node.attrs as Record<string, unknown> | undefined) ?? {}

  if (type === "wikilink") {
    const targetId = typeof attrs.targetId === "string" ? attrs.targetId : null
    if (targetId && targetId === target.id) return "wikilink"
    // Fallback: unresolved wikilinks (red links) — match by title
    if (!targetId && targetTitleLower) {
      const title = typeof attrs.title === "string" ? attrs.title.toLowerCase().trim() : ""
      if (title && title === targetTitleLower) return "wikilink"
    }
    return null
  }

  if (type === "noteEmbed") {
    if (target.kind !== "note") return null
    const noteId = typeof attrs.noteId === "string" ? attrs.noteId : null
    return noteId === target.id ? "noteEmbed" : null
  }

  if (type === "wikiEmbed") {
    if (target.kind !== "wiki") return null
    const articleId = typeof attrs.articleId === "string" ? attrs.articleId : null
    return articleId === target.id ? "wikiEmbed" : null
  }

  if (type === "referenceLink") {
    // referenceLink uses a referenceId pointing at a Reference entity, not a note.
    // We surface it only when target.id matches the referenceId verbatim (rare,
    // but harmless). Skip otherwise — references aren't notes.
    const referenceId = typeof attrs.referenceId === "string" ? attrs.referenceId : null
    return referenceId && referenceId === target.id ? "referenceLink" : null
  }

  if (type === "mention") {
    const mentionType = typeof attrs.mentionType === "string" ? attrs.mentionType : null
    const id = typeof attrs.id === "string" ? attrs.id : null
    if (!id) return null
    if (mentionType === "note" && target.kind === "note" && id === target.id) return "wikilink"
    if (mentionType === "wiki" && target.kind === "wiki" && id === target.id) return "wikilink"
    return null
  }

  return null
}

/**
 * Walk a subtree and collect all link kinds matching `target`.
 * Visits inline atoms (wikilink/noteEmbed/wikiEmbed/referenceLink) anywhere
 * in the subtree.
 */
function findMatchesInSubtree(
  node: Record<string, unknown>,
  target: { kind: "note" | "wiki"; id: string },
  targetTitleLower: string | null,
  out: Set<LinkKind>,
  depth = 0,
) {
  if (depth > 12) return
  if (typeof node !== "object" || node === null) return

  const kind = matchInlineLink(node, target, targetTitleLower)
  if (kind) out.add(kind)

  const content = node.content as Array<Record<string, unknown>> | undefined
  if (Array.isArray(content)) {
    for (const child of content) {
      findMatchesInSubtree(child, target, targetTitleLower, out, depth + 1)
    }
  }
}

/** Trim a snippet to roughly N chars on word boundary. */
function trimSnippet(text: string, maxLen = 140): string {
  const cleaned = text.replace(/\s+/g, " ").trim()
  if (cleaned.length <= maxLen) return cleaned
  const slice = cleaned.slice(0, maxLen)
  // Try to end on a word boundary
  const lastSpace = slice.lastIndexOf(" ")
  if (lastSpace > maxLen * 0.6) return slice.slice(0, lastSpace) + "…"
  return slice + "…"
}

/**
 * Walk a TipTap JSON document and find all references to `target`.
 * Returns one BlockLinkContext per top-level block that references the target
 * (deduplicated by blockId — a block with multiple links yields one entry,
 * with `linkKind` reflecting the first/primary match).
 *
 * If `targetTitle` is provided, unresolved wikilinks (no targetId) are matched
 * by case-insensitive title — useful for red-links.
 */
export function extractBlockLinkContexts(
  contentJson: unknown,
  target: { kind: "note" | "wiki"; id: string; title?: string },
): BlockLinkContext[] {
  if (!contentJson || typeof contentJson !== "object") return []

  const doc = contentJson as Record<string, unknown>
  const topLevel = doc.content as Array<Record<string, unknown>> | undefined
  if (!Array.isArray(topLevel)) return []

  const titleLower = target.title ? target.title.toLowerCase().trim() : null
  const seen = new Set<string>() // blockId dedupe
  const results: BlockLinkContext[] = []

  for (const block of topLevel) {
    if (typeof block !== "object" || block === null) continue
    const blockType = typeof block.type === "string" ? block.type : "unknown"
    const blockId = getNodeId(block)
    if (!blockId) continue // skip blocks without UniqueID
    if (seen.has(blockId)) continue

    const matches = new Set<LinkKind>()
    findMatchesInSubtree(block, target, titleLower, matches)
    if (matches.size === 0) continue

    // Pick a "primary" link kind — wikilink wins, then noteEmbed, then wikiEmbed
    let primary: LinkKind = "wikilink"
    if (matches.has("wikilink")) primary = "wikilink"
    else if (matches.has("noteEmbed")) primary = "noteEmbed"
    else if (matches.has("wikiEmbed")) primary = "wikiEmbed"
    else if (matches.has("referenceLink")) primary = "referenceLink"

    // Build snippet
    const parts: string[] = []
    collectInlineText(block, parts)
    const text = trimSnippet(parts.join(""), 140)

    seen.add(blockId)
    results.push({ blockId, blockType, text, linkKind: primary })
  }

  return results
}

// ─────────────────────────────────────────────────────────────────────
// Mention atom helpers (for Connections panel)
// ─────────────────────────────────────────────────────────────────────

/**
 * Walk a TipTap contentJson tree and check whether any `mention` atom
 * points to `target`. Only `mentionType === "note"` and `"wiki"` are
 * considered; tag/date/reference mentions are ignored.
 */
export function containsMentionTo(
  contentJson: unknown,
  target: { kind: "note" | "wiki"; id: string },
): boolean {
  if (!contentJson || typeof contentJson !== "object") return false

  function walk(node: Record<string, unknown>, depth: number): boolean {
    if (depth > 20) return false
    if (typeof node !== "object" || node === null) return false

    if (node.type === "mention") {
      const attrs = (node.attrs as Record<string, unknown> | undefined) ?? {}
      const mentionType = typeof attrs.mentionType === "string" ? attrs.mentionType : null
      const id = typeof attrs.id === "string" ? attrs.id : null
      if (!id) return false
      if (mentionType === "note" && target.kind === "note" && id === target.id) return true
      if (mentionType === "wiki" && target.kind === "wiki" && id === target.id) return true
      return false
    }

    const content = node.content as Array<Record<string, unknown>> | undefined
    if (Array.isArray(content)) {
      for (const child of content) {
        if (walk(child, depth + 1)) return true
      }
    }
    return false
  }

  return walk(contentJson as Record<string, unknown>, 0)
}

/**
 * Extract all mention atom target ids from a TipTap contentJson tree,
 * grouped by mentionType. Only `"note"` and `"wiki"` mentionTypes collected.
 */
export function extractMentionTargets(contentJson: unknown): {
  noteIds: Set<string>
  wikiIds: Set<string>
} {
  const noteIds = new Set<string>()
  const wikiIds = new Set<string>()

  if (!contentJson || typeof contentJson !== "object") return { noteIds, wikiIds }

  function walk(node: Record<string, unknown>, depth: number): void {
    if (depth > 20) return
    if (typeof node !== "object" || node === null) return

    if (node.type === "mention") {
      const attrs = (node.attrs as Record<string, unknown> | undefined) ?? {}
      const mentionType = typeof attrs.mentionType === "string" ? attrs.mentionType : null
      const id = typeof attrs.id === "string" ? attrs.id : null
      if (id) {
        if (mentionType === "note") noteIds.add(id)
        else if (mentionType === "wiki") wikiIds.add(id)
      }
      return
    }

    const content = node.content as Array<Record<string, unknown>> | undefined
    if (Array.isArray(content)) {
      for (const child of content) walk(child, depth + 1)
    }
  }

  walk(contentJson as Record<string, unknown>, 0)
  return { noteIds, wikiIds }
}
