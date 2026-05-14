import type { WikiBlock } from "@/lib/types"

export interface AnchorItem {
  id: string
  label: string
  type: "inline" | "divider" | "heading"
}

/**
 * Walk a TipTap document JSON and collect all anchor-like nodes:
 * - anchorMark → type "inline"
 * - anchorDivider → type "divider"
 * - heading → type "heading" (H1-H6)
 */
export function extractAnchorsFromContentJson(contentJson: any): AnchorItem[] {
  if (!contentJson?.content) return []

  const items: AnchorItem[] = []

  const walk = (nodes: any[]) => {
    for (const node of nodes) {
      if (node.type === "anchorMark") {
        items.push({
          id: node.attrs?.id || crypto.randomUUID(),
          label: node.attrs?.label || "Bookmark",
          type: "inline",
        })
      } else if (node.type === "anchorDivider") {
        items.push({
          id: node.attrs?.id || crypto.randomUUID(),
          label: node.attrs?.label || "Section",
          type: "divider",
        })
      } else if (node.type === "heading") {
        // Extract text from child text nodes
        const textContent = extractTextFromNode(node)
        if (textContent.trim()) {
          items.push({
            id: node.attrs?.id || crypto.randomUUID(),
            label: textContent.trim(),
            type: "heading",
          })
        }
      }

      if (node.content) walk(node.content)
    }
  }

  walk(contentJson.content)
  return items
}

function extractTextFromNode(node: any): string {
  if (node.type === "text") return node.text || ""
  if (!node.content) return ""
  return node.content.map(extractTextFromNode).join("")
}

/**
 * Extract anchors from a WikiArticle's blocks array.
 *
 * Wiki blocks are structurally different from Note contentJson — articles
 * are assembled from a sequence of typed blocks (section / text / image /
 * table / ...). Anchor sources:
 *   - `section` block → "heading"-typed anchor. block.id as anchor id,
 *     block.title as label. (Sections are the natural headings of a wiki
 *     article — see WikiBlockType.)
 *   - `text` block with contentJson → recurse via
 *     extractAnchorsFromContentJson (anchorMark / anchorDivider / heading
 *     inside the TipTap document).
 *   - Other block types (image / table / url / navbox / banner / nav /
 *     note-ref) — no anchor surface, skipped.
 *
 * PR 4b (entity-side-panel-uniformity) — extends anchor pinning to Wiki
 * articles. Pairs with `extractAnchorsFromContentJson` (notes/templates).
 * GlobalBookmark.targetKind="wiki" is already supported by the data model,
 * so this enables the Wiki Bookmarks surface end-to-end.
 */
export function extractAnchorsFromWikiBlocks(blocks: WikiBlock[] | undefined): AnchorItem[] {
  if (!blocks?.length) return []

  const items: AnchorItem[] = []

  for (const block of blocks) {
    if (block.type === "section") {
      // Section heading — primary outline anchor for wiki articles.
      const title = block.title?.trim()
      if (title) {
        items.push({
          id: block.id,
          label: title,
          type: "heading",
        })
      }
    } else if (block.type === "text" && block.contentJson) {
      // Inline anchors / sub-headings inside a text block's TipTap doc.
      // Reuse the note extractor — same node shapes.
      items.push(...extractAnchorsFromContentJson(block.contentJson))
    }
    // Other block types carry no anchor-able content.
  }

  return items
}

/* ── Outline extraction ─────────────────────────────────── */

export interface OutlineItem {
  id: string                  // node id (data-anchor-id or heading id) for scroll
  label: string
  level: number               // 1~6 (heading level), or 1+indent for TOC entries
  source: "heading" | "toc"
}

export interface OutlineResult {
  source: "toc" | "headings" | "empty"
  items: OutlineItem[]
}

/**
 * Extract document outline with TOC priority:
 * 1. If contentJson contains a tocBlock, use its entries (user-defined structure wins)
 * 2. Otherwise extract H1-H6 headings as auto-generated outline
 * 3. Empty if neither exists
 */
export function extractOutlineFromContentJson(contentJson: any): OutlineResult {
  if (!contentJson?.content) return { source: "empty", items: [] }

  const tocEntries: { label: string; targetId: string; indent: number }[] = []
  const headings: { id: string; label: string; level: number }[] = []

  const walk = (nodes: any[]) => {
    for (const node of nodes) {
      if (node.type === "tocBlock") {
        const entries = node.attrs?.entries
        if (Array.isArray(entries)) {
          for (const e of entries) {
            if (e?.label || e?.targetId) {
              tocEntries.push({
                label: e.label || "Untitled",
                targetId: e.targetId || "",
                indent: typeof e.indent === "number" ? e.indent : 0,
              })
            }
          }
        }
      } else if (node.type === "heading") {
        const text = extractTextFromNode(node).trim()
        if (text) {
          headings.push({
            id: node.attrs?.id || "",
            label: text,
            level: node.attrs?.level || 1,
          })
        }
      }

      if (node.content) walk(node.content)
    }
  }

  walk(contentJson.content)

  // TOC block priority: if user defined a TOC, use it as the outline
  if (tocEntries.length > 0) {
    return {
      source: "toc",
      items: tocEntries.map((e, i) => ({
        id: e.targetId || `toc-${i}`,
        label: e.label,
        level: e.indent + 1,
        source: "toc" as const,
      })),
    }
  }

  // Fallback: auto-extract headings
  if (headings.length > 0) {
    return {
      source: "headings",
      items: headings.map((h, i) => ({
        id: h.id || `heading-${i}`,
        label: h.label,
        level: h.level,
        source: "heading" as const,
      })),
    }
  }

  return { source: "empty", items: [] }
}
